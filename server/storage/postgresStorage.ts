import { IStorage } from "../storage";
import { db } from "../db";
import {
    users,
    problems,
    recommendations,
    platformCredentials,
    platformStats,
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
import { eq, desc, and } from "drizzle-orm";

export class PostgresStorage implements IStorage {
    constructor(private dbInstance: typeof db) { }

    async getUser(id: string): Promise<User | undefined> {
        return await this.dbInstance.query.users.findFirst({
            where: eq(users.id, id),
        });
    }

    async upsertUser(user: UpsertUser): Promise<User> {
        const [result] = await this.dbInstance
            .insert(users)
            .values(user)
            .onConflictDoUpdate({
                target: users.id,
                set: {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    profileImageUrl: user.profileImageUrl,
                    updatedAt: new Date(),
                },
            })
            .returning();
        return result;
    }

    async createProblem(userId: string, problem: InsertProblem): Promise<Problem> {
        const [result] = await this.dbInstance
            .insert(problems)
            .values({ ...problem, userId })
            .returning();

        // Update platform stats
        const platform = problem.platform;
        const difficulty = problem.difficulty?.toLowerCase() || 'medium'; // Default to medium if null

        const existingStats = await this.dbInstance.query.platformStats.findFirst({
            where: and(
                eq(platformStats.userId, userId),
                eq(platformStats.platform, platform)
            )
        });

        const isEasy = difficulty === 'easy';
        const isMedium = difficulty === 'medium';
        const isHard = difficulty === 'hard';

        if (existingStats) {
            await this.dbInstance
                .update(platformStats)
                .set({
                    totalSolved: (existingStats.totalSolved || 0) + 1,
                    easySolved: (existingStats.easySolved || 0) + (isEasy ? 1 : 0),
                    mediumSolved: (existingStats.mediumSolved || 0) + (isMedium ? 1 : 0),
                    hardSolved: (existingStats.hardSolved || 0) + (isHard ? 1 : 0),
                    lastUpdated: new Date()
                })
                .where(eq(platformStats.id, existingStats.id));
        } else {
            await this.dbInstance.insert(platformStats).values({
                userId,
                platform,
                totalSolved: 1,
                easySolved: isEasy ? 1 : 0,
                mediumSolved: isMedium ? 1 : 0,
                hardSolved: isHard ? 1 : 0,
                lastUpdated: new Date()
            });
        }

        return result;
    }

    async getUserProblems(userId: string): Promise<Problem[]> {
        return await this.dbInstance.query.problems.findMany({
            where: eq(problems.userId, userId),
            orderBy: desc(problems.createdAt),
        });
    }

    async updateProblemDifficulty(problemId: number, userId: string, difficulty: string): Promise<Problem | undefined> {
        const [updated] = await this.dbInstance
            .update(problems)
            .set({ difficulty })
            .where(and(eq(problems.id, problemId), eq(problems.userId, userId)))
            .returning();
        return updated;
    }

    async updateProblemCategory(problemId: number, userId: string, category: string): Promise<Problem | undefined> {
        const [updated] = await this.dbInstance
            .update(problems)
            .set({ category })
            .where(and(eq(problems.id, problemId), eq(problems.userId, userId)))
            .returning();
        return updated;
    }

    async upsertPlatformStats(userId: string, stats: InsertPlatformStats): Promise<void> {
        const existing = await this.dbInstance.query.platformStats.findFirst({
            where: and(
                eq(platformStats.userId, userId),
                eq(platformStats.platform, stats.platform)
            )
        });

        if (existing) {
            await this.dbInstance
                .update(platformStats)
                .set({ ...stats, lastUpdated: new Date() })
                .where(eq(platformStats.id, existing.id));
        } else {
            await this.dbInstance.insert(platformStats).values({ ...stats, userId });
        }
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
        // 1. Get stats strictly from platformStats table
        const storedStats = await this.dbInstance.query.platformStats.findMany({
            where: eq(platformStats.userId, userId)
        });

        let total = 0;
        let easy = 0;
        let medium = 0;
        let hard = 0;

        const pStats = storedStats.map(stat => {
            const t = stat.totalSolved || 0;
            const e = stat.easySolved || 0;
            const m = stat.mediumSolved || 0;
            const h = stat.hardSolved || 0;

            total += t;
            easy += e;
            medium += m;
            hard += h;

            return {
                platform: stat.platform,
                count: t,
                easy: e,
                medium: m,
                hard: h
            };
        });

        // 2. Calculate category stats from problems table (Recent Activity)
        // This is the ONLY thing we use the problems table for in stats
        const userProblems = await this.getUserProblems(userId);
        const categoryCounts = new Map<string, number>();

        userProblems.forEach(p => {
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
            platformStats: pStats,
            categoryStats,
        };
    }

    async getRecentActivity(userId: string, limit = 10): Promise<Problem[]> {
        return await this.dbInstance.query.problems.findMany({
            where: eq(problems.userId, userId),
            orderBy: desc(problems.createdAt),
            limit: limit
        });
    }

    async getRecommendations(userId: string): Promise<Recommendation[]> {
        return await this.dbInstance.query.recommendations.findMany({
            where: eq(recommendations.userId, userId)
        });
    }

    async generateRecommendations(userId: string): Promise<void> {
        // Deprecated
    }

    async replaceRecommendations(userId: string, recommendationsData: InsertRecommendation[]): Promise<void> {
        await this.dbInstance.delete(recommendations).where(eq(recommendations.userId, userId));

        if (recommendationsData.length > 0) {
            await this.dbInstance.insert(recommendations).values(recommendationsData.map(r => ({
                ...r,
                userId,
                createdAt: new Date(),
            })));
        }
    }

    private getAverageDifficulty(problems: Problem[]): string {
        if (problems.length === 0) return 'Easy';

        const difficultyScores: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
        const totalScore = problems.reduce((sum, p) => sum + (difficultyScores[p.difficulty as string] || 1), 0);
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
        const existing = await this.dbInstance.query.platformCredentials.findFirst({
            where: and(
                eq(platformCredentials.userId, userId),
                eq(platformCredentials.platform, credentials.platform)
            )
        });

        if (existing) {
            const [updated] = await this.dbInstance
                .update(platformCredentials)
                .set({ ...credentials, updatedAt: new Date() })
                .where(eq(platformCredentials.id, existing.id))
                .returning();
            return updated;
        } else {
            const [inserted] = await this.dbInstance
                .insert(platformCredentials)
                .values({ ...credentials, userId })
                .returning();
            return inserted;
        }
    }

    async getUserPlatformCredentials(userId: string): Promise<PlatformCredential[]> {
        return await this.dbInstance.query.platformCredentials.findMany({
            where: eq(platformCredentials.userId, userId)
        });
    }

    async updateLastSyncTime(userId: string, platform: string): Promise<void> {
        await this.dbInstance
            .update(platformCredentials)
            .set({ lastSyncAt: new Date(), updatedAt: new Date() })
            .where(and(
                eq(platformCredentials.userId, userId),
                eq(platformCredentials.platform, platform)
            ));
    }

    async clearProblems(userId: string): Promise<void> {
        console.log(`[PostgresStorage] Clearing problems for user ${userId}`);
        const res1 = await this.dbInstance.delete(problems).where(eq(problems.userId, userId)).returning();
        console.log(`[PostgresStorage] Deleted ${res1.length} problems`);
        await this.dbInstance.delete(platformStats).where(eq(platformStats.userId, userId));
        await this.dbInstance.delete(recommendations).where(eq(recommendations.userId, userId));
    }

    async deleteProblem(id: number, userId: string): Promise<void> {
        console.log(`[PostgresStorage] Deleting problem ${id} for user ${userId}`);

        // 1. Get the problem first to know its platform and difficulty
        const problem = await this.dbInstance.query.problems.findFirst({
            where: and(eq(problems.id, id), eq(problems.userId, userId))
        });

        if (!problem) {
            console.log(`[PostgresStorage] Problem ${id} not found`);
            return;
        }

        // 2. Delete the problem
        const res = await this.dbInstance
            .delete(problems)
            .where(and(eq(problems.id, id), eq(problems.userId, userId)))
            .returning();
        console.log(`[PostgresStorage] Deleted problem result:`, res);

        // 3. Update platform stats (decrement)
        const platform = problem.platform;
        const difficulty = problem.difficulty?.toLowerCase() || 'medium';

        const existingStats = await this.dbInstance.query.platformStats.findFirst({
            where: and(
                eq(platformStats.userId, userId),
                eq(platformStats.platform, platform)
            )
        });

        if (existingStats) {
            const isEasy = difficulty === 'easy';
            const isMedium = difficulty === 'medium';
            const isHard = difficulty === 'hard';

            await this.dbInstance
                .update(platformStats)
                .set({
                    totalSolved: Math.max(0, (existingStats.totalSolved || 0) - 1),
                    easySolved: Math.max(0, (existingStats.easySolved || 0) - (isEasy ? 1 : 0)),
                    mediumSolved: Math.max(0, (existingStats.mediumSolved || 0) - (isMedium ? 1 : 0)),
                    hardSolved: Math.max(0, (existingStats.hardSolved || 0) - (isHard ? 1 : 0)),
                    lastUpdated: new Date()
                })
                .where(eq(platformStats.id, existingStats.id));
        }
    }

    async deleteProblemsByPlatform(userId: string, platform: string): Promise<void> {
        console.log(`[PostgresStorage] Deleting problems for user ${userId} and platform ${platform}`);
        // Delete manual problems
        const res1 = await this.dbInstance
            .delete(problems)
            .where(and(eq(problems.userId, userId), eq(problems.platform, platform)))
            .returning();
        console.log(`[PostgresStorage] Deleted ${res1.length} problems`);

        // Delete platform stats (scraped data)
        await this.dbInstance
            .delete(platformStats)
            .where(and(eq(platformStats.userId, userId), eq(platformStats.platform, platform)));
    }
}
