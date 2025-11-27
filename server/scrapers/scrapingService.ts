import { LeetCodeScraper } from './leetcodeScraper';
import { GFGScraper } from './gfgScraper';
import { TUFScraper } from './tufScraper';
import { storage } from '../storage';
import { type InsertProblem } from '@shared/schema';

export interface PlatformCredentials {
  leetcode?: string;
  gfg?: string;
  tuf?: string;
}

export class ScrapingService {
  private leetcodeScraper = new LeetCodeScraper();
  private gfgScraper = new GFGScraper();
  private tufScraper = new TUFScraper();

  async syncUserData(userId: string, credentials: PlatformCredentials): Promise<{
    success: boolean;
    message: string;
    synced: { platform: string; problems: number; totalSolved: number }[];
    errors: string[];
  }> {
    const synced: { platform: string; problems: number; totalSolved: number }[] = [];
    const errors: string[] = [];

    // 1. Get existing problems to prevent duplicates in the LIST
    const existingProblems = await storage.getUserProblems(userId);
    const existingSet = new Set(
      existingProblems.map(p => `${p.platform}-${p.name.toLowerCase().trim()}`)
    );

    // --- LEETCODE SYNC ---
    if (credentials.leetcode) {
      try {
        const lcData = await this.leetcodeScraper.scrapeProfile(credentials.leetcode);
        if (lcData) {
          // A. Save the LIST (The 11 recent ones)
          const addedCount = await this.syncProblems(userId, lcData.recentSubmissions, 'leetcode', existingSet);

          // B. SAVE THE STATS (The 74 total) <--- NEW STEP
          await storage.upsertPlatformStats(userId, {
            userId,
            platform: 'leetcode',
            totalSolved: lcData.totalSolved,
            easySolved: lcData.easySolved,
            mediumSolved: lcData.mediumSolved,
            hardSolved: lcData.hardSolved
          });

          synced.push({
            platform: 'LeetCode',
            problems: addedCount,
            totalSolved: lcData.totalSolved
          });
        } else {
          errors.push('LeetCode profile not found');
        }
      } catch (error) {
        errors.push(`LeetCode sync failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    // --- GFG SYNC ---
    if (credentials.gfg) {
      try {
        const gfgData = await this.gfgScraper.scrapeProfile(credentials.gfg);
        if (gfgData) {
          const addedCount = await this.syncProblems(userId, gfgData.recentActivity, 'gfg', existingSet);

          // B. SAVE THE STATS (The 2 total) <--- NEW STEP
          await storage.upsertPlatformStats(userId, {
            userId,
            platform: 'gfg',
            totalSolved: gfgData.problemsSolved,
            easySolved: gfgData.easySolved,
            mediumSolved: gfgData.mediumSolved,
            hardSolved: gfgData.hardSolved
          });

          synced.push({
            platform: 'GeeksforGeeks',
            problems: addedCount,
            totalSolved: gfgData.problemsSolved
          });
        } else {
          errors.push('GFG profile not found');
        }
      } catch (error) {
        errors.push(`GFG sync failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    if (credentials.tuf) {
      try {
        const tufData = await this.tufScraper.scrapeProfile(credentials.tuf);

        if (tufData) {
          // We don't have a list of recent problems for TUF (public profile doesn't show dates)
          // So we only update the STATS table.

          await storage.upsertPlatformStats(userId, {
            userId,
            platform: 'tuf', // Platform ID
            totalSolved: tufData.totalSolved,
            easySolved: tufData.easySolved,
            mediumSolved: tufData.mediumSolved,
            hardSolved: tufData.hardSolved
          });

          synced.push({
            platform: 'TUF+',
            problems: 0, // No individual problems added to list
            totalSolved: tufData.totalSolved
          });
        } else {
          errors.push('TUF+ profile not found');
        }
      } catch (error) {
        errors.push(`TUF+ sync failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }



    const totalNew = synced.reduce((sum, item) => sum + item.problems, 0);

    return {
      success: synced.length > 0,
      message: `Sync Complete. Added ${totalNew} new problems to list.`,
      synced,
      errors
    };
  }

  // Helper to save problems without duplicates
  private async syncProblems(
    userId: string,
    activities: any[],
    platform: string,
    existingSet: Set<string>
  ): Promise<number> {
    let addedCount = 0;
    for (const activity of activities) {
      const status = activity.status?.toLowerCase() || '';
      if (status === 'solved' || status === 'accepted' || status === 'ac') {
        const cleanName = activity.title.trim();
        const uniqueKey = `${platform}-${cleanName.toLowerCase()}`;

        if (existingSet.has(uniqueKey)) continue;

        try {
          const problem: InsertProblem = {
            name: cleanName,
            platform: platform,
            difficulty: activity.difficulty ? activity.difficulty.toLowerCase() : null,
            category: null,
            tags: [],
            url: this.generateUrl(platform, cleanName)
          };
          await storage.createProblem(userId, problem);
          existingSet.add(uniqueKey);
          addedCount++;
        } catch (error) {
          console.log(`Error saving problem ${cleanName}:`, error);
        }
      }
    }
    return addedCount;
  }

  private generateUrl(platform: string, name: string): string {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (platform === 'leetcode') return `https://leetcode.com/problems/${slug}/`;
    if (platform === 'gfg') return `https://practice.geeksforgeeks.org/problems/${slug}/`;
    return '';
  }
}

export const scrapingService = new ScrapingService();