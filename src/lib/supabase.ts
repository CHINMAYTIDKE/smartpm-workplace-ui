import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const BUCKET_NAME = 'workspace-files'

// Helper function to upload a file
export async function uploadFile(
    workspaceId: string,
    file: File,
    folder?: string
): Promise<{ path: string; url: string } | null> {
    try {
        console.log('=== Supabase Upload Debug ===');
        console.log('Supabase URL:', supabaseUrl);
        console.log('Bucket name:', BUCKET_NAME);
        console.log('Workspace ID:', workspaceId);
        console.log('File name:', file.name);
        console.log('File size:', file.size);
        console.log('File type:', file.type);

        const fileName = `${Date.now()}_${file.name}`
        const filePath = folder
            ? `workspace-${workspaceId}/files/${folder}/${fileName}`
            : `workspace-${workspaceId}/files/${fileName}`

        console.log('Upload path:', filePath);

        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            console.error('=== Supabase Upload Error ===');
            console.error('Error message:', error.message);
            console.error('Error details:', JSON.stringify(error, null, 2));
            return null
        }

        console.log('Upload successful! Path:', data.path);

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath)

        console.log('Public URL:', urlData.publicUrl);

        return {
            path: data.path,
            url: urlData.publicUrl
        }
    } catch (error) {
        console.error('=== Supabase Upload Exception ===');
        console.error('Exception:', error);
        return null
    }
}

// Helper function to delete a file
export async function deleteFile(storagePath: string): Promise<boolean> {
    try {
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([storagePath])

        if (error) {
            console.error('Delete error:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('Delete error:', error)
        return false
    }
}

// Helper function to get file URL
export async function getFileUrl(storagePath: string): Promise<string | null> {
    try {
        const { data } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(storagePath)

        return data.publicUrl
    } catch (error) {
        console.error('Get URL error:', error)
        return null
    }
}

// Helper function to list files in a workspace
export async function listFiles(
    workspaceId: string,
    folder?: string
): Promise<any[]> {
    try {
        const path = folder
            ? `workspace-${workspaceId}/files/${folder}`
            : `workspace-${workspaceId}/files`

        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list(path)

        if (error) {
            console.error('List files error:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('List files error:', error)
        return []
    }
}
