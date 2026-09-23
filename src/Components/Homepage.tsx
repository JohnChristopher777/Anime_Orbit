import React, { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import {
  Binoculars,
  BookOpen,
  ListTodo,
  Layers3,
  ArrowRight,
  Heart,
  User,
  MessageCircle,
  MessageSquare,
  Info,
  Mic2,
  Quote,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useGlobalContext } from "../context/global";
import HeroCarousel from "./HeroCarousel";
import SEO from "./SEO";
import AnimeRow from "./AnimeRow";
import ProgressiveImage from "./ProgressiveImage";
import CatalogGenreFilter from "./CatalogGenreFilter";
import { getPopularVoiceActors } from "../services/anilist";

import Footer from "./Footer";

const Popular = lazy(() => import("./Popular"));
const SeasonPolls = lazy(() => import("./SeasonPolls"));
const FranchiseRankings = lazy(() => import("./FranchiseRankings"));

const HOME_QUOTE_FALLBACKS = [
  { line: "If you don't take risks, you can't create a future.", character: "Monkey D. Luffy", anime: "One Piece" },
  { line: "Set your heart ablaze.", character: "Kyojuro Rengoku", anime: "Demon Slayer" },
  { line: "Whatever happens, happens.", character: "Spike Spiegel", anime: "Cowboy Bebop" },
];

type HomeQuote = { line: string; character: string; anime: string };
type VoiceConnection = {
  actor: { id: number; name: string; image?: string };
  first: { characterId: number; character: string; animeId: number; anime: string };
  second: { characterId: number; character: string; animeId: number; anime: string };
};

const DiscoverySpotlight: React.FC = () => {
  const [quote, setQuote] = React.useState<HomeQuote>(HOME_QUOTE_FALLBACKS[0]);
  const [voiceFact, setVoiceFact] = React.useState<VoiceConnection | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    const [quoteResult, castResult] = await Promise.allSettled([
      fetch("/api/anime-quotes").then((response) => response.json()),
      getPopularVoiceActors(12, "Japanese"),
    ]);

    const remoteQuote = quoteResult.status === "fulfilled" ? quoteResult.value?.quote : null;
    setQuote(remoteQuote?.line && remoteQuote?.character && remoteQuote?.anime
      ? { line: remoteQuote.line, character: remoteQuote.character, anime: remoteQuote.anime }
      : HOME_QUOTE_FALLBACKS[Math.floor(Math.random() * HOME_QUOTE_FALLBACKS.length)]);

    if (castResult.status === "fulfilled") {
      const connections = castResult.value.flatMap((actor: any) => {
        const roles = [...new Map((actor.characterMedia?.edges || []).flatMap((edge: any) =>
          (edge.characters || []).map((character: any) => [character.id, {
            characterId: character.id,
            character: character.name?.full,
            animeId: edge.node?.id,
            anime: edge.node?.title?.english || edge.node?.title?.romaji,
          }]),
        ).filter(([id]: any) => id)).values()] as any[];
        if (roles.length < 2) return [];
        return [{
          actor: { id: actor.id, name: actor.name?.full, image: actor.image?.large || actor.image?.medium },
          first: roles[0],
          second: roles.find((role) => role.animeId !== roles[0].animeId) || roles[1],
        }];
      });
      if (connections.length) setVoiceFact(connections[Math.floor(Math.random() * connections.length)]);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => { void refresh(); }, [refresh]);

  return (
    <section className="home-discovery-pulse" aria-labelledby="home-discovery-title">
      <header>
        <div>
          <span><Sparkles size={15} /> Discovery pulse</span>
          <h2 id="home-discovery-title">A new trail into anime</h2>
          <p>Follow a quote, connect familiar voices, or open the complete discovery workspace.</p>
        </div>
        <div className="home-discovery-pulse__actions">
          <button type="button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} className={loading ? "animate-spin" : ""} />New facts</button>
          <Link to="/discovery">Explore Discovery <ArrowRight size={16} /></Link>
        </div>
      </header>

      <div className="home-discovery-pulse__grid">
        <article className="home-discovery-quote">
          <Quote size={25} />
          <div>
            <span>Random quote</span>
            <blockquote>“{quote.line}”</blockquote>
            <p>{quote.character} <small>in {quote.anime}</small></p>
          </div>
          <Link to="/discovery?tool=dialogue" aria-label="Open quote search"><ArrowRight size={18} /></Link>
        </article>

        <article className="home-discovery-voice">
          {voiceFact?.actor.image ? <ProgressiveImage src={voiceFact.actor.image} alt={voiceFact.actor.name} wrapperClassName="home-discovery-voice__portrait" className="h-full w-full object-cover" /> : <div className="home-discovery-voice__portrait"><Mic2 size={28} /></div>}
          <div>
            <span><Mic2 size={14} /> Did you know?</span>
            {voiceFact ? <p>The same Japanese voice actor, <Link to={`/voice-actor/${voiceFact.actor.id}`}>{voiceFact.actor.name}</Link>, voiced <Link to={`/character/${voiceFact.first.characterId}`}>{voiceFact.first.character}</Link> in <Link to={`/anime/${voiceFact.first.animeId}`}>{voiceFact.first.anime}</Link> and <Link to={`/character/${voiceFact.second.characterId}`}>{voiceFact.second.character}</Link> in <Link to={`/anime/${voiceFact.second.animeId}`}>{voiceFact.second.anime}</Link>.</p> : <p>Explore Japanese voice actors and discover the characters they connect across different anime.</p>}
          </div>
          <Link to="/discovery?tool=voices" aria-label="Open voice cast explorer"><ArrowRight size={18} /></Link>
        </article>
      </div>
    </section>
  );
};

const FEATURE_LINKS = [
  {
    to: "/discovery",
    icon: Binoculars,
    eyebrow: "Anime Finder",
    title: "Find an anime",
    copy: "Search with a screenshot, scene description, quote, mood, or titles you already enjoy.",
    details: ["Screenshot search", "Scene search", "Quote search"],
    action: "Open Anime Finder",
    artworkIndex: 1,
    layout: "spotlight",
  },
  {
    to: "/watchlist",
    icon: ListTodo,
    eyebrow: "Watchlist",
    title: "Track anime and manga",
    copy: "Update episode or chapter progress, choose a status, and keep dates and notes with each title.",
    details: ["Episode progress", "Reading progress", "Notes & dates"],
    action: "View Watchlist",
    artworkIndex: 3,
    layout: "reverse",
  },
  {
    to: "/manga",
    icon: BookOpen,
    eyebrow: "Manga",
    title: "Browse manga",
    copy: "Search the manga catalogue, check publication details, and add titles to your reading list.",
    details: ["Manga search", "Publication status", "Chapter totals"],
    action: "Browse Manga",
    artworkIndex: 5,
    layout: "banner",
  },
  {
    to: "/genres",
    icon: Layers3,
    eyebrow: "Genres",
    title: "Browse by genre",
    copy: "Open Action, Romance, Fantasy, Slice of Life, Mystery, and other familiar categories.",
    details: ["17 genres", "Popular titles", "Sort and filter"],
    action: "Browse Genres",
    artworkIndex: 7,
    layout: "split",
  },
  {
    to: "/favourites",
    icon: Heart,
    eyebrow: "Favorites",
    title: "Favorites and tier lists",
    copy: "Save favorite anime and manga, then rank your anime in a personal tier list.",
    details: ["Anime favorites", "Manga favorites", "Tier list"],
    action: "View Favorites",
    artworkIndex: 2,
    layout: "reverse",
  },
  {
    to: "/profile",
    icon: User,
    eyebrow: "Profile",
    title: "Your anime stats",
    copy: "See episodes watched, estimated watch time, top genres, list activity, and your anime fingerprint.",
    details: ["Watch time", "Top genres", "Anime fingerprint"],
    action: "View Profile",
    artworkIndex: 4,
    layout: "banner",
  },
  {
    to: "/my-reviews",
    icon: MessageCircle,
    eyebrow: "Reviews",
    title: "Your ratings and reviews",
    copy: "Read or revisit the scores and reviews you have posted for anime.",
    details: ["Ratings", "Written reviews", "Review history"],
    action: "View Reviews",
    artworkIndex: 6,
    layout: "split",
  },
  {
    to: "/my-comments",
    icon: MessageSquare,
    eyebrow: "Discussions",
    title: "Your anime discussions",
    copy: "Return to comment threads, replies, and conversations you joined.",
    details: ["Comments", "Replies", "Spoiler controls"],
    action: "View Discussions",
    artworkIndex: 8,
    layout: "reverse",
  },
  {
    to: "/about",
    icon: Info,
    eyebrow: "Anime Orbit",
    title: "About this project",
    copy: "Learn what Anime Orbit includes, how recommendations work, and how account data is handled.",
    details: ["Features", "Data & privacy", "Project details"],
    action: "About Anime Orbit",
    artworkIndex: 0,
    layout: "banner",
  },
];

const FeaturePreview = ({ feature }: { feature: string }) => {
  if (feature === "discovery")
    return (
      <div className="feature-demo feature-demo--finder">
        <span>Describe a scene…</span>
        <div>
          <i />
          <b>3 close matches</b>
        </div>
        <div>
          <i />
          <b>92% match</b>
        </div>
      </div>
    );
  if (feature === "watchlist")
    return (
      <div className="feature-demo feature-demo--tracker">
        <header>
          <b>Watching</b>
          <span>12 titles</span>
        </header>
        <div>
          <i style={{ width: "76%" }} />
          <b>18 / 24 episodes</b>
        </div>
        <div>
          <i style={{ width: "42%" }} />
          <b>5 / 12 episodes</b>
        </div>
        <div>
          <i style={{ width: "90%" }} />
          <b>Caught up</b>
        </div>
      </div>
    );
  if (feature === "manga")
    return (
      <div className="feature-demo feature-demo--manga">
        <div>
          <span>CH. 108</span>
        </div>
        <div>
          <span>CH. 109</span>
        </div>
        <aside>
          <b>Continue reading</b>
          <small>Page 16 of 32</small>
        </aside>
      </div>
    );
  if (feature === "genres")
    return (
      <div className="feature-demo feature-demo--genres">
        <span>Action</span>
        <span>Romance</span>
        <span>Fantasy</span>
        <span>Slice of Life</span>
        <span>Mystery</span>
        <b>Pick your mood</b>
      </div>
    );
  if (feature === "favourites")
    return (
      <div className="feature-demo feature-demo--tiers">
        <div>
          <b>S</b>
          <i />
          <i />
          <i />
        </div>
        <div>
          <b>A</b>
          <i />
          <i />
        </div>
        <div>
          <b>B</b>
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
    );
  if (feature === "profile")
    return (
      <div className="feature-demo feature-demo--profile">
        <svg viewBox="0 0 100 100">
          <polygon points="50,8 90,38 75,86 25,86 10,38" />
          <polygon points="50,20 80,41 69,74 31,71 22,41" />
        </svg>
        <div>
          <b>246h</b>
          <span>watch time</span>
          <b>612</b>
          <span>episodes</span>
        </div>
      </div>
    );
  if (feature === "my-reviews")
    return (
      <div className="feature-demo feature-demo--reviews">
        <strong>9.0</strong>
        <div>
          <b>Worth the journey</b>
          <p>Great character growth and a finale that lands.</p>
          <span>Helpful · 42</span>
        </div>
      </div>
    );
  if (feature === "my-comments")
    return (
      <div className="feature-demo feature-demo--chat">
        <div>
          <i />
          That final scene changed everything.
        </div>
        <div>
          <i />
          Exactly — the callback was perfect.
        </div>
        <span>Reply to the discussion…</span>
      </div>
    );
  return (
    <div className="feature-demo feature-demo--about">
      <b>DISCOVER</b>
      <i />
      <b>TRACK</b>
      <i />
      <b>READ</b>
      <i />
      <b>DISCUSS</b>
    </div>
  );
};

export function Homepage() {
  const {
    search,
    popularAnime,
    searchResults,
    loading,
    topAiringAnime,
    upcomingAnime,
    airingAnime,
    getPopularAnime,
    getAiringAnime,
    getTopAiringAnime,
    getUpcomingAnime,
  } = useGlobalContext();
  const [homeLoading, setHomeLoading] = React.useState(true);
  const [homeGenre, setHomeGenre] = React.useState("ALL");
  const requestedHomeData = React.useRef(false);

  React.useEffect(() => {
    if (requestedHomeData.current) return;
    requestedHomeData.current = true;

    const requests: Promise<void>[] = [];
    if (!popularAnime.length) requests.push(getPopularAnime(1));
    if (!airingAnime.length) requests.push(getAiringAnime(1));
    if (!topAiringAnime.length) requests.push(getTopAiringAnime());
    if (!upcomingAnime.length) requests.push(getUpcomingAnime(1));

    Promise.allSettled(requests).finally(() => setHomeLoading(false));
  }, [
    popularAnime.length,
    airingAnime.length,
    topAiringAnime.length,
    upcomingAnime.length,
    getPopularAnime,
    getAiringAnime,
    getTopAiringAnime,
    getUpcomingAnime,
  ]);

  const switchComponent = () => {
    const safeSearchResults = Array.isArray(searchResults) ? searchResults : [];
    const safePopularAnime = Array.isArray(popularAnime) ? popularAnime : [];

    if (search) {
      if (loading) {
        return <AnimeRow title="Search results" items={[]} to="/" loading />;
      }
      if (safeSearchResults.length > 0) {
        return <Popular rendered="search" popularAnime={safeSearchResults} />;
      } else {
        return (
          <div className="text-center py-24 bg-neutral-900/40 max-w-2xl mx-auto rounded-2xl border border-white/5 my-8 space-y-2">
            <h3 className="font-montserrat font-bold text-lg text-white">
              No Anime Found
            </h3>
            <p className="text-neutral-400 text-sm">
              We couldn't find any results matching "{search}". Try searching
              with a different keyword or title!
            </p>
          </div>
        );
      }
    }

    return (
      <div className="home-catalog">
        <div className="home-catalog__filter">
          <div>
            <strong>
                Choose your genre
            </strong>
          </div>
          <CatalogGenreFilter
            items={[
              ...safePopularAnime,
              ...(Array.isArray(airingAnime) ? airingAnime : []),
              ...(Array.isArray(upcomingAnime) ? upcomingAnime : []),
            ]}
            value={homeGenre}
            onChange={setHomeGenre}
          />
        </div>
        <AnimeRow
          title="Most Popular"
          items={safePopularAnime}
          to="/popular"
          loading={homeLoading}
          genre={homeGenre}
          showGenreFilter={false}
        />
        <AnimeRow
          title="New Episodes"
          items={Array.isArray(airingAnime) ? airingAnime : []}
          to="/airing"
          loading={homeLoading}
          genre={homeGenre}
          showGenreFilter={false}
        />
        <AnimeRow
          title="Coming Soon"
          items={Array.isArray(upcomingAnime) ? upcomingAnime : []}
          to="/upcoming"
          loading={homeLoading}
          genre={homeGenre}
          showGenreFilter={false}
        />
        <SeasonPolls />
        <FranchiseRankings anime={safePopularAnime} />
        <DiscoverySpotlight />
        <div
          className="home-feature-stories"
          aria-labelledby="feature-guide-title"
        >
          <header className="home-feature-stories__intro">
            <h2 id="feature-guide-title">Anime site guide</h2>
            <p>
              Discovery, tracking, manga, genres, reviews, and community—all in
              one place.
            </p>
          </header>
          {FEATURE_LINKS.map(
            ({
              to,
              icon: Icon,
              eyebrow,
              title,
              copy,
              action,
              artworkIndex,
              layout,
            }) => {
              const artworkAnime = [...topAiringAnime, ...safePopularAnime][
                artworkIndex
              ];
              const artwork =
                artworkAnime?.banner_image ||
                artworkAnime?.images?.jpg?.large_image_url;
              const feature = to.slice(1);
              return (
                <section
                  key={to}
                  data-feature={feature}
                  className={`home-feature-story home-feature-story--${layout}`}
                >
                  <div className="home-feature-story__art" aria-hidden="true">
                    {artwork && (
                      <ProgressiveImage
                        src={artwork}
                        alt=""
                        wrapperClassName="home-feature-story__background"
                        className="h-full w-full object-cover"
                      />
                    )}
                    <FeaturePreview feature={feature} />
                  </div>
                  <div className="home-feature-story__copy">
                    <span className="home-feature-story__eyebrow">
                      <Icon size={16} /> {eyebrow}
                    </span>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                    <Link to={to}>
                      {action}
                      <ArrowRight size={17} />
                    </Link>
                  </div>
                </section>
              );
            },
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent text-white font-sans flex flex-col relative">
      <SEO
        title="Anime Orbit - Your Cosmic Anime Compass & Universal Guide"
        description="Lost in the vast anime universe? Anime Orbit is your cosmic compass guiding you through all genres: Action, Fantasy, Romance, Sci-Fi, and timeless masterpieces like One Piece, Bleach, Naruto, and Vinland Saga."
        keywords="Anime Orbit, anime database, anime compass, all genres anime, One Piece, Bleach, Naruto, Vinland Saga, Attack on Titan, Jujutsu Kaisen"
        url="https://animeorbit.web.app/"
      />
      {!search && (
        <HeroCarousel trendingAnime={topAiringAnime} loading={homeLoading} />
      )}

      <main className={`flex-1 ${search ? "mt-24 px-4" : ""}`}>
        <Suspense
          fallback={
            <div className="page-skeleton" aria-label="Loading page">
              <span />
              <span />
              <span />
            </div>
          }
        >
          {switchComponent()}
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

export default Homepage;
