import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sign up with email and password
    const signup = async (email, password, displayName) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Update profile with display name
            await updateProfile(userCredential.user, {
                displayName: displayName
            });
            toast.success('Account created successfully! Welcome to Anime Orbit! 🎉');
            return userCredential;
        } catch (error) {
            let errorMessage = 'Failed to create account';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email already in use';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            }
            toast.error(errorMessage);
            throw error;
        }
    };

    // Sign in with email and password
    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            toast.success(`Welcome back, ${userCredential.user.displayName || 'Anime Fan'}! 🚀`);
            return userCredential;
        } catch (error) {
            let errorMessage = 'Failed to sign in';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password';
            }
            toast.error(errorMessage);
            throw error;
        }
    };

    // Sign in with Google
    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            toast.success(`Welcome ${result.user.displayName}! 🎌`);
            return result;
        } catch (error) {
            let errorMessage = 'Failed to sign in with Google';
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Sign in cancelled';
            }
            toast.error(errorMessage);
            throw error;
        }
    };

    // Logout
    const logout = async () => {
        try {
            await signOut(auth);
            toast.info('Logged out successfully. See you soon! 👋');
        } catch (error) {
            toast.error('Failed to logout');
            throw error;
        }
    };

    // Reset password
    const resetPassword = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            toast.success('Password reset email sent! Please check your inbox. 📧');
        } catch (error) {
            let errorMessage = 'Failed to reset password';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            }
            toast.error(errorMessage);
            throw error;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
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
            {!loading && children}
        </AuthContext.Provider>
    );
};
