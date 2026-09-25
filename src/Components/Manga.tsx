import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getPopularManga, searchManga } from "../services/anilist";
import SEO from "./SEO";
import Footer from "./Footer";
import { BookOpen, Star, RefreshCw, Filter, ArrowLeft, Home, Search, X } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import AppDropdown from "./AppDropdown";
import ProgressiveImage from "./ProgressiveImage";

export const Manga: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortParam = searchParams.get("sort") || "POPULARITY_DESC";
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const requestVersion = useRef(0);

  const fetchManga = useCallback(async (targetPage: number, sort: string, append = false, query = "") => {
    const version = ++requestVersion.current;
    try {
      if (!append) setInitialLoading(true);
      setLoading(true);
      const res = query
        ? { media: await searchManga(query, 48), pageInfo: { hasNextPage: false } }
        : await getPopularManga(targetPage, 24, sort);
      if (version !== requestVersion.current) return;
      if (append) {
        setMangaList((prev) => [...prev, ...res.media]);
      } else {
        setMangaList(res.media);
      }
      setHasNextPage(res.pageInfo?.hasNextPage || false);
    } catch {
    } finally {
      if (version === requestVersion.current) {
        setLoading(false);
        setInitialLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setActiveSearch(searchQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
    fetchManga(1, sortParam, false, activeSearch);
  }, [sortParam, activeSearch, fetchManga]);

  const handleLoadMore = () => {
    if (!loading && hasNextPage && !activeSearch) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchManga(nextPage, sortParam, true);
    }
  };

  const handleSortChange = (value: string) => setSearchParams({ sort: value });

  return (
    <div className="manga-catalog-page min-h-screen bg-[#07070b] text-white flex flex-col font-inter">
      <SEO
        title="Manga Universe - Popular Series, Origins & Story Genesis | Anime Orbit"
        description="Explore top-rated manga masterpieces, original source stories, light novels, and character genesis across all genres on Anime Orbit."
        keywords="manga database, popular manga, manga story genesis, manga origins, read manga info, Anime Orbit"
        url="https://animeorbit.web.app/manga"
      />

      <main className="manga-catalog-shell max-w-7xl mx-auto px-3 sm:px-8 pt-4 sm:pt-8 pb-16 flex-1 w-full space-y-5 sm:space-y-8">
        {/* Header Title & Filter Bar */}
        <header className="manga-catalog-header">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#ffd700] uppercase tracking-wider font-montserrat">
              <BookOpen size={15} />
              <span>Explore Manga</span>
            </div>
            <h1>
              Manga Library
            </h1>
            <p>
              Browse manga, manhwa, manhua, light novels, and one-shots with publication details and chapter tracking.
            </p>
          </div>

          <div className="flex w-full sm:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="relative block min-w-0 sm:w-72">
              <span className="sr-only">Search manga</span>
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search any manga..." className="w-full rounded-xl border border-white/15 bg-[#17171d] py-2.5 pl-10 pr-9 text-sm text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-[#ffd700]" />
              {searchQuery && <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear manga search" className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-neutral-400 hover:bg-white/10 hover:text-white"><X size={14} /></button>}
            </label>
            <div className="flex items-center gap-2 text-xs">
              <Filter size={14} className="text-[#ffd700]" />
              <AppDropdown ariaLabel="Sort manga" className="w-52" value={sortParam} onChange={handleSortChange} options={[{ value: "POPULARITY_DESC", label: "Most Popular" }, { value: "SCORE_DESC", label: "Top Rated" }, { value: "START_DATE_DESC", label: "Newest Releases" }, { value: "FAVOURITES_DESC", label: "Most Favorited" }]} />
            </div>
          </div>
        </header>

        {/* Manga Card Grid */}
        {initialLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton height={260} baseColor="#14141c" highlightColor="#222230" borderRadius={16} />
                <Skeleton height={18} width="80%" baseColor="#14141c" highlightColor="#222230" />
                <Skeleton height={14} width="40%" baseColor="#14141c" highlightColor="#222230" />
              </div>
            ))}
          </div>
        ) : mangaList.length === 0 ? (
          <div className="text-center py-24 bg-[#12121a]/80 rounded-3xl border border-white/10 space-y-4 max-w-md mx-auto">
            <BookOpen size={48} className="mx-auto text-neutral-600" />
            <h3 className="font-montserrat font-bold text-lg text-white">No Manga Found</h3>
            <p className="text-xs text-neutral-400">
              Try adjusting your filter or return to discovery.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-montserrat font-bold text-xs px-4 py-2 rounded-full transition-all cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Go Back</span>
              </button>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 bg-[#ffd700] text-black font-montserrat font-bold text-xs px-5 py-2 rounded-full transition-all hover:scale-105 shadow-md"
              >
                <Home size={13} />
                <span>Return Home</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="manga-catalog-results-header">
              <div><span>{activeSearch ? "Search results" : "Manga shelf"}</span><h2>{activeSearch ? `Matches for “${activeSearch}”` : "Popular reads"}</h2></div>
              <strong aria-live="polite">{mangaList.length} titles loaded</strong>
            </div>
            <div className="manga-catalog-grid">
              {mangaList.map((item) => {
                const img = item.images?.jpg?.large_image_url || item.images?.jpg?.image_url;
                const title = item.title_english || item.title;

                return (
                  <Link
                    key={`manga-${item.mal_id}`}
                    to={`/manga/${item.mal_id}`}
                    className="manga-catalog-card group"
                    aria-label={`Open ${title}${item.format ? `, ${item.format}` : ""}${item.score ? `, score ${item.score} out of 10` : ""}`}
                  >
                    {/* Cover Artwork */}
                    <div className="manga-catalog-card__cover">
                      {img ? (
                        <ProgressiveImage src={img} alt={title} wrapperClassName="absolute inset-0" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-600">
                          <BookOpen size={32} />
                        </div>
                      )}

                      {/* Score Badge */}
                      {item.score && item.score !== "N/A" && (
                        <div className="manga-catalog-card__score">
                          <Star size={11} fill="#ffd700" />
                          <span>{item.score}</span>
                        </div>
                      )}

                      {/* Format Badge */}
                      <span className="manga-catalog-card__format">
                        {item.format || "Manga"}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="manga-catalog-card__body">
                      <h3>
                        {title}
                      </h3>
                      <div>
                        <span className="truncate">{item.status || "Manga"}</span>
                        {item.year && <span>{item.year}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Manual Locked Load More */}
            {hasNextPage && !activeSearch && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] disabled:opacity-50 text-black font-montserrat font-bold text-xs sm:text-sm px-8 py-3.5 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                  <span>{loading ? "Loading More Manga..." : `Load More Manga (${mangaList.length} loaded)`}</span>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Manga;
