import React, { useState, useEffect } from "react";
import { useFavourites } from "../context/FavouritesContext";
import { useAuth } from "../context/AuthContext";
import AnimeCard from "./AnimeCard";
import AuthModal from "./AuthModal";
import {
  Heart,
  LogIn,
  Layers,
  Grid,
  Plus,
  Trash2,
  Share2,
  Download,
  ExternalLink,
  Copy,
  Check,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

interface Tier {
  id: string;
  name: string;
  color: string;
  textColor: string;
  animeIds: number[];
}

const DEFAULT_TIERS: Tier[] = [
  { id: "S", name: "S", color: "#ff7f7f", textColor: "#000", animeIds: [] },
  { id: "A", name: "A", color: "#ffbf7f", textColor: "#000", animeIds: [] },
  { id: "B", name: "B", color: "#ffff7f", textColor: "#000", animeIds: [] },
  { id: "C", name: "C", color: "#7fff7f", textColor: "#000", animeIds: [] },
  { id: "D", name: "D", color: "#7fbfff", textColor: "#000", animeIds: [] },
];

const PRESET_COLORS = [
  "#ff7f7f",
  "#ffbf7f",
  "#ffff7f",
  "#7fff7f",
  "#7fbfff",
  "#bf7fff",
  "#ff7fbf",
  "#ffd700",
];

export const Favourites: React.FC = () => {
  const { favourites, removeFromFavourites, loading } = useFavourites();
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "tier">("tier");
  const [tiers, setTiers] = useState<Tier[]>(() => {
    const saved = localStorage.getItem("anime_orbit_tierlist");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Use default
      }
    }
    return DEFAULT_TIERS;
  });

  const [draggedAnimeId, setDraggedAnimeId] = useState<number | null>(null);
  const [newTierName, setNewTierName] = useState("");
  const [newTierColor, setNewTierColor] = useState(PRESET_COLORS[5]);
  const [showAddTierModal, setShowAddTierModal] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem("anime_orbit_tierlist", JSON.stringify(tiers));
  }, [tiers]);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <Heart size={56} className="mx-auto text-red-500" />
        <h2 className="text-3xl font-extrabold font-montserrat text-white">
          My Favorite Anime
        </h2>
        <p className="text-neutral-400 text-sm max-w-md mx-auto">
          Sign in to view and curate your personal collection of favorite anime series and build your interactive Tier List.
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] text-black font-extrabold px-6 py-2.5 rounded-full text-sm font-montserrat shadow-lg hover:scale-105 transition-all cursor-pointer"
        >
          <LogIn size={16} />
          <span>Sign In to View Favorites</span>
        </button>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  // Determine which favourite anime are placed in tiers vs unassigned pool
  const assignedIds = new Set(tiers.flatMap((t) => t.animeIds));
  const unassignedAnime = favourites.filter((item) => !assignedIds.has(item.mal_id));

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, animeId: number) => {
    e.dataTransfer.setData("text/plain", animeId.toString());
    setDraggedAnimeId(animeId);
  };

  const handleDropOnTier = (tierId: string) => {
    if (draggedAnimeId === null) return;
    setTiers((prev) =>
      prev.map((tier) => {
        // Remove from current tier
        const filtered = tier.animeIds.filter((id) => id !== draggedAnimeId);
        // Add to targeted tier
        if (tier.id === tierId) {
          return { ...tier, animeIds: [...filtered, draggedAnimeId] };
        }
        return { ...tier, animeIds: filtered };
      })
    );
    setDraggedAnimeId(null);
  };

  const handleDropOnPool = () => {
    if (draggedAnimeId === null) return;
    setTiers((prev) =>
      prev.map((tier) => ({
        ...tier,
        animeIds: tier.animeIds.filter((id) => id !== draggedAnimeId),
      }))
    );
    setDraggedAnimeId(null);
  };

  const handleAddTier = () => {
    if (!newTierName.trim()) return;
    const newTier: Tier = {
      id: `tier-${Date.now()}`,
      name: newTierName.trim().toUpperCase(),
      color: newTierColor,
      textColor: "#000",
      animeIds: [],
    };
    setTiers([...tiers, newTier]);
    setNewTierName("");
    setShowAddTierModal(false);
    toast.success(`Tier "${newTier.name}" added!`);
  };

  const handleDeleteTier = (tierId: string) => {
    setTiers((prev) => prev.filter((t) => t.id !== tierId));
    toast.info("Tier removed (anime moved back to pool)");
  };

  const handleResetTiers = () => {
    setTiers(DEFAULT_TIERS);
    toast.info("Tier list reset to standard ranks");
  };

  // Standalone HTML generator for Tier List
  const generateTierListHtml = () => {
    const userTitle = currentUser?.displayName || currentUser?.email?.split("@")[0] || "Anime";
    const escapeHtml = (str: string = "") =>
      str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    const favMap = new Map(favourites.map((f) => [f.mal_id, f]));

    const tiersHtml = tiers
      .map((tier) => {
        const rowCards = tier.animeIds
          .map((id) => {
            const anime = favMap.get(id);
            if (!anime) return "";
            const title = escapeHtml(anime.title || anime.title_english || "Anime");
            const img = (anime as any).images?.jpg?.large_image_url || anime.image || "";
            return `
            <div class="tier-card" title="${title}">
              <img src="${escapeHtml(img)}" alt="${title}" loading="lazy" />
              <p class="tier-card-title">${title}</p>
            </div>`;
          })
          .join("\n");

        return `
        <div class="tier-row">
          <div class="tier-label" style="background-color: ${tier.color}; color: ${tier.textColor};">
            ${escapeHtml(tier.name)}
          </div>
          <div class="tier-items">
            ${rowCards || '<span class="empty-tier">No anime placed in this tier yet</span>'}
          </div>
        </div>`;
      })
      .join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(userTitle)}'s Anime Tier List - Anime Orbit</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0c0c10; color: #fff; padding: 2rem 1rem; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { text-align: center; margin-bottom: 2rem; }
    h1 { font-size: 2.2rem; color: #ffd700; text-transform: uppercase; margin-bottom: 0.5rem; }
    .tier-row { display: flex; min-height: 110px; margin-bottom: 0.75rem; background: #16161c; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
    .tier-label { width: 110px; min-width: 110px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 900; text-transform: uppercase; text-shadow: 0 1px 2px rgba(0,0,0,0.4); }
    .tier-items { flex: 1; display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.5rem; align-items: center; }
    .tier-card { width: 75px; aspect-ratio: 2/3; position: relative; border-radius: 6px; overflow: hidden; background: #000; border: 1px solid rgba(255,255,255,0.2); }
    .tier-card img { width: 100%; height: 100%; object-fit: cover; }
    .tier-card-title { display: none; }
    .empty-tier { color: #555; font-size: 0.8rem; font-style: italic; margin-left: 0.5rem; }
    footer { text-align: center; margin-top: 3rem; color: #666; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${escapeHtml(userTitle)}'s Anime Tier List</h1>
      <p style="color:#888;">Created on Anime Orbit</p>
    </header>
    <div class="tier-board">
      ${tiersHtml}
    </div>
    <footer>
      <p>© ${new Date().getFullYear()} Anime Orbit Tier List Maker</p>
    </footer>
  </div>
</body>
</html>`;
  };

  const handleOpenHtml = () => {
    const html = generateTierListHtml();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const handleDownloadHtml = () => {
    const html = generateTierListHtml();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentUser?.displayName || "anime"}-tier-list.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Tier List HTML downloaded!");
  };

  const handleCopySummary = () => {
    const favMap = new Map(favourites.map((f) => [f.mal_id, f]));
    const text = tiers
      .map((t) => {
        const titles = t.animeIds
          .map((id) => favMap.get(id)?.title || favMap.get(id)?.title_english)
          .filter(Boolean)
          .join(", ");
        return `[${t.name}] ${titles || "None"}`;
      })
      .join("\n");

    navigator.clipboard.writeText(`🏆 My Anime Tier List:\n\n${text}`);
    setCopied(true);
    toast.success("Tier list summary copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Heart size={30} className="text-red-500 fill-red-500" />
          <h1 className="text-2xl sm:text-3xl font-extrabold font-montserrat text-white">
            My Favorites & Tier List
          </h1>
          <span className="text-xs font-bold text-neutral-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            {favourites.length} Anime
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Toggle */}
          <div className="bg-white/5 p-1 rounded-full border border-white/10 flex items-center">
            <button
              onClick={() => setViewMode("tier")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-montserrat font-bold text-xs transition-all cursor-pointer ${
                viewMode === "tier"
                  ? "bg-[#ffd700] text-black shadow-md"
                  : "text-neutral-300 hover:text-white"
              }`}
            >
              <Layers size={14} />
              <span>Tier List</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-montserrat font-bold text-xs transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#ffd700] text-black shadow-md"
                  : "text-neutral-300 hover:text-white"
              }`}
            >
              <Grid size={14} />
              <span>Grid View</span>
            </button>
          </div>

          {/* Share Button */}
          <button
            onClick={() => setShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#ffd700]/15 hover:bg-[#ffd700] border border-[#ffd700]/40 text-[#ffd700] hover:text-black font-montserrat font-bold text-xs transition-all cursor-pointer"
          >
            <Share2 size={14} />
            <span>Share Tier List</span>
          </button>

          {viewMode === "tier" && (
            <>
              <button
                onClick={() => setShowAddTierModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-montserrat font-bold text-xs transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Row</span>
              </button>
              <button
                onClick={handleResetTiers}
                className="text-xs text-neutral-400 hover:text-neutral-200 px-2 py-1 transition-colors"
                title="Reset Tiers"
              >
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#ffd700] font-montserrat font-bold flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-[#ffd700] border-t-transparent rounded-full animate-spin" />
          <span>Loading favorites...</span>
        </div>
      ) : favourites.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/40 rounded-2xl border border-white/5 space-y-2">
          <p className="font-montserrat font-bold text-lg text-white">
            No favorites added yet
          </p>
          <p className="text-xs text-neutral-400">
            Click the heart button on any anime to add it to your favorites and rank it on your Tier List!
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {favourites.map((item) => (
            <AnimeCard
              key={item.mal_id}
              anime={item as any}
              onRemove={(animeId) => removeFromFavourites(animeId)}
            />
          ))}
        </div>
      ) : (
        /* Interactive Draggable Tier List View */
        <div className="space-y-6">
          {/* Tier Rows Container */}
          <div className="space-y-2.5 rounded-2xl overflow-hidden border border-white/10 bg-black/40 p-2 sm:p-4 backdrop-blur-md">
            {tiers.map((tier) => {
              const favMap = new Map(favourites.map((f) => [f.mal_id, f]));
              return (
                <div
                  key={tier.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropOnTier(tier.id)}
                  className="flex min-h-[110px] bg-neutral-900/80 rounded-xl overflow-hidden border border-white/10 transition-colors hover:border-white/25"
                >
                  {/* Tier Rank Label */}
                  <div
                    style={{ backgroundColor: tier.color, color: tier.textColor }}
                    className="w-24 sm:w-28 flex-shrink-0 flex items-center justify-center font-montserrat font-black text-2xl sm:text-3xl text-center px-2 select-none shadow-md"
                  >
                    {tier.name}
                  </div>

                  {/* Tier Items Dropzone */}
                  <div className="flex-1 flex flex-wrap items-center gap-2.5 p-2 sm:p-3 min-h-[90px]">
                    {tier.animeIds.map((animeId) => {
                      const anime = favMap.get(animeId);
                      if (!anime) return null;
                      const img = (anime as any).images?.jpg?.large_image_url || anime.image || "";
                      return (
                        <div
                          key={animeId}
                          draggable
                          onDragStart={(e) => handleDragStart(e, animeId)}
                          className="group relative w-16 sm:w-20 aspect-[2/3] rounded-lg overflow-hidden border border-white/20 bg-neutral-800 shadow-md cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
                          title={anime.title || anime.title_english}
                        >
                          <img
                            src={img}
                            alt={anime.title}
                            className="w-full h-full object-cover pointer-events-none"
                          />
                        </div>
                      );
                    })}

                    {tier.animeIds.length === 0 && (
                      <span className="text-xs text-neutral-500 italic pl-2 select-none">
                        Drag & Drop anime here to rank in Tier {tier.name}
                      </span>
                    )}
                  </div>

                  {/* Delete Tier Button */}
                  <button
                    onClick={() => handleDeleteTier(tier.id)}
                    className="px-3 text-neutral-600 hover:text-red-400 transition-colors flex items-center justify-center"
                    title="Remove Tier Row"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Unassigned Pool */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropOnPool}
            className="p-4 sm:p-6 bg-neutral-900/60 rounded-2xl border border-white/10 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-montserrat font-bold text-sm text-neutral-300">
                Unranked Favorites Pool ({unassignedAnime.length} remaining)
              </h3>
              <span className="text-xs text-neutral-500">
                Drag from pool into any tier above
              </span>
            </div>

            <div className="flex flex-wrap gap-3 min-h-[80px] p-2 bg-black/30 rounded-xl border border-dashed border-white/10 items-center">
              {unassignedAnime.map((item) => {
                const img = (item as any).images?.jpg?.large_image_url || item.image || "";
                return (
                  <div
                    key={item.mal_id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.mal_id)}
                    className="w-16 sm:w-20 aspect-[2/3] rounded-lg overflow-hidden border border-white/20 bg-neutral-800 shadow-md cursor-grab active:cursor-grabbing hover:scale-110 hover:border-[#ffd700] transition-all"
                    title={item.title || item.title_english}
                  >
                    <img
                      src={img}
                      alt={item.title}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  </div>
                );
              })}

              {unassignedAnime.length === 0 && (
                <p className="text-xs text-green-400 font-medium w-full text-center py-2">
                  All favorite anime have been ranked in your Tier List!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Tier Modal */}
      {showAddTierModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#ffd700]/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-montserrat font-extrabold text-base text-[#ffd700]">
                Add Custom Tier Row
              </h3>
              <button
                onClick={() => setShowAddTierModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold font-montserrat text-neutral-300 mb-1.5">
                Tier Label
              </label>
              <input
                id="tier-label-input"
                name="tierLabel"
                type="text"
                value={newTierName}
                onChange={(e) => setNewTierName(e.target.value)}
                placeholder="e.g. GOAT, E, Masterpiece"
                className="w-full px-3.5 py-2 bg-white/5 border border-white/15 focus:border-[#ffd700] rounded-xl text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-montserrat text-neutral-300 mb-2">
                Tier Color
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewTierColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      newTierColor === c ? "ring-2 ring-white scale-110" : "opacity-80 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleAddTier}
                className="flex-1 py-2 bg-[#ffd700] hover:bg-[#ffea00] text-black font-montserrat font-extrabold text-xs rounded-xl shadow cursor-pointer"
              >
                Create Tier
              </button>
              <button
                onClick={() => setShowAddTierModal(false)}
                className="px-4 py-2 text-xs font-montserrat text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#ffd700]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-montserrat font-extrabold text-lg text-[#ffd700] flex items-center gap-2">
                <Share2 size={18} />
                <span>Share Your Tier List</span>
              </h3>
              <button
                onClick={() => setShareModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Export and share your customized anime tier rankings with friends or open as a standalone HTML page.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleOpenHtml}
                className="w-full flex items-center justify-between p-3.5 bg-white/5 hover:bg-[#ffd700]/10 border border-white/10 hover:border-[#ffd700] rounded-xl text-white hover:text-[#ffd700] font-montserrat font-bold text-sm transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <ExternalLink size={16} />
                  <span>Open Standalone HTML Tier List</span>
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
                onClick={handleCopySummary}
                className="w-full flex items-center justify-between p-3.5 bg-[#ffd700] hover:bg-[#ffea00] text-black font-montserrat font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-lg"
              >
                <span className="flex items-center gap-2.5">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? "Copied to Clipboard!" : "Copy Tier Summary as Text"}</span>
                </span>
                <span className="text-xs opacity-75">{tiers.length} Tiers</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Favourites;
