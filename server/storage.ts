import {
  type User,
  type UpsertUser,
  type Problem,
  type InsertProblem,
  type Recommendation,
  type InsertRecommendation,
  type PlatformCredential,
  type InsertPlatformCredential,
  type InsertPlatformStats,
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations (for Clerk Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;



  // Problem operations
  createProblem(userId: string, problem: InsertProblem): Promise<Problem>;
  getUserProblems(userId: string): Promise<Problem[]>;
  updateProblemDifficulty(problemId: number, userId: string, difficulty: string): Promise<Problem | undefined>;
  updateProblemCategory(problemId: number, userId: string, category: string): Promise<Problem | undefined>;
  upsertPlatformStats(userId: string, stats: InsertPlatformStats): Promise<void>;

  getProblemStats(userId: string): Promise<{
    total: number;
    easy: number;
    medium: number;
    hard: number;
    platformStats: { platform: string; count: number }[];
    categoryStats: { category: string; count: number }[];
  }>;
  getRecentActivity(userId: string, limit?: number): Promise<Problem[]>;

  // Recommendation operations
  getRecommendations(userId: string): Promise<Recommendation[]>;
  generateRecommendations(userId: string): Promise<void>;
  replaceRecommendations(userId: string, recommendations: InsertRecommendation[]): Promise<void>;

  // Platform credentials operations
  savePlatformCredentials(userId: string, credentials: InsertPlatformCredential): Promise<PlatformCredential>;
  getUserPlatformCredentials(userId: string): Promise<PlatformCredential[]>;
  updateLastSyncTime(userId: string, platform: string): Promise<void>;

  // Debug operations
  clearProblems(userId: string): Promise<void>;
  deleteProblem(id: number, userId: string): Promise<void>;
  deleteProblemsByPlatform(userId: string, platform: string): Promise<void>;
  deletePlatformCredential(id: number, userId: string): Promise<void>;
}

// Memory-based storage implementation
export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private problems: Map<string, Problem[]> = new Map();
  private recommendations: Map<string, Recommendation[]> = new Map();
  private platformCredentials: Map<string, PlatformCredential[]> = new Map();
  private platformStats: Map<string, InsertPlatformStats[]> = new Map();
  private nextId = 1;

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }



  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    const user: User = {
      id: userData.id,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  async createProblem(userId: string, problem: InsertProblem): Promise<Problem> {
    const newProblem: Problem = {
      id: this.nextId++,
      name: problem.name,
      platform: problem.platform,
      difficulty: problem.difficulty ?? null,
      category: problem.category ?? null,
      tags: problem.tags ?? null,
      url: problem.url ?? null,
      solved: new Date(),
      userId,
      createdAt: new Date(),
    };

    const userProblems = this.problems.get(userId) || [];
    userProblems.push(newProblem);
    this.problems.set(userId, userProblems);

    return newProblem;
  }

  async updateProblemDifficulty(problemId: number, userId: string, difficulty: string): Promise<Problem | undefined> {
    const userProblems = this.problems.get(userId);
    if (!userProblems) return undefined;

    const problem = userProblems.find(p => p.id === problemId);
    if (!problem) return undefined;

    problem.difficulty = difficulty;
    return problem;
  }

  async updateProblemCategory(problemId: number, userId: string, category: string): Promise<Problem | undefined> {
    const userProblems = this.problems.get(userId);
    if (!userProblems) return undefined;

    const problem = userProblems.find(p => p.id === problemId);
    if (!problem) return undefined;

    problem.category = category;
    return problem;
  }

  async getUserProblems(userId: string): Promise<Problem[]> {
    return this.problems.get(userId) || [];
  }




  // <--- NEW METHOD IMPLEMENTATION
  async upsertPlatformStats(userId: string, stats: InsertPlatformStats): Promise<void> {
    const userStats = this.platformStats.get(userId) || [];

    // Remove existing stats for this specific platform (e.g., remove old 'leetcode' stats)
    const filteredStats = userStats.filter(s => s.platform !== stats.platform);

    // Add the new updated stats
    filteredStats.push(stats);

    // Save back to map
    this.platformStats.set(userId, filteredStats);
  }


  async getProblemStats(userId: string): Promise<{
    total: number;
    easy: number;
    medium: number;
    hard: number;
    platformStats: {
      platform: string;
      count: number;
      easy: number;
      medium: number;
      hard: number;
    }[];
    categoryStats: { category: string; count: number }[];
  }> {
    // 1. Get the stored "Big Numbers" (from the Scraper)
    const storedStats = this.platformStats.get(userId) || [];

    let total = 0;
    let easy = 0;
    let medium = 0;
    let hard = 0;

    // Sum up the scraper data (e.g., 74 LeetCode + 2 GFG)
    const platformMap = new Map<string, { total: number, easy: number, medium: number, hard: number }>();
    const scrapedPlatforms = new Set<string>();

    storedStats.forEach(stat => {
      const t = stat.totalSolved || 0;
      const e = stat.easySolved || 0;
      const m = stat.mediumSolved || 0;
      const h = stat.hardSolved || 0;

      total += t;
      easy += e;
      medium += m;
      hard += h;

      platformMap.set(stat.platform, {
        total: (platformMap.get(stat.platform)?.total || 0) + t,
        easy: (platformMap.get(stat.platform)?.easy || 0) + e,
        medium: (platformMap.get(stat.platform)?.medium || 0) + m,
        hard: (platformMap.get(stat.platform)?.hard || 0) + h
      });
      scrapedPlatforms.add(stat.platform);
    });

    // 2. Also check the "Manually Added" problems list
    const problems = await this.getUserProblems(userId);

    // 3. Add manual problems to the totals and platform counts
    // CRITICAL FIX: Only add if the platform is NOT already accounted for by the scraper
    problems.forEach(p => {
      // If we already have scraped stats for this platform, skip adding individual problems to the total
      // to avoid double counting.
      if (scrapedPlatforms.has(p.platform)) {
        return;
      }

      total++;

      const diff = p.difficulty?.toLowerCase();
      let isEasy = false, isMedium = false, isHard = false;

      if (diff === 'easy') { easy++; isEasy = true; }
      else if (diff === 'medium') { medium++; isMedium = true; }
      else if (diff === 'hard') { hard++; isHard = true; }

      const current = platformMap.get(p.platform) || { total: 0, easy: 0, medium: 0, hard: 0 };
      platformMap.set(p.platform, {
        total: current.total + 1,
        easy: current.easy + (isEasy ? 1 : 0),
        medium: current.medium + (isMedium ? 1 : 0),
        hard: current.hard + (isHard ? 1 : 0)
      });
    });

    // 4. Calculate breakdown for charts
    const platformStats = Array.from(platformMap.entries()).map(([platform, stats]) => ({
      platform,
      count: stats.total,
      easy: stats.easy,
      medium: stats.medium,
      hard: stats.hard
    }));

    // 5. Calculate category stats (We still rely on the list for this, as scrapers don't give category summaries easily)
    const categoryCounts = new Map<string, number>();
    problems.forEach(p => {
      if (p.category) {
        const count = categoryCounts.get(p.category) || 0;
        categoryCounts.set(p.category, count + 1);
      }
    });

    const categoryStats = Array.from(categoryCounts.entries()).map(([category, count]) => ({
      category,
      count,
    }));

    return {
      total,
      easy,
      medium,
      hard,
      platformStats,
      categoryStats,
    };
  }

  async getRecentActivity(userId: string, limit = 10): Promise<Problem[]> {
    const problems = await this.getUserProblems(userId);
    return problems
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }

  async getRecommendations(userId: string): Promise<Recommendation[]> {
    return this.recommendations.get(userId) || [];
  }

  async generateRecommendations(userId: string): Promise<void> {
    // Deprecated in favor of AI recommendations
  }

  async replaceRecommendations(userId: string, recommendations: InsertRecommendation[]): Promise<void> {
    const newRecommendations: Recommendation[] = recommendations.map(r => ({
      ...r,
      id: this.nextId++,
      userId,
      difficulty: r.difficulty || null,
      reason: r.reason || null,
      url: r.url || null,
      score: r.score || 0,
      createdAt: new Date(),
    }));
    this.recommendations.set(userId, newRecommendations);
  }

  private getAverageDifficulty(problems: Problem[]): string {
    if (problems.length === 0) return 'Easy';

    const difficultyScores = { Easy: 1, Medium: 2, Hard: 3 };
    const totalScore = problems.reduce((sum, p) => sum + (difficultyScores[p.difficulty as keyof typeof difficultyScores] || 1), 0);
    const avgScore = totalScore / problems.length;

    if (avgScore <= 1.5) return 'Easy';
    if (avgScore <= 2.5) return 'Medium';
    return 'Hard';
  }

  private getNextDifficulty(currentAvg: string): string {
    switch (currentAvg) {
      case 'Easy': return 'Medium';
      case 'Medium': return 'Hard';
      case 'Hard': return 'Hard';
      default: return 'Easy';
    }
  }

  private selectPlatform(userProblems: Problem[]): string {
    const platforms = ['LeetCode', 'GeeksforGeeks', 'TUF+'];
    if (userProblems.length === 0) return platforms[0];

    // Return the most used platform
    const platformCounts = new Map<string, number>();
    userProblems.forEach(p => {
      const count = platformCounts.get(p.platform) || 0;
      platformCounts.set(p.platform, count + 1);
    });

    let mostUsed = platforms[0];
    let maxCount = 0;
    platformCounts.forEach((count, platform) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = platform;
      }
    });

    return mostUsed;
  }

  async savePlatformCredentials(userId: string, credentials: InsertPlatformCredential): Promise<PlatformCredential> {
    const newCredential: PlatformCredential = {
      ...credentials,
      id: this.nextId++,
      userId,
      lastSyncAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userCredentials = this.platformCredentials.get(userId) || [];

    // Remove existing credential for the same platform
    const filteredCredentials = userCredentials.filter(c => c.platform !== credentials.platform);
    filteredCredentials.push(newCredential);

    this.platformCredentials.set(userId, filteredCredentials);
    return newCredential;
  }

  async getUserPlatformCredentials(userId: string): Promise<PlatformCredential[]> {
    return this.platformCredentials.get(userId) || [];
  }

  async updateLastSyncTime(userId: string, platform: string): Promise<void> {
    const credentials = this.platformCredentials.get(userId) || [];
    const credential = credentials.find(c => c.platform === platform);

    if (credential) {
      credential.lastSyncAt = new Date();
      credential.updatedAt = new Date();
    }
  }

  async clearProblems(userId: string): Promise<void> {
    this.problems.set(userId, []);
    this.platformStats.set(userId, []);
    // Also clear recommendations as they might be based on old data
    this.recommendations.set(userId, []);
  }

  async deleteProblem(id: number, userId: string): Promise<void> {
    const userProblems = this.problems.get(userId) || [];
    const updatedProblems = userProblems.filter(p => p.id !== id);
    this.problems.set(userId, updatedProblems);
  }

  async deleteProblemsByPlatform(userId: string, platform: string): Promise<void> {
    const userProblems = this.problems.get(userId) || [];
    const updatedProblems = userProblems.filter(p => p.platform !== platform);
    this.problems.set(userId, updatedProblems);

    // Also remove stats for this platform
    const userStats = this.platformStats.get(userId) || [];
    const updatedStats = userStats.filter(s => s.platform !== platform);
    this.platformStats.set(userId, updatedStats);
  }

  async deletePlatformCredential(id: number, userId: string): Promise<void> {
    const credentials = this.platformCredentials.get(userId) || [];
    const updatedCredentials = credentials.filter(c => c.id !== id);
    this.platformCredentials.set(userId, updatedCredentials);
  }
}


import { PostgresStorage } from "./storage/postgresStorage";
import { db } from "./db";

export const storage = new PostgresStorage(db);