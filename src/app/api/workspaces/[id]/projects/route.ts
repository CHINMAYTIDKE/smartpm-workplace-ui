import { NextRequest, NextResponse } from "next/server";
import { getProjectsCollection, getWorkspacesCollection, getTasksCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - List all projects in workspace
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
        const projectsCollection = await getProjectsCollection();
        const tasksCollection = await getTasksCollection();

        // Verify user has access to workspace
        const workspace = await workspacesCollection.findOne({
            _id: new ObjectId(params.id),
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

        // Fetch all projects in workspace
        const projects = await projectsCollection
            .find({
                workspaceId: new ObjectId(params.id),
            })
            .sort({ createdAt: -1 })
            .toArray();

        // Calculate task stats for each project
        const projectsWithStats = await Promise.all(
            projects.map(async (project) => {
                const tasks = await tasksCollection
                    .find({ projectId: project._id })
                    .toArray();

                const completedTasks = tasks.filter((t: any) => t.status === "completed").length;

                return {
                    id: project._id.toString(),
                    name: project.name,
                    description: project.description,
                    priority: project.priority,
                    status: project.status,
                    dueDate: project.dueDate,
                    tasks: {
                        total: tasks.length,
                        completed: completedTasks,
                    },
                    progress: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
                    members: project.members?.length || 0,
                    createdAt: project.createdAt,
                };
            })
        );

        return NextResponse.json({ projects: projectsWithStats });
    } catch (error) {
        console.error("Error fetching projects:", error);
        return NextResponse.json(
            { error: "Failed to fetch projects" },
            { status: 500 }
        );
    }
}

// POST - Create new project
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
        const { name, description, priority, dueDate } = body;

        if (!name || name.trim() === "") {
            return NextResponse.json(
                { error: "Project name is required" },
                { status: 400 }
            );
        }

        const workspacesCollection = await getWorkspacesCollection();
        const projectsCollection = await getProjectsCollection();

        // Verify user is admin or owner
        const workspace = await workspacesCollection.findOne({
            _id: new ObjectId(params.id),
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
                { error: "Only workspace owners and admins can create projects" },
                { status: 403 }
            );
        }

        const now = new Date();

        // Create project
        const newProject = {
            workspaceId: new ObjectId(params.id),
            name: name.trim(),
            description: description?.trim() || "",
            priority: priority || "medium",
            status: "planning",
            dueDate: dueDate ? new Date(dueDate) : null,
            createdBy: firebaseUid,
            createdAt: now,
            updatedAt: now,
            members: [firebaseUid],
        };

        const result = await projectsCollection.insertOne(newProject);

        // Update workspace project count
        await workspacesCollection.updateOne(
            { _id: new ObjectId(params.id) },
            {
                $inc: { projectCount: 1 },
                $set: { updatedAt: now }
            }
        );

        return NextResponse.json({
            success: true,
            project: {
                id: result.insertedId.toString(),
                ...newProject,
                tasks: { total: 0, completed: 0 },
                progress: 0,
            },
        });
    } catch (error) {
        console.error("Error creating project:", error);
        return NextResponse.json(
            { error: "Failed to create project" },
            { status: 500 }
        );
    }
}
