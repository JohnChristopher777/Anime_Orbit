import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useFavourites } from "../context/FavouritesContext";
import { useAuth } from "../context/AuthContext";
import { useGlobalContext } from "../context/global";
import AnimeCard from "./AnimeCard";
import AuthModal from "./AuthModal";
import SEO from "./SEO";
import Footer from "./Footer";
import { getFranchiseGroups } from "../services/anilist";
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
  GitBranch,
  BookOpen,
  RotateCcw,
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

const freshMangaTiers = (): Tier[] => DEFAULT_TIERS.map((tier) => ({ ...tier, animeIds: [] }));

const MangaTierBoard: React.FC<{ items: any[] }> = ({ items }) => {
  const [mangaTiers, setMangaTiers] = useState<Tier[]>(() => {
    try {
      const saved = localStorage.getItem("anime_orbit_manga_tierlist");
      return saved ? JSON.parse(saved) : freshMangaTiers();
    } catch {
      return freshMangaTiers();
    }
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const itemMap = new Map(items.map((item) => [item.mal_id, item]));
  const assigned = new Set(mangaTiers.flatMap((tier) => tier.animeIds));
  const waiting = items.filter((item) => !assigned.has(item.mal_id));
  const ranks = new Map<number, number>();
  let nextRank = 1;
  mangaTiers.forEach((tier) => tier.animeIds.forEach((mediaId) => { if (itemMap.has(mediaId)) ranks.set(mediaId, nextRank++); }));

  useEffect(() => {
    localStorage.setItem("anime_orbit_manga_tierlist", JSON.stringify(mangaTiers));
  }, [mangaTiers]);

  const placeInTier = (tierId: string, mediaId = selectedId) => {
    if (mediaId === null) return;
    setMangaTiers((current) => current.map((tier) => {
      const without = tier.animeIds.filter((id) => id !== mediaId);
      return tier.id === tierId ? { ...tier, animeIds: [...without, mediaId] } : { ...tier, animeIds: without };
    }));
    setSelectedId(null);
  };

  const returnToWaiting = (mediaId: number) => {
    setMangaTiers((current) => current.map((tier) => ({ ...tier, animeIds: tier.animeIds.filter((id) => id !== mediaId) })));
    setSelectedId(null);
  };

  const renderCard = (item: any) => {
    const selected = selectedId === item.mal_id;
    return <button key={item.mal_id} type="button" draggable onDragStart={(event) => event.dataTransfer.setData("text/manga-id", String(item.mal_id))} onClick={(event) => { event.stopPropagation(); setSelectedId((current) => current === item.mal_id ? null : item.mal_id); }} className={`manga-tier-card ${selected ? "is-selected" : ""}`} aria-pressed={selected} title={`${item.title} — select to move`}>
      {ranks.has(item.mal_id) && <span>#{ranks.get(item.mal_id)}</span>}
      <img src={item.image || "/lost.jpg"} alt="" loading="lazy" />
      <strong>{item.title}</strong>
    </button>;
  };

  return <div className="manga-tier-board">
    <header><div><span>Manga tier list</span><h2>Rank your favorite reads</h2><p>Select a cover, then choose a row. Drag and drop also works on desktop.</p></div><button type="button" onClick={() => { setMangaTiers(freshMangaTiers()); setSelectedId(null); }}>Reset tiers</button></header>
    {selectedId !== null && <div className="manga-tier-selection"><span>{itemMap.get(selectedId)?.title || "Manga"} selected</span><button type="button" onClick={() => returnToWaiting(selectedId)}>Move to waiting</button><button type="button" onClick={() => setSelectedId(null)}>Cancel</button></div>}
    <div className="manga-tier-rows">
      {mangaTiers.map((tier) => <section key={tier.id} onClick={() => placeInTier(tier.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const mediaId = Number(event.dataTransfer.getData("text/manga-id")); if (mediaId) placeInTier(tier.id, mediaId); }} className={selectedId !== null ? "is-target" : ""}>
        <div className="manga-tier-label" style={{ background: tier.color, color: tier.textColor }}>{tier.name}</div>
        <div className="manga-tier-items">{tier.animeIds.map((mediaId) => itemMap.get(mediaId)).filter(Boolean).map(renderCard)}{!tier.animeIds.some((mediaId) => itemMap.has(mediaId)) && <small>{selectedId !== null ? `Place in ${tier.name}` : "No manga ranked here"}</small>}</div>
      </section>)}
    </div>
    <section className="manga-tier-waiting" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const mediaId = Number(event.dataTransfer.getData("text/manga-id")); if (mediaId) returnToWaiting(mediaId); }}><div><span>Waiting to rank</span><strong>{waiting.length}</strong></div><div>{waiting.map(renderCard)}{waiting.length === 0 && <small>Every favorite manga has a tier.</small>}</div></section>
  </div>;
};

export const Favourites: React.FC = () => {
  const { favourites, mangaFavourites, deletedFavourites, addToFavourites, removeFromFavourites, removeMangaFromFavourites, restoreFavourite, permanentlyDeleteFavourite, loading } = useFavourites();
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
  const [favoriteMedia, setFavoriteMedia] = useState<"anime" | "manga">("anime");
  const [trashOpen, setTrashOpen] = useState(false);
  const [mergeFranchises, setMergeFranchises] = useState(false);
  const [franchiseGroups, setFranchiseGroups] = useState<any[]>([]);
  const [franchiseLoading, setFranchiseLoading] = useState(false);

  const autoScrollTimer = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem("anime_orbit_tierlist", JSON.stringify(tiers));
  }, [tiers]);

  useEffect(() => {
    localStorage.setItem("anime_orbit_tier_notes", JSON.stringify(customNotes));
  }, [customNotes]);

  useEffect(() => {
    if (!mergeFranchises || favourites.length === 0) {
      setFranchiseGroups([]);
      return;
    }
    let active = true;
    setFranchiseLoading(true);
    getFranchiseGroups(favourites.map((item) => item.mal_id))
      .then((groups) => {
        if (active) setFranchiseGroups(groups || []);
      })
      .catch(() => {
        if (active) {
          setFranchiseGroups([]);
          toast.error("Franchise view could not be loaded right now.");
        }
      })
      .finally(() => {
        if (active) setFranchiseLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mergeFranchises, favourites]);

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

  // This is a derived view only: it never rewrites the user's saved favorites or tier rows.
  const franchiseTierRows = (() => {
    if (!mergeFranchises) return [];
    const used = new Set<number>();
    const summaries: any[] = franchiseGroups.map((group) => {
      const memberIds = (group.memberIds || []).filter((id: number) => favMap.has(id));
      memberIds.forEach((id: number) => used.add(id));
      const members = memberIds.map((id: number) => favMap.get(id)).filter(Boolean);
      const rankedMembers = memberIds
        .map((id: number) => ({ id, rank: linearRankMap.get(id) || Number.MAX_SAFE_INTEGER }))
        .sort((a: any, b: any) => a.rank - b.rank);
      const leadId = rankedMembers[0]?.id || memberIds[0];
      const tier = tiers.find((candidate) => candidate.animeIds.some((id) => memberIds.includes(id)));
      const notes = memberIds
        .map((id: number) => ({
          title: favMap.get(id)?.title || favMap.get(id)?.title_english || "Anime",
          note: customNotes[id],
        }))
        .filter((entry: any) => entry.note);
      return {
        ...group,
        mal_id: leadId || group.mal_id,
        title: favMap.get(leadId)?.title || group.title,
        tierId: tier?.id || "unranked",
        members,
        memberIds,
        notes,
        rank: leadId ? linearRankMap.get(leadId) : undefined,
      };
    }).filter((group) => group.memberIds.length > 0);

    favourites.forEach((favorite) => {
      if (used.has(favorite.mal_id)) return;
      const tier = tiers.find((candidate) => candidate.animeIds.includes(favorite.mal_id));
      summaries.push({
        mal_id: favorite.mal_id,
        title: favorite.title || favorite.title_english,
        images: (favorite as any).images || { jpg: { large_image_url: favorite.image } },
        score: favorite.score,
        franchiseEntries: 1,
        memberIds: [favorite.mal_id],
        members: [favorite],
        tierId: tier?.id || "unranked",
        notes: customNotes[favorite.mal_id]
          ? [{ title: favorite.title || favorite.title_english || "Anime", note: customNotes[favorite.mal_id] }]
          : [],
        rank: linearRankMap.get(favorite.mal_id),
      });
    });

    return [
      ...tiers.map((tier) => ({ ...tier, groups: summaries.filter((group) => group.tierId === tier.id) })),
      {
        id: "unranked",
        name: "Waiting",
        color: "#404040",
        textColor: "#ffffff",
        animeIds: [],
        groups: summaries.filter((group) => group.tierId === "unranked"),
      },
    ].filter((row) => row.groups.length > 0);
  })();

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
    const userTitle = currentUser?.displayName || "Anime Fan";
    const userAvatar = currentUser?.photoURL || "";
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
    header { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; margin-bottom: 2rem; text-align: center; }
    .user-badge { display: flex; align-items: center; gap: 0.75rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,215,0,0.3); padding: 0.5rem 1.2rem; border-radius: 50px; }
    .user-avatar { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid #ffd700; }
    .avatar-fallback { width: 42px; height: 42px; border-radius: 50%; background: #ffd700; color: #000; font-weight: 900; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
    h1 { font-size: 2.2rem; color: #ffd700; text-transform: uppercase; margin: 0; }
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
      <div class="user-badge">
        ${
          userAvatar
            ? `<img src="${escapeHtml(userAvatar)}" alt="${escapeHtml(userTitle)}" class="user-avatar" />`
            : `<div class="avatar-fallback">${escapeHtml(userTitle[0]?.toUpperCase() || "U")}</div>`
        }
        <div style="text-align: left;">
          <div style="font-weight: 800; color: #fff; font-size: 0.95rem;">${escapeHtml(userTitle)}</div>
          <div style="font-size: 0.75rem; color: #a0a0a0;">Shared favorites list</div>
        </div>
      </div>
      <h1>${escapeHtml(userTitle)}'s Anime Tier List</h1>
    </header>
    <div class="tier-board">
      ${tiersHtml}
    </div>
    <footer>
      <p>© ${new Date().getFullYear()} Anime Orbit - Cosmic Anime Compass & Tier List Maker</p>
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

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-12 space-y-6 sm:space-y-8 flex-1 w-full">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Heart size={30} className="text-yellow-500 fill-yellow-500" />
            <h1 className="text-2xl sm:text-3xl font-extrabold font-montserrat text-white">
              Favorites
            </h1>
            <span className="text-xs font-bold text-neutral-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              {favoriteMedia === "anime" ? `${favourites.length} Anime` : `${mangaFavourites.length} Manga`}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex rounded-full border border-white/10 bg-white/5 p-1 text-xs font-bold">
              <button type="button" onClick={() => setFavoriteMedia("anime")} className={`rounded-full px-4 py-1.5 ${favoriteMedia === "anime" ? "bg-[#ffd700] text-black" : "text-neutral-300"}`}>Anime</button>
              <button type="button" onClick={() => { setFavoriteMedia("manga"); setMergeFranchises(false); }} className={`rounded-full px-4 py-1.5 ${favoriteMedia === "manga" ? "bg-[#ffd700] text-black" : "text-neutral-300"}`}>Manga</button>
            </div>
            {/* Add Anime to Pool Button */}
            {favoriteMedia === "anime" ? <button
              onClick={() => setShowAddAnimeModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#ffd700] hover:bg-[#ffea00] text-black font-montserrat font-bold text-xs transition-all shadow-[0_0_12px_rgba(255,215,0,0.3)] hover:scale-105 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Anime</span>
            </button> : <Link to="/manga" className="inline-flex items-center gap-1.5 rounded-full bg-[#ffd700] px-3.5 py-2 text-xs font-bold text-black"><BookOpen size={14} />Browse manga</Link>}

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

            {favoriteMedia === "anime" && <button
              type="button"
              onClick={() => setMergeFranchises((value) => !value)}
              aria-pressed={mergeFranchises}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border font-montserrat font-bold text-xs transition-colors ${
                mergeFranchises
                  ? "bg-violet-400/20 border-violet-300/60 text-violet-200"
                  : "bg-white/5 border-white/15 text-neutral-300 hover:text-white"
              }`}
            >
              <GitBranch size={14} />
              Franchise view
            </button>}

            {/* Share Button */}
            {favoriteMedia === "anime" && <button
              onClick={() => setShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-[#ffd700] border border-white/15 hover:border-[#ffd700] text-white hover:text-black font-montserrat font-bold text-xs transition-all cursor-pointer"
            >
              <Share2 size={14} />
              <span>Export Tier List</span>
            </button>}

            <button type="button" onClick={() => setTrashOpen((value) => !value)} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-neutral-300 hover:text-white"><Trash2 size={14} />Trash{deletedFavourites.length > 0 && <span className="rounded-full bg-white/10 px-1.5">{deletedFavourites.length}</span>}</button>

            {favoriteMedia === "anime" && viewMode === "tier" && !mergeFranchises && (
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

        {trashOpen && (
          <section className="favorite-trash">
            <header><div><span>Recovery</span><h2>Recently removed favorites</h2><p>Restore a title within five days, or delete it permanently.</p></div></header>
            {deletedFavourites.length > 0 ? <div className="favorite-trash__list">{deletedFavourites.map((item) => (
              <article key={item.originalKey}>
                <img src={item.image || "/lost.jpg"} alt="" loading="lazy" />
                <div><strong>{item.title}</strong><span>{item.mediaType === "MANGA" ? "Manga" : "Anime"}</span></div>
                <button type="button" onClick={() => restoreFavourite(item.originalKey)}><RotateCcw size={13} />Restore</button>
                <button type="button" className="is-danger" aria-label={`Permanently delete ${item.title}`} onClick={() => permanentlyDeleteFavourite(item.originalKey)}><Trash2 size={13} /></button>
              </article>
            ))}</div> : <p className="favorite-trash__empty">Trash is empty.</p>}
          </section>
        )}

        {/* Selected Item Notification Banner */}
        {favoriteMedia === "anime" && selectedAnimeId !== null && (
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

        {loading || franchiseLoading ? (
          <div className="py-20 text-center text-[#ffd700] font-montserrat font-bold flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-[#ffd700] border-t-transparent rounded-full animate-spin" />
            <span>Loading favorites...</span>
          </div>
        ) : favoriteMedia === "manga" ? (
          mangaFavourites.length > 0 ? (
            viewMode === "tier" ? (
              <MangaTierBoard items={mangaFavourites} />
            ) : (
              <div className="favorite-manga-grid">
                {mangaFavourites.map((item) => <article key={item.mal_id}>
                  <Link to={`/manga/${item.mal_id}`}><img src={item.image || "/lost.jpg"} alt={item.title} loading="lazy" /><div><span>{item.format || "Manga"}</span><h2>{item.title}</h2><p>{item.chapters ? `${item.chapters} chapters` : "Publishing details pending"}{item.score ? ` · ★ ${item.score}` : ""}</p></div></Link>
                  <button type="button" onClick={() => removeMangaFromFavourites(item.mal_id)}><Trash2 size={13} />Remove</button>
                </article>)}
              </div>
            )
          ) : <div className="text-center py-20 bg-neutral-900/40 rounded-2xl border border-white/5 space-y-4"><BookOpen size={35} className="mx-auto text-[#ffd700]" /><p className="font-montserrat font-bold text-lg text-white">No favorite manga yet</p><Link to="/manga" className="inline-flex items-center gap-2 rounded-full bg-[#ffd700] px-5 py-2.5 text-xs font-bold text-black">Browse manga</Link></div>
        ) : mergeFranchises ? (
          <div className="favorite-franchise-board" aria-label="Favorites grouped by franchise">
            <div className="favorite-franchise-note">
              <GitBranch size={17} />
              <p>
                Related seasons are grouped for viewing only. Your individual favorites, notes and tier placements stay unchanged.
              </p>
            </div>
            {franchiseTierRows.map((row) => (
              <section className="favorite-franchise-row" key={row.id}>
                <div className="favorite-franchise-tier" style={{ backgroundColor: row.color, color: row.textColor }}>
                  {row.name}
                </div>
                <div className="favorite-franchise-groups">
                  {row.groups.map((group: any) => {
                    const cover = group.images?.jpg?.large_image_url || group.members?.[0]?.images?.jpg?.large_image_url || group.members?.[0]?.image;
                    return (
                      <article className="favorite-franchise-card" key={`${row.id}-${group.mal_id}`}>
                        <img src={cover} alt="" loading="lazy" />
                        <div className="favorite-franchise-copy">
                          <span className="favorite-franchise-kicker">
                            {group.rank ? `#${group.rank} · ` : ""}{group.memberIds.length} saved {group.memberIds.length === 1 ? "title" : "titles"}
                          </span>
                          <h3>{group.title}</h3>
                          <p>{group.memberIds.length > 1 ? `${group.memberIds.length} connected entries combined` : "Single entry"}</p>
                          {group.notes.length > 0 && (
                            <div className="favorite-franchise-notes">
                              {group.notes.map((entry: any) => (
                                <span key={`${entry.title}-${entry.note}`}>{entry.title}: {entry.note}</span>
                              ))}
                            </div>
                          )}
                          <a href={`/franchise/${group.mal_id}`} className="favorite-franchise-link">
                            Full franchise guide <ChevronRight size={14} />
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
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
                <span>Add Anime</span>
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
                   <span className="text-white font-semibold">Tip:</span> Tap any anime to select <span className="text-emerald-400 font-semibold">(green outline)</span>, then tap a tier row to place it, or tap another anime in the same or different tier to <span className="text-[#ffd700] font-semibold">swap positions</span>!
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
                      <span>Waiting List</span>
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
                        Waiting list is empty!
                      </p>
                      <button
                        onClick={() => setShowAddAnimeModal(true)}
                        className="inline-flex items-center gap-1.5 text-xs text-[#ffd700] hover:underline cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Add more series</span>
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

      {/* Add Anime To list Modal */}
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
