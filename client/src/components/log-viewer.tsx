import { useEffect, useRef, useState } from "react";
import { X, Trash2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface LogViewerProps {
  botId: string;
  botName: string;
  open: boolean;
  onClose: () => void;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "error" | "warn";
}

export function LogViewer({ botId, botName, open, onClose }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!open) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setIsConnected(true);
      socket.send(JSON.stringify({ type: "subscribe", botId }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "log" && data.botId === botId) {
          setLogs((prev) => [
            ...prev,
            {
              timestamp: new Date().toLocaleTimeString(),
              message: data.message,
              type: data.level || "info",
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to parse log message:", error);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    wsRef.current = socket;

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "unsubscribe", botId }));
      }
      socket.close();
    };
  }, [open, botId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleClearLogs = () => {
    setLogs([]);
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-red-400";
      case "warn":
        return "text-amber-400";
      default:
        return "text-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xl font-semibold">
              {botName} - Logs
            </DialogTitle>
            <Badge
              variant="outline"
              className={`gap-1.5 ${
                isConnected
                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              <Circle
                className={`h-2 w-2 fill-current ${isConnected ? "animate-pulse" : ""}`}
              />
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearLogs}
              data-testid="button-clear-logs"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Clear
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-logs"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 bg-muted/30 overflow-hidden">
          <ScrollArea className="h-full" ref={scrollRef}>
            <div className="p-6 font-mono text-sm space-y-1" data-testid="log-content">
              {logs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No logs yet. Waiting for bot output...
                </div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={`${getLogColor(log.type)} leading-relaxed`}
                    data-testid={`log-entry-${index}`}
                  >
                    <span className="text-muted-foreground mr-3">
                      [{log.timestamp}]
                    </span>
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
