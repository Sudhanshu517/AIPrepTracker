import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
// Note: The API key should be in the .env file as GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface ProblemRecommendation {
    problemName: string;
    platform: "leetcode" | "gfg" | "tuf";
    difficulty: "easy" | "medium" | "hard";
    category: string;
    reason: string;
}

export async function generateAIRecommendations(
    userStats: any,
    recentProblems: any[]
): Promise<ProblemRecommendation[]> {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not set. AI recommendations will not work.");
        return [];
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      You are an expert coding interview coach. Based on the user's stats and recent activity, recommend 5 problems to solve next.
      
      User Stats:
      ${JSON.stringify(userStats, null, 2)}
      
      Recent Activity:
      ${JSON.stringify(recentProblems, null, 2)}
      
      Return the response ONLY as a JSON array of objects with this structure:
      [
        {
          "problemName": "string",
          "platform": "leetcode" | "gfg" | "tuf",
          "difficulty": "easy" | "medium" | "hard",
          "category": "string",
          "reason": "string (short explanation why this is recommended)",
          "url": "string",
          "score": "number"(between 0 and 100),
        }
      ]
      
      Do not include markdown formatting or code blocks. Just the raw JSON array.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        try {
            // Clean up the response if it contains markdown code blocks
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const recommendations = JSON.parse(cleanText) as ProblemRecommendation[];
            return recommendations;
        } catch (e) {
            console.error("Failed to parse AI response:", e);
            return [];
        }
    } catch (error) {
        console.error("Error generating recommendations:", error);
        return [];
    }
}


// server/services/aiService.ts
// import { GoogleGenerativeAI } from "@google/generative-ai";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// export interface ProblemRecommendation {
//   problemName: string;
//   platform: "leetcode" | "gfg" | "tuf";
//   difficulty: "easy" | "medium" | "hard";
//   category: string;
//   reason: string;
// }

// export async function generateAIRecommendations(
//   userStats: any,
//   recentProblems: any[]
// ): Promise<ProblemRecommendation[]> {
//   if (!process.env.GEMINI_API_KEY) {
//     console.warn("GEMINI_API_KEY is not set.");
//     return [];
//   }

//   try {
//     // FIX: Updated model to 'gemini-2.5-flash'
//     const model = genAI.getGenerativeModel({ 
//         model: "gemini-2.5-flash",
//         // Optional: Set strict JSON mode for more reliable parsing
//         generationConfig: { responseMimeType: "application/json" } 
//     });

//     const prompt = `
//       You are an expert coding interview coach.
      
//       User Stats:
//       ${JSON.stringify(userStats)}
      
//       Recent Activity:
//       ${JSON.stringify(recentProblems)}
      
//       Recommend 5 problems to solve next.
//       Return ONLY a JSON array with this structure (no markdown):
//       [
//         {
//           "problemName": "string",
//           "platform": "leetcode" | "gfg" | "tuf",
//           "difficulty": "easy" | "medium" | "hard",
//           "category": "string",
//           "reason": "string"
//         }
//       ]
//     `;

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();
//     console.log(text);

//     // Cleaning logic remains useful even with JSON mode
//     const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
//     return JSON.parse(cleanText) as ProblemRecommendation[];

//   } catch (error) {
//     console.error("AI Error:", error);
//     // Fallback: Return empty array so the app doesn't crash
//     return [];
//   }
// }