import { NextRequest, NextResponse } from "next/server";
import { generateChatResponse } from "@/lib/ai-service";
import { getAIConversationsCollection } from "@/lib/mongodb";

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
        const { workspaceId, message, conversationHistory } = body;

        if (!workspaceId || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Generate AI response
        const aiResponse = await generateChatResponse(
            workspaceId,
            message,
            conversationHistory || []
        );

        // Store conversation in database
        const conversationsCollection = await getAIConversationsCollection();

        await conversationsCollection.updateOne(
            { workspaceId, userId: firebaseUid },
            {
                $push: {
                    messages: {
                        $each: [
                            {
                                role: "user",
                                content: message,
                                timestamp: new Date()
                            },
                            {
                                role: "assistant",
                                content: aiResponse,
                                timestamp: new Date()
                            }
                        ]
                    }
                },
                $set: {
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );

        return NextResponse.json({
            success: true,
            response: aiResponse
        });
    } catch (error) {
        console.error("Error in AI chat:", error);
        return NextResponse.json(
            {
                error: "Failed to process chat message",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
