import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

export interface FavouriteAnime {
    id?: string;
    mal_id: number;
    title: string;
    title_english?: string;
    image: string;
    score?: number | string | null;
    episodes?: number | null;
    addedAt?: string;
}

interface FavouritesContextType {
    favourites: FavouriteAnime[];
    loading: boolean;
    addToFavourites: (anime: any) => Promise<boolean>;
    removeFromFavourites: (animeId: number) => Promise<boolean>;
    isFavourite: (animeId: number) => boolean;
}

const FavouritesContext = createContext<FavouritesContextType | undefined>(undefined);

export const useFavourites = (): FavouritesContextType => {
    const context = useContext(FavouritesContext);
    if (!context) {
        throw new Error('useFavourites must be used within a FavouritesProvider');
    }
    return context;
};

export const FavouritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [favourites, setFavourites] = useState<FavouriteAnime[]>([]);
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();

    // Fetch favourites from Firestore
    useEffect(() => {
        if (!currentUser) {
            setFavourites([]);
            return;
        }

        setLoading(true);
        try {
            const favouritesRef = collection(db, 'users', currentUser.uid, 'favourites');

            const unsubscribe = onSnapshot(favouritesRef,
                (snapshot) => {
                    const favs = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as FavouriteAnime));
                    setFavourites(favs);
                    setLoading(false);
                },
                () => {
                    // Graceful suppression of initial load errors to prevent intrusive toasts on reload
                    setLoading(false);
                }
            );

            return () => unsubscribe();
        } catch {
            setLoading(false);
        }
    }, [currentUser]);

    // Add anime to favourites
    const addToFavourites = async (anime: any): Promise<boolean> => {
        if (!currentUser) {
            toast.warning('Please sign in to add favourites');
            return false;
        }

        try {
            const favouriteRef = doc(db, 'users', currentUser.uid, 'favourites', anime.mal_id.toString());
            await setDoc(favouriteRef, {
                mal_id: anime.mal_id,
                title: anime.title || anime.title_english || "Unknown Anime",
                title_english: anime.title_english || anime.title,
                image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || anime.image || "",
                score: anime.score || null,
                episodes: anime.episodes || null,
                addedAt: new Date().toISOString()
            });
            toast.success(`${anime.title || anime.title_english || "Anime"} added to favorites!`);
            return true;
        } catch {
            toast.error('Failed to add to favorites');
            return false;
        }
    };

    // Remove anime from favourites
    const removeFromFavourites = async (animeId: number): Promise<boolean> => {
        if (!currentUser) return false;

        try {
            const favouriteRef = doc(db, 'users', currentUser.uid, 'favourites', animeId.toString());
            await deleteDoc(favouriteRef);
            toast.info('Removed from favorites');
            return true;
        } catch {
            toast.error('Failed to remove from favorites');
            return false;
        }
    };

    // Check if anime is in favourites
    const isFavourite = (animeId: number): boolean => {
        return favourites.some(fav => fav.mal_id === animeId);
    };

    const value: FavouritesContextType = {
        favourites,
        loading,
        addToFavourites,
        removeFromFavourites,
        isFavourite
    };

    return (
        <FavouritesContext.Provider value={value}>
            {children}
        </FavouritesContext.Provider>
    );
};
