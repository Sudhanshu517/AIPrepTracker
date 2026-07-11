import puppeteer from 'puppeteer';

export interface TUFProfile {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  recentActivity: any[];
}

// ---------------------------------------------------------------------------
// Browser-side scraping logic stored as a plain JavaScript string.
// This avoids esbuild injecting __name() into page.evaluate().
// ---------------------------------------------------------------------------
const TUF_SCRAPE_FN = `
(function () {
  var result = { total: 0, easy: 0, medium: 0, hard: 0 };

  var parseDifficulty = function (label) {
    var allSpans = Array.from(document.querySelectorAll('span'));

    for (var i = 0; i < allSpans.length; i++) {
      var span = allSpans[i];

      if (span.textContent && span.textContent.trim() === label) {

        // First check next siblings
        var sibling = span.nextElementSibling;

        while (sibling) {
          var txt = sibling.textContent ? sibling.textContent.trim() : '';
          var m = txt.match(/^(\\d+)\\s*\\/\\s*\\d+$/);

          if (m) {
            return parseInt(m[1], 10);
          }

          sibling = sibling.nextElementSibling;
        }

        // Fallback: inspect parent children
        var parent = span.parentElement;

        if (parent) {
          var children = Array.from(parent.children);

          for (var j = 0; j < children.length; j++) {
            var ctxt = children[j].textContent
              ? children[j].textContent.trim()
              : '';

            var cm = ctxt.match(/^(\\d+)\\s*\\/\\s*\\d+$/);

            if (cm) {
              return parseInt(cm[1], 10);
            }
          }
        }
      }
    }

    return 0;
  };

  result.easy = parseDifficulty('Easy');
  result.medium = parseDifficulty('Medium');
  result.hard = parseDifficulty('Hard');
  result.total = result.easy + result.medium + result.hard;

  return result;
})()
`;

