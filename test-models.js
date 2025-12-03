const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

// Access API key from .env.local (simulated)
// I need to read the .env.local file to get the key, or just hardcode it for the test if I know it.
// I saw the key earlier in the conversation history.
// GOOGLE_AI_API_KEY=AIzaSyAbIVhhJPlA_sxkHj2unz7LLSQxeB5eUo0

const API_KEY = "AIzaSyAbIVhhJPlA_sxkHj2unz7LLSQxeB5eUo0";
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        console.log("Listing available models...");
        // Note: The SDK doesn't expose listModels directly on the main class in all versions.
        // Usually it's via a ModelService or similar.
        // But let's try to just use a known model and see if we can get a different error if we use a wildly wrong name.

        // Actually, let's try to just run a simple generation with the SDK directly to isolate it from my backend code.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        const response = await result.response;
        console.log("Success with gemini-1.5-flash:", response.text());

    } catch (error) {
        console.error("Error with gemini-1.5-flash:", error.message);

        try {
            console.log("Retrying with gemini-pro...");
            const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result2 = await model2.generateContent("Hello");
            const response2 = await result2.response;
            console.log("Success with gemini-pro:", response2.text());
        } catch (error2) {
            console.error("Error with gemini-pro:", error2.message);
            fs.writeFileSync('model_error.log', `Flash Error: ${error.message}\nPro Error: ${error2.message}`);
        }
    }
}

listModels();
