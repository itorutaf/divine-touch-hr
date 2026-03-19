import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { ArrowRight, TrendingUp, TrendingDown, Minus, DollarSign } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

const MOCK_CLIENTS = [
  {
    id: "1", name: "Patricia Moore", serviceLine: "OLTL", region: 4,
    weeklyRevenue: 658, weeklyProfit: 241, grossMargin: 43, ltvCacRatio: 4.2,
    breakEven: 2.8, churnRisk: 50, fitScore: 80, profitScore: 78,
    recommendation: "YES", hoursPerWeek: 30, payRate: 12.50, reimbRate: 21.92,
  },
  {
    id: "2", name: "Robert Chen", serviceLine: "ODP", region: 4,
    weeklyRevenue: 946, weeklyProfit: 312, grossMargin: 39, ltvCacRatio: 5.1,
    breakEven: 2.1, churnRisk: 35, fitScore: 100, profitScore: 85,
    recommendation: "STRONG_YES", hoursPerWeek: 40, payRate: 13.00, reimbRate: 23.67,
  },
  {
    id: "3", name: "Helen Washington", serviceLine: "OLTL", region: 4,
    weeklyRevenue: 548, weeklyProfit: 178, grossMargin: 38, ltvCacRatio: 3.1,
    breakEven: 3.9, churnRisk: 60, fitScore: 60, profitScore: 55,
    recommendation: "MAYBE", hoursPerWeek: 25, payRate: 12.50, reimbRate: 21.92,
  },
  {
    id: "4", name: "James Rodriguez", serviceLine: "Skilled", region: 4,
    weeklyRevenue: 662, weeklyProfit: 286, grossMargin: 43, ltvCacRatio: 2.8,
    breakEven: 4.2, churnRisk: 45, fitScore: 80, profitScore: 68,
    recommendation: "YES", hoursPerWeek: 15, payRate: 25.00, reimbRate: 44.08,
  },
];

const REC_STYLES: Record<string, { bg: string; label: string }> = {
  STRONG_YES: { bg: "bg-emerald-100 text-emerald-800", label: "Strong Yes" },
  YES: { bg: "bg-emerald-50 text-emerald-700", label: "Yes" },
  MAYBE: { bg: "bg-amber-50 text-amber-700", label: "Maybe" },
  CAUTION: { bg: "bg-orange-50 text-orange-700", label: "Caution" },
  HARD_NO: { bg: "bg-red-50 text-red-700", label: "Hard No" },
};

function MetricRow({ label, valueA, valueB, format = "number", higherIsBetter = true }: {
  label: string; valueA: number; valueB: number; format?: "number" | "currency" | "percent" | "ratio" | "months"; higherIsBetter?: boolean;
}) {
  const fmt = (v: number) => {
    if (format === "currency") return `$${v.toLocaleString()}`;
    if (format === "percent") return `${v}%`;
    if (format === "ratio") return `${v.toFixed(1)}:1`;
    if (format === "months") return `${v.toFixed(1)} mo`;
    return v.toString();
  };

  const diff = valueA - valueB;
  const winner = higherIsBetter ? (diff > 0 ? "A" : diff < 0 ? "B" : "tie") : (diff < 0 ? "A" : diff > 0 ? "B" : "tie");

  return (
    <div className="flex items-center py-2.5 border-b border-slate-100 last:border-0">
      <span className={`w-[120px] tabular-nums text-sm font-medium text-right pr-4 ${winner === "A" ? "text-emerald-600" : "text-slate-700"}`}>
        {fmt(valueA)}
      </span>
      <span className="flex-1 text-center text-xs text-slate-500 font-medium">{label}</span>
      <span className={`w-[120px] tabular-nums text-sm font-medium text-left pl-4 ${winner === "B" ? "text-emerald-600" : "text-slate-700"}`}>
        {fmt(valueB)}
      </span>
    </div>
  );
}

