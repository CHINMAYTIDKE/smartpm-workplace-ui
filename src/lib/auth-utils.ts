import { getWorkspacesCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Check if a user is an admin or owner of a workspace
 */
export async function isWorkspaceAdmin(workspaceId: string, userId: string): Promise<boolean> {
    try {
        console.log('[isWorkspaceAdmin] Checking admin status for:', { workspaceId, userId });

        const workspacesCollection = await getWorkspacesCollection();
        const workspace = await workspacesCollection.findOne({
            _id: new ObjectId(workspaceId)
        });

        if (!workspace) {
            console.log('[isWorkspaceAdmin] Workspace not found:', workspaceId);
            return false;
        }

        console.log('[isWorkspaceAdmin] Workspace found:', {
            workspaceId,
            ownerId: workspace.ownerId,
            membersCount: workspace.members?.length || 0
        });

        // Check if user is owner
        if (workspace.ownerId === userId) {
            console.log('[isWorkspaceAdmin] User is owner');
            return true;
        }

        // Check if user is admin member
        const member = workspace.members?.find((m: any) => m.userId === userId);
        console.log('[isWorkspaceAdmin] Member check:', { userId, member, isAdmin: member?.role === 'admin' || member?.role === 'owner' });

        return member?.role === 'admin' || member?.role === 'owner';
    } catch (error) {
        console.error('[isWorkspaceAdmin] Error checking workspace admin role:', error);
        return false;
    }
}
