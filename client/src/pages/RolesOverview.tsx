import AppShell from "@/components/AppShell";
import StatCard from "@/components/dashboard/StatCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ROLE_META, ROLE_PERMISSIONS, ROLE_NOTIFICATIONS, ROLE_SCORECARD,
  type AppRole, type ScorecardMetric,
} from "@shared/roles";
import { useState } from "react";
import {
  Shield, Users, CheckCircle2, XCircle, Minus, Bell,
  BarChart3, TrendingUp, TrendingDown, Lock, Unlock,
  type LucideIcon,
} from "lucide-react";

const ALL_ROLES: AppRole[] = ["admin", "hr", "supervisor", "compliance", "billing", "coordinator", "user"];

const ROLE_ICONS: Record<AppRole, string> = {
  admin: "A",
  hr: "HR",
  billing: "B",
  coordinator: "CC",
  supervisor: "S",
  compliance: "CO",
  user: "U",
};

function StatusDot({ status }: { status: ScorecardMetric["status"] }) {
  const colors = {
    good: "bg-emerald-500",
    warning: "bg-amber-500",
    critical: "bg-red-500",
  };
  return <div className={`h-2 w-2 rounded-full ${colors[status]}`} />;
}

function PermissionBadge({ enabled, label }: { enabled: boolean; label: string }) {
  return enabled ? (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">
      <Unlock className="h-3 w-3" /> {label}
    </div>
  ) : (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-400 text-xs">
      <Lock className="h-3 w-3" /> {label}
    </div>
  );
}

