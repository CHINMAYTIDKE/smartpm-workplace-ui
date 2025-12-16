import { NextRequest, NextResponse } from "next/server";
import { getTasksCollection, getProjectsCollection, getWorkspacesCollection, getUsersCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - List all tasks in project
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
        const projectsCollection = await getProjectsCollection();
        const usersCollection = await getUsersCollection();

        // Verify project exists and user has access
        const project = await projectsCollection.findOne({
            _id: new ObjectId(params.id),
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Fetch all tasks
        const tasks = await tasksCollection
            .find({ projectId: new ObjectId(params.id) })
            .sort({ createdAt: -1 })
            .toArray();

        // Get assignee details
        const assigneeUids = tasks
            .filter((t: any) => t.assignedTo)
            .map((t: any) => t.assignedTo);

        const assignees = await usersCollection
            .find({ firebaseUid: { $in: assigneeUids } })
            .toArray();

        const assigneeMap = new Map();
        assignees.forEach((user) => {
            assigneeMap.set(user.firebaseUid, {
                name: user.displayName || user.email,
                email: user.email,
                photoURL: user.photoURL,
            });
        });

        const tasksWithAssignees = tasks.map((task: any) => ({
            id: task._id.toString(),
            projectId: task.projectId.toString(),
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            assignedTo: task.assignedTo,
            assignee: task.assignedTo ? assigneeMap.get(task.assignedTo) : null,
            claimedBy: task.claimedBy || null,
            claimedAt: task.claimedAt || null,
            dueDate: task.dueDate,
            createdBy: task.createdBy,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            completedAt: task.completedAt,
            remarks: task.remarks || [],
        }));

        return NextResponse.json({ tasks: tasksWithAssignees });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return NextResponse.json(
            { error: "Failed to fetch tasks" },
            { status: 500 }
        );
    }
}

// POST - Create new task with workflow integration
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
        const { title, description, priority, dueDate } = body;

        if (!title || title.trim() === "") {
            return NextResponse.json(
                { error: "Task title is required" },
                { status: 400 }
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

        const now = new Date();

        const newTask = {
            projectId: new ObjectId(params.id),
            workspaceId: project.workspaceId,
            title: title.trim(),
            description: description?.trim() || "",
            status: "todo",
            priority: priority || "medium",
            assignedTo: null,
            assignedBy: null,
            claimedBy: null,
            claimedAt: null,
            dueDate: dueDate ? new Date(dueDate) : null,
            createdBy: firebaseUid,
            createdAt: now,
            updatedAt: now,
            completedAt: null,
            remarks: [],
        };

        const result = await tasksCollection.insertOne(newTask);
        const taskId = result.insertedId.toString();

        // 🔔 AUTO-TRIGGER WORKFLOW NOTIFICATIONS
        try {
            const { getWorkflows } = await import('@/lib/firebase/workflows');
            const { executeWorkflowAction, shouldTriggerWorkflow } = await import('@/lib/workflow-executor');

            console.log(`[WORKFLOW] Task created: ${taskId}, checking for workflows...`);

            // Get all active workflows for this workspace
            const workflows = await getWorkflows(project.workspaceId.toString());
            const activeWorkflows = workflows.filter(w => w.isActive);

            console.log(`[WORKFLOW] Found ${activeWorkflows.length} active workflows`);

            // Trigger workflows for task-created event
            for (const workflow of activeWorkflows) {
                if (workflow.trigger.type === 'task' || workflow.trigger.type === 'task-event') {
                    console.log(`[WORKFLOW] ✅ Executing workflow: "${workflow.name}" for task creation`);

                    await executeWorkflowAction(workflow, {
                        workspaceId: project.workspaceId.toString(),
                        taskId: taskId,
                        projectId: params.id,
                        triggeredBy: firebaseUid
                    });

                    console.log(`[WORKFLOW] ✅ Workflow "${workflow.name}" executed successfully`);
                }
            }
        } catch (workflowError) {
            // Don't fail task creation if workflow execution fails
            console.error('[WORKFLOW] ❌ Error executing workflows (task still created):', workflowError);
        }

        return NextResponse.json({
            success: true,
            task: {
                id: taskId,
                ...newTask,
                assignee: null,
            },
        });
    } catch (error) {
        console.error("Error creating task:", error);
        return NextResponse.json(
            { error: "Failed to create task" },
            { status: 500 }
        );
    }
}
