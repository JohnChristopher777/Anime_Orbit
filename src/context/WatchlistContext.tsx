import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { db } from "../firebase/config";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";
import { isOngoingMediaStatus, statusAtKnownTotal } from "../utils/trackingStatus";

export interface WatchlistItem {
  id?: string;
  mal_id: number;
  title: string;
  title_english?: string;
  image_url?: string;
  image?: string;
  score?: number | string | null;
  episodes?: number | null;
  type?: string;
  genres?: string[];
  status?: string;
  addedAt?: string;
  updatedAt?: string;
  watchedAt?: string;
  startDate?: string;
  endDate?: string;
  personalNotes?: string;
  progress?: number;
  userScore?: number;
  mediaType?: "ANIME" | "MANGA";
  releaseStatus?: string;
}

export interface MangaWatchlistItem extends WatchlistItem {
  chapters?: number | null;
  volumes?: number | null;
  format?: string;
  countryOfOrigin?: string | null;
}

export interface DeletedLibraryItem extends MangaWatchlistItem {
  originalKey: string;
  sourceCollection: "watchlist";
  deletedAt: string | Timestamp;
  purgeAfter: string | Timestamp;
}

const dateMillis = (value: string | Timestamp | undefined) => {
  if (!value) return Number.NaN;
  return typeof value === "string" ? Date.parse(value) : value.toMillis();
};

const localTrashKey = (uid: string) => `anime_orbit_local_trash_${uid}`;
const readLocalTrash = (uid: string): DeletedLibraryItem[] => {
  try {
    const records = JSON.parse(localStorage.getItem(localTrashKey(uid)) || "[]");
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
};
const writeLocalTrash = (uid: string, records: DeletedLibraryItem[]) => {
  localStorage.setItem(localTrashKey(uid), JSON.stringify(records));
};

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  watched: WatchlistItem[];
  mangaWatchlist: MangaWatchlistItem[];
  deletedItems: DeletedLibraryItem[];
  loading: boolean;
  addToWatchlist: (anime: any) => Promise<void>;
  removeFromWatchlist: (animeId: number) => Promise<void>;
  addToWatched: (anime: any) => Promise<void>;
  removeFromWatched: (animeId: number) => Promise<void>;
  isInWatchlist: (animeId: number) => boolean;
  isWatched: (animeId: number) => boolean;
  updateAnimeStatus: (anime: any, status: string | null) => Promise<void>;
  getAnimeStatus: (animeId: number) => string | null;
  updateWatchlistEntry: (animeId: number, updates: Partial<Pick<WatchlistItem, "status" | "startDate" | "endDate" | "personalNotes" | "progress" | "userScore" | "episodes" | "releaseStatus">>) => Promise<void>;
  addMangaToWatchlist: (manga: any) => Promise<void>;
  removeMangaFromWatchlist: (mangaId: number) => Promise<void>;
  updateMangaWatchlistEntry: (mangaId: number, updates: Partial<Pick<MangaWatchlistItem, "status" | "startDate" | "endDate" | "personalNotes" | "progress" | "userScore" | "chapters" | "releaseStatus">>) => Promise<void>;
  restoreDeletedItem: (originalKey: string) => Promise<void>;
  permanentlyDeleteItem: (originalKey: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export const useWatchlist = (): WatchlistContextType => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used within WatchlistProvider");
  }
  return context;
};

