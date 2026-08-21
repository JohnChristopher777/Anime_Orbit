import React, { useState, useEffect, useRef } from "react";
import { useFavourites } from "../context/FavouritesContext";
import { useAuth } from "../context/AuthContext";
import { useGlobalContext } from "../context/global";
import AnimeCard from "./AnimeCard";
import AuthModal from "./AuthModal";
import SEO from "./SEO";
import Footer from "./Footer";
import {
  Heart,
  LogIn,
  Layers,
  Grid,
  Plus,
  Trash2,
  Share2,
  Download,
  Copy,
  Check,
  X,
  Star,
  Edit3,
  Search,
  Sparkles,
  Award,
  Crown,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Info,
  ExternalLink,
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
  { id: "tier-s", name: "S", color: "#ff4d4d", textColor: "#ffffff", animeIds: [] },
  { id: "tier-a", name: "A", color: "#ff9f43", textColor: "#ffffff", animeIds: [] },
  { id: "tier-b", name: "B", color: "#ffd700", textColor: "#000000", animeIds: [] },
  { id: "tier-c", name: "C", color: "#10ac84", textColor: "#ffffff", animeIds: [] },
  { id: "tier-d", name: "D", color: "#54a0ff", textColor: "#ffffff", animeIds: [] },
];

const PRESET_COLORS = [
  "#ff4d4d",
  "#ff9f43",
  "#ffd700",
  "#10ac84",
  "#54a0ff",
  "#a55eea",
  "#ff6b81",
  "#00d2d3",
];

