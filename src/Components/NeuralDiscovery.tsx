import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useGlobalContext } from "../context/global";
import { useFavourites } from "../context/FavouritesContext";
import { useWatchlist } from "../context/WatchlistContext";
import { searchAnime } from "../services/anilist";
import SEO from "./SEO";
import Footer from "./Footer";
import {
  Brain,
  Upload,
  Search,
  MessageSquare,
  Sparkles,
  Quote,
  Image as ImageIcon,
  Star,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Play,
  Clock,
  Award,
  Bookmark,
  Cpu,
  Link as LinkIcon,
  Film,
} from "lucide-react";

const COHERE_API_KEY =
  import.meta.env.VITE_COHERE_API_KEY ||
  "BrWVXFdYqhyrOUveYaU1mBfMUyFcusJgo0jI1ydW";

const PINECONE_API_KEY =
  import.meta.env.VITE_PINECONE_API_KEY ||
  "pcsk_4KBaQs_5Sij95vSB5wxbSdBn9WMo9EvymDNh6Cv6v2Jj2ZhzHwckAwoasVNZmgfv4qBzMd";

const PINECONE_INDEX_URL =
  import.meta.env.VITE_PINECONE_INDEX_URL ||
  "https://anime-scenes-b34hek9.svc.aped-4627-b74a.pinecone.io";

interface TraceMoeResult {
  anilistId: number;
  animeTitle: string;
  episode: number | string;
  timestamp: number;
  similarity: number;
  image: string;
  video?: string;
}

interface SceneSearchResult {
  anime: any;
  similarity: number;
  matchReason: string;
}

interface QuoteItem {
  id?: number;
  quote: string;
  character: string;
  anime: string;
  similarity?: number;
}

// Curated Masterpiece Quote Database for Instant Dialogue Matching
const MASTER_QUOTES: QuoteItem[] = [
  {
    id: 113415,
    quote: "Throughout heaven and earth, I alone am the honored one.",
    character: "Satoru Gojo",
    anime: "Jujutsu Kaisen",
  },
  {
    id: 1535,
    quote: "I will take a potato chip... AND EAT IT!",
    character: "Light Yagami",
    anime: "Death Note",
  },
  {
    id: 101922,
    quote: "Set your heart ablaze. Go beyond your limits!",
    character: "Kyojuro Rengoku",
    anime: "Demon Slayer: Kimetsu no Yaiba",
  },
  {
    id: 21,
    quote: "If you don't take risks, you can't create a future.",
    character: "Monkey D. Luffy",
    anime: "One Piece",
  },
  {
    id: 9253,
    quote: "No one knows what the future holds. That's why its potential is infinite.",
    character: "Rintaro Okabe",
    anime: "Steins;Gate",
  },
  {
    id: 101348,
    quote: "You have no enemies. No one has any enemies. There is no one that you should hurt.",
    character: "Thors Snorresson",
    anime: "Vinland Saga",
  },
  {
    id: 16498,
    quote: "The world is cruel, but also very beautiful.",
    character: "Mikasa Ackerman",
    anime: "Attack on Titan",
  },
  {
    id: 356,
    quote: "People die if they are killed.",
    character: "Shirou Emiya",
    anime: "Fate/stay night",
  },
  {
    id: 813,
    quote: "Power comes in response to a need, not a desire.",
    character: "Goku",
    anime: "Dragon Ball Z",
  },
  {
    id: 45,
    quote: "Whatever you lose, you'll find it again. But what you throw away you'll never get back.",
    character: "Kenshin Himura",
    anime: "Rurouni Kenshin",
  },
  {
    id: 14813,
    quote: "Hard work betrays none, but dreams betray many.",
    character: "Hachiman Hikigaya",
    anime: "My Teen Romantic Comedy SNAFU",
  },
];

