import { NextRequest, NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
    try {
        // In a real app, you would get the Firebase UID from the authenticated session
        // For now, we'll get it from a header or query parameter
        const firebaseUid = request.headers.get("x-firebase-uid");

        if (!firebaseUid) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const usersCollection = await getUsersCollection();
        const user = await usersCollection.findOne({ firebaseUid });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { error: "Failed to fetch user" },
            { status: 500 }
        );
    }
}
