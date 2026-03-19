import { useAuth } from "@/_core/hooks/useAuth";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Users, TrendingUp, ClipboardCheck, AlertTriangle, Clock,
  CheckCircle2, Eye, Plus, Search
} from "lucide-react";

export default function Exceptions() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedException, setSelectedException] = useState<any>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  
  const { data: openExceptions, isLoading, refetch } = trpc.dashboard.openExceptions.useQuery();
  const { data: pendingApprovals } = trpc.dashboard.pendingApprovals.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();

  const resolveMutation = trpc.exceptions.resolve.useMutation({
    onSuccess: () => {
      toast.success("Exception resolved");
      setResolveDialogOpen(false);
      setSelectedException(null);
      setResolveNotes("");
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
    { label: "Employees", href: "/employees", icon: <Users className="h-4 w-4" /> },
    { label: "Approvals", href: "/approvals", icon: <ClipboardCheck className="h-4 w-4" />, badge: totalPending > 0 ? totalPending : undefined },
    { label: "Exceptions", href: "/exceptions", icon: <AlertTriangle className="h-4 w-4" />, badge: totalExceptions > 0 ? totalExceptions : undefined },
  ];

  if (user?.role === "admin") {
    navItems.push({ label: "Users", href: "/users", icon: <Users className="h-4 w-4" /> });
    navItems.push({ label: "Settings", href: "/settings", icon: <Clock className="h-4 w-4" /> });
  }

  const getEmployeeName = (employeeId: number) => {
    const emp = employees?.find(e => e.id === employeeId);
    return emp ? `${emp.legalFirstName} ${emp.legalLastName}` : `Employee #${employeeId}`;
  };

  const filteredExceptions = openExceptions?.filter(exception => {
    if (!searchQuery) return true;
    const employeeName = getEmployeeName(exception.employeeId).toLowerCase();
    return (
      employeeName.includes(searchQuery.toLowerCase()) ||
      exception.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exception.owner?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];

  const handleResolve = () => {
    if (!selectedException) return;
    resolveMutation.mutate({
      id: selectedException.id,
      notes: resolveNotes,
    });
  };

  const isOverdue = (dueDate: Date | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <AppShell 
      title="Exceptions"
    >
      <div className="space-y-6">
        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by employee, issue, or owner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <span className="text-sm text-slate-500">
                {filteredExceptions.length} open {filteredExceptions.length === 1 ? "exception" : "exceptions"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Exceptions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Open Exceptions
            </CardTitle>
            <CardDescription>Issues requiring attention before onboarding can proceed</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : filteredExceptions.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                <CheckCircle2 className="h-12 w-12 mb-4 text-emerald-300" />
                <p>No open exceptions</p>
                <p className="text-sm">All issues have been resolved</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExceptions.map((exception) => {
                  const overdue = isOverdue(exception.dueDate);
                  
                  return (
                    <div 
                      key={exception.id} 
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        overdue ? "border-red-200 bg-red-50" : "bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          overdue ? "bg-red-100" : "bg-amber-100"
                        }`}>
                          <AlertTriangle className={`h-5 w-5 ${overdue ? "text-red-600" : "text-amber-600"}`} />
                        </div>
                        <div>
                          <p className="font-medium">{exception.issue}</p>
                          <p className="text-sm text-slate-500">
                            {getEmployeeName(exception.employeeId)}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-400">
                              Owner: {exception.owner || "Unassigned"}
                            </span>
                            {exception.dueDate && (
                              <span className={`text-xs ${overdue ? "text-red-600 font-medium" : "text-slate-400"}`}>
                                Due: {new Date(exception.dueDate).toLocaleDateString()}
                                {overdue && " (Overdue)"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {overdue && (
                          <Badge className="bg-red-100 text-red-700">Overdue</Badge>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setLocation(`/employees/${exception.employeeId}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {(user?.role === "admin" || user?.role === "hr") && (
                          <Button 
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => {
                              setSelectedException(exception);
                              setResolveDialogOpen(true);
                            }}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resolve Dialog */}
        <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Exception</DialogTitle>
              <DialogDescription>
                Mark this exception as resolved for {selectedException && getEmployeeName(selectedException.employeeId)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="font-medium">{selectedException?.issue}</p>
              </div>
              <div>
                <Label>Resolution Notes</Label>
                <Textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Describe how this issue was resolved..."
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setResolveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleResolve}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={resolveMutation.isPending}
              >
                {resolveMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Mark Resolved
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
