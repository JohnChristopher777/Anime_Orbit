import React from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  ListTodo,
  CheckCircle2,
  Compass,
  Heart,
  Image as ImageIcon,
  MessageSquare,
  Quote,
  RefreshCw,
  Search,
  Sparkles,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";
import { useFavourites } from "../context/FavouritesContext";
import { useWatchlist } from "../context/WatchlistContext";
import { getAnimeByGenre, getAnimeListByIds, getPopularAnime, searchAnime } from "../services/anilist";
import AnimeCard from "./AnimeCard";
import AppDropdown from "./AppDropdown";
import Footer from "./Footer";
import ProgressiveImage from "./ProgressiveImage";
import SEO from "./SEO";

type FinderTab = "screenshot" | "search" | "scene" | "dialogue" | "vibe" | "for-you";

interface TraceResult {
  id: number;
  title: string;
  episode: string;
  time: number;
  similarity: number;
  image: string;
}

interface DialogueResult {
  id?: number;
  anime: string;
  character: string;
  line: string;
  confidence?: number;
  reason?: string;
}

interface AiDiscoveryResult {
  summary: string;
  setting: string;
  characters: string[];
  matches: Array<{ title: string; character?: string; quote?: string; reason: string; confidence: number }>;
}

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery",
  "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural",
];

const VIBES = [
  { label: "Big fights", genre: "Action", copy: "Battles, rivals, and power-ups" },
  { label: "Fantasy worlds", genre: "Fantasy", copy: "Magic, quests, and other worlds" },
  { label: "Smart mysteries", genre: "Mystery", copy: "Cases, secrets, and plot twists" },
  { label: "Feel-good", genre: "Slice of Life", copy: "Comfort shows and everyday stories" },
  { label: "Romance", genre: "Romance", copy: "Confessions, couples, and heartbreak" },
  { label: "Dark nights", genre: "Horror", copy: "Monsters, survival, and suspense" },
];

const SCENE_SIGNALS = [
  { genre: "Action", terms: ["fight", "battle", "weapon", "war", "hero", "attack", "rescue"] },
  { genre: "Adventure", terms: ["journey", "quest", "island", "treasure", "travel", "pirate"] },
  { genre: "Fantasy", terms: ["magic", "dragon", "kingdom", "elf", "dungeon", "reincarnated"] },
  { genre: "Mystery", terms: ["detective", "murder", "case", "clue", "secret", "investigation"] },
  { genre: "Psychological", terms: ["mind", "memory", "identity", "manipulation", "strategy", "game"] },
  { genre: "Romance", terms: ["love", "couple", "confession", "date", "relationship", "kiss"] },
  { genre: "Sci-Fi", terms: ["space", "future", "robot", "time travel", "experiment", "cyber"] },
  { genre: "Sports", terms: ["match", "team", "tournament", "volleyball", "football", "basketball"] },
  { genre: "Supernatural", terms: ["curse", "spirit", "ghost", "demon", "devil", "power"] },
];

const DIALOGUE_INDEX: DialogueResult[] = [
  { id: 21, anime: "One Piece", character: "Monkey D. Luffy", line: "If you don't take risks, you can't create a future." },
  { id: 1535, anime: "Death Note", character: "Light Yagami", line: "I will take a potato chip and eat it." },
  { id: 16498, anime: "Attack on Titan", character: "Mikasa Ackerman", line: "The world is cruel, but also very beautiful." },
  { id: 101348, anime: "Vinland Saga", character: "Thors", line: "You have no enemies." },
  { id: 9253, anime: "Steins;Gate", character: "Rintaro Okabe", line: "No one knows what the future holds. That's why its potential is infinite." },
  { id: 101922, anime: "Demon Slayer", character: "Kyojuro Rengoku", line: "Set your heart ablaze." },
  { id: 20, anime: "Naruto", character: "Naruto Uzumaki", line: "I never go back on my word." },
  { id: 11061, anime: "Hunter x Hunter", character: "Gon Freecss", line: "If you want to get to know someone, find out what makes them angry." },
  { id: 5114, anime: "Fullmetal Alchemist: Brotherhood", character: "Edward Elric", line: "A lesson without pain is meaningless." },
  { id: 30, anime: "Neon Genesis Evangelion", character: "Misato Katsuragi", line: "Sometimes you need a little wishful thinking just to keep on living." },
  { id: 1, anime: "Cowboy Bebop", character: "Spike Spiegel", line: "Whatever happens, happens." },
  { id: 20583, anime: "Haikyu!!", character: "Tobio Kageyama", line: "The only ones who will remain on the court are the strong." },
];