export class TUFScraper {
  async scrapeProfile(username: string): Promise<TUFProfile | null> {
    let browser;

    try {
      console.log(`[TUF] Starting scrape for: ${username}`);

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

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      );

      await page.setViewport({
        width: 1280,
        height: 800,
      });

      const profileUrl = `https://takeuforward.org/profile/${username}`;
      console.log(`[TUF] Navigating to ${profileUrl}`);

      await page.goto(profileUrl, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      try {
        await page.waitForFunction(
          `Array.from(document.querySelectorAll('span')).some(function(s){
            return s.textContent && s.textContent.trim() === 'Easy';
          })`,
          { timeout: 15000 }
        );
      } catch {
        console.warn("[TUF] Timeout waiting for stats to render.");
      }

      // Allow React to finish rendering Medium/Hard
      await new Promise((r) => setTimeout(r, 1500));

      const stats = await page.evaluate(TUF_SCRAPE_FN) as {
        total: number;
        easy: number;
        medium: number;
        hard: number;
      };

      console.log(
        `[TUF] ✅ Easy=${stats.easy}, Medium=${stats.medium}, Hard=${stats.hard}, Total=${stats.total}`
      );

      if (
        stats.easy === 0 &&
        stats.medium === 0 &&
        stats.hard === 0
      ) {
        console.warn(`[TUF] No stats found for "${username}"`);
        return null;
      }

      return {
        username,
        totalSolved: stats.total,
        easySolved: stats.easy,
        mediumSolved: stats.medium,
        hardSolved: stats.hard,
        recentActivity: [],
      };

    } catch (error) {
      console.error("[TUF] Scrape failed:", error);
      return null;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}






// import puppeteer from 'puppeteer';
// import os from 'os';

// export interface TUFProfile {
//   username: string;
//   totalSolved: number;
//   easySolved: number;
//   mediumSolved: number;
//   hardSolved: number;
//   recentActivity: any[];
// }

// export class TUFScraper {
//   async scrapeProfile(username: string): Promise<TUFProfile | null> {
//     let browser;
//     try {
//       console.log(`Starting TUF+ scrape for: ${username}`);
//       const isProd = process.env.NODE_ENV === "production";

//       browser = await puppeteer.launch({
//         headless: true,
//         executablePath: isProd ? puppeteer.executablePath() : undefined,
//         args: [
//           "--no-sandbox",
//           "--disable-setuid-sandbox",
//           "--disable-dev-shm-usage"
//         ]
//       });


//       const page = await browser.newPage();
//       await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

//       const profileUrl = `https://takeuforward.org/plus/profile/${username}`;
//       console.log(`Navigating to ${profileUrl}...`);
//       await page.goto(profileUrl, { waitUntil: 'networkidle2', timeout: 60000 });

//       try {
//         await page.waitForSelector('span', { timeout: 5000 });
//       } catch (e) {
//         // Ignore timeout, page might be loaded
//       }

//       // -------------------------------------------------------------------
//       // 1. DOM SCRAPING: Get Stats directly from HTML
//       // -------------------------------------------------------------------
//       // We found that the stats are in a specific structure:
//       // <div ...><span class="text-[18px] font-bold">13/</span>254</span> ... <span ...>Hard</span>

//       const stats = await page.evaluate(function () {
//         try {
//           const result = { total: 0, easy: 0, medium: 0, hard: 0 };
//           const allSpans = Array.from(document.querySelectorAll('span'));

//           // Easy
//           for (const span of allSpans) {
//             if (span.textContent && span.textContent.trim() === 'Easy') {
//               let current = span.parentElement;
//               let attempts = 0;
//               while (current && attempts < 5) {
//                 if (current.previousElementSibling) {
//                   // Check if this sibling looks like the stats container
//                   if (current.previousElementSibling.innerHTML.includes('text-[18px]')) {
//                     const txt = current.previousElementSibling.textContent || "";
//                     const match = txt.match(/(\d+)\s*\//);
//                     if (match) {
//                       result.easy = parseInt(match[1], 10);
//                       break;
//                     }
//                   }
//                 }
//                 current = current.parentElement;
//                 attempts++;
//               }
//             }
//           }

//           // Medium
//           for (const span of allSpans) {
//             if (span.textContent && span.textContent.trim() === 'Medium') {
//               let current = span.parentElement;
//               let attempts = 0;
//               while (current && attempts < 5) {
//                 if (current.previousElementSibling) {
//                   if (current.previousElementSibling.innerHTML.includes('text-[18px]')) {
//                     const txt = current.previousElementSibling.textContent || "";
//                     const match = txt.match(/(\d+)\s*\//);
//                     if (match) {
//                       result.medium = parseInt(match[1], 10);
//                       break;
//                     }
//                   }
//                 }
//                 current = current.parentElement;
//                 attempts++;
//               }
//             }
//           }

//           // Hard
//           for (const span of allSpans) {
//             if (span.textContent && span.textContent.trim() === 'Hard') {
//               let current = span.parentElement;
//               let attempts = 0;
//               while (current && attempts < 5) {
//                 if (current.previousElementSibling) {
//                   if (current.previousElementSibling.innerHTML.includes('text-[18px]')) {
//                     const txt = current.previousElementSibling.textContent || "";
//                     const match = txt.match(/(\d+)\s*\//);
//                     if (match) {
//                       result.hard = parseInt(match[1], 10);
//                       break;
//                     }
//                   }
//                 }
//                 current = current.parentElement;
//                 attempts++;
//               }
//             }
//           }

//           result.total = result.easy + result.medium + result.hard;

//           // Fallback for Total if 0 (though sum should work)
//           if (result.total === 0) {
//             // Try finding "Solved" label
//             for (const el of allSpans) {
//               if (el.textContent && el.textContent.trim() === 'Solved') {
//                 const container = el.previousElementSibling;
//                 if (container) {
//                   const txt = container.textContent || "";
//                   const match = txt.match(/(\d+)/);
//                   if (match) {
//                     result.total = parseInt(match[1], 10);
//                     break;
//                   }
//                 }
//               }
//             }
//           }

//           return result;
//         } catch (e) {
//           return { error: String(e) };
//         }
//       });

//       if (stats && 'error' in stats) {
//         console.error("Error in page.evaluate:", stats.error);
//         return null;
//       }

//       console.log(`✅ Scraped Stats: Total=${stats.total} (E:${stats.easy}, M:${stats.medium}, H:${stats.hard})`);

//       const finalStats = stats as { total: number, easy: number, medium: number, hard: number };

//       console.log(`✅ Final TUF Stats: Total=${finalStats.total} (E:${finalStats.easy}, M:${finalStats.medium}, H:${finalStats.hard})`);

//       return {
//         username,
//         totalSolved: finalStats.total || 0,
//         easySolved: finalStats.easy || 0,
//         mediumSolved: finalStats.medium || 0,
//         hardSolved: finalStats.hard || 0,
//         recentActivity: []
//       };

//     } catch (error) {
//       console.error('Error scraping TUF+:', error);
//       return null;
//     } finally {
//       if (browser) await browser.close();
//     }
//   }
// }
