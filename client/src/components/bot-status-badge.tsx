import { Badge } from "@/components/ui/badge";
import { BotStatusType } from "@shared/schema";
import { Circle, AlertCircle, RefreshCw, Power } from "lucide-react";

interface BotStatusBadgeProps {
  status: BotStatusType;
}

export function BotStatusBadge({ status }: BotStatusBadgeProps) {
  const statusConfig = {
    running: {
      label: "Running",
      icon: Circle,
      className: "bg-green-500/10 text-green-500 border-green-500/20",
      iconClassName: "fill-green-500 animate-pulse-slow",
    },
    stopped: {
      label: "Stopped",
      icon: Power,
      className: "bg-muted text-muted-foreground border-border",
      iconClassName: "",
    },
    error: {
      label: "Error",
      icon: AlertCircle,
      className: "bg-red-500/10 text-red-500 border-red-500/20",
      iconClassName: "animate-pulse-slow",
    },
    restarting: {
      label: "Restarting",
      icon: RefreshCw,
      className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      iconClassName: "animate-spin-slow",
    },
  };

  const config = statusConfig[status] || statusConfig.stopped;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`${config.className} gap-1.5 font-medium`}
      data-testid={`badge-status-${status}`}
    >
      <Icon className={`h-3 w-3 ${config.iconClassName}`} />
      {config.label}
    </Badge>
  );
}
