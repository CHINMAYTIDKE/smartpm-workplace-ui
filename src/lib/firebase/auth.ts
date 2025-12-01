import {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User,
    UserCredential
} from "firebase/auth";
import { auth, googleProvider } from "./index";

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result;
    } catch (error: any) {
        console.error("Error signing in with Google:", error);
        throw error;
    }
};

// Sign up with email and password
export const signUpWithEmail = async (
    email: string,
    password: string
): Promise<UserCredential> => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return result;
    } catch (error: any) {
        console.error("Error signing up with email:", error);
        throw error;
    }
};

// Sign in with email and password
export const signInWithEmail = async (
    email: string,
    password: string
): Promise<UserCredential> => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result;
    } catch (error: any) {
        console.error("Error signing in with email:", error);
        throw error;
    }
};

// Sign out
export const signOut = async (): Promise<void> => {
    try {
        await firebaseSignOut(auth);
    } catch (error: any) {
        console.error("Error signing out:", error);
        throw error;
    }
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};

// Helper function to get user-friendly error messages
export const getAuthErrorMessage = (error: any): string => {
    const errorCode = error?.code;

    switch (errorCode) {
        case "auth/email-already-in-use":
            return "This email is already registered. Please sign in instead.";
        case "auth/invalid-email":
            return "Invalid email address.";
        case "auth/operation-not-allowed":
            return "Email/password accounts are not enabled. Please contact support.";
        case "auth/weak-password":
            return "Password is too weak. Please use at least 6 characters.";
        case "auth/user-disabled":
            return "This account has been disabled.";
        case "auth/user-not-found":
            return "No account found with this email.";
        case "auth/wrong-password":
            return "Incorrect password.";
        case "auth/invalid-credential":
            return "Invalid email or password.";
        case "auth/popup-closed-by-user":
            return "Sign-in popup was closed. Please try again.";
        case "auth/cancelled-popup-request":
            return "Only one popup request is allowed at a time.";
        case "auth/network-request-failed":
            return "Network error. Please check your connection.";
        default:
            return error?.message || "An error occurred during authentication.";
    }
};
