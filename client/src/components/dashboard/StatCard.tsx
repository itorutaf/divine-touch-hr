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
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    iconText: "text-emerald-600 dark:text-emerald-400",
    trendUp: "text-emerald-600 dark:text-emerald-400",
    trendDown: "text-red-500",
    glow: "hover:shadow-emerald-500/5",
  },
  blue: {
    border: "border-l-blue-500",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
    iconText: "text-blue-600 dark:text-blue-400",
    trendUp: "text-emerald-600 dark:text-emerald-400",
    trendDown: "text-red-500",
    glow: "hover:shadow-blue-500/5",
  },
  amber: {
    border: "border-l-amber-500",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    iconText: "text-amber-600 dark:text-amber-400",
    trendUp: "text-emerald-600 dark:text-emerald-400",
    trendDown: "text-red-500",
    glow: "hover:shadow-amber-500/5",
  },
  red: {
    border: "border-l-red-500",
    iconBg: "bg-red-500/10 dark:bg-red-500/20",
    iconText: "text-red-600 dark:text-red-400",
    trendUp: "text-red-500",
    trendDown: "text-emerald-600",
    glow: "hover:shadow-red-500/5",
  },
  slate: {
    border: "border-l-slate-400 dark:border-l-slate-500",
    iconBg: "bg-muted",
    iconText: "text-muted-foreground",
    trendUp: "text-emerald-600 dark:text-emerald-400",
    trendDown: "text-red-500",
    glow: "hover:shadow-slate-500/5",
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
        : "text-muted-foreground";

  return (
    <Card
      className={`
        relative overflow-hidden border-l-[5px] ${styles.border} bg-card p-5
        shadow-sm hover:shadow-lg ${styles.glow}
        transition-all duration-300 ease-out
        hover:-translate-y-0.5
        group
      `}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/[0.02] pointer-events-none" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {title}
          </p>
          <p className="text-[28px] font-extrabold tracking-tight text-foreground tabular-nums leading-none">
            {value}
          </p>
          {(trend || subtitle) && (
            <div className="flex items-center gap-2 pt-1">
              {trend && (
                <span
                  className={`flex items-center gap-0.5 text-xs font-semibold ${trendColor}`}
                >
                  <TrendIcon className="h-3.5 w-3.5" />
                  {Math.abs(trend.value)}%
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-muted-foreground">{subtitle}</span>
              )}
              {trend?.label && (
                <span className="text-xs text-muted-foreground">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={`h-11 w-11 rounded-xl ${styles.iconBg} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className={`h-5 w-5 ${styles.iconText}`} />
        </div>
      </div>
    </Card>
  );
}
