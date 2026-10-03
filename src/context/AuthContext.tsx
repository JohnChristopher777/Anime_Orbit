import React, { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    getRedirectResult,
    signInWithPopup,
    signInWithRedirect,
    setPersistence,
    browserLocalPersistence,
    updateProfile,
    sendPasswordResetEmail,
    type User as FirebaseUser
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { setMatureContentPreference } from '../services/anilist';
import { safeImageUrl, sanitizeInput } from '../utils/security';
import { createAvailableProfileHandle, isProfileHandleAvailable } from '../services/profileHandle';

const AUTH_STARS = [
    [15, 22, 20, .2, 238],
    [84, 18, 14, 1.1, 196],
    [22, 78, 13, 2.2, 218],
    [80, 74, 22, .7, 250],
] as const;

const maturePreferenceAllowed = (birthDate: unknown, enabled: unknown) => {
    if (!enabled || typeof birthDate !== 'string') return false;
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const month = today.getMonth() - birth.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age -= 1;
    return age >= 18;
};

interface AuthContextType {
    currentUser: FirebaseUser | null;
    signup: (email: string, password: string, displayName: string, profileHandle: string) => Promise<any>;
    login: (email: string, password: string) => Promise<any>;
    logout: () => Promise<void>;
    signInWithGoogle: () => Promise<any>;
    resetPassword: (email: string) => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const pendingSignupHandle = useRef("");

    const signup = async (email: string, password: string, displayName: string, profileHandle: string) => {
        if (!await isProfileHandleAvailable(profileHandle))
            throw Object.assign(new Error("That profile ID is already taken"), { code: "profile/handle-taken" });
        pendingSignupHandle.current = profileHandle;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
            await updateProfile(userCredential.user, {
                displayName: displayName
            });
        }
        const claimedHandle = await createAvailableProfileHandle(userCredential.user.uid, displayName, profileHandle);
        const now = new Date().toISOString();
        await setDoc(doc(db, 'users', userCredential.user.uid), { displayName, userId: claimedHandle, createdAt: now, updatedAt: now }, { merge: true });
        await setDoc(doc(db, 'publicProfiles', userCredential.user.uid), {
            displayName, userId: claimedHandle, bio: '', avatarUrl: '', bannerUrl: '', favoriteGenre: 'Action',
            createdAt: userCredential.user.metadata.creationTime || now, updatedAt: now,
        }, { merge: true });
        return userCredential;
    };

    const login = async (email: string, password: string) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await setPersistence(auth, browserLocalPersistence);
        try {
            return await signInWithPopup(auth, provider);
        } catch (error: any) {
            // Popup is the reliable default on third-party hosting because it
            // keeps Firebase's canonical OAuth handler. Redirect is retained
            // only for browsers that genuinely cannot open the popup.
            if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment", "auth/web-storage-unsupported"].includes(error?.code)) {
                await signInWithRedirect(auth, provider);
                return null;
            }
            throw error;
        }
    };

    const logout = async () => {
        return signOut(auth);
    };

    const resetPassword = async (email: string) => {
        return sendPasswordResetEmail(auth, email);
    };

    useEffect(() => {
        const restoreFallback = window.setTimeout(() => {
            // Do not hold the whole application indefinitely when Firebase is
            // offline or a browser extension blocks its session handshake.
            if (auth.currentUser) setCurrentUser(auth.currentUser);
            setLoading(false);
        }, 7000);
        getRedirectResult(auth).catch((error: any) => {
            const messages: Record<string, string> = {
                "auth/unauthorized-domain": `Google sign-in is not authorized for ${window.location.hostname}.`,
                "auth/operation-not-allowed": "Google sign-in is disabled for this Firebase project.",
                "auth/invalid-credential": "Google rejected the sign-in configuration. Check the Firebase Google provider and OAuth redirect URI.",
                "auth/network-request-failed": "Google sign-in could not connect. Check your network and try again.",
            };
            toast.error(messages[error?.code] || "Google sign-in could not be completed.");
        });
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const snapshot = await getDoc(doc(db, 'users', user.uid));
                    const profile = snapshot.exists() ? snapshot.data() : {};
                    const displayName = sanitizeInput(profile.displayName || user.displayName || user.email?.split('@')[0] || 'Anime Fan', 15);
                    const profileHandle = await createAvailableProfileHandle(user.uid, displayName, pendingSignupHandle.current || profile.userId || '');
                    if (profile.userId !== profileHandle) {
                        await setDoc(doc(db, 'users', user.uid), { displayName, userId: profileHandle, updatedAt: new Date().toISOString() }, { merge: true });
                    }
                    setMatureContentPreference(maturePreferenceAllowed(profile.birthDate, profile.allowMatureContent));

                    try {
                        const publicReference = doc(db, 'publicProfiles', user.uid);
                        const publicSnapshot = await getDoc(publicReference);
                        if (!publicSnapshot.exists()) {
                            const now = new Date().toISOString();
                            await setDoc(publicReference, {
                                displayName,
                                userId: profileHandle,
                                bio: '',
                                avatarUrl: safeImageUrl(profile.avatarUrl || user.photoURL),
                                bannerUrl: safeImageUrl(profile.bannerUrl),
                                favoriteGenre: sanitizeInput(profile.favoriteGenre, 40) || 'Action',
                                createdAt: user.metadata.creationTime || now,
                                updatedAt: now,
                            });
                        } else if (!publicSnapshot.data()?.userId) {
                            await setDoc(publicReference, { userId: profileHandle, updatedAt: new Date().toISOString() }, { merge: true });
                        }
                    } catch {
                        // Authentication still succeeds if the public profile
                        // projection is temporarily unavailable.
                    }
                } catch {
                    setMatureContentPreference(false);
                }
            } else {
                setMatureContentPreference(false);
            }
            setCurrentUser(user);
            setLoading(false);
            window.clearTimeout(restoreFallback);
        });

        return () => {
            window.clearTimeout(restoreFallback);
            unsubscribe();
        };
    }, []);

    const value: AuthContextType = {
        currentUser,
        signup,
        login,
        logout,
        signInWithGoogle,
        resetPassword,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="auth-restoring" role="status" aria-live="polite">
                    <div className="auth-restoring__stars" aria-hidden="true">
                        {AUTH_STARS.map(([x, y, size, delay, tone], index) => (
                            <i key={index} style={{ "--star-x": `${x}%`, "--star-y": `${y}%`, "--star-size": `${size}px`, "--star-delay": `${delay}s`, "--star-tone": `${tone}, ${tone}, ${tone}` } as React.CSSProperties} />
                        ))}
                    </div>
                    <div className="auth-restoring__orbit-plane" aria-hidden="true">
                        <i className="auth-restoring__orbit-ring" />
                    </div>
                    <div className="auth-restoring__content">
                        <div className="auth-restoring__wordmark" aria-label="Anime Orbit">
                            <span>ANiME</span><b>Orbit</b>
                        </div>
                    </div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
