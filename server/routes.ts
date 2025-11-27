import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProblemSchema, insertPlatformCredentialSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";
import { scrapingService } from "./scrapers/scrapingService";
import { requireAuth, optionalAuth, type AuthenticatedRequest } from "./middleware/clerk";
import { normalizeCategory } from "@shared/categoryUtils";
import { generateAIRecommendations } from "./services/aiService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'InterviewPrep Tracker API is running' });
  });

  // Auth routes
  app.get('/api/auth/user', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        // Create user if doesn't exist
        const newUser = await storage.upsertUser({
          id: userId,
          email: req.user.emailAddresses[0]?.emailAddress || null,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          profileImageUrl: req.user.imageUrl,
        });
        return res.json(newUser);
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Problem routes
  app.get('/api/problems', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const problems = await storage.getUserProblems(userId);
      res.json(problems);
    } catch (error) {
      console.error("Error fetching problems:", error);
      res.status(500).json({ message: "Failed to fetch problems" });
    }
  });

  // ... (imports)

  // ... inside registerRoutes ...

  app.post('/api/problems', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const validation = insertProblemSchema.safeParse(req.body);

      if (!validation.success) {
        const validationError = fromError(validation.error);
        return res.status(400).json({
          message: "Validation failed",
          error: validationError.toString()
        });
      }

      const problemData = {
        ...validation.data,
        category: normalizeCategory(validation.data.category)
      };

      const problem = await storage.createProblem(userId, problemData);
      res.status(201).json(problem);
    } catch (error) {
      console.error("Error creating problem:", error);
      res.status(500).json({ message: "Failed to create problem" });
    }
  });

  // Stats route
  app.get('/api/stats', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const stats = await storage.getProblemStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Recent activity route
  app.get('/api/recent-activity', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const limit = parseInt(req.query.limit as string) || 10;
      const activity = await storage.getRecentActivity(userId, limit);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Recommendations route
  app.get('/api/recommendations', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const recommendations = await storage.getRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.post('/api/recommendations/generate-ai', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const stats = await storage.getProblemStats(userId);
      const recentActivity = await storage.getRecentActivity(userId, 5);

      const recommendations = await generateAIRecommendations(stats, recentActivity);

      if (recommendations.length > 0) {
        await storage.replaceRecommendations(userId, recommendations);
      }

      const updatedRecommendations = await storage.getRecommendations(userId);
      res.json(updatedRecommendations);
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      res.status(500).json({ message: "Failed to generate AI recommendations" });
    }
  });

  // Platform credentials routes
  app.post('/api/platform-credentials', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const validation = insertPlatformCredentialSchema.safeParse(req.body);

      if (!validation.success) {
        const validationError = fromError(validation.error);
        return res.status(400).json({
          message: "Validation failed",
          error: validationError.toString()
        });
      }

      const credential = await storage.savePlatformCredentials(userId, validation.data);
      res.status(201).json(credential);
    } catch (error) {
      console.error("Error saving platform credentials:", error);
      res.status(500).json({ message: "Failed to save platform credentials" });
    }
  });

  app.get('/api/platform-credentials', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const credentials = await storage.getUserPlatformCredentials(userId);
      res.json(credentials);
    } catch (error) {
      console.error("Error fetching platform credentials:", error);
      res.status(500).json({ message: "Failed to fetch platform credentials" });
    }
  });

  // Platform sync route
  app.post('/api/sync-platforms', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const { platforms } = req.body;

      if (!platforms || typeof platforms !== 'object') {
        return res.status(400).json({ message: "Invalid platforms data" });
      }

      const results = await scrapingService.syncUserData(userId, platforms);
      res.json(results);
    } catch (error) {
      console.error("Error syncing platforms:", error);
      res.status(500).json({ message: "Failed to sync platforms" });
    }
  });

  //Update difficulty route
  app.patch('/api/problems/:id/difficulty', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const problemId = Number(req.params.id);
      const { difficulty } = req.body;

      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        return res.status(400).json({ message: "Invalid difficulty" });
      }

      const updated = await storage.updateProblemDifficulty(problemId, userId, difficulty);
      res.json(updated);
    } catch (error) {
      console.error("Error updating difficulty:", error);
      res.status(500).json({ message: "Failed to update difficulty" });
    }
  });

  app.patch('/api/problems/:id/category', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const problemId = Number(req.params.id);
      const { category } = req.body;

      if (!category || typeof category !== 'string') {
        return res.status(400).json({ message: "Invalid category" });
      }

      const normalizedCategory = normalizeCategory(category);
      const updated = await storage.updateProblemCategory(problemId, userId, normalizedCategory);
      res.json(updated);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  // Delete routes
  app.delete('/api/problems/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const problemId = parseInt(req.params.id);

      console.log(`[API] Delete request for problem ${req.params.id} (parsed: ${problemId}) by user ${userId}`);

      if (isNaN(problemId)) {
        console.error(`[API] Invalid problem ID: ${req.params.id}`);
        return res.status(400).json({ message: "Invalid problem ID" });
      }

      await storage.deleteProblem(problemId, userId);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting problem:", error);
      res.status(500).json({ message: "Failed to delete problem" });
    }
  });

  app.delete('/api/problems/platform/:platform', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const { platform } = req.params;
      console.log(`[API] Delete platform request for ${platform} by user ${userId}`);
      await storage.deleteProblemsByPlatform(userId, platform);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting platform problems:", error);
      res.status(500).json({ message: "Failed to delete platform problems" });
    }
  });

  app.delete('/api/problems', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      console.log(`[API] Clear all problems request by user ${userId}`);
      await storage.clearProblems(userId);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error clearing problems:", error);
      res.status(500).json({ message: "Failed to clear problems" });
    }
  });

  //Export problems route
  app.get("/api/export/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      // 1. Check if user exists (Optional, but good practice)
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // 2. Get the problems using the ID from the URL
      const problems = await storage.getUserProblems(userId);

      const csv = [
        "id,name,platform,difficulty,category,url,solved",
        ...problems.map(p =>
          `${p.id},"${p.name}",${p.platform},${p.difficulty ?? ""},${p.category},"${p.url ?? ""}",${p.solved}`
        ),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=problems_${userId}.csv`);
      res.send(csv);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
