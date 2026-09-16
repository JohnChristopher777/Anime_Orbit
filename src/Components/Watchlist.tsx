import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useWatchlist, type WatchlistItem, type MangaWatchlistItem } from "../context/WatchlistContext";
import { useAuth } from "../context/AuthContext";
import AnimeCard from "./AnimeCard";
import ProgressiveImage from "./ProgressiveImage";
import AuthModal from "./AuthModal";
import SEO from "./SEO";
import { List, Share2, Copy, Download, ExternalLink, X, Check, LogIn, Plus, Search, Save, Trash2, NotebookPen } from "lucide-react";
import { toast } from "react-toastify";
import { getPopularAnime, getPopularManga, searchAnime, searchManga } from "../services/anilist";
import AppDropdown from "./AppDropdown";

interface TrackerFieldsProps {
  item: WatchlistItem | MangaWatchlistItem;
  mediaType: "anime" | "manga";
  onSave: (updates: { status?: string; startDate?: string; endDate?: string; personalNotes?: string }) => Promise<void>;
}

const statusToken = (status = "") => status.toLowerCase().replace(/\s+/g, "-");

const trackerTimestamp = (item: WatchlistItem | MangaWatchlistItem) => {
  const timestamp = Date.parse(item.startDate || item.addedAt || "9999-12-31");
  return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
};

