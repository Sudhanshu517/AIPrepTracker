import { generateAIRecommendations } from "../server/services/aiService";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });

async function testAI() {
    console.log("Testing AI Recommendations...");
    const key = process.env.GEMINI_API_KEY || "";
    console.log("API Key present:", !!key);
    console.log("API Key length:", key.length);
    console.log("API Key starts with:", key.substring(0, 2));
    console.log("API Key ends with:", key.substring(key.length - 2));
    console.log("API Key contains quotes:", key.includes('"') || key.includes("'"));
    console.log("API Key contains whitespace:", /\s/.test(key));

    const userStats = {
        total: 50,
        easy: 30,
        medium: 15,
        hard: 5,
        categoryStats: [
            { category: "array", count: 20 },
            { category: "string", count: 15 },
            { category: "tree", count: 10 }
        ]
    };

    const recentProblems = [
        { name: "Two Sum", difficulty: "easy", category: "array" },
        { name: "Reverse Linked List", difficulty: "easy", category: "linked-list" },
        { name: "3Sum", difficulty: "medium", category: "array" }
    ];

    try {
        const recommendations = await generateAIRecommendations(userStats, recentProblems);
        console.log("Recommendations received:", recommendations);
    } catch (error) {
        console.error("Test failed:", error);
    }

    // Raw Fetch Test
    console.log("\nTesting raw fetch...");
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;
        console.log("Fetching URL (masked):", url.replace(process.env.GEMINI_API_KEY || "", "HIDDEN_KEY"));
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "Hello, world!"
                    }]
                }]
            })
        });

        if (!response.ok) {
            console.error("Raw fetch failed:", response.status, response.statusText);
            const errorText = await response.text();
            console.error("Error details:", errorText);
        } else {
            const data = await response.json();
            console.log("Raw fetch success:", JSON.stringify(data, null, 2).substring(0, 200) + "...");
        }
    } catch (e) {
        console.error("Raw fetch error:", e);
    }
}

testAI();
