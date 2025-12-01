import { NextRequest, NextResponse } from "next/server";
import { getWorkspacesCollection, getUsersCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Fetch all members of a workspace with their user details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const firebaseUid = request.headers.get("x-firebase-uid");

        if (!firebaseUid) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const workspacesCollection = await getWorkspacesCollection();
        const usersCollection = await getUsersCollection();

        // Get workspace
        const workspace = await workspacesCollection.findOne({
            _id: new ObjectId(params.id),
        });

        if (!workspace) {
            return NextResponse.json(
                { error: "Workspace not found" },
                { status: 404 }
            );
        }

        // Check if user has access to this workspace
        const isMember = workspace.members.some(
            (member: any) => member.userId === firebaseUid
        );

        if (!isMember) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        // Get all member Firebase UIDs
        const memberUids = workspace.members.map((m: any) => m.userId);

        // Fetch user details for all members
        const memberUsers = await usersCollection
            .find({
                firebaseUid: { $in: memberUids },
            })
            .toArray();

        // Create a map of firebaseUid to user data
        const userMap = new Map();
        memberUsers.forEach((user) => {
            userMap.set(user.firebaseUid, user);
        });

        // Combine workspace member data with user data
        const membersWithDetails = workspace.members.map((member: any) => {
            const user = userMap.get(member.userId);

            return {
                id: member.userId,
                name: user?.displayName || user?.email || "Unknown User",
                email: user?.email || "",
                photoURL: user?.photoURL || null,
                role: member.role,
                joinedAt: member.joinedAt,
                status: "offline", // We don't track online status yet
            };
        });

        // Sort by role (owner first, then admin, then member) and join date
        const roleOrder = { owner: 0, admin: 1, member: 2 };
        membersWithDetails.sort((a: any, b: any) => {
            const roleCompare = roleOrder[a.role as keyof typeof roleOrder] - roleOrder[b.role as keyof typeof roleOrder];
            if (roleCompare !== 0) return roleCompare;
            return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
        });

        return NextResponse.json({
            members: membersWithDetails,
            totalCount: membersWithDetails.length,
            adminCount: membersWithDetails.filter((m: any) => m.role === 'owner' || m.role === 'admin').length,
        });
    } catch (error) {
        console.error("Error fetching workspace members:", error);
        return NextResponse.json(
            { error: "Failed to fetch members" },
            { status: 500 }
        );
    }
}
