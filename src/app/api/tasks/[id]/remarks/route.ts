import { NextRequest, NextResponse } from "next/server";
import { getTasksCollection, getWorkspacesCollection, getUsersCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// POST - Add remark to task
export async function POST(
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
        const { message, link } = body;

        if (!message || message.trim() === "") {
            return NextResponse.json(
                { error: "Remark message is required" },
                { status: 400 }
            );
        }

        const tasksCollection = await getTasksCollection();
        const usersCollection = await getUsersCollection();

        const task = await tasksCollection.findOne({
            _id: new ObjectId(params.id),
        });

        if (!task) {
            return NextResponse.json(
                { error: "Task not found" },
                { status: 404 }
            );
        }

        // Get user details
        const user = await usersCollection.findOne({ firebaseUid });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Verify user is working on this task or is admin
        const workspacesCollection = await getWorkspacesCollection();
        const workspace = await workspacesCollection.findOne({
            _id: task.workspaceId,
        });

        const userMember = workspace?.members.find(
            (m: any) => m.userId === firebaseUid
        );

        const canAddRemark =
            task.claimedBy === firebaseUid ||
            task.assignedTo === firebaseUid ||
            userMember?.role === "owner" ||
            userMember?.role === "admin";

        if (!canAddRemark) {
            return NextResponse.json(
                { error: "You can only add remarks to tasks you're working on" },
                { status: 403 }
            );
        }

        const newRemark = {
            id: new ObjectId().toString(),
            userId: firebaseUid,
            userName: user.displayName || user.email,
            userPhoto: user.photoURL || null,
            message: message.trim(),
            link: link?.trim() || null,
            createdAt: new Date(),
        };

        // Add remark to task
        await tasksCollection.updateOne(
            { _id: new ObjectId(params.id) },
            {
                $push: { remarks: newRemark },
                $set: { updatedAt: new Date() },
            }
        );

        return NextResponse.json({
            success: true,
            remark: newRemark,
        });
    } catch (error) {
        console.error("Error adding remark:", error);
        return NextResponse.json(
            { error: "Failed to add remark" },
            { status: 500 }
        );
    }
}

// GET - Get all remarks for task
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

        return NextResponse.json({
            remarks: task.remarks || [],
        });
    } catch (error) {
        console.error("Error fetching remarks:", error);
        return NextResponse.json(
            { error: "Failed to fetch remarks" },
            { status: 500 }
        );
    }
}
