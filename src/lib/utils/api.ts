// Helper function to make API calls with Firebase auth token
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const { getAuth } = await import("firebase/auth");
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        throw new Error("Not authenticated");
    }

    // Add Firebase UID to headers
    const headers = {
        ...options.headers,
        "x-firebase-uid": user.uid,
        "Content-Type": "application/json",
    };

    return fetch(url, {
        ...options,
        headers,
    });
}
