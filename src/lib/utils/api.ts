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

// Helper function for FormData uploads with Firebase auth token
export async function fetchWithAuthFormData(url: string, formData: FormData, options: RequestInit = {}) {
    const { getAuth } = await import("firebase/auth");
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        throw new Error("Not authenticated");
    }

    // Add Firebase UID to headers (don't set Content-Type for FormData)
    const headers = {
        ...options.headers,
        "x-firebase-uid": user.uid,
    };

    return fetch(url, {
        ...options,
        method: "POST",
        headers,
        body: formData,
    });
}
