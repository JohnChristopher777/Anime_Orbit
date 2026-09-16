import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { db } from "../firebase/config";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";

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
  mediaType?: "ANIME" | "MANGA";
}

export interface MangaWatchlistItem extends WatchlistItem {
  chapters?: number | null;
  volumes?: number | null;
  format?: string;
}

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  watched: WatchlistItem[];
  mangaWatchlist: MangaWatchlistItem[];
  loading: boolean;
  addToWatchlist: (anime: any) => Promise<void>;
  removeFromWatchlist: (animeId: number) => Promise<void>;
  addToWatched: (anime: any) => Promise<void>;
  removeFromWatched: (animeId: number) => Promise<void>;
  isInWatchlist: (animeId: number) => boolean;
  isWatched: (animeId: number) => boolean;
  updateAnimeStatus: (anime: any, status: string | null) => Promise<void>;
  getAnimeStatus: (animeId: number) => string | null;
  updateWatchlistEntry: (animeId: number, updates: Pick<WatchlistItem, "status" | "startDate" | "endDate" | "personalNotes">) => Promise<void>;
  addMangaToWatchlist: (manga: any) => Promise<void>;
  removeMangaFromWatchlist: (mangaId: number) => Promise<void>;
  updateMangaWatchlistEntry: (mangaId: number, updates: Pick<MangaWatchlistItem, "status" | "startDate" | "endDate" | "personalNotes">) => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  // Fetch watchlist and watched anime from Firestore
  useEffect(() => {
    if (!currentUser) {
      setWatchlist([]);
      setWatched([]);
      setMangaWatchlist([]);
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

      return () => {
        unsubscribeWatchlist();
        unsubscribeWatched();
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

  const removeFromWatchlist = async (animeId: number) => {
    if (!currentUser) return;

    try {
      await deleteDoc(
        doc(db, "users", currentUser.uid, "watchlist", animeId.toString())
      );
      toast.info("Removed from watchlist");
    } catch {
      toast.error("Failed to remove from watchlist");
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
        genres: anime.genres?.map((g: any) => g.name || g) || [],
        status: "Completed",
        watchedAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, "users", currentUser.uid, "watched", anime.mal_id.toString()),
        animeData
      );

      await removeFromWatchlist(anime.mal_id);
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
        await deleteDoc(
          doc(db, "users", currentUser.uid, "watchlist", anime.mal_id.toString())
        );
        await deleteDoc(
          doc(db, "users", currentUser.uid, "watched", anime.mal_id.toString())
        );
        toast.info("Removed from tracker");
      } catch {
        toast.error("Failed to remove tracker status");
      }
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
        genres: anime.genres?.map((g: any) => g.name || g) || [],
        status: status,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, "users", currentUser.uid, "watchlist", anime.mal_id.toString()),
        animeData,
        { merge: true }
      );

      if (status === "Completed") {
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

      toast.success(`Marked as ${status}`);
    } catch {
      toast.error("Failed to update tracker status");
    }
  };

  const getAnimeStatus = (animeId: number): string | null => {
    const item = watchlist.find((i) => i.mal_id === animeId);
    return item ? (item.status || "Plan to Watch") : null;
  };

  const updateWatchlistEntry = async (animeId: number, updates: Pick<WatchlistItem, "status" | "startDate" | "endDate" | "personalNotes">) => {
    if (!currentUser) return;
    try {
      const currentItem = watchlist.find((item) => item.mal_id === animeId);
      const updatedAt = new Date().toISOString();
      await setDoc(doc(db, "users", currentUser.uid, "watchlist", animeId.toString()), { ...updates, mediaType: "ANIME", updatedAt }, { merge: true });
      if (updates.status === "Completed" && currentItem) {
        await setDoc(doc(db, "users", currentUser.uid, "watched", animeId.toString()), { ...currentItem, ...updates, watchedAt: updatedAt }, { merge: true });
      } else if (updates.status) {
        await deleteDoc(doc(db, "users", currentUser.uid, "watched", animeId.toString()));
      }
      toast.success("Anime tracker saved");
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
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "watchlist", `manga-${mangaId}`));
      toast.info("Manga removed from your list");
    } catch {
      toast.error("Could not remove manga");
    }
  };

  const updateMangaWatchlistEntry = async (mangaId: number, updates: Pick<MangaWatchlistItem, "status" | "startDate" | "endDate" | "personalNotes">) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, "users", currentUser.uid, "watchlist", `manga-${mangaId}`), { ...updates, mediaType: "MANGA", updatedAt: new Date().toISOString() }, { merge: true });
      toast.success("Manga tracker saved");
    } catch {
      toast.error("Could not save reading notes");
    }
  };

  const value: WatchlistContextType = {
    watchlist,
    watched,
    mangaWatchlist,
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
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
};
