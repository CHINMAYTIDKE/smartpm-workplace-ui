import { NextRequest, NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { firebaseUid, email, displayName, photoURL } = body;

        if (!firebaseUid || !email) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const usersCollection = await getUsersCollection();
        const now = new Date();

        // Check if user exists
        const existingUser = await usersCollection.findOne({ firebaseUid });

        if (existingUser) {
            // Update existing user (including email)
            await usersCollection.updateOne(
                { firebaseUid },
                {
                    $set: {
                        email, // Always update email in case it changed
                        displayName,
                        photoURL,
                        lastLoginAt: now,
                    },
                }
            );

            return NextResponse.json({
                success: true,
                user: { ...existingUser, email, lastLoginAt: now },
            });
        } else {
            // Create new user
            const newUser = {
                firebaseUid,
                email,
                displayName: displayName || null,
                photoURL: photoURL || null,
                createdAt: now,
                lastLoginAt: now,
                workspaces: [],
            };

            const result = await usersCollection.insertOne(newUser);

            return NextResponse.json({
                success: true,
                user: { ...newUser, _id: result.insertedId },
            });
        }
    } catch (error) {
        console.error("Error syncing user:", error);
        return NextResponse.json(
            { error: "Failed to sync user" },
            { status: 500 }
        );
    }
}
