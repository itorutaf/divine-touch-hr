import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    label?: string;
  };
  accentColor?: "emerald" | "blue" | "amber" | "red" | "slate";
}

const ACCENT_STYLES = {
  emerald: {
    border: "border-l-emerald-500",
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
    trendUp: "text-emerald-600",
    trendDown: "text-red-500",
  },
  blue: {
    border: "border-l-blue-500",
    iconBg: "bg-blue-50",
    iconText: "text-blue-600",
    trendUp: "text-emerald-600",
    trendDown: "text-red-500",
  },
  amber: {
    border: "border-l-amber-500",
    iconBg: "bg-amber-50",
    iconText: "text-amber-600",
    trendUp: "text-emerald-600",
    trendDown: "text-red-500",
  },
  red: {
    border: "border-l-red-500",
    iconBg: "bg-red-50",
    iconText: "text-red-600",
    trendUp: "text-red-500",
    trendDown: "text-emerald-600",
  },
  slate: {
    border: "border-l-slate-400",
    iconBg: "bg-slate-50",
    iconText: "text-slate-600",
    trendUp: "text-emerald-600",
    trendDown: "text-red-500",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = "emerald",
}: StatCardProps) {
  const styles = ACCENT_STYLES[accentColor];

  const TrendIcon =
    trend?.direction === "up"
      ? TrendingUp
      : trend?.direction === "down"
        ? TrendingDown
        : Minus;

  const trendColor =
    trend?.direction === "up"
      ? styles.trendUp
      : trend?.direction === "down"
        ? styles.trendDown
        : "text-slate-400";

  return (
    <Card
      className={`relative border-l-4 ${styles.border} bg-white p-5 shadow-sm hover:shadow transition-shadow`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[12px] font-medium uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {value}
          </p>
          {(trend || subtitle) && (
            <div className="flex items-center gap-2 pt-0.5">
              {trend && (
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}
                >
                  <TrendIcon className="h-3 w-3" />
                  {Math.abs(trend.value)}%
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-slate-400">{subtitle}</span>
              )}
              {trend?.label && (
                <span className="text-xs text-slate-400">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={`h-10 w-10 rounded-lg ${styles.iconBg} flex items-center justify-center shrink-0`}
        >
          <Icon className={`h-5 w-5 ${styles.iconText}`} />
        </div>
      </div>
    </Card>
  );
}