const tokenize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 2 && !["the", "and", "that", "with", "from", "this", "was", "are", "you"].includes(word));

const formatTime = (seconds: number) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return `${Math.floor(safeSeconds / 60)}:${Math.floor(safeSeconds % 60).toString().padStart(2, "0")}`;
};

const compressImage = (file: File): Promise<Blob> => new Promise((resolve, reject) => {
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  image.onload = () => {
    const maxSide = 960;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("This browser could not prepare the image."));
      return;
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      URL.revokeObjectURL(objectUrl);
      if (blob) resolve(blob);
      else reject(new Error("This image could not be prepared."));
    }, "image/jpeg", 0.82);
  };
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error("This image could not be opened."));
  };
  image.src = objectUrl;
});

const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
  reader.onerror = () => reject(new Error("This image could not be read."));
  reader.readAsDataURL(blob);
});

const askGemini = async (payload: Record<string, unknown>): Promise<AiDiscoveryResult> => {
  const response = await fetch("/.netlify/functions/discovery", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Visual search is not available");
  const result = await response.json();
  return {
    summary: String(result.summary || ""),
    setting: String(result.setting || ""),
    characters: Array.isArray(result.characters) ? result.characters.filter(Boolean).slice(0, 8) : [],
    matches: Array.isArray(result.matches) ? result.matches.filter((match: any) => match?.title).slice(0, 6) : [],
  };
};

const ResultSkeleton = () => (
  <div className="finder-results" aria-label="Loading anime">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="finder-result-skeleton"><span /><span /><span /></div>
    ))}
  </div>
);

const AnimeResults: React.FC<{ items: any[]; empty?: string }> = ({ items, empty = "No anime found." }) => {
  if (!items.length) return <div className="finder-empty">{empty}</div>;
  return <div className="finder-results">{items.map((anime) => <AnimeCard key={anime.mal_id} anime={anime} />)}</div>;
};

