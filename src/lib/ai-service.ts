import { GoogleGenerativeAI } from "@google/generative-ai";
import { getProjectsCollection, getTasksCollection, getUsersCollection, getWorkspacesCollection } from "./mongodb";
import { ObjectId } from "mongodb";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

interface WorkspaceContext {
    workspaceId: string;
    projects: any[];
    tasks: any[];
    members: any[];
}

/**
 * Gather context about the workspace for AI processing
 */
export async function gatherWorkspaceContext(workspaceId: string): Promise<WorkspaceContext> {
    try {
        const projectsCollection = await getProjectsCollection();
        const tasksCollection = await getTasksCollection();
        const usersCollection = await getUsersCollection();
        const workspacesCollection = await getWorkspacesCollection();

        // Get workspace info
        const workspace = await workspacesCollection.findOne({
            _id: new ObjectId(workspaceId)
        });

        if (!workspace) {
            throw new Error("Workspace not found");
        }

        // Get all projects in workspace
        const projects = await projectsCollection
            .find({ workspaceId: new ObjectId(workspaceId) })
            .toArray();

        // Get all tasks in workspace
        const tasks = await tasksCollection
            .find({ workspaceId: new ObjectId(workspaceId) })
            .toArray();

        // Get workspace members
        const memberIds = workspace.members || [];
        const members = await usersCollection
            .find({ firebaseUid: { $in: memberIds } })
            .toArray();

        return {
            workspaceId,
            projects: projects.map(p => ({
                id: p._id.toString(),
                name: p.name,
                description: p.description,
                status: p.status,
                priority: p.priority,
                deadline: p.deadline
            })),
            tasks: tasks.map(t => ({
                id: t._id.toString(),
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                assignedTo: t.assignedTo,
                dueDate: t.dueDate,
                projectId: t.projectId.toString()
            })),
            members: members.map(m => ({
                id: m.firebaseUid,
                name: m.displayName || m.email,
                email: m.email
            }))
        };
    } catch (error) {
        console.error("Error gathering workspace context:", error);
        throw error;
    }
}

/**
 * Generate AI chat response
 */
export async function generateChatResponse(
    workspaceId: string,
    userMessage: string,
    conversationHistory: any[]
): Promise<string> {
    try {
        const context = await gatherWorkspaceContext(workspaceId);

        // Use gemini-2.5-flash as it is the free tier model
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Build context-aware prompt
        const systemPrompt = `You are an intelligent project management assistant for a workspace with the following context:

**Projects (${context.projects.length} total):**
${context.projects.map(p => `- ${p.name} (${p.status}, Priority: ${p.priority})`).join('\n')}

**Tasks (${context.tasks.length} total):**
- Todo: ${context.tasks.filter(t => t.status === 'todo').length}
- In Progress: ${context.tasks.filter(t => t.status === 'in-progress').length}
- Completed: ${context.tasks.filter(t => t.status === 'completed').length}

**Team Members (${context.members.length} total):**
${context.members.map(m => `- ${m.name}`).join('\n')}

You can help with:
- Analyzing project status and metrics
- Creating task lists and recommendations
- Assigning tasks to team members
- Planning sprints and prioritizing work
- Providing insights and summaries

Be helpful, concise, and actionable. Use markdown formatting for better readability.`;

        // Build conversation history
        const chatHistory = conversationHistory.slice(-5).map(msg => ({
            role: msg.isUser ? "user" : "model",
            parts: [{ text: msg.message }]
        }));

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }]
                },
                {
                    role: "model",
                    parts: [{ text: "I understand. I'm ready to assist with project management for this workspace." }]
                },
                ...chatHistory
            ],
        });

        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating chat response:", error);
        throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Execute AI action (summarize, analyze, create tasks, etc.)
 */
