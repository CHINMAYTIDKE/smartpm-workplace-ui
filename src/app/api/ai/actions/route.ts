import { NextRequest, NextResponse } from "next/server";
import { executeAIAction } from "@/lib/ai-service";
import { getAIActionsCollection } from "@/lib/mongodb";
import { createAITask, updateAITask } from "@/lib/firebase/workflows";

// Map action types to friendly names
const ACTION_NAMES: Record<string, string> = {
    summarize: "Summarize Workspace",
    create_tasks: "Generate Task Suggestions",
    analyze_metrics: "Analyze Metrics",
    assign_tasks: "Auto-assign Tasks",
};

export async function POST(request: NextRequest) {
    try {
        const firebaseUid = request.headers.get("x-firebase-uid");

        if (!firebaseUid) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { workspaceId, actionType } = body;

        if (!workspaceId || !actionType) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Create AI task entry in workflow tab
        const taskName = ACTION_NAMES[actionType] || `AI Action: ${actionType}`;
        const taskId = await createAITask({
            workspaceId,
            name: taskName,
            description: `Executing ${actionType} action`,
            type: actionType as any,
            startedBy: firebaseUid,
            cancellable: false, // AI actions complete quickly, not cancellable for now
        });

        // Return task ID immediately for UI tracking
        const responsePromise = {
            success: true,
            taskId,
            message: "AI task started"
        };

        // Execute AI action asynchronously
        executeAIActionAsync(workspaceId, actionType, taskId, firebaseUid).catch(console.error);

        return NextResponse.json(responsePromise);
    } catch (error) {
        console.error("Error in AI action:", error);
        return NextResponse.json(
            { error: "Failed to execute AI action" },
            { status: 500 }
        );
    }
}

// Async function to execute AI action and update task status
async function executeAIActionAsync(
    workspaceId: string,
    actionType: string,
    taskId: string,
    userId: string
) {
    try {
        // Execute AI action
        const response = await executeAIAction(workspaceId, actionType);

        // Update task as completed
        await updateAITask({
            id: taskId,
            status: "completed",
            progress: 100,
            result: response,
        });

        // Log the action in MongoDB
        const actionsCollection = await getAIActionsCollection();
        await actionsCollection.insertOne({
            workspaceId,
            userId,
            actionType,
            response,
            createdAt: new Date(),
            status: "completed"
        });
    } catch (error) {
        console.error("Error executing AI action:", error);

        // Update task as failed
        await updateAITask({
            id: taskId,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
