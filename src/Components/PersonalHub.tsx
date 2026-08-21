import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGlobalContext } from "../context/global";
import { useFavourites } from "../context/FavouritesContext";
import { useAuth } from "../context/AuthContext";
import { getPopularManga, getUpcomingAnime as fetchUpcomingDirect } from "../services/anilist";
import {
  Flame,
  Calendar,
  BookOpen,
  Compass,
  Layers,
  Bookmark,
  Sparkles,
  ArrowRight,
  Star,
  Zap,
  Smile,
  Brain,
  Ghost,
  Heart,
  TrendingUp,
  Award,
  Clock,
  Sparkle,
} from "lucide-react";

// Curated 17 Multiverse Genres with local paths and graceful fallbacks
const GENRE_CARDS = [
  {
    id: 1,
    name: "Action",
    representativeTitle: "Attack on Titan",
    localPath: "/genres/1.jpg",
    fallbackUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6FPmWm59CyP.jpg",
    accent: "#ff4d4d",
    tag: "Power Awakenings",
    lore: "Explosive combat & titan clashes",
  },
  {
    id: 2,
    name: "Adventure",
    representativeTitle: "One Piece",
    localPath: "/genres/2.jpg",
    fallbackUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YCDoj1EkAxFn.jpg",
    accent: "#ffa500",
    tag: "Grand Odyssey",
    lore: "Voyages across uncharted horizons",
  },
  {
    id: 3,
    name: "Fantasy",
    representativeTitle: "Frieren: Beyond Journey's End",
    localPath: "/genres/3.jpg",
    fallbackUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-n2bQEEmxD4b5.jpg",
    accent: "#00d2d3",
    tag: "Mythic Realms",
    lore: "Ancient magic, spellcraft & legends",
  },
  {
    id: 4,
    name: "Romance",
    representativeTitle: "Kaguya-sama: Love is War",
    localPath: "/genres/4.jpg",
    fallbackUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101921-V46jTzzFcxrT.jpg",
    accent: "#ff6b81",
    tag: "Confession Climax",
    lore: "Heartfelt tension & destined encounters",
  },
  {
    id: 5,
    name: "Sci-Fi",
    representativeTitle: "Steins;Gate",
    localPath: "/genres/5.jpg",
    fallbackUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9253-7pdcVzQSkpKq.png",
    accent: "#54a0ff",
    tag: "Timeline Leaps",
    lore: "Divergence worldlines & quantum paradoxes",
  },
  {
    id: 6,
    name: "Supernatural",
    representativeTitle: "Jujutsu Kaisen",
    localPath: "/genres/6.jpg",
    fallbackUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg",
    accent: "#a55eea",
    tag: "Domain Expansion",
    lore: "Cursed energy & occult exorcisms",
  },
  {
    id: 7,
    name: "Drama",
    representativeTitle: "Vinland Saga",
    localPath: "/genres/7.jpg",
    fallbackUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101348-uXk0jYQk4jV3.jpg",
    accent: "#e17055",
    tag: "Moral Reckonings",
    lore: "Tragedy, warrior trials & redemption",
  },
  {
    id: 8,
    name: "Comedy",
    representativeTitle: "Gintama",
    localPath: "/genres/8.jpg",
    fallbackUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx918-6xX9f6mNn8mF.jpg",
    accent: "#ffd700",
    tag: "Fourth-Wall Breaks",
    lore: "Uncontrollable parody & comedic chaos",
  },
  {
    id: 9,
    name: "Mystery",
    representativeTitle: "Death Note",
    localPath: "/genres/9.jpg",
    fallbackUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-lawCwhwk8ERM.jpg",
    accent: "#70a1ff",
    tag: "Mind Games",
    lore: "High-IQ battles & detective puzzles",
  },
  {
    id: 10,
    name: "Sports",
    representativeTitle: "Haikyuu!!",
    localPath: "/genres/10.jpg",
    fallbackUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20464-Yp3bW8N9Y9wL.jpg",
    accent: "#2ed573",
    tag: "Match Point Hype",
    lore: "Intense rallies, teamwork & glory",
  },
  {
    id: 11,
    name: "Horror",
    representativeTitle: "Tokyo Ghoul",
    localPath: "/genres/11.jpg",
    fallbackUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20605-z90sH3eH7W8s.jpg",
    accent: "#ff4757",
    tag: "Survival Dread",
    lore: "Psychological chills & dark terrors",
  },
  {
    id: 12,
    name: "Slice of Life",
    representativeTitle: "Bocchi the Rock!",
    localPath: "/genres/12.jpg",
    fallbackUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx130003-5A50A1C4e7c7.jpg",
    accent: "#1dd1a1",
    tag: "Cozy Nostalgia",
    lore: "Quiet comfort & heartwarming moments",
  },
];

