import AppShell from "@/components/AppShell";
import StatCard from "@/components/dashboard/StatCard";
import ExceptionFeed, { type ExceptionItem } from "@/components/dashboard/ExceptionFeed";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, DollarSign, ShieldCheck } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ── Mock Data ────────────────────────────────────────────────────────

const REVENUE_TREND = [
  { month: "Oct", oltl: 42000, odp: 18000, skilled: 12000 },
  { month: "Nov", oltl: 44500, odp: 19200, skilled: 11800 },
  { month: "Dec", oltl: 41200, odp: 17800, skilled: 13200 },
  { month: "Jan", oltl: 46800, odp: 20100, skilled: 14500 },
  { month: "Feb", oltl: 48200, odp: 21300, skilled: 15200 },
  { month: "Mar", oltl: 51400, odp: 22800, skilled: 16100 },
];

const PIPELINE_DATA = [
  { stage: "Applied", count: 8 },
  { stage: "Docs Pending", count: 5 },
  { stage: "Clearances", count: 12 },
  { stage: "Credentialing", count: 4 },
  { stage: "Payroll/EVV", count: 3 },
  { stage: "Pending Approval", count: 2 },
  { stage: "Active", count: 47 },
];

const AGING_DATA = [
  { name: "0-30 days", value: 45200, color: "#10B981" },
  { name: "31-60 days", value: 12800, color: "#F59E0B" },
  { name: "61-90 days", value: 5400, color: "#F97316" },
  { name: "90+ days", value: 2100, color: "#EF4444" },
];

const EXCEPTIONS: ExceptionItem[] = [
  { id: "1", type: "expired_clearance", description: "Maria Santos — FBI clearance expired 3 days ago", timestamp: "2 hours ago", severity: "critical", actionLabel: "Review" },
  { id: "2", type: "stuck_onboarding", description: "James Wilson — stuck in Documentation phase for 12 days", timestamp: "4 hours ago", severity: "critical", actionLabel: "View" },
  { id: "3", type: "denied_claim", description: "Claim #4892 denied by UPMC CHC — auth mismatch", timestamp: "Yesterday", severity: "critical", actionLabel: "Work Denial" },
  { id: "4", type: "approaching_expiration", description: "4 workers have clearances expiring within 30 days", timestamp: "Today", severity: "warning", actionLabel: "View All" },
  { id: "5", type: "evv_below_threshold", description: "EVV auto-verification rate dropped to 83% this week", timestamp: "Today", severity: "warning", actionLabel: "View Details" },
  { id: "6", type: "approaching_expiration", description: "Client auth for Patricia Moore expires in 14 days", timestamp: "Yesterday", severity: "warning", actionLabel: "Renew" },
  { id: "7", type: "stuck_onboarding", description: "Aisha Patel — pending ChildLine clearance for 8 days", timestamp: "3 hours ago", severity: "warning", actionLabel: "Follow Up" },
];

// ── Component ────────────────────────────────────────────────────────

export default function ExecutiveDashboard() {
  return (
    <AppShell title="Executive Dashboard">
      <div className="space-y-6 max-w-[1440px]">
        {/* Row 1: Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Clients"
            value="47"
            icon={Users}
            trend={{ value: 8.3, direction: "up", label: "vs last month" }}
            accentColor="emerald"
          />
          <StatCard
            title="Active Caregivers"
            value="62"
            icon={UserCheck}
            trend={{ value: 4.1, direction: "up", label: "vs last month" }}
            accentColor="blue"
          />
          <StatCard
            title="Monthly Revenue"
            value="$90,300"
            subtitle="MTD"
            icon={DollarSign}
            trend={{ value: 12.7, direction: "up", label: "vs prior month" }}
            accentColor="emerald"
          />
          <StatCard
            title="Compliance Score"
            value="94%"
            icon={ShieldCheck}
            trend={{ value: 1.2, direction: "down" }}
            accentColor="amber"
          />
        </div>

        {/* Row 2: Revenue Trend + Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Revenue Trend */}
          <Card className="lg:col-span-3 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Revenue Trend
              </h3>
              <span className="text-xs text-slate-400">Last 6 months</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={REVENUE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingBottom: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="oltl"
                  name="OLTL"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: "#10B981" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="odp"
                  name="ODP"
                  stroke="#2E75B6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#2E75B6" }}
                />
                <Line
                  type="monotone"
                  dataKey="skilled"
                  name="Skilled"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#8B5CF6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Pipeline Summary */}
          <Card className="lg:col-span-2 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Worker Pipeline
              </h3>
              <Badge variant="secondary" className="text-[10px] h-5">
                {PIPELINE_DATA.reduce((s, d) => s + d.count, 0)} total
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={PIPELINE_DATA} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis
                  type="category"
                  dataKey="stage"
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Row 3: Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Auth Utilization */}
          <Card className="bg-white shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Authorization Utilization
            </h3>
            <p className="text-xs text-slate-400 mb-4">Authorized vs delivered hours</p>
            <div className="flex items-center justify-center">
              <div className="relative">
                <ResponsiveContainer width={160} height={100}>
                  <PieChart>
                    <Pie
                      data={[
                        { value: 87 },
                        { value: 13 },
                      ]}
                      cx="50%"
                      cy="100%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-x-0 bottom-1 text-center">
                  <span className="text-2xl font-bold text-slate-900 tabular-nums">87%</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-center text-slate-400 mt-2">Target: 90%+</p>
          </Card>

          {/* EVV Compliance */}
          <Card className="bg-white shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              EVV Compliance
            </h3>
            <p className="text-xs text-slate-400 mb-4">Auto-verified visit rate</p>
            <div className="flex items-center justify-center">
              <div className="relative">
                <ResponsiveContainer width={160} height={100}>
                  <PieChart>
                    <Pie
                      data={[
                        { value: 83 },
                        { value: 17 },
                      ]}
                      cx="50%"
                      cy="100%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      <Cell fill="#F59E0B" />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-x-0 bottom-1 text-center">
                  <span className="text-2xl font-bold text-amber-600 tabular-nums">83%</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-center text-red-500 font-medium mt-2">
              Below 85% threshold
            </p>
          </Card>

          {/* Billing Aging */}
          <Card className="bg-white shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Billing Aging
            </h3>
            <p className="text-xs text-slate-400 mb-4">Outstanding claims by age</p>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width={160} height={120}>
                <PieChart>
                  <Pie
                    data={AGING_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {AGING_DATA.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 6 }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
              {AGING_DATA.map((d) => (
                <div key={d.name} className="flex items-center gap-1">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ background: d.color }}
                  />
                  <span className="text-[10px] text-slate-500">{d.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Row 4: Exception Feed */}
        <ExceptionFeed items={EXCEPTIONS} />
      </div>
    </AppShell>
  );
}
