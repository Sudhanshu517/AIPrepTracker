import axios from 'axios';

export interface LeetCodeProfile {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  recentSubmissions: {
    title: string;
    difficulty: string | null;
    timestamp: string;
    status: string;
  }[];
}

export class LeetCodeScraper {
  async scrapeProfile(username: string): Promise<LeetCodeProfile | null> {
    try {
      console.log(`Fetching LeetCode data for: ${username}`);

      // Query to get BOTH the "Big Numbers" (Stats) and "Recent Activity" (List)
      const query = `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            submitStats: submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
          recentSubmissionList(username: $username, limit: 50) {
            title
            titleSlug
            timestamp
            statusDisplay
            lang
          }
        }
      `;

      const response = await axios.post('https://leetcode.com/graphql', {
        query,
        variables: { username }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; InterviewTracker/1.0)'
        }
      });

      const data = response.data.data;

      if (!data || !data.matchedUser) {
        console.error("LeetCode user not found or API changed.");
        return null;
      }

      // 1. Extract The "Big Numbers" (Total Solved)
      const stats = data.matchedUser.submitStats.acSubmissionNum;
      const getCount = (diff: string) => stats.find((s: any) => s.difficulty === diff)?.count || 0;

      const totalSolved = getCount('All');
      const easySolved = getCount('Easy');
      const mediumSolved = getCount('Medium');
      const hardSolved = getCount('Hard');

      console.log(`LeetCode Stats Found: Total ${totalSolved} (E:${easySolved}, M:${mediumSolved}, H:${hardSolved})`);

      // 2. Extract Recent Activity (Max 50)
      const recentSubmissions = (data.recentSubmissionList || []).map((sub: any) => ({
        title: sub.title,
        difficulty: null, // LeetCode Recent List DOES NOT include difficulty. We default to null so user can set it.
        timestamp: new Date(parseInt(sub.timestamp) * 1000).toISOString(),
        status: sub.statusDisplay === 'Accepted' ? 'Accepted' : sub.statusDisplay
      }));

      return {
        username: data.matchedUser.username,
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        recentSubmissions
      };

    } catch (error) {
      console.error('LeetCode Scraper Error:', error);
      return null;
    }
  }
}