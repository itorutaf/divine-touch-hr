import { useAuth } from "@/_core/hooks/useAuth";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { 
  Users, UserPlus, ClipboardCheck, AlertTriangle, 
  ArrowRight, TrendingUp, Clock, CheckCircle2,
  FileWarning, Calendar, AlertCircle, FileText, Settings,
  Download, DollarSign
} from "lucide-react";

const PHASES = [
  { key: "Intake", label: "Intake", color: "bg-muted0" },
  { key: "Screening", label: "Screening", color: "bg-amber-500" },
  { key: "Documentation", label: "Documentation", color: "bg-blue-500" },
  { key: "Verification", label: "Verification", color: "bg-purple-500" },
  { key: "Provisioning", label: "Provisioning", color: "bg-indigo-500" },
  { key: "Ready to Schedule", label: "Ready to Schedule", color: "bg-cyan-500" },
  { key: "Active", label: "Active", color: "bg-emerald-500" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: pipelineStats, isLoading: statsLoading } = trpc.dashboard.pipelineStats.useQuery();
  const { data: pendingApprovals, isLoading: approvalsLoading } = trpc.dashboard.pendingApprovals.useQuery();
  const { data: openExceptions, isLoading: exceptionsLoading } = trpc.dashboard.openExceptions.useQuery();
  const { data: expiringDocs, isLoading: expiringLoading } = trpc.dashboard.expiringDocumentsSummary.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();

  const totalEmployees = employees?.length || 0;
  const totalPending = pendingApprovals?.length || 0;
  const totalExceptions = openExceptions?.length || 0;
  const activeCount = (pipelineStats as Record<string, number>)?.["Active"] || 0;

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Employees", href: "/employees", icon: <Users className="h-4 w-4" /> },
    { label: "Timesheets", href: "/timesheets", icon: <FileText className="h-4 w-4" /> },
    { label: "Approvals", href: "/approvals", icon: <ClipboardCheck className="h-4 w-4" />, badge: totalPending > 0 ? totalPending : undefined },
    { label: "Exceptions", href: "/exceptions", icon: <AlertTriangle className="h-4 w-4" />, badge: totalExceptions > 0 ? totalExceptions : undefined },
  ];

  // Payroll section - visible to HR and Admin
  if (user?.role === "admin" || user?.role === "hr") {
    navItems.push({ label: "Payroll Reports", href: "/payroll-reports", icon: <DollarSign className="h-4 w-4" /> });
    navItems.push({ label: "Payroll Export", href: "/payroll-export", icon: <Download className="h-4 w-4" /> });
  }

  if (user?.role === "admin") {
    navItems.push({ label: "Users", href: "/users", icon: <Users className="h-4 w-4" /> });
    navItems.push({ label: "Settings", href: "/settings", icon: <Settings className="h-4 w-4" /> });
  }

  return (
    <AppShell 
      title="Dashboard" 
      actions={
        <Button onClick={() => setLocation("/employees/new")} className="bg-emerald-600 hover:bg-emerald-700">
          <UserPlus className="h-4 w-4 mr-2" />
          New Employee
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees}</div>
              <p className="text-xs text-muted-foreground">In onboarding pipeline</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Employees</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
              <p className="text-xs text-muted-foreground">Fully onboarded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{totalPending}</div>
              <p className="text-xs text-muted-foreground">Awaiting action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Exceptions</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{totalExceptions}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Expiring Documents Widget */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-amber-500" />
                <CardTitle>Document Expiration Alerts</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLocation("/settings")}>
                <Calendar className="h-4 w-4 mr-2" />
                Manage Notifications
              </Button>
            </div>
            <CardDescription>Monitor employee documents approaching expiration</CardDescription>
          </CardHeader>
          <CardContent>
            {expiringLoading ? (
              <div className="h-24 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Expired - Critical */}
                <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-red-500 to-red-600 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">Expired</p>
                      <p className="text-3xl font-bold">{expiringDocs?.expired || 0}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 opacity-50" />
                  </div>
                  <div className="mt-2 text-xs opacity-75">Immediate action required</div>
                  <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-white/10"></div>
                </div>

                {/* 7 Days - Urgent */}
                <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">7 Days</p>
                      <p className="text-3xl font-bold">{expiringDocs?.expiring7Days || 0}</p>
                    </div>
                    <Clock className="h-8 w-8 opacity-50" />
                  </div>
                  <div className="mt-2 text-xs opacity-75">Urgent attention needed</div>
                  <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-white/10"></div>
                </div>

                {/* 14 Days - Warning */}
                <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">14 Days</p>
                      <p className="text-3xl font-bold">{expiringDocs?.expiring14Days || 0}</p>
                    </div>
                    <Calendar className="h-8 w-8 opacity-50" />
                  </div>
                  <div className="mt-2 text-xs opacity-75">Plan renewal soon</div>
                  <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-white/10"></div>
                </div>

                {/* 30 Days - Notice */}
                <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">30 Days</p>
                      <p className="text-3xl font-bold">{expiringDocs?.expiring30Days || 0}</p>
                    </div>
                    <FileWarning className="h-8 w-8 opacity-50" />
                  </div>
                  <div className="mt-2 text-xs opacity-75">Upcoming expirations</div>
                  <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-white/10"></div>
                </div>
              </div>
            )}

            {/* Expiring Documents List */}
            {expiringDocs && (expiringDocs.expired > 0 || expiringDocs.expiring7Days > 0) && (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium text-foreground mb-3">Documents Requiring Immediate Attention</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {/* Expired Documents */}
                  {expiringDocs.documents?.expired?.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{doc.documentName}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.employeeName} • {doc.category}
                          </p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        Expired {new Date(doc.expirationDate).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                  
                  {/* 7-Day Expiring Documents */}
                  {expiringDocs.documents?.expiring7Days?.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-orange-50 border border-orange-200">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{doc.documentName}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.employeeName} • {doc.category}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                        Expires {new Date(doc.expirationDate).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Pipeline</CardTitle>
            <CardDescription>Employee distribution across phases</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
              </div>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto pb-4">
                {PHASES.map((phase, index) => {
                  const count = (pipelineStats as Record<string, number>)?.[phase.key] || 0;
                  return (
                    <div key={phase.key} className="flex items-center">
                      <button
                        onClick={() => setLocation(`/employees?phase=${encodeURIComponent(phase.key)}`)}
                        className="flex flex-col items-center p-4 rounded-lg border border-border hover:border-emerald-300 hover:bg-emerald-500/10 transition-colors min-w-[120px]"
                      >
                        <div className={`h-3 w-3 rounded-full ${phase.color} mb-2`}></div>
                        <span className="text-2xl font-bold">{count}</span>
                        <span className="text-xs text-muted-foreground text-center">{phase.label}</span>
                      </button>
                      {index < PHASES.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground mx-1 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Approvals */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pending Approvals</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setLocation("/approvals")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {approvalsLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                </div>
              ) : pendingApprovals && pendingApprovals.length > 0 ? (
                <div className="space-y-3">
                  {pendingApprovals.slice(0, 5).map((approval) => (
                    <div key={approval.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div>
                        <p className="font-medium text-sm">
                          {approval.gateType.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">Employee ID: {approval.employeeId}</p>
                      </div>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  No pending approvals
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open Exceptions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Open Exceptions</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setLocation("/exceptions")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {exceptionsLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                </div>
              ) : openExceptions && openExceptions.length > 0 ? (
                <div className="space-y-3">
                  {openExceptions.slice(0, 5).map((exception) => (
                    <div key={exception.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div>
                        <p className="font-medium text-sm truncate max-w-[200px]">
                          {exception.issue}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Owner: {exception.owner || "Unassigned"}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
                        Open
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  No open exceptions
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
