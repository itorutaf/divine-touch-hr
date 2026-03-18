import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Users, TrendingUp, ClipboardCheck, AlertTriangle, Clock,
  CheckCircle2, XCircle, Eye, Filter
} from "lucide-react";

const GATE_LABELS: Record<string, string> = {
  HR_COMPLETENESS_REVIEW: "HR Completeness Review",
  PAY_RATE_START_DATE_APPROVAL: "Pay Rate / Start Date Approval",
  CLEARANCES_VERIFICATION: "Clearances Verification",
  I9_VERIFICATION: "I-9 Verification",
  LICENSE_VERIFICATION: "License Verification",
  PAYROLL_VERIFICATION: "Payroll Verification",
  EVV_HHA_VERIFICATION: "EVV/HHA Verification",
  SUPERVISOR_READY_SIGNOFF: "Supervisor Ready Sign-off",
};

const GATE_ROLE_MAP: Record<string, string[]> = {
  HR_COMPLETENESS_REVIEW: ["admin", "hr"],
  PAY_RATE_START_DATE_APPROVAL: ["admin", "hr"],
  CLEARANCES_VERIFICATION: ["admin", "compliance", "hr"],
  I9_VERIFICATION: ["admin", "hr"],
  LICENSE_VERIFICATION: ["admin", "compliance"],
  PAYROLL_VERIFICATION: ["admin", "hr"],
  EVV_HHA_VERIFICATION: ["admin", "hr"],
  SUPERVISOR_READY_SIGNOFF: ["admin", "supervisor", "hr"],
};

export default function Approvals() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [gateFilter, setGateFilter] = useState("all");
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  
  const { data: pendingApprovals, isLoading, refetch } = trpc.dashboard.pendingApprovals.useQuery();
  const { data: openExceptions } = trpc.dashboard.openExceptions.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();

  const approveMutation = trpc.gates.approve.useMutation({
    onSuccess: () => {
      toast.success("Approval updated successfully");
      setSelectedApproval(null);
      setApprovalNotes("");
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

  const canApproveGate = (gateType: string) => {
    return GATE_ROLE_MAP[gateType]?.includes(user?.role || "") || false;
  };

  const filteredApprovals = pendingApprovals?.filter(approval => {
    if (gateFilter === "all") return true;
    if (gateFilter === "my") return canApproveGate(approval.gateType);
    return approval.gateType === gateFilter;
  }) || [];

  const getEmployeeName = (employeeId: number) => {
    const emp = employees?.find(e => e.id === employeeId);
    return emp ? `${emp.legalFirstName} ${emp.legalLastName}` : `Employee #${employeeId}`;
  };

  const handleApprove = (status: "Approved" | "Rejected") => {
    if (!selectedApproval) return;
    
    approveMutation.mutate({
      employeeId: selectedApproval.employeeId,
      gateType: selectedApproval.gateType,
      status,
      notes: approvalNotes,
      rejectionReason: status === "Rejected" ? approvalNotes : undefined,
    });
  };

  return (
    <DashboardLayout 
      title="Pending Approvals"
      navItems={navItems}
    >
      <div className="space-y-6">
        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-slate-400" />
              <Select value={gateFilter} onValueChange={setGateFilter}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Filter by gate type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pending Approvals</SelectItem>
                  <SelectItem value="my">My Approvals Only</SelectItem>
                  {Object.entries(GATE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-slate-500">
                {filteredApprovals.length} {filteredApprovals.length === 1 ? "approval" : "approvals"} pending
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Approvals List */}
        <Card>
          <CardHeader>
            <CardTitle>Approval Queue</CardTitle>
            <CardDescription>Review and approve employee onboarding gates</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : filteredApprovals.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                <CheckCircle2 className="h-12 w-12 mb-4 text-emerald-300" />
                <p>No pending approvals</p>
                <p className="text-sm">All gates are up to date</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApprovals.map((approval) => {
                  const canApprove = canApproveGate(approval.gateType);
                  
                  return (
                    <div 
                      key={approval.id} 
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        canApprove ? "bg-white hover:bg-slate-50" : "bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium">{GATE_LABELS[approval.gateType]}</p>
                          <p className="text-sm text-slate-500">
                            {getEmployeeName(approval.employeeId)}
                          </p>
                          <p className="text-xs text-slate-400">
                            Created: {new Date(approval.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!canApprove && (
                          <Badge variant="outline" className="text-slate-500">
                            Not Authorized
                          </Badge>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setLocation(`/employees/${approval.employeeId}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {canApprove && (
                          <Button 
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => setSelectedApproval(approval)}
                          >
                            Review
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

        {/* Approval Dialog */}
        <Dialog open={!!selectedApproval} onOpenChange={(open) => !open && setSelectedApproval(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedApproval && GATE_LABELS[selectedApproval.gateType]}
              </DialogTitle>
              <DialogDescription>
                Review and approve or reject this gate for {selectedApproval && getEmployeeName(selectedApproval.employeeId)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Notes / Comments</Label>
                <Textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes or rejection reason..."
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleApprove("Rejected")}
                className="text-red-600 hover:text-red-700"
                disabled={approveMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button 
                onClick={() => handleApprove("Approved")}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