export const NeuralDiscovery: React.FC = () => {
  const { favourites } = useFavourites();
  const { watchlist } = useWatchlist();
  const [activeTab, setActiveTab] = React.useState<FinderTab>("screenshot");

  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [traceResults, setTraceResults] = React.useState<TraceResult[]>([]);
  const [traceLoading, setTraceLoading] = React.useState(false);
  const [traceError, setTraceError] = React.useState("");
  const [visualInsight, setVisualInsight] = React.useState<AiDiscoveryResult | null>(null);
  const [visualMatches, setVisualMatches] = React.useState<any[]>([]);
  const [visualLoading, setVisualLoading] = React.useState(false);

  const [titleQuery, setTitleQuery] = React.useState("");
  const [titleResults, setTitleResults] = React.useState<any[]>([]);
  const [titleLoading, setTitleLoading] = React.useState(false);
  const [titleError, setTitleError] = React.useState("");

  const [sceneQuery, setSceneQuery] = React.useState("");
  const [sceneResults, setSceneResults] = React.useState<any[]>([]);
  const [sceneLoading, setSceneLoading] = React.useState(false);
  const [sceneError, setSceneError] = React.useState("");
  const [sceneInsight, setSceneInsight] = React.useState<AiDiscoveryResult | null>(null);

  const [dialogueQuery, setDialogueQuery] = React.useState("");
  const [dialogueResults, setDialogueResults] = React.useState<DialogueResult[]>([]);
  const [dialogueLoading, setDialogueLoading] = React.useState(false);
  const [dialogueError, setDialogueError] = React.useState("");
  const [dialogueInsight, setDialogueInsight] = React.useState<AiDiscoveryResult | null>(null);

  const [selectedGenre, setSelectedGenre] = React.useState("Action");
  const [vibeResults, setVibeResults] = React.useState<any[]>([]);
  const [vibeLoading, setVibeLoading] = React.useState(false);
  const [vibeError, setVibeError] = React.useState("");

  const [personalResults, setPersonalResults] = React.useState<any[]>([]);
  const [personalLoading, setPersonalLoading] = React.useState(false);
  const [libraryHydrating, setLibraryHydrating] = React.useState(false);
  const [libraryDetails, setLibraryDetails] = React.useState<any[]>([]);
  const [libraryReadyKey, setLibraryReadyKey] = React.useState("");
  const [personalError, setPersonalError] = React.useState("");
  const initialVibeLoaded = React.useRef(false);
  const personalTasteLoaded = React.useRef("");
  const hydratedLibraryKey = React.useRef("");
  const recommendationOffset = React.useRef(0);

  React.useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const savedLibraryIds = React.useMemo(() => [...new Set(
    [...favourites, ...watchlist]
      .map((item: any) => Number(item.mal_id))
      .filter((id) => Number.isFinite(id) && id > 0),
  )].sort((a, b) => a - b), [favourites, watchlist]);
  const savedLibraryKey = savedLibraryIds.join("|");

  React.useEffect(() => {
    if (!savedLibraryKey) {
      setLibraryDetails([]);
      setLibraryReadyKey("");
      return;
    }
    if (activeTab !== "for-you" || hydratedLibraryKey.current === savedLibraryKey) return;
    let current = true;
    hydratedLibraryKey.current = savedLibraryKey;
    setLibraryHydrating(true);
    setLibraryDetails([]);
    getAnimeListByIds(savedLibraryIds.slice(0, 50))
      .then((items: any[]) => { if (current) setLibraryDetails(Array.isArray(items) ? items : []); })
      .finally(() => {
        if (current) {
          setLibraryReadyKey(savedLibraryKey);
          setLibraryHydrating(false);
        }
      });
    return () => { current = false; };
  }, [activeTab, savedLibraryIds, savedLibraryKey]);

  const taste = React.useMemo(() => {
    const counts = new Map<string, number>();
    [...favourites, ...watchlist, ...libraryDetails].forEach((item: any) => {
      (item.genres || []).forEach((rawGenre: any) => {
        const genre = typeof rawGenre === "string" ? rawGenre : rawGenre?.name;
        if (genre) counts.set(genre, (counts.get(genre) || 0) + 1);
      });
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([genre]) => genre);
  }, [favourites, watchlist, libraryDetails]);

  const selectImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setTraceError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageUrl("");
    setTraceResults([]);
    setVisualMatches([]);
    setVisualInsight(null);
    setTraceError("");
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview("");
    setTraceResults([]);
    setVisualMatches([]);
    setVisualInsight(null);
    setTraceError("");
  };

  const resolveAiAnime = async (matches: AiDiscoveryResult["matches"]) => {
    const resolved = await Promise.allSettled(matches.slice(0, 6).map((match) => searchAnime(match.title, 2)));
    return [...new Map(resolved.flatMap((result) => result.status === "fulfilled" ? result.value || [] : []).filter((anime: any) => anime?.mal_id).map((anime: any) => [anime.mal_id, anime])).values()] as any[];
  };

  const findVisualWithAI = async (file: File | null, directUrl: string) => {
    setVisualLoading(true);
    setVisualInsight(null);
    setVisualMatches([]);
    try {
      const payload: Record<string, unknown> = { kind: "image" };
      if (file) {
        const compressed = await compressImage(file);
        payload.imageData = await blobToBase64(compressed);
        payload.mimeType = compressed.type || "image/jpeg";
      } else payload.imageUrl = directUrl;
      const result = await askGemini(payload);
      setVisualInsight(result);
      setVisualMatches(await resolveAiAnime(result.matches));
    } catch {
      // trace.moe remains available as the frame-specific fallback.
    } finally {
      setVisualLoading(false);
    }
  };

  const findScreenshot = async () => {
    const directUrl = imageUrl.trim();
    if (!imageFile && !directUrl) {
      setTraceError("Upload an anime frame or paste a direct image link first.");
      return;
    }
    setTraceLoading(true);
    setTraceResults([]);
    setTraceError("");
    void findVisualWithAI(imageFile, directUrl);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    try {
      let response: Response;
      if (imageFile) {
        const body = new FormData();
        body.append("image", await compressImage(imageFile), "anime-frame.jpg");
        response = await fetch("https://api.trace.moe/search?anilistInfo=1&cutBorders=1", { method: "POST", body, signal: controller.signal });
      } else {
        response = await fetch(`https://api.trace.moe/search?anilistInfo=1&cutBorders=1&url=${encodeURIComponent(directUrl)}`, { signal: controller.signal });
      }
      if (!response.ok) throw new Error(response.status === 429 ? "Screenshot search is busy. Wait a moment and try again." : `Screenshot search failed (${response.status}).`);
      const payload = await response.json();
      const parsed = (payload.result || []).slice(0, 8).map((result: any) => {
        const aniList = result.anilist;
        return {
          id: Number(typeof aniList === "object" ? aniList?.id : aniList),
          title: aniList?.title?.english || aniList?.title?.romaji || aniList?.title?.native || result.filename || "Unknown anime",
          episode: result.episode == null ? "Unknown" : String(result.episode),
          time: Number(result.from || 0),
          similarity: Math.round(Number(result.similarity || 0) * 1000) / 10,
          image: result.image,
        };
      }).filter((result: TraceResult) => result.id && result.image);
      setTraceResults(parsed);
      if (!parsed.length) setTraceError("No frame match was found. Try a clean frame without subtitles or borders.");
    } catch (error: any) {
      setTraceError(error?.name === "AbortError" ? "Screenshot search timed out. Please try again." : error?.message || "Screenshot search is unavailable right now.");
    } finally {
      window.clearTimeout(timeout);
      setTraceLoading(false);
    }
  };

  const findByTitle = async (event: React.FormEvent) => {
    event.preventDefault();
    const query = titleQuery.trim();
    if (query.length < 2) {
      setTitleError("Enter at least two letters from the title.");
      return;
    }
    setTitleLoading(true);
    setTitleError("");
    setTitleResults([]);
    try {
      const results = await searchAnime(query, 18);
      setTitleResults(results || []);
      if (!results?.length) setTitleError("No matching anime title was found.");
    } catch {
      setTitleError("Title search could not connect. Please try again.");
    } finally {
      setTitleLoading(false);
    }
  };

  const discoverGenre = React.useCallback(async (genre: string) => {
    setSelectedGenre(genre);
    setVibeLoading(true);
    setVibeError("");
    setVibeResults([]);
    try {
      const result = await getAnimeByGenre(genre, 18, 1, "SCORE_DESC");
      setVibeResults(result.media || []);
      if (!result.media?.length) setVibeError(`No ${genre} anime were returned.`);
    } catch {
      setVibeError("Genre discovery could not connect. Please try again.");
    } finally {
      setVibeLoading(false);
    }
  }, []);

  const findScene = async (event: React.FormEvent) => {
    event.preventDefault();
    const query = sceneQuery.trim();
    const tokens = tokenize(query);
    if (tokens.length < 2) {
      setSceneError("Describe at least two useful details, such as the place, action, or character.");
      return;
    }
    setSceneLoading(true);
    setSceneError("");
    setSceneResults([]);
    setSceneInsight(null);
    try {
      let aiResult: AiDiscoveryResult | null = null;
      try {
        aiResult = await askGemini({ kind: "scene", text: query });
        setSceneInsight(aiResult);
      } catch {
        // Catalogue clue matching below is the resilient fallback.
      }
      const lowerQuery = query.toLowerCase();
      const genres = SCENE_SIGNALS.filter((signal) => signal.terms.some((term) => lowerQuery.includes(term))).map((signal) => signal.genre).slice(0, 2);
      const keywords = [...new Set(tokens)].sort((a, b) => b.length - a.length).slice(0, 3);
      const requests = [
        searchAnime(query, 12),
        ...(aiResult?.matches || []).slice(0, 6).map((match) => searchAnime(match.title, 3)),
        ...keywords.map((keyword) => searchAnime(keyword, 8)),
        ...genres.map((genre) => getAnimeByGenre(genre, 18, 1, "SCORE_DESC").then((result) => result.media || [])),
        getPopularAnime(50, 1),
      ];
      const responses = await Promise.allSettled(requests);
      const candidates = responses.flatMap((response) => {
        if (response.status !== "fulfilled") return [];
        const value: any = response.value;
        return Array.isArray(value) ? value : value?.media || [];
      });
      const unique = [...new Map(candidates.filter((anime: any) => anime?.mal_id).map((anime: any) => [anime.mal_id, anime])).values()] as any[];
      const ranked = unique.map((anime) => {
        const animeGenres = (anime.genres || []).map((raw: any) => typeof raw === "string" ? raw : raw?.name).filter(Boolean);
        const text = `${anime.title || ""} ${anime.title_english || ""} ${anime.synopsis || ""} ${animeGenres.join(" ")}`.toLowerCase();
        const termHits = tokens.filter((token) => text.includes(token)).length;
        const genreHits = genres.filter((genre) => animeGenres.includes(genre)).length;
        const aiIndex = aiResult?.matches.findIndex((match) => [anime.title, anime.title_english].filter(Boolean).some((title) => String(title).toLowerCase().includes(match.title.toLowerCase()) || match.title.toLowerCase().includes(String(title).toLowerCase()))) ?? -1;
        const aiBoost = aiIndex >= 0 ? 30 - aiIndex * 3 : 0;
        return { anime, rank: aiBoost + termHits * 4 + genreHits * 3 + Number(anime.score || 0) / 10 };
      }).filter((item) => item.rank > 1).sort((a, b) => b.rank - a.rank).slice(0, 18).map((item) => item.anime);
      setSceneResults(ranked);
      if (!ranked.length) setSceneError("No strong match was found. Add a setting, action, visual detail, or genre clue.");
    } catch {
      setSceneError("Scene search is unavailable right now. Please try again.");
    } finally {
      setSceneLoading(false);
    }
  };

  const localDialogueSearch = (rawQuery: string): DialogueResult[] => {
    const query = rawQuery.trim();
    const tokens = tokenize(query);
    if (!tokens.length) {
      return [];
    }
    const normalized = query.toLowerCase();
    const matches = DIALOGUE_INDEX.map((entry) => {
      const text = `${entry.line} ${entry.character} ${entry.anime}`.toLowerCase();
      const hits = tokens.filter((token) => text.includes(token)).length;
      return { entry, hits, exact: text.includes(normalized) };
    }).filter((result) => result.exact || result.hits >= Math.max(1, Math.ceil(tokens.length * .45))).sort((a, b) => Number(b.exact) - Number(a.exact) || b.hits - a.hits).map((result) => result.entry);
    return matches;
  };

  const findDialogueText = async (rawQuery: string) => {
    const query = rawQuery.trim();
    if (tokenize(query).length === 0) {
      setDialogueResults([]);
      setDialogueError("Enter part of a line, a character, or an anime title.");
      return;
    }
    setDialogueLoading(true);
    setDialogueError("");
    setDialogueResults([]);
    setDialogueInsight(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    try {
      let aiResult: AiDiscoveryResult | null = null;
      try {
        aiResult = await askGemini({ kind: "dialogue", text: query });
        setDialogueInsight(aiResult);
      } catch {
        // Remote quote search and the local quote index remain available.
      }
      const fetchQuotes = async (filter: "anime" | "character") => {
        const response = await fetch(`https://api.animechan.io/v1/quotes/?${filter}=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (!response.ok) return [];
        const payload = await response.json();
        return Array.isArray(payload?.data) ? payload.data : payload?.data ? [payload.data] : [];
      };
      const responses = await Promise.allSettled([fetchQuotes("anime"), fetchQuotes("character")]);
      const rows = responses.flatMap((response) => response.status === "fulfilled" ? response.value : []);
      const remote: DialogueResult[] = rows.map((row: any) => ({
        line: String(row.quote || row.content || "").trim(),
        anime: String(typeof row.anime === "string" ? row.anime : row.anime?.name || "").trim(),
        character: String(typeof row.character === "string" ? row.character : row.character?.name || "Unknown character").trim(),
      })).filter((row: DialogueResult) => row.line && row.anime);
      const aiRows: DialogueResult[] = (aiResult?.matches || []).map((match) => ({ anime: match.title, character: match.character || "Unknown character", line: match.quote || query, confidence: match.confidence, reason: match.reason }));
      const fallback = localDialogueSearch(query);
      const combined = [...new Map([...aiRows, ...fallback, ...remote].map((row) => [`${row.anime}:${row.line}`.toLowerCase(), row])).values()];
      const uniqueAnime = [...new Set(combined.map((row) => row.anime))];
      const resolved = await Promise.allSettled(uniqueAnime.map(async (anime) => ({ anime, results: await searchAnime(anime, 1) })));
      const ids = new Map<string, number>();
      resolved.forEach((result) => {
        if (result.status === "fulfilled" && result.value.results?.[0]?.mal_id) ids.set(result.value.anime.toLowerCase(), result.value.results[0].mal_id);
      });
      const results = combined.map((row) => ({ ...row, id: row.id || ids.get(row.anime.toLowerCase()) }));
      setDialogueResults(results);
      if (!results.length) setDialogueError("No matching line was found. Try a character name, anime title, or a shorter part of the quote.");
    } catch {
      const fallback = localDialogueSearch(query);
      setDialogueResults(fallback);
      if (!fallback.length) setDialogueError("Quote search is unavailable right now. Try again shortly.");
    } finally {
      window.clearTimeout(timeout);
      setDialogueLoading(false);
    }
  };

  const findDialogue = (event: React.FormEvent) => {
    event.preventDefault();
    void findDialogueText(dialogueQuery);
  };

  const buildRecommendations = React.useCallback(async () => {
    if (!savedLibraryIds.length) return;
    setPersonalLoading(true);
    setPersonalError("");
    setPersonalResults([]);
    try {
      const responses = taste.length
        ? await Promise.allSettled(taste.map((genre) => getAnimeByGenre(genre, 18, 1, "POPULARITY_DESC")))
        : [];
      const savedIds = new Set(savedLibraryIds);
      const candidates = responses.flatMap((response) => response.status === "fulfilled" ? response.value.media || [] : []);
      if (!candidates.length) {
        const fallback = await getPopularAnime(36, 1);
        candidates.push(...(fallback.media || []));
      }
      const unique = [...new Map(candidates.filter((item: any) => !savedIds.has(Number(item.mal_id))).map((item: any) => [item.mal_id, item])).values()] as any[];
      unique.sort((a, b) => {
        const matches = (item: any) => (item.genres || []).filter((raw: any) => taste.includes(typeof raw === "string" ? raw : raw?.name)).length;
        return matches(b) - matches(a) || Number(b.score || 0) - Number(a.score || 0);
      });
      const offset = unique.length ? recommendationOffset.current % unique.length : 0;
      recommendationOffset.current += 7;
      const rotated = [...unique.slice(offset), ...unique.slice(0, offset)];
      setPersonalResults(rotated.slice(0, 18));
      if (!unique.length) setPersonalError("No new recommendations were returned.");
    } catch {
      setPersonalError("Recommendations could not connect. Please try again.");
    } finally {
      setPersonalLoading(false);
    }
  }, [taste, savedLibraryIds]);

  React.useEffect(() => {
    if (activeTab === "vibe" && !initialVibeLoaded.current) {
      initialVibeLoaded.current = true;
      discoverGenre("Action");
    }
  }, [activeTab, discoverGenre]);

  React.useEffect(() => {
    const recommendationKey = `${savedLibraryKey}:${taste.join("|")}`;
    if (activeTab === "for-you" && savedLibraryKey && libraryReadyKey === savedLibraryKey && personalTasteLoaded.current !== recommendationKey) {
      personalTasteLoaded.current = recommendationKey;
      buildRecommendations();
    }
  }, [activeTab, taste, savedLibraryKey, libraryReadyKey, buildRecommendations]);

  const tabs: { id: FinderTab; label: string; icon: React.ElementType }[] = [
    { id: "screenshot", label: "Screenshot", icon: ImageIcon },
    { id: "search", label: "Title Search", icon: Search },
    { id: "scene", label: "Describe Scene", icon: MessageSquare },
    { id: "dialogue", label: "Find Dialogue", icon: Quote },
    { id: "vibe", label: "Pick a Vibe", icon: Compass },
    { id: "for-you", label: "For You", icon: Sparkles },
  ];

  return (
    <div className="finder-page">
      <SEO title="Anime Finder - Screenshot, Title and Genre Search" description="Find anime from a screenshot, title, genre, mood, or your saved favorites." keywords="anime screenshot search, anime title search, anime recommendations, Anime Orbit" url="https://animeorbit.web.app/discovery" />
      <main className="finder-shell">
        <header className="finder-header">
          <span className="finder-header__icon"><WandSparkles size={24} /></span>
          <div><span>Anime discovery</span><h1>Find something worth watching</h1><p>Identify a show, remember a quote, or choose your next favorite.</p></div>
        </header>

        <nav className="finder-tabs" aria-label="Anime finder tools">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} aria-current={activeTab === id ? "page" : undefined}><Icon size={16} /><span>{label}</span></button>
          ))}
        </nav>

        {activeTab === "screenshot" && (
          <section className="finder-panel">
            <div className="finder-panel__heading"><div><span>Identify a frame</span><h2>Find anime from a screenshot</h2><p>Best with a clean frame from the episode. Posters, fan art, and cropped faces are less reliable.</p></div></div>
            <div className="finder-screenshot-grid">
              <label className="finder-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectImage(event.dataTransfer.files?.[0]); }}>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => selectImage(event.target.files?.[0])} />
                {imagePreview ? <><ProgressiveImage src={imagePreview} alt="Selected anime frame" wrapperClassName="finder-dropzone__preview" className="h-full w-full object-contain" /><button type="button" onClick={(event) => { event.preventDefault(); clearImage(); }}><X size={14} /> Remove</button></> : <><Upload size={28} /><strong>Drop a screenshot here</strong><span>or choose JPG, PNG, or WebP</span></>}
              </label>
              <div className="finder-url">
                <span>Or use a direct image link</span>
                <input type="url" value={imageUrl} onChange={(event) => { setImageUrl(event.target.value); if (event.target.value && imageFile) clearImage(); }} placeholder="https://example.com/anime-frame.jpg" />
                <button onClick={findScreenshot} disabled={traceLoading || (!imageFile && !imageUrl.trim())}>{traceLoading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}{traceLoading ? "Checking frame..." : "Find this anime"}</button>
                <small>Clean episode frames work best. Cropped borders and compressed uploads are handled automatically.</small>
              </div>
            </div>
            {traceError && <div className="finder-error"><AlertCircle size={17} />{traceError}</div>}
            {traceLoading ? <ResultSkeleton /> : traceResults.length > 0 && <div className="finder-trace-results">{traceResults.map((result, index) => <Link to={`/anime/${result.id}`} key={`${result.id}-${index}`}><ProgressiveImage src={result.image} alt={result.title} wrapperClassName="finder-trace-results__image" className="h-full w-full object-cover" /><div><span>{result.similarity}% frame match</span><h3>{result.title}</h3><p>Episode {result.episode} · {formatTime(result.time)}</p></div><ArrowRight size={18} /></Link>)}</div>}
            {(visualLoading || visualInsight) && <div className="finder-ai-answer">{visualLoading ? <><RefreshCw size={18} className="animate-spin" /><div><strong>Reading characters and setting…</strong><p>Checking visual clues beyond an exact episode-frame match.</p></div></> : visualInsight && <><Sparkles size={18} /><div><strong>{visualInsight.summary || "Visual matches"}</strong>{visualInsight.setting && <p>{visualInsight.setting}</p>}{visualInsight.characters.length > 0 && <span>{visualInsight.characters.join(" · ")}</span>}</div></>}</div>}
            {!visualLoading && visualMatches.length > 0 && <><div className="finder-result-label">Character and setting matches</div><AnimeResults items={visualMatches} /></>}
          </section>
        )}

        {activeTab === "search" && (
          <section className="finder-panel">
            <div className="finder-panel__heading"><div><span>Known title</span><h2>Search anime by title</h2><p>Use any part of the English, Japanese, or romaji title.</p></div></div>
            <form className="finder-search" onSubmit={findByTitle}><Search size={18} /><input value={titleQuery} onChange={(event) => setTitleQuery(event.target.value)} placeholder="Try Vinland Saga, Frieren, or One Piece" /><button disabled={titleLoading}>{titleLoading ? "Searching..." : "Search"}</button></form>
            {titleError && <div className="finder-error"><AlertCircle size={17} />{titleError}</div>}
            {titleLoading ? <ResultSkeleton /> : <AnimeResults items={titleResults} empty="Search for a title to see matching anime." />}
          </section>
        )}

        {activeTab === "vibe" && (
          <section className="finder-panel">
            <div className="finder-panel__heading"><div><span>Browse by mood</span><h2>What are you in the mood for?</h2><p>Choose a familiar vibe or select a genre. The strongest fan-rated matches appear first.</p></div><label>Genre<AppDropdown ariaLabel="Choose anime genre" value={selectedGenre} onChange={discoverGenre} options={GENRES.map((genre) => ({ value: genre, label: genre }))} /></label></div>
            <div className="finder-vibes">{VIBES.map((vibe) => <button key={vibe.genre} onClick={() => discoverGenre(vibe.genre)} aria-pressed={selectedGenre === vibe.genre}><strong>{vibe.label}</strong><span>{vibe.copy}</span></button>)}</div>
            {vibeError && <div className="finder-error"><AlertCircle size={17} />{vibeError}</div>}
            {vibeLoading ? <ResultSkeleton /> : <AnimeResults items={vibeResults} />}
          </section>
        )}

        {activeTab === "scene" && (
          <section className="finder-panel">
            <div className="finder-panel__heading"><div><span>Scene clues</span><h2>Describe the scene you remember</h2><p>We compare your clues with story summaries, settings, and genres. Specific details produce better matches.</p></div></div>
            <form className="finder-scene-search" onSubmit={findScene}><textarea rows={4} value={sceneQuery} onChange={(event) => setSceneQuery(event.target.value)} placeholder="Example: A detective finds a notebook that can kill people and starts playing mind games with the police." /><button disabled={sceneLoading}><Search size={16} />{sceneLoading ? "Checking clues..." : "Find matching anime"}</button></form>
            <div className="finder-examples"><span>Try:</span>{["Pirates searching for a legendary treasure", "A girl travels through time to save her friends", "A volleyball team reaches a national tournament"].map((example) => <button key={example} onClick={() => setSceneQuery(example)}>{example}</button>)}</div>
            {sceneError && <div className="finder-error"><AlertCircle size={17} />{sceneError}</div>}
            {sceneInsight && <div className="finder-ai-answer"><Sparkles size={18} /><div><strong>{sceneInsight.summary}</strong>{sceneInsight.setting && <p>{sceneInsight.setting}</p>}{sceneInsight.characters.length > 0 && <span>{sceneInsight.characters.join(" · ")}</span>}</div></div>}
            {sceneLoading ? <ResultSkeleton /> : <AnimeResults items={sceneResults} empty="Describe a scene to find likely matches." />}
          </section>
        )}

        {activeTab === "dialogue" && (
          <section className="finder-panel">
            <div className="finder-panel__heading"><div><span>Remembered lines</span><h2>Find anime from dialogue</h2><p>Search a line, character, or anime title. Partial wording works best when you cannot remember the exact quote.</p></div></div>
            <form className="finder-search" onSubmit={findDialogue}><Quote size={18} /><input value={dialogueQuery} onChange={(event) => setDialogueQuery(event.target.value)} placeholder="Try: set your heart ablaze, Luffy, or Steins;Gate" /><button disabled={dialogueLoading}>{dialogueLoading ? "Searching..." : "Search"}</button></form>
            <div className="finder-examples"><span>Popular:</span>{DIALOGUE_INDEX.slice(0, 4).map((entry) => <button key={entry.line} onClick={() => { setDialogueQuery(entry.line); void findDialogueText(entry.line); }}>{entry.line}</button>)}</div>
            {dialogueError && <div className="finder-error"><AlertCircle size={17} />{dialogueError}</div>}
            {dialogueInsight && <div className="finder-ai-answer"><Sparkles size={18} /><div><strong>{dialogueInsight.summary}</strong>{dialogueInsight.setting && <p>{dialogueInsight.setting}</p>}</div></div>}
            {dialogueLoading ? <div className="finder-dialogue-loading"><span /><span /><span /></div> : <div className="finder-dialogue-results">{(dialogueResults.length ? dialogueResults : DIALOGUE_INDEX.slice(0, 6)).map((entry) => <article key={`${entry.anime}-${entry.line}`}><Quote size={18} /><div><p>“{entry.line}”</p><span>{entry.character} · {entry.anime}{entry.confidence ? ` · ${entry.confidence}% match` : ""}</span>{entry.reason && <small>{entry.reason}</small>}</div>{entry.id && <Link to={`/anime/${entry.id}`}>Open anime<ArrowRight size={14} /></Link>}</article>)}</div>}
          </section>
        )}

        {activeTab === "for-you" && (
          <section className="finder-panel">
            <div className="finder-panel__heading"><div><span>Your library</span><h2>Recommendations from what you saved</h2><p>Uses your favorites and anime watchlist, then leaves out titles already saved.</p></div>{savedLibraryIds.length > 0 && <button className="finder-refresh" onClick={buildRecommendations} disabled={personalLoading || libraryHydrating}><RefreshCw size={15} className={personalLoading ? "animate-spin" : ""} />Refresh picks</button>}</div>
            {!savedLibraryIds.length ? <div className="finder-library-empty"><Sparkles size={28} /><h3>Build a little history first</h3><p>Add a few anime to Favorites or Watchlist and your picks will appear here.</p><div><Link to="/favourites"><Heart size={15} />Favorites</Link><Link to="/watchlist"><ListTodo size={15} />Watchlist</Link></div></div> : libraryHydrating ? <ResultSkeleton /> : <><div className="finder-taste">Based on {taste.length ? taste.map((genre) => <span key={genre}><CheckCircle2 size={13} />{genre}</span>) : <span><CheckCircle2 size={13} />Your saved anime</span>}</div>{personalError && <div className="finder-error"><AlertCircle size={17} />{personalError}</div>}{personalLoading ? <ResultSkeleton /> : <AnimeResults items={personalResults} empty="No new picks are available yet. Refresh to try again." />}</>}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default NeuralDiscovery;
