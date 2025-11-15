import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bot } from "@shared/schema";
import { UploadZone } from "@/components/upload-zone";
import { BotCard } from "@/components/bot-card";
import { EmptyState } from "@/components/empty-state";
import { LogViewer } from "@/components/log-viewer";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Server, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedBotForLogs, setSelectedBotForLogs] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const { toast } = useToast();

  const { data: bots, isLoading } = useQuery<Bot[]>({
    queryKey: ["/api/bots"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("bot", file);

      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      try {
        const response = await fetch("/api/bots/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Upload failed");
        }

        return response.json();
      } catch (error) {
        clearInterval(progressInterval);
        setUploadProgress(0);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({
        title: "Bot uploaded successfully",
        description: "Your bot has been deployed and is ready to start.",
      });
      setTimeout(() => setUploadProgress(0), 1000);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const startBotMutation = useMutation({
    mutationFn: (botId: string) => apiRequest("POST", `/api/bots/${botId}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({ title: "Bot started successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to start bot",
        variant: "destructive",
      });
    },
  });

  const stopBotMutation = useMutation({
    mutationFn: (botId: string) => apiRequest("POST", `/api/bots/${botId}/stop`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({ title: "Bot stopped successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to stop bot",
        variant: "destructive",
      });
    },
  });

  const restartBotMutation = useMutation({
    mutationFn: (botId: string) => apiRequest("POST", `/api/bots/${botId}/restart`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({ title: "Bot restarted successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to restart bot",
        variant: "destructive",
      });
    },
  });

  const deleteBotMutation = useMutation({
    mutationFn: (botId: string) => apiRequest("DELETE", `/api/bots/${botId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({ title: "Bot deleted successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to delete bot",
        variant: "destructive",
      });
    },
  });

  const handleUpload = async (file: File) => {
    await uploadMutation.mutateAsync(file);
  };

  const runningBotsCount = bots?.filter((bot) => bot.status === "running").length || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Server className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Discord Bot Hosting</h1>
                <p className="text-xs text-muted-foreground">24/7 Uptime Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge
                variant="outline"
                className={`gap-1.5 ${
                  runningBotsCount > 0
                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                    : ""
                }`}
                data-testid="badge-running-bots"
              >
                <Circle
                  className={`h-2 w-2 fill-current ${runningBotsCount > 0 ? "animate-pulse" : ""}`}
                />
                {runningBotsCount} Running
              </Badge>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <UploadZone
              onUpload={handleUpload}
              isUploading={uploadMutation.isPending}
              uploadProgress={uploadProgress}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Your Bots</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage and monitor your Discord bots
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-48 w-full" />
                  </div>
                ))}
              </div>
            ) : bots && bots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bots.map((bot) => (
                  <BotCard
                    key={bot.id}
                    bot={bot}
                    onStart={(id) => startBotMutation.mutate(id)}
                    onStop={(id) => stopBotMutation.mutate(id)}
                    onRestart={(id) => restartBotMutation.mutate(id)}
                    onDelete={(id) => deleteBotMutation.mutate(id)}
                    onViewLogs={(id) =>
                      setSelectedBotForLogs({ id, name: bot.name })
                    }
                    isLoading={
                      startBotMutation.isPending ||
                      stopBotMutation.isPending ||
                      restartBotMutation.isPending ||
                      deleteBotMutation.isPending
                    }
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </main>

      {selectedBotForLogs && (
        <LogViewer
          botId={selectedBotForLogs.id}
          botName={selectedBotForLogs.name}
          open={!!selectedBotForLogs}
          onClose={() => setSelectedBotForLogs(null)}
        />
      )}
    </div>
  );
}
