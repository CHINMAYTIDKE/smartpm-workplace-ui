import { NextRequest, NextResponse } from "next/server";
import { getWorkspacesCollection, getFilesCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { uploadFile } from "@/lib/supabase";

// GET - Fetch all files for a workspace
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const firebaseUid = request.headers.get("x-firebase-uid");

        if (!firebaseUid) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const workspacesCollection = await getWorkspacesCollection();
        const workspace = await workspacesCollection.findOne({
            _id: new ObjectId(params.id),
        });

        if (!workspace) {
            return NextResponse.json(
                { error: "Workspace not found" },
                { status: 404 }
            );
        }

        // Check if user has access
        const isMember = workspace.members.some(
            (member: any) => member.userId === firebaseUid
        );

        if (!isMember) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        const filesCollection = await getFilesCollection();
        const files = await filesCollection
            .find({ workspaceId: params.id })
            .sort({ uploadedAt: -1 })
            .toArray();

        return NextResponse.json({
            files: files.map((file) => ({
                id: file._id.toString(),
                name: file.name,
                type: file.type,
                size: file.size,
                folder: file.folder,
                storagePath: file.storagePath,
                uploadedBy: file.uploadedBy,
                uploadedAt: file.uploadedAt,
                url: file.url,
            })),
        });
    } catch (error) {
        console.error("Error fetching files:", error);
        return NextResponse.json(
            { error: "Failed to fetch files" },
            { status: 500 }
        );
    }
}

// POST - Upload new file
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const firebaseUid = request.headers.get("x-firebase-uid");

        if (!firebaseUid) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const workspacesCollection = await getWorkspacesCollection();
        const workspace = await workspacesCollection.findOne({
            _id: new ObjectId(params.id),
        });

        if (!workspace) {
            return NextResponse.json(
                { error: "Workspace not found" },
                { status: 404 }
            );
        }

        // Check if user has access
        const isMember = workspace.members.some(
            (member: any) => member.userId === firebaseUid
        );

        if (!isMember) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const folder = formData.get("folder") as string | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Upload to Supabase Storage
        console.log('Attempting to upload file:', file.name, 'to workspace:', params.id);
        const uploadResult = await uploadFile(params.id, file, folder || undefined);

        if (!uploadResult) {
            console.error('Supabase upload failed - uploadResult is null');
            console.error('This usually means the Supabase bucket "workspace-files" does not exist or there are permission issues');
            return NextResponse.json(
                { error: "Failed to upload to storage. Please ensure Supabase bucket 'workspace-files' exists and is public." },
                { status: 500 }
            );
        }

        // Save metadata to MongoDB
        const filesCollection = await getFilesCollection();
        const fileMetadata = {
            workspaceId: params.id,
            name: file.name,
            type: file.type,
            size: file.size,
            folder: folder || null,
            storagePath: uploadResult.path,
            url: uploadResult.url,
            uploadedBy: firebaseUid,
            uploadedAt: new Date(),
        };

        const result = await filesCollection.insertOne(fileMetadata);

        return NextResponse.json({
            success: true,
            file: {
                id: result.insertedId.toString(),
                ...fileMetadata,
            },
        });
    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        );
    }
}
