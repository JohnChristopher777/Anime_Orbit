import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc, Timestamp, writeBatch } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";

export interface FavouriteAnime {
  id?: string;
  mal_id: number;
  title: string;
  title_english?: string;
  image: string;
  score?: number | string | null;
  episodes?: number | null;
  chapters?: number | null;
  volumes?: number | null;
  format?: string;
  genres?: string[];
  addedAt?: string;
  mediaType?: "ANIME" | "MANGA";
}

export interface DeletedFavourite extends FavouriteAnime {
  originalKey: string;
  sourceCollection: "favourites";
  deletedAt: string | Timestamp;
  purgeAfter: string | Timestamp;
}

interface FavouritesContextType {
  favourites: FavouriteAnime[];
  mangaFavourites: FavouriteAnime[];
  deletedFavourites: DeletedFavourite[];
  loading: boolean;
  addToFavourites: (anime: any) => Promise<boolean>;
  removeFromFavourites: (animeId: number) => Promise<boolean>;
  isFavourite: (animeId: number) => boolean;
  addMangaToFavourites: (manga: any) => Promise<boolean>;
  removeMangaFromFavourites: (mangaId: number) => Promise<boolean>;
  isMangaFavourite: (mangaId: number) => boolean;
  restoreFavourite: (originalKey: string) => Promise<void>;
  permanentlyDeleteFavourite: (originalKey: string) => Promise<void>;
}

