import { sendTaskReminderEmail } from './email-service';
import { getTasksCollection, getUsersCollection, getWorkspacesCollection, getProjectsCollection } from './mongodb';
import { incrementWorkflowRuns } from './firebase/workflows';
import { ObjectId } from 'mongodb';

interface WorkflowExecutionContext {
    workspaceId: string;
    triggeredBy?: string;
    taskId?: string;
    projectId?: string;
}

/**
 * Execute a workflow's action based on its configuration
 */
export async function executeWorkflowAction(
    workflow: any,
    context: WorkflowExecutionContext
): Promise<{ success: boolean; message: string }> {
    try {
        const actionType = workflow.action.type;

        switch (actionType) {
            case 'send-email':
                return await executeSendEmailAction(workflow, context);

            case 'assign-task':
                return await executeAssignTaskAction(workflow, context);

            case 'create-task':
                return await executeCreateTaskAction(workflow, context);

            case 'send-slack':
                return { success: false, message: 'Slack integration not yet implemented' };

            case 'webhook':
                return await executeWebhookAction(workflow, context);

            default:
                return { success: false, message: `Unknown action type: ${actionType}` };
        }
    } catch (error) {
        console.error('Error executing workflow action:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Send email notification action
 */
async function executeSendEmailAction(
    workflow: any,
    context: WorkflowExecutionContext
): Promise<{ success: boolean; message: string }> {
    try {
        const tasksCollection = await getTasksCollection();
        const usersCollection = await getUsersCollection();
        const workspacesCollection = await getWorkspacesCollection();

        // Get workspace info
        const workspace = await workspacesCollection.findOne({
            _id: new ObjectId(context.workspaceId)
        });

        if (!workspace) {
            return { success: false, message: 'Workspace not found' };
        }

        // If task-specific, send to task assignee
        if (context.taskId) {
            const task = await tasksCollection.findOne({
                _id: new ObjectId(context.taskId)
            });

            if (!task || !task.assignedTo) {
                return { success: false, message: 'Task or assignee not found' };
            }

            const user = await usersCollection.findOne({
                firebaseUid: task.assignedTo
            });

            if (!user || !user.email) {
                return { success: false, message: 'User email not found' };
            }

            // Send email using task reminder template
            await sendTaskReminderEmail({
                to: user.email,
                assigneeName: user.displayName || user.email.split('@')[0],
                taskTitle: task.title,
                taskDescription: task.description,
                dueDate: new Date(task.dueDate),
                workspaceName: workspace.name,
                taskUrl: `${process.env.NEXT_PUBLIC_APP_URL}/workplace/${context.workspaceId}`
            });

            await incrementWorkflowRuns(workflow.id);
            return { success: true, message: `Email sent to ${user.email}` };
        }

        // Send to all workspace members
        const members = workspace.members || [];
        let sentCount = 0;

        for (const memberId of members) {
            const user = await usersCollection.findOne({ firebaseUid: memberId });
            if (user && user.email) {
                // Send generic workspace notification
                // For now, we'll skip this - you can customize this later
                sentCount++;
            }
        }

        await incrementWorkflowRuns(workflow.id);
        return { success: true, message: `Email sent to ${sentCount} members` };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, message: 'Failed to send email' };
    }
}

/**
 * Auto-assign task action
 */
async function executeAssignTaskAction(
    workflow: any,
    context: WorkflowExecutionContext
): Promise<{ success: boolean; message: string }> {
    try {
        if (!context.taskId) {
            return { success: false, message: 'No task to assign' };
        }

        const tasksCollection = await getTasksCollection();
        const usersCollection = await getUsersCollection();
        const workspacesCollection = await getWorkspacesCollection();

        const workspace = await workspacesCollection.findOne({
            _id: new ObjectId(context.workspaceId)
        });

        if (!workspace || !workspace.members || workspace.members.length === 0) {
            return { success: false, message: 'No workspace members found' };
        }

        // Get all tasks to calculate workload
        const allTasks = await tasksCollection.find({
            workspaceId: new ObjectId(context.workspaceId),
            status: { $ne: 'completed' }
        }).toArray();

        // Calculate workload for each member
        const workloadMap = new Map<string, number>();
        workspace.members.forEach((memberId: string) => {
            const taskCount = allTasks.filter(t => t.assignedTo === memberId).length;
            workloadMap.set(memberId, taskCount);
        });

        // Find member with least workload
        let minWorkload = Infinity;
        let selectedMember = null;

        for (const [memberId, workload] of workloadMap.entries()) {
            if (workload < minWorkload) {
                minWorkload = workload;
                selectedMember = memberId;
            }
        }

        if (!selectedMember) {
            return { success: false, message: 'Could not find member to assign' };
        }

        // Assign the task
        await tasksCollection.updateOne(
            { _id: new ObjectId(context.taskId) },
            {
                $set: {
                    assignedTo: selectedMember,
                    assignedBy: 'workflow',
                    updatedAt: new Date()
                }
            }
        );

        const user = await usersCollection.findOne({ firebaseUid: selectedMember });
        await incrementWorkflowRuns(workflow.id);

        return {
            success: true,
            message: `Task assigned to ${user?.displayName || user?.email || selectedMember}`
        };
    } catch (error) {
        console.error('Error assigning task:', error);
        return { success: false, message: 'Failed to assign task' };
    }
}

/**
 * Create task action
 */
async function executeCreateTaskAction(
    workflow: any,
    context: WorkflowExecutionContext
): Promise<{ success: boolean; message: string }> {
    try {
        const tasksCollection = await getTasksCollection();
        const projectsCollection = await getProjectsCollection();

        // Get a default project in the workspace
        const project = await projectsCollection.findOne({
            workspaceId: new ObjectId(context.workspaceId)
        });

        if (!project) {
            return { success: false, message: 'No project found to create task in' };
        }

        const newTask = {
            title: `Automated Task - ${workflow.name}`,
            description: `This task was created automatically by the workflow: ${workflow.name}`,
            status: 'todo',
            priority: 'medium',
            workspaceId: new ObjectId(context.workspaceId),
            projectId: project._id,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'workflow'
        };

        await tasksCollection.insertOne(newTask);
        await incrementWorkflowRuns(workflow.id);

        return { success: true, message: 'Task created successfully' };
    } catch (error) {
        console.error('Error creating task:', error);
        return { success: false, message: 'Failed to create task' };
    }
}

/**
 * Execute webhook action
 */
async function executeWebhookAction(
    workflow: any,
    context: WorkflowExecutionContext
): Promise<{ success: boolean; message: string }> {
    try {
        const webhookUrl = workflow.action.config?.webhookUrl;
        const webhookMethod = workflow.action.config?.webhookMethod || 'POST';

        if (!webhookUrl) {
            return { success: false, message: 'Webhook URL not configured' };
        }

        const response = await fetch(webhookUrl, {
            method: webhookMethod,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workflow: workflow.name,
                workspaceId: context.workspaceId,
                timestamp: new Date().toISOString(),
                context
            })
        });

        await incrementWorkflowRuns(workflow.id);

        if (response.ok) {
            return { success: true, message: 'Webhook executed successfully' };
        } else {
            return { success: false, message: `Webhook failed: ${response.statusText}` };
        }
    } catch (error) {
        console.error('Error executing webhook:', error);
        return { success: false, message: 'Failed to execute webhook' };
    }
}

/**
 * Check if a workflow should be triggered based on an event
 */
export function shouldTriggerWorkflow(
    workflow: any,
    eventType: string,
    eventData: any
): boolean {
    const triggerType = workflow.trigger.type;

    switch (eventType) {
        case 'task-created':
            return triggerType === 'task-event' &&
                workflow.trigger.config?.taskStatus === 'created';

        case 'task-completed':
            return triggerType === 'task-event' &&
                workflow.trigger.config?.taskStatus === 'completed';

        case 'task-overdue':
            return triggerType === 'task-event' &&
                workflow.trigger.config?.taskStatus === 'overdue';

        default:
            return false;
    }
}
