import React, { Suspense, lazy } from "react";
import { createPortal } from "react-dom";
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
  ChevronLeft,
  ChevronRight,
  Play,
  NotebookPen,
  X,
} from "lucide-react";
import { useGlobalContext } from "../context/global";
import HeroCarousel from "./HeroCarousel";
import SEO from "./SEO";
import AnimeRow from "./AnimeRow";
import ProgressiveImage from "./ProgressiveImage";
import CatalogGenreFilter from "./CatalogGenreFilter";
import { getPopularVoiceActors } from "../services/anilist";
import { useWatchlist, type MangaWatchlistItem, type WatchlistItem } from "../context/WatchlistContext";
import ScoreSlider from "./ScoreSlider";
import { nextLinearItem, POPULAR_QUOTE_ROTATION } from "../data/popularQuotes";

import Footer from "./Footer";

const Popular = lazy(() => import("./Popular"));
const SeasonPolls = lazy(() => import("./SeasonPolls"));
const FranchiseRankings = lazy(() => import("./FranchiseRankings"));

const homeProgressTime = (item: WatchlistItem) => {
  const time = Date.parse(item.updatedAt || item.startDate || item.addedAt || "");
  return Number.isFinite(time) ? time : 0;
};

const HomeProgressEditor: React.FC<{
  item: WatchlistItem | MangaWatchlistItem;
  mediaType: "anime" | "manga";
  onClose: () => void;
  onSave: (updates: { progress: number; userScore?: number; progressNotes?: Array<{ progress: number; note: string; createdAt: string }> }) => Promise<void>;
}> = ({ item, mediaType, onClose, onSave }) => {
  const total = Number(mediaType === "manga" ? (item as MangaWatchlistItem).chapters || 0 : item.episodes || 0);
  const unit = mediaType === "manga" ? "chapter" : "episode";
  const [progress, setProgress] = React.useState(Number(item.progress || 0));
  const [score, setScore] = React.useState(Number(item.userScore || 0));
  const [thought, setThought] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const safeProgress = Math.max(0, total > 0 ? Math.min(total, progress) : progress);
  const reachedFinal = total > 0 && safeProgress >= total;

  React.useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updates: { progress: number; userScore?: number; progressNotes?: Array<{ progress: number; note: string; createdAt: string }> } = { progress: safeProgress };
      const cleanThought = thought.trim().slice(0, 600);
      if (cleanThought) {
        updates.progressNotes = [
          ...(Array.isArray(item.progressNotes) ? item.progressNotes : []),
          {
            id: typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            progress: safeProgress,
            note: cleanThought,
            createdAt: new Date().toISOString(),
          },
        ].slice(-100);
      }
      if (reachedFinal && score > 0) updates.userScore = score;
      await onSave(updates);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="home-progress-editor" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form role="dialog" aria-modal="true" aria-labelledby="home-progress-editor-title" onSubmit={submit}>
        <header>
          <div><span>Quick {mediaType === "manga" ? "reading" : "progress"} log</span><h2 id="home-progress-editor-title">{item.title}</h2></div>
          <button type="button" onClick={onClose} aria-label="Close progress editor"><X size={19} /></button>
        </header>
        <div className="home-progress-editor__episode">
          <span>{mediaType === "manga" ? "Chapters read" : "Episodes watched"}</span>
          <div>
            <button type="button" onClick={() => setProgress((value) => Math.max(0, value - 1))} aria-label={`Subtract one ${unit}`}>−</button>
            <input type="number" min={0} max={total || undefined} value={progress} onChange={(event) => setProgress(Math.max(0, Number(event.target.value) || 0))} aria-label={`${unit} progress`} />
            <button type="button" onClick={() => setProgress((value) => total > 0 ? Math.min(total, value + 1) : value + 1)} aria-label={`Add one ${unit}`}>+</button>
          </div>
          <small>{total > 0 ? `of ${total} ${mediaType === "manga" ? "chapters" : "episodes"}` : `Total ${unit} count is not confirmed`}</small>
        </div>
        <label className="home-progress-editor__thought">
          <span>Thought at {unit} {safeProgress}</span>
          <textarea value={thought} maxLength={600} onChange={(event) => setThought(event.target.value)} placeholder={`What stood out at this ${unit}? This will be saved to the title's progress memories.`} />
          <small>Optional · attached to this exact {unit} count</small>
        </label>
        {reachedFinal ? (
          <ScoreSlider id="home-quick-score" label="Final rating" value={score} onChange={setScore} disabled={saving} />
        ) : (
          <p className="home-progress-editor__rating-note">Rating unlocks when you reach the confirmed final {unit}.</p>
        )}
        <footer>
          <Link to={`/watchlist?media=${mediaType}&edit=${item.mal_id}`} onClick={onClose}>Open full {mediaType === "manga" ? "reading list" : "watchlist"}</Link>
          <button type="submit" disabled={saving}><NotebookPen size={16} />{saving ? "Saving…" : "Save progress"}</button>
        </footer>
      </form>
    </div>,
    document.body,
  );
};