export const WatchlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watched, setWatched] = useState<WatchlistItem[]>([]);
  const [mangaWatchlist, setMangaWatchlist] = useState<MangaWatchlistItem[]>([]);
  const [deletedItems, setDeletedItems] = useState<DeletedLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch watchlist and watched anime from Firestore
  useEffect(() => {
    if (!currentUser) {
      setWatchlist([]);
      setWatched([]);
      setMangaWatchlist([]);
      setDeletedItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const watchlistRef = collection(db, "users", currentUser.uid, "watchlist");
      const unsubscribeWatchlist = onSnapshot(
        watchlistRef,
        (snapshot) => {
          const watchlistData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as WatchlistItem));
          setWatchlist(watchlistData.filter((item) => item.mediaType !== "MANGA" && item.type !== "Manga"));
          setMangaWatchlist(watchlistData.filter((item) => item.mediaType === "MANGA" || item.type === "Manga") as MangaWatchlistItem[]);
        },
        () => {
          // Graceful suppression of initial load error
        }
      );

      const watchedRef = collection(db, "users", currentUser.uid, "watched");
      const unsubscribeWatched = onSnapshot(
        watchedRef,
        (snapshot) => {
          const watchedData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as WatchlistItem));
          setWatched(watchedData);
          setLoading(false);
        },
        () => {
          setLoading(false);
        }
      );

      const trashRef = collection(db, "users", currentUser.uid, "trash");
      const unsubscribeTrash = onSnapshot(trashRef, (snapshot) => {
        const now = Date.now();
        const active: DeletedLibraryItem[] = [];
        const expiredKeys: string[] = [];
        snapshot.docs.forEach((entry) => {
          const item = { id: entry.id, ...entry.data() } as DeletedLibraryItem;
          if (dateMillis(item.purgeAfter) <= now) expiredKeys.push(entry.id);
          else if (!item.sourceCollection || item.sourceCollection === "watchlist") active.push(item);
        });
        const allLocal = readLocalTrash(currentUser.uid).filter((item) => dateMillis(item.purgeAfter) > now);
        writeLocalTrash(currentUser.uid, allLocal);
        const localActive = allLocal.filter((item) => !item.sourceCollection || item.sourceCollection === "watchlist");
        const merged = [...active, ...localActive.filter((local) => !active.some((cloud) => cloud.originalKey === local.originalKey))];
        setDeletedItems(merged.sort((a, b) => dateMillis(b.deletedAt) - dateMillis(a.deletedAt)));
        if (expiredKeys.length) {
          const cleanup = writeBatch(db);
          expiredKeys.forEach((key) => cleanup.delete(doc(db, "users", currentUser.uid, "trash", key)));
          void cleanup.commit();
        }
      }, () => {
        const allLocal = readLocalTrash(currentUser.uid).filter((item) => dateMillis(item.purgeAfter) > Date.now());
        writeLocalTrash(currentUser.uid, allLocal);
        const active = allLocal.filter((item) => !item.sourceCollection || item.sourceCollection === "watchlist");
        setDeletedItems(active);
      });

      return () => {
        unsubscribeWatchlist();
        unsubscribeWatched();
        unsubscribeTrash();
      };
    } catch {
      setLoading(false);
    }
  }, [currentUser]);

  const addToWatchlist = async (anime: any) => {
    if (!currentUser) {
      toast.error("Please login to add to watchlist");
      return;
    }

    try {
      const animeData: WatchlistItem = {
        mal_id: anime.mal_id,
        title: anime.title || anime.title_english || "Unknown Anime",
        title_english: anime.title_english || anime.title,
        image_url:
          anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || anime.image || "",
        score: anime.score || null,
        episodes: anime.episodes || null,
        type: anime.type || "TV",
        genres: (anime.genres || []).map((genre: any) => typeof genre === "string" ? genre : genre?.name).filter(Boolean),
        mediaType: "ANIME",
        releaseStatus: anime.status || "",
        status: "Plan to Watch",
        addedAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, "users", currentUser.uid, "watchlist", anime.mal_id.toString()),
        animeData,
        { merge: true }
      );

      toast.success("Added to watchlist!");
    } catch {
      toast.error("Failed to add to watchlist");
    }
  };

  const restoreDeletedItem = async (originalKey: string) => {
    if (!currentUser) return;
    try {
      let item = deletedItems.find((entry) => entry.originalKey === originalKey || entry.id === originalKey);
      if (!item) {
        const snapshot = await getDoc(doc(db, "users", currentUser.uid, "trash", originalKey));
        if (snapshot.exists()) item = { id: snapshot.id, ...snapshot.data() } as DeletedLibraryItem;
      }
      if (!item) return;
      const { id: _id, originalKey: _key, sourceCollection: _source, deletedAt: _deleted, purgeAfter: _purge, ...restored } = item;
      const batch = writeBatch(db);
      batch.set(doc(db, "users", currentUser.uid, "watchlist", item.originalKey), restored, { merge: true });
      batch.delete(doc(db, "users", currentUser.uid, "trash", item.originalKey));
      try {
        await batch.commit();
      } catch {
        await setDoc(doc(db, "users", currentUser.uid, "watchlist", item.originalKey), restored, { merge: true });
      }
      const remainingLocal = readLocalTrash(currentUser.uid).filter((entry) => entry.originalKey !== item!.originalKey);
      writeLocalTrash(currentUser.uid, remainingLocal);
      setDeletedItems((items) => items.filter((entry) => entry.originalKey !== item!.originalKey));
      toast.success(`${item.title} restored`);
    } catch {
      toast.error("Could not restore this title");
    }
  };

  const softDeleteItem = async (item: WatchlistItem | MangaWatchlistItem, originalKey: string) => {
    if (!currentUser) return;
    const deletedAt = new Date();
    const purgeAfter = new Date(deletedAt.getTime() + 5 * 24 * 60 * 60 * 1000);
    const deletedItem: DeletedLibraryItem = {
      ...item,
      originalKey,
      sourceCollection: "watchlist",
      deletedAt: Timestamp.fromDate(deletedAt),
      purgeAfter: Timestamp.fromDate(purgeAfter),
    };
    const batch = writeBatch(db);
    batch.set(doc(db, "users", currentUser.uid, "trash", originalKey), deletedItem);
    batch.delete(doc(db, "users", currentUser.uid, "watchlist", originalKey));
    try {
      await batch.commit();
    } catch {
      const localItem = { ...deletedItem, deletedAt: deletedAt.toISOString(), purgeAfter: purgeAfter.toISOString() };
      const local = readLocalTrash(currentUser.uid).filter((entry) => entry.originalKey !== originalKey);
      writeLocalTrash(currentUser.uid, [localItem, ...local]);
      await deleteDoc(doc(db, "users", currentUser.uid, "watchlist", originalKey));
      setDeletedItems((items) => [localItem, ...items.filter((entry) => entry.originalKey !== originalKey)]);
    }
    toast(({ closeToast }) => (
      <div className="flex w-full items-center gap-3 text-xs">
        <span className="min-w-0 flex-1"><strong className="block truncate text-white">{item.title}</strong><span className="text-neutral-400">Moved to Trash for 5 days</span></span>
        <button type="button" className="ml-auto flex-shrink-0 rounded-full bg-[#ffd700] px-3 py-1.5 font-bold text-black" onClick={() => { void restoreDeletedItem(originalKey); closeToast?.(); }}>Undo</button>
      </div>
    ), { autoClose: 7000 });
  };

  const removeFromWatchlist = async (animeId: number) => {
    if (!currentUser) return;
    const item = watchlist.find((entry) => entry.mal_id === animeId);
    if (!item) return;
    try {
      await softDeleteItem(item, animeId.toString());
    } catch {
      toast.error("Failed to move this title to Trash");
    }
  };

  const addToWatched = async (anime: any) => {
    if (!currentUser) {
      toast.error("Please login to mark as watched");
      return;
    }

    try {
      const animeData: WatchlistItem = {
        mal_id: anime.mal_id,
        title: anime.title || anime.title_english || "Unknown Anime",
        title_english: anime.title_english || anime.title,
        image_url:
          anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || anime.image || "",
        score: anime.score || null,
        episodes: anime.episodes || null,
        type: anime.type || "TV",
        mediaType: "ANIME",
        releaseStatus: anime.status || "",
        genres: anime.genres?.map((g: any) => g.name || g) || [],
        status: "Completed",
        watchedAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, "users", currentUser.uid, "watched", anime.mal_id.toString()),
        animeData
      );

      await deleteDoc(doc(db, "users", currentUser.uid, "watchlist", anime.mal_id.toString()));
      toast.success("Marked as watched!");
    } catch {
      toast.error("Failed to mark as watched");
    }
  };

  const removeFromWatched = async (animeId: number) => {
    if (!currentUser) return;

    try {
      await deleteDoc(
        doc(db, "users", currentUser.uid, "watched", animeId.toString())
      );
      toast.info("Removed from watched");
    } catch {
      toast.error("Failed to remove from watched");
    }
  };

  const isInWatchlist = (animeId: number): boolean => {
    return watchlist.some((item) => item.mal_id === animeId);
  };

  const isWatched = (animeId: number): boolean => {
    return watched.some((item) => item.mal_id === animeId);
  };

  const updateAnimeStatus = async (anime: any, status: string | null) => {
    if (!currentUser) {
      toast.error("Please login to track anime status");
      return;
    }

    if (!status) {
      try {
        const currentItem = watchlist.find((entry) => entry.mal_id === anime.mal_id);
        if (currentItem) {
          await softDeleteItem(currentItem, anime.mal_id.toString());
        } else {
          await deleteDoc(
            doc(db, "users", currentUser.uid, "watchlist", anime.mal_id.toString())
          );
        }
        await deleteDoc(
          doc(db, "users", currentUser.uid, "watched", anime.mal_id.toString())
        );
      } catch {
        toast.error("Failed to remove tracker status");
      }
      return;
    }

    try {
      const existingItem = watchlist.find((item) => item.mal_id === anime.mal_id);
      const episodeTotal = Number(anime.episodes || existingItem?.episodes || 0);
      const normalizedStatus = status === "Completed" && isOngoingMediaStatus(anime.status)
        ? "Caught Up"
        : status;
      const animeData: WatchlistItem = {
        mal_id: anime.mal_id,
        title: anime.title || anime.title_english || "Unknown Anime",
        title_english: anime.title_english || anime.title,
        image_url:
          anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || anime.image || "",
        score: anime.score || null,
        episodes: anime.episodes || null,
        type: anime.type || "TV",
        mediaType: "ANIME",
        releaseStatus: anime.status || "",
        genres: anime.genres?.map((g: any) => g.name || g) || [],
        status: normalizedStatus,
        ...((normalizedStatus === "Completed" || normalizedStatus === "Caught Up") && episodeTotal > 0 ? { progress: episodeTotal, ...(normalizedStatus === "Completed" ? { endDate: existingItem?.endDate || new Date().toISOString().slice(0, 10) } : {}) } : {}),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, "users", currentUser.uid, "watchlist", anime.mal_id.toString()),
        animeData,
        { merge: true }
      );

      if (normalizedStatus === "Completed") {
        await setDoc(
          doc(db, "users", currentUser.uid, "watched", anime.mal_id.toString()),
          {
            ...animeData,
            watchedAt: new Date().toISOString(),
          }
        );
      } else {
        await deleteDoc(
          doc(db, "users", currentUser.uid, "watched", anime.mal_id.toString())
        );
      }

      toast.success(`Marked as ${normalizedStatus}`);
    } catch {
      toast.error("Failed to update tracker status");
    }
  };

  const getAnimeStatus = (animeId: number): string | null => {
    const item = watchlist.find((i) => i.mal_id === animeId);
    return item ? (item.status || "Plan to Watch") : null;
  };

  const updateWatchlistEntry = async (animeId: number, updates: Partial<Pick<WatchlistItem, "status" | "startDate" | "endDate" | "personalNotes" | "progress" | "userScore" | "episodes" | "releaseStatus">>) => {
    if (!currentUser) return;
    try {
      const currentItem = watchlist.find((item) => item.mal_id === animeId);
      const updatedAt = new Date().toISOString();
      const progress = Math.max(0, Number(updates.progress ?? currentItem?.progress ?? 0));
      const requestedStatus = updates.status || currentItem?.status || "Plan to Watch";
      const episodeTotal = Number(updates.episodes ?? currentItem?.episodes ?? 0);
      const hasEpisodeTotal = episodeTotal > 0;
      const reachedFinalEpisode = Boolean(hasEpisodeTotal && progress >= episodeTotal);
      const releaseStatus = updates.releaseStatus ?? currentItem?.releaseStatus;
      const derivedStatus = reachedFinalEpisode
        ? statusAtKnownTotal(releaseStatus)
        : requestedStatus === "Completed" && isOngoingMediaStatus(releaseStatus)
          ? "Caught Up"
        : hasEpisodeTotal && requestedStatus === "Completed"
          ? "Watching"
          : progress > 0 && requestedStatus === "Plan to Watch"
            ? "Watching"
            : requestedStatus;
      const normalizedUpdates = {
        ...updates,
        status: derivedStatus,
        progress: hasEpisodeTotal ? Math.min(progress, episodeTotal) : progress,
        ...(reachedFinalEpisode && statusAtKnownTotal(releaseStatus) === "Completed" ? { endDate: updates.endDate || new Date().toISOString().slice(0, 10) } : {}),
      };
      await setDoc(doc(db, "users", currentUser.uid, "watchlist", animeId.toString()), { ...normalizedUpdates, mediaType: "ANIME", updatedAt }, { merge: true });
      if (normalizedUpdates.status === "Completed" && currentItem) {
        await setDoc(doc(db, "users", currentUser.uid, "watched", animeId.toString()), { ...currentItem, ...normalizedUpdates, watchedAt: updatedAt }, { merge: true });
        window.dispatchEvent(new CustomEvent("orbit_review_ready", { detail: { animeId, title: currentItem.title } }));
      } else if (normalizedUpdates.status) {
        await deleteDoc(doc(db, "users", currentUser.uid, "watched", animeId.toString()));
      }
      if (reachedFinalEpisode && normalizedUpdates.status === "Completed")
        toast.success("Final episode logged — ready for your review");
      else if (reachedFinalEpisode && normalizedUpdates.status === "Caught Up")
        toast.success("Latest available episode logged — you're caught up");
    } catch {
      toast.error("Could not save watch notes");
    }
  };

  const addMangaToWatchlist = async (manga: any) => {
    if (!currentUser) {
      toast.error("Please sign in to add manga");
      return;
    }
    const mangaData: MangaWatchlistItem = {
      mal_id: manga.mal_id,
      title: manga.title || manga.title_english || "Unknown Manga",
      title_english: manga.title_english || manga.title,
      image_url: manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url || manga.image || "",
      score: manga.score || null,
      type: "Manga",
      mediaType: "MANGA",
      format: manga.format || manga.type || "MANGA",
      countryOfOrigin: manga.countryOfOrigin || null,
      releaseStatus: manga.status || "",
      chapters: manga.chapters || null,
      volumes: manga.volumes || null,
      genres: manga.genres?.map((genre: any) => genre.name || genre) || [],
      status: "Plan to Read",
      addedAt: new Date().toISOString(),
      startDate: "",
      endDate: "",
      personalNotes: "",
    };
    try {
      await setDoc(doc(db, "users", currentUser.uid, "watchlist", `manga-${manga.mal_id}`), mangaData, { merge: true });
      toast.success("Manga added to your list");
    } catch {
      toast.error("Could not add manga");
    }
  };

  const removeMangaFromWatchlist = async (mangaId: number) => {
    if (!currentUser) return;
    const item = mangaWatchlist.find((entry) => entry.mal_id === mangaId);
    if (!item) return;
    try {
      await softDeleteItem(item, `manga-${mangaId}`);
    } catch {
      toast.error("Could not move this manga to Trash");
    }
  };

  const permanentlyDeleteItem = async (originalKey: string) => {
    if (!currentUser) return;
    try {
      try {
        await deleteDoc(doc(db, "users", currentUser.uid, "trash", originalKey));
      } catch {
        // The recovery entry may be local while production rules are still propagating.
      }
      writeLocalTrash(currentUser.uid, readLocalTrash(currentUser.uid).filter((item) => item.originalKey !== originalKey));
      setDeletedItems((items) => items.filter((item) => item.originalKey !== originalKey));
      toast.info("Permanently deleted");
    } catch {
      toast.error("Could not permanently delete this title");
    }
  };

  const emptyTrash = async () => {
    if (!currentUser || !deletedItems.length) return;
    try {
      const batch = writeBatch(db);
      deletedItems.forEach((item) => batch.delete(doc(db, "users", currentUser.uid, "trash", item.originalKey)));
      try { await batch.commit(); } catch { /* Local recovery still needs clearing. */ }
      writeLocalTrash(currentUser.uid, []);
      setDeletedItems([]);
      toast.info("Trash emptied");
    } catch {
      toast.error("Could not empty Trash");
    }
  };

  const updateMangaWatchlistEntry = async (mangaId: number, updates: Partial<Pick<MangaWatchlistItem, "status" | "startDate" | "endDate" | "personalNotes" | "progress" | "userScore" | "chapters" | "releaseStatus">>) => {
    if (!currentUser) return;
    try {
      const currentItem = mangaWatchlist.find((item) => item.mal_id === mangaId);
      const progress = Math.max(0, Number(updates.progress ?? currentItem?.progress ?? 0));
      const total = Number(updates.chapters ?? currentItem?.chapters ?? 0);
      const requestedStatus = updates.status || currentItem?.status || "Plan to Read";
      const reachedFinalChapter = total > 0 && progress >= total;
      const releaseStatus = updates.releaseStatus ?? currentItem?.releaseStatus;
      const derivedStatus = reachedFinalChapter
        ? statusAtKnownTotal(releaseStatus)
        : requestedStatus === "Completed" && isOngoingMediaStatus(releaseStatus)
          ? "Caught Up"
        : total > 0 && requestedStatus === "Completed"
          ? "Reading"
          : progress > 0 && requestedStatus === "Plan to Read"
            ? "Reading"
            : requestedStatus;
      await setDoc(doc(db, "users", currentUser.uid, "watchlist", `manga-${mangaId}`), {
        ...updates,
        status: derivedStatus,
        progress: total > 0 ? Math.min(progress, total) : progress,
        ...(reachedFinalChapter && statusAtKnownTotal(releaseStatus) === "Completed" ? { endDate: updates.endDate || new Date().toISOString().slice(0, 10) } : {}),
        mediaType: "MANGA",
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch {
      toast.error("Could not save reading notes");
    }
  };

  const value: WatchlistContextType = {
    watchlist,
    watched,
    mangaWatchlist,
    deletedItems,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    addToWatched,
    removeFromWatched,
    isInWatchlist,
    isWatched,
    updateAnimeStatus,
    getAnimeStatus,
    updateWatchlistEntry,
    addMangaToWatchlist,
    removeMangaFromWatchlist,
    updateMangaWatchlistEntry,
    restoreDeletedItem,
    permanentlyDeleteItem,
    emptyTrash,
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
};