export default function ClientComparison() {
  const [clientA, setClientA] = useState(MOCK_CLIENTS[0]);
  const [clientB, setClientB] = useState(MOCK_CLIENTS[1]);

  const radarData = [
    { metric: "Margin", A: clientA.grossMargin, B: clientB.grossMargin },
    { metric: "LTV:CAC", A: Math.min(clientA.ltvCacRatio * 20, 100), B: Math.min(clientB.ltvCacRatio * 20, 100) },
    { metric: "Fit", A: clientA.fitScore, B: clientB.fitScore },
    { metric: "Stability", A: 100 - clientA.churnRisk, B: 100 - clientB.churnRisk },
    { metric: "Score", A: clientA.profitScore, B: clientB.profitScore },
  ];

  const barData = [
    { metric: "Revenue/wk", A: clientA.weeklyRevenue, B: clientB.weeklyRevenue },
    { metric: "Profit/wk", A: clientA.weeklyProfit, B: clientB.weeklyProfit },
  ];

  const recA = REC_STYLES[clientA.recommendation];
  const recB = REC_STYLES[clientB.recommendation];

  return (
    <AppShell title="Client Comparison">
      <div className="space-y-4 max-w-[1200px]">
        {/* Client Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-white shadow-sm border-l-4 border-l-emerald-500">
            <Select value={clientA.id} onValueChange={(v) => setClientA(MOCK_CLIENTS.find((c) => c.id === v)!)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MOCK_CLIENTS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-[10px]">{clientA.serviceLine}</Badge>
              <Badge className={`text-[10px] ${recA.bg}`}>{recA.label}</Badge>
              <span className="text-xs text-slate-400">Score: {clientA.profitScore}</span>
            </div>
          </Card>
          <Card className="p-4 bg-white shadow-sm border-l-4 border-l-blue-500">
            <Select value={clientB.id} onValueChange={(v) => setClientB(MOCK_CLIENTS.find((c) => c.id === v)!)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MOCK_CLIENTS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-[10px]">{clientB.serviceLine}</Badge>
              <Badge className={`text-[10px] ${recB.bg}`}>{recB.label}</Badge>
              <span className="text-xs text-slate-400">Score: {clientB.profitScore}</span>
            </div>
          </Card>
        </div>

        {/* Side-by-side metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-white shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 text-center">Head-to-Head</h3>
            <div className="flex items-center justify-between px-4 mb-2">
              <span className="text-xs font-medium text-emerald-600">{clientA.name}</span>
              <span className="text-xs font-medium text-blue-600">{clientB.name}</span>
            </div>
            <MetricRow label="Weekly Revenue" valueA={clientA.weeklyRevenue} valueB={clientB.weeklyRevenue} format="currency" />
            <MetricRow label="Weekly Profit" valueA={clientA.weeklyProfit} valueB={clientB.weeklyProfit} format="currency" />
            <MetricRow label="Gross Margin" valueA={clientA.grossMargin} valueB={clientB.grossMargin} format="percent" />
            <MetricRow label="LTV:CAC" valueA={clientA.ltvCacRatio} valueB={clientB.ltvCacRatio} format="ratio" />
            <MetricRow label="Break-Even" valueA={clientA.breakEven} valueB={clientB.breakEven} format="months" higherIsBetter={false} />
            <MetricRow label="Churn Risk" valueA={clientA.churnRisk} valueB={clientB.churnRisk} format="percent" higherIsBetter={false} />
            <MetricRow label="Fit Score" valueA={clientA.fitScore} valueB={clientB.fitScore} format="percent" />
            <MetricRow label="Hours/Week" valueA={clientA.hoursPerWeek} valueB={clientB.hoursPerWeek} />
            <MetricRow label="Reimb. Rate" valueA={clientA.reimbRate} valueB={clientB.reimbRate} format="currency" />
          </Card>

          <Card className="bg-white shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 text-center">Profile Comparison</h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name={clientA.name} dataKey="A" stroke="#10B981" fill="#10B981" fillOpacity={0.15} strokeWidth={2} />
                <Radar name={clientB.name} dataKey="B" stroke="#2E75B6" fill="#2E75B6" fillOpacity={0.15} strokeWidth={2} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Revenue comparison bar */}
        <Card className="bg-white shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Weekly Financial Comparison</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="metric" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`$${v}`, undefined]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="A" name={clientA.name} fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="B" name={clientB.name} fill="#2E75B6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </AppShell>
  );
}
