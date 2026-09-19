import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Layers3, LoaderCircle, Search, Star, Users } from "lucide-react";
import { getFranchiseGroups, getPopularAnime, searchAnime } from "../services/anilist";
import ProgressiveImage from "./ProgressiveImage";
import SEO from "./SEO";
import Footer from "./Footer";

const asFallbackGroups = (items: any[]) => items.map((item) => ({
  ...item,
  franchiseEntries: 1,
  popularity: item.scored_by || item.popularity || 0,
}));

const groupEntries = async (items: any[]) => {
  if (!items.length) return [];
  try {
    const grouped = await getFranchiseGroups(items.map((item) => item.mal_id));
    return grouped.length ? grouped : asFallbackGroups(items);
  } catch {
    return asFallbackGroups(items);
  }
};

export default function FranchiseExplorer() {
  const [groups, setGroups] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<any[] | null>(null);
  const [searching, setSearching] = React.useState(false);

  const loadPage = React.useCallback(async (nextPage: number, append: boolean) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const result = await getPopularAnime(24, nextPage);
      const nextGroups = await groupEntries(result.media || []);
      setGroups((current) => {
        const merged = append ? [...current, ...nextGroups] : nextGroups;
        return [...new Map(merged.map((entry) => [entry.mal_id, entry])).values()];
      });
      setPage(nextPage);
      setHasMore(Boolean(result.pageInfo?.hasNextPage));
    } catch {
      if (!append) setGroups([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  React.useEffect(() => { void loadPage(1, false); }, [loadPage]);

  React.useEffect(() => {
    const query = search.trim();
    if (!query) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const matches = await searchAnime(query, 24);
        const grouped = await groupEntries(matches || []);
        if (active) setSearchResults(grouped);
      } catch {
        if (active) setSearchResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search]);

  const visible = searchResults ?? groups;

  return (
    <div className="min-h-screen bg-transparent text-white">
      <SEO title="Anime Franchise Rankings | Anime Orbit" description="Explore connected anime seasons, movies, OVAs and source manga as complete franchises." keywords="anime franchises, anime watch order, connected anime seasons" url="https://animeorbit.web.app/franchises" />
      <main className="franchise-page">
        <header className="franchise-page__hero">
          <div><span><Layers3 size={15} /> Complete series</span><h1>Franchise rankings</h1><p>See seasons, sequels, movies and side stories as one complete series, with a release-order guide for every entry.</p></div>
          <label className="franchise-page__search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search any anime franchise" />{searching && <LoaderCircle size={15} className="animate-spin" />}</label>
        </header>

        {loading ? <div className="franchise-page__skeleton">{Array.from({ length: 9 }).map((_, index) => <span key={index} />)}</div> : visible.length > 0 ? <>
          <div className="franchise-page__grid">
            {visible.map((group, index) => <Link to={`/franchise/${group.mal_id}`} key={group.mal_id}>
              <ProgressiveImage src={group.images?.jpg?.large_image_url || group.images?.jpg?.image_url} alt="" wrapperClassName="franchise-page__cover" className="h-full w-full object-cover" />
              <span className="franchise-page__rank">#{index + 1}</span>
              <div className="franchise-page__card-shade" />
              <div className="franchise-page__card-copy"><span>{group.franchiseEntries > 1 ? `${group.franchiseEntries} connected releases` : "Franchise guide"}</span><h2>{group.title_english || group.title}</h2><p><span><Star size={12} fill="currentColor" />{group.score || "N/A"}</span><span><Users size={12} />{Number(group.popularity || 0).toLocaleString()}</span></p><strong>View release order <ArrowRight size={14} /></strong></div>
            </Link>)}
          </div>
          {!searchResults && hasMore && <button type="button" className="franchise-page__more" disabled={loadingMore} onClick={() => void loadPage(page + 1, true)}>{loadingMore ? <><LoaderCircle size={16} className="animate-spin" />Loading more…</> : <>Load more franchises <ArrowRight size={16} /></>}</button>}
        </> : <div className="franchise-page__empty"><Layers3 size={34} /><strong>{search ? "No matching franchise found" : "Franchise rankings are temporarily unavailable"}</strong><p>{search ? "Try another title or its English name." : "Please try again shortly."}</p></div>}
      </main>
      <Footer />
    </div>
  );
}
