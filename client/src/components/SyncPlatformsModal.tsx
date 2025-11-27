import { useState, useEffect } from "react"; // Added useEffect
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, RefreshCw, Check, AlertCircle, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SyncPlatformsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const syncFormSchema = z.object({
  leetcode: z.string().optional(),
  gfg: z.string().optional(),
  tuf: z.string().optional(), // Schema uses 'tuf'
});

type SyncFormData = z.infer<typeof syncFormSchema>;

export function SyncPlatformsModal({ isOpen, onClose }: SyncPlatformsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [syncResults, setSyncResults] = useState<any>(null);

  const form = useForm<SyncFormData>({
    resolver: zodResolver(syncFormSchema),
    defaultValues: {
      leetcode: "",
      gfg: "",
      tuf: "",
    },
  });

  // Fetch existing platform credentials
  const { data: credentials } = useQuery({
    queryKey: ["/api/platform-credentials"],
    enabled: isOpen,
    retry: false,
  });

  // Set existing credentials in form when loaded
  useEffect(() => {
    if (credentials && Array.isArray(credentials)) {
      const formData: SyncFormData = {
        leetcode: "",
        gfg: "",
        tuf: ""
      };
      credentials.forEach((cred: any) => {
        if (cred.platform === 'leetcode') formData.leetcode = cred.username;
        if (cred.platform === 'gfg') formData.gfg = cred.username;
        // FIXED: Map backend 'tuf' to frontend 'tuf'
        if (cred.platform === 'tuf') formData.tuf = cred.username;
      });
      form.reset(formData);
    }
  }, [credentials, form]);

  const syncMutation = useMutation({
    mutationFn: async (platforms: Record<string, string>): Promise<{ message: string; synced: any[] }> => {
      const res = await apiRequest("POST", "/api/sync-platforms", { platforms });
      return await res.json();
    },
    onSuccess: (data) => {
      setSyncResults(data);
      // Invalidate all relevant queries to update UI immediately
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/problems"] });

      toast({
        title: "Sync Complete",
        description: data.message,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Sync Failed",
        description: "Failed to sync. Please check usernames.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SyncFormData) => {
    const platforms: Record<string, string> = {};

    if (data.leetcode?.trim()) platforms.leetcode = data.leetcode.trim();
    if (data.gfg?.trim()) platforms.gfg = data.gfg.trim();

    // FIXED: Check 'tuf' field and assign to 'tuf' key
    if (data.tuf?.trim()) platforms.tuf = data.tuf.trim();

    if (Object.keys(platforms).length === 0) {
      toast({
        title: "No Platforms Selected",
        description: "Please enter at least one platform username.",
        variant: "destructive",
      });
      return;
    }

    syncMutation.mutate(platforms);
  };

  const handleClose = () => {
    setSyncResults(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Sync Platform Data
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-blue-600 mt-0.5" size={16} />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How it works:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Enter your public usernames for each platform</li>
                  <li>• We will fetch your <strong>Total Solved Counts</strong></li>
                  <li>• Recent problems will be added to your activity feed</li>
                </ul>
              </div>
            </div>
          </div>

          {!syncResults ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* LeetCode Field */}
                <FormField
                  control={form.control}
                  name="leetcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
                        LeetCode Username
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. sudhanshu517" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* GFG Field */}
                <FormField
                  control={form.control}
                  name="gfg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
                        GeeksforGeeks Username
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. sudhanshu_gfg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* TUF+ Field*/}
                <FormField
                  control={form.control}
                  name="tuf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
                        TUF+ (Striver) Username
                        <Badge variant="outline" className="ml-2 text-xs font-normal text-gray-500">New</Badge>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. striver_79"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Your public takeuforward.org username
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={syncMutation.isPending}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white"
                  >
                    {syncMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      "Sync Platforms"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            // Results View
            <div className="space-y-4">
              <div className="text-center">
                <Check className="w-12 h-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sync Complete!</h3>
                <p className="text-gray-600">{syncResults.message}</p>
              </div>

              {syncResults.synced?.length > 0 && (
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Results:</h4>
                    <div className="space-y-2">
                      {syncResults.synced.map((result: any, index: number) => (
                        <div key={index} className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg">
                          <span className="font-medium text-gray-900">{result.platform}</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                            Total: {result.totalSolved}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button onClick={handleClose} className="w-full">Close</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}