import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { 
  Users as UsersIcon, TrendingUp, ClipboardCheck, AlertTriangle, Clock,
  Shield
} from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  hr: "bg-blue-100 text-blue-700",
  supervisor: "bg-purple-100 text-purple-700",
  compliance: "bg-amber-100 text-amber-700",
  user: "bg-slate-100 text-slate-700",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: "Full system access, can manage users and settings",
  hr: "Can create employees, approve HR gates, manage onboarding",
  supervisor: "Can approve supervisor sign-off gate",
  compliance: "Can verify clearances and licenses",
  user: "View-only access to employee records",
};

export default function Users() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: users, isLoading, refetch } = trpc.users.list.useQuery();
  const { data: pendingApprovals } = trpc.dashboard.pendingApprovals.useQuery();
  const { data: openExceptions } = trpc.dashboard.openExceptions.useQuery();

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const totalPending = pendingApprovals?.length || 0;
  const totalExceptions = openExceptions?.length || 0;

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Employees", href: "/employees", icon: <UsersIcon className="h-4 w-4" /> },
    { label: "Approvals", href: "/approvals", icon: <ClipboardCheck className="h-4 w-4" />, badge: totalPending > 0 ? totalPending : undefined },
    { label: "Exceptions", href: "/exceptions", icon: <AlertTriangle className="h-4 w-4" />, badge: totalExceptions > 0 ? totalExceptions : undefined },
  ];

  if (user?.role === "admin") {
    navItems.push({ label: "Users", href: "/users", icon: <UsersIcon className="h-4 w-4" /> });
    navItems.push({ label: "Settings", href: "/settings", icon: <Clock className="h-4 w-4" /> });
  }

  // Redirect non-admins
  if (user?.role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  const handleRoleChange = (userId: number, newRole: string) => {
    updateRoleMutation.mutate({
      userId,
      role: newRole as "user" | "admin" | "hr" | "supervisor" | "compliance",
    });
  };

  return (
    <DashboardLayout 
      title="User Management"
      navItems={navItems}
    >
      <div className="space-y-6">
        {/* Role Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(ROLE_DESCRIPTIONS).map(([role, description]) => (
                <div key={role} className="p-3 rounded-lg border">
                  <Badge className={ROLE_COLORS[role]}>{role.toUpperCase()}</Badge>
                  <p className="text-sm text-slate-500 mt-2">{description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>System Users</CardTitle>
            <CardDescription>Manage user roles and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : !users || users.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                <UsersIcon className="h-12 w-12 mb-4 text-slate-300" />
                <p>No users found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead>Change Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name || "-"}</TableCell>
                      <TableCell>{u.email || "-"}</TableCell>
                      <TableCell>
                        <Badge className={ROLE_COLORS[u.role || "user"]}>
                          {(u.role || "user").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={u.role || "user"} 
                          onValueChange={(value) => handleRoleChange(u.id, value)}
                          disabled={u.id === user?.id}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="hr">HR</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="compliance">Compliance</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
