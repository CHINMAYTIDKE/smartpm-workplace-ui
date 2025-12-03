import { NextRequest, NextResponse } from 'next/server';
import { getTasksCollection, getUsersCollection, getWorkspacesCollection } from '@/lib/mongodb';
import { sendBatchTaskReminders } from '@/lib/email-service';
import { ObjectId } from 'mongodb';

/**
 * Cron endpoint to send task reminders for tasks due in 7 days
 * This should be called daily by Vercel Cron or similar scheduler
 */
export async function GET(request: NextRequest) {
    try {
        // TEMPORARY: Auth check disabled for testing
        // TODO: Fix CRON_SECRET mismatch and re-enable
        /*
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        console.log('[CRON] Auth check:', {
            hasAuthHeader: !!authHeader,
            hasCronSecret: !!cronSecret,
            authHeader: authHeader,
            expectedFormat: `Bearer ${cronSecret}`,
            match: authHeader === `Bearer ${cronSecret}`
        });

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.log('[CRON] Authorization failed!');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        */

        // Calculate date 7 days from now
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        sevenDaysFromNow.setHours(0, 0, 0, 0); // Start of day

        const eightDaysFromNow = new Date(sevenDaysFromNow);
        eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 1); // End of day

        // Get all tasks due in 7 days
        const tasksCollection = await getTasksCollection();
        const tasks = await tasksCollection.find({
            dueDate: {
                $gte: sevenDaysFromNow,
                $lt: eightDaysFromNow
            },
            status: { $ne: 'completed' }, // Don't remind for completed tasks
            assignedTo: { $exists: true, $ne: null } // Only tasks with assignees
        }).toArray();

        if (tasks.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No tasks due in 7 days',
                sent: 0
            });
        }

        // Get unique assignee IDs and workspace IDs
        const assigneeIds = [...new Set(tasks.map(t => t.assignedTo))];
        const workspaceIds = [...new Set(tasks.map(t => t.workspaceId))];

        // Fetch user and workspace data
        const usersCollection = await getUsersCollection();
        const workspacesCollection = await getWorkspacesCollection();

        const users = await usersCollection.find({
            firebaseUid: { $in: assigneeIds }
        }).toArray();

        const workspaces = await workspacesCollection.find({
            _id: { $in: workspaceIds.map(id => new ObjectId(id)) }
        }).toArray();

        // Create user and workspace lookup maps
        const userMap = new Map(users.map(u => [u.firebaseUid, u]));
        const workspaceMap = new Map(workspaces.map(w => [w._id.toString(), w]));

        // Build reminder email data
        const reminders = tasks.map(task => {
            const user = userMap.get(task.assignedTo);
            const workspace = workspaceMap.get(task.workspaceId.toString());

            if (!user || !user.email || !workspace) {
                return null;
            }

            return {
                to: user.email,
                assigneeName: user.displayName || user.email.split('@')[0],
                taskTitle: task.title,
                taskDescription: task.description,
                dueDate: new Date(task.dueDate),
                workspaceName: workspace.name,
                taskUrl: `${process.env.NEXT_PUBLIC_APP_URL}/workplace/${task.workspaceId}`, // Update with actual task URL if available
            };
        }).filter(Boolean) as any[];

        // Send batch reminders
        const result = await sendBatchTaskReminders(reminders);

        // Log the results
        console.log(`Task reminders sent: ${result.sent} successful, ${result.failed} failed`);

        return NextResponse.json({
            success: true,
            message: `Sent ${result.sent} reminders, ${result.failed} failed`,
            sent: result.sent,
            failed: result.failed,
            totalTasks: tasks.length
        });

    } catch (error) {
        console.error('Error in task reminders cron:', error);
        return NextResponse.json(
            { error: 'Failed to send task reminders', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// Also support POST for manual testing
export async function POST(request: NextRequest) {
    return GET(request);
}
