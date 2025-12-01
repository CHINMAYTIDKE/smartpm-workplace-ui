import { NextRequest, NextResponse } from "next/server";
import { getTasksCollection, getProjectsCollection, getWorkspacesCollection, getUsersCollection } from "@/lib/mongodb";
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

        const updates: any = {
            updatedAt: new Date(),
        };

        if (title) updates.title = title.trim();
        if (description !== undefined) updates.description = description.trim();
        if (priority) updates.priority = priority;
        if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

        if (status) {
            updates.status = status;
            if (status === "completed" && task.status !== "completed") {
                updates.completedAt = new Date();
            } else if (status !== "completed") {
                updates.completedAt = null;
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
