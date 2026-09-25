import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useFavourites } from "../context/FavouritesContext";
import { useAuth } from "../context/AuthContext";
import { useGlobalContext } from "../context/global";
import { useWatchlist } from "../context/WatchlistContext";
import AuthModal from "./AuthModal";
import SEO from "./SEO";
import Footer from "./Footer";
import ProgressiveImage from "./ProgressiveImage";
import { getFranchiseGroups, getPopularManga, searchAnime, searchManga } from "../services/anilist";
import {
  Heart,
  LogIn,
  Layers,
  Grid,
  Plus,
  Trash2,
  Share2,
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
import { createSharedFavouritesPayload, encodeSharedFavourites } from "../utils/sharedFavourites";
import { usePublicShareOwner } from "../hooks/usePublicShareOwner";

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

const freshMediaTiers = (): Tier[] => DEFAULT_TIERS.map((tier) => ({ ...tier, animeIds: [] }));

const FavouriteTierBoard: React.FC<{ items: any[]; mediaType: "anime" | "manga"; onAdd: () => void; onTiersChange?: (tiers: Tier[]) => void }> = ({ items, mediaType, onAdd, onTiersChange }) => {
  const storageKey = mediaType === "manga" ? "anime_orbit_manga_tierlist" : "anime_orbit_tierlist";
  const mediaLabel = mediaType === "manga" ? "manga" : "anime";
  const [mediaTiers, setMediaTiers] = useState<Tier[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : freshMediaTiers();
    } catch {
      return freshMediaTiers();
    }
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newTierName, setNewTierName] = useState("");
  const itemMap = new Map(items.map((item) => [item.mal_id, item]));
  const assigned = new Set(mediaTiers.flatMap((tier) => tier.animeIds));
  const waiting = items.filter((item) => !assigned.has(item.mal_id));
  const ranks = new Map<number, number>();
  let nextRank = 1;
  mediaTiers.forEach((tier) => tier.animeIds.forEach((mediaId) => { if (itemMap.has(mediaId)) ranks.set(mediaId, nextRank++); }));

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(mediaTiers));
    onTiersChange?.(mediaTiers);
  }, [mediaTiers, storageKey, onTiersChange]);

  const placeInTier = (tierId: string, mediaId = selectedId) => {
    if (mediaId === null) return;
    setMediaTiers((current) => current.map((tier) => {
      const without = tier.animeIds.filter((id) => id !== mediaId);
      return tier.id === tierId ? { ...tier, animeIds: [...without, mediaId] } : { ...tier, animeIds: without };
    }));
    setSelectedId(null);
  };

  const returnToWaiting = (mediaId: number) => {
    setMediaTiers((current) => current.map((tier) => ({ ...tier, animeIds: tier.animeIds.filter((id) => id !== mediaId) })));
    setSelectedId(null);
  };

  const renderCard = (item: any) => {
    const selected = selectedId === item.mal_id;
    return <button key={item.mal_id} type="button" draggable onDragStart={(event) => event.dataTransfer.setData("text/favorite-id", String(item.mal_id))} onClick={(event) => { event.stopPropagation(); setSelectedId((current) => current === item.mal_id ? null : item.mal_id); }} className={`manga-tier-card ${selected ? "is-selected" : ""}`} aria-pressed={selected} title={`${item.title} — select to move`}>
      {ranks.has(item.mal_id) && <span>#{ranks.get(item.mal_id)}</span>}
      <ProgressiveImage src={item.image || item.images?.jpg?.large_image_url || item.images?.jpg?.image_url} fallbackSrc="/lost.jpg" alt="" wrapperClassName="h-full w-full" className="h-full w-full object-cover" />
      <strong>{item.title}</strong>
    </button>;
  };

  const resetTiers = () => {
    if (!window.confirm(`Reset every ${mediaLabel} tier and return all titles to Waiting?`)) return;
    setMediaTiers(freshMediaTiers());
    setSelectedId(null);
  };
  const addTier = () => {
    const name = newTierName.trim();
    if (!name) return;
    const colors = ["#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
    setMediaTiers((current) => [...current, { id: `${mediaType}-tier-${Date.now()}`, name: name.toUpperCase(), color: colors[current.length % colors.length], textColor: "#fff", animeIds: [] }]);
    setNewTierName("");
  };
  const moveTier = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= mediaTiers.length) return;
    setMediaTiers((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };
  const renameTier = (tier: Tier) => {
    const name = window.prompt(`Rename this ${mediaLabel} tier`, tier.name)?.trim();
    if (name) setMediaTiers((current) => current.map((item) => item.id === tier.id ? { ...item, name: name.toUpperCase() } : item));
  };
  const deleteTier = (tier: Tier) => {
    if (!window.confirm(`Delete the ${tier.name} row? Its ${mediaLabel} will return to Waiting.`)) return;
    setMediaTiers((current) => current.filter((item) => item.id !== tier.id));
  };

  return <div className="manga-tier-board space-y-4">
    <div className="favorite-tier-guide"><span><Sparkles size={16} /></span><div><strong>Touch & click active</strong><p>Select a {mediaLabel}, then choose a tier row. Anime and manga rankings stay independent.</p></div></div>
    {selectedId !== null && <div className="manga-tier-selection"><span>{itemMap.get(selectedId)?.title || (mediaType === "manga" ? "Manga" : "Anime")} selected</span><button type="button" onClick={() => returnToWaiting(selectedId)}>Move to waiting</button><button type="button" onClick={() => setSelectedId(null)}>Cancel</button></div>}
    <div className="manga-tier-workspace">
      <div className="manga-tier-main">
        <div className="manga-tier-rows">
          {mediaTiers.map((tier, index) => <section key={tier.id} onClick={() => placeInTier(tier.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const mediaId = Number(event.dataTransfer.getData("text/favorite-id")); if (mediaId) placeInTier(tier.id, mediaId); }} className={selectedId !== null ? "is-target" : ""}>
            <div className="manga-tier-label" style={{ background: tier.color, color: tier.textColor }}>{tier.name}</div>
            <div className="manga-tier-items">{tier.animeIds.map((mediaId) => itemMap.get(mediaId)).filter(Boolean).map(renderCard)}{!tier.animeIds.some((mediaId) => itemMap.has(mediaId)) && <small>{selectedId !== null ? `Place in ${tier.name}` : `No ${mediaLabel} ranked here`}</small>}</div>
            <div className="manga-tier-row-actions" onClick={(event) => event.stopPropagation()}><button type="button" disabled={index === 0} onClick={() => moveTier(index, -1)} aria-label={`Move ${tier.name} up`}><ChevronUp size={13} /></button><button type="button" disabled={index === mediaTiers.length - 1} onClick={() => moveTier(index, 1)} aria-label={`Move ${tier.name} down`}><ChevronDown size={13} /></button><button type="button" onClick={() => renameTier(tier)} aria-label={`Rename ${tier.name}`}><Edit3 size={13} /></button><button type="button" onClick={() => deleteTier(tier)} aria-label={`Delete ${tier.name}`}><Trash2 size={13} /></button></div>
          </section>)}
        </div>
        <div className="favorite-tier-footer"><label><span>New {mediaLabel} row</span><input value={newTierName} maxLength={18} onChange={(event) => setNewTierName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addTier(); }} placeholder="Row name" /></label><button type="button" onClick={addTier} disabled={!newTierName.trim()}><Plus size={14} />Add row</button><button type="button" className="is-muted" onClick={resetTiers}><RotateCcw size={14} />Reset tiers</button></div>
      </div>
      <section className="manga-tier-waiting" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const mediaId = Number(event.dataTransfer.getData("text/favorite-id")); if (mediaId) returnToWaiting(mediaId); }}><div><span>Waiting list</span><strong>{waiting.length}</strong><button type="button" onClick={onAdd} aria-label={`Add ${mediaLabel}`}><Plus size={13} /></button></div><div>{waiting.map(renderCard)}{waiting.length === 0 && <small>Every favorite {mediaLabel} has a tier.</small>}</div></section>
    </div>
  </div>;
};

