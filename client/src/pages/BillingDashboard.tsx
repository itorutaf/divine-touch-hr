import AppShell from "@/components/AppShell";
import StatCard from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DollarSign, Receipt, TrendingUp, AlertCircle, Clock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const AGING_DATA = [
  { bucket: "0-30 days", amount: 45200, count: 28, color: "#10B981" },
  { bucket: "31-60 days", amount: 12800, count: 8, color: "#F59E0B" },
  { bucket: "61-90 days", amount: 5400, count: 4, color: "#F97316" },
  { bucket: "90+ days", amount: 2100, count: 2, color: "#EF4444" },
];

const REVENUE_TREND = [
  { month: "Oct", revenue: 72000, collected: 68000 },
  { month: "Nov", revenue: 75200, collected: 71000 },
  { month: "Dec", revenue: 72200, collected: 69500 },
  { month: "Jan", revenue: 81400, collected: 76200 },
  { month: "Feb", revenue: 84700, collected: 80100 },
  { month: "Mar", revenue: 90300, collected: 82000 },
];

const MOCK_CLAIMS = [
  { id: "CLM-2401", client: "Patricia Moore", mco: "UPMC CHC", amount: 2850, status: "paid" as const, date: "2026-03-01" },
  { id: "CLM-2402", client: "Robert Chen", mco: "AmeriHealth", amount: 3420, status: "pending" as const, date: "2026-03-05" },
  { id: "CLM-2403", client: "Helen Washington", mco: "PA H&W", amount: 2100, status: "denied" as const, date: "2026-02-28" },
  { id: "CLM-2404", client: "James Rodriguez", mco: "UPMC CHC", amount: 1560, status: "submitted" as const, date: "2026-03-10" },
  { id: "CLM-2405", client: "Dorothy Kim", mco: "AmeriHealth", amount: 1680, status: "paid" as const, date: "2026-02-25" },
  { id: "CLM-2406", client: "Susan Davis", mco: "PA H&W", amount: 2940, status: "pending" as const, date: "2026-03-08" },
];

const CLAIM_STATUS_STYLES = {
  submitted: "bg-blue-50 text-blue-700",
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  denied: "bg-red-50 text-red-700",
};

export default function BillingDashboard() {
  return (
    <AppShell title="Billing Overview">
      <div className="space-y-4 max-w-[1440px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Monthly Revenue" value="$90,300" icon={DollarSign} accentColor="emerald" trend={{ value: 6.6, direction: "up", label: "vs prior" }} />
          <StatCard title="Outstanding Claims" value="$65,500" icon={Receipt} accentColor="blue" />
          <StatCard title="Collection Rate" value="94.2%" icon={TrendingUp} accentColor="emerald" trend={{ value: 1.1, direction: "up" }} />
          <StatCard title="Denied Claims" value="3" icon={AlertCircle} accentColor="red" subtitle="$7,500 total" />
        </div>

        <Tabs defaultValue="claims">
          <TabsList>
            <TabsTrigger value="claims">Claims Tracker</TabsTrigger>
            <TabsTrigger value="aging">Aging Report</TabsTrigger>
            <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="claims" className="mt-4">
            <Card className="bg-white shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>MCO</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_CLAIMS.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.id}</TableCell>
                      <TableCell className="font-medium text-sm">{c.client}</TableCell>
                      <TableCell className="text-sm text-slate-600">{c.mco}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">${c.amount.toLocaleString()}</TableCell>
                      <TableCell><Badge className={`text-[10px] ${CLAIM_STATUS_STYLES[c.status]}`}>{c.status}</Badge></TableCell>
                      <TableCell className="text-xs text-slate-500">{c.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="aging" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-white shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Claims by Age Bucket</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={AGING_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="bucket" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Amount"]} />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {AGING_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card className="bg-white shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Aging Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={AGING_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="amount" nameKey="bucket">
                      {AGING_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [`$${v.toLocaleString()}`, undefined]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {AGING_DATA.map((d) => (
                    <div key={d.bucket} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-slate-500">{d.bucket}</span>
                      <span className="font-medium tabular-nums">{d.count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="mt-4">
            <Card className="bg-white shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Revenue vs Collections (6 months)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={REVENUE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`$${v.toLocaleString()}`, undefined]} />
                  <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="collected" name="Collected" stroke="#2E75B6" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
