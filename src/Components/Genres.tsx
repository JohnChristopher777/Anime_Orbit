import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getAnimeByGenre, getGenreArtworks } from "../services/anilist";
import AnimeCard from "./AnimeCard";
import SEO from "./SEO";
import Footer from "./Footer";
import { Sparkles, Layers, Filter, RefreshCw, Star, Compass, ArrowLeft, Home } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface GenreCategory {
  name: string;
  representativeTitle: string;
  image: string;
  accent: string;
  tagline: string;
  about: string;
  sequences: string[];
}

const GENRE_CATEGORIES: GenreCategory[] = [
  {
    name: "Action",
    representativeTitle: "Attack on Titan",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6FPmWm59CyP.jpg",
    accent: "#ff4d4d",
    tagline: "High-octane battles & adrenaline rushes",
    about: "Explosive confrontations, high-stakes choreography, and thrilling warrior arcs pushed to superhuman limits.",
    sequences: ["Tournament Arcs", "Power Awakenings", "High-Speed Combat", "Rival Clashes"]
  },
  {
    name: "Adventure",
    representativeTitle: "One Piece",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YCDoj1EkAxFn.jpg",
    accent: "#ffa500",
    tagline: "Epic journeys across uncharted worlds",
    about: "Sprawling expeditions into mysterious lands, island exploration, discovering ancient artifacts, and unyielding voyages.",
    sequences: ["Uncharted Expeditions", "Ancient Ruins", "Crew Gatherings", "World Discovery"]
  },
  {
    name: "Fantasy",
    representativeTitle: "Frieren: Beyond Journey's End",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-n2bQEEmxD4b5.jpg",
    accent: "#00d2d3",
    tagline: "Mythical realms, magic & ancient legends",
    about: "Spellcraft systems, mythical beasts, ancient lore, and journeying through kingdoms of wonder and forgotten history.",
    sequences: ["Spell Invocations", "Dungeon Conquests", "Ancient Lore Revelations", "Magical Duels"]
  },
  {
    name: "Romance",
    representativeTitle: "Kaguya-sama: Love is War",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101921-V46jTzzFcxrT.jpg",
    accent: "#ff6b81",
    tagline: "Heartfelt connections, passion & destiny",
    about: "Intricate relationship dynamics, confessions under fireworks, emotional hurdles, and unforgettable romantic tension.",
    sequences: ["Heartfelt Confessions", "School Festival Arcs", "Misunderstandings & Reconciliations", "Destined Encounters"]
  },
  {
    name: "Sci-Fi",
    representativeTitle: "Steins;Gate",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9253-7pdcVzQSkpKq.png",
    accent: "#54a0ff",
    tagline: "Time travel, cyberpunk & cosmic science",
    about: "Theoretical physics, alternate timelines, dystopian worldlines, cybernetic augmentation, and existential tech dilemmas.",
    sequences: ["Timeline Leaps", "Cybernetic Infiltration", "Lab Experiments", "Dystopian Rebellions"]
  },
  {
    name: "Supernatural",
    representativeTitle: "Jujutsu Kaisen",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg",
    accent: "#a55eea",
    tagline: "Cursed spirits, occult arts & mystics",
    about: "Domain expansions, curse manipulation, spirit banishments, and the hidden occult underbelly of the modern world.",
    sequences: ["Domain Expansions", "Occult Rituals", "Spiritual Exorcisms", "Curse Unleashing"]
  },
  {
    name: "Drama",
    representativeTitle: "Vinland Saga",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101348-uXk0jYQk4jV3.jpg",
    accent: "#e17055",
    tagline: "Deep emotional narratives & profound character arcs",
    about: "Philosophical introspection, historical tragedies, moral struggles, personal redemption, and poignant human journeys.",
    sequences: ["Moral Reckonings", "Tragic Revelations", "Redemption Arcs", "Intense Dialogues"]
  },
  {
    name: "Comedy",
    representativeTitle: "Gintama",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx918-6xX9f6mNn8mF.jpg",
    accent: "#ffd700",
    tagline: "Uncontrollable laughter & satire",
    about: "Fourth-wall breaks, ridiculous situational parodies, chaotic banter, and hilarious character antics.",
    sequences: ["Fourth-Wall Breaks", "Slapstick Parodies", "Absurd Misunderstandings", "Chaotic Schemes"]
  },
  {
    name: "Mystery",
    representativeTitle: "Death Note",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-lawCwhwk8ERM.jpg",
    accent: "#70a1ff",
    tagline: "Mind games, suspense & enigmatic cases",
    about: "High-IQ battles of intellect, deductive detective investigations, unexpected plot twists, and dark mind games.",
    sequences: ["Calculated Mind Games", "Crime Scene Deducing", "Plot Twist Unravelings", "Interrogations"]
  },
  {
    name: "Sports",
    representativeTitle: "Haikyuu!!",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20464-Yp3bW8N9Y9wL.jpg",
    accent: "#2ed573",
    tagline: "Triumph, passion & competitive spirit",
    about: "Hard-fought match points, intense training camp growth, team camaraderie, and the euphoria of championship glory.",
    sequences: ["Match Point Rallies", "Intensive Training Camps", "Team Synergy Plays", "Championship Finals"]
  },
  {
    name: "Horror",
    representativeTitle: "Tokyo Ghoul",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20605-z90sH3eH7W8s.jpg",
    accent: "#ff4757",
    tagline: "Dark terrors & psychological chills",
    about: "Sinister monsters, eerie atmosphere, survival dread, psychological unraveling, and grotesque transformations.",
    sequences: ["Night Stalking", "Eerie Hallways", "Grotesque Awakenings", "Survival Confrontations"]
  },
  {
    name: "Slice of Life",
    representativeTitle: "Bocchi the Rock!",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx130003-5kN1mCq6E9jB.jpg",
    accent: "#feca57",
    tagline: "Heartwarming everyday moments & companionship",
    about: "Cozy friendships, humorous day-to-day triumphs, relatable struggles, and uplifting slice-of-life charm.",
    sequences: ["After-School Hangouts", "Cafe Chats", "Club Activities", "Seasonal Celebrations"]
  },
  {
    name: "Psychological",
    representativeTitle: "Monster",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx19-kH2W9Z2N6oYw.jpg",
    accent: "#576574",
    tagline: "Moral dilemmas & deep cerebral twists",
    about: "Deep psychological exploration, character breakdown, moral ambiguities, existential tension, and manipulation.",
    sequences: ["Psychological Manipulation", "Internal Monologues", "Moral Crises", "Identity Questioning"]
  },
  {
    name: "Music",
    representativeTitle: "Your Lie in April",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20665-2gVv6xK4eW0Q.jpg",
    accent: "#1dd1a1",
    tagline: "Harmonies, melodies & emotional ballads",
    about: "Passionate musical recitals, stage performance breakthroughs, emotional harmonies, and artistic inspiration.",
    sequences: ["Live Stage Concerts", "Instrumental Duets", "Auditorium Climax", "Creative Breakthroughs"]
  },
  {
    name: "Thriller",
    representativeTitle: "Erased",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21234-7yP6P8QzB4mX.jpg",
    accent: "#eb4d4b",
    tagline: "High stakes, breathless twists & suspense",
    about: "Race against the clock, thrilling chases, narrow escapes, conspiracy uncoverings, and heart-pounding tension.",
    sequences: ["Countdown Clocks", "Narrow Escapes", "Conspiracy Reveals", "Pursuit Sequences"]
  },
  {
    name: "Mecha",
    representativeTitle: "Code Geass",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1575-kL6wT9xV8zNm.jpg",
    accent: "#6c5ce7",
    tagline: "Tactical warfare, giant mechs & revolution",
    about: "Giant robot warfare, tactical military genius, high-tech cockpit battles, geopolitical revolutions, and sci-fi combat.",
    sequences: ["Mecha Deployments", "Cockpit HUD Targeting", "Strategic Chess Battles", "Tactical Air Drops"]
  },
  {
    name: "Mahou Shoujo",
    representativeTitle: "Madoka Magica",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9756-c0kE6WzX9yP2.jpg",
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
    // Smooth scroll directly to the catalog results below as requested
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
  const activeDynamicCover = dynamicGenreArtworks[activeGenre]?.image || (animeList[0]?.images?.jpg?.large_image_url) || currentGenreMeta.image;

  return (
    <div className="min-h-screen bg-transparent text-white font-sans flex flex-col">
      <SEO
        title={`${activeGenre} Anime Universe - Top Series & Movies`}
        description={`Explore the highest rated ${activeGenre} anime series, movies, and masterworks. Filter and discover ${activeGenre} anime on Anime Orbit.`}
        keywords={`${activeGenre} anime, top ${activeGenre} anime, anime genres, Anime Orbit`}
        url={`https://animeorbit.web.app/genres?genre=${encodeURIComponent(activeGenre)}`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 w-full flex-1">
        {/* Hero Section Banner with Dynamic Anime Showcase & Lore */}
        <div className="relative rounded-3xl overflow-hidden border border-[#ffd700]/30 shadow-2xl p-6 sm:p-10 mb-10 bg-[#0e0e14]">
          {/* Dynamic Background Backdrop from Top Series */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 filter blur-md scale-110 transition-all duration-700 pointer-events-none"
            style={{
              backgroundImage: `url(${activeDynamicCover})`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0e]/95 via-[#0a0a0e]/85 to-black/50 pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 bg-[#ffd700]/15 border border-[#ffd700]/40 text-[#ffd700] px-3.5 py-1.5 rounded-full text-xs font-montserrat font-bold uppercase tracking-wider">
                <Sparkles size={14} />
                <span>Cosmic Genre Navigator</span>
              </div>
              <span className="text-xs font-montserrat font-bold text-neutral-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                Featured: {currentGenreMeta.representativeTitle}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black font-staatliches uppercase tracking-wider text-white">
              {activeGenre} Universe
            </h1>

            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl font-inter">
              {currentGenreMeta.about}
            </p>

            {/* Known Sequences & Iconic Tropes Badges */}
            <div className="pt-1 space-y-2">
              <span className="text-[11px] font-montserrat font-bold text-[#ffd700] uppercase tracking-wider block">
                Known Sequences & Iconic Tropes:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {currentGenreMeta.sequences.map((seq) => (
                  <span
                    key={seq}
                    className="text-xs font-semibold px-3 py-1 rounded-lg bg-black/60 border border-[#ffd700]/30 text-white font-montserrat shadow-sm backdrop-blur-md"
                  >
                    • {seq}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Genre Selector Carousel / Grid */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-montserrat font-bold text-base sm:text-lg text-white flex items-center gap-2">
              <Layers size={18} className="text-[#ffd700]" />
              <span>Select Genre ({GENRE_CATEGORIES.length})</span>
            </h2>
            <span className="text-xs text-neutral-400">Click a genre to jump to results</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            {GENRE_CATEGORIES.map((cat) => {
              const isSelected = cat.name === activeGenre;
              const dynamicArt = dynamicGenreArtworks[cat.name];
              const cardImage = dynamicArt?.image || (isSelected && animeList.length > 0 && animeList[0]?.images?.jpg?.large_image_url) || cat.image;
              const cardTitle = dynamicArt?.title || (isSelected && animeList.length > 0 && animeList[0]?.title) || cat.representativeTitle;

              return (
                <button
                  key={cat.name}
                  onClick={() => handleSelectGenre(cat.name)}
                  className={`group relative rounded-2xl overflow-hidden text-left border-2 transition-all duration-300 cursor-pointer h-36 flex flex-col justify-end p-3 ${
                    isSelected
                      ? "border-[#ffd700] shadow-[0_0_20px_rgba(255,215,0,0.5)] scale-105"
                      : "border-white/10 hover:border-white/40 hover:scale-[1.02]"
                  }`}
                >
                  {/* Background Artwork */}
                  <img
                    src={cardImage}
                    alt={cardTitle}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

                  {/* Genre Label */}
                  <div className="relative z-10">
                    <span className="text-xs font-bold text-[#ffd700] block truncate">
                      {cat.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 truncate block">
                      {cardTitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Genre Header Bar (Scroll Target) */}
        <div id="genre-results-section" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-8 scroll-mt-24">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-staatliches text-2xl sm:text-3xl text-[#ffd700] tracking-wider">
                {activeGenre} Masterpieces
              </h2>
              <span className="font-montserrat text-xs font-bold text-neutral-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                {animeList.length} Titles Loaded
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {currentGenreMeta.tagline}
            </p>
          </div>

          {/* Sort Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-[#ffd700]" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-[#181822] border border-[#ffd700]/40 text-white font-montserrat font-semibold text-xs px-3 py-2 rounded-xl outline-none cursor-pointer focus:border-[#ffd700]"
            >
              <option value="FAVOURITES_DESC">Most Popular & Acclaimed</option>
              <option value="SCORE_DESC">Top Rated (Highest Score)</option>
              <option value="POPULARITY_DESC">Most Watched (Overall Viewers)</option>
              <option value="START_DATE_DESC">Newest Releases</option>
            </select>
          </div>
        </div>

        {/* Anime Grid */}
        {initialLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-80 bg-neutral-900/60 rounded-xl p-3 border border-white/5"
              >
                <Skeleton
                  height={200}
                  borderRadius={8}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6">
              {animeList.map((anime: any, idx: number) => (
                <AnimeCard key={`genre-${anime.mal_id}-${idx}`} anime={anime} />
              ))}
            </div>

            {/* Locked Manual Button Load (Never auto-reloads on scroll) */}
            {hasNextPage && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] disabled:opacity-50 text-black font-bold px-8 py-3.5 rounded-full text-sm font-montserrat shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                  <span>
                    {loading
                      ? "Fetching Next Batch..."
                      : `Load More (${animeList.length} loaded)`}
                  </span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-[#12121a]/80 rounded-3xl border border-white/10 space-y-4 max-w-md mx-auto">
            <Compass size={48} className="mx-auto text-neutral-600" />
            <h3 className="font-montserrat font-bold text-lg text-white">No Anime Found</h3>
            <p className="text-xs text-neutral-400">
              No anime found for genre "{activeGenre}". Try selecting another genre or return to home.
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
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Genres;
