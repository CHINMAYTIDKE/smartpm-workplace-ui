import { NextRequest, NextResponse } from 'next/server';
import { getWorkflow } from '@/lib/firebase/workflows';
import { executeWorkflowAction } from '@/lib/workflow-executor';
import { isWorkspaceAdmin } from '@/lib/auth-utils';

/**
 * Manually execute a workflow
 * POST /api/workflows/execute
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { workflowId, context, userId } = body;

        if (!workflowId || !userId) {
            return NextResponse.json(
                { error: 'Workflow ID and User ID are required' },
                { status: 400 }
            );
        }

        // Get the workflow
        const workflow = await getWorkflow(workflowId);

        if (!workflow) {
            return NextResponse.json(
                { error: 'Workflow not found' },
                { status: 404 }
            );
        }

        // Verify admin access
        const isAdmin = await isWorkspaceAdmin(workflow.workspaceId, userId);
        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Access denied. Admin privileges required.' },
                { status: 403 }
            );
        }

        if (!workflow.isActive) {
            return NextResponse.json(
                { error: 'Workflow is not active' },
                { status: 400 }
            );
        }

        // Execute the workflow action
        const result = await executeWorkflowAction(workflow, context || {});

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: result.message,
                workflowName: workflow.name
            });
        } else {
            return NextResponse.json(
                { error: result.message },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error executing workflow:', error);
        return NextResponse.json(
            { error: 'Failed to execute workflow' },
            { status: 500 }
        );
    }
}
