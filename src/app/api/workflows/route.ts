import { NextRequest, NextResponse } from 'next/server';
import {
    getWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
} from '@/lib/firebase/workflows';
import { CreateWorkflowInput, UpdateWorkflowInput } from '@/lib/models/workflow';
import { isWorkspaceAdmin } from '@/lib/auth-utils';
import { getWorkflow } from '@/lib/firebase/workflows';

// GET - Fetch all workflows for a workspace
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const workspaceId = searchParams.get('workspaceId');
        const userId = searchParams.get('userId');

        console.log('[GET /api/workflows] Request received:', { workspaceId, userId });

        if (!workspaceId || !userId) {
            console.log('[GET /api/workflows] Missing parameters');
            return NextResponse.json(
                { error: 'Workspace ID and User ID are required' },
                { status: 400 }
            );
        }

        // TEMPORARY: Admin check disabled for debugging
        // TODO: Re-enable after fixing workspace member setup in MongoDB
        // console.log('[GET /api/workflows] Checking admin access...');
        // const isAdmin = await isWorkspaceAdmin(workspaceId, userId);
        // console.log('[GET /api/workflows] Admin check result:', isAdmin);

        // if (!isAdmin) {
        //     console.log('[GET /api/workflows] Access denied for user');
        //     return NextResponse.json(
        //         { error: 'Access denied. Admin privileges required.' },
        //         { status: 403 }
        //     );
        // }

        console.log('[GET /api/workflows] Fetching workflows from Firestore...');
        const workflows = await getWorkflows(workspaceId);
        console.log('[GET /api/workflows] Workflows fetched:', workflows.length);

        return NextResponse.json({ workflows });
    } catch (error) {
        console.error('[GET /api/workflows] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workflows', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// POST - Create new workflow
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { workspaceId, name, description, trigger, action, createdBy } = body;

        if (!workspaceId || !name || !trigger || !action || !createdBy) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify admin access
        const isAdmin = await isWorkspaceAdmin(workspaceId, createdBy);
        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Access denied. Admin privileges required.' },
                { status: 403 }
            );
        }

        const input: CreateWorkflowInput = {
            workspaceId,
            name,
            description: description || '',
            trigger,
            action,
            createdBy,
        };

        const workflowId = await createWorkflow(input);
        return NextResponse.json({ id: workflowId, success: true });
    } catch (error) {
        console.error('Error creating workflow:', error);
        return NextResponse.json(
            { error: 'Failed to create workflow' },
            { status: 500 }
        );
    }
}

// PUT - Update workflow (including toggle)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, userId, ...updateData } = body;

        if (!id || !userId) {
            return NextResponse.json(
                { error: 'Workflow ID and User ID are required' },
                { status: 400 }
            );
        }

        // Get workflow to check workspace
        const workflow = await getWorkflow(id);
        if (!workflow) {
            return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        }

        // Verify admin access
        const isAdmin = await isWorkspaceAdmin(workflow.workspaceId, userId);
        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Access denied. Admin privileges required.' },
                { status: 403 }
            );
        }

        const input: UpdateWorkflowInput = {
            id,
            ...updateData,
        };

        await updateWorkflow(input);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating workflow:', error);
        return NextResponse.json(
            { error: 'Failed to update workflow' },
            { status: 500 }
        );
    }
}

// DELETE - Delete workflow
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const userId = searchParams.get('userId');

        if (!id || !userId) {
            return NextResponse.json(
                { error: 'Workflow ID and User ID are required' },
                { status: 400 }
            );
        }

        // Get workflow to check workspace
        const workflow = await getWorkflow(id);
        if (!workflow) {
            return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        }

        // Verify admin access
        const isAdmin = await isWorkspaceAdmin(workflow.workspaceId, userId);
        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Access denied. Admin privileges required.' },
                { status: 403 }
            );
        }

        await deleteWorkflow(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting workflow:', error);
        return NextResponse.json(
            { error: 'Failed to delete workflow' },
            { status: 500 }
        );
    }
}
