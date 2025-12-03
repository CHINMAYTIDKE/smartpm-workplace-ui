import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "";

if (!uri) {
    throw new Error("Please add your MongoDB URI to .env.local");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so the client is reused
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    // In production mode, create a new client
    client = new MongoClient(uri);
    clientPromise = client.connect();
}

export default clientPromise;

// Helper to get users collection
export async function getUsersCollection() {
    const db = await clientPromise.then(client => client.db("smartpm"));
    return db.collection("users");
}

// Helper to get workspaces collection
export async function getWorkspacesCollection() {
    const db = await clientPromise.then(client => client.db("smartpm"));
    return db.collection("workspaces");
}

export async function getProjectsCollection() {
    const db = await clientPromise.then(client => client.db("smartpm"));
    return db.collection("projects");
}

export async function getTasksCollection() {
    const db = await clientPromise.then(client => client.db("smartpm"));
    return db.collection("tasks");
}

export async function getFilesCollection() {
    const db = await clientPromise.then(client => client.db("smartpm"));
    return db.collection("files");
}

export async function getFoldersCollection() {
    const db = await clientPromise.then(client => client.db("smartpm"));
    return db.collection("folders");
}

export async function getAIConversationsCollection() {
    const db = await clientPromise.then(client => client.db("smartpm"));
    return db.collection("ai_conversations");
}

export async function getAIActionsCollection() {
    const db = await clientPromise.then(client => client.db("smartpm"));
    return db.collection("ai_actions");
}

export async function getMeetingsCollection() {
    const db = await clientPromise.then(client => client.db("smartpm"));
    return db.collection("meetings");
}
