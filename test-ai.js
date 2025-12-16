const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');

// Connection URL
const url = 'mongodb+srv://AI-TMP:Sarthak%40123@cluster0.alhvrq8.mongodb.net/?tls=true&tlsCertificateKeyFilePassword=Sarthak%40123';
const client = new MongoClient(url);

async function testAI() {
    try {
        await client.connect();
        console.log('Connected correctly to server');
        const db = client.db('smartpm');

        // Get a workspace
        const workspace = await db.collection('workspaces').findOne({});
        if (!workspace) {
            console.error("No workspace found");
            return;
        }
        console.log("Found workspace:", workspace._id.toString());

        const userId = "test-user-id-123";
        const workspaceId = workspace._id.toString();

        console.log("Testing AI Chat API...");

        const response = await fetch('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-firebase-uid': userId
            },
            body: JSON.stringify({
                workspaceId: workspaceId,
                message: "Hello, are you working?",
                conversationHistory: []
            })
        });

        console.log("Response status:", response.status);

        if (response.ok) {
            const data = await response.json();
            console.log("AI Response:", data);
        } else {
            const text = await response.text();
            console.error("Error response:", text);
            fs.writeFileSync('error.log', text);
        }

    } catch (err) {
        console.error(err.stack);
    } finally {
        await client.close();
    }
}

testAI();
