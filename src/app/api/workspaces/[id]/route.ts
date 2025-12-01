import { NextRequest, NextResponse } from "next/server";
import { getWorkspacesCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Get specific workspace details
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

        const workspace = await workspacesCollection.findOne({
            _id: new ObjectId(params.id),
        });

        if (!workspace) {
            return NextResponse.json(
                { error: "Workspace not found" },
                { status: 404 }
            );
        }

        // Check if user has access
        const isMember = workspace.members.some(
            (member: any) => member.userId === firebaseUid
        );

        if (!isMember) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        const userMember = workspace.members.find(
            (m: any) => m.userId === firebaseUid
        );

        return NextResponse.json({
            workspace: {
                id: workspace._id.toString(),
                name: workspace.name,
                description: workspace.description,
                role: userMember?.role || "member",
                members: workspace.members,
                inviteCode: userMember?.role === "owner" || userMember?.role === "admin"
                    ? workspace.inviteCode
                    : undefined,
                projectCount: workspace.projectCount || 0,
                lastActive: workspace.lastActive,
                createdAt: workspace.createdAt,
                updatedAt: workspace.updatedAt,
            },
        });
    } catch (error) {
        console.error("Error fetching workspace:", error);
        return NextResponse.json(
            { error: "Failed to fetch workspace" },
            { status: 500 }
        );
    }
}

// PATCH - Update workspace
export async function PATCH(
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

        const body = await request.json();
        const { name, description } = body;

        const workspacesCollection = await getWorkspacesCollection();

        const workspace = await workspacesCollection.findOne({
            _id: new ObjectId(params.id),
        });

        if (!workspace) {
            return NextResponse.json(
                { error: "Workspace not found" },
                { status: 404 }
            );
        }

        // Check if user is owner or admin
        const userMember = workspace.members.find(
            (m: any) => m.userId === firebaseUid
        );

        if (!userMember || (userMember.role !== "owner" && userMember.role !== "admin")) {
            return NextResponse.json(
                { error: "Only workspace owners and admins can update workspace details" },
                { status: 403 }
            );
        }

        const updates: any = {
            updatedAt: new Date(),
        };

        if (name && name.trim() !== "") {
            updates.name = name.trim();
        }

        if (description !== undefined) {
            updates.description = description.trim();
        }

        await workspacesCollection.updateOne(
            { _id: new ObjectId(params.id) },
            { $set: updates }
        );

        return NextResponse.json({
            success: true,
            workspace: {
                id: params.id,
                ...updates,
            },
        });
    } catch (error) {
        console.error("Error updating workspace:", error);
        return NextResponse.json(
            { error: "Failed to update workspace" },
            { status: 500 }
        );
    }
}

// DELETE - Delete workspace
export async function DELETE(
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

        const workspace = await workspacesCollection.findOne({
            _id: new ObjectId(params.id),
        });

        if (!workspace) {
            return NextResponse.json(
                { error: "Workspace not found" },
                { status: 404 }
            );
        }

        // Only owner can delete
        if (workspace.ownerId !== firebaseUid) {
            return NextResponse.json(
                { error: "Only workspace owner can delete the workspace" },
                { status: 403 }
            );
        }

        // Delete workspace
        await workspacesCollection.deleteOne({
            _id: new ObjectId(params.id),
        });

        return NextResponse.json({
            success: true,
            message: "Workspace deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting workspace:", error);
        return NextResponse.json(
            { error: "Failed to delete workspace" },
            { status: 500 }
        );
    }
}
