import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Building2, Phone, Mail, MapPin, User, FileCheck, TrendingUp,
  DollarSign, Clock, Edit, Download, ArrowLeft, Heart, Shield,
} from "lucide-react";
import { useLocation } from "wouter";

const SERVICE_LINE_STYLES: Record<string, string> = {
  OLTL: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  ODP: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Skilled: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
};

// Mock client data
const CLIENT = {
  id: 1, firstName: "Patricia", lastName: "Moore", dob: "1948-06-15",
  phone: "(215) 555-0142", email: "patricia.moore@email.com",
  address: "1234 Walnut St, Philadelphia, PA 19107",
  county: "Philadelphia", serviceLine: "OLTL", region: 4, status: "active",
  mco: "UPMC Community HealthChoices", mcoId: "CHC-2024-4892",
  referralSource: "Temple University Hospital",
  serviceCoordinator: "Lisa Chen", scPhone: "(215) 555-8901", scEmail: "lchen@upmc.com",
  emergencyName: "David Moore", emergencyPhone: "(215) 555-0199", emergencyRelation: "Son",
  startDate: "2024-09-15", coordinator: "Matt F.",
  hoursPerWeek: 30, serviceType: "PAS (CSLA)",
};

const AUTHORIZATIONS = [
  { id: 1, serviceType: "PAS (CSLA)", authHours: 30, delivered: 22, utilization: 73, start: "2025-10-01", end: "2026-09-30", status: "active" },
];

const PROFITABILITY = {
  weeklyRevenue: 658.08, weeklyProfit: 240.62, grossMargin: 43,
  monthlyRevenue: 2849.49, monthlyProfit: 1041.87,
  ltvCacRatio: 4.2, recommendation: "YES",
};

const CAREGIVERS = [
  { id: 1, name: "Maria Santos", role: "PCA", hoursPerWeek: 20, payRate: 12.5, status: "active" },
  { id: 2, name: "Fatima Ali", role: "PCA", hoursPerWeek: 10, payRate: 12.5, status: "active" },
];

const ACTIVITY = [
  { id: 1, action: "Authorization renewed for 2025-2026", user: "Matt F.", date: "2025-10-01" },
  { id: 2, action: "Caregiver Maria Santos assigned", user: "Matt F.", date: "2024-10-05" },
  { id: 3, action: "Client onboarded — status changed to active", user: "System", date: "2024-09-15" },
  { id: 4, action: "Referral received from Temple University Hospital", user: "System", date: "2024-09-01" },
];

