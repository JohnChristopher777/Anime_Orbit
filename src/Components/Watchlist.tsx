import React, { useState } from "react";
import { useWatchlist } from "../context/WatchlistContext";
import { useAuth } from "../context/AuthContext";
import AnimeCard from "./AnimeCard";
import AuthModal from "./AuthModal";
import SEO from "./SEO";
import { List, Share2, Copy, Download, ExternalLink, X, Check, LogIn } from "lucide-react";
import { toast } from "react-toastify";

export const Watchlist: React.FC = () => {
  const { watchlist, removeFromWatchlist, loading } = useWatchlist();
  const { currentUser } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
          className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] text-black font-extrabold px-6 py-2.5 rounded-full text-sm font-montserrat shadow-lg hover:scale-105 transition-all cursor-pointer"
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
      ? watchlist
      : watchlist.filter((item) => item.status === activeFilter);

  // Generate clean, sanitized standalone HTML document for sharing
  const generateStandaloneHtml = () => {
    const userTitle = currentUser?.displayName || currentUser?.email?.split("@")[0] || "Anime";
    const escapeHtml = (str: string = "") =>
      str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    const itemsHtml = watchlist
      .map((item) => {
        const title = escapeHtml(item.title || item.title_english || "Untitled");
        const status = escapeHtml(item.status || "Plan to Watch");
        const eps = item.episodes ? `${item.episodes} EPS` : "TV";
        const score = item.score ? `⭐ ${item.score}` : "";
        const img = (item as any).images?.jpg?.large_image_url || item.image || "";

        return `
        <div class="card">
          <div class="img-wrap">
            <img src="${escapeHtml(img)}" alt="${title}" loading="lazy" />
            <span class="status-badge ${status.toLowerCase().replace(/\s+/g, '-')}">${status}</span>
          </div>
          <div class="card-info">
            <h3 class="card-title">${title}</h3>
            <div class="card-meta">
              <span>${eps}</span>
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
  <title>${escapeHtml(userTitle)}'s Anime Watchlist - Anime Orbit</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0e0e11; color: #fff; padding: 2rem 1rem; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { text-align: center; margin-bottom: 2.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1.5rem; }
    h1 { font-size: 2.2rem; color: #ffd700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem; }
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
      <h1>${escapeHtml(userTitle)}'s Watchlist</h1>
      <p class="subtitle">${watchlist.length} Anime Tracked • Generated via Anime Orbit</p>
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
    a.download = `${currentUser?.displayName || "anime"}-watchlist.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Watchlist HTML downloaded!");
  };

  const handleCopyText = () => {
    const text = watchlist
      .map((item, i) => `${i + 1}. ${item.title || item.title_english} [${item.status || "Plan to Watch"}]`)
      .join("\n");
    navigator.clipboard.writeText(`⭐ My Anime Watchlist (${watchlist.length} titles):\n\n${text}`);
    setCopied(true);
    toast.success("Watchlist copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SEO
        title="My Watchlist - Anime Tracker & History"
        description="Track your personal anime watchlist, manage watching status, and save your progress across devices on Anime Orbit."
        keywords="anime watchlist, anime tracker, anime watch progress, Anime Orbit"
        url="https://animeorbit.web.app/watchlist"
      />
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <List size={30} className="text-[#ffd700]" />
          <h1 className="text-2xl sm:text-3xl font-extrabold font-montserrat text-white">
            My Watchlist
          </h1>
          <span className="text-xs font-bold text-neutral-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            {watchlist.length} Anime
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Share Button */}
          <button
            onClick={() => setShareModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ffd700]/15 hover:bg-[#ffd700] border border-[#ffd700]/40 text-[#ffd700] hover:text-black font-montserrat font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer shadow-sm"
          >
            <Share2 size={15} />
            <span>Share Watchlist</span>
          </button>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs font-montserrat font-bold">
            {["All", "Watching", "Plan to Watch", "Completed", "On-Hold", "Dropped"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  activeFilter === filter
                    ? "bg-[#ffd700] text-black font-extrabold shadow-md shadow-[#ffd700]/20"
                    : "bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-[#ffd700] font-montserrat font-bold flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-[#ffd700] border-t-transparent rounded-full animate-spin" />
          <span>Loading your watchlist...</span>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredItems.map((item) => (
            <AnimeCard
              key={item.mal_id}
              anime={item as any}
              onRemove={(animeId) => removeFromWatchlist(animeId)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-neutral-900/40 rounded-2xl border border-white/5 space-y-2">
          <p className="font-montserrat font-bold text-lg text-white">
            No anime in this category
          </p>
          <p className="text-xs text-neutral-400">
            Browse popular or upcoming anime and add them to your tracker!
          </p>
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
                className="w-full flex items-center justify-between p-3.5 bg-[#ffd700] hover:bg-[#ffea00] text-black font-montserrat font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-lg"
              >
                <span className="flex items-center gap-2.5">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? "Copied to Clipboard!" : "Copy List as Text"}</span>
                </span>
                <span className="text-xs opacity-75">{watchlist.length} items</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
