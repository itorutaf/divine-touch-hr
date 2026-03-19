import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShieldAlert,
  Clock,
  FileX,
  UserX,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export interface ExceptionItem {
  id: string;
  type: "expired_clearance" | "approaching_expiration" | "denied_claim" | "stuck_onboarding" | "evv_below_threshold";
  description: string;
  timestamp: string;
  severity: "critical" | "warning";
  actionLabel?: string;
  actionHref?: string;
}

const TYPE_ICONS = {
  expired_clearance: ShieldAlert,
  approaching_expiration: Clock,
  denied_claim: FileX,
  stuck_onboarding: UserX,
  evv_below_threshold: AlertTriangle,
};

const SEVERITY_STYLES = {
  critical: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
};

const SEVERITY_ROW = {
  critical: "bg-red-500/[0.03] dark:bg-red-500/[0.06] border-l-2 border-l-red-500",
  warning: "bg-amber-500/[0.02] dark:bg-amber-500/[0.04] border-l-2 border-l-amber-400",
};

interface ExceptionFeedProps {
  items: ExceptionItem[];
  maxHeight?: string;
}

export default function ExceptionFeed({
  items,
  maxHeight = "360px",
}: ExceptionFeedProps) {
  return (
    <Card className="bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <h3 className="text-sm font-bold text-foreground tracking-tight">Exceptions</h3>
          <Badge variant="secondary" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 text-[10px] h-5 font-semibold">
            {items.filter((i) => i.severity === "critical").length} critical
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">{items.length} items</span>
      </div>

      <ScrollArea style={{ maxHeight }}>
        <div className="divide-y divide-border/50">
          {items.map((item) => {
            const Icon = TYPE_ICONS[item.type];
            return (
              <div
                key={item.id}
                className={`
                  flex items-center gap-4 px-5 py-3.5
                  ${SEVERITY_ROW[item.severity]}
                  hover:bg-accent/30 transition-all duration-200
                  group cursor-pointer
                `}
              >
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    item.severity === "critical"
                      ? "bg-red-500/10 dark:bg-red-500/20 text-red-500"
                      : "bg-amber-500/10 dark:bg-amber-500/20 text-amber-500"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-foreground font-medium truncate group-hover:text-primary transition-colors">
                    {item.description}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {item.timestamp}
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 font-semibold ${SEVERITY_STYLES[item.severity]}`}
                >
                  {item.severity}
                </Badge>

                {item.actionLabel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                  >
                    {item.actionLabel}
                    <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                )}
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No exceptions — all clear
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
