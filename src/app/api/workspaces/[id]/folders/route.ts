import { NextRequest, NextResponse } from "next/server";
import { getWorkspacesCollection, getFoldersCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Fetch all folders for a workspace
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

        const foldersCollection = await getFoldersCollection();
        const folders = await foldersCollection
            .find({ workspaceId: params.id })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({
            folders: folders.map((folder) => ({
                id: folder._id.toString(),
                name: folder.name,
                createdBy: folder.createdBy,
                createdAt: folder.createdAt,
                count: folder.count || 0,
            })),
        });
    } catch (error) {
        console.error("Error fetching folders:", error);
        return NextResponse.json(
            { error: "Failed to fetch folders" },
            { status: 500 }
        );
    }
}

// POST - Create new folder
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

        const body = await request.json();
        const { name } = body;

        if (!name || name.trim() === "") {
            return NextResponse.json(
                { error: "Folder name is required" },
                { status: 400 }
            );
        }

        const foldersCollection = await getFoldersCollection();

        // Check if folder already exists
        const existingFolder = await foldersCollection.findOne({
            workspaceId: params.id,
            name: name.trim(),
        });

        if (existingFolder) {
            return NextResponse.json(
                { error: "Folder with this name already exists" },
                { status: 409 }
            );
        }

        const folderData = {
            workspaceId: params.id,
            name: name.trim(),
            createdBy: firebaseUid,
            createdAt: new Date(),
            count: 0,
        };

        const result = await foldersCollection.insertOne(folderData);

        return NextResponse.json({
            success: true,
            folder: {
                id: result.insertedId.toString(),
                ...folderData,
            },
        });
    } catch (error) {
        console.error("Error creating folder:", error);
        return NextResponse.json(
            { error: "Failed to create folder" },
            { status: 500 }
        );
    }
}
