import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
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
import { auth } from '../firebase/config';
import { toast } from 'react-toastify';

interface AuthContextType {
    currentUser: FirebaseUser | null;
    signup: (email: string, password: string, displayName?: string) => Promise<any>;
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

    const signup = async (email: string, password: string, displayName?: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
            await updateProfile(userCredential.user, {
                displayName: displayName
            });
        }
        return userCredential;
    };

    const login = async (email: string, password: string) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await setPersistence(auth, browserLocalPersistence);
        const prefersRedirect = typeof window !== "undefined"
            && (window.matchMedia("(max-width: 767px)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
        if (prefersRedirect) {
            await signInWithRedirect(auth, provider);
            return null;
        }
        try {
            return await signInWithPopup(auth, provider);
        } catch (error: any) {
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
        getRedirectResult(auth).catch((error: any) => {
            const messages: Record<string, string> = {
                "auth/unauthorized-domain": `Google sign-in is not authorized for ${window.location.hostname}.`,
                "auth/operation-not-allowed": "Google sign-in is disabled for this Firebase project.",
                "auth/network-request-failed": "Google sign-in could not connect. Check your network and try again.",
            };
            toast.error(messages[error?.code] || "Google sign-in could not be completed.");
        });
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
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
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
