import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "../firebase/config";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "./AuthContext.jsx";
import { toast } from "react-toastify";

const WatchlistContext = createContext();

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used within WatchlistProvider");
  }
  return context;
};

export const WatchlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [watched, setWatched] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch watchlist and watched anime
  useEffect(() => {
    if (!user) {
      setWatchlist([]);
      setWatched([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Real-time watchlist listener
    const watchlistRef = collection(db, "users", user.uid, "watchlist");
    const unsubscribeWatchlist = onSnapshot(
      watchlistRef,
      (snapshot) => {
        const watchlistData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setWatchlist(watchlistData);
      },
      (error) => {
        console.error("Error fetching watchlist:", error);
        toast.error("Failed to load watchlist");
      }
    );

    // Real-time watched listener
    const watchedRef = collection(db, "users", user.uid, "watched");
    const unsubscribeWatched = onSnapshot(
      watchedRef,
      (snapshot) => {
        const watchedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setWatched(watchedData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching watched:", error);
        toast.error("Failed to load watched anime");
        setLoading(false);
      }
    );

    return () => {
      unsubscribeWatchlist();
      unsubscribeWatched();
    };
  }, [user]);

  const addToWatchlist = async (anime) => {
    if (!user) {
      toast.error("Please login to add to watchlist");
      return;
    }

    try {
      const animeData = {
        mal_id: anime.mal_id,
        title: anime.title,
        title_english: anime.title_english || anime.title,
        image_url:
          anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
        score: anime.score,
        episodes: anime.episodes,
        type: anime.type,
        addedAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, "users", user.uid, "watchlist", anime.mal_id.toString()),
        animeData
      );

      toast.success("Added to watchlist!");
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      toast.error("Failed to add to watchlist");
    }
  };

  const removeFromWatchlist = async (animeId) => {
    if (!user) return;

    try {
      await deleteDoc(
        doc(db, "users", user.uid, "watchlist", animeId.toString())
      );
      toast.success("Removed from watchlist");
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      toast.error("Failed to remove from watchlist");
    }
  };

  const addToWatched = async (anime) => {
    if (!user) {
      toast.error("Please login to mark as watched");
      return;
    }

    try {
      const animeData = {
        mal_id: anime.mal_id,
        title: anime.title,
        title_english: anime.title_english || anime.title,
        image_url:
          anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
        score: anime.score,
        episodes: anime.episodes,
        type: anime.type,
        genres: anime.genres?.map((g) => g.name) || [],
        watchedAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, "users", user.uid, "watched", anime.mal_id.toString()),
        animeData
      );

      // Remove from watchlist if it exists
      const isInWatchlist = watchlist.some(
        (item) => item.mal_id === anime.mal_id
      );
      if (isInWatchlist) {
        await removeFromWatchlist(anime.mal_id);
      }

      toast.success("Marked as watched!");
    } catch (error) {
      console.error("Error adding to watched:", error);
      toast.error("Failed to mark as watched");
    }
  };

  const removeFromWatched = async (animeId) => {
    if (!user) return;

    try {
      await deleteDoc(
        doc(db, "users", user.uid, "watched", animeId.toString())
      );
      toast.success("Removed from watched");
    } catch (error) {
      console.error("Error removing from watched:", error);
      toast.error("Failed to remove from watched");
    }
  };

  const isInWatchlist = (animeId) => {
    return watchlist.some((item) => item.mal_id === animeId);
  };

  const isWatched = (animeId) => {
    return watched.some((item) => item.mal_id === animeId);
  };

  const updateAnimeStatus = async (anime, status) => {
    if (!user) {
      toast.error("Please login to track anime status");
      return;
    }

    if (!status) {
      // Remove status
      try {
        await deleteDoc(
          doc(db, "users", user.uid, "watchlist", anime.mal_id.toString())
        );
        await deleteDoc(
          doc(db, "users", user.uid, "watched", anime.mal_id.toString())
        );
        toast.success("Removed from tracker");
      } catch (error) {
        console.error("Error removing status:", error);
        toast.error("Failed to remove tracker status");
      }
      return;
    }

    try {
      const animeData = {
        mal_id: anime.mal_id,
        title: anime.title,
        title_english: anime.title_english || anime.title,
        image_url:
          anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
        score: anime.score,
        episodes: anime.episodes,
        type: anime.type,
        genres: anime.genres?.map((g) => g.name || g) || [],
        status: status,
        updatedAt: new Date().toISOString(),
      };

      // Set in watchlist with new status
      await setDoc(
        doc(db, "users", user.uid, "watchlist", anime.mal_id.toString()),
        animeData
      );

      // Handle legacy Completed syncing
      if (status === "Completed") {
        await setDoc(
          doc(db, "users", user.uid, "watched", anime.mal_id.toString()),
          {
            ...animeData,
            watchedAt: new Date().toISOString()
          }
        );
      } else {
        // Remove from watched if status is changed back to Watching/Plan to Watch/etc
        await deleteDoc(
          doc(db, "users", user.uid, "watched", anime.mal_id.toString())
        );
      }

      toast.success(`Marked as ${status}`);
    } catch (error) {
      console.error("Error updating anime status:", error);
      toast.error("Failed to update tracker status");
    }
  };

  const getAnimeStatus = (animeId) => {
    const item = watchlist.find((i) => i.mal_id === animeId);
    return item ? item.status : null;
  };

  const value = {
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
