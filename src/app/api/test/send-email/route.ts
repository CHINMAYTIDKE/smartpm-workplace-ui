import { NextRequest, NextResponse } from 'next/server';
import { sendTaskReminderEmail } from '@/lib/email-service';

/**
 * Test endpoint to send a sample email
 * GET /api/test/send-email?email=your@email.com
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json(
                { error: 'Email parameter is required. Usage: /api/test/send-email?email=your@email.com' },
                { status: 400 }
            );
        }

        console.log(`[TEST EMAIL] Sending test email to: ${email}`);

        // Send a test email
        const success = await sendTaskReminderEmail({
            to: email,
            assigneeName: 'Test User',
            taskTitle: '🧪 Test Email from FlowTrack Workflow',
            taskDescription: 'This is a test email to verify that Gmail integration is working correctly!',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            workspaceName: 'Test Workspace',
            taskUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        });

        if (success) {
            console.log(`[TEST EMAIL] ✅ Email sent successfully to: ${email}`);
            return NextResponse.json({
                success: true,
                message: `Test email sent successfully to ${email}. Check your inbox (and spam folder)!`
            });
        } else {
            console.log(`[TEST EMAIL] ❌ Failed to send email to: ${email}`);
            return NextResponse.json(
                { error: 'Failed to send email. Check server logs for details.' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('[TEST EMAIL] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to send test email',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
