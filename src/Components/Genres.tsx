import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getAnimeByGenre, getGenreArtworks } from "../services/anilist";
import AnimeCard from "./AnimeCard";
import SEO from "./SEO";
import Footer from "./Footer";
import { Layers, Filter, RefreshCw, Compass } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface GenreCategory {
  id: number;
  name: string;
  representativeTitle: string;
  localPath: string;
  fallbackImage: string;
  accent: string;
  tagline: string;
  about: string;
  sequences: string[];
}

const GENRE_CATEGORIES: GenreCategory[] = [
  {
    id: 1,
    name: "Action",
    representativeTitle: "Attack on Titan",
    localPath: "/genres/1.jpg",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6FPmWm59CyP.jpg",
    accent: "#ff4d4d",
    tagline: "High-octane battles & superhuman combat",
    about: "Explosive confrontations, high-stakes choreography, and thrilling warrior arcs pushed to superhuman limits.",
    sequences: ["Tournament Arcs", "Power Awakenings", "High-Speed Combat", "Rival Clashes"]
  },
  {
    id: 2,
    name: "Adventure",
    representativeTitle: "One Piece",
    localPath: "/genres/2.jpg",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YCDoj1EkAxFn.jpg",
    accent: "#ffa500",
    tagline: "Epic voyages & uncharted world expeditions",
    about: "Sprawling expeditions into mysterious lands, island exploration, discovering ancient artifacts, and unyielding voyages.",
    sequences: ["Uncharted Expeditions", "Ancient Ruins", "Crew Gatherings", "World Discovery"]
  },
  {
    id: 3,
    name: "Fantasy",
    representativeTitle: "Frieren: Beyond Journey's End",
    localPath: "/genres/3.jpg",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-n2bQEEmxD4b5.jpg",
    accent: "#00d2d3",
    tagline: "Mythical realms, magic & ancient spellcraft",
    about: "Spellcraft systems, mythical beasts, ancient lore, and journeying through kingdoms of wonder and forgotten history.",
    sequences: ["Spell Invocations", "Dungeon Conquests", "Ancient Lore Revelations", "Magical Duels"]
  },
  {
    id: 4,
    name: "Romance",
    representativeTitle: "Kaguya-sama: Love is War",
    localPath: "/genres/4.jpg",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101921-V46jTzzFcxrT.jpg",
    accent: "#ff6b81",
    tagline: "Heartfelt connections, passion & destiny",
    about: "Intricate relationship dynamics, confessions under fireworks, emotional hurdles, and unforgettable romantic tension.",
    sequences: ["Heartfelt Confessions", "School Festival Arcs", "Misunderstandings & Reconciliations", "Destined Encounters"]
  },
  {
    id: 5,
    name: "Sci-Fi",
    representativeTitle: "Steins;Gate",
    localPath: "/genres/5.jpg",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9253-7pdcVzQSkpKq.png",
    accent: "#54a0ff",
    tagline: "Time travel, cyberpunk & theoretical physics",
    about: "Theoretical physics, alternate timelines, dystopian worldlines, cybernetic augmentation, and existential tech dilemmas.",
    sequences: ["Timeline Leaps", "Cybernetic Infiltration", "Lab Experiments", "Dystopian Rebellions"]
  },
  {
    id: 6,
    name: "Supernatural",
    representativeTitle: "Jujutsu Kaisen",
    localPath: "/genres/6.jpg",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg",
    accent: "#a55eea",
    tagline: "Cursed spirits, occult arts & mystics",
    about: "Domain expansions, curse manipulation, spirit banishments, and the hidden occult underbelly of the modern world.",
    sequences: ["Domain Expansions", "Occult Rituals", "Spiritual Exorcisms", "Curse Unleashing"]
  },
  {
    id: 7,
    name: "Drama",
    representativeTitle: "Vinland Saga",
    localPath: "/genres/7.jpg",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101348-uXk0jYQk4jV3.jpg",
    accent: "#e17055",
    tagline: "Deep emotional narratives & profound character growth",
    about: "Philosophical introspection, historical tragedies, moral struggles, personal redemption, and poignant human journeys.",
    sequences: ["Moral Reckonings", "Tragic Revelations", "Redemption Arcs", "Intense Dialogues"]
  },
  {
    id: 8,
    name: "Comedy",
    representativeTitle: "Gintama",
    localPath: "/genres/8.jpg",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx918-6xX9f6mNn8mF.jpg",
    accent: "#ffd700",
    tagline: "Uncontrollable laughter, satire & chaos",
    about: "Fourth-wall breaks, ridiculous situational parodies, chaotic banter, and hilarious character antics.",
    sequences: ["Fourth-Wall Breaks", "Slapstick Parodies", "Absurd Misunderstandings", "Chaotic Schemes"]
  },
  {
    id: 9,
    name: "Mystery",
    representativeTitle: "Death Note",
    localPath: "/genres/9.jpg",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-lawCwhwk8ERM.jpg",
    accent: "#70a1ff",
    tagline: "Mind games, suspense & deductive cases",
    about: "High-IQ battles of intellect, deductive detective investigations, unexpected plot twists, and dark mind games.",
    sequences: ["Calculated Mind Games", "Crime Scene Deducing", "Plot Twist Unravelings", "Interrogations"]
  },
  {
    id: 10,
    name: "Sports",
    representativeTitle: "Haikyuu!!",
    localPath: "/genres/10.jpg",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20464-Yp3bW8N9Y9wL.jpg",
    accent: "#2ed573",
    tagline: "Triumph, passion & team camaraderie",
    about: "Hard-fought match points, intense training camp growth, team camaraderie, and the euphoria of championship glory.",
    sequences: ["Match Point Rallies", "Intensive Training Camps", "Team Synergy Plays", "Championship Finals"]
  },
  {
    id: 11,
    name: "Horror",
    representativeTitle: "Tokyo Ghoul",
    localPath: "/genres/11.jpg",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20605-z90sH3eH7W8s.jpg",
    accent: "#ff4757",
    tagline: "Dark terrors & psychological chills",
    about: "Sinister monsters, eerie atmosphere, survival dread, psychological unraveling, and grotesque transformations.",
    sequences: ["Night Stalking", "Eerie Hallways", "Grotesque Awakenings", "Survival Confrontations"]
  },
  {
    id: 12,
    name: "Slice of Life",
    representativeTitle: "Bocchi the Rock!",
    localPath: "/genres/12.jpg",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx130003-5kN1mCq6E9jB.jpg",
    accent: "#feca57",
    tagline: "Heartwarming everyday moments & friendship",
    about: "Cozy friendships, humorous day-to-day triumphs, relatable struggles, and uplifting slice-of-life charm.",
    sequences: ["After-School Hangouts", "Cafe Chats", "Club Activities", "Seasonal Celebrations"]
  },
  {
    id: 13,
    name: "Psychological",
    representativeTitle: "Monster",
    localPath: "/genres/13.jpg",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx19-kH2W9Z2N6oYw.jpg",
    accent: "#576574",
    tagline: "Moral dilemmas & deep cerebral suspense",
    about: "Deep psychological exploration, character breakdown, moral ambiguities, existential tension, and manipulation.",
    sequences: ["Psychological Manipulation", "Internal Monologues", "Moral Crises", "Identity Questioning"]
  },
  {
    id: 14,
    name: "Music",
    representativeTitle: "Your Lie in April",
    localPath: "/genres/14.jpg",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20665-2gVv6xK4eW0Q.jpg",
    accent: "#1dd1a1",
    tagline: "Harmonies, melodies & emotional ballads",
    about: "Passionate musical recitals, stage performance breakthroughs, emotional harmonies, and artistic inspiration.",
    sequences: ["Live Stage Concerts", "Instrumental Duets", "Auditorium Climax", "Creative Breakthroughs"]
  },
  {
    id: 15,
    name: "Thriller",
    representativeTitle: "Erased",
    localPath: "/genres/15.jpg",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21234-7yP6P8QzB4mX.jpg",
    accent: "#eb4d4b",
    tagline: "High stakes, breathless twists & suspense",
    about: "Race against the clock, thrilling chases, narrow escapes, conspiracy uncoverings, and heart-pounding tension.",
    sequences: ["Countdown Clocks", "Narrow Escapes", "Conspiracy Reveals", "Pursuit Sequences"]
  },
  {
    id: 16,
    name: "Mecha",
    representativeTitle: "Code Geass",
    localPath: "/genres/16.jpg",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1575-kL6wT9xV8zNm.jpg",
    accent: "#6c5ce7",
    tagline: "Tactical warfare, giant mechs & revolution",
    about: "Giant robot warfare, tactical military genius, high-tech cockpit battles, geopolitical revolutions, and sci-fi combat.",
    sequences: ["Mecha Deployments", "Cockpit HUD Targeting", "Strategic Chess Battles", "Tactical Air Drops"]
  },
  {
    id: 17,
    name: "Mahou Shoujo",
    representativeTitle: "Madoka Magica",
    localPath: "/genres/17.jpg",
    fallbackImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9756-c0kE6WzX9yP2.jpg",
    accent: "#fd79a8",
    tagline: "Magical heroines, dark contracts & destiny",
    about: "Magical girl transformations, existential contracts, reality-bending witch labyrinths, and destiny defying sacrifice.",
    sequences: ["Magical Transformations", "Witch Labyrinths", "Contract Bargains", "Ultimate Sacrifices"]
  },
];

