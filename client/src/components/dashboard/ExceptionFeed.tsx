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
  critical: "bg-red-50 text-red-700 border-red-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
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
    <Card className="bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-3.5 border-b">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Exceptions</h3>
          <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200 text-[10px] h-5">
            {items.filter((i) => i.severity === "critical").length} critical
          </Badge>
        </div>
        <span className="text-xs text-slate-400">{items.length} items</span>
      </div>

      <ScrollArea style={{ maxHeight }}>
        <div className="divide-y divide-slate-100">
          {items.map((item) => {
            const Icon = TYPE_ICONS[item.type];
            return (
              <div
                key={item.id}
                className="flex items-center gap-3.5 px-5 py-3 hover:bg-slate-50/50 transition-colors"
              >
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    item.severity === "critical"
                      ? "bg-red-50 text-red-500"
                      : "bg-amber-50 text-amber-500"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-slate-700 truncate">
                    {item.description}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {item.timestamp}
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 ${SEVERITY_STYLES[item.severity]}`}
                >
                  {item.severity}
                </Badge>

                {item.actionLabel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0"
                  >
                    {item.actionLabel}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-400">
              No exceptions — all clear
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
