import { NextRequest, NextResponse } from 'next/server';
import { getWorkspacesCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const workspacesCollection = await getWorkspacesCollection();
        const workspace = await workspacesCollection.findOne({
            _id: new ObjectId(params.id)
        });

        if (!workspace) {
            return NextResponse.json(
                { error: 'Workspace not found' },
                { status: 404 }
            );
        }

        const member = workspace.members.find((m: any) => m.userId === userId);

        if (!member) {
            return NextResponse.json(
                { role: null },
                { status: 200 }
            );
        }

        return NextResponse.json({ role: member.role });
    } catch (error) {
        console.error('Error fetching member role:', error);
        return NextResponse.json(
            { error: 'Failed to fetch member role' },
            { status: 500 }
        );
    }
}
