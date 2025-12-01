import { NextRequest, NextResponse } from "next/server";
import { getTasksCollection, getWorkspacesCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// PATCH - Admin verify task completion
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
        const { approved } = body; // true to approve, false to reject

        const tasksCollection = await getTasksCollection();
        const task = await tasksCollection.findOne({
            _id: new ObjectId(params.id),
        });

        if (!task) {
            return NextResponse.json(
                { error: "Task not found" },
                { status: 404 }
            );
        }

        // Verify user is admin
        const workspacesCollection = await getWorkspacesCollection();
        const workspace = await workspacesCollection.findOne({
            _id: task.workspaceId,
        });

        const userMember = workspace?.members.find(
            (m: any) => m.userId === firebaseUid
        );

        if (!userMember || (userMember.role !== "owner" && userMember.role !== "admin")) {
            return NextResponse.json(
                { error: "Only admins can verify task completion" },
                { status: 403 }
            );
        }

        const updates: any = {
            updatedAt: new Date(),
            verifiedBy: approved ? firebaseUid : null,
            verifiedAt: approved ? new Date() : null,
        };

        if (approved) {
            // Approve completion
            updates.status = "completed";
            updates.completedAt = new Date();
        } else {
            // Reject - send back to in-progress
            updates.status = "in-progress";
            updates.pendingVerificationAt = null;
        }

        await tasksCollection.updateOne(
            { _id: new ObjectId(params.id) },
            { $set: updates }
        );

        return NextResponse.json({
            success: true,
            approved,
            task: {
                id: params.id,
                ...updates,
            },
        });
    } catch (error) {
        console.error("Error verifying task:", error);
        return NextResponse.json(
            { error: "Failed to verify task" },
            { status: 500 }
        );
    }
}