export default function RolesOverview() {
  const [activeRole, setActiveRole] = useState<AppRole>("admin");
  const meta = ROLE_META[activeRole];
  const permissions = ROLE_PERMISSIONS[activeRole];
  const notifications = ROLE_NOTIFICATIONS[activeRole];
  const scorecard = ROLE_SCORECARD[activeRole];

  // Mock users per role
  const mockUsers: Record<string, { name: string; email: string; lastLogin: string }[]> = {
    admin: [{ name: "Matt Faturoti", email: "matt@divinetouchhc.com", lastLogin: "2 min ago" }],
    hr: [{ name: "Jessica Williams", email: "jessica@divinetouchhc.com", lastLogin: "1 hour ago" }],
    billing: [{ name: "Tanya Richards", email: "tanya@divinetouchhc.com", lastLogin: "3 hours ago" }],
    coordinator: [{ name: "Dwayne Carter", email: "dwayne@divinetouchhc.com", lastLogin: "30 min ago" }],
    supervisor: [{ name: "Karen Lopez", email: "karen@divinetouchhc.com", lastLogin: "Yesterday" }],
    compliance: [{ name: "Angela Davis", email: "angela@divinetouchhc.com", lastLogin: "5 hours ago" }],
    user: [],
  };

  const usersInRole = mockUsers[activeRole] || [];

  return (
    <AppShell title="Users & Roles">
      <div className="space-y-6 max-w-[1200px]">
        {/* Role Tabs */}
        <div className="flex gap-2 flex-wrap">
          {ALL_ROLES.map((role) => {
            const m = ROLE_META[role];
            const isActive = activeRole === role;
            return (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all
                  ${isActive
                    ? `${m.bgColor} ${m.color} border-current ring-1 ring-current/20`
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }
                `}
              >
                <div className={`h-6 w-6 rounded text-[9px] font-bold flex items-center justify-center ${isActive ? "bg-current/10" : "bg-slate-100"}`}>
                  <span className={isActive ? m.color : "text-slate-400"}>{ROLE_ICONS[role]}</span>
                </div>
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Role Header */}
        <Card className={`${meta.bgColor} border-0 shadow-sm p-6`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className={`text-xl font-bold ${meta.color}`}>{meta.label}</h2>
                <Badge variant="outline" className={`text-[10px] ${meta.color} border-current`}>
                  {usersInRole.length} user{usersInRole.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 max-w-lg">{meta.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {meta.responsibilities.map((r) => (
                  <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 text-slate-600 border border-slate-200">
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <Shield className={`h-10 w-10 ${meta.color} opacity-30`} />
          </div>
        </Card>

        {/* 3 Sections */}
        <Tabs defaultValue="scorecard">
          <TabsList>
            <TabsTrigger value="scorecard">Role Scorecard</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="users">Users in Role</TabsTrigger>
          </TabsList>

          {/* ── Scorecard Tab ──────────────────────── */}
          <TabsContent value="scorecard" className="mt-4 space-y-4">
            <p className="text-sm text-slate-500">
              Live metrics showing how well this role's duties are being fulfilled.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scorecard.map((metric) => (
                <Card
                  key={metric.key}
                  className={`p-4 bg-white shadow-sm border-l-4 ${
                    metric.status === "good" ? "border-l-emerald-500"
                    : metric.status === "warning" ? "border-l-amber-500"
                    : "border-l-red-500"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">{metric.label}</p>
                      <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{metric.value}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {metric.target && (
                          <span className="text-[10px] text-slate-400">Target: {metric.target}</span>
                        )}
                        {metric.trend && (
                          <span className={`text-[10px] font-medium flex items-center gap-0.5 ${
                            metric.trend.direction === "up" ? "text-emerald-600" : "text-red-500"
                          }`}>
                            {metric.trend.direction === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {metric.trend.value}%
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusDot status={metric.status} />
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Permissions Tab ─────────────────────── */}
          <TabsContent value="permissions" className="mt-4 space-y-4">
            <p className="text-sm text-slate-500">
              Module-level access control. Toggle permissions for this role.
            </p>
            <Card className="bg-white shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Module</TableHead>
                    <TableHead className="text-center">Read</TableHead>
                    <TableHead className="text-center">Write</TableHead>
                    <TableHead className="text-center">Admin</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((perm) => (
                    <TableRow key={perm.module}>
                      <TableCell className="font-medium text-sm">{perm.label}</TableCell>
                      <TableCell className="text-center">
                        <Switch checked={perm.read} disabled={activeRole === "admin"} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={perm.write} disabled={activeRole === "admin"} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={perm.admin} disabled={activeRole === "admin"} />
                      </TableCell>
                      <TableCell className="text-center">
                        {perm.read || perm.write || perm.admin ? (
                          <PermissionBadge enabled={true} label={perm.admin ? "Full" : perm.write ? "Read/Write" : "Read Only"} />
                        ) : (
                          <PermissionBadge enabled={false} label="No Access" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            {activeRole === "admin" && (
              <p className="text-xs text-slate-400 italic">Admin permissions cannot be modified — full access to all modules.</p>
            )}
          </TabsContent>

          {/* ── Notifications Tab ──────────────────── */}
          <TabsContent value="notifications" className="mt-4 space-y-4">
            <p className="text-sm text-slate-500">
              Configure which push notifications and alerts this role receives.
            </p>
            <Card className="bg-white shadow-sm">
              <div className="divide-y divide-slate-100">
                {notifications.map((notif) => (
                  <div key={notif.key} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${notif.enabled ? "bg-emerald-50" : "bg-slate-100"}`}>
                        <Bell className={`h-4 w-4 ${notif.enabled ? "text-emerald-600" : "text-slate-400"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{notif.label}</p>
                        <p className="text-xs text-slate-500">{notif.description}</p>
                      </div>
                    </div>
                    <Switch checked={notif.enabled} />
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* ── Users Tab ──────────────────────────── */}
          <TabsContent value="users" className="mt-4 space-y-4">
            <p className="text-sm text-slate-500">
              People currently assigned to the <strong>{meta.label}</strong> role.
            </p>
            {usersInRole.length > 0 ? (
              <Card className="bg-white shadow-sm">
                <div className="divide-y divide-slate-100">
                  {usersInRole.map((u) => (
                    <div key={u.email} className="flex items-center gap-3 px-5 py-3.5">
                      <Avatar className="h-9 w-9 border">
                        <AvatarFallback className={`text-xs font-semibold ${meta.bgColor} ${meta.color}`}>
                          {u.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                      <span className="text-xs text-slate-400">Last login: {u.lastLogin}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="bg-white shadow-sm p-8 text-center">
                <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No users assigned to this role</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
