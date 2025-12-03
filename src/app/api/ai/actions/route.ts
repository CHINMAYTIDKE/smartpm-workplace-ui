import { NextRequest, NextResponse } from "next/server";
import { executeAIAction } from "@/lib/ai-service";
import { getAIActionsCollection } from "@/lib/mongodb";

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

        // Execute AI action
        const response = await executeAIAction(workspaceId, actionType);

        // Log the action
        const actionsCollection = await getAIActionsCollection();
        await actionsCollection.insertOne({
            workspaceId,
            userId: firebaseUid,
            actionType,
            response,
            createdAt: new Date(),
            status: "completed"
        });

        return NextResponse.json({
            success: true,
            response
        });
    } catch (error) {
        console.error("Error in AI action:", error);
        return NextResponse.json(
            { error: "Failed to execute AI action" },
            { status: 500 }
        );
    }
}