const FavouritesContext = createContext<FavouritesContextType | undefined>(undefined);
const localTrashKey = (uid: string) => `anime_orbit_local_trash_${uid}`;
const dateMillis = (value: any) => value?.toMillis ? value.toMillis() : Date.parse(value || "");
const readLocalTrash = (uid: string): any[] => {
  try {
    const value = JSON.parse(localStorage.getItem(localTrashKey(uid)) || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
};
const writeLocalTrash = (uid: string, records: any[]) => localStorage.setItem(localTrashKey(uid), JSON.stringify(records));

export const useFavourites = (): FavouritesContextType => {
  const context = useContext(FavouritesContext);
  if (!context) throw new Error("useFavourites must be used within a FavouritesProvider");
  return context;
};

export const FavouritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favourites, setFavourites] = useState<FavouriteAnime[]>([]);
  const [mangaFavourites, setMangaFavourites] = useState<FavouriteAnime[]>([]);
  const [deletedFavourites, setDeletedFavourites] = useState<DeletedFavourite[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setFavourites([]);
      setMangaFavourites([]);
      setDeletedFavourites([]);
      return;
    }
    setLoading(true);
    const favouritesRef = collection(db, "users", currentUser.uid, "favourites");
    const unsubscribeFavourites = onSnapshot(favouritesRef, (snapshot) => {
      const records = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as FavouriteAnime));
      setFavourites(records.filter((item) => item.mediaType !== "MANGA"));
      setMangaFavourites(records.filter((item) => item.mediaType === "MANGA"));
      setLoading(false);
    }, () => setLoading(false));

    const trashRef = collection(db, "users", currentUser.uid, "trash");
    const loadLocal = () => readLocalTrash(currentUser.uid)
      .filter((item) => item.sourceCollection === "favourites" && dateMillis(item.purgeAfter) > Date.now());
    const unsubscribeTrash = onSnapshot(trashRef, (snapshot) => {
      const cloud = snapshot.docs
        .map((entry) => ({ id: entry.id, ...entry.data() } as DeletedFavourite))
        .filter((item) => item.sourceCollection === "favourites" && dateMillis(item.purgeAfter) > Date.now());
      const local = loadLocal();
      setDeletedFavourites([...cloud, ...local.filter((item) => !cloud.some((saved) => saved.originalKey === item.originalKey))]
        .sort((a, b) => dateMillis(b.deletedAt) - dateMillis(a.deletedAt)));
    }, () => setDeletedFavourites(loadLocal()));
    return () => { unsubscribeFavourites(); unsubscribeTrash(); };
  }, [currentUser]);

  const addFavourite = async (media: any, mediaType: "ANIME" | "MANGA") => {
    if (!currentUser) {
      toast.warning("Please sign in to add favorites");
      return false;
    }
    const id = Number(media.mal_id);
    const key = mediaType === "MANGA" ? `manga-${id}` : id.toString();
    try {
      await setDoc(doc(db, "users", currentUser.uid, "favourites", key), {
        mal_id: id,
        title: media.title || media.title_english || `Unknown ${mediaType === "MANGA" ? "Manga" : "Anime"}`,
        title_english: media.title_english || media.title,
        image: media.images?.jpg?.large_image_url || media.images?.jpg?.image_url || media.image || "",
        score: media.score || null,
        episodes: mediaType === "ANIME" ? media.episodes || null : null,
        chapters: mediaType === "MANGA" ? media.chapters || null : null,
        volumes: mediaType === "MANGA" ? media.volumes || null : null,
        format: media.format || media.type || mediaType,
        genres: (media.genres || []).map((genre: any) => typeof genre === "string" ? genre : genre?.name).filter(Boolean),
        mediaType,
        addedAt: new Date().toISOString(),
      });
      toast.success(`${media.title || "Title"} added to favorites`);
      return true;
    } catch {
      toast.error("Failed to add to favorites");
      return false;
    }
  };

  const restoreFavourite = async (originalKey: string) => {
    if (!currentUser) return;
    const item = deletedFavourites.find((entry) => entry.originalKey === originalKey)
      || readLocalTrash(currentUser.uid).find((entry) => entry.sourceCollection === "favourites" && entry.originalKey === originalKey);
    if (!item) return;
    const { id: _id, originalKey: _key, sourceCollection: _source, deletedAt: _deleted, purgeAfter: _purge, ...record } = item;
    try {
      await setDoc(doc(db, "users", currentUser.uid, "favourites", originalKey), record, { merge: true });
      try { await deleteDoc(doc(db, "users", currentUser.uid, "trash", `favorite-${originalKey}`)); } catch { /* Local recovery entry. */ }
      writeLocalTrash(currentUser.uid, readLocalTrash(currentUser.uid).filter((entry) => !(entry.sourceCollection === "favourites" && entry.originalKey === originalKey)));
      setDeletedFavourites((items) => items.filter((entry) => entry.originalKey !== originalKey));
      toast.success(`${item.title} restored`);
    } catch { toast.error("Could not restore this favorite"); }
  };

  const removeFavourite = async (item: FavouriteAnime, key: string) => {
    if (!currentUser) return false;
    const deletedAt = new Date();
    const purgeAfter = new Date(deletedAt.getTime() + 5 * 86400000);
    const deleted: DeletedFavourite = { ...item, originalKey: key, sourceCollection: "favourites", deletedAt: Timestamp.fromDate(deletedAt), purgeAfter: Timestamp.fromDate(purgeAfter) };
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, "users", currentUser.uid, "trash", `favorite-${key}`), deleted);
      batch.delete(doc(db, "users", currentUser.uid, "favourites", key));
      try {
        await batch.commit();
      } catch {
        const local = { ...deleted, deletedAt: deletedAt.toISOString(), purgeAfter: purgeAfter.toISOString() };
        writeLocalTrash(currentUser.uid, [local, ...readLocalTrash(currentUser.uid).filter((entry) => !(entry.sourceCollection === "favourites" && entry.originalKey === key))]);
        await deleteDoc(doc(db, "users", currentUser.uid, "favourites", key));
        setDeletedFavourites((items) => [local, ...items.filter((entry) => entry.originalKey !== key)]);
      }
      toast(({ closeToast }) => <div className="flex items-center gap-3 text-xs"><span className="min-w-0 flex-1"><strong className="block truncate">{item.title}</strong><small className="text-neutral-400">In Trash for five days</small></span><button className="rounded-full bg-[#ffd700] px-3 py-1.5 font-bold text-black" onClick={() => { void restoreFavourite(key); closeToast?.(); }}>Undo</button></div>, { autoClose: 7000 });
      return true;
    } catch {
      toast.error("Could not remove this favorite");
      return false;
    }
  };

  const permanentlyDeleteFavourite = async (originalKey: string) => {
    if (!currentUser) return;
    try { await deleteDoc(doc(db, "users", currentUser.uid, "trash", `favorite-${originalKey}`)); } catch { /* May be local only. */ }
    writeLocalTrash(currentUser.uid, readLocalTrash(currentUser.uid).filter((entry) => !(entry.sourceCollection === "favourites" && entry.originalKey === originalKey)));
    setDeletedFavourites((items) => items.filter((entry) => entry.originalKey !== originalKey));
    toast.info("Permanently deleted");
  };

  const removeFromFavourites = async (animeId: number) => {
    const item = favourites.find((favorite) => favorite.mal_id === animeId);
    return item ? removeFavourite(item, animeId.toString()) : false;
  };
  const removeMangaFromFavourites = async (mangaId: number) => {
    const item = mangaFavourites.find((favorite) => favorite.mal_id === mangaId);
    return item ? removeFavourite(item, `manga-${mangaId}`) : false;
  };

  return <FavouritesContext.Provider value={{
    favourites,
    mangaFavourites,
    deletedFavourites,
    loading,
    addToFavourites: (anime) => addFavourite(anime, "ANIME"),
    removeFromFavourites,
    isFavourite: (animeId) => favourites.some((item) => item.mal_id === animeId),
    addMangaToFavourites: (manga) => addFavourite(manga, "MANGA"),
    removeMangaFromFavourites,
    isMangaFavourite: (mangaId) => mangaFavourites.some((item) => item.mal_id === mangaId),
    restoreFavourite,
    permanentlyDeleteFavourite,
  }}>{children}</FavouritesContext.Provider>;
};
