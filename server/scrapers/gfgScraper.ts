import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import 'dotenv/config';
import os from 'os';

export interface GFGProfile {
  username: string;
  totalScore: number;
  problemsSolved: number;
  contestRating: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  recentActivity: {
    title: string;
    difficulty: string | null;
    timestamp: string;
    status: string;
  }[];
}

export class GFGScraper {
  async scrapeProfile(username: string): Promise<GFGProfile | null> {
    let browser;
    try {
      console.log(`Starting GFG scrape for: ${username}`);
      const isLocalDev = process.env.NODE_ENV !== "production";

const isProd = process.env.NODE_ENV === "production";

browser = await puppeteer.launch({
  headless: true,
  executablePath: isProd ? puppeteer.executablePath() : undefined,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage"
  ]
});


      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      const profileUrl = `https://www.geeksforgeeks.org/user/${username}/`;
      await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

      try {
        await page.waitForSelector('.profile_pic', { timeout: 10000 });
      } catch (e) {
        console.log("⚠️ Could not find profile pic, checking if page loaded anyway...");
      }

      await page.evaluate(() => window.scrollTo(0, 500));

      const content = await page.content();
      const $ = cheerio.load(content);

      const pageTitle = $('title').text();
      if (pageTitle.includes("Error") || pageTitle.includes("Not Found")) {
        return null;
      }

      // --- FIXED COUNT LOGIC ---
      let problemsSolved = 0;
      let easy = 0, medium = 0, hard = 0;
      const fullText = $('body').text();

      // 1. Get Difficulty Breakdown first
      const easyMatch = fullText.match(/Easy\s*[:(]?\s*(\d+)/i);
      const medMatch = fullText.match(/Medium\s*[:(]?\s*(\d+)/i);
      const hardMatch = fullText.match(/Hard\s*[:(]?\s*(\d+)/i);

      if (easyMatch) easy = parseInt(easyMatch[1]);
      if (medMatch) medium = parseInt(medMatch[1]);
      if (hardMatch) hard = parseInt(hardMatch[1]);

      console.log(`GFG Breakdown -> E: ${easy}, M: ${medium}, H: ${hard}`);

      // 2. Try to find "Total" Text
      const solvedMatch = fullText.match(/Problems\s+Solved\s*:?\s*(\d+)/i);
      if (solvedMatch) {
        problemsSolved = parseInt(solvedMatch[1]);
      }

      // 3. THE FIX: If Total is 0 (regex failed) or less than Sum, use Sum
      const calculatedTotal = easy + medium + hard;
      if (problemsSolved === 0 || calculatedTotal > problemsSolved) {
        console.log(`Using calculated total (${calculatedTotal}) instead of scraped total (${problemsSolved})`);
        problemsSolved = calculatedTotal;
      }

      // Scrape Recent Activity
      const recentActivity: any[] = [];
      $('a[href*="/problems/"]').each((i, el) => {
        if (recentActivity.length >= 10) return;
        const title = $(el).text().trim();
        const href = $(el).attr('href');
        if (title && href && !title.includes("Solve Problem") && title.length > 3) {
          if (!recentActivity.find(r => r.title === title)) {
            recentActivity.push({
              title: title,
              difficulty: null,
              timestamp: new Date().toISOString(),
              status: 'Solved'
            });
          }
        }
      });

      return {
        username,
        totalScore: 0,
        // Use the calculated problemsSolved. 
        // Only fallback to list length if absolutely everything else failed (is 0)
        problemsSolved: problemsSolved || recentActivity.length,
        contestRating: 0,
        easySolved: easy,
        mediumSolved: medium,
        hardSolved: hard,
        recentActivity
      };

    } catch (error) {
      console.error('Error scraping GFG:', error);
      return null;
    } finally {
      if (browser) await browser.close();
    }
  }
}