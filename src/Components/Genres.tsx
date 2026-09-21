import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getAnimeByGenre, getAnimeListByIds, getMangaByGenre } from "../services/anilist";
import AnimeCard from "./AnimeCard";
import SEO from "./SEO";
import Footer from "./Footer";
import { Layers, Filter, RefreshCw, Compass, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, BookOpen } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import ProgressiveImage from "./ProgressiveImage";
import AppDropdown from "./AppDropdown";

interface GenreCategory {
  id: number;
  mediaId: number;
  name: string;
  representativeTitle: string;
  fallbackImage: string;
  accent: string;
  tagline: string;
  about: string;
  sequences: string[];
}

const GENRE_CATEGORIES: GenreCategory[] = [
  {
    id: 1,
    mediaId: 16498,
    name: "Action",
    representativeTitle: "Attack on Titan",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6FPmWm59CyP.jpg",
    accent: "#ff4d4d",
    tagline: "Big fights, rivalries, training arcs, and power-ups",
    about: "Explosive confrontations, high-stakes choreography, and thrilling warrior arcs pushed to superhuman limits.",
    sequences: ["Tournament Arcs", "Power Awakenings", "High-Speed Combat", "Rival Clashes"]
  },
  {
    id: 2,
    mediaId: 21,
    name: "Adventure",
    representativeTitle: "One Piece",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YCDoj1EkAxFn.jpg",
    accent: "#ffa500",
    tagline: "Epic journeys, loyal crews, and worlds worth exploring",
    about: "Sprawling expeditions into mysterious lands, island exploration, discovering ancient artifacts, and unyielding voyages.",
    sequences: ["Uncharted Expeditions", "Ancient Ruins", "Crew Gatherings", "World Discovery"]
  },
  {
    id: 3,
    mediaId: 154587,
    name: "Fantasy",
    representativeTitle: "Frieren: Beyond Journey's End",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-n2bQEEmxD4b5.jpg",
    accent: "#00d2d3",
    tagline: "Magic, monsters, kingdoms, and unforgettable adventures",
    about: "Spellcraft systems, mythical beasts, ancient lore, and journeying through kingdoms of wonder and forgotten history.",
    sequences: ["Spell Invocations", "Dungeon Conquests", "Ancient Lore Revelations", "Magical Duels"]
  },
  {
    id: 4,
    mediaId: 101921,
    name: "Romance",
    representativeTitle: "Kaguya-sama: Love is War",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101921-V46jTzzFcxrT.jpg",
    accent: "#ff6b81",
    tagline: "Slow burns, confessions, comedy, and heartfelt relationships",
    about: "Intricate relationship dynamics, confessions under fireworks, emotional hurdles, and unforgettable romantic tension.",
    sequences: ["Heartfelt Confessions", "School Festival Arcs", "Misunderstandings & Reconciliations", "Destined Encounters"]
  },
  {
    id: 5,
    mediaId: 9253,
    name: "Sci-Fi",
    representativeTitle: "Steins;Gate",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9253-7pdcVzQSkpKq.png",
    accent: "#54a0ff",
    tagline: "Future tech, space travel, robots, and time loops",
    about: "Theoretical physics, alternate timelines, dystopian worldlines, cybernetic augmentation, and existential tech dilemmas.",
    sequences: ["Timeline Leaps", "Cybernetic Infiltration", "Lab Experiments", "Dystopian Rebellions"]
  },
  {
    id: 6,
    mediaId: 113415,
    name: "Supernatural",
    representativeTitle: "Jujutsu Kaisen",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg",
    accent: "#a55eea",
    tagline: "Curses, spirits, demons, and powers beyond the ordinary",
    about: "Domain expansions, curse manipulation, spirit banishments, and the hidden occult underbelly of the modern world.",
    sequences: ["Domain Expansions", "Occult Rituals", "Spiritual Exorcisms", "Curse Unleashing"]
  },
  {
    id: 7,
    mediaId: 101348,
    name: "Drama",
    representativeTitle: "Vinland Saga",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101348-uXk0jYQk4jV3.jpg",
    accent: "#e17055",
    tagline: "Emotional stories, hard choices, and real character growth",
    about: "Philosophical introspection, historical tragedies, moral struggles, personal redemption, and poignant human journeys.",
    sequences: ["Moral Reckonings", "Tragic Revelations", "Redemption Arcs", "Intense Dialogues"]
  },
  {
    id: 8,
    mediaId: 918,
    name: "Comedy",
    representativeTitle: "Gintama",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx918-6xX9f6mNn8mF.jpg",
    accent: "#ffd700",
    tagline: "Chaotic jokes, great timing, and lovable oddballs",
    about: "Fourth-wall breaks, ridiculous situational parodies, chaotic banter, and hilarious character antics.",
    sequences: ["Fourth-Wall Breaks", "Slapstick Parodies", "Absurd Misunderstandings", "Chaotic Schemes"]
  },
  {
    id: 9,
    mediaId: 1535,
    name: "Mystery",
    representativeTitle: "Death Note",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-lawCwhwk8ERM.jpg",
    accent: "#70a1ff",
    tagline: "Clues, mind games, hidden motives, and clever twists",
    about: "High-IQ battles of intellect, deductive detective investigations, unexpected plot twists, and dark mind games.",
    sequences: ["Calculated Mind Games", "Crime Scene Deducing", "Plot Twist Unravelings", "Interrogations"]
  },
  {
    id: 10,
    mediaId: 20464,
    name: "Sports",
    representativeTitle: "Haikyuu!!",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20464-Yp3bW8N9Y9wL.jpg",
    accent: "#2ed573",
    tagline: "Rival teams, training, clutch plays, and tournament hype",
    about: "Hard-fought match points, intense training camp growth, team camaraderie, and the euphoria of championship glory.",
    sequences: ["Match Point Rallies", "Intensive Training Camps", "Team Synergy Plays", "Championship Finals"]
  },
  {
    id: 11,
    mediaId: 20605,
    name: "Horror",
    representativeTitle: "Tokyo Ghoul",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20605-z90sH3eH7W8s.jpg",
    accent: "#ff4757",
    tagline: "Monsters, survival, dread, and stories that stay with you",
    about: "Sinister monsters, eerie atmosphere, survival dread, psychological unraveling, and grotesque transformations.",
    sequences: ["Night Stalking", "Eerie Hallways", "Grotesque Awakenings", "Survival Confrontations"]
  },
  {
    id: 12,
    mediaId: 130003,
    name: "Slice of Life",
    representativeTitle: "Bocchi the Rock!",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx130003-5kN1mCq6E9jB.jpg",
    accent: "#feca57",
    tagline: "Cozy days, friendship, school life, and small wins",
    about: "Cozy friendships, humorous day-to-day triumphs, relatable struggles, and uplifting slice-of-life charm.",
    sequences: ["After-School Hangouts", "Cafe Chats", "Club Activities", "Seasonal Celebrations"]
  },
  {
    id: 13,
    mediaId: 19,
    name: "Psychological",
    representativeTitle: "Monster",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx19-kH2W9Z2N6oYw.jpg",
    accent: "#576574",
    tagline: "Mind games, moral choices, unreliable memories, and tension",
    about: "Deep psychological exploration, character breakdown, moral ambiguities, existential tension, and manipulation.",
    sequences: ["Psychological Manipulation", "Internal Monologues", "Moral Crises", "Identity Questioning"]
  },
  {
    id: 14,
    mediaId: 20665,
    name: "Music",
    representativeTitle: "Your Lie in April",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20665-2gVv6xK4eW0Q.jpg",
    accent: "#1dd1a1",
    tagline: "Bands, performances, rivalry, and songs with real feeling",
    about: "Passionate musical recitals, stage performance breakthroughs, emotional harmonies, and artistic inspiration.",
    sequences: ["Live Stage Concerts", "Instrumental Duets", "Auditorium Climax", "Creative Breakthroughs"]
  },
  {
    id: 15,
    mediaId: 21234,
    name: "Thriller",
    representativeTitle: "Erased",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21234-7yP6P8QzB4mX.jpg",
    accent: "#eb4d4b",
    tagline: "Close calls, conspiracies, chases, and sharp plot twists",
    about: "Race against the clock, thrilling chases, narrow escapes, conspiracy uncoverings, and heart-pounding tension.",
    sequences: ["Countdown Clocks", "Narrow Escapes", "Conspiracy Reveals", "Pursuit Sequences"]
  },
  {
    id: 16,
    mediaId: 1575,
    name: "Mecha",
    representativeTitle: "Code Geass",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1575-kL6wT9xV8zNm.jpg",
    accent: "#6c5ce7",
    tagline: "Giant robots, smart battles, war, and rebellion",
    about: "Giant robot warfare, tactical military genius, high-tech cockpit battles, geopolitical revolutions, and sci-fi combat.",
    sequences: ["Mecha Deployments", "Cockpit HUD Targeting", "Strategic Chess Battles", "Tactical Air Drops"]
  },
  {
    id: 17,
    mediaId: 9756,
    name: "Mahou Shoujo",
    representativeTitle: "Madoka Magica",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9756-c0kE6WzX9yP2.jpg",
    accent: "#fd79a8",
    tagline: "Magical girls, transformations, friendship, and dark bargains",
    about: "Magical girl transformations, existential contracts, reality-bending witch labyrinths, and destiny defying sacrifice.",
    sequences: ["Magical Transformations", "Witch Labyrinths", "Contract Bargains", "Ultimate Sacrifices"]
  },
];

