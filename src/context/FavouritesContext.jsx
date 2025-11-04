import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const FavouritesContext = createContext();

export const useFavourites = () => {
    const context = useContext(FavouritesContext);
    if (!context) {
        throw new Error('useFavourites must be used within a FavouritesProvider');
    }
    return context;
};

export const FavouritesProvider = ({ children }) => {
    const [favourites, setFavourites] = useState([]);
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();

    // Fetch favourites from Firestore
    useEffect(() => {
        if (!currentUser) {
            setFavourites([]);
            return;
        }

        setLoading(true);
        const favouritesRef = collection(db, 'users', currentUser.uid, 'favourites');

        const unsubscribe = onSnapshot(favouritesRef,
            (snapshot) => {
                const favs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setFavourites(favs);
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching favourites:', error);
                toast.error('Failed to load favourites');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    // Add anime to favourites
    const addToFavourites = async (anime) => {
        if (!currentUser) {
            toast.warning('Please sign in to add favourites');
            return false;
        }

        try {
            const favouriteRef = doc(db, 'users', currentUser.uid, 'favourites', anime.mal_id.toString());
            await setDoc(favouriteRef, {
                mal_id: anime.mal_id,
                title: anime.title,
                image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
                score: anime.score,
                episodes: anime.episodes,
                addedAt: new Date().toISOString()
            });
            toast.success(`${anime.title} added to favourites! ❤️`);
            return true;
        } catch (error) {
            console.error('Error adding to favourites:', error);
            toast.error('Failed to add to favourites');
            return false;
        }
    };

    // Remove anime from favourites
    const removeFromFavourites = async (animeId) => {
        if (!currentUser) {
            return false;
        }

        try {
            const favouriteRef = doc(db, 'users', currentUser.uid, 'favourites', animeId.toString());
            await deleteDoc(favouriteRef);
            toast.info('Removed from favourites');
            return true;
        } catch (error) {
            console.error('Error removing from favourites:', error);
            toast.error('Failed to remove from favourites');
            return false;
        }
    };

    // Check if anime is in favourites
    const isFavourite = (animeId) => {
        return favourites.some(fav => fav.mal_id === animeId);
    };

    const value = {
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
