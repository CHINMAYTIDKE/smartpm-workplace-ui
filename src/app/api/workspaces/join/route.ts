import { NextRequest, NextResponse } from "next/server";
import { getWorkspacesCollection, getUsersCollection } from "@/lib/mongodb";
import { validateInviteCode } from "@/lib/utils/invite-code";

// POST - Join workspace with invite code
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
        const { inviteCode } = body;

        if (!inviteCode || !validateInviteCode(inviteCode)) {
            return NextResponse.json(
                { error: "Invalid invite code format" },
                { status: 400 }
            );
        }

        const workspacesCollection = await getWorkspacesCollection();
        const usersCollection = await getUsersCollection();

        // Find workspace by invite code
        const workspace = await workspacesCollection.findOne({
            inviteCode: inviteCode.toUpperCase(),
        });

        if (!workspace) {
            return NextResponse.json(
                { error: "Invalid invite code. Workspace not found." },
                { status: 404 }
            );
        }

        // Check if user is already a member
        const isMember = workspace.members.some(
            (member: any) => member.userId === firebaseUid
        );

        if (isMember) {
            return NextResponse.json(
                { error: "You are already a member of this workspace" },
                { status: 400 }
            );
        }

        const now = new Date();

        // Add user to workspace members
        await workspacesCollection.updateOne(
            { _id: workspace._id },
            {
                $push: {
                    members: {
                        userId: firebaseUid,
                        role: "member",
                        joinedAt: now,
                    },
                },
                $set: {
                    updatedAt: now,
                },
            }
        );

        // Update user's workspaces array
        await usersCollection.updateOne(
            { firebaseUid },
            {
                $addToSet: {
                    workspaces: workspace._id,
                },
            }
        );

        // Return the joined workspace
        return NextResponse.json({
            success: true,
            workspace: {
                id: workspace._id.toString(),
                name: workspace.name,
                description: workspace.description,
                role: "member",
                memberCount: workspace.members.length + 1,
                projectCount: workspace.projectCount || 0,
                lastActive: workspace.lastActive || null,
            },
        });
    } catch (error) {
        console.error("Error joining workspace:", error);
        return NextResponse.json(
            { error: "Failed to join workspace" },
            { status: 500 }
        );
    }
}