export default function ClientDetail() {
  const [, setLocation] = useLocation();

  return (
    <AppShell
      title="Client Detail"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setLocation("/clients")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-1" /> Edit</Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Baseball Card</Button>
        </div>
      }
    >
      <div className="space-y-6 max-w-[1440px]">
        {/* Header */}
        <Card className="bg-card shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <User className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-foreground">{CLIENT.firstName} {CLIENT.lastName}</h2>
                  <Badge variant="outline" className={SERVICE_LINE_STYLES[CLIENT.serviceLine]}>{CLIENT.serviceLine}</Badge>
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">{CLIENT.status}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{CLIENT.phone}</span>
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{CLIENT.email}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Region {CLIENT.region} · {CLIENT.county}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">MCO</p>
              <p className="text-sm font-medium text-foreground">{CLIENT.mco}</p>
              <p className="text-xs text-muted-foreground mt-1">ID: {CLIENT.mcoId}</p>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 border-l-4 border-l-emerald-500 bg-card shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Hours/Week</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{CLIENT.hoursPerWeek}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-blue-500 bg-card shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Monthly Revenue</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">${PROFITABILITY.monthlyRevenue.toLocaleString()}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-emerald-500 bg-card shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Gross Margin</p>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">{PROFITABILITY.grossMargin}%</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-amber-500 bg-card shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Auth Utilization</p>
            <p className="text-2xl font-bold text-amber-600 tabular-nums">73%</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="authorizations">Authorizations</TabsTrigger>
            <TabsTrigger value="caregivers">Caregivers</TabsTrigger>
            <TabsTrigger value="profitability">Profitability</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Personal Information</CardTitle></CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Full Name</span><span className="font-medium">{CLIENT.firstName} {CLIENT.lastName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Date of Birth</span><span>{CLIENT.dob}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{CLIENT.phone}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{CLIENT.email}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="text-right max-w-[200px]">{CLIENT.address}</span></div>
                </CardContent>
              </Card>
              <Card className="bg-card shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Service Information</CardTitle></CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Service Line</span><Badge variant="outline" className={`text-[10px] ${SERVICE_LINE_STYLES[CLIENT.serviceLine]}`}>{CLIENT.serviceLine}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Service Type</span><span>{CLIENT.serviceType}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Region</span><span>Region {CLIENT.region} — Southeast PA</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">MCO</span><span>{CLIENT.mco}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Start Date</span><span>{CLIENT.startDate}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Referral Source</span><span>{CLIENT.referralSource}</span></div>
                </CardContent>
              </Card>
              <Card className="bg-card shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Service Coordinator</CardTitle></CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{CLIENT.serviceCoordinator}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{CLIENT.scPhone}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{CLIENT.scEmail}</span></div>
                </CardContent>
              </Card>
              <Card className="bg-card shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Emergency Contact</CardTitle></CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{CLIENT.emergencyName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{CLIENT.emergencyPhone}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Relation</span><span>{CLIENT.emergencyRelation}</span></div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="authorizations" className="mt-4">
            <Card className="bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Type</TableHead>
                    <TableHead className="text-right">Auth Hrs/Wk</TableHead>
                    <TableHead className="text-right">Delivered</TableHead>
                    <TableHead className="w-[150px]">Utilization</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {AUTHORIZATIONS.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.serviceType}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{a.authHours}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.delivered}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={a.utilization} className="h-2 flex-1" />
                          <span className="text-xs font-semibold tabular-nums text-amber-600">{a.utilization}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.start} — {a.end}</TableCell>
                      <TableCell><Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px]">{a.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="caregivers" className="mt-4">
            <Card className="bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caregiver</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Hours/Wk</TableHead>
                    <TableHead className="text-right">Pay Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CAREGIVERS.map((cg) => (
                    <TableRow key={cg.id}>
                      <TableCell className="font-medium">{cg.name}</TableCell>
                      <TableCell>{cg.role}</TableCell>
                      <TableCell className="text-right tabular-nums">{cg.hoursPerWeek}</TableCell>
                      <TableCell className="text-right tabular-nums font-mono">${cg.payRate.toFixed(2)}</TableCell>
                      <TableCell><Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px]">{cg.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="profitability" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Weekly Revenue", value: `$${PROFITABILITY.weeklyRevenue}`, color: "text-foreground" },
                { label: "Weekly Profit", value: `$${PROFITABILITY.weeklyProfit}`, color: "text-emerald-600" },
                { label: "LTV:CAC", value: `${PROFITABILITY.ltvCacRatio}:1`, color: "text-emerald-600" },
                { label: "Recommendation", value: PROFITABILITY.recommendation, color: "text-emerald-600" },
              ].map((m) => (
                <Card key={m.label} className="p-4 bg-card shadow-sm text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{m.label}</p>
                  <p className={`text-xl font-bold tabular-nums mt-1 ${m.color}`}>{m.value}</p>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <Card className="bg-card shadow-sm">
              <div className="divide-y divide-border">
                {ACTIVITY.map((a) => (
                  <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                    <p className="text-[13px] text-foreground flex-1">{a.action}</p>
                    <span className="text-[11px] text-muted-foreground">{a.user}</span>
                    <span className="text-[11px] text-muted-foreground">{a.date}</span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
