import * as React from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useFavourites } from "../context/FavouritesContext";
import { useWatchlist } from "../context/WatchlistContext";
import { db } from "../firebase/config";
import { safeImageUrl, sanitizeInput } from "../utils/security";

const numberInRange = (value: unknown, minimum: number, maximum: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : 0;
};

const publicMedia = (item: any, fallbackType: "ANIME" | "MANGA") => {
  const mediaType = item.mediaType === "MANGA" || item.type === "Manga" ? "MANGA" : fallbackType;
  const total = mediaType === "MANGA" ? item.chapters : item.episodes;
  return {
    id: numberInRange(item.mal_id, 1, 999999999),
    mediaType,
    title: sanitizeInput(item.title_english || item.title || "Untitled", 120),
    image: safeImageUrl(item.image || item.image_url || item.images?.jpg?.large_image_url || item.images?.jpg?.image_url),
    format: sanitizeInput(item.format || item.type || mediaType, 30),
    status: sanitizeInput(item.status || "Favourite", 30),
    progress: numberInRange(item.progress, 0, 100000),
    total: numberInRange(total, 0, 100000),
    score: numberInRange(item.score, 0, 10),
    userScore: numberInRange(item.userScore, 0, 10),
    genres: (Array.isArray(item.genres) ? item.genres : [])
      .map((genre: any) => sanitizeInput(typeof genre === "string" ? genre : genre?.name, 30))
      .filter(Boolean)
      .slice(0, 8),
  };
};

const uniqueMedia = (items: any[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.mediaType}-${item.id}`;
    if (!item.id || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const PublicProfileSync: React.FC = () => {
  const { currentUser } = useAuth();
  const { favourites, mangaFavourites, loading: favouritesLoading } = useFavourites();
  const { watchlist, watched, mangaWatchlist, loading: watchlistLoading } = useWatchlist();

  React.useEffect(() => {
    if (!currentUser || favouritesLoading || watchlistLoading) return;
    const timer = window.setTimeout(async () => {
      const publicFavourites = uniqueMedia([
        ...favourites.map((item) => publicMedia(item, "ANIME")),
        ...mangaFavourites.map((item) => publicMedia(item, "MANGA")),
      ]).slice(0, 100);
      const publicWatchlist = uniqueMedia([
        ...watchlist.map((item) => publicMedia(item, "ANIME")),
        ...mangaWatchlist.map((item) => publicMedia(item, "MANGA")),
        ...watched.map((item) => publicMedia({ ...item, status: item.status || "Completed" }, "ANIME")),
      ]).slice(0, 100);
      const status = (value: string) => value.toLowerCase().replace(/[^a-z]/g, "");
      const completed = publicWatchlist.filter((item) => ["completed", "watched", "read"].includes(status(item.status))).length;
      const watching = publicWatchlist.filter((item) => ["watching", "reading"].includes(status(item.status))).length;
      const planned = publicWatchlist.filter((item) => status(item.status).startsWith("plan")).length;
      const rated = publicWatchlist.filter((item) => item.userScore > 0);
      const now = new Date().toISOString();
      let privateProfile: any = {};
      try {
        const snapshot = await getDoc(doc(db, "users", currentUser.uid));
        if (snapshot.exists()) privateProfile = snapshot.data();
      } catch {
        // Firebase Auth still provides a safe minimal public identity.
      }

      void setDoc(
        doc(db, "publicProfiles", currentUser.uid),
        {
          displayName: sanitizeInput(privateProfile.displayName || currentUser.displayName || currentUser.email?.split("@")[0] || "Anime Fan", 15),
          userId: sanitizeInput(privateProfile.userId || "", 24).replace(/[^a-zA-Z0-9_-]/g, ""),
          bio: sanitizeInput(privateProfile.bio || "", 500),
          avatarUrl: safeImageUrl(privateProfile.avatarUrl || currentUser.photoURL),
          bannerUrl: safeImageUrl(privateProfile.bannerUrl),
          favoriteGenre: sanitizeInput(privateProfile.favoriteGenre || "Action", 40),
          createdAt: currentUser.metadata.creationTime || now,
          favourites: publicFavourites,
          watchlist: publicWatchlist,
          stats: {
            favourites: publicFavourites.length,
            library: publicWatchlist.length,
            completed,
            watching,
            planned,
            averageScore: rated.length
              ? Math.round((rated.reduce((sum, item) => sum + item.userScore, 0) / rated.length) * 100) / 100
              : 0,
          },
          libraryUpdatedAt: now,
          updatedAt: now,
        },
      ).catch(() => {});
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [currentUser, favourites, mangaFavourites, watchlist, watched, mangaWatchlist, favouritesLoading, watchlistLoading]);

  return null;
};

export default PublicProfileSync;
