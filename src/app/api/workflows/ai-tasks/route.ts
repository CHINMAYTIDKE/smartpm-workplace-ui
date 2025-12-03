import { NextRequest, NextResponse } from 'next/server';
import {
    getAITasks,
    createAITask,
    updateAITask,
    cancelAITask,
    getAITask,
} from '@/lib/firebase/workflows';
import { CreateAITaskInput, UpdateAITaskInput } from '@/lib/models/workflow';
import { isWorkspaceAdmin } from '@/lib/auth-utils';

// GET - Fetch AI tasks for a workspace
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const workspaceId = searchParams.get('workspaceId');
        const status = searchParams.get('status') as any;

        console.log('[GET /api/workflows/ai-tasks] Request:', { workspaceId, status });

        if (!workspaceId) {
            console.log('[GET /api/workflows/ai-tasks] Missing workspaceId');
            return NextResponse.json(
                { error: 'Workspace ID is required' },
                { status: 400 }
            );
        }

        console.log('[GET /api/workflows/ai-tasks] Fetching AI tasks from Firestore...');
        const aiTasks = await getAITasks(workspaceId, status || undefined);
        console.log('[GET /api/workflows/ai-tasks] Tasks fetched:', aiTasks.length);

        return NextResponse.json({ aiTasks });
    } catch (error) {
        console.error('[GET /api/workflows/ai-tasks] Error:', error);
        console.error('[GET /api/workflows/ai-tasks] Stack:', error instanceof Error ? error.stack : 'No stack trace');

        return NextResponse.json(
            {
                error: 'Failed to fetch AI tasks',
                details: error instanceof Error ? error.message : 'Unknown error',
                workspaceId: request.nextUrl.searchParams.get('workspaceId')
            },
            { status: 500 }
        );
    }
}

// POST - Create new AI task
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { workspaceId, name, description, type, startedBy, cancellable } = body;

        if (!workspaceId || !name || !type || !startedBy) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const input: CreateAITaskInput = {
            workspaceId,
            name,
            description: description || '',
            type,
            startedBy,
            cancellable: cancellable ?? true,
        };

        const taskId = await createAITask(input);
        return NextResponse.json({ id: taskId, success: true });
    } catch (error) {
        console.error('Error creating AI task:', error);
        return NextResponse.json(
            { error: 'Failed to create AI task' },
            { status: 500 }
        );
    }
}

// PATCH - Update AI task status
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, action, userId, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Task ID is required' },
                { status: 400 }
            );
        }

        // Handle cancel action
        if (action === 'cancel') {
            if (!userId) {
                return NextResponse.json(
                    { error: 'User ID is required for cancellation' },
                    { status: 400 }
                );
            }

            // Get task to check workspace
            const task = await getAITask(id);
            if (!task) {
                return NextResponse.json({ error: 'Task not found' }, { status: 404 });
            }

            // Verify admin access
            const isAdmin = await isWorkspaceAdmin(task.workspaceId, userId);
            if (!isAdmin) {
                return NextResponse.json(
                    { error: 'Access denied. Admin privileges required.' },
                    { status: 403 }
                );
            }

            await cancelAITask(id);
            return NextResponse.json({ success: true });
        }

        // Handle regular updates
        const input: UpdateAITaskInput = {
            id,
            ...updateData,
        };

        await updateAITask(input);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating AI task:', error);
        return NextResponse.json(
            { error: 'Failed to update AI task' },
            { status: 500 }
        );
    }
}
