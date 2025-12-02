import { NextRequest, NextResponse } from "next/server";
import { getWorkspacesCollection, getFilesCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { deleteFile } from "@/lib/supabase";

// DELETE - Delete a file
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; fileId: string } }
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
        const file = await filesCollection.findOne({
            _id: new ObjectId(params.fileId),
            workspaceId: params.id,
        });

        if (!file) {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }

        // Delete from Supabase Storage
        const deleted = await deleteFile(file.storagePath);

        if (!deleted) {
            return NextResponse.json(
                { error: "Failed to delete file from storage" },
                { status: 500 }
            );
        }

        // Delete metadata from MongoDB
        await filesCollection.deleteOne({
            _id: new ObjectId(params.fileId),
        });

        return NextResponse.json({
            success: true,
            message: "File deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting file:", error);
        return NextResponse.json(
            { error: "Failed to delete file" },
            { status: 500 }
        );
    }
}

// GET - Get file details/download URL
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; fileId: string } }
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
        const file = await filesCollection.findOne({
            _id: new ObjectId(params.fileId),
            workspaceId: params.id,
        });

        if (!file) {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            file: {
                id: file._id.toString(),
                name: file.name,
                type: file.type,
                size: file.size,
                folder: file.folder,
                storagePath: file.storagePath,
                url: file.url,
                uploadedBy: file.uploadedBy,
                uploadedAt: file.uploadedAt,
            },
        });
    } catch (error) {
        console.error("Error fetching file:", error);
        return NextResponse.json(
            { error: "Failed to fetch file" },
            { status: 500 }
        );
    }
}
