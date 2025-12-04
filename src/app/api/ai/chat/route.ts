import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getProjectsCollection, getTasksCollection, getAIConversationsCollection } from "@/lib/mongodb";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

        // 1. Fetch Context Data
        const projectsCollection = await getProjectsCollection();
        const tasksCollection = await getTasksCollection();

        const projects = await projectsCollection.find({ workspaceId }).toArray();
        const tasks = await tasksCollection.find({ workspaceId }).toArray();

        // Format context for AI
        const projectContext = projects.map(p =>
            `- Project: ${p.name} (Status: ${p.status})`
        ).join("\n");

        const taskContext = tasks.map(t =>
            `- Task: ${t.title} (Status: ${t.status}, Assigned to: ${t.assigneeId || "Unassigned"})`
        ).join("\n");

        const systemPrompt = `
You are a helpful AI project management assistant.
You have access to the following project data for this workspace:

PROJECTS:
${projectContext}

TASKS:
${taskContext}

Answer the user's question based on this data. If the user asks about something not in the data, say you don't have that information.
Keep responses concise and helpful.
`;

        // 2. Prepare Chat History
        // Convert frontend message format to Gemini format if needed, 
        // but for simplicity/robustness with the new model, we'll just append the latest message 
        // to the history or start fresh with the system prompt context.
        // A simple approach is to send the system prompt + user message.
        // For multi-turn, we'd map the history. Let's do a basic mapping.

        const history = (conversationHistory || []).map((msg: any) => ({
            role: msg.isUser ? "user" : "model",
            parts: [{ text: msg.message }],
        }));

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }]
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I have access to the project and task data. How can I help you?" }]
                },
                ...history
            ]
        });

        // 3. Generate Stream
        const result = await chat.sendMessageStream(message);
        const encoder = new TextEncoder();

        // 4. Return ReadableStream
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        if (text) {
                            controller.enqueue(encoder.encode(text));
                        }
                    }

                    // Save to DB after streaming (fire and forget or await if critical)
                    // Note: In a real streaming response, we can't easily await the full text 
                    // to save to DB *before* returning. We'd need to accumulate it.
                    // For now, we'll skip saving the *response* to DB in this request to keep it simple 
                    // and fast, or we could accumulate and save at the end.
                    // Let's accumulate for DB saving.

                } catch (e) {
                    console.error("Streaming error:", e);
                    controller.error(e);
                } finally {
                    controller.close();
                }
            }
        });

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
            },
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

export async function GET(request: NextRequest) {
    try {
        const firebaseUid = request.headers.get("x-firebase-uid");
        const { searchParams } = new URL(request.url);
        const workspaceId = searchParams.get("workspaceId");

        if (!firebaseUid || !workspaceId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const conversationsCollection = await getAIConversationsCollection();
        const conversation = await conversationsCollection.findOne({
            workspaceId,
            userId: firebaseUid
        });

        if (!conversation) {
            return NextResponse.json({ messages: [] });
        }

        // Transform MongoDB messages to frontend format
        // MongoDB format: { role: "user" | "assistant", content: string, timestamp: Date }
        // Frontend format: { id: number, message: string, time: string, isUser: boolean }

        const messages = (conversation.messages || []).map((msg: any, index: number) => ({
            id: index + 1,
            message: msg.content,
            time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isUser: msg.role === "user"
        }));

        return NextResponse.json({ messages });

    } catch (error) {
        console.error("Error fetching chat history:", error);
        return NextResponse.json(
            { error: "Failed to fetch chat history" },
            { status: 500 }
        );
    }
}