const TrackerFields: React.FC<TrackerFieldsProps> = ({ item, mediaType, onSave }) => {
  const [status, setStatus] = useState(item.status || (mediaType === "manga" ? "Plan to Read" : "Plan to Watch"));
  const [startDate, setStartDate] = useState(item.startDate || "");
  const [endDate, setEndDate] = useState(item.endDate || "");
  const [personalNotes, setPersonalNotes] = useState(item.personalNotes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (startDate && endDate && endDate < startDate) {
      toast.error("Finish date cannot be before the start date");
      return;
    }
    setSaving(true);
    try {
      await onSave({ status, startDate, endDate, personalNotes: personalNotes.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tracker-fields">
      <div className="tracker-fields__body">
        <label className="tracker-fields__status">
          <span>Status</span>
          <AppDropdown ariaLabel={`${mediaType} tracking status`} value={status} onChange={setStatus} options={(mediaType === "manga" ? ["Plan to Read", "Reading", "Caught Up", "Completed", "On-Hold", "Dropped"] : ["Plan to Watch", "Watching", "Caught Up", "Completed", "On-Hold", "Dropped"]).map((option) => ({ value: option, label: option }))} />
        </label>
        <div className="tracker-fields__dates">
          <label><span>Started</span><input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label><span>Finished</span><input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} /></label>
        </div>
        <label className="tracker-fields__notes"><span>Personal notes</span><textarea rows={2} maxLength={800} value={personalNotes} onChange={(event) => setPersonalNotes(event.target.value)} placeholder={mediaType === "manga" ? "Last chapter, favorite panel, thoughts..." : "Last episode, favorite arc, thoughts..."} /></label>
        <button type="button" onClick={handleSave} disabled={saving}><Save size={13} /> {saving ? "Saving..." : "Save changes"}</button>
      </div>
    </div>
  );
};

export const Watchlist: React.FC = () => {
  const {
    watchlist,
    mangaWatchlist,
    removeFromWatchlist,
    removeMangaFromWatchlist,
    updateWatchlistEntry,
    updateMangaWatchlistEntry,
    addToWatchlist,
    addMangaToWatchlist,
    loading,
  } = useWatchlist();
  const { currentUser } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [activeMangaFilter, setActiveMangaFilter] = useState<string>("All");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mediaTab, setMediaTab] = useState<"anime" | "manga">("anime");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [addResults, setAddResults] = useState<any[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [expandedTracker, setExpandedTracker] = useState<string | null>(null);

  useEffect(() => {
    if (!addModalOpen) {
      setAddResults([]);
      return;
    }
    let current = true;
    const timer = window.setTimeout(async () => {
      setAddLoading(true);
      try {
        const query = addQuery.trim();
        const existing = mediaTab === "anime" ? watchlist : mangaWatchlist;
        const existingIds = new Set(existing.map((item) => item.mal_id));
        const tasteGenres = new Set(existing.flatMap((item: any) => (item.genres || []).map((genre: any) => typeof genre === "string" ? genre : genre?.name).filter(Boolean)));
        const rawResults = query.length >= 2
          ? (mediaTab === "anime" ? await searchAnime(query, 16) : await searchManga(query, 16))
          : (mediaTab === "anime" ? (await getPopularAnime(30, 1)).media : (await getPopularManga(1, 30, "POPULARITY_DESC")).media);
        const results = (Array.isArray(rawResults) ? rawResults : [])
          .filter((item) => !existingIds.has(item.mal_id))
          .sort((a, b) => {
            if (query.length >= 2) return 0;
            const affinity = (item: any) => (item.genres || []).filter((genre: any) => tasteGenres.has(typeof genre === "string" ? genre : genre?.name)).length;
            return affinity(b) - affinity(a) || Number(b.score || 0) - Number(a.score || 0);
          })
          .slice(0, 12);
        if (current) setAddResults(results);
      } catch {
        if (current) setAddResults([]);
      } finally {
        if (current) setAddLoading(false);
      }
    }, addQuery.trim().length >= 2 ? 300 : 0);
    return () => { current = false; window.clearTimeout(timer); };
  }, [addModalOpen, addQuery, mediaTab, watchlist, mangaWatchlist]);

  const animeRank = useMemo(() => new Map(
    [...watchlist].sort((a, b) => trackerTimestamp(a) - trackerTimestamp(b)).map((item, index) => [item.mal_id, index + 1]),
  ), [watchlist]);
  const mangaRank = useMemo(() => new Map(
    [...mangaWatchlist].sort((a, b) => trackerTimestamp(a) - trackerTimestamp(b)).map((item, index) => [item.mal_id, index + 1]),
  ), [mangaWatchlist]);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <SEO
          title="My Watchlist - Anime Tracker & History"
          description="Track your personal anime watchlist, manage watching status, and save your progress across devices on Anime Orbit."
          keywords="anime watchlist, anime tracker, anime watch progress, Anime Orbit"
          url="https://animeorbit.web.app/watchlist"
        />
        <List size={56} className="mx-auto text-[#ffd700]" />
        <h2 className="text-3xl font-extrabold font-montserrat text-white">
          My Anime Watchlist
        </h2>
        <p className="text-neutral-400 text-sm max-w-md mx-auto">
          Sign in to track your personal anime watchlist, manage watching status, and save your progress across devices.
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] text-black font-bold px-6 py-2.5 rounded-full text-sm font-montserrat shadow-lg hover:scale-105 transition-all cursor-pointer"
        >
          <LogIn size={16} />
          <span>Sign In to View Watchlist</span>
        </button>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  const filteredItems =
    activeFilter === "All"
      ? [...watchlist].sort((a, b) => trackerTimestamp(a) - trackerTimestamp(b))
      : watchlist.filter((item) => item.status === activeFilter).sort((a, b) => trackerTimestamp(a) - trackerTimestamp(b));
  const filteredMangaItems =
    activeMangaFilter === "All"
      ? [...mangaWatchlist].sort((a, b) => trackerTimestamp(a) - trackerTimestamp(b))
      : mangaWatchlist.filter((item) => item.status === activeMangaFilter).sort((a, b) => trackerTimestamp(a) - trackerTimestamp(b));
  const sharedItems: (WatchlistItem | MangaWatchlistItem)[] = mediaTab === "manga" ? mangaWatchlist : watchlist;
  const sharedListLabel = mediaTab === "manga" ? "Manga Reading List" : "Anime Watchlist";

  // Generate clean, sanitized standalone HTML document for sharing
  const generateStandaloneHtml = () => {
    const userTitle = currentUser?.displayName || currentUser?.email?.split("@")[0] || "Anime Master";
    const userAvatar = currentUser?.photoURL || "";
    const escapeHtml = (str: string = "") =>
      str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    const itemsHtml = sharedItems
      .map((item) => {
        const title = escapeHtml(item.title || item.title_english || "Untitled");
        const status = escapeHtml(item.status || (mediaTab === "manga" ? "Plan to Read" : "Plan to Watch"));
        const progressLabel = mediaTab === "manga"
          ? ((item as MangaWatchlistItem).chapters ? `${(item as MangaWatchlistItem).chapters} chapters` : (item as MangaWatchlistItem).format || "Manga")
          : (item.episodes ? `${item.episodes} EPS` : item.type || "TV");
        const score = item.score ? `⭐ ${item.score}` : "";
        const img = (item as any).images?.jpg?.large_image_url || item.image_url || item.image || "";

        return `
        <div class="card">
          <div class="img-wrap">
            <img src="${escapeHtml(img)}" alt="${title}" loading="lazy" />
            <span class="status-badge ${status.toLowerCase().replace(/\s+/g, '-')}">${status}</span>
          </div>
          <div class="card-info">
            <h3 class="card-title">${title}</h3>
            <div class="card-meta">
              <span>${escapeHtml(String(progressLabel))}</span>
              <span class="score">${score}</span>
            </div>
          </div>
        </div>`;
      })
      .join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(userTitle)}'s ${sharedListLabel} - Anime Orbit</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0e0e11; color: #fff; padding: 2rem 1rem; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; text-align: center; margin-bottom: 2.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1.5rem; }
    .user-badge { display: flex; align-items: center; gap: 0.75rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,215,0,0.3); padding: 0.5rem 1.2rem; border-radius: 50px; }
    .user-avatar { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid #ffd700; }
    .avatar-fallback { width: 42px; height: 42px; border-radius: 50%; background: #ffd700; color: #000; font-weight: 900; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
    h1 { font-size: 2.2rem; color: #ffd700; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
    .subtitle { color: #a0a0a0; font-size: 0.9rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; }
    .card { background: #1a1a20; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,215,0,0.2); transition: transform 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
    .card:hover { transform: translateY(-4px); border-color: #ffd700; }
    .img-wrap { position: relative; width: 100%; aspect-ratio: 2/3; background: #121216; overflow: hidden; }
    .img-wrap img { width: 100%; height: 100%; object-fit: cover; }
    .status-badge { position: absolute; top: 8px; right: 8px; font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 20px; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.2); text-transform: uppercase; }
    .status-badge.watching { color: #60a5fa; border-color: #60a5fa; }
    .status-badge.completed { color: #4ade80; border-color: #4ade80; }
    .status-badge.plan-to-watch { color: #ffd700; border-color: #ffd700; }
    .status-badge.on-hold { color: #fbbf24; border-color: #fbbf24; }
    .status-badge.dropped { color: #f87171; border-color: #f87171; }
    .card-info { padding: 0.9rem; }
    .card-title { font-size: 0.9rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 2.4rem; line-height: 1.2rem; }
    .card-meta { display: flex; justify-content: space-between; font-size: 0.75rem; color: #888; font-weight: 600; }
    .score { color: #ffd700; font-weight: 700; }
    footer { text-align: center; margin-top: 3rem; color: #666; font-size: 0.8rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.5rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="user-badge">
        ${
          userAvatar
            ? `<img src="${escapeHtml(userAvatar)}" alt="${escapeHtml(userTitle)}" class="user-avatar" />`
            : `<div class="avatar-fallback">${escapeHtml(userTitle[0]?.toUpperCase() || "U")}</div>`
        }
        <div style="text-align: left;">
          <div style="font-weight: 800; color: #fff; font-size: 0.95rem;">${escapeHtml(userTitle)}</div>
          <div style="font-size: 0.75rem; color: #a0a0a0;">Shared anime list</div>
        </div>
      </div>
      <h1>${escapeHtml(userTitle)}'s ${sharedListLabel}</h1>
      <p class="subtitle">${sharedItems.length} ${mediaTab === "manga" ? "Manga" : "Anime"} Tracked • Generated via Anime Orbit</p>
    </header>
    <div class="grid">
      ${itemsHtml}
    </div>
    <footer>
      <p>© ${new Date().getFullYear()} Anime Orbit - All anime data belongs to their respective creators.</p>
    </footer>
  </div>
</body>
</html>`;
  };

  const handleOpenHtml = () => {
    const html = generateStandaloneHtml();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const handleDownloadHtml = () => {
    const html = generateStandaloneHtml();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentUser?.displayName || "anime"}-${mediaTab === "manga" ? "manga-list" : "watchlist"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Watchlist HTML downloaded!");
  };

  const handleCopyText = () => {
    const text = sharedItems
      .map((item, i) => `${i + 1}. ${item.title || item.title_english} [${item.status || (mediaTab === "manga" ? "Plan to Read" : "Plan to Watch")}]`)
      .join("\n");
    navigator.clipboard.writeText(`⭐ My ${sharedListLabel} (${sharedItems.length} titles):\n\n${text}`);
    setCopied(true);
    toast.success("Watchlist copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-12 space-y-4">
      <SEO
        title="My Watchlist - Anime Tracker & History"
        description="Track your personal anime watchlist, manage watching status, and save your progress across devices on Anime Orbit."
        keywords="anime watchlist, anime tracker, anime watch progress, Anime Orbit"
        url="https://animeorbit.web.app/watchlist"
      />
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3 flex-wrap">
          <List size={30} className="text-[#ffd700]" />
          <h1 className="text-2xl sm:text-3xl font-bold font-montserrat text-white">
            My Watchlist
          </h1>
          <span className="text-xs font-bold text-neutral-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            {mediaTab === "anime" ? `${watchlist.length} Anime` : `${mangaWatchlist.length} Manga`}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-full border border-white/10 bg-white/5 p-1 text-xs font-bold">
            <button onClick={() => setMediaTab("anime")} className={`px-4 py-2 rounded-full ${mediaTab === "anime" ? "bg-[#ffd700] text-black" : "text-neutral-300"}`}>Anime</button>
            <button onClick={() => setMediaTab("manga")} className={`px-4 py-2 rounded-full ${mediaTab === "manga" ? "bg-[#ffd700] text-black" : "text-neutral-300"}`}>Manga</button>
          </div>
          <button onClick={() => { setAddQuery(""); setAddResults([]); setAddModalOpen(true); }} className="inline-flex items-center gap-1.5 rounded-full bg-[#ffd700] px-3.5 py-2 text-xs font-bold text-black">
            <Plus size={15} /> Add {mediaTab === "anime" ? "Anime" : "Manga"}
          </button>
          <button
            onClick={() => setShareModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ffd700]/15 hover:bg-[#ffd700] border border-[#ffd700]/40 text-[#ffd700] hover:text-black font-montserrat font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer shadow-sm"
          >
            <Share2 size={15} />
            <span>Share Watchlist</span>
          </button>
        </div>
      </div>

      {mediaTab === "anime" && (
        <div className="tracker-filters">
          {["All", "Watching", "Caught Up", "Plan to Watch", "Completed", "On-Hold", "Dropped"].map((filter) => (
            <button key={filter} data-status={statusToken(filter)} onClick={() => setActiveFilter(filter)} className={activeFilter === filter ? "is-active" : ""}>{filter}</button>
          ))}
        </div>
      )}

      {mediaTab === "manga" && (
        <div className="tracker-filters">
          {["All", "Reading", "Caught Up", "Plan to Read", "Completed", "On-Hold", "Dropped"].map((filter) => (
            <button key={filter} data-status={statusToken(filter)} onClick={() => setActiveMangaFilter(filter)} className={activeMangaFilter === filter ? "is-active" : ""}>{filter}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="tracker-grid" aria-label="Loading watchlist">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-44 rounded-xl bg-white/[0.05] animate-pulse" />)}
        </div>
      ) : mediaTab === "anime" && filteredItems.length > 0 ? (
        <div className="tracker-grid">
          {filteredItems.map((item) => (
            <div key={item.mal_id} data-status={statusToken(item.status || "Plan to Watch")} className={`tracker-card ${expandedTracker === `anime-${item.mal_id}` ? "is-open" : ""}`}>
              <span className="tracker-card__rank" title="Order by start date">#{animeRank.get(item.mal_id)}</span>
              <div className="tracker-card__media">
                <AnimeCard compact anime={item as any} onRemove={(animeId) => removeFromWatchlist(animeId)} />
                <button className="tracker-card__note" type="button" aria-label={`Edit notes for ${item.title}`} aria-expanded={expandedTracker === `anime-${item.mal_id}`} onClick={() => setExpandedTracker((current) => current === `anime-${item.mal_id}` ? null : `anime-${item.mal_id}`)}><NotebookPen size={14} /></button>
              </div>
              {expandedTracker === `anime-${item.mal_id}` ? <TrackerFields mediaType="anime" item={item} onSave={async (updates) => { await updateWatchlistEntry(item.mal_id, updates as any); setExpandedTracker(null); }} /> : <div className="tracker-card__summary"><span>{item.status || "Plan to Watch"}</span><p>{item.personalNotes || "Add a note"}</p><small>{item.startDate ? `Started ${item.startDate}` : "No start date"}</small></div>}
            </div>
          ))}
        </div>
      ) : mediaTab === "manga" && filteredMangaItems.length > 0 ? (
        <div className="tracker-grid">
          {filteredMangaItems.map((item) => (
            <div key={item.mal_id} data-status={statusToken(item.status || "Plan to Read")} className={`tracker-card ${expandedTracker === `manga-${item.mal_id}` ? "is-open" : ""}`}>
              <span className="tracker-card__rank" title="Order by start date">#{mangaRank.get(item.mal_id)}</span>
              <div className="tracker-card__media">
                <Link to={`/manga/${item.mal_id}`} className="group block">
                  <ProgressiveImage src={item.image_url || item.image} alt={item.title} wrapperClassName="aspect-[2/3] rounded-xl" className="w-full h-full object-cover group-hover:scale-[1.02]" />
                  <div className="pt-2"><h3 className="font-montserrat font-bold text-xs text-white line-clamp-2">{item.title}</h3><p className="text-[10px] text-neutral-400 mt-1">{item.chapters ? `${item.chapters} chapters` : item.format || "Manga"}{item.score ? ` · ★ ${item.score}` : ""}</p></div>
                </Link>
                <button onClick={() => removeMangaFromWatchlist(item.mal_id)} className="tracker-card__remove" aria-label={`Remove ${item.title}`} title="Remove from list"><Trash2 size={13} /></button>
                <button className="tracker-card__note" type="button" aria-label={`Edit notes for ${item.title}`} aria-expanded={expandedTracker === `manga-${item.mal_id}`} onClick={() => setExpandedTracker((current) => current === `manga-${item.mal_id}` ? null : `manga-${item.mal_id}`)}><NotebookPen size={14} /></button>
              </div>
              {expandedTracker === `manga-${item.mal_id}` ? <TrackerFields mediaType="manga" item={item} onSave={async (updates) => { await updateMangaWatchlistEntry(item.mal_id, updates as any); setExpandedTracker(null); }} /> : <div className="tracker-card__summary"><span>{item.status || "Plan to Read"}</span><p>{item.personalNotes || "Add a note"}</p><small>{item.startDate ? `Started ${item.startDate}` : "No start date"}</small></div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-neutral-900/40 rounded-2xl border border-white/5 space-y-2">
          <p className="font-montserrat font-bold text-lg text-white">
            No {mediaTab} in this list
          </p>
          <p className="text-xs text-neutral-400">
            Use “Add {mediaTab === "anime" ? "Anime" : "Manga"}” to search and start tracking.
          </p>
        </div>
      )}

      {addModalOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 p-4" onMouseDown={() => setAddModalOpen(false)}>
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#17171d] p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div><h2 className="font-montserrat font-bold text-xl text-white">Add {mediaTab === "anime" ? "Anime" : "Manga"}</h2><p className="text-xs text-neutral-400 mt-1">Search for a title or pick from recommendations made for your list.</p></div>
              <button onClick={() => setAddModalOpen(false)} className="p-2 text-neutral-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input autoFocus value={addQuery} onChange={(event) => setAddQuery(event.target.value)} placeholder={`Search ${mediaTab} titles...`} className="w-full rounded-xl border border-white/15 bg-black/30 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-[#ffd700]" />
            </div>
            <div className="mt-4 max-h-[55vh] overflow-y-auto space-y-2 pr-1">
              {!addLoading && addQuery.trim().length < 2 && addResults.length > 0 && <p className="px-1 pb-1 text-[11px] font-bold uppercase tracking-wide text-[#ffd700]">Recommended for you</p>}
              {addLoading ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-20 rounded-xl bg-white/5 animate-pulse" />) : addResults.map((item) => {
                const alreadyAdded = mediaTab === "anime"
                  ? watchlist.some((entry) => entry.mal_id === item.mal_id)
                  : mangaWatchlist.some((entry) => entry.mal_id === item.mal_id);
                return (
                  <div key={item.mal_id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                    <ProgressiveImage src={item.images?.jpg?.image_url} alt="" wrapperClassName="w-12 h-16 rounded-lg flex-shrink-0" className="w-full h-full object-cover" />
                    <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold text-white">{item.title}</h3><p className="mt-1 text-xs text-neutral-400">{item.type || item.format || mediaTab}{item.score ? ` • ★ ${item.score}` : ""}</p></div>
                    <button
                      disabled={alreadyAdded || addingId === item.mal_id}
                      aria-label={alreadyAdded ? `${item.title} is already tracked` : `Add ${item.title}`}
                      onClick={async () => {
                        setAddingId(item.mal_id);
                        try {
                          if (mediaTab === "anime") await addToWatchlist(item);
                          else await addMangaToWatchlist(item);
                        } finally {
                          setAddingId(null);
                        }
                      }}
                      className={`rounded-full px-3 py-2 text-xs font-bold ${alreadyAdded ? "bg-emerald-500/15 text-emerald-300" : "bg-[#ffd700] text-black"} disabled:cursor-default disabled:opacity-70`}
                    >
                      {alreadyAdded ? <Check size={14} /> : addingId === item.mal_id ? <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" /> : <Plus size={14} />}
                    </button>
                  </div>
                );
              })}
              {!addLoading && addQuery.trim().length >= 2 && addResults.length === 0 && <p className="py-8 text-center text-sm text-neutral-500">No matches found.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#ffd700]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-montserrat font-extrabold text-lg text-[#ffd700] flex items-center gap-2">
                <Share2 size={18} />
                <span>Share Your Watchlist</span>
              </h3>
              <button
                onClick={() => setShareModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Export and share your customized anime collection with friends or open it as a standalone HTML page.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleOpenHtml}
                className="w-full flex items-center justify-between p-3.5 bg-white/5 hover:bg-[#ffd700]/10 border border-white/10 hover:border-[#ffd700] rounded-xl text-white hover:text-[#ffd700] font-montserrat font-bold text-sm transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <ExternalLink size={16} />
                  <span>Open Standalone HTML Page</span>
                </span>
                <span className="text-xs text-neutral-400">Preview</span>
              </button>

              <button
                onClick={handleDownloadHtml}
                className="w-full flex items-center justify-between p-3.5 bg-white/5 hover:bg-[#ffd700]/10 border border-white/10 hover:border-[#ffd700] rounded-xl text-white hover:text-[#ffd700] font-montserrat font-bold text-sm transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Download size={16} />
                  <span>Download HTML File</span>
                </span>
                <span className="text-xs text-neutral-400">Save offline</span>
              </button>

              <button
                onClick={handleCopyText}
                className="w-full flex items-center justify-between p-3.5 bg-[#ffd700] hover:bg-[#ffea00] text-black font-montserrat font-bold text-sm rounded-xl transition-all cursor-pointer shadow-lg"
              >
                <span className="flex items-center gap-2.5">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? "Copied to Clipboard!" : "Copy List as Text"}</span>
                </span>
                <span className="text-xs opacity-75">{sharedItems.length} items</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
