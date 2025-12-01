import { ObjectId } from "mongodb";

export interface User {
    _id?: ObjectId;
    firebaseUid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
    createdAt: Date;
    lastLoginAt: Date;
    workspaces: ObjectId[];
}

export interface Workspace {
    _id?: ObjectId;
    name: string;
    description: string;
    ownerId: string; // Firebase UID
    members: WorkspaceMember[];
    inviteCode: string;
    createdAt: Date;
    updatedAt: Date;
    projectCount: number;
    lastActive: string | null;
}

export interface WorkspaceMember {
    userId: string; // Firebase UID
    role: "owner" | "admin" | "member";
    joinedAt: Date;
}