export const Favourites: React.FC = () => {
  const { favourites, mangaFavourites, deletedFavourites, addToFavourites, addMangaToFavourites, removeFromFavourites, removeMangaFromFavourites, restoreFavourite, permanentlyDeleteFavourite, loading } = useFavourites();
  const { currentUser } = useAuth();
  const { popularAnime, topAiringAnime } = useGlobalContext();
  const { watchlist, mangaWatchlist } = useWatchlist();
  const publicShareOwner = usePublicShareOwner();

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
  const [mangaTiers, setMangaTiers] = useState<Tier[]>(() => {
    try {
      const saved = localStorage.getItem("anime_orbit_manga_tierlist");
      return saved ? JSON.parse(saved) : freshMediaTiers();
    } catch {
      return freshMediaTiers();
    }
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
  const [mangaCustomNotes, setMangaCustomNotes] = useState<Record<number, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("anime_orbit_manga_tier_notes") || "{}");
    } catch {
      return {};
    }
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
  const [showAddMangaModal, setShowAddMangaModal] = useState(false);
  const [animeSearchQuery, setAnimeSearchQuery] = useState("");
  const [animeCandidates, setAnimeCandidates] = useState<any[]>([]);
  const [animeCandidatesLoading, setAnimeCandidatesLoading] = useState(false);
  const [mangaSearchQuery, setMangaSearchQuery] = useState("");
  const [mangaCandidates, setMangaCandidates] = useState<any[]>([]);
  const [mangaCandidatesLoading, setMangaCandidatesLoading] = useState(false);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [favoriteMedia, setFavoriteMedia] = useState<"anime" | "manga">("anime");
  const [trashOpen, setTrashOpen] = useState(false);
  const visibleDeletedFavourites = deletedFavourites.filter((item) => favoriteMedia === "manga" ? item.mediaType === "MANGA" : item.mediaType !== "MANGA");
  const [mergeFranchises, setMergeFranchises] = useState(false);
  const [franchiseGroups, setFranchiseGroups] = useState<any[]>([]);
  const [franchiseLoading, setFranchiseLoading] = useState(false);

  const autoScrollTimer = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem("anime_orbit_tierlist", JSON.stringify(tiers));
  }, [tiers]);

  useEffect(() => {
    localStorage.setItem("anime_orbit_manga_tierlist", JSON.stringify(mangaTiers));
  }, [mangaTiers]);

  useEffect(() => {
    localStorage.setItem("anime_orbit_tier_notes", JSON.stringify(customNotes));
  }, [customNotes]);

  useEffect(() => {
    localStorage.setItem("anime_orbit_manga_tier_notes", JSON.stringify(mangaCustomNotes));
  }, [mangaCustomNotes]);

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
    if (showAddTierModal || showAddAnimeModal || showAddMangaModal || editingAnimeId !== null || editingTier !== null || shareModalOpen || authModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showAddTierModal, showAddAnimeModal, showAddMangaModal, editingAnimeId, editingTier, shareModalOpen, authModalOpen]);

  useEffect(() => {
    if (!showAddAnimeModal) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      setAnimeCandidatesLoading(true);
      try {
        const result = animeSearchQuery.trim().length >= 1
          ? await searchAnime(animeSearchQuery.trim(), 18)
          : [...(popularAnime || []), ...(topAiringAnime || [])].slice(0, 18);
        const list = Array.isArray(result) ? result : result?.media || [];
        if (active) setAnimeCandidates(list.filter((item: any, index: number, all: any[]) => all.findIndex((entry) => entry.mal_id === item.mal_id) === index));
      } catch {
        if (active) setAnimeCandidates([]);
      } finally {
        if (active) setAnimeCandidatesLoading(false);
      }
    }, animeSearchQuery.trim() ? 250 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [showAddAnimeModal, animeSearchQuery, popularAnime, topAiringAnime]);

  useEffect(() => {
    if (!showAddMangaModal) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      setMangaCandidatesLoading(true);
      try {
        const result = mangaSearchQuery.trim().length >= 1
          ? await searchManga(mangaSearchQuery.trim(), 18)
          : await getPopularManga(1, 18, "POPULARITY_DESC");
        const list = Array.isArray(result) ? result : result?.media || [];
        if (active) setMangaCandidates(list);
      } catch {
        if (active) setMangaCandidates([]);
      } finally {
        if (active) setMangaCandidatesLoading(false);
      }
    }, mangaSearchQuery.trim() ? 300 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [showAddMangaModal, mangaSearchQuery]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-transparent text-white font-sans flex flex-col">
        <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4 flex-1">
          <Heart size={56} className="mx-auto text-red-500" />
          <h2 className="text-3xl font-bold font-montserrat text-white">
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
  const gridItems = [...favourites].sort((a, b) => (linearRankMap.get(a.mal_id) || Number.MAX_SAFE_INTEGER) - (linearRankMap.get(b.mal_id) || Number.MAX_SAFE_INTEGER));
  const gridRankMap = new Map(gridItems.map((item, index) => [item.mal_id, index + 1]));
  const savedMangaTierOrder = mangaTiers.flatMap((tier) => tier.animeIds || []);
  const mangaOrder = new Map(savedMangaTierOrder.map((mediaId, index) => [mediaId, index]));
  const mangaGridItems = [...mangaFavourites].sort((a, b) => (mangaOrder.get(a.mal_id) ?? Number.MAX_SAFE_INTEGER) - (mangaOrder.get(b.mal_id) ?? Number.MAX_SAFE_INTEGER));
  const activeGridItems = favoriteMedia === "manga" ? mangaGridItems : gridItems;
  const activeGridRanks = new Map(activeGridItems.map((item, index) => [item.mal_id, index + 1]));

  // Map of all available favorites for quick lookup
  const favMap = new Map(favourites.map((f) => [f.mal_id, f]));
  const activeFavourites = favoriteMedia === "manga" ? mangaFavourites : favourites;
  const activeTiers = favoriteMedia === "manga" ? mangaTiers : tiers;
  const activeNotes = favoriteMedia === "manga" ? mangaCustomNotes : customNotes;
  const activeUserScores = new Map(
    (favoriteMedia === "manga" ? mangaWatchlist : watchlist)
      .map((item) => [Number(item.mal_id), Number(item.userScore || 0)]),
  );
  const activeFavMap = new Map(activeFavourites.map((item) => [item.mal_id, item]));
  const activeRankMap = new Map<number, number>();
  let activeRank = 1;
  activeTiers.forEach((tier) => tier.animeIds.forEach((mediaId) => {
    if (activeFavMap.has(mediaId)) activeRankMap.set(mediaId, activeRank++);
  }));
  const activeAssignedIds = new Set(activeTiers.flatMap((tier) => tier.animeIds));
  const activeUnassigned = activeFavourites.filter((item) => !activeAssignedIds.has(item.mal_id));
  const updateActiveTiers = (updater: React.SetStateAction<Tier[]>) => {
    if (favoriteMedia === "manga") setMangaTiers(updater);
    else setTiers(updater);
  };

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

    updateActiveTiers((prev) =>
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

    updateActiveTiers((prev) =>
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

    updateActiveTiers((prev) => {
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
    updateActiveTiers((prev) =>
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
      id: `${favoriteMedia}-tier-${Date.now()}`,
      name: newTierName.trim().toUpperCase(),
      color: newTierColor,
      textColor: "#ffffff",
      animeIds: [],
    };
    updateActiveTiers([...activeTiers, newTier]);
    setNewTierName("");
    setShowAddTierModal(false);
  };

  const handleMoveTierUp = (index: number) => {
    if (index <= 0) return;
    updateActiveTiers((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      return updated;
    });
  };

  const handleMoveTierDown = (index: number) => {
    if (index >= activeTiers.length - 1) return;
    updateActiveTiers((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      return updated;
    });
  };

  const handleSaveEditedTier = () => {
    if (!editingTier || !editTierName.trim()) return;
    updateActiveTiers((prev) =>
      prev.map((t) =>
        t.id === editingTier.id
          ? { ...t, name: editTierName.trim().toUpperCase(), color: editTierColor }
          : t
      )
    );
    setEditingTier(null);
  };

  const handleDeleteTier = (tierId: string) => {
    updateActiveTiers((prev) => prev.filter((t) => t.id !== tierId));
  };

  const handleResetTiers = () => {
    if (!window.confirm(`Reset every ${favoriteMedia} tier and return all favorites to the Waiting List?`)) return;
    updateActiveTiers(freshMediaTiers());
    setSelectedAnimeId(null);
  };

  const handleSaveNote = (animeId: number) => {
    if (favoriteMedia === "manga") setMangaCustomNotes((prev) => ({ ...prev, [animeId]: editingNoteText.trim() }));
    else setCustomNotes((prev) => ({ ...prev, [animeId]: editingNoteText.trim() }));
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
        <div className="absolute top-1 left-1 z-20 flex items-center gap-0.5 bg-gradient-to-r from-[#ffd700] via-[#ffea00] to-[#f39c12] text-black font-bold text-[10px] px-1.5 py-0.5 rounded-md shadow-[0_0_12px_rgba(255,215,0,0.9)] border border-white">
          <Crown size={10} className="fill-black" />
          <span>#1</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="absolute top-1 left-1 z-20 flex items-center gap-0.5 bg-gradient-to-r from-slate-100 to-slate-300 text-black font-bold text-[10px] px-1.5 py-0.5 rounded-md shadow-[0_0_10px_rgba(255,255,255,0.8)] border border-slate-400">
          <Award size={10} />
          <span>#2</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="absolute top-1 left-1 z-20 flex items-center gap-0.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-md shadow-md border border-amber-300">
          <Award size={10} />
          <span>#3</span>
        </div>
      );
    }
    if (rank === 4 || rank === 5) {
      return (
        <div className="absolute top-1 left-1 z-20 flex items-center gap-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-md shadow-md border border-purple-300">
          <Sparkles size={9} />
          <span>#{rank}</span>
        </div>
      );
    }
    return (
      <div className="absolute top-1 left-1 z-20 bg-black/85 text-[#ffd700] border border-[#ffd700]/50 font-bold text-[9px] px-1 py-0.5 rounded-md shadow">
        #{rank}
      </div>
    );
  };

  const createSharedFavouritesUrl = () => {
    const payload = createSharedFavouritesPayload(
      activeFavourites,
      activeTiers,
      favoriteMedia,
      activeUserScores,
      publicShareOwner,
    );
    return `${window.location.origin}/shared-favourites#${encodeSharedFavourites(payload)}`;
  };

  const handleOpenSharedFavourites = () => {
    const url = createSharedFavouritesUrl();
    if (url.length > 120000) {
      toast.error("This tier list is too large for a private share link.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareFavourites = async () => {
    const mediaLabel = favoriteMedia === "manga" ? "Manga" : "Anime";
    const url = createSharedFavouritesUrl();
    if (url.length > 120000) {
      toast.error("This tier list is too large for a private share link.");
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({
          title: `My ${mediaLabel} Favourites Tier List`,
          text: `${activeFavourites.length} ranked favourites from Anime Orbit`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Private tier-list link copied!");
      }
    } catch {
      // Closing the native share sheet requires no error message.
    }
  };

  const handleCopySummary = () => {
    const mediaLabel = favoriteMedia === "manga" ? "Manga" : "Anime";
    const text = activeTiers
      .map((t) => {
        const titles = t.animeIds
          .map((id) => {
            const a = activeFavMap.get(id);
            const r = activeRankMap.get(id) || 0;
            const score = Number(activeUserScores.get(id) || 0);
            return `#${r} ${a?.title || a?.title_english || mediaLabel} · Your score: ${score > 0 ? score.toFixed(2).replace(/\.00$/, ".0") : "Not rated"}`;
          })
          .filter(Boolean)
          .join(", ");
        return `[${t.name}] ${titles || "None"}`;
      })
      .join("\n");

    navigator.clipboard.writeText(`My ${mediaLabel} Tier List:\n\n${text}`);
    setCopied(true);
    toast.success("Tier list summary copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter pool candidates for Add Anime to Pool modal
  const poolCandidates = animeCandidates;

  return (
    <div className="min-h-screen bg-transparent text-white font-sans flex flex-col">
      <SEO
        title="My Favorites & Custom Anime Tier List"
        description="Build, organize, and customize your personal anime tier lists and favorite series across all genres on Anime Orbit."
        keywords="anime tier list, anime favorites, custom anime tier rankings, Anime Orbit"
        url="https://animeorbit.web.app/favourites"
        noIndex
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-12 space-y-6 sm:space-y-8 flex-1 w-full">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Heart size={30} className="text-yellow-500 fill-yellow-500" />
            <h1 className="text-2xl sm:text-3xl font-bold font-montserrat text-white">
              Favorites
            </h1>
            <span className="text-xs font-bold text-neutral-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              {favoriteMedia === "anime" ? `${favourites.length} Anime` : `${mangaFavourites.length} Manga`}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex rounded-full border border-white/10 bg-white/5 p-1 text-xs font-bold">
              <button type="button" onClick={() => { setSelectedAnimeId(null); setFavoriteMedia("anime"); }} className={`rounded-full px-4 py-1.5 ${favoriteMedia === "anime" ? "bg-[#ffd700] text-black" : "text-neutral-300"}`}>Anime</button>
              <button type="button" onClick={() => { setSelectedAnimeId(null); setFavoriteMedia("manga"); setMergeFranchises(false); }} className={`rounded-full px-4 py-1.5 ${favoriteMedia === "manga" ? "bg-[#ffd700] text-black" : "text-neutral-300"}`}>Manga</button>
            </div>
            {/* Add Anime to Pool Button */}
            {favoriteMedia === "anime" ? <button
              onClick={() => setShowAddAnimeModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#ffd700] hover:bg-[#ffea00] text-black font-montserrat font-bold text-xs transition-all shadow-[0_0_12px_rgba(255,215,0,0.3)] hover:scale-105 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Anime</span>
            </button> : <button type="button" onClick={() => { setMangaSearchQuery(""); setShowAddMangaModal(true); }} className="inline-flex items-center gap-1.5 rounded-full bg-[#ffd700] px-3.5 py-2 text-xs font-bold text-black"><Plus size={14} />Add Manga</button>}

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
            <button
              onClick={() => setShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-[#ffd700] border border-white/15 hover:border-[#ffd700] text-white hover:text-black font-montserrat font-bold text-xs transition-all cursor-pointer"
            >
              <Share2 size={14} />
              <span>Share Tier List</span>
            </button>

            <button type="button" aria-pressed={trashOpen} onClick={() => setTrashOpen((value) => !value)} className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-colors ${trashOpen ? "border-[#ffd700]/60 bg-[#ffd700]/10 text-[#ffd700]" : "border-white/15 bg-white/5 text-neutral-300 hover:text-white"}`}><Trash2 size={14} />Trash{visibleDeletedFavourites.length > 0 && <span className="rounded-full bg-white/10 px-1.5">{visibleDeletedFavourites.length}</span>}</button>

          </div>
        </div>

        {trashOpen && (
          <section className="favorite-trash">
            <header><div><span>Recovery</span><h2>Recently removed favorites</h2><p>Restore a title within five days, or delete it permanently.</p></div></header>
            {visibleDeletedFavourites.length > 0 ? <div className="favorite-trash__list">{visibleDeletedFavourites.map((item) => (
              <article key={item.originalKey}>
                <ProgressiveImage src={item.image} alt="" wrapperClassName="favorite-trash__cover" className="h-full w-full object-cover" />
                <div><strong>{item.title}</strong><span>{item.mediaType === "MANGA" ? (item.format || "Manga") : "Anime"}</span></div>
                <button type="button" onClick={() => restoreFavourite(item.originalKey)}><RotateCcw size={13} />Restore</button>
                <button type="button" className="is-danger" aria-label={`Permanently delete ${item.title}`} onClick={() => { if (window.confirm(`Permanently delete ${item.title}?`)) void permanentlyDeleteFavourite(item.originalKey); }}><Trash2 size={13} /></button>
              </article>
            ))}</div> : <p className="favorite-trash__empty">Trash is empty.</p>}
          </section>
        )}

        {/* Selected Item Notification Banner */}
        {selectedAnimeId !== null && (
          <div className="bg-emerald-950/80 border-2 border-emerald-400 rounded-xl p-3 flex items-center justify-between shadow-[0_0_20px_rgba(52,211,153,0.3)] animate-pulse">
            <div className="flex items-center gap-2 text-emerald-300 text-xs sm:text-sm font-bold">
              <Sparkles size={16} />
              <span>
                "{activeFavMap.get(selectedAnimeId)?.title || (favoriteMedia === "manga" ? "Manga" : "Anime")}" selected! Tap any Tier row below to place it there.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const selectedId = selectedAnimeId;
                  setSelectedAnimeId(null);
                  if (favoriteMedia === "manga") void removeMangaFromFavourites(selectedId);
                  else void removeFromFavourites(selectedId);
                }}
                className="favorite-selection-trash"
              >
                <Trash2 size={14} /> Trash
              </button>
              <button
                onClick={() => setSelectedAnimeId(null)}
                className="text-emerald-400 hover:text-white text-xs px-2 py-1 bg-emerald-900/60 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading || franchiseLoading ? (
          <div className="py-20 text-center text-[#ffd700] font-montserrat font-bold flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-[#ffd700] border-t-transparent rounded-full animate-spin" />
            <span>Loading favorites...</span>
          </div>
        ) : viewMode === "grid" && !mergeFranchises ? (
          activeGridItems.length === 0 ? (
            <div className="text-center py-20 bg-neutral-900/40 rounded-2xl border border-white/5 space-y-4">
              {favoriteMedia === "manga" ? <BookOpen size={35} className="mx-auto text-[#ffd700]" /> : <Heart size={35} className="mx-auto text-[#ffd700]" />}
              <p className="font-montserrat font-bold text-lg text-white">No favorite {favoriteMedia} yet</p>
              <button type="button" onClick={() => favoriteMedia === "manga" ? setShowAddMangaModal(true) : setShowAddAnimeModal(true)} className="inline-flex items-center gap-2 rounded-full bg-[#ffd700] px-5 py-2.5 text-xs font-bold text-black"><Plus size={14} /> Add {favoriteMedia === "manga" ? "Manga" : "Anime"}</button>
            </div>
          ) : (
            <div className="favorite-grid-view">
              {activeGridItems.map((item: any) => {
                const image = item.image || item.images?.jpg?.large_image_url || item.images?.jpg?.image_url;
                const rank = activeGridRanks.get(item.mal_id) || 0;
                const ranked = favoriteMedia === "manga" ? mangaOrder.has(item.mal_id) : linearRankMap.has(item.mal_id);
                return <article key={item.mal_id} className="favorite-grid-card">
                  <Link to={`/${favoriteMedia}/${item.mal_id}`}>
                    <ProgressiveImage src={image} fallbackSrc="/lost.jpg" alt={item.title || item.title_english} wrapperClassName="favorite-grid-card__cover" className="h-full w-full object-cover" />
                    <span className="favorite-grid-card__rank">#{rank}</span>
                    <div><small>{ranked ? "Ranked favorite" : "Waiting to rank"}</small><h2>{item.title || item.title_english}</h2><p>{item.format || item.type || (favoriteMedia === "manga" ? "Manga" : "Anime")}{item.score ? ` · ★ ${item.score}` : ""}</p></div>
                  </Link>
                  <button type="button" aria-label={`Remove ${item.title || item.title_english}`} onClick={() => favoriteMedia === "manga" ? removeMangaFromFavourites(item.mal_id) : removeFromFavourites(item.mal_id)}><Trash2 size={13} /></button>
                </article>;
              })}
            </div>
          )
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
                        <ProgressiveImage src={cover} alt="" wrapperClassName="favorite-franchise-card__cover" className="h-full w-full object-cover" />
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
                          <Link to={`/franchise/${group.mal_id}`} className="favorite-franchise-link">
                            Full franchise guide <ChevronRight size={14} />
                          </Link>
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
            <div className="favorite-grid-view">
              {gridItems.map((item) => {
                const image = (item as any).images?.jpg?.large_image_url || (item as any).image;
                const rank = gridRankMap.get(item.mal_id) || 0;
                return <article key={item.mal_id} className="favorite-grid-card">
                  <Link to={`/anime/${item.mal_id}`}>
                    <ProgressiveImage src={image} alt={item.title || item.title_english} wrapperClassName="favorite-grid-card__cover" className="h-full w-full object-cover" />
                    <span className="favorite-grid-card__rank">#{rank}</span>
                    <div><small>{linearRankMap.has(item.mal_id) ? "Ranked favorite" : "Waiting to rank"}</small><h2>{item.title || item.title_english}</h2><p>{(item as any).type || "Anime"}{item.score ? ` · ★ ${item.score}` : ""}</p></div>
                  </Link>
                  <button type="button" aria-label={`Remove ${item.title || item.title_english}`} onClick={() => removeFromFavourites(item.mal_id)}><Trash2 size={13} /></button>
                </article>;
              })}
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
                   <span className="text-white font-semibold">Tip:</span> Tap any {favoriteMedia} to select <span className="text-emerald-400 font-semibold">(green outline)</span>, then tap a tier row to place it, or tap another title to <span className="text-[#ffd700] font-semibold">swap positions</span>.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (lg:col-span-8 / 9): Tier Rows */}
              <div className="lg:col-span-8 xl:col-span-9 space-y-3">
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/50 p-2 sm:p-4 backdrop-blur-md space-y-3">
                  {activeTiers.map((tier, index) => {
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
                          className="w-20 sm:w-28 flex-shrink-0 flex flex-col items-center justify-center font-montserrat font-bold text-xl sm:text-2xl text-center p-2 select-none shadow-md cursor-pointer hover:brightness-110 group relative"
                          title="Click to rename or change color"
                        >
                          <span className="truncate w-full">{tier.name}</span>
                          <span className="text-[9px] opacity-0 group-hover:opacity-90 font-medium text-white/90">Edit</span>
                        </div>

                        {/* Tier Items Grid & Tap Target */}
                        <div className="flex-1 flex flex-wrap items-center gap-2 sm:gap-3 p-2 sm:p-3 min-h-[90px]">
                          {tier.animeIds.map((animeId) => {
                            const anime = activeFavMap.get(animeId);
                            if (!anime) return null;
                            const img = (anime as any).images?.jpg?.large_image_url || (anime as any).image || "";
                            const rank = activeRankMap.get(animeId) || 0;
                            const isSelected = selectedAnimeId === animeId;
                            const note = activeNotes[animeId];

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
                                    setEditingNoteText(activeNotes[animeId] || "");
                                  }}
                                  className="absolute bottom-1 left-1 z-20 p-1 rounded-md bg-black/80 text-[#ffd700] opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                  title="Edit info note"
                                >
                                  <Edit3 size={11} />
                                </button>

                                {/* Tooltip Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pointer-events-none z-10">
                                  <span className="text-[11px] font-bold text-white leading-tight line-clamp-2">
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
                                ? `Tap here to place the selected ${favoriteMedia}`
                                : `Tap a ${favoriteMedia} to rank it in ${tier.name}`}
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
                            disabled={index === activeTiers.length - 1}
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
                  <div className="favorite-tier-footer">
                    <button type="button" onClick={() => setShowAddTierModal(true)}><Plus size={14} />Add row</button>
                    <button type="button" className="is-muted" onClick={handleResetTiers}><RotateCcw size={14} />Reset tiers</button>
                  </div>
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
                      {activeUnassigned.length} series waiting
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      favoriteMedia === "manga" ? setShowAddMangaModal(true) : setShowAddAnimeModal(true);
                    }}
                    className="p-1.5 rounded-lg bg-[#ffd700]/15 border border-[#ffd700]/40 text-[#ffd700] hover:bg-[#ffd700] hover:text-black transition-all cursor-pointer"
                    title={`Add ${favoriteMedia === "manga" ? "Manga" : "Anime"} to Pool`}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Pool Items Grid */}
                <div className="flex flex-wrap gap-2.5 min-h-[140px] max-h-[480px] overflow-y-auto p-2 bg-black/40 rounded-xl border border-dashed border-white/15 items-center content-start">
                  {activeUnassigned.map((item) => {
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
                          <span className="text-[10px] font-bold text-white leading-tight line-clamp-2">
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

                  {activeUnassigned.length === 0 && (
                    <div className="w-full text-center py-6 space-y-2">
                      <p className="text-xs text-neutral-400 font-medium">
                        Waiting list is empty!
                      </p>
                      <button
                        onClick={() => favoriteMedia === "manga" ? setShowAddMangaModal(true) : setShowAddAnimeModal(true)}
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
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#18181b] border border-[#ffd700]/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-montserrat font-bold text-base text-[#ffd700]">
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
      {showAddAnimeModal && createPortal((
        <div
          onClick={() => setShowAddAnimeModal(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[5000] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[82vh] w-full max-w-xl flex-col rounded-2xl border border-white/15 bg-[#17171d] p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-[#ffd700]" />
                <h3 className="font-montserrat font-bold text-base text-white">
                  Add Anime
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
                autoFocus
                placeholder="Search anime titles..."
                value={animeSearchQuery}
                onChange={(e) => setAnimeSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/30 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-[#ffd700]"
              />
            </div>

            {/* Candidate List */}
            <div className="mt-4 min-h-0 flex-1 overflow-y-auto space-y-2 pr-1">
              {animeCandidatesLoading && Array.from({ length: 4 }).map((_, index) => <div key={`anime-search-skeleton-${index}`} className="h-20 animate-pulse rounded-xl bg-white/5" />)}
              {!animeCandidatesLoading && animeSearchQuery.trim().length < 1 && poolCandidates.length > 0 && <p className="px-1 pb-1 text-[11px] font-bold uppercase tracking-wide text-[#ffd700]">Recommended for you</p>}
              {!animeCandidatesLoading && poolCandidates.map((anime) => {
                const isAlreadyFav = favourites.some((f) => f.mal_id === anime.mal_id);
                const title = anime.title || anime.title_english || "Anime";
                const img = (anime as any).images?.jpg?.image_url || (anime as any).image || "";

                return (
                  <div
                    key={`cand-${anime.mal_id}`}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ProgressiveImage src={img} fallbackSrc="/lost.jpg" alt={title} wrapperClassName="h-16 w-12 flex-shrink-0 rounded-lg" className="h-full w-full object-cover" />
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
              {!animeCandidatesLoading && animeSearchQuery.trim().length >= 1 && poolCandidates.length === 0 && <p className="py-8 text-center text-sm text-neutral-500">No matches found.</p>}
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
      ), document.body)}

      {showAddMangaModal && createPortal((
        <div onClick={() => setShowAddMangaModal(false)} className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div onClick={(event) => event.stopPropagation()} className="flex max-h-[82vh] w-full max-w-xl flex-col rounded-2xl border border-white/15 bg-[#17171d] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div><h3 className="font-montserrat text-xl font-bold text-white">Add Manga</h3><p className="mt-1 text-xs text-neutral-400">Search for a title or pick from popular manga.</p></div>
              <button type="button" onClick={() => setShowAddMangaModal(false)} className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-neutral-300 hover:text-white"><X size={16} /></button>
            </div>
            <div className="relative mt-4"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" /><input autoFocus value={mangaSearchQuery} onChange={(event) => setMangaSearchQuery(event.target.value)} placeholder="Search manga titles..." className="w-full rounded-xl border border-white/15 bg-black/30 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-[#ffd700]" /></div>
            <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {mangaCandidatesLoading && <div className="py-12 text-center text-xs font-bold text-[#ffd700]">Loading manga…</div>}
              {!mangaCandidatesLoading && mangaCandidates.map((manga) => {
                const alreadySaved = mangaFavourites.some((item) => item.mal_id === manga.mal_id);
                const cover = manga.images?.jpg?.image_url || manga.images?.jpg?.large_image_url || manga.image;
                return <article key={`manga-candidate-${manga.mal_id}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                  <ProgressiveImage src={cover} alt="" wrapperClassName="h-14 w-10 flex-shrink-0 rounded-lg" className="h-full w-full object-cover" />
                  <div className="min-w-0 flex-1"><strong className="block truncate text-xs text-white">{manga.title || manga.title_english}</strong><span className="text-[10px] text-neutral-400">{manga.format || manga.type || "Manga"}{manga.chapters ? ` · ${manga.chapters} chapters` : ""}</span></div>
                  <button type="button" disabled={alreadySaved} onClick={async () => { const added = await addMangaToFavourites(manga); if (added) setMangaCandidates((items) => [...items]); }} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-bold ${alreadySaved ? "bg-white/10 text-neutral-500" : "bg-[#ffd700] text-black"}`}>{alreadySaved ? <><Check size={12} />Saved</> : <><Plus size={12} />Add</>}</button>
                </article>;
              })}
              {!mangaCandidatesLoading && mangaCandidates.length === 0 && <p className="py-12 text-center text-xs text-neutral-400">No manga found. Try another title.</p>}
            </div>
            <div className="border-t border-white/10 pt-3 text-right"><button type="button" onClick={() => setShowAddMangaModal(false)} className="rounded-xl bg-white/10 px-5 py-2 text-xs font-bold text-white">Done</button></div>
          </div>
        </div>
      ), document.body)}

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
              {activeFavMap.get(editingAnimeId)?.title || (favoriteMedia === "manga" ? "Manga" : "Anime")}
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
                {activeTiers.map((t) => (
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
      {shareModalOpen && createPortal((
        <div
          onClick={() => setShareModalOpen(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[5000] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#18181b] border border-[#ffd700]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Share2 size={18} className="text-[#ffd700]" />
                <h3 className="font-montserrat font-bold text-base text-white">
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
              Share a privacy-safe tier-list page or copy formatted rankings. Account details, private notes, and deleted favourites are excluded.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleOpenSharedFavourites}
                className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-[#ffd700]/15 border border-white/10 hover:border-[#ffd700] rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <ExternalLink size={18} className="text-[#ffd700]" />
                  <div>
                    <div className="text-white group-hover:text-[#ffd700]">Open Shared Page</div>
                    <div className="text-[11px] text-neutral-400">Preview the private tier-list route</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-neutral-500 group-hover:text-[#ffd700]" />
              </button>

              <button
                onClick={() => void handleShareFavourites()}
                className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-[#ffd700]/15 border border-white/10 hover:border-[#ffd700] rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Share2 size={18} className="text-[#ffd700]" />
                  <div>
                    <div className="text-white group-hover:text-[#ffd700]">Share Page</div>
                    <div className="text-[11px] text-neutral-400">Use the share sheet or copy its link</div>
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
      ), document.body)}

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
              {activeFavMap.get(selectedAnimeId)?.title || (favoriteMedia === "manga" ? "Manga" : "Anime")}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-nowrap">
            {activeTiers.map((t) => (
              <button
                key={t.id}
                onClick={() => handleDropOnTier(t.id)}
                style={{ backgroundColor: t.color }}
                className="px-3 py-1 rounded-lg text-white font-bold text-xs shadow hover:scale-110 active:scale-95 transition-transform cursor-pointer flex-shrink-0"
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
