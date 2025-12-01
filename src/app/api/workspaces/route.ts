import { NextRequest, NextResponse } from "next/server";
import { getWorkspacesCollection, getUsersCollection } from "@/lib/mongodb";
import { generateInviteCode } from "@/lib/utils/invite-code";
import { ObjectId } from "mongodb";

// GET - Fetch all workspaces for authenticated user
export async function GET(request: NextRequest) {
    try {
        // Get Firebase UID from header (set by auth context)
        const firebaseUid = request.headers.get("x-firebase-uid");

        if (!firebaseUid) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const workspacesCollection = await getWorkspacesCollection();

        // Find all workspaces where user is a member
        const workspaces = await workspacesCollection
            .find({
                "members.userId": firebaseUid,
            })
            .toArray();

        // Format workspaces with user's role
        const formattedWorkspaces = workspaces.map((workspace) => {
            const userMember = workspace.members.find(
                (m: any) => m.userId === firebaseUid
            );

            return {
                id: workspace._id.toString(),
                name: workspace.name,
                description: workspace.description,
                role: userMember?.role || "member",
                memberCount: workspace.members.length,
                projectCount: workspace.projectCount || 0,
                lastActive: workspace.lastActive || null,
                lastAccessed: getRelativeTime(userMember?.joinedAt || workspace.createdAt),
                createdAt: workspace.createdAt,
                inviteCode: userMember?.role === "owner" || userMember?.role === "admin"
                    ? workspace.inviteCode
                    : undefined,
            };
        });

        return NextResponse.json({ workspaces: formattedWorkspaces });
    } catch (error) {
        console.error("Error fetching workspaces:", error);
        return NextResponse.json(
            { error: "Failed to fetch workspaces" },
            { status: 500 }
        );
    }
}

// POST - Create new workspace
export async function POST(request: NextRequest) {
    try {
        const firebaseUid = request.headers.get("x-firebase-uid");

        if (!firebaseUid) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, description } = body;

        if (!name || name.trim() === "") {
            return NextResponse.json(
                { error: "Workspace name is required" },
                { status: 400 }
            );
        }

        const workspacesCollection = await getWorkspacesCollection();
        const usersCollection = await getUsersCollection();

        // Generate unique invite code
        let inviteCode = generateInviteCode();
        let codeExists = await workspacesCollection.findOne({ inviteCode });

        // Ensure code is unique
        while (codeExists) {
            inviteCode = generateInviteCode();
            codeExists = await workspacesCollection.findOne({ inviteCode });
        }

        const now = new Date();

        // Create workspace document
        const newWorkspace = {
            name: name.trim(),
            description: description?.trim() || "",
            ownerId: firebaseUid,
            members: [
                {
                    userId: firebaseUid,
                    role: "owner" as const,
                    joinedAt: now,
                },
            ],
            inviteCode,
            createdAt: now,
            updatedAt: now,
            projectCount: 0,
            lastActive: null,
        };

        const result = await workspacesCollection.insertOne(newWorkspace);

        // Update user's workspaces array
        await usersCollection.updateOne(
            { firebaseUid },
            {
                $addToSet: {
                    workspaces: result.insertedId,
                },
            }
        );

        return NextResponse.json({
            success: true,
            workspace: {
                id: result.insertedId.toString(),
                ...newWorkspace,
            },
        });
    } catch (error) {
        console.error("Error creating workspace:", error);
        return NextResponse.json(
            { error: "Failed to create workspace" },
            { status: 500 }
        );
    }
}

// Helper function to get relative time string
function getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
        return minutes <= 1 ? "just now" : `${minutes} minutes ago`;
    } else if (hours < 24) {
        return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    } else {
        return days === 1 ? "1 day ago" : `${days} days ago`;
    }
}
