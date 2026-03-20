import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { trpc } from "@/lib/trpc";

const REC_STYLES: Record<string, { bg: string; label: string }> = {
  STRONG_YES: { bg: "bg-emerald-100 text-emerald-800", label: "Strong Yes" },
  YES: { bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", label: "Yes" },
  MAYBE: { bg: "bg-amber-500/10 text-amber-700 dark:text-amber-400", label: "Maybe" },
  CAUTION: { bg: "bg-orange-500/10 text-orange-700 dark:text-orange-400", label: "Caution" },
  HARD_NO: { bg: "bg-red-500/10 text-red-700 dark:text-red-400", label: "Hard No" },
  "N/A": { bg: "bg-muted text-muted-foreground", label: "N/A" },
};

function MetricRow({
  label,
  valueA,
  valueB,
  format = "number",
  higherIsBetter = true,
}: {
  label: string;
  valueA: number;
  valueB: number;
  format?: "number" | "currency" | "percent" | "ratio" | "months";
  higherIsBetter?: boolean;
}) {
  const fmt = (v: number) => {
    if (format === "currency") return `$${v.toLocaleString()}`;
    if (format === "percent") return `${v}%`;
    if (format === "ratio") return `${v.toFixed(1)}:1`;
    if (format === "months") return `${v.toFixed(1)} mo`;
    return v.toString();
  };

  const diff = valueA - valueB;
  const winner = higherIsBetter
    ? diff > 0
      ? "A"
      : diff < 0
        ? "B"
        : "tie"
    : diff < 0
      ? "A"
      : diff > 0
        ? "B"
        : "tie";

  return (
    <div className="flex items-center py-2.5 border-b border-border last:border-0">
      <span
        className={`w-[120px] tabular-nums text-sm font-medium text-right pr-4 ${winner === "A" ? "text-emerald-600" : "text-foreground"}`}
      >
        {fmt(valueA)}
      </span>
      <span className="flex-1 text-center text-xs text-muted-foreground font-medium">
        {label}
      </span>
      <span
        className={`w-[120px] tabular-nums text-sm font-medium text-left pl-4 ${winner === "B" ? "text-emerald-600" : "text-foreground"}`}
      >
        {fmt(valueB)}
      </span>
    </div>
  );
}

export default function ClientComparison() {
  const { data: comparisonData, isLoading } = trpc.clients.getForComparison.useQuery();
  const [selectedA, setSelectedA] = useState<string>("");
  const [selectedB, setSelectedB] = useState<string>("");

  const clients = comparisonData ?? [];

  // Auto-select first two clients once data loads
  const clientA = useMemo(() => {
    if (selectedA) return clients.find((c) => c.id === selectedA);
    return clients[0];
  }, [clients, selectedA]);

  const clientB = useMemo(() => {
    if (selectedB) return clients.find((c) => c.id === selectedB);
    return clients[1];
  }, [clients, selectedB]);

  if (isLoading) {
    return (
      <AppShell title="Client Comparison">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading comparison data...</span>
        </div>
      </AppShell>
    );
  }

  if (clients.length < 2) {
    return (
      <AppShell title="Client Comparison">
        <Card className="p-8 text-center text-muted-foreground">
          <p className="text-sm">Need at least 2 active clients with profitability data to compare.</p>
          <p className="text-xs mt-2">Run the Profitability Calculator for your clients first.</p>
        </Card>
      </AppShell>
    );
  }

  if (!clientA || !clientB) return null;

  const recA = REC_STYLES[clientA.recommendation] || REC_STYLES["N/A"];
  const recB = REC_STYLES[clientB.recommendation] || REC_STYLES["N/A"];

  const radarData = [
    { metric: "Margin", A: clientA.grossMargin, B: clientB.grossMargin },
    { metric: "Score", A: clientA.profitScore, B: clientB.profitScore },
    {
      metric: "Revenue",
      A: Math.min((clientA.weeklyRevenue / Math.max(clientA.weeklyRevenue, clientB.weeklyRevenue)) * 100, 100),
      B: Math.min((clientB.weeklyRevenue / Math.max(clientA.weeklyRevenue, clientB.weeklyRevenue)) * 100, 100),
    },
    {
      metric: "Profit",
      A: Math.min((clientA.weeklyProfit / Math.max(clientA.weeklyProfit, clientB.weeklyProfit)) * 100, 100),
      B: Math.min((clientB.weeklyProfit / Math.max(clientA.weeklyProfit, clientB.weeklyProfit)) * 100, 100),
    },
  ];

  const barData = [
    { metric: "Revenue/wk", A: clientA.weeklyRevenue, B: clientB.weeklyRevenue },
    { metric: "Profit/wk", A: clientA.weeklyProfit, B: clientB.weeklyProfit },
  ];

  return (
    <AppShell title="Client Comparison">
      <div className="space-y-4 max-w-[1200px]">
        {/* Client Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-card shadow-sm border-l-4 border-l-emerald-500">
            <Select
              value={clientA.id}
              onValueChange={(v) => setSelectedA(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-[10px]">
                {clientA.serviceLine}
              </Badge>
              <Badge className={`text-[10px] ${recA.bg}`}>{recA.label}</Badge>
              <span className="text-xs text-muted-foreground">
                Score: {clientA.profitScore}
              </span>
            </div>
          </Card>
          <Card className="p-4 bg-card shadow-sm border-l-4 border-l-blue-500">
            <Select
              value={clientB.id}
              onValueChange={(v) => setSelectedB(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-[10px]">
                {clientB.serviceLine}
              </Badge>
              <Badge className={`text-[10px] ${recB.bg}`}>{recB.label}</Badge>
              <span className="text-xs text-muted-foreground">
                Score: {clientB.profitScore}
              </span>
            </div>
          </Card>
        </div>

        {/* Side-by-side metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card shadow-sm p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 text-center">
              Head-to-Head
            </h3>
            <div className="flex items-center justify-between px-4 mb-2">
              <span className="text-xs font-medium text-emerald-600">
                {clientA.name}
              </span>
              <span className="text-xs font-medium text-blue-600">
                {clientB.name}
              </span>
            </div>
            <MetricRow
              label="Weekly Revenue"
              valueA={clientA.weeklyRevenue}
              valueB={clientB.weeklyRevenue}
              format="currency"
            />
            <MetricRow
              label="Weekly Profit"
              valueA={clientA.weeklyProfit}
              valueB={clientB.weeklyProfit}
              format="currency"
            />
            <MetricRow
              label="Gross Margin"
              valueA={clientA.grossMargin}
              valueB={clientB.grossMargin}
              format="percent"
            />
            <MetricRow
              label="Profit Score"
              valueA={clientA.profitScore}
              valueB={clientB.profitScore}
            />
          </Card>

          <Card className="bg-card shadow-sm p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 text-center">
              Profile Comparison
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name={clientA.name}
                  dataKey="A"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Radar
                  name={clientB.name}
                  dataKey="B"
                  stroke="#2E75B6"
                  fill="#2E75B6"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Revenue comparison bar */}
        <Card className="bg-card shadow-sm p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Weekly Financial Comparison
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="metric" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v: number) => [`$${v}`, undefined]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
              />
              <Bar
                dataKey="A"
                name={clientA.name}
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="B"
                name={clientB.name}
                fill="#2E75B6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </AppShell>
  );
}