export const Genres: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeGenre = searchParams.get("genre") || "Action";
  const [sortOption, setSortOption] = useState<string>("FAVOURITES_DESC");

  const [animeList, setAnimeList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Dynamic genre covers fetched from AniList
  const [dynamicGenreArtworks, setDynamicGenreArtworks] = useState<Record<string, { image: string; title: string }>>(() => {
    const saved = localStorage.getItem("anime_orbit_genre_artworks");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });

  useEffect(() => {
    const fetchArtworks = async () => {
      const artMap = (await getGenreArtworks()) as Record<string, { image: string; title: string }>;
      if (artMap && Object.keys(artMap).length > 0) {
        setDynamicGenreArtworks(artMap);
        localStorage.setItem("anime_orbit_genre_artworks", JSON.stringify(artMap));
      }
    };
    fetchArtworks();
  }, []);

  const fetchGenreAnime = useCallback(async (genre: string, targetPage: number, sort: string, append = false) => {
    try {
      if (!append) setInitialLoading(true);
      setLoading(true);
      const res = await getAnimeByGenre(genre, 24, targetPage, sort);
      if (append) {
        setAnimeList((prev) => [...prev, ...res.media]);
      } else {
        setAnimeList(res.media);
      }
      setHasNextPage(res.pageInfo?.hasNextPage || false);
      setPage(targetPage);
    } catch {
      if (!append) setAnimeList([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGenreAnime(activeGenre, 1, sortOption, false);
  }, [activeGenre, sortOption, fetchGenreAnime]);

  const handleSelectGenre = (genre: string) => {
    setSearchParams({ genre, sort: sortOption });
    setTimeout(() => {
      const target = document.getElementById("genre-results-section");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  const handleLoadMore = () => {
    if (!loading && hasNextPage) {
      fetchGenreAnime(activeGenre, page + 1, sortOption, true);
    }
  };

  const currentGenreMeta = GENRE_CATEGORIES.find((g) => g.name === activeGenre) || GENRE_CATEGORIES[0];
  const activeDynamicCover = dynamicGenreArtworks[activeGenre]?.image || (animeList[0]?.images?.jpg?.large_image_url) || currentGenreMeta.fallbackImage;

  return (
    <div className="min-h-screen bg-transparent text-white font-sans flex flex-col">
      <SEO
        title={`${activeGenre} Anime - Top Series & Masterpieces`}
        description={`Explore top rated ${activeGenre} anime series, movies, and flagship titles on Anime Orbit.`}
        keywords={`${activeGenre} anime, top ${activeGenre} anime, anime genres, Anime Orbit`}
        url={`https://animeorbit.web.app/genres?genre=${encodeURIComponent(activeGenre)}`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 w-full flex-1">
        
        {/* Responsive Grid Layout: Left Column = Results, Right Column = Genre Sidebar (Desktop) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* 🌌 Left / Primary Column: Results & Hero Lore */}
          <main className="flex-1 w-full min-w-0 order-2 lg:order-1 space-y-8">
            
            {/* Primary Hero Header */}
            <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl p-6 sm:p-8 bg-[#12121c]/90 backdrop-blur-2xl">
              {/* Dynamic Backdrop */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-sm scale-105 pointer-events-none transition-all duration-700"
                style={{
                  backgroundImage: `url(${activeDynamicCover})`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#12121c] via-[#12121c]/90 to-black/60 pointer-events-none" />

              <div className="relative z-10 space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-extrabold text-[#ffd700] uppercase tracking-wider bg-[#ffd700]/15 px-2.5 py-0.5 rounded-full border border-[#ffd700]/30">
                    Flagship: {currentGenreMeta.representativeTitle}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-semibold hidden sm:inline">
                    {currentGenreMeta.tagline}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold font-montserrat text-white">
                  {activeGenre} Anime
                </h1>

                <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
                  {currentGenreMeta.about}
                </p>

                {/* Known Sequences */}
                <div className="pt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-[#ffd700]">Trope Sequences:</span>
                  {currentGenreMeta.sequences.map((seq) => (
                    <span
                      key={seq}
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-neutral-200"
                    >
                      {seq}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Title Bar & Sorter */}
            <div id="genre-results-section" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10 scroll-mt-24">
              <div>
                <h2 className="font-montserrat font-bold text-xl sm:text-2xl text-white">
                  {activeGenre} Catalog
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Showing top series in the {activeGenre} genre
                </p>
              </div>

              {/* Sort Filter Dropdown */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Filter size={15} className="text-[#ffd700]" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="bg-[#181824] border border-white/20 text-white font-montserrat font-semibold text-xs px-3.5 py-2 rounded-xl outline-none cursor-pointer focus:border-[#ffd700]"
                >
                  <option value="FAVOURITES_DESC">Most Popular</option>
                  <option value="SCORE_DESC">Highest Rated</option>
                  <option value="POPULARITY_DESC">Most Watched</option>
                  <option value="START_DATE_DESC">Newest Releases</option>
                </select>
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
                  {animeList.map((anime: any, idx: number) => (
                    <AnimeCard key={`genre-${anime.mal_id}-${idx}`} anime={anime} />
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
                          : `Load More (${animeList.length} loaded)`}
                      </span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-[#12121c]/80 rounded-3xl border border-white/10 space-y-4 max-w-md mx-auto">
                <Compass size={48} className="mx-auto text-neutral-600" />
                <h3 className="font-montserrat font-bold text-lg text-white">No Anime Found</h3>
                <p className="text-xs text-neutral-400">
                  No anime found for genre "{activeGenre}". Try selecting another genre from the sidebar.
                </p>
              </div>
            )}
          </main>

          {/* 🧭 Right Column: Square Genre Selector (Transparent BG, Titles Outside Div, No Cutout) */}
          <aside className="w-full lg:w-80 flex-shrink-0 order-1 lg:order-2 lg:sticky lg:top-24 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <h2 className="font-montserrat font-black text-base sm:text-lg text-white flex items-center gap-2">
                <Layers size={18} className="text-[#ffd700]" />
                <span>Genres</span>
              </h2>
              <span className="text-[10px] font-bold text-neutral-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                {GENRE_CATEGORIES.length} Categories
              </span>
            </div>

            {/* 2-Column Square Cards on Desktop / Horizontal Scroll on Mobile */}
            <div className="grid grid-flow-col auto-cols-[115px] sm:auto-cols-[130px] lg:grid-flow-row lg:grid-cols-2 gap-3 overflow-x-auto lg:overflow-y-auto max-h-[75vh] pb-3 lg:pb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {GENRE_CATEGORIES.map((cat) => {
                const isSelected = cat.name === activeGenre;
                const activeImg = dynamicGenreArtworks[cat.name]?.image || cat.localPath;

                return (
                  <button
                    key={cat.name}
                    onClick={() => handleSelectGenre(cat.name)}
                    className="text-left group cursor-pointer transition-all duration-300 flex flex-col focus:outline-none"
                  >
                    {/* Square Image Thumbnail Container */}
                    <div
                      className={`relative aspect-square w-full rounded-2xl overflow-hidden border transition-all duration-300 ${
                        isSelected
                          ? "border-[#ffd700] ring-2 ring-[#ffd700]/70 shadow-[0_0_18px_rgba(255,215,0,0.4)] scale-[1.03]"
                          : "border-white/15 hover:border-white/40 group-hover:scale-[1.02]"
                      }`}
                    >
                      <img
                        src={activeImg}
                        alt={cat.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = cat.fallbackImage;
                        }}
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#ffd700] ring-2 ring-black shadow-md" />
                      )}
                    </div>

                    {/* Title & Series Name (Outside of Image Div) */}
                    <div className="mt-1.5 px-0.5 min-w-0">
                      <span
                        className={`font-montserrat font-bold text-xs sm:text-sm truncate block transition-colors ${
                          isSelected ? "text-[#ffd700]" : "text-white group-hover:text-neutral-200"
                        }`}
                      >
                        {cat.name}
                      </span>
                      <p className="text-[10px] text-neutral-400 font-medium truncate mt-0.5">
                        {cat.representativeTitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Genres;
