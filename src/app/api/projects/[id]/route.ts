import { NextRequest, NextResponse } from "next/server";
import { getProjectsCollection, getTasksCollection, getWorkspacesCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Get project details
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

        const projectsCollection = await getProjectsCollection();
        const project = await projectsCollection.findOne({
            _id: new ObjectId(params.id),
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Get workspace to verify access
        const workspacesCollection = await getWorkspacesCollection();
        const workspace = await workspacesCollection.findOne({
            _id: project.workspaceId,
        });

        if (!workspace) {
            return NextResponse.json(
                { error: "Workspace not found" },
                { status: 404 }
            );
        }

        const isMember = workspace.members.some(
            (member: any) => member.userId === firebaseUid
        );

        if (!isMember) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        return NextResponse.json({
            project: {
                id: project._id.toString(),
                workspaceId: project.workspaceId.toString(),
                name: project.name,
                description: project.description,
                priority: project.priority,
                status: project.status,
                dueDate: project.dueDate,
                createdBy: project.createdBy,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                members: project.members || [],
            },
        });
    } catch (error) {
        console.error("Error fetching project:", error);
        return NextResponse.json(
            { error: "Failed to fetch project" },
            { status: 500 }
        );
    }
}

// PATCH - Update project
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
        const { name, description, priority, status, dueDate } = body;

        const projectsCollection = await getProjectsCollection();
        const project = await projectsCollection.findOne({
            _id: new ObjectId(params.id),
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Verify user is admin/owner
        const workspacesCollection = await getWorkspacesCollection();
        const workspace = await workspacesCollection.findOne({
            _id: project.workspaceId,
        });

        const userMember = workspace.members.find(
            (m: any) => m.userId === firebaseUid
        );

        if (!userMember || (userMember.role !== "owner" && userMember.role !== "admin")) {
            return NextResponse.json(
                { error: "Only admins can update projects" },
                { status: 403 }
            );
        }

        const updates: any = {
            updatedAt: new Date(),
        };

        if (name) updates.name = name.trim();
        if (description !== undefined) updates.description = description.trim();
        if (priority) updates.priority = priority;
        if (status) updates.status = status;
        if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

        await projectsCollection.updateOne(
            { _id: new ObjectId(params.id) },
            { $set: updates }
        );

        return NextResponse.json({
            success: true,
            project: {
                id: params.id,
                ...updates,
            },
        });
    } catch (error) {
        console.error("Error updating project:", error);
        return NextResponse.json(
            { error: "Failed to update project" },
            { status: 500 }
        );
    }
}

// DELETE - Delete project
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

        const projectsCollection = await getProjectsCollection();
        const tasksCollection = await getTasksCollection();

        const project = await projectsCollection.findOne({
            _id: new ObjectId(params.id),
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Verify user is admin/owner
        const workspacesCollection = await getWorkspacesCollection();
        const workspace = await workspacesCollection.findOne({
            _id: project.workspaceId,
        });

        const userMember = workspace.members.find(
            (m: any) => m.userId === firebaseUid
        );

        if (!userMember || (userMember.role !== "owner" && userMember.role !== "admin")) {
            return NextResponse.json(
                { error: "Only admins can delete projects" },
                { status: 403 }
            );
        }

        // Delete all tasks in project
        await tasksCollection.deleteMany({ projectId: new ObjectId(params.id) });

        // Delete project
        await projectsCollection.deleteOne({ _id: new ObjectId(params.id) });

        // Update workspace project count
        await workspacesCollection.updateOne(
            { _id: project.workspaceId },
            {
                $inc: { projectCount: -1 },
                $set: { updatedAt: new Date() }
            }
        );

        return NextResponse.json({
            success: true,
            message: "Project deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting project:", error);
        return NextResponse.json(
            { error: "Failed to delete project" },
            { status: 500 }
        );
    }
}