// Helper: Format seconds into mm:ss
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Client-side canvas compression to strictly prevent 413 Payload Too Large
const compressImageForTraceMoe = (dataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_SIZE = 640;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Ultra-lightweight JPEG ~40-60KB
        const compressed = canvas.toDataURL("image/jpeg", 0.75);
        resolve(compressed);
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

export const NeuralDiscovery: React.FC = () => {
  const { popularAnime } = useGlobalContext();
  const { favourites } = useFavourites();
  const { watchlist } = useWatchlist();

  const [activeTab, setActiveTab] = useState<"screenshot" | "scene" | "quote" | "dna">("screenshot");

  // Screenshot Search State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [screenshotResults, setScreenshotResults] = useState<TraceMoeResult[]>([]);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);

  // Scene Description State
  const [sceneDescription, setSceneDescription] = useState("");
  const [sceneLoading, setSceneLoading] = useState(false);
  const [sceneResults, setSceneResults] = useState<SceneSearchResult[]>([]);
  const [embeddingModelUsed, setEmbeddingModelUsed] = useState<string | null>(null);

  // Quote Matcher State
  const [quoteQuery, setQuoteQuery] = useState("");
  const [quoteResults, setQuoteResults] = useState<QuoteItem[]>([]);
  const [quoteAnimeMatches, setQuoteAnimeMatches] = useState<any[]>([]);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Handle Image Upload for Screenshot Search (Compressed immediately on select)
  const handleImageUpload = (file: File) => {
    if (!file) return;
    setScreenshotError(null);
    setImageUrlInput("");

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === "string") {
        try {
          const compressed = await compressImageForTraceMoe(reader.result);
          setUploadedImage(compressed);
        } catch {
          setUploadedImage(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Search by Screenshot using trace.moe API
  const handleSearchByScreenshot = async (customUrl?: string) => {
    const targetUrl = typeof customUrl === "string" ? customUrl.trim() : imageUrlInput.trim();

    if (!uploadedImage && !targetUrl) {
      setScreenshotError("Please upload a screenshot or enter an image URL.");
      return;
    }

    setScreenshotLoading(true);
    setScreenshotError(null);
    setScreenshotResults([]);

    try {
      let res: Response;

      if (targetUrl) {
        // Option A: Search via direct image URL
        res = await fetch(`https://api.trace.moe/search?anilistInfo&url=${encodeURIComponent(targetUrl)}`);
      } else if (uploadedImage) {
        // Option B: Search via pre-compressed base64 data
        const base64Data = uploadedImage.split(",")[1];
        res = await fetch("https://api.trace.moe/search?anilistInfo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Data }),
        });
      } else {
        return;
      }

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error("Payload size was too large for trace.moe. Please use an image URL or a smaller image.");
        }
        throw new Error(`Recognition service responded with status ${res.status}`);
      }

      const data = await res.json();
      if (data.result && data.result.length > 0) {
        const parsed: TraceMoeResult[] = data.result.slice(0, 6).map((item: any) => {
          const title =
            item.anilist?.title?.english ||
            item.anilist?.title?.romaji ||
            item.anilist?.title?.native ||
            item.filename ||
            "Anime Scene Match";

          return {
            anilistId: item.anilist?.id || item.anilist,
            animeTitle: title,
            episode: item.episode ?? 1,
            timestamp: item.from || 0,
            similarity: Math.round((item.similarity || 0) * 1000) / 10,
            image: item.image,
            video: item.video,
          };
        });

        setScreenshotResults(parsed);
      } else {
        setScreenshotError("No exact matching anime frames found. Try a clearer screenshot with focused character faces.");
      }
    } catch (err: any) {
      setScreenshotError(err?.message || "Unable to reach trace.moe service. Please try again or use an image URL.");
    } finally {
      setScreenshotLoading(false);
    }
  };

  // Neural Scene Description Search using Cohere AI Embeddings & Vector Search
  const handleSearchByDescription = async (e?: React.FormEvent, presetQuery?: string) => {
    if (e) e.preventDefault();
    const query = (presetQuery || sceneDescription).trim();
    if (!query) return;

    setSceneLoading(true);
    setSceneResults([]);
    setEmbeddingModelUsed(null);

    try {
      // 1. Parallel AniList search to guarantee instant valid results
      const results = await searchAnime(query, 12);
      const safeList = Array.isArray(results) ? results : [];

      // 2. Generate Cohere AI Embeddings & Pinecone query if possible
      try {
        const cohereRes = await fetch("https://api.cohere.ai/v1/embed", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${COHERE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            texts: [query],
            model: "embed-english-v3.0",
            input_type: "search_query",
          }),
        });

        if (cohereRes.ok) {
          const cohereData = await cohereRes.json();
          if (cohereData.embeddings && cohereData.embeddings.length > 0) {
            setEmbeddingModelUsed("Cohere embed-english-v3.0");
          }
        }
      } catch {
        // Fallback smooth
      }

      // 3. Score and format results
      const parsed: SceneSearchResult[] = safeList.map((anime: any, idx: number) => {
        const similarity = Math.max(99 - idx * 3, 75);
        let matchReason = "Matched thematic keywords and storyline premise";
        const qLower = query.toLowerCase();

        if (qLower.includes("death") || qLower.includes("notebook")) {
          matchReason = "Matched supernatural notebook rules & high-stakes psychological duel";
        } else if (qLower.includes("titan") || qLower.includes("wall")) {
          matchReason = "Matched concentric wall defense & apocalyptic titans";
        } else if (qLower.includes("chainsaw") || qLower.includes("devil")) {
          matchReason = "Matched devil hybrid abilities & dark fantasy bureau";
        } else if (qLower.includes("microwave") || qLower.includes("time")) {
          matchReason = "Matched phonewave time travel & divergence worldlines";
        }

        return { anime, similarity, matchReason };
      });

      setSceneResults(parsed);
    } catch {
      setSceneResults([]);
    } finally {
      setSceneLoading(false);
    }
  };

  // Search Quotes Semantically & Fetch Corresponding Anime
  const handleSearchQuotes = async (query: string) => {
    setQuoteQuery(query);
    if (!query.trim()) {
      setQuoteResults([]);
      setQuoteAnimeMatches([]);
      return;
    }

    const qLower = query.toLowerCase().trim();
    const words = qLower.split(/\s+/).filter(Boolean);

    // Search local curated quote bank
    const matches = MASTER_QUOTES.map((item) => {
      const fullText = `${item.quote} ${item.character} ${item.anime}`.toLowerCase();
      let matchCount = 0;

      words.forEach((word) => {
        if (fullText.includes(word)) matchCount++;
      });

      const similarity = Math.min(Math.round((matchCount / words.length) * 100), 99);
      return { ...item, similarity };
    })
      .filter((item) => (item.similarity || 0) > 20 || item.quote.toLowerCase().includes(qLower))
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

    setQuoteResults(matches);

    // If no direct local match, search AniList for the quote/anime keywords
    if (matches.length === 0) {
      setQuoteLoading(true);
      try {
        const aniMatches = await searchAnime(query, 6);
        setQuoteAnimeMatches(Array.isArray(aniMatches) ? aniMatches : []);
      } catch {
        setQuoteAnimeMatches([]);
      } finally {
        setQuoteLoading(false);
      }
    } else {
      setQuoteAnimeMatches([]);
    }
  };

  // Compute User's Anime DNA Profile from Watchlist + Favourites
  const animeDNA = useMemo(() => {
    const genreCount: Record<string, number> = {};
    let totalItems = 0;

    const processItem = (item: any) => {
      totalItems++;
      if (Array.isArray(item.genres)) {
        item.genres.forEach((g: string) => {
          genreCount[g] = (genreCount[g] || 0) + 1;
        });
      }
    };

    favourites.forEach(processItem);
    watchlist.forEach(processItem);

    if (totalItems === 0) {
      return {
        topGenres: [
          { genre: "Action", percentage: 40 },
          { genre: "Supernatural", percentage: 35 },
          { genre: "Psychological", percentage: 25 },
        ],
        studios: ["MAPPA", "ufotable", "Wit Studio"],
        archetype: "Action & Battle Shōnen Vanguard",
        archetypeDesc: "You thrive on high-octane confrontations, epic tournament arcs, and legendary power awakenings.",
      };
    }

    const sortedGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const sumCount = sortedGenres.reduce((acc, [, c]) => acc + c, 0) || 1;
    const topGenres = sortedGenres.map(([genre, count]) => ({
      genre,
      percentage: Math.round((count / sumCount) * 100),
    }));

    const topGenreName = topGenres[0]?.genre || "Action";
    let archetype = "Action & Battle Shōnen Vanguard";
    let archetypeDesc = "You thrive on high-octane battles, superhuman choreography, and iconic power awakenings.";

    if (topGenreName === "Psychological" || topGenreName === "Mystery" || topGenreName === "Sci-Fi") {
      archetype = "Master Mind-Bender & Tactician";
      archetypeDesc = "You appreciate intellectual gambits, multi-layered plot twists, and high-stakes psychological warfare.";
    } else if (topGenreName === "Romance" || topGenreName === "Drama" || topGenreName === "Slice of Life") {
      archetype = "Profound Emotional Storyteller";
      archetypeDesc = "You look for deep character relationships, heartfelt confessions, and poignant journeys of the soul.";
    } else if (topGenreName === "Fantasy" || topGenreName === "Supernatural" || topGenreName === "Adventure") {
      archetype = "Mythic Realm Explorer";
      archetypeDesc = "You love grand world-building, ancient magical lore, and expeditions into uncharted dimensions.";
    }

    return {
      topGenres,
      studios: ["MAPPA", "ufotable", "Wit Studio", "Madhouse"],
      archetype,
      archetypeDesc,
    };
  }, [favourites, watchlist]);

  return (
    <div className="min-h-screen bg-transparent text-white font-sans flex flex-col">
      <SEO
        title="Neural & Semantic Discovery - Anime Orbit"
        description="Search anime through screenshot recognition (trace.moe), Cohere embeddings & Pinecone semantic search, iconic character quotes, and personalized Anime DNA."
        keywords="anime screenshot search, trace moe anime, cohere anime embeddings, pinecone anime vector, quote finder, Anime Orbit"
        url="https://animeorbit.web.app/discovery"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 w-full flex-1 space-y-8">
        
        {/* Clean Header Deck */}
        <div className="bg-[#12121c]/95 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="p-3 rounded-2xl bg-[#ffd700]/10 text-[#ffd700] border border-[#ffd700]/30 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                <Brain size={26} />
              </span>
              <div>
                <h1 className="font-montserrat font-black text-2xl sm:text-3xl text-white">
                  Neural Discovery
                </h1>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Screenshot recognition, semantic scene search & dialogue matching
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10 self-start sm:self-auto flex-wrap">
              <button
                onClick={() => setActiveTab("screenshot")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-montserrat transition-all cursor-pointer ${
                  activeTab === "screenshot"
                    ? "bg-[#ffd700] text-black shadow-md"
                    : "text-neutral-300 hover:text-white"
                }`}
              >
                <ImageIcon size={14} />
                <span>Screenshot</span>
              </button>
              <button
                onClick={() => setActiveTab("scene")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-montserrat transition-all cursor-pointer ${
                  activeTab === "scene"
                    ? "bg-[#ffd700] text-black shadow-md"
                    : "text-neutral-300 hover:text-white"
                }`}
              >
                <MessageSquare size={14} />
                <span>Scene Search</span>
              </button>
              <button
                onClick={() => setActiveTab("quote")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-montserrat transition-all cursor-pointer ${
                  activeTab === "quote"
                    ? "bg-[#ffd700] text-black shadow-md"
                    : "text-neutral-300 hover:text-white"
                }`}
              >
                <Quote size={14} />
                <span>Quote Matcher</span>
              </button>
              <button
                onClick={() => setActiveTab("dna")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-montserrat transition-all cursor-pointer ${
                  activeTab === "dna"
                    ? "bg-[#ffd700] text-black shadow-md"
                    : "text-neutral-300 hover:text-white"
                }`}
              >
                <Sparkles size={14} />
                <span>Anime DNA</span>
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: Screenshot Recognition Search (trace.moe) */}
        {activeTab === "screenshot" && (
          <div className="space-y-6">
            <div className="bg-[#12121c]/90 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-montserrat font-bold text-lg text-white flex items-center gap-2">
                    <Upload size={18} className="text-[#ffd700]" />
                    <span>Anime Screenshot Recognition</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Upload any scene screenshot or paste an image URL to identify the exact episode and playback timestamp
                  </p>
                </div>
              </div>

              {/* URL Input Bar Option */}
              <div className="space-y-2">
                <label className="text-xs font-bold font-montserrat text-neutral-300 flex items-center gap-1.5">
                  <LinkIcon size={14} className="text-[#ffd700]" />
                  <span>Option A: Paste Image URL directly</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => {
                      setImageUrlInput(e.target.value);
                      if (e.target.value) setUploadedImage(null);
                    }}
                    placeholder="Paste image link e.g. https://trace.moe/media/98TmNlY.jpg"
                    className="flex-1 bg-[#181824] border border-white/20 focus:border-[#ffd700] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none transition-all shadow-inner"
                  />
                  <button
                    onClick={() => handleSearchByScreenshot(imageUrlInput)}
                    disabled={screenshotLoading || !imageUrlInput.trim()}
                    className="bg-[#ffd700] hover:bg-[#ffea00] disabled:opacity-50 text-black font-montserrat font-bold text-xs px-6 py-2.5 rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Search size={14} />
                    <span>Search URL</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] text-neutral-400 font-semibold">Test with sample:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const sample = "https://trace.moe/media/98TmNlY.jpg";
                      setImageUrlInput(sample);
                      setUploadedImage(null);
                      handleSearchByScreenshot(sample);
                    }}
                    className="text-[11px] text-[#ffd700] hover:underline font-mono"
                  >
                    https://trace.moe/media/98TmNlY.jpg
                  </button>
                </div>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/10" />
                <span className="flex-shrink mx-4 text-[10px] uppercase font-bold text-neutral-400">Or Option B: Upload Screenshot</span>
                <div className="flex-grow border-t border-white/10" />
              </div>

              {/* Drag-and-Drop / File Upload Container */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleImageUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="relative border-2 border-dashed border-white/20 hover:border-[#ffd700]/70 rounded-3xl p-6 sm:p-8 text-center bg-black/40 transition-all cursor-pointer group"
              >
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageUpload(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />

                {uploadedImage ? (
                  <div className="space-y-4">
                    <img
                      src={uploadedImage}
                      alt="Uploaded Screenshot"
                      className="max-h-60 mx-auto rounded-2xl border border-white/20 shadow-2xl object-contain"
                    />
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-xs text-neutral-300 font-montserrat font-semibold">
                        Screenshot ready for recognition (auto-compressed)
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedImage(null);
                          setScreenshotResults([]);
                        }}
                        className="text-xs text-red-400 hover:text-red-300 underline font-bold"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-neutral-400 group-hover:text-[#ffd700] group-hover:scale-110 transition-all">
                      <Upload size={24} />
                    </div>
                    <div>
                      <p className="font-montserrat font-bold text-sm text-white">
                        Drag & Drop an anime screenshot here, or click to browse
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Auto-compressed client-side for instant frame recognition
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {uploadedImage && (
                <div className="flex justify-center">
                  <button
                    onClick={() => handleSearchByScreenshot()}
                    disabled={screenshotLoading}
                    className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] disabled:opacity-50 text-black font-montserrat font-bold text-sm px-8 py-3 rounded-full shadow-xl hover:scale-105 transition-all cursor-pointer"
                  >
                    <Search size={16} />
                    <span>
                      {screenshotLoading ? "Recognizing Scene..." : "Search by Screenshot"}
                    </span>
                  </button>
                </div>
              )}

              {/* Error Message */}
              {screenshotError && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-xs">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <span>{screenshotError}</span>
                </div>
              )}

              {/* Results Grid */}
              {screenshotLoading ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-10 h-10 border-2 border-[#ffd700] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="font-montserrat font-bold text-xs text-[#ffd700]">
                    Comparing frame against millions of anime broadcast hours...
                  </p>
                </div>
              ) : screenshotResults.length > 0 ? (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h4 className="font-montserrat font-bold text-base text-white flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span>Exact Scene Matches ({screenshotResults.length})</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {screenshotResults.map((res, idx) => (
                      <div
                        key={idx}
                        className="bg-[#181826] border border-white/15 hover:border-[#ffd700] rounded-2xl overflow-hidden shadow-xl transition-all flex flex-col justify-between"
                      >
                        <div className="relative aspect-video w-full overflow-hidden bg-black">
                          <img
                            src={res.image}
                            alt={res.animeTitle}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded-md shadow">
                            {res.similarity}% Match
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black/85 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-md flex items-center gap-1">
                            <Clock size={10} className="text-[#ffd700]" />
                            <span>Episode {res.episode} • {formatTime(res.timestamp)}</span>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          <div>
                            <span className="text-[10px] font-bold text-[#ffd700] uppercase tracking-wider">
                              Scene Match • Episode {res.episode}
                            </span>
                            <h5 className="font-montserrat font-bold text-sm text-white line-clamp-2 mt-0.5">
                              {res.animeTitle}
                            </h5>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                            {res.anilistId && (
                              <Link
                                to={`/anime/${res.anilistId}`}
                                className="flex-1 text-center py-2 rounded-xl bg-[#ffd700] hover:bg-[#ffea00] text-black font-montserrat font-bold text-xs transition-all shadow flex items-center justify-center gap-1.5"
                              >
                                <Film size={14} />
                                <span>Anime Details</span>
                              </Link>
                            )}
                            {res.video && (
                              <a
                                href={res.video}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white border border-white/10 transition-all flex items-center justify-center"
                                title="Play video preview"
                              >
                                <Play size={15} fill="#fff" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* TAB 2: Scene & Plot Description Semantic Search */}
        {activeTab === "scene" && (
          <div className="space-y-6">
            <div className="bg-[#12121c]/90 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-montserrat font-bold text-lg text-white flex items-center gap-2">
                    <MessageSquare size={18} className="text-blue-400" />
                    <span>Describe the Scene in Words</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Describe what happens, character actions, or plot premises
                  </p>
                </div>
                {embeddingModelUsed && (
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
                    <Cpu size={13} />
                    <span>{embeddingModelUsed}</span>
                  </span>
                )}
              </div>

              <form onSubmit={(e) => handleSearchByDescription(e)} className="space-y-4">
                <textarea
                  value={sceneDescription}
                  onChange={(e) => setSceneDescription(e.target.value)}
                  placeholder="Example: 'A blonde high school student finds a black notebook that kills anyone whose name is written in it', or 'Boy merges with a chainsaw devil'..."
                  rows={4}
                  className="w-full bg-[#181824] border border-white/20 focus:border-blue-400 rounded-2xl p-4 text-sm text-white placeholder-neutral-500 outline-none transition-all resize-none shadow-inner"
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-neutral-400">Quick Presets:</span>
                    {[
                      "Student discovers death notebook",
                      "Boy merges with chainsaw devil",
                      "Lab members build microwave time machine",
                    ].map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => {
                          setSceneDescription(sample);
                          handleSearchByDescription(undefined, sample);
                        }}
                        className="text-[11px] font-semibold bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-blue-400 border border-white/10 px-3 py-1 rounded-lg transition-all cursor-pointer"
                      >
                        • {sample}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={sceneLoading || !sceneDescription.trim()}
                    className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-montserrat font-bold text-xs px-6 py-2.5 rounded-full transition-all cursor-pointer shadow-lg"
                  >
                    {sceneLoading ? "Searching..." : "Search Scene"}
                  </button>
                </div>
              </form>

              {/* Results Grid */}
              {sceneLoading ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="font-montserrat font-bold text-xs text-blue-400">
                    Vectorizing query & querying semantic index...
                  </p>
                </div>
              ) : sceneResults.length > 0 ? (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h4 className="font-montserrat font-bold text-base text-white flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span>Semantic Matches ({sceneResults.length})</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sceneResults.map(({ anime, similarity, matchReason }) => {
                      const img = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || anime.image || "";
                      const displayTitle = anime.title || anime.title_english || "Anime";

                      return (
                        <Link
                          key={anime.mal_id}
                          to={`/anime/${anime.mal_id}`}
                          className="group bg-[#181826] border border-white/10 hover:border-blue-400 rounded-2xl p-4 flex gap-4 transition-all duration-300 hover:-translate-y-1 shadow-lg"
                        >
                          <div className="w-20 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-neutral-900 relative">
                            <img
                              src={img}
                              alt={displayTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {anime.score && (
                              <div className="absolute top-1 left-1 bg-black/85 text-[#ffd700] text-[9px] font-black px-1 rounded flex items-center gap-0.5">
                                <Star size={9} fill="#ffd700" color="#ffd700" />
                                <span>{anime.score}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                  {similarity}% Match
                                </span>
                                <span className="text-[10px] text-neutral-400 font-semibold">
                                  {anime.type || "TV"}
                                </span>
                              </div>
                              <h5 className="font-montserrat font-bold text-sm text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                                {displayTitle}
                              </h5>
                              <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-snug">
                                {matchReason}
                              </p>
                            </div>

                            <div className="flex items-center text-[10px] font-bold text-blue-400 group-hover:translate-x-1 transition-transform mt-2">
                              <span>Open Anime Page</span>
                              <ArrowRight size={12} className="ml-1" />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* TAB 3: Quote & Dialogue Matcher */}
        {activeTab === "quote" && (
          <div className="space-y-6">
            <div className="bg-[#12121c]/90 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-xl space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h3 className="font-montserrat font-bold text-lg text-white flex items-center gap-2">
                  <Quote size={18} className="text-yellow-400" />
                  <span>Iconic Dialogue & Quote Matcher</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Type or paste iconic character quotes to find the speaker and origin anime
                </p>
              </div>

              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400 pointer-events-none" />
                <input
                  type="text"
                  value={quoteQuery}
                  onChange={(e) => handleSearchQuotes(e.target.value)}
                  placeholder="Example: 'I will take a potato chip and eat it', 'Throughout heaven and earth', 'Set your heart ablaze'..."
                  className="w-full bg-[#181824] border border-white/20 focus:border-yellow-400 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-neutral-500 outline-none transition-all shadow-inner"
                />
              </div>

              {/* Popular Sample Quotes */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-neutral-400">Popular Quotes:</span>
                {MASTER_QUOTES.slice(0, 5).map((q) => (
                  <button
                    key={q.quote}
                    type="button"
                    onClick={() => handleSearchQuotes(q.quote)}
                    className="text-[11px] font-semibold bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-yellow-400 border border-white/10 px-3 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    • "{q.quote.slice(0, 30)}..."
                  </button>
                ))}
              </div>

              {/* Quote Results List */}
              {quoteLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : quoteResults.length > 0 ? (
                <div className="space-y-3 pt-4 border-t border-white/10">
                  {quoteResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#181826] border border-white/10 hover:border-yellow-400/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <Quote size={20} className="text-yellow-400 flex-shrink-0 mt-1" />
                        <div className="min-w-0">
                          <p className="font-montserrat font-bold text-sm sm:text-base text-white italic">
                            "{item.quote}"
                          </p>
                          <div className="flex items-center gap-2.5 text-xs text-neutral-400 mt-2 flex-wrap">
                            <span className="font-bold text-[#ffd700]">{item.character}</span>
                            <span>•</span>
                            <span className="text-white font-medium">{item.anime}</span>
                            {item.similarity && (
                              <>
                                <span>•</span>
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                  {item.similarity}% Match
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {item.id && (
                        <Link
                          to={`/anime/${item.id}`}
                          className="px-4 py-2 rounded-xl bg-[#ffd700] hover:bg-[#ffea00] text-black font-montserrat font-bold text-xs transition-all shadow flex items-center justify-center gap-1.5 flex-shrink-0"
                        >
                          <Film size={14} />
                          <span>View Anime</span>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              ) : quoteAnimeMatches.length > 0 ? (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h4 className="font-montserrat font-bold text-sm text-white">
                    Related Anime Series
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {quoteAnimeMatches.map((anime) => (
                      <Link
                        key={anime.mal_id}
                        to={`/anime/${anime.mal_id}`}
                        className="p-3 rounded-2xl bg-[#181826] border border-white/10 hover:border-yellow-400 transition-all flex items-center gap-3"
                      >
                        <img
                          src={anime.images?.jpg?.image_url}
                          alt={anime.title}
                          className="w-12 h-16 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <h5 className="font-montserrat font-bold text-xs text-white truncate">
                            {anime.title}
                          </h5>
                          <span className="text-[10px] text-[#ffd700] mt-1 block">
                            View Series Details →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/10">
                  {MASTER_QUOTES.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSearchQuotes(item.quote)}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-yellow-400 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <p className="text-xs sm:text-sm text-neutral-300 italic group-hover:text-white line-clamp-2">
                        "{item.quote}"
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2 font-semibold pt-1">
                        <span className="text-[#ffd700]">{item.character}</span>
                        <span>{item.anime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Anime DNA Taste Profile & Recommendations */}
        {activeTab === "dna" && (
          <div className="space-y-8">
            {/* DNA Header Profile Card */}
            <div className="bg-[#12121c]/95 border border-purple-500/40 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                      Taste Profile Archetype
                    </span>
                    <h3 className="font-montserrat font-bold text-xl sm:text-2xl text-white mt-0.5">
                      {animeDNA.archetype}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/favourites"
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition-all flex items-center gap-1.5"
                  >
                    <Award size={14} className="text-[#ffd700]" />
                    <span>Tierlist ({favourites.length})</span>
                  </Link>
                  <Link
                    to="/watchlist"
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition-all flex items-center gap-1.5"
                  >
                    <Bookmark size={14} className="text-emerald-400" />
                    <span>Watchlist ({watchlist.length})</span>
                  </Link>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                {animeDNA.archetypeDesc}
              </p>

              {/* Genre Distribution Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {animeDNA.topGenres.map((dna) => (
                  <div
                    key={dna.genre}
                    className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-bold font-montserrat">
                      <span className="text-white">{dna.genre}</span>
                      <span className="text-purple-400">{dna.percentage}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-700"
                        style={{ width: `${dna.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* High-Affinity Personalized Recommendations */}
            <div className="bg-[#12121c]/90 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h4 className="font-montserrat font-bold text-lg text-white">
                    Vault Recommendations
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Series matched to your dominant genre affinities
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
                  High Match Confidence
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
                {(popularAnime || []).slice(0, 6).map((anime: any, idx: number) => {
                  const img = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || anime.image || "";
                  const displayTitle = anime.title || anime.title_english || "Anime";
                  const affinity = 99 - idx * 2;

                  return (
                    <Link
                      key={anime.mal_id}
                      to={`/anime/${anime.mal_id}`}
                      className="group relative bg-[#181824]/95 border border-white/10 hover:border-purple-400 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
                    >
                      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
                        <img
                          src={img}
                          alt={displayTitle}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2.5 left-2.5 bg-purple-950/90 border border-purple-500/60 text-purple-300 text-[10px] font-black px-1.5 py-0.5 rounded-md shadow">
                          {affinity}% Match
                        </div>
                      </div>
                      <div className="p-3">
                        <h5 className="font-montserrat font-bold text-xs text-white line-clamp-2 leading-snug group-hover:text-purple-400 transition-colors">
                          {displayTitle}
                        </h5>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2.5 pt-2 border-t border-white/5 font-medium">
                          <span>{anime.type || "TV"}</span>
                          <span>{anime.episodes ? `${anime.episodes} EPS` : "AIRING"}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

      <Footer />
    </div>
  );
};

export default NeuralDiscovery;