const HomeProgressDeck: React.FC = () => {
  const { watchlist, mangaWatchlist, loading, updateWatchlistEntry, updateMangaWatchlistEntry } = useWatchlist();
  const animeCandidates = React.useMemo(
    () =>
      watchlist
        .filter((item) => item.status === "Watching" || item.status === "Caught Up")
        .sort((a, b) => {
          if (Boolean(a.isCurrent) !== Boolean(b.isCurrent)) return a.isCurrent ? -1 : 1;
          const statusA = a.status === "Watching" ? 0 : 1;
          const statusB = b.status === "Watching" ? 0 : 1;
          return statusA - statusB || homeProgressTime(b) - homeProgressTime(a);
        }),
    [watchlist],
  );
  const mangaCandidates = React.useMemo(
    () =>
      mangaWatchlist
        .filter((item) => item.status === "Reading" || item.status === "Caught Up")
        .sort((a, b) => {
          const statusA = a.status === "Reading" ? 0 : 1;
          const statusB = b.status === "Reading" ? 0 : 1;
          return statusA - statusB || homeProgressTime(b) - homeProgressTime(a);
        }),
    [mangaWatchlist],
  );
  // Start with Anime while the watchlists are still hydrating. The fallback
  // effect below moves to Manga only when there truly are no Anime entries.
  const [mediaType, setMediaType] = React.useState<"anime" | "manga">("anime");
  const candidates = mediaType === "anime" ? animeCandidates : mangaCandidates;
  const signature = `${mediaType}:` + candidates.map((item) => `${item.mal_id}:${item.status}:${Boolean(item.isCurrent)}:${item.updatedAt || ""}`).join("|");
  const [deckIds, setDeckIds] = React.useState<number[]>([]);
  const startX = React.useRef<number | null>(null);
  const [dragX, setDragX] = React.useState(0);
  const [sliding, setSliding] = React.useState<"next" | "previous" | null>(null);
  const slideTimer = React.useRef<number | null>(null);
  const mediaSwitchTimer = React.useRef<number | null>(null);
  const mediaSettleTimer = React.useRef<number | null>(null);
  const mediaChosenByUser = React.useRef(false);
  const [mediaSwitching, setMediaSwitching] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<WatchlistItem | MangaWatchlistItem | null>(null);

  React.useEffect(() => {
    if (loading || mediaChosenByUser.current) return;
    // Firestore listeners can resolve a few milliseconds apart. Keep Anime as
    // the true default even if Manga happens to arrive first.
    if (animeCandidates.length && mediaType !== "anime") setMediaType("anime");
    else if (!animeCandidates.length && mangaCandidates.length && mediaType !== "manga") setMediaType("manga");
  }, [loading, mediaType, animeCandidates.length, mangaCandidates.length]);

  React.useEffect(() => {
    const nextIds = candidates.map((item) => item.mal_id);
    setDeckIds((current) => {
      const retained = current.filter((id) => nextIds.includes(id));
      const added = nextIds.filter((id) => !retained.includes(id));
      const currentId = candidates.find((item) => item.isCurrent)?.mal_id;
      const merged = [...retained, ...added];
      if (!currentId) return merged;
      return [currentId, ...merged.filter((id) => id !== currentId)];
    });
  }, [signature]);

  React.useEffect(() => () => {
    if (slideTimer.current !== null) window.clearTimeout(slideTimer.current);
    if (mediaSwitchTimer.current !== null) window.clearTimeout(mediaSwitchTimer.current);
    if (mediaSettleTimer.current !== null) window.clearTimeout(mediaSettleTimer.current);
  }, []);

  const ordered = deckIds
    .map((id) => candidates.find((item) => item.mal_id === id))
    .filter(Boolean) as Array<WatchlistItem | MangaWatchlistItem>;

  const shuffle = (direction: "next" | "previous") => {
    if (sliding || ordered.length < 2) return;
    setSliding(direction);
    slideTimer.current = window.setTimeout(() => {
      setDeckIds((current) => direction === "next"
        ? [...current.slice(1), current[0]]
        : [current[current.length - 1], ...current.slice(0, -1)]);
      setDragX(0);
      setSliding(null);
      slideTimer.current = null;
    }, 230);
  };

  const switchMedia = (nextType: "anime" | "manga") => {
    if (nextType === mediaType || mediaSwitching) return;
    const nextCandidates = nextType === "anime" ? animeCandidates : mangaCandidates;
    if (!nextCandidates.length) return;
    mediaChosenByUser.current = true;
    setMediaSwitching(true);
    mediaSwitchTimer.current = window.setTimeout(() => {
      const nextIds = nextCandidates.map((item) => item.mal_id);
      const currentId = nextCandidates.find((item) => item.isCurrent)?.mal_id;
      setDeckIds(currentId ? [currentId, ...nextIds.filter((entry) => entry !== currentId)] : nextIds);
      setDragX(0);
      setSliding(null);
      setMediaType(nextType);
      mediaSwitchTimer.current = null;
      mediaSettleTimer.current = window.setTimeout(() => {
        setMediaSwitching(false);
        mediaSettleTimer.current = null;
      }, 40);
    }, 140);
  };

  if (loading || (!animeCandidates.length && !mangaCandidates.length) || ordered.length === 0) return null;

  return (
    <section className="home-progress" aria-labelledby="home-progress-title">
      <header className="home-progress__header">
        <div>
          <span><Play size={14} fill="currentColor" /> Your active queue</span>
          <div className="home-progress__headline">
            <h2 id="home-progress-title">Any progress?</h2>
            <div className="home-progress__headline-actions">
              {animeCandidates.length > 0 && mangaCandidates.length > 0 && (
                <div className="home-progress__media-toggle" aria-label="Choose progress media">
                  <button type="button" className={mediaType === "anime" ? "is-active" : ""} onClick={() => switchMedia("anime")} disabled={mediaSwitching}>Anime</button>
                  <button type="button" className={mediaType === "manga" ? "is-active" : ""} onClick={() => switchMedia("manga")} disabled={mediaSwitching}>Manga</button>
                </div>
              )}
              <span className="home-progress__count">{ordered.length} active</span>
              <div className="home-progress__controls" aria-label="Active title controls">
                <button type="button" className="home-progress__shuffle" aria-label="Previous active title" onClick={() => shuffle("previous")} disabled={ordered.length < 2 || Boolean(sliding)}>
                  <ChevronLeft size={20} />
                </button>
                <button type="button" className="home-progress__shuffle" aria-label="Next active title" onClick={() => shuffle("next")} disabled={ordered.length < 2 || Boolean(sliding)}>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
          <p>Swipe the deck, then open a title to log where you are.</p>
        </div>
      </header>

      <div className="home-progress__deck-wrap">
        <div className="home-progress__deck" aria-live="polite" data-sliding={sliding || undefined} data-media-switching={mediaSwitching || undefined}>
          {ordered.slice(0, 3).map((item, position) => {
            const progress = Number(item.progress || 0);
            const total = Number(mediaType === "manga" ? (item as MangaWatchlistItem).chapters || 0 : item.episodes || 0);
            const percent = total > 0 ? Math.min(100, (progress / total) * 100) : 0;
            return (
              <article
                key={`${mediaType}-${item.mal_id}`}
                className={`home-progress__card ${position === 0 ? "is-front" : ""}`}
                style={{
                  "--deck-position": position,
                  "--swipe-x": position === 0 ? `${dragX}px` : "0px",
                } as React.CSSProperties}
                onPointerDown={position === 0 ? (event) => {
                  startX.current = event.clientX;
                  event.currentTarget.setPointerCapture(event.pointerId);
                } : undefined}
                onPointerMove={position === 0 ? (event) => {
                  if (startX.current !== null) setDragX(event.clientX - startX.current);
                } : undefined}
                onPointerUp={position === 0 ? (event) => {
                  const releasedX = startX.current === null ? dragX : event.clientX - startX.current;
                  if (Math.abs(releasedX) >= 55) shuffle(releasedX < 0 ? "next" : "previous");
                  else setDragX(0);
                  startX.current = null;
                } : undefined}
                onPointerCancel={position === 0 ? () => {
                  startX.current = null;
                  setDragX(0);
                } : undefined}
              >
                <ProgressiveImage
                  src={item.image_url || item.image}
                  alt=""
                  wrapperClassName="home-progress__backdrop"
                  className="h-full w-full object-cover"
                />
                <div className="home-progress__scrim" />
                <ProgressiveImage
                  src={item.image_url || item.image}
                  alt={`${item.title} poster`}
                  wrapperClassName="home-progress__poster"
                  className="h-full w-full object-cover"
                />
                <div className="home-progress__content">
                  <div className="home-progress__badges">
                    <span data-status={item.status === "Caught Up" ? "caught-up" : "watching"}>{item.status}</span>
                    {mediaType === "anime" && item.isCurrent && <b>Current</b>}
                  </div>
                  <h3><Link to={`/${mediaType}/${item.mal_id}`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>{item.title}</Link></h3>
                  <p>{progress}{total > 0 ? ` of ${total}` : ""} {mediaType === "manga" ? "chapters read" : "episodes watched"}</p>
                  <div className="home-progress__bar" aria-label={`${Math.round(percent)} percent complete`}><i style={{ width: `${percent}%` }} /></div>
                  <button type="button" className="home-progress__log" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); setEditingItem(item); }}>
                    <NotebookPen size={16} /> Log progress
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      {editingItem && <HomeProgressEditor key={`${mediaType}-${editingItem.mal_id}`} item={editingItem} mediaType={mediaType} onClose={() => setEditingItem(null)} onSave={(updates) => mediaType === "manga" ? updateMangaWatchlistEntry(editingItem.mal_id, updates) : updateWatchlistEntry(editingItem.mal_id, updates)} />}
    </section>
  );
};

type HomeQuote = { line: string; character: string; anime: string };
type VoiceConnection = {
  actor: { id: number; name: string };
  first: {
    characterId: number;
    character: string;
    characterImage?: string;
    animeId: number;
    anime: string;
  };
  second: {
    characterId: number;
    character: string;
    characterImage?: string;
    animeId: number;
    anime: string;
  };
};

const DiscoverySpotlight: React.FC = () => {
  const [quote, setQuote] = React.useState<HomeQuote>(POPULAR_QUOTE_ROTATION[0]);
  const [voiceFact, setVoiceFact] = React.useState<VoiceConnection | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setQuote(nextLinearItem(POPULAR_QUOTE_ROTATION, "popular-quotes") || POPULAR_QUOTE_ROTATION[0]);
    const castResult = await Promise.resolve(getPopularVoiceActors(12, "Japanese"))
      .then((value) => ({ status: "fulfilled" as const, value }))
      .catch((reason) => ({ status: "rejected" as const, reason }));

    if (castResult.status === "fulfilled") {
      const connections = castResult.value.flatMap((actor: any) => {
        const roles = [
          ...new Map(
            (actor.characterMedia?.edges || [])
              .flatMap((edge: any) =>
                (edge.characters || []).map((character: any) => [
                  character.id,
                  {
                    characterId: character.id,
                    character: character.name?.full,
                    characterImage:
                      character.image?.large || character.image?.medium,
                    animeId: edge.node?.id,
                    anime:
                      edge.node?.title?.english || edge.node?.title?.romaji,
                  },
                ]),
              )
              .filter(([id]: any) => id),
          ).values(),
        ] as any[];
        if (roles.length < 2) return [];
        return [
          {
            actor: { id: actor.id, name: actor.name?.full },
            first: roles[0],
            second:
              roles.find((role) => role.animeId !== roles[0].animeId) ||
              roles[1],
          },
        ];
      });
      if (connections.length)
        setVoiceFact(nextLinearItem(connections, "popular-voice-facts") || connections[0]);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <section
      id="home-discovery"
      className="home-discovery-pulse"
      aria-labelledby="home-discovery-title"
    >
      <header>
        <div>
          <span>
            <Sparkles size={15} /> Discovery pulse
          </span>
          <h2 id="home-discovery-title">A new trail into anime</h2>
          <p>
            Follow a quote, connect familiar voices, or open the complete
            discovery workspace.
          </p>
        </div>
        <div className="home-discovery-pulse__actions">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            New facts
          </button>
          <Link to="/discovery">
            Explore Discovery <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <div className="home-discovery-pulse__grid">
        <article className="home-discovery-quote">
          <Quote size={25} />
          <div>
            <span>Popular quote trail</span>
            <blockquote>“{quote.line}”</blockquote>
            <p>
              {quote.character} <small>from {quote.anime}</small>
            </p>
          </div>
          <Link to="/discovery?tool=dialogue" aria-label="Open quote search">
            <ArrowRight size={18} />
          </Link>
        </article>

        <article className="home-discovery-voice">
          <div
            className="home-discovery-voice__characters"
            aria-label="Connected characters"
          >
            {voiceFact ? (
              <>
                <Link
                  to={`/character/${voiceFact.first.characterId}`}
                  aria-label={`Open ${voiceFact.first.character}`}
                  title={voiceFact.first.character}
                >
                  <ProgressiveImage
                    src={voiceFact.first.characterImage}
                    fallbackSrc="/noimage.jpg"
                    alt={voiceFact.first.character}
                    wrapperClassName="home-discovery-voice__character"
                    className="h-full w-full object-contain"
                  />
                </Link>
                <Link
                  to={`/character/${voiceFact.second.characterId}`}
                  aria-label={`Open ${voiceFact.second.character}`}
                  title={voiceFact.second.character}
                >
                  <ProgressiveImage
                    src={voiceFact.second.characterImage}
                    fallbackSrc="/noimage.jpg"
                    alt={voiceFact.second.character}
                    wrapperClassName="home-discovery-voice__character"
                    className="h-full w-full object-contain"
                  />
                </Link>
              </>
            ) : (
              <>
                <div className="home-discovery-voice__character">
                  <User size={25} />
                </div>
                <div className="home-discovery-voice__character">
                  <User size={25} />
                </div>
              </>
            )}
          </div>
          <div>
            <span>
              <Mic2 size={14} /> Did you know?
            </span>
            {voiceFact ? (
              <p>
                The same Japanese voice actor,{" "}
                <Link
                  className="home-discovery-voice__actor-link"
                  to={`/voice-actor/${voiceFact.actor.id}`}
                >
                  {voiceFact.actor.name}
                </Link>
                , voiced{" "}
                <Link to={`/character/${voiceFact.first.characterId}`}>
                  {voiceFact.first.character}
                </Link>{" "}
                in{" "}
                <Link to={`/anime/${voiceFact.first.animeId}`}>
                  {voiceFact.first.anime}
                </Link>{" "}
                and{" "}
                <Link to={`/character/${voiceFact.second.characterId}`}>
                  {voiceFact.second.character}
                </Link>{" "}
                in{" "}
                <Link to={`/anime/${voiceFact.second.animeId}`}>
                  {voiceFact.second.anime}
                </Link>
                .
              </p>
            ) : (
              <p>
                Explore Japanese voice actors and discover the characters they
                connect across different anime.
              </p>
            )}
          </div>
          <Link
            to="/discovery?tool=voices"
            aria-label="Open voice cast explorer"
          >
            <ArrowRight size={18} />
          </Link>
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
        <HomeProgressDeck />
        <div className="home-catalog__filter">
          <div>
            <strong>Choose your genre</strong>
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
            <h2 id="feature-guide-title">Explore Anime Orbit</h2>
            <p>
              Discover anime and manga, follow episode and chapter guides, and
              keep your watchlists, reviews, and community activity together.
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
        title="Anime Orbit | Anime & Manga Discovery, Guides & Tracking"
        description="Anime Orbit helps you discover anime and manga, browse episode and chapter guides, track watchlists, build tier lists, and join community discussions."
        keywords="Anime Orbit, anime and manga discovery, anime database, manga database, episode guides, chapter guides, anime watchlist, manga tracker, anime tier lists"
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
