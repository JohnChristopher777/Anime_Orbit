import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Compass,
  Image as ImageIcon,
  Mic2,
  Quote,
  RefreshCw,
  Search,
  Sparkles,
  Upload,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";
import { useFavourites } from "../context/FavouritesContext";
import { useWatchlist } from "../context/WatchlistContext";
import {
  getAnimeByGenre,
  getAnimeListByIds,
  getPopularAnime,
  searchAnime,
  searchCharacters,
} from "../services/anilist";
import AppDropdown from "./AppDropdown";
import { CharacterFinderWorkspace } from "./CharacterFinder";
import Footer from "./Footer";
import ProgressiveImage from "./ProgressiveImage";
import SEO from "./SEO";
import VoiceCastExplorer from "./VoiceCastExplorer";

type FinderTab =
  | "scene"
  | "dialogue"
  | "characters"
  | "recommendations"
  | "voices";

const FINDER_TABS: FinderTab[] = [
  "scene",
  "dialogue",
  "characters",
  "recommendations",
  "voices",
];

const TOOL_INTROS: Record<FinderTab, { kicker: string; title: string; copy: string }> = {
  scene: {
    kicker: "Scene finder",
    title: "Identify an anime scene",
    copy: "Upload a frame for an exact timestamp or describe what you remember for ranked matches.",
  },
  dialogue: {
    kicker: "Quote search",
    title: "Find dialogue and its speaker",
    copy: "Search part of a quote, a character name, or an anime title and browse every available match.",
  },
  characters: {
    kicker: "Character finder",
    title: "Search by appearance or name",
    copy: "Use visible traits, story role, distinctive details, or a name to identify a character.",
  },
  recommendations: {
    kicker: "Personal discovery",
    title: "Find something worth watching",
    copy: "Choose a mood and balance genres to build recommendations around your taste.",
  },
  voices: {
    kicker: "Voice cast explorer",
    title: "Follow characters and their voices",
    copy: "Search a character to find their actors, or an actor to browse voiced roles across anime.",
  },
};

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
  characterImage?: string;
  characterId?: number;
  animeImage?: string;
  episode?: string;
}

interface AiDiscoveryResult {
  available: boolean;
  summary: string;
  setting: string;
  characters: string[];
  visualDetails: string[];
  visibleText: string;
  matches: Array<{
    title: string;
    character?: string;
    quote?: string;
    episode?: string;
    reason: string;
    confidence: number;
  }>;
}

const GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
];

const VIBES = [
  {
    label: "Big fights",
    genre: "Action",
    copy: "Battles, rivals, and power-ups",
  },
  {
    label: "Fantasy worlds",
    genre: "Fantasy",
    copy: "Magic, quests, and other worlds",
  },
  {
    label: "Smart mysteries",
    genre: "Mystery",
    copy: "Cases, secrets, and plot twists",
  },
  {
    label: "Feel-good",
    genre: "Slice of Life",
    copy: "Comfort shows and everyday stories",
  },
  {
    label: "Romance",
    genre: "Romance",
    copy: "Confessions, couples, and heartbreak",
  },
  {
    label: "Dark nights",
    genre: "Horror",
    copy: "Monsters, survival, and suspense",
  },
];

const DEFAULT_GENRE_WEIGHTS: Record<string, number> = {
  Action: 6,
  Drama: 7,
  Romance: 4,
  Comedy: 5,
  Fantasy: 6,
  Mystery: 6,
};

const SCENE_SIGNALS = [
  {
    genre: "Action",
    terms: ["fight", "battle", "weapon", "war", "hero", "attack", "rescue"],
  },
  {
    genre: "Adventure",
    terms: ["journey", "quest", "island", "treasure", "travel", "pirate"],
  },
  {
    genre: "Fantasy",
    terms: ["magic", "dragon", "kingdom", "elf", "dungeon", "reincarnated"],
  },
  {
    genre: "Mystery",
    terms: ["detective", "murder", "case", "clue", "secret", "investigation"],
  },
  {
    genre: "Psychological",
    terms: ["mind", "memory", "identity", "manipulation", "strategy", "game"],
  },
  {
    genre: "Romance",
    terms: ["love", "couple", "confession", "date", "relationship", "kiss"],
  },
  {
    genre: "Sci-Fi",
    terms: ["space", "future", "robot", "time travel", "experiment", "cyber"],
  },
  {
    genre: "Sports",
    terms: [
      "match",
      "team",
      "tournament",
      "volleyball",
      "football",
      "basketball",
    ],
  },
  {
    genre: "Supernatural",
    terms: ["curse", "spirit", "ghost", "demon", "devil", "power"],
  },
];

const DIALOGUE_INDEX: DialogueResult[] = [
  {
    id: 21,
    anime: "One Piece",
    character: "Monkey D. Luffy",
    line: "If you don't take risks, you can't create a future.",
  },
  {
    id: 1535,
    anime: "Death Note",
    character: "Light Yagami",
    line: "I will take a potato chip and eat it.",
  },
  {
    id: 16498,
    anime: "Attack on Titan",
    character: "Mikasa Ackerman",
    line: "The world is cruel, but also very beautiful.",
  },
  {
    id: 101348,
    anime: "Vinland Saga",
    character: "Thors",
    line: "You have no enemies.",
  },
  {
    id: 9253,
    anime: "Steins;Gate",
    character: "Rintaro Okabe",
    line: "No one knows what the future holds. That's why its potential is infinite.",
  },
  {
    id: 101922,
    anime: "Demon Slayer",
    character: "Kyojuro Rengoku",
    line: "Set your heart ablaze.",
  },
  {
    id: 20,
    anime: "Naruto",
    character: "Naruto Uzumaki",
    line: "I never go back on my word.",
  },
  {
    id: 11061,
    anime: "Hunter x Hunter",
    character: "Gon Freecss",
    line: "If you want to get to know someone, find out what makes them angry.",
  },
  {
    id: 5114,
    anime: "Fullmetal Alchemist: Brotherhood",
    character: "Edward Elric",
    line: "A lesson without pain is meaningless.",
  },
  {
    id: 30,
    anime: "Neon Genesis Evangelion",
    character: "Misato Katsuragi",
    line: "Sometimes you need a little wishful thinking just to keep on living.",
  },
  {
    id: 1,
    anime: "Cowboy Bebop",
    character: "Spike Spiegel",
    line: "Whatever happens, happens.",
  },
  {
    id: 20583,
    anime: "Haikyu!!",
    character: "Tobio Kageyama",
    line: "The only ones who will remain on the court are the strong.",
  },
];

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 2 &&
        ![
          "the",
          "and",
          "that",
          "with",
          "from",
          "this",
          "was",
          "are",
          "you",
        ].includes(word),
    );