const MOOD_FILTERS = [
  { id: 1, label: "Pure Adrenaline", genre: "Action", icon: Zap, color: "text-red-400 border-red-500/40 bg-red-500/10 hover:bg-red-500/25" },
  { id: 2, label: "Need a Laugh", genre: "Comedy", icon: Smile, color: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10 hover:bg-yellow-500/25" },
  { id: 3, label: "Mind Bending", genre: "Sci-Fi", icon: Brain, color: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/25" },
  { id: 4, label: "Ready to Cry", genre: "Drama", icon: Heart, color: "text-pink-400 border-pink-500/40 bg-pink-500/10 hover:bg-pink-500/25" },
  { id: 5, label: "Chills & Thrills", genre: "Mystery", icon: Ghost, color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/25" },
  { id: 6, label: "Romantic Escapism", genre: "Romance", icon: Sparkles, color: "text-purple-400 border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/25" },
];

export const PersonalHub: React.FC = () => {
  const { trendingAnime, upcomingAnime } = useGlobalContext();
  const { favourites } = useFavourites();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [sampleManga, setSampleManga] = useState<any[]>([]);
  const [localUpcoming, setLocalUpcoming] = useState<any[]>([]);

  // Fetch sample manga
  useEffect(() => {
    let isMounted = true;
    const fetchMangaSamples = async () => {
      try {
        const res = await getPopularManga(1, 6, "POPULARITY_DESC");
        if (isMounted && res?.media && res.media.length > 0) {
          setSampleManga(res.media);
        }
      } catch {
        // Handled
      }
    };
    fetchMangaSamples();
    return () => {
      isMounted = false;
    };
  }, []);

  // Guarantee upcoming anime cards are always populated
  useEffect(() => {
    let isMounted = true;
    if (!upcomingAnime || upcomingAnime.length === 0) {
      fetchUpcomingDirect(6, 1).then((res) => {
        if (isMounted && res?.media) {
          setLocalUpcoming(res.media);
        }
      }).catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [upcomingAnime]);

  const activeUpcoming = (upcomingAnime && upcomingAnime.length > 0) ? upcomingAnime : localUpcoming;

  // Saved user watchlists and tierlist counts from localStorage
  const savedWatchlist = React.useMemo(() => {
    try {
      const raw = localStorage.getItem("anime_orbit_watchlist");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const savedTierlist = React.useMemo(() => {
    try {
      const raw = localStorage.getItem("anime_orbit_tierlist");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const totalTierRanked = React.useMemo(() => {
    return Array.isArray(savedTierlist)
      ? savedTierlist.reduce((acc: number, tier: any) => acc + (tier.animeIds?.length || 0), 0)
      : 0;
  }, [savedTierlist]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-12 space-y-16">

      {/* 🎭 1. Mood-Based Dynamic Selector Header Banner */}
      <div className="bg-[#12121c]/90 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/40 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
              <Sparkles size={20} />
            </span>
            <div>
              <h3 className="font-montserrat font-black text-xl sm:text-2xl text-white">
                How are you feeling today?
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400">
                Choose an emotion to immediately jump into hand-picked anime series
              </p>
            </div>
          </div>
          <Link
            to="/discovery"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#ffd700] hover:text-white bg-[#ffd700]/10 hover:bg-[#ffd700]/25 px-4 py-2 rounded-full border border-[#ffd700]/40 transition-all self-start sm:self-auto"
          >
            <Brain size={14} />
            <span>Open Neural Discovery</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {MOOD_FILTERS.map((mood) => {
            const Icon = mood.icon;
            return (
              <button
                key={mood.label}
                onClick={() => navigate(`/genres?genre=${encodeURIComponent(mood.genre)}`)}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs sm:text-sm font-bold font-montserrat transition-all cursor-pointer ${mood.color} hover:scale-105 shadow-md`}
              >
                <Icon size={18} />
                <span>{mood.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🔥 2. Trending Airing Broadcasts Section */}
      <section className="bg-[#12121c]/90 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/20 border border-orange-500/50 text-orange-400">
              <Flame size={22} />
            </div>
            <div>
              <h3 className="font-montserrat font-black text-2xl text-white">
                Trending Airing Broadcasts
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400">
                The most watched and talked-about episodes this week
              </p>
            </div>
          </div>
          <Link
            to="/trending"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/15 hover:bg-orange-500 border border-orange-500/40 text-orange-400 hover:text-black font-montserrat font-bold text-xs sm:text-sm transition-all group shadow-md"
          >
            <span>Explore All Trending</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {(trendingAnime || []).slice(0, 6).map((anime: any) => {
            const img = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || anime.image || "";
            const displayTitle = anime.title || anime.title_english || "Anime";
            return (
              <Link
                key={anime.mal_id}
                to={`/anime/${anime.mal_id}`}
                className="group relative bg-[#181824]/95 border border-white/10 hover:border-orange-400/80 rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_10px_25px_rgba(251,146,60,0.3)] transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
                  <img
                    src={img}
                    alt={displayTitle}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {anime.score && (
                    <div className="absolute top-2.5 left-2.5 bg-black/85 backdrop-blur-md border border-[#ffd700]/70 text-[#ffd700] text-xs font-black px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-lg">
                      <Star size={12} fill="#ffd700" color="#ffd700" />
                      <span>{anime.score}</span>
                    </div>
                  )}
                  <div className="absolute bottom-2.5 right-2.5 bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow uppercase">
                    HOT
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="font-montserrat font-bold text-xs text-white line-clamp-2 leading-snug group-hover:text-orange-400 transition-colors">
                    {displayTitle}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2.5 pt-2 border-t border-white/5 font-medium">
                    <span>{anime.type || "TV"}</span>
                    <span>{anime.episodes ? `${anime.episodes} EPS` : "AIRING"}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ⏳ 3. Seasonal Upcoming Spotlights Section */}
      <section className="bg-[#12121c]/90 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-pink-500/20 border border-pink-500/50 text-pink-400">
              <Calendar size={22} />
            </div>
            <div>
              <h3 className="font-montserrat font-black text-2xl text-white">
                Upcoming Seasonal Spotlights
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400">
                Anticipated upcoming premieres, sequels, and new releases
              </p>
            </div>
          </div>
          <Link
            to="/upcoming"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/15 hover:bg-pink-500 border border-pink-500/40 text-pink-400 hover:text-black font-montserrat font-bold text-xs sm:text-sm transition-all group shadow-md"
          >
            <span>View Full Lineup</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {activeUpcoming.slice(0, 6).map((anime: any) => {
            const img = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || anime.image || "";
            const displayTitle = anime.title || anime.title_english || "Anime";
            return (
              <Link
                key={anime.mal_id}
                to={`/anime/${anime.mal_id}`}
                className="group relative bg-[#181824]/95 border border-white/10 hover:border-pink-400/80 rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_10px_25px_rgba(244,114,182,0.3)] transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
                  <img
                    src={img}
                    alt={displayTitle}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-pink-950/90 border border-pink-500/60 text-pink-300 text-[10px] font-black px-2 py-0.5 rounded-md shadow">
                    Upcoming
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="font-montserrat font-bold text-xs text-white line-clamp-2 leading-snug group-hover:text-pink-400 transition-colors">
                    {displayTitle}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2.5 pt-2 border-t border-white/5 font-medium">
                    <span>{anime.source || "Manga"}</span>
                    <span>{anime.season || "Coming Soon"}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 📖 4. Manga & Original Story Genesis Showcase */}
      <section className="bg-[#12121c]/90 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-400">
              <BookOpen size={22} />
            </div>
            <div>
              <h3 className="font-montserrat font-black text-2xl text-white">
                Manga & Story Genesis Vault
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400">
                Original source materials, author lore, and chapter archives
              </p>
            </div>
          </div>
          <Link
            to="/manga"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/15 hover:bg-cyan-500 border border-cyan-500/40 text-cyan-400 hover:text-black font-montserrat font-bold text-xs sm:text-sm transition-all group shadow-md"
          >
            <span>Open Manga Vault</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {sampleManga.slice(0, 6).map((manga: any) => {
            const img = manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url || manga.image || "";
            const displayTitle = manga.title || manga.title_english || "Manga";
            return (
              <Link
                key={manga.mal_id}
                to={`/manga/${manga.mal_id}`}
                className="group relative bg-[#181824]/95 border border-white/10 hover:border-cyan-400/80 rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_10px_25px_rgba(6,182,212,0.3)] transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
                  <img
                    src={img}
                    alt={displayTitle}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {manga.score && manga.score !== "N/A" && (
                    <div className="absolute top-2.5 left-2.5 bg-black/85 backdrop-blur-md border border-cyan-400/70 text-cyan-300 text-xs font-black px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-lg">
                      <Star size={12} fill="#22d3ee" color="#22d3ee" />
                      <span>{manga.score}</span>
                    </div>
                  )}
                  <div className="absolute bottom-2.5 right-2.5 bg-cyan-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow uppercase">
                    MANGA
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="font-montserrat font-bold text-xs text-white line-clamp-2 leading-snug group-hover:text-cyan-400 transition-colors">
                    {displayTitle}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2.5 pt-2 border-t border-white/5 font-medium">
                    <span>{manga.format || "MANGA"}</span>
                    <span>{manga.chapters ? `${manga.chapters} CH` : "ONGOING"}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 🌌 5. 17 Multiverse Genres & Sequence Lore Visual Cards */}
      <section className="bg-[#12121c]/90 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 border border-purple-500/50 text-purple-400">
              <Compass size={22} />
            </div>
            <div>
              <h3 className="font-montserrat font-black text-2xl text-white">
                Multiverse Genres & Sequence Lore
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400">
                Explore anime categories with iconic sequence tropes
              </p>
            </div>
          </div>
          <Link
            to="/genres"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/15 hover:bg-purple-500 border border-purple-500/40 text-purple-400 hover:text-black font-montserrat font-bold text-xs sm:text-sm transition-all group shadow-md"
          >
            <span>Explore All 17 Genres</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {GENRE_CARDS.map((cat) => (
            <Link
              key={cat.name}
              to={`/genres?genre=${encodeURIComponent(cat.name)}`}
              className="group relative h-48 sm:h-56 rounded-2xl overflow-hidden border border-white/15 hover:border-[#ffd700] shadow-xl hover:shadow-[0_10px_25px_rgba(255,215,0,0.25)] transition-all duration-300 hover:-translate-y-2 flex flex-col justify-end p-3.5 bg-gradient-to-t from-black via-black/80 to-[#1e1e2c]"
            >
              {/* Background Artwork with multi-tier fallback (local -> CDN -> CSS gradient) */}
              <img
                src={cat.localPath}
                alt={cat.name}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  if (e.currentTarget.src !== cat.fallbackUrl) {
                    e.currentTarget.src = cat.fallbackUrl;
                  } else {
                    e.currentTarget.style.display = "none";
                  }
                }}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

              {/* Glowing Accent Badge */}
              <div className="relative z-10 space-y-1">
                <span
                  style={{ color: cat.accent, borderColor: cat.accent }}
                  className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md border"
                >
                  {cat.tag}
                </span>
                <h4 className="font-montserrat font-black text-lg text-white group-hover:text-[#ffd700] transition-colors drop-shadow">
                  {cat.name}
                </h4>
                <p className="text-[11px] text-neutral-300 line-clamp-1 drop-shadow">
                  {cat.lore}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 🏆 6. Personal Vault & Custom Tierlist Command Hub */}
      <section className="bg-[#12121c]/90 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#ffd700]/20 border border-[#ffd700]/50 flex items-center justify-center text-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.2)]">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="font-montserrat font-black text-2xl text-white">
                Personal Vault & Custom Tierlist
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400">
                Rank your favorite series, track your watching progress, and export standalone tier boards
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/watchlist"
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/15 hover:border-emerald-400 text-xs sm:text-sm font-bold text-emerald-300 transition-all flex items-center gap-2"
            >
              <Bookmark size={16} />
              <span>Watchlist ({savedWatchlist.length})</span>
            </Link>
            <Link
              to="/favourites"
              className="px-5 py-2.5 rounded-xl bg-[#ffd700] hover:bg-[#ffea00] text-black font-montserrat font-black text-xs sm:text-sm shadow-xl hover:scale-105 transition-all flex items-center gap-2"
            >
              <Award size={16} />
              <span>Open Tier Board</span>
            </Link>
          </div>
        </div>

        {/* Live Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
          <div className="p-4 sm:p-5 bg-white/5 border border-white/10 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-semibold">
              <TrendingUp size={16} className="text-emerald-400" />
              <span>Favorites Pool</span>
            </div>
            <div className="text-3xl font-black font-montserrat text-white">
              {favourites.length}
            </div>
            <span className="text-xs text-neutral-400">Added to personal vault</span>
          </div>

          <div className="p-4 sm:p-5 bg-white/5 border border-white/10 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-semibold">
              <Award size={16} className="text-[#ffd700]" />
              <span>Tierlist Ranked</span>
            </div>
            <div className="text-3xl font-black font-montserrat text-[#ffd700]">
              {totalTierRanked}
            </div>
            <span className="text-xs text-neutral-400">Positioned in S-to-D ranks</span>
          </div>

          <div className="p-4 sm:p-5 bg-white/5 border border-white/10 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-semibold">
              <Clock size={16} className="text-cyan-400" />
              <span>Est. Watch Time</span>
            </div>
            <div className="text-3xl font-black font-montserrat text-cyan-400">
              {Math.max((favourites.length + savedWatchlist.length) * 4.8, 12).toFixed(0)}h
            </div>
            <span className="text-xs text-neutral-400">Episodes tracked across vault</span>
          </div>

          <div className="p-4 sm:p-5 bg-white/5 border border-white/10 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-semibold">
              <Sparkles size={16} className="text-purple-400" />
              <span>Cloud Status</span>
            </div>
            <div className="text-sm font-bold font-montserrat text-purple-300 mt-2">
              {currentUser ? "Cloud Synchronized" : "Local Storage Mode"}
            </div>
            <span className="text-xs text-neutral-400">Instant offline caching</span>
          </div>
        </div>
      </section>

    </div>
  );
};

export default PersonalHub;
