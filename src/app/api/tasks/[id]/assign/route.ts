import { NextRequest, NextResponse } from "next/server";
import { getTasksCollection, getWorkspacesCollection, getUsersCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// PATCH - Assign task to member
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
        const { assignedTo } = body;

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

        // Verify user is admin or owner
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

        if (!userMember || (userMember.role !== "owner" && userMember.role !== "admin")) {
            return NextResponse.json(
                { error: "Only admins can assign tasks" },
                { status: 403 }
            );
        }

        // Verify assignee is a workspace member
        if (assignedTo) {
            const assigneeMember = workspace.members.find(
                (m: any) => m.userId === assignedTo
            );

            if (!assigneeMember) {
                return NextResponse.json(
                    { error: "Assignee must be a workspace member" },
                    { status: 400 }
                );
            }
        }

        // Update task
        await tasksCollection.updateOne(
            { _id: new ObjectId(params.id) },
            {
                $set: {
                    assignedTo: assignedTo || null,
                    assignedBy: assignedTo ? firebaseUid : null,
                    updatedAt: new Date(),
                },
            }
        );

        // Get assignee details if assigned
        let assignee = null;
        if (assignedTo) {
            const usersCollection = await getUsersCollection();
            const assigneeUser = await usersCollection.findOne({ firebaseUid: assignedTo });
            if (assigneeUser) {
                assignee = {
                    name: assigneeUser.displayName || assigneeUser.email,
                    email: assigneeUser.email,
                    photoURL: assigneeUser.photoURL,
                };
            }
        }

        return NextResponse.json({
            success: true,
            task: {
                id: params.id,
                assignedTo: assignedTo || null,
                assignedBy: assignedTo ? firebaseUid : null,
                assignee,
            },
        });
    } catch (error) {
        console.error("Error assigning task:", error);
        return NextResponse.json(
            { error: "Failed to assign task" },
            { status: 500 }
        );
    }
}