const formatTime = (seconds: number) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return `${Math.floor(safeSeconds / 60)}:${Math.floor(safeSeconds % 60)
    .toString()
    .padStart(2, "0")}`;
};

const compressImage = (file: File): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const maxSide = 960;
      const scale = Math.min(
        1,
        maxSide / Math.max(image.naturalWidth, image.naturalHeight),
      );
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
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) resolve(blob);
          else reject(new Error("This image could not be prepared."));
        },
        "image/jpeg",
        0.82,
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("This image could not be opened."));
    };
    image.src = objectUrl;
  });

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = () => reject(new Error("This image could not be read."));
    reader.readAsDataURL(blob);
  });

const askGemini = async (
  payload: Record<string, unknown>,
): Promise<AiDiscoveryResult> => {
  const response = await fetch("/api/discovery", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Visual search is not available");
  const result = await response.json();
  return {
    available: result.configured !== false,
    summary: String(result.summary || ""),
    setting: String(result.setting || ""),
    characters: Array.isArray(result.characters)
      ? result.characters.filter(Boolean).slice(0, 8)
      : [],
    visualDetails: Array.isArray(result.visualDetails)
      ? result.visualDetails.filter(Boolean).slice(0, 10)
      : [],
    visibleText: String(result.visibleText || ""),
    matches: Array.isArray(result.matches)
      ? result.matches.filter((match: any) => match?.title).slice(0, 6)
      : [],
  };
};

const ResultSkeleton = () => (
  <div className="finder-anime-results" aria-label="Loading anime">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="finder-anime-result-skeleton">
        <span className="finder-anime-result-skeleton__image" />
        <div><span /><span /><span /></div>
      </div>
    ))}
  </div>
);

const AnimeResults: React.FC<{ items: any[]; empty?: string }> = ({
  items,
  empty = "No anime found.",
}) => {
  if (!items.length) return <div className="finder-empty">{empty}</div>;
  return (
    <div className="finder-anime-results">
      {items.map((anime, index) => (
        <Link className="finder-anime-result" to={`/anime/${anime.mal_id}`} key={anime.mal_id}>
          <ProgressiveImage
            src={anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url}
            alt={anime.title_english || anime.title || "Anime"}
            wrapperClassName="finder-anime-result__image"
            className="h-full w-full object-cover"
          />
          <div className="finder-anime-result__copy">
            <span className="finder-anime-result__eyebrow">
              <b>#{index + 1}</b>
              {anime.score ? `★ ${Number(anime.score).toFixed(1)}` : "Unrated"}
            </span>
            <h3>{anime.title_english || anime.title || "Untitled anime"}</h3>
            {anime.title_english && anime.title && anime.title_english !== anime.title && <p>{anime.title}</p>}
            <div className="finder-anime-result__meta">
              <span>{anime.type || anime.format || "Anime"}</span>
              <span>{anime.episodes ? `${anime.episodes} episodes` : anime.status || "Episode count unknown"}</span>
            </div>
            <small>{anime.__matchReason || (anime.genres || []).slice(0, 3).map((genre: any) => typeof genre === "string" ? genre : genre?.name).filter(Boolean).join(" · ")}</small>
          </div>
          <ArrowRight size={17} />
        </Link>
      ))}
    </div>
  );
};

