import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ExternalLink, TrendingUp, Target, Award, Sparkles } from "lucide-react";
import type { Recommendation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function RecommendationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recommendations = [], isLoading } = useQuery<Recommendation[]>({
    queryKey: ["/api/recommendations"],
  });

  interface StatsData {
    total: number;
    easy: number;
    medium: number;
    hard: number;
    platformStats: { platform: string; count: number }[];
    categoryStats: { category: string; count: number }[];
  }

  const { data: stats } = useQuery<StatsData>({
    queryKey: ["/api/stats"],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/recommendations/generate-ai");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({ title: "Recommendations Generated", description: "Fresh set of problems just for you!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate recommendations. Ensure API key is set.", variant: "destructive" });
    }
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "leetcode":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "gfg":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "tuf":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      array: "📊",
      string: "📝",
      tree: "🌲",
      graph: "🔗",
      "dynamic-programming": "💎",
      greedy: "🎯",
      backtracking: "🔙",
      sorting: "🔢",
    };
    return icons[category] || "💡";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <MobileHeader />

      <main className="lg:ml-64 p-4 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Lightbulb className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI Recommendations
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Personalized problem suggestions based on your solving history
            </p>
          </div>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generateMutation.isPending ? "Generating..." : "Generate with AI"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Recommendations</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {recommendations.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Problems Solved</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.total || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.total ? "100%" : "0%"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : recommendations.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Lightbulb className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Recommendations Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Start solving problems to get personalized recommendations based on your
                  strengths and areas for improvement.
                </p>
                <Button data-testid="button-go-to-problems">
                  <Target className="w-4 h-4 mr-2" />
                  Browse Problems
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {recommendations.map((recommendation) => (
              <Card
                key={recommendation.id}
                className="hover:shadow-lg transition-shadow duration-200"
                data-testid={`card-recommendation-${recommendation.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl" aria-label="Category icon">
                          {getCategoryIcon(recommendation.category)}
                        </span>
                        <CardTitle className="text-xl">
                          {recommendation.problemName}
                        </CardTitle>
                      </div>
                      <CardDescription className="flex items-center gap-2 flex-wrap">
                        <Badge className={getPlatformColor(recommendation.platform)}>
                          {recommendation.platform.toUpperCase()}
                        </Badge>
                        <Badge className={getDifficultyColor(recommendation.difficulty || 'medium')}>
                          {(recommendation.difficulty || 'medium').charAt(0).toUpperCase() +
                            (recommendation.difficulty || 'medium').slice(1)}
                        </Badge>
                        <span className="text-gray-500 dark:text-gray-400">•</span>
                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                          {recommendation.category.replace("-", " ")}
                        </span>
                      </CardDescription>
                    </div>
                    {recommendation.score !== null && (
                      <div className="text-right ml-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Match Score</p>
                        <p className={`text-2xl font-bold ${getScoreColor(recommendation.score)}`}>
                          {recommendation.score}%
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400 max-w-[70%]">
                      <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {recommendation.reason || `Recommended based on your ${recommendation.category.replace("-", " ")} solving pattern`}
                      </span>
                    </div>
                    {recommendation.url ? (
                      <Button
                        asChild
                        variant="default"
                        size="sm"
                        data-testid={`button-solve-${recommendation.id}`}
                      >
                        <a
                          href={recommendation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <span>Solve Now</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button variant="default" size="sm" data-testid={`button-solve-${recommendation.id}`}>
                        Solve Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