export const Genres: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeGenre = searchParams.get("genre") || "Action";
  const activeMedia = searchParams.get("media") === "manga" ? "manga" : "anime";
  const [sortOption, setSortOption] = useState<string>("FAVOURITES_DESC");

  const [animeList, setAnimeList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [exactGenreCovers, setExactGenreCovers] = useState<Record<number, string>>({});
  const [genreHeroImages, setGenreHeroImages] = useState<Record<string, string>>({});
  const [genreCoversReady, setGenreCoversReady] = useState(false);
  const [genreScrollProgress, setGenreScrollProgress] = useState(0);
  const requestVersion = useRef(0);
  const genreRailRef = useRef<HTMLDivElement>(null);

  const fetchGenreTitles = useCallback(async (genre: string, targetPage: number, sort: string, append = false, media: "anime" | "manga" = activeMedia) => {
    const version = ++requestVersion.current;
    try {
      if (!append) setInitialLoading(true);
      setLoading(true);
      const res = media === "manga"
        ? await getMangaByGenre(genre, 24, targetPage, sort)
        : await getAnimeByGenre(genre, 24, targetPage, sort);
      if (version !== requestVersion.current) return;
      if (!append) {
        const hero = res.media?.find((item: any) => item?.banner_image)?.banner_image
          || res.media?.find((item: any) => item?.images?.jpg?.large_image_url)?.images?.jpg?.large_image_url;
        if (hero) setGenreHeroImages((current) => ({ ...current, [genre]: hero }));
      }
      if (append) {
        setAnimeList((prev) => [...prev, ...res.media]);
      } else {
        setAnimeList(res.media);
      }
      setHasNextPage(res.pageInfo?.hasNextPage || false);
      setPage(targetPage);
    } catch {
      if (version === requestVersion.current && !append) setAnimeList([]);
    } finally {
      if (version === requestVersion.current) {
        setLoading(false);
        setInitialLoading(false);
      }
    }
  }, [activeMedia]);

  useEffect(() => {
    setAnimeList([]);
    fetchGenreTitles(activeGenre, 1, sortOption, false, activeMedia);
  }, [activeGenre, activeMedia, sortOption, fetchGenreTitles]);

  useEffect(() => {
    let active = true;
    getAnimeListByIds(GENRE_CATEGORIES.map((genre) => genre.mediaId))
      .then((titles: any[]) => {
        if (!active) return;
        const covers: Record<number, string> = {};
        titles.forEach((title) => {
          const cover = title?.images?.jpg?.large_image_url || title?.images?.jpg?.image_url;
          if (cover) covers[Number(title.mal_id)] = cover;
        });
        setExactGenreCovers(covers);
      })
      .finally(() => { if (active) setGenreCoversReady(true); });
    return () => { active = false; };
  }, []);

  const handleSelectGenre = (genre: string) => {
    if (genre === activeGenre) return;
    setAnimeList([]);
    setInitialLoading(true);
    setSearchParams({ genre, sort: sortOption, media: activeMedia });
    setTimeout(() => {
      const target = document.getElementById("genre-results-section");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  const handleLoadMore = () => {
    if (!loading && hasNextPage) {
      fetchGenreTitles(activeGenre, page + 1, sortOption, true, activeMedia);
    }
  };

  const moveGenreRail = (direction: -1 | 1) => {
    const rail = genreRailRef.current;
    if (!rail) return;
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    rail.scrollBy(desktop
      ? { top: direction * Math.min(rail.clientHeight * 0.72, 420), behavior: "smooth" }
      : { left: direction * Math.min(rail.clientWidth * 0.82, 720), behavior: "smooth" });
  };

  const currentGenreMeta = GENRE_CATEGORIES.find((g) => g.name === activeGenre) || GENRE_CATEGORIES[0];
  const activeHeroImage = genreHeroImages[activeGenre];
  const featuredTitle = activeMedia === "manga"
    ? animeList[0]?.title_english || animeList[0]?.title || `${activeGenre} manga`
    : currentGenreMeta.representativeTitle;

  return (
    <div className="min-h-screen bg-transparent text-white font-sans flex flex-col">
      <SEO
        title={`${activeGenre} ${activeMedia === "manga" ? "Manga" : "Anime"} - Popular Titles`}
        description={`Browse top-rated ${activeGenre} ${activeMedia} on Anime Orbit.`}
        keywords={`${activeGenre} ${activeMedia}, top ${activeGenre} ${activeMedia}, ${activeMedia} genres, Anime Orbit`}
        url={`https://animeorbit.web.app/genres?genre=${encodeURIComponent(activeGenre)}&media=${activeMedia}`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-16 w-full flex-1">
        
        {/* Responsive Grid Layout: Left Column = Results, Right Column = Genre Sidebar (Desktop) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* 🌌 Left / Primary Column: Results & Hero Lore */}
          <main className="flex-1 w-full min-w-0 order-2 lg:order-1 space-y-8">
            
            <div className="genre-hero relative rounded-2xl overflow-hidden border border-white/10 p-6 sm:p-8 bg-[#17171c] flex items-end">
              {activeHeroImage ? (
                <ProgressiveImage
                  key={`${activeGenre}-${activeHeroImage}`}
                  src={activeHeroImage}
                  alt=""
                  aria-hidden="true"
                  loading="eager"
                  fetchPriority="high"
                  wrapperClassName="genre-hero-media"
                  className="w-full h-full object-cover"
                />
              ) : <span className="genre-hero-placeholder image-skeleton" aria-hidden="true" />}
              <div className="absolute inset-0 bg-gradient-to-r from-[#111116] via-[#111116]/90 to-black/25 pointer-events-none" />

              <div className="relative z-10">
                <span className="text-xs font-bold text-[#ffd700]">Fan favorite: {featuredTitle}</span>

                <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold font-montserrat text-white">
                  {activeGenre} {activeMedia === "manga" ? "Manga" : "Anime"}
                </h1>

                <p className="mt-2 text-sm text-neutral-300 max-w-xl leading-relaxed">
                  {currentGenreMeta.tagline}
                </p>
              </div>
            </div>

            {/* Results Title Bar & Sorter */}
            <div id="genre-results-section" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10 scroll-mt-24">
              <div>
                <h2 className="font-montserrat font-bold text-xl sm:text-2xl text-white">
                  Best {activeGenre} {activeMedia === "manga" ? "Manga" : "Anime"}
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Popular {activeMedia === "manga" ? "series picked by manga readers" : "series and movies picked by anime fans"}
                </p>
              </div>

              {/* Sort Filter Dropdown */}
              <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                <div className="genre-media-switch" aria-label="Choose media type">
                  <button type="button" aria-pressed={activeMedia === "anime"} className={activeMedia === "anime" ? "is-active" : ""} onClick={() => setSearchParams({ genre: activeGenre, sort: sortOption, media: "anime" })}>Anime</button>
                  <button type="button" aria-pressed={activeMedia === "manga"} className={activeMedia === "manga" ? "is-active" : ""} onClick={() => setSearchParams({ genre: activeGenre, sort: sortOption, media: "manga" })}>Manga</button>
                </div>
                <Filter size={15} className="text-[#ffd700]" />
                <AppDropdown ariaLabel="Sort genre results" className="w-44" value={sortOption} onChange={setSortOption} options={[{ value: "FAVOURITES_DESC", label: "Most Popular" }, { value: "SCORE_DESC", label: "Highest Rated" }, { value: "POPULARITY_DESC", label: "Most Watched" }, { value: "START_DATE_DESC", label: "Newest Releases" }]} />
              </div>
            </div>

            {/* Anime Grid */}
            {initialLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-80 bg-neutral-900/60 rounded-2xl p-3 border border-white/5"
                  >
                    <Skeleton
                      height={200}
                      borderRadius={12}
                      baseColor="#262626"
                      highlightColor="#3a3a3a"
                    />
                    <Skeleton
                      width="80%"
                      height={18}
                      baseColor="#262626"
                      highlightColor="#3a3a3a"
                      className="mt-3"
                    />
                  </div>
                ))}
              </div>
            ) : animeList.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
                  {animeList.map((item: any, idx: number) => (
                    <AnimeCard key={`genre-${activeMedia}-${item.mal_id}-${idx}`} anime={item} mediaType={activeMedia} />
                  ))}
                </div>

                {hasNextPage && (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] disabled:opacity-50 text-black font-bold px-8 py-3 rounded-full text-sm font-montserrat shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                      <span>
                        {loading
                          ? "Fetching More..."
                          : `Load More ${activeMedia === "manga" ? "Manga" : "Anime"} (${animeList.length} loaded)`}
                      </span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-[#12121c]/80 rounded-3xl border border-white/10 space-y-4 max-w-md mx-auto">
                {activeMedia === "manga" ? <BookOpen size={48} className="mx-auto text-neutral-600" /> : <Compass size={48} className="mx-auto text-neutral-600" />}
                <h3 className="font-montserrat font-bold text-lg text-white">No {activeMedia === "manga" ? "Manga" : "Anime"} Found</h3>
                <p className="text-xs text-neutral-400">
                  No {activeMedia} found for genre "{activeGenre}". Try another genre above.
                </p>
              </div>
            )}
          </main>

          {/* 🧭 Right Column: Square Genre Selector (Transparent BG, Titles Outside Div, No Cutout) */}
          <aside className="relative w-full min-w-0 lg:w-72 lg:flex-shrink-0 order-1 lg:order-2 lg:sticky lg:top-24 rounded-2xl border border-white/10 bg-[#17171b] p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
              <h2 className="min-w-0 font-montserrat font-bold text-sm sm:text-base text-white flex items-center gap-2 whitespace-nowrap">
                <Layers size={18} className="text-[#ffd700]" />
                <span>Browse genres</span>
              </h2>
              <div className="flex flex-shrink-0 items-center gap-1.5">
                <span className="text-[11px] font-bold text-neutral-500" title={`${GENRE_CATEGORIES.length} genres`}>{GENRE_CATEGORIES.length}</span>
                <button type="button" onClick={() => moveGenreRail(-1)} aria-label="Previous genres" className="genre-rail-button">
                  <ArrowLeft size={15} className="lg:hidden" /><ArrowUp size={15} className="hidden lg:block" />
                </button>
                <button type="button" onClick={() => moveGenreRail(1)} aria-label="More genres" className="genre-rail-button">
                  <ArrowRight size={15} className="lg:hidden" /><ArrowDown size={15} className="hidden lg:block" />
                </button>
              </div>
            </div>

            {/* 2-Column Square Cards on Desktop / Horizontal Scroll on Mobile */}
            <div ref={genreRailRef} onScroll={(event) => { const rail = event.currentTarget; const desktop = window.matchMedia("(min-width: 1024px)").matches; const max = desktop ? rail.scrollHeight - rail.clientHeight : rail.scrollWidth - rail.clientWidth; const current = desktop ? rail.scrollTop : rail.scrollLeft; setGenreScrollProgress(max > 0 ? current / max : 0); }} className="genre-category-rail flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto lg:max-h-[66vh] pt-3 pb-2 scroll-smooth">
              {GENRE_CATEGORIES.map((cat) => {
                const isSelected = cat.name === activeGenre;
                const categoryCover = exactGenreCovers[cat.mediaId];
                return (
                  <button
                    key={cat.name}
                    onClick={() => handleSelectGenre(cat.name)}
                    className={`relative flex w-[190px] min-w-[190px] lg:w-full lg:min-w-0 flex-shrink-0 items-center gap-3 rounded-xl p-2 text-left border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700] ${
                      isSelected ? "bg-[#25251e] text-white border-[#ffd700]" : "bg-white/[0.03] text-white border-transparent hover:bg-white/[0.08]"
                    }`}
                  >
                    {categoryCover ? (
                      <ProgressiveImage key={`${cat.mediaId}-${categoryCover}`} src={categoryCover} fallbackSrc="/lost.jpg" alt={cat.representativeTitle} wrapperClassName="w-14 h-11 rounded-lg flex-shrink-0" className="w-full h-full object-cover" />
                    ) : genreCoversReady ? (
                      <ProgressiveImage src="/lost.jpg" alt="Artwork unavailable" wrapperClassName="w-14 h-11 rounded-lg flex-shrink-0" className="w-full h-full object-contain bg-white" />
                    ) : (
                      <span className="w-14 h-11 rounded-lg flex-shrink-0 grid place-items-center font-montserrat font-black text-base" style={{ color: cat.accent, backgroundColor: `${cat.accent}18` }}>
                        <span className="image-skeleton h-full w-full rounded-lg" aria-hidden="true" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <span className="font-montserrat font-bold text-sm whitespace-nowrap block">{cat.name}</span>
                      <span className={`block text-[11px] truncate mt-0.5 ${isSelected ? "text-[#ffd700]" : "text-neutral-500"}`}>{cat.representativeTitle}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="genre-scroll-indicator" style={{ "--genre-progress": Math.max(.12, genreScrollProgress) } as React.CSSProperties} aria-hidden="true"><span /><small>Browse more <ArrowRight size={12} /></small></div>
          </aside>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Genres;