export const NeuralDiscovery: React.FC = () => {
  const { favourites } = useFavourites();
  const { watchlist } = useWatchlist();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTool = searchParams.get("tool") as FinderTab | null;
  const activeTab: FinderTab =
    requestedTool && FINDER_TABS.includes(requestedTool)
      ? requestedTool
      : "scene";

  const selectTab = (tab: FinderTab) => {
    setSearchParams(tab === "scene" ? {} : { tool: tab }, { replace: true });
  };

  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [traceResults, setTraceResults] = React.useState<TraceResult[]>([]);
  const [traceLoading, setTraceLoading] = React.useState(false);
  const [traceError, setTraceError] = React.useState("");
  const [visualInsight, setVisualInsight] =
    React.useState<AiDiscoveryResult | null>(null);
  const [visualMatches, setVisualMatches] = React.useState<any[]>([]);
  const [visualLoading, setVisualLoading] = React.useState(false);
  const [visualError, setVisualError] = React.useState("");

  const [sceneQuery, setSceneQuery] = React.useState("");
  const [sceneCharacter, setSceneCharacter] = React.useState("");
  const [sceneResults, setSceneResults] = React.useState<any[]>([]);
  const [sceneLoading, setSceneLoading] = React.useState(false);
  const [sceneError, setSceneError] = React.useState("");
  const [sceneInsight, setSceneInsight] =
    React.useState<AiDiscoveryResult | null>(null);

  const [dialogueQuery, setDialogueQuery] = React.useState("");
  const [dialogueResults, setDialogueResults] = React.useState<
    DialogueResult[]
  >([]);
  const [dialogueLoading, setDialogueLoading] = React.useState(false);
  const [dialogueError, setDialogueError] = React.useState("");
  const [dialogueInsight, setDialogueInsight] =
    React.useState<AiDiscoveryResult | null>(null);

  const [selectedGenre, setSelectedGenre] = React.useState("Action");
  const [vibeResults, setVibeResults] = React.useState<any[]>([]);
  const [vibeLoading, setVibeLoading] = React.useState(false);
  const [vibeError, setVibeError] = React.useState("");
  const [genreWeights, setGenreWeights] = React.useState(DEFAULT_GENRE_WEIGHTS);

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

  React.useEffect(
    () => () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    },
    [imagePreview],
  );

  const savedLibraryIds = React.useMemo(
    () =>
      [
        ...new Set(
          [...favourites, ...watchlist]
            .map((item: any) => Number(item.mal_id))
            .filter((id) => Number.isFinite(id) && id > 0),
        ),
      ].sort((a, b) => a - b),
    [favourites, watchlist],
  );
  const savedLibraryKey = savedLibraryIds.join("|");
  const excludedLibraryIds = React.useMemo(
    () => [
      ...new Set(
        [
          ...favourites.map((item: any) => Number(item.mal_id)),
          ...watchlist
            .filter(
              (item: any) => !/plan to watch/i.test(String(item.status || "")),
            )
            .map((item: any) => Number(item.mal_id)),
        ].filter((id) => Number.isFinite(id) && id > 0),
      ),
    ],
    [favourites, watchlist],
  );

  React.useEffect(() => {
    if (!savedLibraryKey) {
      setLibraryDetails([]);
      setLibraryReadyKey("");
      return;
    }
    if (
      activeTab !== "recommendations" ||
      hydratedLibraryKey.current === savedLibraryKey
    )
      return;
    let current = true;
    hydratedLibraryKey.current = savedLibraryKey;
    setLibraryHydrating(true);
    setLibraryDetails([]);
    getAnimeListByIds(savedLibraryIds.slice(0, 50))
      .then((items: any[]) => {
        if (current) setLibraryDetails(Array.isArray(items) ? items : []);
      })
      .finally(() => {
        if (current) {
          setLibraryReadyKey(savedLibraryKey);
          setLibraryHydrating(false);
        }
      });
    return () => {
      current = false;
    };
  }, [activeTab, savedLibraryIds, savedLibraryKey]);

  const taste = React.useMemo(() => {
    const counts = new Map<string, number>();
    [...favourites, ...watchlist, ...libraryDetails].forEach((item: any) => {
      (item.genres || []).forEach((rawGenre: any) => {
        const genre = typeof rawGenre === "string" ? rawGenre : rawGenre?.name;
        if (genre) counts.set(genre, (counts.get(genre) || 0) + 1);
      });
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);
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
    setVisualError("");
    setTraceError("");
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview("");
    setTraceResults([]);
    setVisualMatches([]);
    setVisualInsight(null);
    setVisualError("");
    setTraceError("");
  };

  const resolveAiAnime = async (matches: AiDiscoveryResult["matches"]) => {
    const resolved = await Promise.allSettled(
      matches.slice(0, 6).map((match) => searchAnime(match.title, 2)),
    );
    return [
      ...new Map(
        resolved
          .flatMap((result) =>
            result.status === "fulfilled" ? result.value || [] : [],
          )
          .filter((anime: any) => anime?.mal_id)
          .map((anime: any) => [anime.mal_id, anime]),
      ).values(),
    ] as any[];
  };

  const findVisualWithAI = async (file: File | null, directUrl: string) => {
    setVisualLoading(true);
    setVisualInsight(null);
    setVisualMatches([]);
    setVisualError("");
    try {
      const payload: Record<string, unknown> = { kind: "image" };
      if (file) {
        const compressed = await compressImage(file);
        payload.imageData = await blobToBase64(compressed);
        payload.mimeType = compressed.type || "image/jpeg";
      } else payload.imageUrl = directUrl;
      const result = await askGemini(payload);
      if (result.available) setVisualInsight(result);
      setVisualMatches(await resolveAiAnime(result.matches));
    } catch (error: any) {
      setVisualError(
        error?.message || "The AI scene description could not connect.",
      );
    } finally {
      setVisualLoading(false);
    }
  };

  const findScreenshot = async () => {
    const directUrl = imageUrl.trim();
    if (!imageFile && !directUrl) {
      setTraceError(
        "Upload an anime frame or paste a direct image link first.",
      );
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
        response = await fetch(
          "https://api.trace.moe/search?anilistInfo=1&cutBorders=1",
          { method: "POST", body, signal: controller.signal },
        );
      } else {
        response = await fetch(
          `https://api.trace.moe/search?anilistInfo=1&cutBorders=1&url=${encodeURIComponent(directUrl)}`,
          { signal: controller.signal },
        );
      }
      if (!response.ok)
        throw new Error(
          response.status === 429
            ? "Screenshot search is busy. Wait a moment and try again."
            : `Screenshot search failed (${response.status}).`,
        );
      const payload = await response.json();
      const parsed = (payload.result || [])
        .slice(0, 8)
        .map((result: any) => {
          const aniList = result.anilist;
          return {
            id: Number(typeof aniList === "object" ? aniList?.id : aniList),
            title:
              aniList?.title?.english ||
              aniList?.title?.romaji ||
              aniList?.title?.native ||
              result.filename ||
              "Unknown anime",
            episode:
              result.episode == null ? "Unknown" : String(result.episode),
            time: Number(result.from || 0),
            similarity: Math.round(Number(result.similarity || 0) * 1000) / 10,
            image: result.image,
          };
        })
        .filter((result: TraceResult) => result.id && result.image);
      // Trace can identify adult titles independently of AniList preferences.
      // Resolve every ID through our preference-aware catalogue before render.
      const allowedMedia = await getAnimeListByIds(
        [...new Set(parsed.map((result: TraceResult) => result.id))],
      );
      const allowedIds = new Set(
        allowedMedia.map((anime: any) => Number(anime.mal_id)),
      );
      const safeResults = parsed.filter((result: TraceResult) =>
        allowedIds.has(result.id),
      );
      setTraceResults(safeResults);
      if (!safeResults.length)
        setTraceError(
          "No permitted frame match was found. Try a clean frame without subtitles or borders.",
        );
    } catch (error: any) {
      setTraceError(
        error?.name === "AbortError"
          ? "Screenshot search timed out. Please try again."
          : error?.message || "Screenshot search is unavailable right now.",
      );
    } finally {
      window.clearTimeout(timeout);
      setTraceLoading(false);
    }
  };

  const discoverGenre = React.useCallback(async (genre: string) => {
    setSelectedGenre(genre);
    setVibeLoading(true);
    setVibeError("");
    try {
      const result = await getAnimeByGenre(genre, 18, 1, "SCORE_DESC");
      setVibeResults(result.media || []);
      if (!result.media?.length)
        setVibeError(`No ${genre} anime were returned.`);
    } catch {
      setVibeError("Genre discovery could not connect. Please try again.");
    } finally {
      setVibeLoading(false);
    }
  }, []);

  const discoverWeighted = async () => {
    setVibeLoading(true);
    setVibeError("");
    try {
      const strongest = Object.entries(genreWeights)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      const responses = await Promise.allSettled(
        strongest.map(([genre]) => getAnimeByGenre(genre, 20, 1, "SCORE_DESC")),
      );
      const excluded = new Set(excludedLibraryIds);
      const candidates = responses.flatMap((entry) =>
        entry.status === "fulfilled" ? entry.value.media || [] : [],
      );
      const unique = [
        ...new Map(
          candidates
            .filter((anime: any) => !excluded.has(Number(anime.mal_id)))
            .map((anime: any) => [anime.mal_id, anime]),
        ).values(),
      ] as any[];
      unique.sort((left, right) => {
        const affinity = (anime: any) =>
          (anime.genres || []).reduce(
            (sum: number, raw: any) =>
              sum +
              (genreWeights[typeof raw === "string" ? raw : raw?.name] || 0),
            0,
          );
        return (
          affinity(right) - affinity(left) ||
          Number(right.score || 0) - Number(left.score || 0)
        );
      });
      setVibeResults(unique.slice(0, 18));
      if (!unique.length)
        setVibeError("No unseen matches were returned for this mix.");
    } catch {
      setVibeError("The preference mix could not be loaded. Try again.");
    } finally {
      setVibeLoading(false);
    }
  };

  const findScene = async (event: React.FormEvent) => {
    event.preventDefault();
    const query = [
      sceneQuery.trim(),
      sceneCharacter.trim() && `Possible character: ${sceneCharacter.trim()}`,
    ]
      .filter(Boolean)
      .join(". ");
    const tokens = tokenize(query);
    if (tokens.length < 2) {
      setSceneError(
        "Describe at least two useful details, such as the place, action, or character.",
      );
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
        if (aiResult.available) setSceneInsight(aiResult);
      } catch {
        // Catalogue clue matching below is the resilient fallback.
      }
      const lowerQuery = query.toLowerCase();
      const genres = SCENE_SIGNALS.filter((signal) =>
        signal.terms.some((term) => lowerQuery.includes(term)),
      )
        .map((signal) => signal.genre)
        .slice(0, 2);
      const keywords = [...new Set(tokens)]
        .sort((a, b) => b.length - a.length)
        .slice(0, 3);
      const requests = [
        searchAnime(query, 12),
        ...(aiResult?.matches || [])
          .slice(0, 6)
          .map((match) => searchAnime(match.title, 3)),
        ...keywords.map((keyword) => searchAnime(keyword, 8)),
        ...genres.map((genre) =>
          getAnimeByGenre(genre, 18, 1, "SCORE_DESC").then(
            (result) => result.media || [],
          ),
        ),
        getPopularAnime(50, 1),
      ];
      const responses = await Promise.allSettled(requests);
      const candidates = responses.flatMap((response) => {
        if (response.status !== "fulfilled") return [];
        const value: any = response.value;
        return Array.isArray(value) ? value : value?.media || [];
      });
      const unique = [
        ...new Map(
          candidates
            .filter((anime: any) => anime?.mal_id)
            .map((anime: any) => [anime.mal_id, anime]),
        ).values(),
      ] as any[];
      const ranked = unique
        .map((anime) => {
          const animeGenres = (anime.genres || [])
            .map((raw: any) => (typeof raw === "string" ? raw : raw?.name))
            .filter(Boolean);
          const text =
            `${anime.title || ""} ${anime.title_english || ""} ${anime.synopsis || ""} ${animeGenres.join(" ")}`.toLowerCase();
          const termHits = tokens.filter((token) =>
            text.includes(token),
          ).length;
          const genreHits = genres.filter((genre) =>
            animeGenres.includes(genre),
          ).length;
          const aiIndex =
            aiResult?.matches.findIndex((match) =>
              [anime.title, anime.title_english]
                .filter(Boolean)
                .some(
                  (title) =>
                    String(title)
                      .toLowerCase()
                      .includes(match.title.toLowerCase()) ||
                    match.title
                      .toLowerCase()
                      .includes(String(title).toLowerCase()),
                ),
            ) ?? -1;
          const aiBoost = aiIndex >= 0 ? 30 - aiIndex * 3 : 0;
          const signalScore = aiBoost + termHits * 4 + genreHits * 3;
          return {
            anime,
            signalScore,
            termHits,
            genreHits,
            aiBoost,
            rank: signalScore + Number(anime.score || 0) / 10,
          };
        })
        .filter((item) => item.signalScore > 0)
        .sort((a, b) => b.rank - a.rank)
        .slice(0, 18)
        .map((item) => ({
          ...item.anime,
          __matchReason: item.aiBoost > 0
            ? "AI title match"
            : item.termHits > 1
              ? `${item.termHits} description clues matched`
              : item.genreHits
                ? `${item.genreHits} inferred genre ${item.genreHits > 1 ? "signals" : "signal"}`
                : "Description clue matched",
        }));
      setSceneResults(ranked);
      if (!ranked.length)
        setSceneError(
          "No strong match was found. Add a setting, action, visual detail, or genre clue.",
        );
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
      const text =
        `${entry.line} ${entry.character} ${entry.anime}`.toLowerCase();
      const hits = tokens.filter((token) => text.includes(token)).length;
      return { entry, hits, exact: text.includes(normalized) };
    })
      .filter(
        (result) =>
          result.exact ||
          result.hits >= Math.max(1, Math.ceil(tokens.length * 0.45)),
      )
      .sort((a, b) => Number(b.exact) - Number(a.exact) || b.hits - a.hits)
      .map((result) => result.entry);
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
    try {
      let remoteRows: DialogueResult[] = [];
      try {
        const response = await fetch(`/api/anime-quotes?q=${encodeURIComponent(query)}`);
        const payload = await response.json();
        remoteRows = (payload?.quotes || []).map((quote: any) => ({
          anime: quote.anime,
          character: quote.character,
          line: quote.line,
        }));
      } catch {
        // The local index below keeps quote search useful while remote results recover.
      }
      let aiResult: AiDiscoveryResult | null = null;
      try {
        aiResult = await askGemini({ kind: "dialogue", text: query });
        if (aiResult.available) setDialogueInsight(aiResult);
      } catch {
        // Remote quote search and the local quote index remain available.
      }
      const aiRows: DialogueResult[] = (aiResult?.matches || []).map(
        (match) => ({
          anime: match.title,
          character: match.character || "Unknown character",
          line: match.quote || query,
          episode: match.episode,
          confidence: match.confidence,
          reason: match.reason,
        }),
      );
      const fallback = localDialogueSearch(query);
      const combined = [
        ...new Map(
          [...remoteRows, ...aiRows, ...fallback].map((row) => [
            `${row.anime}:${row.line}`.toLowerCase(),
            row,
          ]),
        ).values(),
      ]
        .map((row) => {
          const searchable =
            `${row.line} ${row.character} ${row.anime}`.toLowerCase();
          const hits = tokenize(query).filter((token) =>
            searchable.includes(token),
          ).length;
          return {
            row,
            relevance:
              Number(row.confidence || 0) +
              hits * 20 +
              (searchable.includes(query.toLowerCase()) ? 35 : 0),
          };
        })
        .sort((left, right) => right.relevance - left.relevance)
        .map(({ row }) => row);
      const uniqueAnime = [...new Set(combined.map((row) => row.anime))];
      const uniqueCharacters = [
        ...new Set(
          combined
            .map((row) => row.character)
            .filter((name) => name && name !== "Unknown character"),
        ),
      ];
      const [resolved, resolvedCharacters] = await Promise.all([
        Promise.allSettled(
          uniqueAnime.map(async (anime) => ({
            anime,
            results: await searchAnime(anime, 1),
          })),
        ),
        Promise.allSettled(
          uniqueCharacters.map(async (character) => ({
            character,
            results: await searchCharacters(character, 3),
          })),
        ),
      ]);
      const animeMatches = new Map<string, { id: number; image?: string }>();
      resolved.forEach((result) => {
        if (
          result.status === "fulfilled" &&
          result.value.results?.[0]?.mal_id
        ) {
          const anime = result.value.results[0];
          animeMatches.set(result.value.anime.toLowerCase(), {
            id: anime.mal_id,
            image:
              anime.images?.jpg?.large_image_url ||
              anime.images?.jpg?.image_url,
          });
        }
      });
      const characterMatches = new Map<
        string,
        { id: number; image?: string }
      >();
      resolvedCharacters.forEach((result) => {
        if (result.status !== "fulfilled" || !result.value.results?.length)
          return;
        const animeName =
          combined
            .find((row) => row.character === result.value.character)
            ?.anime.toLowerCase() || "";
        const match =
          result.value.results.find((candidate: any) =>
            candidate.media?.nodes?.some((media: any) =>
              [media.title?.english, media.title?.romaji]
                .filter(Boolean)
                .some(
                  (title: string) =>
                    animeName.includes(title.toLowerCase()) ||
                    title.toLowerCase().includes(animeName),
                ),
            ),
          ) || result.value.results[0];
        characterMatches.set(result.value.character.toLowerCase(), {
          id: match.id,
          image: match.image?.large || match.image?.medium,
        });
      });
      const results = combined.map((row) => {
        const anime = animeMatches.get(row.anime.toLowerCase());
        const character = characterMatches.get(row.character.toLowerCase());
        return {
          ...row,
          id: row.id || anime?.id,
          animeImage: anime?.image,
          characterId: character?.id,
          characterImage: character?.image,
        };
      });
      setDialogueResults(results);
      if (!results.length)
        setDialogueError(
          "No matching line was found. Try a character name, anime title, or a shorter part of the quote.",
        );
    } catch {
      const fallback = localDialogueSearch(query);
      setDialogueResults(fallback);
      if (!fallback.length)
        setDialogueError(
          "Quote search is unavailable right now. Try again shortly.",
        );
    } finally {
      setDialogueLoading(false);
    }
  };

  const findDialogue = (event: React.FormEvent) => {
    event.preventDefault();
    void findDialogueText(dialogueQuery);
  };

  const loadRandomQuote = async () => {
    setDialogueLoading(true);
    setDialogueError("");
    try {
      const response = await fetch("/api/anime-quotes");
      const payload = await response.json();
      const quote = (payload?.quote?.line
        ? payload.quote
        : DIALOGUE_INDEX[Math.floor(Math.random() * DIALOGUE_INDEX.length)]) as DialogueResult;
      setDialogueQuery(quote.line);
      const [animeRows, characterRows] = await Promise.all([
        searchAnime(quote.anime, 1),
        searchCharacters(quote.character, 3),
      ]);
      const anime = animeRows?.[0];
      const character =
        characterRows?.find((candidate: any) =>
          candidate.media?.nodes?.some((media: any) =>
            [media.title?.english, media.title?.romaji]
              .filter(Boolean)
              .some(
                (title: string) =>
                  quote.anime.toLowerCase().includes(title.toLowerCase()) ||
                  title.toLowerCase().includes(quote.anime.toLowerCase()),
              ),
          ),
        ) || characterRows?.[0];
      setDialogueInsight(null);
      setDialogueResults([
        {
          ...quote,
          id: anime?.mal_id,
          animeImage:
            anime?.images?.jpg?.large_image_url ||
            anime?.images?.jpg?.image_url,
          characterId: character?.id,
          characterImage: character?.image?.large || character?.image?.medium,
        },
      ]);
      setDialogueLoading(false);
    } catch (error: any) {
      setDialogueError(
        error?.message || "A random quote is unavailable right now.",
      );
      setDialogueLoading(false);
    }
  };

  const buildRecommendations = React.useCallback(async () => {
    if (!savedLibraryIds.length) return;
    setPersonalLoading(true);
    setPersonalError("");
    setPersonalResults([]);
    try {
      const responses = taste.length
        ? await Promise.allSettled(
            taste.map((genre) =>
              getAnimeByGenre(genre, 18, 1, "POPULARITY_DESC"),
            ),
          )
        : [];
      const savedIds = new Set(excludedLibraryIds);
      const candidates = responses.flatMap((response) =>
        response.status === "fulfilled" ? response.value.media || [] : [],
      );
      if (!candidates.length) {
        const fallback = await getPopularAnime(36, 1);
        candidates.push(...(fallback.media || []));
      }
      const unique = [
        ...new Map(
          candidates
            .filter((item: any) => !savedIds.has(Number(item.mal_id)))
            .map((item: any) => [item.mal_id, item]),
        ).values(),
      ] as any[];
      unique.sort((a, b) => {
        const matches = (item: any) =>
          (item.genres || []).filter((raw: any) =>
            taste.includes(typeof raw === "string" ? raw : raw?.name),
          ).length;
        return (
          matches(b) - matches(a) || Number(b.score || 0) - Number(a.score || 0)
        );
      });
      const offset = unique.length
        ? recommendationOffset.current % unique.length
        : 0;
      recommendationOffset.current += 7;
      const rotated = [...unique.slice(offset), ...unique.slice(0, offset)];
      setPersonalResults(rotated.slice(0, 18));
      setVibeResults(rotated.slice(0, 18));
      if (!unique.length)
        setPersonalError("No new recommendations were returned.");
    } catch {
      setPersonalError("Recommendations could not connect. Please try again.");
    } finally {
      setPersonalLoading(false);
    }
  }, [taste, savedLibraryIds, excludedLibraryIds]);

  React.useEffect(() => {
    if (activeTab === "recommendations" && !initialVibeLoaded.current) {
      initialVibeLoaded.current = true;
      discoverGenre("Action");
    }
  }, [activeTab, discoverGenre]);

  React.useEffect(() => {
    const recommendationKey = `${savedLibraryKey}:${taste.join("|")}`;
    if (
      activeTab === "recommendations" &&
      savedLibraryKey &&
      libraryReadyKey === savedLibraryKey &&
      personalTasteLoaded.current !== recommendationKey
    ) {
      personalTasteLoaded.current = recommendationKey;
      buildRecommendations();
    }
  }, [
    activeTab,
    taste,
    savedLibraryKey,
    libraryReadyKey,
    buildRecommendations,
  ]);

  const tabs: { id: FinderTab; label: string; icon: React.ElementType }[] = [
    { id: "scene", label: "Scene Finder", icon: ImageIcon },
    { id: "dialogue", label: "Quotes", icon: Quote },
    { id: "characters", label: "Characters", icon: UserRound },
    { id: "recommendations", label: "Find Anime", icon: Compass },
    { id: "voices", label: "Voice Cast", icon: Mic2 },
  ];
  const activeIntro = TOOL_INTROS[activeTab];

  return (
    <div className="finder-page">
      <SEO
        title="Anime Discovery - Screenshot, Scene and Dialogue Finder"
        description="Identify anime from screenshots, remembered scenes, dialogue, mood, or your saved favorites."
        keywords="anime screenshot search, anime scene finder, anime dialogue search, anime recommendations"
        url="https://animeorbit.web.app/discovery"
      />
      <main className="finder-shell">
        <header className="finder-header">
          <span className="finder-header__icon">
            <WandSparkles size={24} />
          </span>
          <div>
            <span>{activeIntro.kicker}</span>
            <h1>{activeIntro.title}</h1>
            <p>{activeIntro.copy}</p>
          </div>
        </header>

        <nav className="finder-tabs" aria-label="Anime finder tools">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => selectTab(id)}
              aria-current={activeTab === id ? "page" : undefined}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {activeTab === "characters" && <CharacterFinderWorkspace />}
        {activeTab === "voices" && <VoiceCastExplorer />}

        {activeTab === "scene" && (
          <section className="finder-panel finder-panel--workspace finder-panel--scene">
            <div className="discovery-workbench-input">
            <div className="finder-panel__heading">
              <div>
                <span>One scene finder</span>
                <h2>Upload the frame or describe the scene</h2>
                <p>
                  Trace a real screenshot to its exact episode and timestamp, or
                  use remembered details and an optional character clue to build
                  likely matches.
                </p>
              </div>
            </div>
            <div className="finder-screenshot-grid">
              <label
                className="finder-dropzone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  selectImage(event.dataTransfer.files?.[0]);
                }}
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => selectImage(event.target.files?.[0])}
                />
                {imagePreview ? (
                  <>
                    <ProgressiveImage
                      src={imagePreview}
                      alt="Selected anime frame"
                      wrapperClassName="finder-dropzone__preview"
                      className="h-full w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        clearImage();
                      }}
                    >
                      <X size={14} /> Remove
                    </button>
                  </>
                ) : (
                  <>
                    <Upload size={28} />
                    <strong>Drop a screenshot here</strong>
                    <span>or choose JPG, PNG, or WebP</span>
                  </>
                )}
              </label>
              <div className="finder-url">
                <span>Or use a direct image link</span>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(event) => {
                    setImageUrl(event.target.value);
                    if (event.target.value && imageFile) clearImage();
                  }}
                  placeholder="https://example.com/anime-frame.jpg"
                />
                <button
                  onClick={findScreenshot}
                  disabled={traceLoading || (!imageFile && !imageUrl.trim())}
                >
                  {traceLoading ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Search size={16} />
                  )}
                  {traceLoading ? "Checking frame..." : "Find this anime"}
                </button>
                <small>
                  Clean episode frames work best. Cropped borders and compressed
                  uploads are handled automatically.
                </small>
              </div>
            </div>
            </div>
            <div className="discovery-workbench-output">
            <div className="discovery-output-heading">
              <div><span>Results</span><h2>Likely matches</h2></div>
              {(traceResults.length + sceneResults.length + visualMatches.length) > 0 && (
                <strong>{traceResults.length + sceneResults.length + visualMatches.length} found</strong>
              )}
            </div>
            {sceneError && (
              <div className="finder-error">
                <AlertCircle size={17} />
                {sceneError}
              </div>
            )}
            {sceneInsight && (
              <div className="finder-ai-answer">
                <Sparkles size={18} />
                <div>
                  <strong>{sceneInsight.summary}</strong>
                  {sceneInsight.setting && <p>{sceneInsight.setting}</p>}
                  {sceneInsight.characters.length > 0 && (
                    <span>{sceneInsight.characters.join(" · ")}</span>
                  )}
                </div>
              </div>
            )}
            {sceneLoading ? (
              <ResultSkeleton />
            ) : (
              sceneResults.length > 0 && <AnimeResults items={sceneResults} />
            )}
            {traceError && (
              <div className="finder-error">
                <AlertCircle size={17} />
                {traceError}
              </div>
            )}
            {traceLoading ? (
              <ResultSkeleton />
            ) : (
              traceResults.length > 0 && (
                <div className="finder-trace-results">
                  {traceResults.map((result, index) => (
                    <Link
                      to={`/anime/${result.id}`}
                      key={`${result.id}-${index}`}
                    >
                      <ProgressiveImage
                        src={result.image}
                        alt={result.title}
                        wrapperClassName="finder-trace-results__image"
                        className="h-full w-full object-contain"
                      />
                      <div>
                        <span>{result.similarity}% frame match</span>
                        <h3>{result.title}</h3>
                        <div className="finder-trace-meta">
                          <p>Episode {result.episode}</p>
                          <strong className="finder-trace-timestamp">{formatTime(result.time)}</strong>
                        </div>
                      </div>
                      <ArrowRight size={18} />
                    </Link>
                  ))}
                </div>
              )
            )}
            {visualError && (
              <div className="finder-error">
                <AlertCircle size={17} />
                {visualError}
              </div>
            )}
            {(visualLoading || visualInsight) && (
              <div className="finder-ai-answer finder-ai-answer--visual">
                {visualLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <div>
                      <strong>Describing the complete frame…</strong>
                      <p>
                        Reading characters, setting, action, objects, lighting,
                        and visible text.
                      </p>
                    </div>
                  </>
                ) : (
                  visualInsight && (
                    <>
                      <Sparkles size={18} />
                      <div>
                        <strong>
                          {visualInsight.summary || "Visual analysis"}
                        </strong>
                        {visualInsight.setting && (
                          <p>{visualInsight.setting}</p>
                        )}
                        {visualInsight.characters.length > 0 && (
                          <span>
                            <b>Characters:</b>{" "}
                            {visualInsight.characters.join(" · ")}
                          </span>
                        )}
                        {visualInsight.visibleText && (
                          <span>
                            <b>Visible text:</b> {visualInsight.visibleText}
                          </span>
                        )}
                        {visualInsight.visualDetails.length > 0 && (
                          <ul>
                            {visualInsight.visualDetails.map((detail) => (
                              <li key={detail}>{detail}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </>
                  )
                )}
              </div>
            )}
            {!visualLoading && visualMatches.length > 0 && (
              <>
                <div className="finder-result-label">
                  Character and setting matches
                </div>
                <AnimeResults items={visualMatches} />
              </>
            )}
            {!traceLoading && !sceneLoading && !visualLoading && !traceResults.length && !sceneResults.length && !visualMatches.length && !sceneError && !traceError && !visualError && (
              <div className="discovery-output-empty">
                <ImageIcon size={30} />
                <strong>Your matches will appear here</strong>
                <span>Upload a frame or describe the scene on the left.</span>
              </div>
            )}
            </div>
          </section>
        )}

        {activeTab === "recommendations" && (
          <section className="finder-panel finder-panel--workspace finder-panel--recommendations">
            <div className="discovery-workbench-input">
            <div className="finder-panel__heading">
              <div>
                <span>Vibe + your taste</span>
                <h2>Shape the show you want</h2>
                <p>
                  Start with a mood, then tune the qualities. Watching and
                  completed titles are excluded automatically; Plan to Watch
                  remains eligible.
                </p>
              </div>
              <label>
                Genre
                <AppDropdown
                  ariaLabel="Choose anime genre"
                  value={selectedGenre}
                  onChange={discoverGenre}
                  options={GENRES.map((genre) => ({
                    value: genre,
                    label: genre,
                  }))}
                />
              </label>
            </div>
            <div className="finder-vibes">
              {VIBES.map((vibe) => (
                <button
                  key={vibe.genre}
                  onClick={() => discoverGenre(vibe.genre)}
                  aria-pressed={selectedGenre === vibe.genre}
                >
                  <strong>{vibe.label}</strong>
                  <span>{vibe.copy}</span>
                </button>
              ))}
            </div>
            <div className="finder-preference-mixer">
              <header>
                <div>
                  <span>Preference mixer</span>
                  <h3>Balance the genres</h3>
                </div>
                <button
                  type="button"
                  onClick={discoverWeighted}
                  disabled={vibeLoading}
                >
                  <Sparkles size={15} />
                  Use this mix
                </button>
              </header>
              <div>
                {Object.entries(genreWeights).map(([genre, weight]) => (
                  <label key={genre}>
                    <span>
                      {genre}
                      <output>{weight}</output>
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={weight}
                      onChange={(event) =>
                        setGenreWeights((current) => ({
                          ...current,
                          [genre]: Number(event.target.value),
                        }))
                      }
                      style={
                        {
                          "--mix-value": `${weight * 10}%`,
                        } as React.CSSProperties
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
            {savedLibraryIds.length > 0 ? (
              <button
                className="finder-refresh discovery-library-refresh"
                type="button"
                onClick={buildRecommendations}
                disabled={personalLoading || libraryHydrating}
              >
                <RefreshCw size={15} className={personalLoading ? "animate-spin" : ""} />
                Refresh from my library
              </button>
            ) : (
              <p className="discovery-provider-note">Add anime to Favorites or Watchlist to personalize these results.</p>
            )}
            </div>
            <div className="discovery-workbench-output">
            <div className="discovery-output-heading">
              <div><span>Ranked results</span><h2>{taste.length ? `Built around ${taste.join(", ")}` : `${selectedGenre} anime`}</h2></div>
              {vibeResults.length > 0 && <strong>{vibeResults.length} picks</strong>}
            </div>
            {taste.length > 0 && (
              <div className="finder-taste">Based on {taste.map((genre) => <span key={genre}><CheckCircle2 size={13} />{genre}</span>)}</div>
            )}
            {(vibeError || personalError) && (
              <div className="finder-error">
                <AlertCircle size={17} />
                {vibeError || personalError}
              </div>
            )}
            {vibeLoading && !vibeResults.length ? (
              <ResultSkeleton />
            ) : (
              <AnimeResults items={vibeResults} />
            )}
            </div>
          </section>
        )}

        {activeTab === "dialogue" && (
          <section className="finder-panel finder-panel--workspace finder-panel--dialogue">
            <div className="discovery-workbench-input">
            <div className="finder-panel__heading">
              <div>
                <h2>Find anime from a quote</h2>
                <p>
                  Search half a line, a character, or an anime title. Exact
                  episode information is shown only when a source can identify
                  it.
                </p>
              </div>
              <button
                className="finder-refresh"
                type="button"
                onClick={loadRandomQuote}
                disabled={dialogueLoading}
              >
                <RefreshCw size={15} />
                Random quote
              </button>
            </div>
            <form className="finder-search" onSubmit={findDialogue}>
              <Quote size={18} />
              <input
                value={dialogueQuery}
                onChange={(event) => setDialogueQuery(event.target.value)}
                placeholder="Try: set your heart ablaze, Luffy, or Steins;Gate"
              />
              <button disabled={dialogueLoading}>
                {dialogueLoading ? "Searching..." : "Search"}
              </button>
            </form>
            <div className="finder-examples">
              <span>Popular:</span>
              {DIALOGUE_INDEX.slice(0, 4).map((entry) => (
                <button
                  key={entry.line}
                  onClick={() => {
                    setDialogueQuery(entry.line);
                    void findDialogueText(entry.line);
                  }}
                >
                  {entry.line}
                </button>
              ))}
            </div>
            <p className="discovery-provider-note">Search a character name to browse all available lines attributed to that character.</p>
            </div>
            <div className="discovery-workbench-output">
            <div className="discovery-output-heading">
              <div><span>Results</span><h2>Quote matches</h2></div>
              {dialogueResults.length > 0 && <strong>{dialogueResults.length} found</strong>}
            </div>
            {dialogueError && (
              <div className="finder-error">
                <AlertCircle size={17} />
                {dialogueError}
              </div>
            )}
            {dialogueInsight && (
              <div className="finder-ai-answer">
                <Sparkles size={18} />
                <div>
                  <strong>{dialogueInsight.summary}</strong>
                  {dialogueInsight.setting && <p>{dialogueInsight.setting}</p>}
                </div>
              </div>
            )}
            {dialogueLoading ? (
              <div className="finder-dialogue-loading">
                <span />
                <span />
                <span />
              </div>
            ) : (
              <div className="finder-dialogue-results">
                {(dialogueResults.length
                  ? dialogueResults
                  : DIALOGUE_INDEX.slice(0, 6)
                ).map((entry) => (
                  <article key={`${entry.anime}-${entry.line}`}>
                    {entry.characterImage || entry.animeImage ? (
                      <ProgressiveImage
                        src={entry.characterImage || entry.animeImage}
                        alt={entry.character}
                        wrapperClassName="finder-dialogue-results__portrait"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="finder-dialogue-results__portrait is-empty">
                        <Quote size={18} />
                      </span>
                    )}
                    <div>
                      <p>“{entry.line}”</p>
                      <span>
                        {entry.character} · {entry.anime}
                        {entry.episode ? ` · Episode ${entry.episode}` : ""}
                        {entry.confidence
                          ? ` · ${entry.confidence}% match`
                          : ""}
                      </span>
                      {entry.reason && <small>{entry.reason}</small>}
                    </div>
                    <div className="finder-dialogue-results__links">
                      {entry.characterId && (
                        <Link to={`/character/${entry.characterId}`}>
                          Character
                        </Link>
                      )}
                      {entry.id && (
                        <Link to={`/anime/${entry.id}`}>
                          Anime
                          <ArrowRight size={14} />
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
            </div>
          </section>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default NeuralDiscovery;