export async function executeAIAction(
    workspaceId: string,
    actionType: string
): Promise<string> {
    try {
        const context = await gatherWorkspaceContext(workspaceId);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let prompt = "";

        switch (actionType) {
            case "summarize":
                prompt = `Based on this workspace data:
- ${context.projects.length} projects
- ${context.tasks.length} tasks (${context.tasks.filter(t => t.status === 'todo').length} todo, ${context.tasks.filter(t => t.status === 'in-progress').length} in progress, ${context.tasks.filter(t => t.status === 'completed').length} completed)
- ${context.members.length} team members

Provide a concise executive summary of the current project status, highlighting:
1. Overall progress
2. Key priorities
3. Potential bottlenecks or risks
4. Recommendations

Use markdown formatting.`;
                break;

            case "create_tasks":
                prompt = `Based on the current projects and existing tasks, suggest 5-7 new tasks that would be valuable to add. Consider:
- Incomplete work
- Project requirements
- Team capacity

Format as a numbered list with task title and brief description.`;
                break;

            case "analyze_metrics":
                const completionRate = context.tasks.length > 0
                    ? ((context.tasks.filter(t => t.status === 'completed').length / context.tasks.length) * 100).toFixed(1)
                    : 0;

                prompt = `Analyze these workspace metrics:
- Completion Rate: ${completionRate}%
- Total Tasks: ${context.tasks.length}
- Active Projects: ${context.projects.filter(p => p.status !== 'completed').length}
- Team Size: ${context.members.length}

Task Distribution:
${context.members.map(m => {
                    const assigned = context.tasks.filter(t => t.assignedTo === m.id).length;
                    return `- ${m.name}: ${assigned} tasks`;
                }).join('\n')}

Provide insights on:
1. Team performance and workload balance
2. Project health indicators
3. Productivity trends
4. Actionable recommendations`;
                break;

            case "assign_tasks":
                return await autoAssignTasks(workspaceId, context);

            default:
                prompt = "I'm not sure how to handle that action. Could you please clarify?";
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error executing AI action:", error);
        throw new Error("Failed to execute AI action");
    }
}

/**
 * Automatically assign unassigned tasks to team members
 */
async function autoAssignTasks(workspaceId: string, context: WorkspaceContext): Promise<string> {
    try {
        const tasksCollection = await getTasksCollection();

        // Get unassigned tasks
        const unassignedTasks = context.tasks.filter(t => !t.assignedTo && t.status === 'todo');

        if (unassignedTasks.length === 0) {
            return "✅ All tasks are already assigned! No action needed.";
        }

        // Calculate current workload per member
        const workloadMap = new Map();
        context.members.forEach(m => {
            const assignedCount = context.tasks.filter(t => t.assignedTo === m.id && t.status !== 'completed').length;
            workloadMap.set(m.id, assignedCount);
        });

        const assignments: string[] = [];

        // Assign tasks to members with lowest workload
        for (const task of unassignedTasks.slice(0, 5)) { // Limit to 5 tasks per run
            // Find member with minimum workload
            let minWorkload = Infinity;
            let selectedMember: { id: string; name: string; email: string } | null = null;

            context.members.forEach(m => {
                const workload = workloadMap.get(m.id) || 0;
                if (workload < minWorkload) {
                    minWorkload = workload;
                    selectedMember = m;
                }
            });

            if (selectedMember) {
                // Update task in database
                await tasksCollection.updateOne(
                    { _id: new ObjectId(task.id) },
                    {
                        $set: {
                            assignedTo: selectedMember.id,
                            assignedBy: "ai",
                            updatedAt: new Date()
                        }
                    }
                );

                assignments.push(`- **${task.title}** → ${selectedMember.name}`);
                workloadMap.set(selectedMember.id, (workloadMap.get(selectedMember.id) || 0) + 1);
            }
        }

        if (assignments.length > 0) {
            return `✅ **Auto-assigned ${assignments.length} tasks:**\n\n${assignments.join('\n')}\n\nTasks were distributed based on current workload to maintain balance across the team.`;
        }

        return "No suitable assignments could be made at this time.";
    } catch (error) {
        console.error("Error auto-assigning tasks:", error);
        throw new Error("Failed to auto-assign tasks");
    }
}
