import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Calendar, Award, Target, Zap } from "lucide-react";
import { DashboardCharts } from "@/components/DashboardCharts";
import { formatDistanceToNow } from "date-fns";
import type { Problem } from "@shared/schema";

export default function ProgressPage() {
  const { user } = useAuth();

  interface StatsData {
    total: number;
    easy: number;
    medium: number;
    hard: number;
    platformStats: { platform: string; count: number }[];
    categoryStats: { category: string; count: number }[];
  }

  const { data: stats, isLoading: statsLoading } = useQuery<StatsData>({
    queryKey: ["/api/stats"],
  });

  const { data: problems = [] } = useQuery<Problem[]>({
    queryKey: ["/api/problems"],
  });

  const categoryDistribution = problems.reduce((acc, problem) => {
    const category = problem.category || "Uncategorized";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const recentStreak = problems.length > 0 ? calculateStreak(problems) : 0;

  function calculateStreak(problems: Problem[]): number {
    if (problems.length === 0) return 0;

    const sortedDates = problems
      .map((p) => new Date(p.solved).toDateString())
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const uniqueDates = Array.from(new Set(sortedDates));
    let streak = 0;
    const today = new Date().toDateString();

    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateString = expectedDate.toDateString();

      if (uniqueDates[i] === expectedDateString) {
        streak++;
      } else if (i === 0 && uniqueDates[0] !== today) {
        break;
      } else {
        break;
      }
    }

    return streak;
  }

  const lastSolvedProblem = problems.length > 0
    ? problems.sort((a, b) => new Date(b.solved).getTime() - new Date(a.solved).getTime())[0]
    : null;

  const averageProblemsPerDay = problems.length > 0
    ? (problems.length / Math.max(1, Math.ceil((Date.now() - new Date(problems[0].solved).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <MobileHeader />

      <main className="lg:ml-64 p-4 lg:p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Progress</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Track your learning journey and achievements
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Solved</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-solved">
                    {statsLoading ? "..." : stats?.total || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-streak">
                    {recentStreak} day{recentStreak !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Per Day</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-avg-per-day">
                    {averageProblemsPerDay}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Hard Solved</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-hard-solved">
                    {statsLoading ? "..." : stats?.hard || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DashboardCharts stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Top Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topCategories.length > 0 ? (
                <div className="space-y-4">
                  {topCategories.map(([category, count], index) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white capitalize">
                            {category.replace("-", " ")}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {((count / problems.length) * 100).toFixed(0)}% of total
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" data-testid={`badge-category-${category}`}>
                        {count} problem{count !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No category data available yet. Start solving problems!
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lastSolvedProblem ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Last solved problem
                    </p>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {lastSolvedProblem.name}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        className={
                          lastSolvedProblem.platform === "leetcode"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                            : lastSolvedProblem.platform === "gfg"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        }
                      >
                        {lastSolvedProblem.platform.toUpperCase()}
                      </Badge>
                      <Badge
                        className={
                          lastSolvedProblem.difficulty === "easy"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : lastSolvedProblem.difficulty === "medium"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }
                      >
                        {(lastSolvedProblem.difficulty || 'medium').charAt(0).toUpperCase() +
                          (lastSolvedProblem.difficulty || 'medium').slice(1)}
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDistanceToNow(new Date(lastSolvedProblem.solved), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        This Week
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {
                          problems.filter(
                            (p) =>
                              new Date(p.solved).getTime() >
                              Date.now() - 7 * 24 * 60 * 60 * 1000
                          ).length
                        }
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        This Month
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {
                          problems.filter(
                            (p) =>
                              new Date(p.solved).getTime() >
                              Date.now() - 30 * 24 * 60 * 60 * 1000
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No activity yet. Start solving problems to track your progress!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                className={`p-4 rounded-lg border-2 ${(stats?.total ?? 0) >= 1
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                data-testid="achievement-first-steps"
              >
                <div className="text-3xl mb-2">🎯</div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  First Steps
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Solve your first problem
                </p>
                {(stats?.total ?? 0) >= 1 && (
                  <Badge className="mt-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                    Unlocked
                  </Badge>
                )}
              </div>

              <div
                className={`p-4 rounded-lg border-2 ${(stats?.total ?? 0) >= 10
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                data-testid="achievement-getting-started"
              >
                <div className="text-3xl mb-2">⚡</div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Getting Started
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Solve 10 problems</p>
                {(stats?.total ?? 0) >= 10 && (
                  <Badge className="mt-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    Unlocked
                  </Badge>
                )}
              </div>

              <div
                className={`p-4 rounded-lg border-2 ${(stats?.total ?? 0) >= 50
                  ? "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                data-testid="achievement-problem-solver"
              >
                <div className="text-3xl mb-2">🚀</div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Problem Solver
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Solve 50 problems</p>
                {(stats?.total ?? 0) >= 50 && (
                  <Badge className="mt-2 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                    Unlocked
                  </Badge>
                )}
              </div>

              <div
                className={`p-4 rounded-lg border-2 ${(stats?.hard ?? 0) >= 5
                  ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                data-testid="achievement-challenge-accepted"
              >
                <div className="text-3xl mb-2">💪</div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Challenge Accepted
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Solve 5 hard problems
                </p>
                {(stats?.hard ?? 0) >= 5 && (
                  <Badge className="mt-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                    Unlocked
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
