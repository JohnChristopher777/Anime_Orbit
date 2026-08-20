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
}

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  watched: WatchlistItem[];
  loading: boolean;
  addToWatchlist: (anime: any) => Promise<void>;
  removeFromWatchlist: (animeId: number) => Promise<void>;
  addToWatched: (anime: any) => Promise<void>;
  removeFromWatched: (animeId: number) => Promise<void>;
  isInWatchlist: (animeId: number) => boolean;
  isWatched: (animeId: number) => boolean;
  updateAnimeStatus: (anime: any, status: string | null) => Promise<void>;
  getAnimeStatus: (animeId: number) => string | null;
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
  const [loading, setLoading] = useState(true);

  // Fetch watchlist and watched anime from Firestore
  useEffect(() => {
    if (!currentUser) {
      setWatchlist([]);
      setWatched([]);
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
          setWatchlist(watchlistData);
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
        status: "Plan to Watch",
        addedAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, "users", currentUser.uid, "watchlist", anime.mal_id.toString()),
        animeData
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
        genres: anime.genres?.map((g: any) => g.name || g) || [],
        status: status,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, "users", currentUser.uid, "watchlist", anime.mal_id.toString()),
        animeData
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

  const value: WatchlistContextType = {
    watchlist,
    watched,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    addToWatched,
    removeFromWatched,
    isInWatchlist,
    isWatched,
    updateAnimeStatus,
    getAnimeStatus,
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
};
