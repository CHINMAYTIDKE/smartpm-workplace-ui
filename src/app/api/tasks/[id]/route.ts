import { NextRequest, NextResponse } from "next/server";
import { getTasksCollection, getWorkspacesCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// PATCH - Update task
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
        const { title, description, status, priority, dueDate } = body;

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

        // Check if task is claimed by someone else
        if (task.claimedBy && task.claimedBy !== firebaseUid && task.status === "in-progress") {
            const workspacesCollection = await getWorkspacesCollection();
            const workspace = await workspacesCollection.findOne({
                _id: task.workspaceId,
            });

            const userMember = workspace?.members.find(
                (m: any) => m.userId === firebaseUid
            );

            // Only admin can modify tasks claimed by others
            if (!userMember || (userMember.role !== "owner" && userMember.role !== "admin")) {
                return NextResponse.json(
                    { error: "This task is currently being worked on by another member" },
                    { status: 403 }
                );
            }
        }

        const updates: any = {
            updatedAt: new Date(),
        };

        if (title) updates.title = title.trim();
        if (description !== undefined) updates.description = description.trim();
        if (priority) updates.priority = priority;
        if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

        if (status) {
            // Handle task claiming when moving to in-progress
            if (status === "in-progress" && task.status !== "in-progress") {
                updates.status = "in-progress";
                updates.claimedBy = firebaseUid;
                updates.claimedAt = new Date();
            }
            // Handle marking as pending verification (member completes)
            else if (status === "completed" && task.status !== "completed") {
                // Member marks as pending admin verification
                if (task.claimedBy && task.claimedBy !== firebaseUid) {
                    return NextResponse.json(
                        { error: "Only the member working on this task can mark it as completed" },
                        { status: 403 }
                    );
                }
                updates.status = "pending-verification";
                updates.pendingVerificationAt = new Date();
            }
            // Handle releasing task (back to todo)
            else if (status === "todo") {
                updates.status = "todo";
                updates.claimedBy = null;
                updates.claimedAt = null;
                updates.completedAt = null;
            }
            // Other status changes
            else {
                updates.status = status;
            }
        }

        await tasksCollection.updateOne(
            { _id: new ObjectId(params.id) },
            { $set: updates }
        );

        return NextResponse.json({
            success: true,
            task: {
                id: params.id,
                ...updates,
            },
        });
    } catch (error) {
        console.error("Error updating task:", error);
        return NextResponse.json(
            { error: "Failed to update task" },
            { status: 500 }
        );
    }
}

// DELETE - Delete task
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

        // Verify user is task creator or admin
        const workspacesCollection = await getWorkspacesCollection();
        const workspace = await workspacesCollection.findOne({
            _id: task.workspaceId,
        });

        if (!workspace) {
            return NextResponse.json(
                { error: "Workspace not found" },
                { status: 404 }
            );
        }

        const userMember = workspace.members.find(
            (m: any) => m.userId === firebaseUid
        );

        const canDelete = task.createdBy === firebaseUid ||
            userMember?.role === "owner" ||
            userMember?.role === "admin";

        if (!canDelete) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        await tasksCollection.deleteOne({ _id: new ObjectId(params.id) });

        return NextResponse.json({
            success: true,
            message: "Task deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting task:", error);
        return NextResponse.json(
            { error: "Failed to delete task" },
            { status: 500 }
        );
    }
}
