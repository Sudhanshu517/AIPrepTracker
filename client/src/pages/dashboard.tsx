import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Download, Check, Smile, Meh, Frown, RefreshCw } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { AddProblemModal } from "@/components/AddProblemModal";
import { DashboardCharts } from "@/components/DashboardCharts";
import { SyncPlatformsModal } from "@/components/SyncPlatformsModal";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CategoryCell } from "@/components/CategoryCell";


export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch dashboard data
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
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: recentActivity = [], isLoading: activityLoading } = useQuery<any[]>({
    queryKey: ["/api/recent-activity"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: recommendations = [], isLoading: recommendationsLoading } = useQuery<any[]>({
    queryKey: ["/api/recommendations"],
    retry: false,
    enabled: isAuthenticated,
  });

  const updateDifficultyMutation = useMutation({
    mutationFn: async ({ id, difficulty }: { id: number; difficulty: string }) => {
      return apiRequest("PATCH", `/api/problems/${id}/difficulty`, { difficulty });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Updated", description: "Difficulty updated successfully!" });
    },
  });

  // Get the current user's ID (e.g., user_2k3...)

  const handleExport = () => {
    if (!user) return;

    // SIMPLE: Just go to the URL. The browser handles the download automatically.
    window.location.href = `/api/export/${user.id}`;
  };


  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };



  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-success';
      case 'medium': return 'text-warning';
      case 'hard': return 'text-danger';
      default: return 'text-gray-600';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'leetcode': return 'bg-orange-100 text-orange-800';
      case 'gfg': return 'bg-green-100 text-green-800';
      case 'tuf': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <MobileHeader />

      <main className="lg:ml-64 p-4 lg:p-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Track your coding progress across platforms</p>
            </div>
            <div className="mt-4 lg:mt-0 flex space-x-3">
              <Button variant="outline" className="border-gray-200 hover:bg-gray-50"
                onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsSyncModalOpen(true)}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Platforms
              </Button>
              <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Problem
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Solved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : stats?.total || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Check className="text-success text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Easy Problems</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : stats?.easy || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Smile className="text-success text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Medium Problems</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : stats?.medium || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Meh className="text-warning text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Hard Problems</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : stats?.hard || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-danger/10 rounded-lg flex items-center justify-center">
                  <Frown className="text-danger text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <DashboardCharts stats={stats} />

        {/* Platform Stats */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Platform Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats?.platformStats?.map((platform) => (
                <div key={platform.platform} className={`flex items-center space-x-4 p-4 rounded-lg ${getPlatformColor(platform.platform)}`}>
                  <div className="w-12 h-12 bg-current/20 rounded-lg flex items-center justify-center">
                    <span className="text-current font-semibold">
                      {platform.platform.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-current capitalize">{platform.platform}</h4>
                    <p className="text-current/80 text-sm">{platform.count} problems solved</p>
                  </div>
                </div>
              )) || (
                  <div className="col-span-3 text-center text-gray-500 py-8">
                    No platform data available. Start by adding your first problem!
                  </div>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {activityLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : recentActivity && recentActivity.length > 0 ? (
                  recentActivity.map((activity: any) => (
                    <div key={activity.id} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{activity.name}</p>
                        <div className="text-gray-600 text-sm flex items-center flex-wrap gap-2 mt-1">
                          <span className={`font-mono text-xs px-2 py-1 rounded ${getPlatformColor(activity.platform)}`}>
                            {activity.platform}
                          </span>
                          <span>•</span>
                          {/* Difficulty section */}
                          {activity.difficulty ? (
                            <span className={getDifficultyColor(activity.difficulty)}>
                              {activity.difficulty}
                            </span>
                          ) : (
                            <Select
                              onValueChange={(value) =>
                                updateDifficultyMutation.mutate({ id: activity.id, difficulty: value })
                              }
                            >
                              <SelectTrigger className="w-28 h-6 text-xs">
                                <SelectValue placeholder="Set difficulty" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <span>•</span>
                          <CategoryCell problemId={activity.id} initialCategory={activity.category} />
                        </div>
                      </div>
                      <div className="text-right">
                        {/* <p className="text-sm text-gray-500">{formatTimeAgo(activity.solved)}</p> */}
                        {/* <p className="text-sm text-gray-500"><span className="text-gray-400 text-xs">Recently synced</span> */}
                        <p className="text-sm text-gray-500"><span className="text-gray-400 text-xs">Synced {formatTimeAgo(activity.solved)}</span>
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No recent activity. Start solving problems to see your progress here!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recommended Problems */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recommended Problems</h3>
                <Button variant="ghost" className="text-primary hover:text-primary/80 text-sm font-medium">
                  View All
                </Button>
              </div>
              <div className="space-y-4">
                {recommendationsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : recommendations && recommendations.length > 0 ? (
                  recommendations.slice(0, 5).map((problem: any) => (
                    <div key={problem.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                      <div>
                        <h4 className="font-medium text-gray-900">{problem.problemName}</h4>
                        <p className="text-gray-600 text-sm mt-1">
                          <span className={`text-xs px-2 py-1 rounded font-mono mr-2 ${getPlatformColor(problem.platform)}`}>
                            {problem.platform}
                          </span>
                          <span className={`font-medium ${getDifficultyColor(problem.difficulty)}`}>
                            {problem.difficulty}
                          </span>
                          <span className="mx-2">•</span>
                          <span>{problem.category}</span>
                        </p>
                      </div>
                      <Button size="sm" className="bg-primary hover:bg-primary/90">
                        Solve
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No recommendations available. Add some problems to get personalized suggestions!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <AddProblemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <SyncPlatformsModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </div>
  );
}