export const Favourites: React.FC = () => {
  const { favourites, addToFavourites, removeFromFavourites, loading } = useFavourites();
  const { currentUser } = useAuth();
  const { popularAnime, topAiringAnime } = useGlobalContext();

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

  // Custom user notes and nicknames for ranked anime
  const [customNotes, setCustomNotes] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem("anime_orbit_tier_notes");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });

  const [draggedAnimeId, setDraggedAnimeId] = useState<number | null>(null);
  const [selectedAnimeId, setSelectedAnimeId] = useState<number | null>(null); // Tap to move selection
  const [editingAnimeId, setEditingAnimeId] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");

  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [editTierName, setEditTierName] = useState("");
  const [editTierColor, setEditTierColor] = useState(PRESET_COLORS[0]);

  const [newTierName, setNewTierName] = useState("");
  const [newTierColor, setNewTierColor] = useState(PRESET_COLORS[5]);
  const [showAddTierModal, setShowAddTierModal] = useState(false);
  const [showAddAnimeModal, setShowAddAnimeModal] = useState(false);
  const [animeSearchQuery, setAnimeSearchQuery] = useState("");

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const autoScrollTimer = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem("anime_orbit_tierlist", JSON.stringify(tiers));
  }, [tiers]);

  useEffect(() => {
    localStorage.setItem("anime_orbit_tier_notes", JSON.stringify(customNotes));
  }, [customNotes]);

  // Clean up auto scroll timer on unmount
  useEffect(() => {
    return () => {
      if (autoScrollTimer.current) cancelAnimationFrame(autoScrollTimer.current);
    };
  }, []);

  // Lock body scroll when modals/dialogs are open
  useEffect(() => {
    if (showAddTierModal || showAddAnimeModal || editingAnimeId !== null || editingTier !== null || shareModalOpen || authModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showAddTierModal, showAddAnimeModal, editingAnimeId, editingTier, shareModalOpen, authModalOpen]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-transparent text-white font-sans flex flex-col">
        <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4 flex-1">
          <Heart size={56} className="mx-auto text-red-500" />
          <h2 className="text-3xl font-extrabold font-montserrat text-white">
            My Favorite Anime & Tier List
          </h2>
          <p className="text-neutral-400 text-sm max-w-md mx-auto">
            Sign in to view and curate your personal collection of favorite anime series and build your interactive Tier List.
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#ffd700] hover:bg-[#ffea00] text-black font-bold px-6 py-2.5 rounded-full text-sm font-montserrat shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            <LogIn size={16} />
            <span>Sign In to View Favorites</span>
          </button>
          <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </div>
        <Footer />
      </div>
    );
  }

  // Calculate linear ranking map (#1, #2, #3, ...) across tiers from S down to D
  const linearRankMap = new Map<number, number>();
  let currentRank = 1;
  tiers.forEach((tier) => {
    tier.animeIds.forEach((id) => {
      linearRankMap.set(id, currentRank++);
    });
  });

  // Determine unassigned pool
  const assignedIds = new Set(tiers.flatMap((t) => t.animeIds));
  const unassignedAnime = favourites.filter((item) => !assignedIds.has(item.mal_id));

  // Map of all available favorites for quick lookup
  const favMap = new Map(favourites.map((f) => [f.mal_id, f]));

  // Clean drag & drop handlers
  const handleDragStart = (e: React.DragEvent, animeId: number) => {
    e.dataTransfer.setData("text/plain", animeId.toString());
    e.dataTransfer.effectAllowed = "move";
    setDraggedAnimeId(animeId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnd = () => {
    setDraggedAnimeId(null);
  };

  const handleDropOnTier = (tierId: string, e?: React.DragEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const transferId = e ? parseInt(e.dataTransfer.getData("text/plain"), 10) : NaN;
    const idToMove = !isNaN(transferId) ? transferId : (draggedAnimeId !== null ? draggedAnimeId : selectedAnimeId);
    if (idToMove === null || isNaN(idToMove)) return;

    setTiers((prev) =>
      prev.map((tier) => {
        const filtered = tier.animeIds.filter((id) => id !== idToMove);
        if (tier.id === tierId) {
          return { ...tier, animeIds: [...filtered, idToMove] };
        }
        return { ...tier, animeIds: filtered };
      })
    );
    setDraggedAnimeId(null);
    setSelectedAnimeId(null);
  };

  const handleDropOnPool = (e?: React.DragEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const transferId = e ? parseInt(e.dataTransfer.getData("text/plain"), 10) : NaN;
    const idToMove = !isNaN(transferId) ? transferId : (draggedAnimeId !== null ? draggedAnimeId : selectedAnimeId);
    if (idToMove === null || isNaN(idToMove)) return;

    setTiers((prev) =>
      prev.map((tier) => ({
        ...tier,
        animeIds: tier.animeIds.filter((id) => id !== idToMove),
      }))
    );
    setDraggedAnimeId(null);
    setSelectedAnimeId(null);
  };

  // Smart Tap-To-Move & Position Swap Handler
  const handleCardClick = (clickedAnimeId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    // 1. If nothing is selected, select this card
    if (selectedAnimeId === null) {
      setSelectedAnimeId(clickedAnimeId);
      return;
    }

    // 2. If clicking the already selected card, deselect it
    if (selectedAnimeId === clickedAnimeId) {
      setSelectedAnimeId(null);
      return;
    }

    // 3. User tapped a second anime card -> SWAP THEIR POSITIONS!
    const sourceId = selectedAnimeId;
    const targetId = clickedAnimeId;

    setTiers((prev) => {
      const updated = prev.map((tier) => ({
        ...tier,
        animeIds: [...tier.animeIds],
      }));

      let sourceTier: Tier | undefined;
      let sourceIndex = -1;
      let targetTier: Tier | undefined;
      let targetIndex = -1;

      updated.forEach((tier) => {
        const sIdx = tier.animeIds.indexOf(sourceId);
        if (sIdx !== -1) {
          sourceTier = tier;
          sourceIndex = sIdx;
        }
        const tIdx = tier.animeIds.indexOf(targetId);
        if (tIdx !== -1) {
          targetTier = tier;
          targetIndex = tIdx;
        }
      });

      // Case A: Both cards are placed in tiers (same tier or different tiers)
      if (sourceTier && targetTier) {
        if (sourceTier.id === targetTier.id) {
          // Same tier swap
          sourceTier.animeIds[sourceIndex] = targetId;
          sourceTier.animeIds[targetIndex] = sourceId;
        } else {
          // Across tiers swap
          sourceTier.animeIds[sourceIndex] = targetId;
          targetTier.animeIds[targetIndex] = sourceId;
        }
      }
      // Case B: Source was in a tier, target was in the unassigned pool
      else if (sourceTier && !targetTier) {
        sourceTier.animeIds[sourceIndex] = targetId;
      }
      // Case C: Source was in the pool, target was in a tier
      else if (!sourceTier && targetTier) {
        targetTier.animeIds[targetIndex] = sourceId;
      }

      return updated;
    });

    setSelectedAnimeId(null);
  };

  const handleMoveToTier = (animeId: number, targetTierId: string) => {
    setTiers((prev) =>
      prev.map((tier) => {
        const filtered = tier.animeIds.filter((id) => id !== animeId);
        if (tier.id === targetTierId) {
          return { ...tier, animeIds: [...filtered, animeId] };
        }
        return { ...tier, animeIds: filtered };
      })
    );
    setSelectedAnimeId(null);
    setEditingAnimeId(null);
  };

  const handleAddTier = () => {
    if (!newTierName.trim()) return;
    const newTier: Tier = {
      id: `tier-${Date.now()}`,
      name: newTierName.trim().toUpperCase(),
      color: newTierColor,
      textColor: "#ffffff",
      animeIds: [],
    };
    setTiers([...tiers, newTier]);
    setNewTierName("");
    setShowAddTierModal(false);
  };

  const handleMoveTierUp = (index: number) => {
    if (index <= 0) return;
    setTiers((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      return updated;
    });
  };

  const handleMoveTierDown = (index: number) => {
    if (index >= tiers.length - 1) return;
    setTiers((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      return updated;
    });
  };

  const handleSaveEditedTier = () => {
    if (!editingTier || !editTierName.trim()) return;
    setTiers((prev) =>
      prev.map((t) =>
        t.id === editingTier.id
          ? { ...t, name: editTierName.trim().toUpperCase(), color: editTierColor }
          : t
      )
    );
    setEditingTier(null);
  };

  const handleDeleteTier = (tierId: string) => {
    setTiers((prev) => prev.filter((t) => t.id !== tierId));
  };

  const handleResetTiers = () => {
    setTiers(DEFAULT_TIERS);
  };

  const handleSaveNote = (animeId: number) => {
    setCustomNotes((prev) => ({ ...prev, [animeId]: editingNoteText.trim() }));
    setEditingAnimeId(null);
    toast.success("Note saved!");
  };

  const handleAddAnimeToFavorites = (anime: any) => {
    addToFavourites(anime);
  };

  // Rank Badge Styler with Distinct Visual Accents for Top 5
  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="absolute top-1 left-1 z-20 flex items-center gap-0.5 bg-gradient-to-r from-[#ffd700] via-[#ffea00] to-[#f39c12] text-black font-black text-[10px] px-1.5 py-0.5 rounded-md shadow-[0_0_12px_rgba(255,215,0,0.9)] border border-white">
          <Crown size={10} className="fill-black" />
          <span>#1</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="absolute top-1 left-1 z-20 flex items-center gap-0.5 bg-gradient-to-r from-slate-100 to-slate-300 text-black font-black text-[10px] px-1.5 py-0.5 rounded-md shadow-[0_0_10px_rgba(255,255,255,0.8)] border border-slate-400">
          <Award size={10} />
          <span>#2</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="absolute top-1 left-1 z-20 flex items-center gap-0.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black text-[10px] px-1.5 py-0.5 rounded-md shadow-md border border-amber-300">
          <Award size={10} />
          <span>#3</span>
        </div>
      );
    }
    if (rank === 4 || rank === 5) {
      return (
        <div className="absolute top-1 left-1 z-20 flex items-center gap-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded-md shadow-md border border-purple-300">
          <Sparkles size={9} />
          <span>#{rank}</span>
        </div>
      );
    }
    return (
      <div className="absolute top-1 left-1 z-20 bg-black/85 text-[#ffd700] border border-[#ffd700]/50 font-black text-[9px] px-1 py-0.5 rounded-md shadow">
        #{rank}
      </div>
    );
  };

  // Generate Tier List HTML for Share / Export
  const generateTierListHtml = () => {
    const userTitle = currentUser?.displayName || currentUser?.email?.split("@")[0] || "Anime";
    const escapeHtml = (str: string = "") =>
      str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    const tiersHtml = tiers
      .map((tier) => {
        const rowCards = tier.animeIds
          .map((id) => {
            const anime = favMap.get(id);
            if (!anime) return "";
            const title = escapeHtml(anime.title || anime.title_english || "Anime");
            const img = (anime as any).images?.jpg?.large_image_url || (anime as any).image || "";
            const r = linearRankMap.get(id) || 0;
            const note = customNotes[id] ? `<span class="note">${escapeHtml(customNotes[id])}</span>` : "";
            return `
            <div class="tier-card" title="${title}">
              <span class="rank-tag">#${r}</span>
              <img src="${escapeHtml(img)}" alt="${title}" loading="lazy" />
              ${note}
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
    .tier-row { display: flex; min-height: 110px; margin-bottom: 0.75rem; background: #16161c; border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
    .tier-label { width: 110px; min-width: 110px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 900; text-transform: uppercase; text-shadow: 0 1px 2px rgba(0,0,0,0.4); }
    .tier-items { flex: 1; display: flex; flex-wrap: wrap; gap: 0.6rem; padding: 0.6rem; align-items: center; }
    .tier-card { width: 75px; aspect-ratio: 2/3; position: relative; border-radius: 6px; overflow: hidden; background: #000; border: 1px solid rgba(255,255,255,0.2); }
    .tier-card img { width: 100%; height: 100%; object-fit: cover; }
    .rank-tag { position: absolute; top: 2px; left: 2px; background: rgba(0,0,0,0.85); color: #ffd700; font-size: 10px; font-weight: 800; padding: 1px 4px; border-radius: 4px; z-index: 10; border: 1px solid rgba(255,215,0,0.4); }
    .empty-tier { color: #555; font-size: 0.8rem; font-style: italic; margin-left: 0.5rem; }
    footer { text-align: center; margin-top: 3rem; color: #666; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${escapeHtml(userTitle)}'s Anime Tier List</h1>
      <p style="color:#888;">Crafted on Anime Orbit</p>
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
    const text = tiers
      .map((t) => {
        const titles = t.animeIds
          .map((id) => {
            const a = favMap.get(id);
            const r = linearRankMap.get(id) || 0;
            return `#${r} ${a?.title || a?.title_english || "Anime"}`;
          })
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

  // Filter pool candidates for Add Anime to Pool modal
  const poolCandidates = [...(popularAnime || []), ...(topAiringAnime || [])].filter((anime, idx, arr) => {
    return arr.findIndex((a) => a.mal_id === anime.mal_id) === idx;
  }).filter((a) => {
    if (!animeSearchQuery.trim()) return true;
    const t = (a.title || a.title_english || "").toLowerCase();
    return t.includes(animeSearchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-transparent text-white font-sans flex flex-col">
      <SEO
        title="My Favorites & Custom Anime Tier List"
        description="Build, organize, and customize your personal anime tier lists and favorite series across all genres on Anime Orbit."
        keywords="anime tier list, anime favorites, custom anime tier rankings, Anime Orbit"
        url="https://animeorbit.web.app/favourites"
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-8 pb-12 space-y-6 sm:space-y-8 flex-1 w-full">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Heart size={30} className="text-red-500 fill-red-500" />
            <h1 className="text-2xl sm:text-3xl font-extrabold font-montserrat text-white">
              Favorites & Tier List
            </h1>
            <span className="text-xs font-bold text-neutral-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              {favourites.length} Anime
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Add Anime to Pool Button */}
            <button
              onClick={() => setShowAddAnimeModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#ffd700] hover:bg-[#ffea00] text-black font-montserrat font-bold text-xs transition-all shadow-[0_0_12px_rgba(255,215,0,0.3)] hover:scale-105 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Anime to Pool</span>
            </button>

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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-[#ffd700] border border-white/15 hover:border-[#ffd700] text-white hover:text-black font-montserrat font-bold text-xs transition-all cursor-pointer"
            >
              <Share2 size={14} />
              <span>Export Tier List</span>
            </button>

            {viewMode === "tier" && (
              <>
                <button
                  onClick={() => setShowAddTierModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-montserrat font-bold text-xs transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Row</span>
                </button>
                <button
                  onClick={handleResetTiers}
                  className="text-xs text-neutral-400 hover:text-neutral-200 px-2 py-1 transition-colors cursor-pointer"
                  title="Reset Tiers"
                >
                  Reset
                </button>
              </>
            )}
          </div>
        </div>

        {/* Selected Item Notification Banner */}
        {selectedAnimeId !== null && (
          <div className="bg-emerald-950/80 border-2 border-emerald-400 rounded-xl p-3 flex items-center justify-between shadow-[0_0_20px_rgba(52,211,153,0.3)] animate-pulse">
            <div className="flex items-center gap-2 text-emerald-300 text-xs sm:text-sm font-bold">
              <Sparkles size={16} />
              <span>
                "{favMap.get(selectedAnimeId)?.title || "Anime"}" selected! Tap any Tier row below to place it there.
              </span>
            </div>
            <button
              onClick={() => setSelectedAnimeId(null)}
              className="text-emerald-400 hover:text-white text-xs px-2 py-1 bg-emerald-900/60 rounded-lg"
            >
              Cancel
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-[#ffd700] font-montserrat font-bold flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-[#ffd700] border-t-transparent rounded-full animate-spin" />
            <span>Loading favorites...</span>
          </div>
        ) : viewMode === "grid" ? (
          favourites.length === 0 ? (
            <div className="text-center py-20 bg-neutral-900/40 rounded-2xl border border-white/5 space-y-4">
              <p className="font-montserrat font-bold text-lg text-white">
                No favorites added yet
              </p>
              <button
                onClick={() => setShowAddAnimeModal(true)}
                className="inline-flex items-center gap-2 bg-[#ffd700] text-black font-bold px-6 py-2.5 rounded-full text-xs font-montserrat shadow-md hover:scale-105 transition-all"
              >
                <Plus size={16} />
                <span>Add Anime to Pool</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {favourites.map((item) => (
                <AnimeCard
                  key={item.mal_id}
                  anime={item as any}
                  onRemove={(animeId) => removeFromFavourites(animeId)}
                />
              ))}
            </div>
          )
        ) : (
          /* Interactive Touch / Tap-To-Move & Swap Tier List View */
          <div className="space-y-4">
            {/* Touch / Click Instruction Guide Note Banner */}
            <div className="bg-gradient-to-r from-[#ffd700]/10 via-amber-500/5 to-transparent border border-[#ffd700]/30 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-md backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ffd700]/20 border border-[#ffd700]/50 flex items-center justify-center text-[#ffd700] flex-shrink-0">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold font-montserrat text-white flex items-center gap-2">
                    <span>Touch & Click Active</span>
                  </h4>
                  <p className="text-[11px] sm:text-xs text-neutral-300 mt-0.5">
                    💡 <span className="text-white font-semibold">Tip:</span> Tap any anime to select <span className="text-emerald-400 font-semibold">(green outline)</span>, then tap a tier row to place it, or tap another anime in the same or different tier to <span className="text-[#ffd700] font-semibold">swap positions</span>!
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (lg:col-span-8 / 9): Tier Rows */}
              <div className="lg:col-span-8 xl:col-span-9 space-y-3">
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/50 p-2 sm:p-4 backdrop-blur-md space-y-3">
                  {tiers.map((tier, index) => {
                    return (
                      <div
                        key={tier.id}
                        onClick={() => {
                          if (selectedAnimeId !== null) handleDropOnTier(tier.id);
                        }}
                        className={`flex min-h-[110px] bg-neutral-900/85 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                          selectedAnimeId !== null
                            ? "border-emerald-400/60 hover:border-emerald-400 hover:bg-emerald-950/20"
                            : "border-white/10 hover:border-white/25"
                        }`}
                      >
                        {/* Tier Rank Header Label (Click to Edit / Rename) */}
                        <div
                          style={{ backgroundColor: tier.color, color: tier.textColor }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTier(tier);
                            setEditTierName(tier.name);
                            setEditTierColor(tier.color);
                          }}
                          className="w-20 sm:w-28 flex-shrink-0 flex flex-col items-center justify-center font-montserrat font-black text-xl sm:text-2xl text-center p-2 select-none shadow-md cursor-pointer hover:brightness-110 group relative"
                          title="Click to rename or change color"
                        >
                          <span className="truncate w-full">{tier.name}</span>
                          <span className="text-[9px] opacity-0 group-hover:opacity-90 font-medium text-white/90">Edit</span>
                        </div>

                        {/* Tier Items Grid & Tap Target */}
                        <div className="flex-1 flex flex-wrap items-center gap-2 sm:gap-3 p-2 sm:p-3 min-h-[90px]">
                          {tier.animeIds.map((animeId) => {
                            const anime = favMap.get(animeId);
                            if (!anime) return null;
                            const img = (anime as any).images?.jpg?.large_image_url || (anime as any).image || "";
                            const rank = linearRankMap.get(animeId) || 0;
                            const isSelected = selectedAnimeId === animeId;
                            const note = customNotes[animeId];

                            return (
                              <div
                                key={animeId}
                                onClick={(e) => handleCardClick(animeId, e)}
                                className={`group relative w-16 sm:w-20 aspect-[2/3] rounded-lg overflow-hidden border bg-neutral-800 shadow-md cursor-pointer transition-all select-none ${
                                  isSelected
                                    ? "ring-4 ring-emerald-400 scale-105 border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.8)] z-30"
                                    : "border-white/20 hover:scale-105 hover:border-[#ffd700]"
                                }`}
                              >
                                {/* Linear Numbering Badge with Unique Glow for Top 5 */}
                                {renderRankBadge(rank)}

                                {/* Poster Image */}
                                <img
                                  src={img}
                                  alt={anime.title}
                                  className="w-full h-full object-cover pointer-events-none"
                                />

                                {/* Note Marker */}
                                {note && (
                                  <div className="absolute bottom-1 right-1 z-10 w-2 h-2 rounded-full bg-[#ffd700] ring-2 ring-black" />
                                )}

                                {/* Quick Edit Info Button on Hover */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAnimeId(animeId);
                                    setEditingNoteText(customNotes[animeId] || "");
                                  }}
                                  className="absolute bottom-1 left-1 z-20 p-1 rounded-md bg-black/80 text-[#ffd700] opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                  title="Edit info note"
                                >
                                  <Edit3 size={11} />
                                </button>

                                {/* Tooltip Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pointer-events-none z-10">
                                  <span className="text-[11px] font-extrabold text-white leading-tight line-clamp-2">
                                    {anime.title || anime.title_english}
                                  </span>
                                  <div className="flex items-center justify-between gap-1 mt-1">
                                    {anime.score && (
                                      <span className="text-[10px] text-[#ffd700] font-bold flex items-center gap-0.5">
                                        <Star size={10} fill="#ffd700" />
                                        {anime.score}
                                      </span>
                                    )}
                                    <span className="text-[9px] font-bold text-neutral-300">
                                      Rank #{rank}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {tier.animeIds.length === 0 && (
                            <span className="text-xs text-neutral-500 italic pl-2 select-none">
                              {selectedAnimeId !== null
                                ? "👉 Tap here to place selected anime in this Tier"
                                : `Tap anime to rank in Tier ${tier.name}`}
                            </span>
                          )}
                        </div>

                        {/* Tier Actions Toolbar (Move Up, Move Down, Edit, Delete) */}
                        <div className="flex flex-col sm:flex-row items-center justify-center p-1 sm:p-2 border-l border-white/10 gap-1 bg-black/40">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveTierUp(index);
                            }}
                            disabled={index === 0}
                            className="p-1 rounded text-neutral-400 hover:text-[#ffd700] disabled:opacity-20 disabled:hover:text-neutral-400 cursor-pointer"
                            title="Move Tier Up"
                          >
                            <ChevronUp size={15} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveTierDown(index);
                            }}
                            disabled={index === tiers.length - 1}
                            className="p-1 rounded text-neutral-400 hover:text-[#ffd700] disabled:opacity-20 disabled:hover:text-neutral-400 cursor-pointer"
                            title="Move Tier Down"
                          >
                            <ChevronDown size={15} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTier(tier);
                              setEditTierName(tier.name);
                              setEditTierColor(tier.color);
                            }}
                            className="p-1 rounded text-neutral-400 hover:text-white cursor-pointer"
                            title="Rename / Customize Tier"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTier(tier.id);
                            }}
                            className="p-1 rounded text-neutral-600 hover:text-red-400 cursor-pointer"
                            title="Delete Tier Row"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column (lg:col-span-4 / 3): Horizontal / Side Pool for Laptops & Big Screen Tablets */}
              <div
                onClick={() => {
                  if (selectedAnimeId !== null) handleDropOnPool();
                }}
                className={`lg:col-span-4 xl:col-span-3 p-4 sm:p-5 bg-neutral-900/80 rounded-2xl border transition-all space-y-3 lg:sticky lg:top-24 ${
                  selectedAnimeId !== null
                    ? "border-emerald-400/60 bg-emerald-950/20"
                    : "border-white/10"
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div>
                    <h3 className="font-montserrat font-bold text-sm text-[#ffd700] flex items-center gap-1.5">
                      <Sparkles size={14} />
                      <span>Unranked Pool</span>
                    </h3>
                    <span className="text-[11px] text-neutral-400">
                      {unassignedAnime.length} series waiting
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddAnimeModal(true);
                    }}
                    className="p-1.5 rounded-lg bg-[#ffd700]/15 border border-[#ffd700]/40 text-[#ffd700] hover:bg-[#ffd700] hover:text-black transition-all cursor-pointer"
                    title="Add Anime to Pool"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Pool Items Grid */}
                <div className="flex flex-wrap gap-2.5 min-h-[140px] max-h-[480px] overflow-y-auto p-2 bg-black/40 rounded-xl border border-dashed border-white/15 items-center content-start">
                  {unassignedAnime.map((item) => {
                    const img = (item as any).images?.jpg?.large_image_url || (item as any).image || "";
                    const isSelected = selectedAnimeId === item.mal_id;

                    return (
                      <div
                        key={item.mal_id}
                        onClick={(e) => handleCardClick(item.mal_id, e)}
                        className={`group relative w-14 sm:w-16 aspect-[2/3] rounded-lg overflow-hidden border bg-neutral-800 shadow-md cursor-pointer transition-all select-none ${
                          isSelected
                            ? "ring-4 ring-emerald-400 scale-105 border-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.8)] z-30"
                            : "border-white/20 hover:scale-110 hover:border-[#ffd700]"
                        }`}
                        title={item.title || item.title_english}
                      >
                        <img
                          src={img}
                          alt={item.title}
                          className="w-full h-full object-cover pointer-events-none"
                        />

                        {/* Tooltip Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5 pointer-events-none z-10">
                          <span className="text-[10px] font-extrabold text-white leading-tight line-clamp-2">
                            {item.title || item.title_english}
                          </span>
                          {item.score && (
                            <span className="text-[9px] text-[#ffd700] font-bold flex items-center gap-0.5 mt-0.5">
                              <Star size={9} fill="#ffd700" />
                              {item.score}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {unassignedAnime.length === 0 && (
                    <div className="w-full text-center py-6 space-y-2">
                      <p className="text-xs text-neutral-400 font-medium">
                        Pool is empty! All anime have been ranked.
                      </p>
                      <button
                        onClick={() => setShowAddAnimeModal(true)}
                        className="inline-flex items-center gap-1.5 text-xs text-[#ffd700] hover:underline cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Add more series to pool</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Custom Tier Modal */}
      {showAddTierModal && (
        <div
          onClick={() => setShowAddTierModal(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#18181b] border border-[#ffd700]/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-montserrat font-extrabold text-base text-[#ffd700]">
                Add Custom Tier Row
              </h3>
              <button
                onClick={() => setShowAddTierModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1">
                Tier Label Name
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. SSS, SS, S+ "
                value={newTierName}
                onChange={(e) => setNewTierName(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white font-montserrat font-bold text-sm uppercase outline-none focus:border-[#ffd700]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                Badge Color
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewTierColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                      newTierColor === c ? "border-white scale-110" : "border-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddTierModal(false)}
                className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTier}
                className="bg-[#ffd700] hover:bg-[#ffea00] text-black font-montserrat font-bold text-xs px-5 py-2 rounded-xl transition-all"
              >
                Add Tier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Anime To Pool Modal */}
      {showAddAnimeModal && (
        <div
          onClick={() => setShowAddAnimeModal(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#15151c] border border-[#ffd700]/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-[#ffd700]" />
                <h3 className="font-montserrat font-extrabold text-base text-white">
                  Add Anime to Favorites & Tier Pool
                </h3>
              </div>
              <button
                onClick={() => setShowAddAnimeModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search popular series to add..."
                value={animeSearchQuery}
                onChange={(e) => setAnimeSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-400 focus:outline-none focus:border-[#ffd700]"
              />
            </div>

            {/* Candidate List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/10 pr-1 max-h-96">
              {poolCandidates.map((anime) => {
                const isAlreadyFav = favourites.some((f) => f.mal_id === anime.mal_id);
                const title = anime.title || anime.title_english || "Anime";
                const img = (anime as any).images?.jpg?.image_url || (anime as any).image || "";

                return (
                  <div
                    key={`cand-${anime.mal_id}`}
                    className="flex items-center justify-between gap-3 py-2.5 px-2 hover:bg-white/5 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={img}
                        alt={title}
                        className="w-10 h-14 object-cover rounded-lg border border-white/10 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                          {anime.score && (
                            <span className="text-[#ffd700] font-bold flex items-center gap-0.5">
                              <Star size={10} fill="#ffd700" />
                              {anime.score}
                            </span>
                          )}
                          <span>•</span>
                          <span>{anime.type || "TV"}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      disabled={isAlreadyFav}
                      onClick={() => handleAddAnimeToFavorites(anime)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold font-montserrat flex items-center gap-1 transition-all ${
                        isAlreadyFav
                          ? "bg-white/10 text-neutral-500 cursor-default"
                          : "bg-[#ffd700] hover:bg-[#ffea00] text-black hover:scale-105 cursor-pointer shadow-md"
                      }`}
                    >
                      {isAlreadyFav ? (
                        <>
                          <Check size={13} />
                          <span>In Pool</span>
                        </>
                      ) : (
                        <>
                          <Plus size={13} />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/10 text-right">
              <button
                onClick={() => setShowAddAnimeModal(false)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-montserrat font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Anime Note / Move Modal */}
      {editingAnimeId !== null && (
        <div
          onClick={() => setEditingAnimeId(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#18181f] border border-[#ffd700]/50 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-montserrat font-bold text-sm text-[#ffd700]">
                Customize Rank Info
              </h3>
              <button
                onClick={() => setEditingAnimeId(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-xs text-white font-bold truncate">
              {favMap.get(editingAnimeId)?.title || "Anime"}
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1">
                Custom Nickname / Note
              </label>
              <input
                type="text"
                placeholder="e.g. Peak Fiction, Masterpiece arc"
                value={editingNoteText}
                onChange={(e) => setEditingNoteText(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white text-xs outline-none focus:border-[#ffd700]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1">
                Quick Move to Tier:
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {tiers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleMoveToTier(editingAnimeId, t.id)}
                    style={{ backgroundColor: t.color, color: t.textColor }}
                    className="px-2.5 py-1 rounded-md text-xs font-bold shadow-sm hover:scale-105 transition-transform cursor-pointer"
                  >
                    {t.name}
                  </button>
                ))}
                <button
                  onClick={() => {
                    handleDropOnPool();
                    setEditingAnimeId(null);
                  }}
                  className="px-2.5 py-1 rounded-md text-xs font-bold bg-neutral-700 text-white hover:bg-neutral-600 transition-colors"
                >
                  Unassign
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setEditingAnimeId(null)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveNote(editingAnimeId)}
                className="bg-[#ffd700] hover:bg-[#ffea00] text-black font-montserrat font-bold text-xs px-4 py-1.5 rounded-xl transition-all"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share / Export Tier List Modal */}
      {shareModalOpen && (
        <div
          onClick={() => setShareModalOpen(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#18181b] border border-[#ffd700]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Share2 size={18} className="text-[#ffd700]" />
                <h3 className="font-montserrat font-extrabold text-base text-white">
                  Export & Share Tier List
                </h3>
              </div>
              <button
                onClick={() => setShareModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Export your personalized tier rankings as a standalone interactive webpage or copy formatted text for Discord, Reddit, and forums.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleOpenHtml}
                className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-[#ffd700]/15 border border-white/10 hover:border-[#ffd700] rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <ExternalLink size={18} className="text-[#ffd700]" />
                  <div>
                    <div className="text-white group-hover:text-[#ffd700]">Open Fullscreen Webpage</div>
                    <div className="text-[11px] text-neutral-400">View standalone rendered tier board</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-neutral-500 group-hover:text-[#ffd700]" />
              </button>

              <button
                onClick={handleDownloadHtml}
                className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-[#ffd700]/15 border border-white/10 hover:border-[#ffd700] rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Download size={18} className="text-[#ffd700]" />
                  <div>
                    <div className="text-white group-hover:text-[#ffd700]">Download Standalone HTML</div>
                    <div className="text-[11px] text-neutral-400">Save as an offline interactive webpage</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-neutral-500 group-hover:text-[#ffd700]" />
              </button>

              <button
                onClick={handleCopySummary}
                className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-[#ffd700]/15 border border-white/10 hover:border-[#ffd700] rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  {copied ? (
                    <Check size={18} className="text-green-400" />
                  ) : (
                    <Copy size={18} className="text-[#ffd700]" />
                  )}
                  <div>
                    <div className="text-white group-hover:text-[#ffd700]">
                      {copied ? "Copied to Clipboard!" : "Copy Summary Text"}
                    </div>
                    <div className="text-[11px] text-neutral-400">Copy formatted text rankings</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-neutral-500 group-hover:text-[#ffd700]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Rename Tier Modal */}
      {editingTier && (
        <div
          onClick={() => setEditingTier(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#181822] border border-[#ffd700]/40 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-montserrat font-bold text-lg text-white flex items-center gap-2">
                <Edit3 size={18} className="text-[#ffd700]" />
                <span>Customize Tier</span>
              </h3>
              <button
                onClick={() => setEditingTier(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Tier Name / Rank</label>
              <input
                type="text"
                value={editTierName}
                onChange={(e) => setEditTierName(e.target.value)}
                placeholder="e.g. S+, GOAT, Masterpiece"
                maxLength={12}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white font-montserrat font-bold text-sm focus:border-[#ffd700] outline-none uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Tier Header Color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditTierColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                      editTierColor === c ? "ring-4 ring-white scale-110 shadow-lg" : "hover:scale-105"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setEditingTier(null)}
                className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-montserrat font-bold text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedTier}
                className="flex-1 py-2 rounded-xl bg-[#ffd700] hover:bg-[#ffea00] text-xs font-montserrat font-bold text-black shadow-lg transition-transform hover:scale-105 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Tap-to-Place Quick Bar (Mobile & Desktop) */}
      {selectedAnimeId !== null && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#121218]/95 backdrop-blur-xl border-2 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)] rounded-2xl px-4 py-3 flex items-center gap-3 max-w-[95vw] overflow-x-auto animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 pr-2 border-r border-white/10 flex-shrink-0">
            <span className="text-xs font-bold text-emerald-400">Place in:</span>
            <span className="text-xs font-semibold text-white truncate max-w-[110px]">
              {favMap.get(selectedAnimeId)?.title || "Anime"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-nowrap">
            {tiers.map((t) => (
              <button
                key={t.id}
                onClick={() => handleDropOnTier(t.id)}
                style={{ backgroundColor: t.color }}
                className="px-3 py-1 rounded-lg text-white font-black text-xs shadow hover:scale-110 active:scale-95 transition-transform cursor-pointer flex-shrink-0"
              >
                {t.name}
              </button>
            ))}
            <button
              onClick={() => handleDropOnPool()}
              className="px-3 py-1 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white font-bold text-xs shadow hover:scale-105 active:scale-95 transition-transform cursor-pointer flex-shrink-0"
            >
              Pool
            </button>
            <button
              onClick={() => setSelectedAnimeId(null)}
              className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer ml-1"
              title="Cancel Selection"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Favourites;
