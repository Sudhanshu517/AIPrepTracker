import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, User, Link2, RefreshCw, Trash2, Save } from "lucide-react";
import type { PlatformCredential } from "@shared/schema";
import { insertPlatformCredentialSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClerk } from "@clerk/clerk-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { signOut } = useClerk();
  const [isAddingCredential, setIsAddingCredential] = useState(false);

  const { data: credentials = [], isLoading } = useQuery<PlatformCredential[]>({
    queryKey: ["/api/platform-credentials"],
  });

  const form = useForm({
    resolver: zodResolver(insertPlatformCredentialSchema),
    defaultValues: {
      platform: "leetcode",
      username: "",
    },
  });

  const addCredentialMutation = useMutation({
    mutationFn: async (data: { platform: string; username: string }) => {
      return apiRequest("POST", "/api/platform-credentials", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-credentials"] });
      setIsAddingCredential(false);
      form.reset();
      toast({
        title: "Platform added",
        description: "Your platform credentials have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add platform credentials.",
        variant: "destructive",
      });
    },
  });

  const deleteCredentialMutation = useMutation({
    mutationFn: async (credentialId: number) => {
      return apiRequest("DELETE", `/api/platform-credentials/${credentialId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-credentials"] });
      toast({
        title: "Platform removed",
        description: "Your platform credentials have been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete platform credentials.",
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (credentialId: number) => {
      return apiRequest("POST", `/api/platform-credentials/${credentialId}/sync`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-credentials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/problems"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Sync complete",
        description: "Your platform data has been synchronized successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync platform data.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: { platform: string; username: string }) => {
    addCredentialMutation.mutate(data);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: string } = {
      leetcode: "🟠",
      gfg: "🟢",
      tuf: "🔵",
    };
    return icons[platform] || "🔗";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <MobileHeader />

      <main className="lg:ml-64 p-4 lg:p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account and platform integrations
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Your account details from Clerk authentication</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl font-medium">
                      {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : "User"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 hidden sm:block">{user?.email}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Email</Label>
                  <p className="text-gray-900 dark:text-white font-medium">{user?.email}</p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Full Name</Label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : "Not set"}
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <Button
                variant="destructive"
                onClick={handleSignOut}
                data-testid="button-sign-out"
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="w-5 h-5" />
                    Platform Integrations
                  </CardTitle>
                  <CardDescription>
                    Connect your coding platforms to sync your progress automatically
                  </CardDescription>
                </div>
                {!isAddingCredential && (
                  <Button
                    onClick={() => setIsAddingCredential(true)}
                    size="sm"
                    data-testid="button-add-platform"
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Add Platform
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isAddingCredential && (
                <Card className="mb-6 bg-gray-50 dark:bg-gray-800 border-2 border-primary/20">
                  <CardContent className="p-6">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="platform"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Platform</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-platform">
                                    <SelectValue placeholder="Select platform" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="leetcode">LeetCode</SelectItem>
                                  <SelectItem value="gfg">GeeksforGeeks</SelectItem>
                                  <SelectItem value="tuf">TUF+</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your platform username"
                                  {...field}
                                  data-testid="input-platform-username"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={addCredentialMutation.isPending}
                            data-testid="button-save-platform"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {addCredentialMutation.isPending ? "Saving..." : "Save Platform"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsAddingCredential(false);
                              form.reset();
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : credentials.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No platforms connected yet. Add a platform to start syncing your progress!
                </div>
              ) : (
                <div className="space-y-4">
                  {credentials.map((credential) => (
                    <Card
                      key={credential.id}
                      className="border-2"
                      data-testid={`card-credential-${credential.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-3xl">{getPlatformIcon(credential.platform)}</div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                                {credential.platform}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                @{credential.username}
                              </p>
                              {credential.lastSyncAt && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  Last synced:{" "}
                                  {new Date(credential.lastSyncAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => syncMutation.mutate(credential.id)}
                              disabled={syncMutation.isPending}
                              data-testid={`button-sync-${credential.id}`}
                            >
                              <RefreshCw
                                className={`w-4 h-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""
                                  }`}
                              />
                              Sync
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCredentialMutation.mutate(credential.id)}
                              disabled={deleteCredentialMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              data-testid={`button-delete-${credential.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>InterviewPrep Tracker version and information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <strong>Version:</strong> 1.0.0
                </p>
                <p>
                  <strong>Description:</strong> Track your DSA problem-solving progress across
                  multiple coding platforms
                </p>
                <p>
                  <strong>Supported Platforms:</strong>
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge>LeetCode</Badge>
                  <Badge>GeeksforGeeks</Badge>
                  <Badge>TUF+</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
