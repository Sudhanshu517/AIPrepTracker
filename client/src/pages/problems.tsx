import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Filter, ExternalLink, Trash2, Calendar, Info, MoreVertical, Trash } from "lucide-react";
import { AddProblemModal } from "@/components/AddProblemModal";
import { CategoryCell } from "@/components/CategoryCell";
import type { Problem } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function ProblemsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'single' | 'platform' | 'all';
    id?: number;
    platform?: string;
  }>({ isOpen: false, type: 'single' });

  // Fetch Problems (The list of 16)
  const { data: problems = [], isLoading } = useQuery<Problem[]>({
    queryKey: ["/api/problems"],
  });

  // Fetch Stats (The total count of 76) to display in the subtitle
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/stats"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (problemId: number) => {
      return apiRequest("DELETE", `/api/problems/${problemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/problems"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Problem deleted",
        description: "The problem has been removed successfully.",
      });
      setDeleteConfirm({ ...deleteConfirm, isOpen: false });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete problem. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePlatformMutation = useMutation({
    mutationFn: async (platform: string) => {
      return apiRequest("DELETE", `/api/problems/platform/${platform}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/problems"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Deleted", description: "Platform problems deleted successfully." });
      setDeleteConfirm({ ...deleteConfirm, isOpen: false });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete platform problems.", variant: "destructive" });
    }
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/problems");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/problems"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Deleted", description: "All problems deleted successfully." });
      setDeleteConfirm({ ...deleteConfirm, isOpen: false });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete all problems.", variant: "destructive" });
    }
  });

  const updateDifficultyMutation = useMutation({
    mutationFn: async ({ id, difficulty }: { id: number; difficulty: string }) => {
      return apiRequest("PATCH", `/api/problems/${id}/difficulty`, { difficulty });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/problems"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Updated", description: "Difficulty updated successfully!" });
    }
  });


  const filteredProblems = problems.filter((problem) => {
    const matchesSearch = problem.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || (problem.category || "").toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesPlatform = platformFilter === "all" || problem.platform === platformFilter;
    const matchesDifficulty = difficultyFilter === "all" || problem.difficulty === difficultyFilter;
    return matchesSearch && matchesCategory && matchesPlatform && matchesDifficulty;
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

  const handleDeleteConfirm = () => {
    if (deleteConfirm.type === 'single' && deleteConfirm.id) {
      deleteMutation.mutate(deleteConfirm.id);
    } else if (deleteConfirm.type === 'platform' && deleteConfirm.platform) {
      deletePlatformMutation.mutate(deleteConfirm.platform);
    } else if (deleteConfirm.type === 'all') {
      deleteAllMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <MobileHeader />

      <main className="lg:ml-64 p-4 lg:p-8">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Recent Activity
              </h1>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                <Info className="w-4 h-4" />
                <p>
                  Showing {problems.length} most recent submissions.
                  (Total lifetime solved: <span className="font-bold text-gray-900 dark:text-white">{stats?.total || 0}</span>)
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-4 lg:mt-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    <Trash className="w-4 h-4 mr-2" />
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Delete Problems</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                    onClick={() => setDeleteConfirm({ isOpen: true, type: 'platform', platform: 'leetcode' })}
                  >
                    Delete All LeetCode
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                    onClick={() => setDeleteConfirm({ isOpen: true, type: 'platform', platform: 'gfg' })}
                  >
                    Delete All GFG
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                    onClick={() => setDeleteConfirm({ isOpen: true, type: 'platform', platform: 'tuf' })}
                  >
                    Delete All TUF+
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 font-bold focus:text-red-700 focus:bg-red-50"
                    onClick={() => setDeleteConfirm({ isOpen: true, type: 'all' })}
                  >
                    Delete EVERYTHING
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={() => setIsAddModalOpen(true)}
                data-testid="button-add-problem"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Manual Entry
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="md:col-span-1">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Filter category..."
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="leetcode">LeetCode</SelectItem>
                    <SelectItem value="gfg">GeeksforGeeks</SelectItem>
                    <SelectItem value="tuf">TUF+</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {filteredProblems.length} Submission{filteredProblems.length !== 1 ? "s" : ""}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredProblems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {searchQuery || categoryFilter || platformFilter !== "all" || difficultyFilter !== "all"
                      ? "No problems match your filters"
                      : "No recent activity synced yet."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Problem Name</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Solved Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProblems.map((problem) => (
                        <TableRow key={problem.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {problem.name}
                              {problem.url && (
                                <a
                                  href={problem.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-primary transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPlatformColor(problem.platform)}>
                              {problem.platform.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {problem.difficulty ? (
                              <Badge className={getDifficultyColor(problem.difficulty)}>
                                {problem.difficulty}
                              </Badge>
                            ) : (
                              <Select
                                onValueChange={(value) =>
                                  updateDifficultyMutation.mutate({ id: problem.id, difficulty: value })
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Set difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="easy">Easy</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell>
                            <CategoryCell problemId={problem.id} initialCategory={problem.category} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <Calendar className="w-4 h-4" />
                              {formatDistanceToNow(new Date(problem.solved), { addSuffix: true })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm({ isOpen: true, type: 'single', id: problem.id })}
                              disabled={deleteMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <AddProblemModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      <AlertDialog open={deleteConfirm.isOpen} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, isOpen: open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm.type === 'single'
                ? "This action cannot be undone. This will permanently delete this problem."
                : deleteConfirm.type === 'platform'
                  ? `This will permanently delete ALL ${deleteConfirm.platform?.toUpperCase()} problems and stats.`
                  : "This will permanently delete ALL problems and reset all stats. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}