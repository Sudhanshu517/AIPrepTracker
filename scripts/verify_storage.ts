import 'dotenv/config';
import { storage } from "../server/storage";
import { pool } from "../server/db";
import { users } from "@shared/schema";
import { db } from "../server/db";
import { eq } from "drizzle-orm";

async function verify() {
    console.log("Starting verification...");

    try {
        // 1. Test Connection
        console.log("Testing DB connection...");
        const client = await pool.connect();
        console.log("✅ DB Connection successful");
        client.release();

        // 2. Create Test User
        const testUserId = "test-verifier-user";
        console.log(`Creating test user: ${testUserId}`);
        const user = await storage.upsertUser({
            id: testUserId,
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
            profileImageUrl: "https://example.com/img.jpg"
        });
        console.log("✅ User created:", user.id);

        // 3. Create Test Problem
        console.log("Creating test problem...");
        const problem = await storage.createProblem(testUserId, {
            name: "Two Sum",
            platform: "LeetCode",
            category: "Array",
            difficulty: "Easy",
            url: "https://leetcode.com/problems/two-sum",
            tags: ["array", "hash-table"]
        });
        console.log("✅ Problem created:", problem.id, problem.name);

        // 4. Fetch Problems
        console.log("Fetching user problems...");
        const problems = await storage.getUserProblems(testUserId);
        console.log(`✅ Fetched ${problems.length} problems`);

        const savedProblem = problems.find(p => p.id === problem.id);
        if (savedProblem && savedProblem.name === "Two Sum") {
            console.log("✅ Verification Successful: Problem persisted and retrieved correctly.");
        } else {
            console.error("❌ Verification Failed: Could not find the created problem.");
        }

        // Cleanup (optional, but good for repeated tests)
        console.log("Cleaning up test data...");
        await storage.clearProblems(testUserId);
        await db.delete(users).where(eq(users.id, testUserId));
        console.log("✅ Cleanup complete");

    } catch (error) {
        console.error("❌ Verification Failed with error:", error);
    } finally {
        await pool.end();
    }
}

verify();
