import { Bot } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BotStatusBadge } from "@/components/bot-status-badge";
import { Play, Square, RefreshCw, Trash2, FileText, Bot as BotIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BotCardProps {
  bot: Bot;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onRestart: (id: string) => void;
  onDelete: (id: string) => void;
  onViewLogs: (id: string) => void;
  isLoading?: boolean;
}

export function BotCard({
  bot,
  onStart,
  onStop,
  onRestart,
  onDelete,
  onViewLogs,
  isLoading = false,
}: BotCardProps) {
  const isRunning = bot.status === "running";
  const isStopped = bot.status === "stopped";
  const statusBorderColor = {
    running: "border-l-green-500",
    stopped: "border-l-muted",
    error: "border-l-red-500",
    restarting: "border-l-amber-500",
  }[bot.status];

  return (
    <Card
      className={`border-l-4 ${statusBorderColor} hover-elevate transition-all duration-200`}
      data-testid={`card-bot-${bot.id}`}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="rounded-lg bg-primary/10 p-2.5 flex-shrink-0">
            <BotIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-lg truncate"
              data-testid={`text-bot-name-${bot.id}`}
            >
              {bot.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {bot.entryFile}
            </p>
          </div>
        </div>
        <BotStatusBadge status={bot.status} />
      </CardHeader>

      <CardContent className="pb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Uploaded</span>
          <span className="font-medium" data-testid={`text-upload-date-${bot.id}`}>
            {formatDistanceToNow(new Date(bot.uploadDate), { addSuffix: true })}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 pt-4 border-t">
        <div className="flex gap-2 flex-1">
          {isStopped && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onStart(bot.id)}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid={`button-start-${bot.id}`}
                >
                  <Play className="h-4 w-4 mr-1.5" />
                  Start
                </Button>
              </TooltipTrigger>
              <TooltipContent>Start the bot</TooltipContent>
            </Tooltip>
          )}

          {isRunning && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStop(bot.id)}
                  disabled={isLoading}
                  data-testid={`button-stop-${bot.id}`}
                >
                  <Square className="h-4 w-4 mr-1.5" />
                  Stop
                </Button>
              </TooltipTrigger>
              <TooltipContent>Stop the bot</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRestart(bot.id)}
                disabled={isLoading || isStopped}
                data-testid={`button-restart-${bot.id}`}
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Restart
              </Button>
            </TooltipTrigger>
            <TooltipContent>Restart the bot</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewLogs(bot.id)}
                data-testid={`button-logs-${bot.id}`}
              >
                <FileText className="h-4 w-4 mr-1.5" />
                Logs
              </Button>
            </TooltipTrigger>
            <TooltipContent>View bot logs</TooltipContent>
          </Tooltip>
        </div>

        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isLoading}
                  className="text-destructive hover:text-destructive"
                  data-testid={`button-delete-${bot.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent>Delete bot</TooltipContent>
          </Tooltip>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Bot</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{bot.name}"? This action cannot be
                undone. All bot files and logs will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(bot.id)}
                className="bg-destructive hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
