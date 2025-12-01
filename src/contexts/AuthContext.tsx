"use client"

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut as firebaseSignOut,
    onAuthStateChange,
} from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (user) => {
            setUser(user);
            setLoading(false);

            // Sync user to MongoDB when authenticated
            if (user) {
                try {
                    await fetch("/api/auth/sync-user", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            firebaseUid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            photoURL: user.photoURL,
                        }),
                    });
                } catch (err) {
                    console.error("Error syncing user to MongoDB:", err);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    const handleSignInWithGoogle = async () => {
        try {
            setError(null);
            await signInWithGoogle();
            router.push("/workspaces");
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const handleSignInWithEmail = async (email: string, password: string) => {
        try {
            setError(null);
            await signInWithEmail(email, password);
            router.push("/workspaces");
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const handleSignUpWithEmail = async (email: string, password: string) => {
        try {
            setError(null);
            await signUpWithEmail(email, password);
            router.push("/workspaces");
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const handleSignOut = async () => {
        try {
            setError(null);
            await firebaseSignOut();
            router.push("/login");
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const value = {
        user,
        loading,
        signInWithGoogle: handleSignInWithGoogle,
        signInWithEmail: handleSignInWithEmail,
        signUpWithEmail: handleSignUpWithEmail,
        signOut: handleSignOut,
        error,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
