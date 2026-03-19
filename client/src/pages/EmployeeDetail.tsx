import { useAuth } from "@/_core/hooks/useAuth";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import {
  Users, TrendingUp, ClipboardCheck, AlertTriangle, Clock,
  ArrowLeft, User, FileText, Shield, Briefcase, CheckCircle2,
  XCircle, History, ExternalLink, Edit2, Save, Send, Loader2, Ban, PenTool
} from "lucide-react";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentList from "@/components/DocumentList";

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

const GATE_DESCRIPTIONS: Record<string, string> = {
  HR_COMPLETENESS_REVIEW: "Review intake form for completeness and basic qualifications",
  PAY_RATE_START_DATE_APPROVAL: "Approve pay rate and proposed start date",
  CLEARANCES_VERIFICATION: "Verify all background clearances (PATCH, FBI, Child Abuse)",
  I9_VERIFICATION: "Complete I-9 verification and documentation",
  LICENSE_VERIFICATION: "Verify professional license for skilled roles",
  PAYROLL_VERIFICATION: "Confirm employee added to payroll system",
  EVV_HHA_VERIFICATION: "Confirm EVV/HHA profile created and verified",
  SUPERVISOR_READY_SIGNOFF: "Final sign-off that employee is ready for first shift",
};

/**
 * DocuSign Packets Card — interactive send/sign/void for Packet 1 & 2
 */
function DocuSignPacketsCard({ employee, employeeId, onRefresh, isHR }: {
  employee: any;
  employeeId: number;
  onRefresh: () => void;
  isHR: boolean;
}) {
  const sendPacket = trpc.docusign.sendPacket.useMutation({
    onSuccess: (data) => {
      toast.success(`Packet sent — envelope ${(data as any)?.envelopeId || ""}`);
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const voidEnvelope = trpc.docusign.voidEnvelope.useMutation({
    onSuccess: () => {
      toast.success("Envelope voided");
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });

  function PacketRow({ num, status, envelopeId, completedDate }: {
    num: 1 | 2;
    status: string | null;
    envelopeId: string | null;
    completedDate: string | null;
  }) {
    const isSent = !!envelopeId;
    const isCompleted = status === "Completed";
    const isDeclined = status === "Declined";
    const isSending = sendPacket.isPending;
    const isVoiding = voidEnvelope.isPending;

    return (
      <div className={`p-4 rounded-lg border ${isDeclined ? "border-red-500/30 bg-red-500/[0.04]" : ""}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Packet {num}</span>
          <Badge className={
            isCompleted ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
            isDeclined ? "bg-red-500/10 text-red-700 dark:text-red-400" :
            status === "Sent" || status === "Delivered" ? "bg-blue-500/10 text-blue-700 dark:text-blue-400" :
            "bg-muted text-muted-foreground"
          }>
            {status || "Not Sent"}
          </Badge>
        </div>
        {envelopeId && (
          <p className="text-xs font-mono text-muted-foreground mb-1 truncate" title={envelopeId}>
            Envelope: {envelopeId}
          </p>
        )}
        {completedDate && (
          <p className="text-xs text-muted-foreground mb-2">
            Completed: {new Date(completedDate).toLocaleDateString()}
          </p>
        )}

        {/* Action buttons */}
        {isHR && (
          <div className="flex gap-2 mt-3">
            {!isSent && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs"
                disabled={isSending}
                onClick={() => sendPacket.mutate({ employeeId, packetType: String(num) as "1" | "2" })}
              >
                {isSending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                Send Packet {num}
              </Button>
            )}
            {isSent && !isCompleted && !isDeclined && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    // Open signing URL in new tab
                    window.open(`/api/docusign/sign?envelopeId=${envelopeId}&employeeId=${employeeId}`, "_blank");
                  }}
                >
                  <PenTool className="h-3.5 w-3.5 mr-1" />
                  Preview / Sign
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-red-600 hover:text-red-700"
                  disabled={isVoiding}
                  onClick={() => {
                    if (confirm("Void this envelope? The signer will be notified.")) {
                      voidEnvelope.mutate({ envelopeId: envelopeId!, reason: "Voided by HR" });
                    }
                  }}
                >
                  {isVoiding ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Ban className="h-3.5 w-3.5 mr-1" />}
                  Void
                </Button>
              </>
            )}
            {(isDeclined) && (
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 h-7 text-xs"
                disabled={isSending}
                onClick={() => sendPacket.mutate({ employeeId, packetType: String(num) as "1" | "2" })}
              >
                {isSending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                Re-Send
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-4 w-4" />
          DocuSign Packets
        </CardTitle>
        <CardDescription>Employment agreements & consent packages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <PacketRow
          num={1}
          status={employee.dsPacket1Status}
          envelopeId={employee.dsPacket1EnvelopeId}
          completedDate={employee.dsPacket1CompletedDate}
        />
        <PacketRow
          num={2}
          status={employee.dsPacket2Status}
          envelopeId={employee.dsPacket2EnvelopeId}
          completedDate={employee.dsPacket2CompletedDate}
        />
        {employee.dsPacket1Status === "Completed" && employee.dsPacket2Status === "Completed" && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              Both packets complete — ready for HR completeness review
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function EmployeeDetail() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const employeeId = parseInt(params.id || "0");
  
  const [isEditing, setIsEditing] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  
  const { data: employee, isLoading, refetch } = trpc.employees.getById.useQuery({ id: employeeId });
  const { data: gates } = trpc.gates.getForEmployee.useQuery({ employeeId });
  const { data: auditLogs } = trpc.audit.getForEmployee.useQuery({ employeeId });
  const { data: exceptions } = trpc.exceptions.getForEmployee.useQuery({ employeeId });
  const { data: documents, refetch: refetchDocuments } = trpc.documents.getForEmployee.useQuery({ employeeId });
  const { data: pendingApprovals } = trpc.dashboard.pendingApprovals.useQuery();
  const { data: openExceptions } = trpc.dashboard.openExceptions.useQuery();
  
  // Payroll data queries
  const { data: taxInfo, refetch: refetchTaxInfo } = trpc.payrollExport.getTaxInfo.useQuery({ employeeId });
  const { data: directDeposits, refetch: refetchDirectDeposits } = trpc.payrollExport.getDirectDeposits.useQuery({ employeeId });
  const { data: compensation, refetch: refetchCompensation } = trpc.payrollExport.getCompensation.useQuery({ employeeId });
  const { data: benefits, refetch: refetchBenefits } = trpc.payrollExport.getBenefits.useQuery({ employeeId });

  const updateMutation = trpc.employees.update.useMutation({
    onSuccess: () => {
      toast.success("Employee updated successfully");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const approveMutation = trpc.gates.approve.useMutation({
    onSuccess: () => {
      toast.success("Gate approval updated");
      setApprovalDialogOpen(false);
      setSelectedGate(null);
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

  const handleApprove = (gateType: string, status: "Approved" | "Rejected") => {
    approveMutation.mutate({
      employeeId,
      gateType: gateType as any,
      status,
      notes: approvalNotes,
      rejectionReason: status === "Rejected" ? approvalNotes : undefined,
    });
  };

  const canApproveGate = (gateType: string) => {
    const gateRoleMap: Record<string, string[]> = {
      HR_COMPLETENESS_REVIEW: ["admin", "hr"],
      PAY_RATE_START_DATE_APPROVAL: ["admin", "hr"],
      CLEARANCES_VERIFICATION: ["admin", "compliance", "hr"],
      I9_VERIFICATION: ["admin", "hr"],
      LICENSE_VERIFICATION: ["admin", "compliance"],
      PAYROLL_VERIFICATION: ["admin", "hr"],
      EVV_HHA_VERIFICATION: ["admin", "hr"],
      SUPERVISOR_READY_SIGNOFF: ["admin", "supervisor", "hr"],
    };
    return gateRoleMap[gateType]?.includes(user?.role || "") || false;
  };

  if (isLoading) {
    return (
      <AppShell title="Employee Details">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </AppShell>
    );
  }

  if (!employee) {
    return (
      <AppShell title="Employee Not Found">
        <div className="h-64 flex flex-col items-center justify-center">
          <p className="text-muted-foreground mb-4">Employee not found</p>
          <Button onClick={() => setLocation("/employees")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Button>
        </div>
      </AppShell>
    );
  }

  const gateStatus = (gateType: string) => {
    const gate = gates?.find(g => g.gateType === gateType);
    return gate?.status || "Pending";
  };

  return (
    <AppShell 
      title={`${employee.legalFirstName} ${employee.legalLastName}`}
     
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setLocation("/employees")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {(user?.role === "admin" || user?.role === "hr") && (
            <Button 
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "default" : "outline"}
              className={isEditing ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
              {isEditing ? "Save" : "Edit"}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-600">
                    {employee.legalFirstName?.charAt(0)}{employee.legalLastName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {employee.legalFirstName} {employee.legalLastName}
                    {employee.preferredName && (
                      <span className="text-muted-foreground font-normal ml-2">({employee.preferredName})</span>
                    )}
                  </h2>
                  <p className="text-muted-foreground font-mono text-sm">{employee.employeeId}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{employee.serviceLine || "No Service Line"}</Badge>
                    <Badge variant="outline">{employee.roleAppliedFor || "No Role"}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Phase:</span>
                  <Badge className="bg-blue-100 text-blue-700">{employee.currentPhase}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className={employee.status === "Complete" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                    {employee.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Progress:</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${employee.completionPercent || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{employee.completionPercent || 0}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="gates" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="gates" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Gates
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Info
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="clearances" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Clearances
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="payroll" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Payroll
            </TabsTrigger>
          </TabsList>

          {/* Gates Tab */}
          <TabsContent value="gates">
            <Card>
              <CardHeader>
                <CardTitle>Human Gate Approvals</CardTitle>
                <CardDescription>8 approval gates required for complete onboarding</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {Object.entries(GATE_LABELS).map(([gateType, label]) => {
                    const status = gateStatus(gateType);
                    const gate = gates?.find(g => g.gateType === gateType);
                    const canApprove = canApproveGate(gateType);
                    
                    return (
                      <div key={gateType} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            status === "Approved" ? "bg-emerald-100" : 
                            status === "Rejected" ? "bg-red-100" : "bg-muted"
                          }`}>
                            {status === "Approved" ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            ) : status === "Rejected" ? (
                              <XCircle className="h-5 w-5 text-red-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{label}</p>
                            <p className="text-sm text-muted-foreground">{GATE_DESCRIPTIONS[gateType]}</p>
                            {gate?.approvedByName && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {status} by {gate.approvedByName} on {new Date(gate.approvedAt!).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            status === "Approved" ? "bg-emerald-100 text-emerald-700" :
                            status === "Rejected" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          }>
                            {status}
                          </Badge>
                          {canApprove && status === "Pending" && (
                            <Dialog open={approvalDialogOpen && selectedGate === gateType} onOpenChange={(open) => {
                              setApprovalDialogOpen(open);
                              if (open) setSelectedGate(gateType);
                            }}>
                              <DialogTrigger asChild>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                                  Review
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{label}</DialogTitle>
                                  <DialogDescription>{GATE_DESCRIPTIONS[gateType]}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div>
                                    <Label>Notes</Label>
                                    <Textarea
                                      value={approvalNotes}
                                      onChange={(e) => setApprovalNotes(e.target.value)}
                                      placeholder="Add any notes or comments..."
                                      className="mt-2"
                                    />
                                  </div>
                                </div>
                                <DialogFooter className="gap-2">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => handleApprove(gateType, "Rejected")}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                  <Button 
                                    onClick={() => handleApprove(gateType, "Approved")}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Info Tab */}
          <TabsContent value="info">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">First Name</Label>
                      <p className="font-medium">{employee.legalFirstName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Last Name</Label>
                      <p className="font-medium">{employee.legalLastName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Date of Birth</Label>
                      <p className="font-medium">{employee.dob ? new Date(employee.dob).toLocaleDateString() : "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">SSN (Last 4)</Label>
                      <p className="font-medium font-mono">***-**-{employee.ssnLast4 || "****"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p className="font-medium">{employee.phone || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{employee.email || "-"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Address</Label>
                    <p className="font-medium">
                      {employee.addressLine1 || "-"}<br />
                      {employee.city && `${employee.city}, `}{employee.state} {employee.zip}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Employment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Role Applied For</Label>
                      <p className="font-medium">{employee.roleAppliedFor || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Service Line</Label>
                      <p className="font-medium">{employee.serviceLine || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Hiring Source</Label>
                      <p className="font-medium">{employee.hiringSource || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Pay Rate</Label>
                      <p className="font-medium">{employee.payRate ? `$${employee.payRate}` : "-"} {employee.payType}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Proposed Start Date</Label>
                      <p className="font-medium">{employee.proposedStartDate ? new Date(employee.proposedStartDate).toLocaleDateString() : "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Active Date</Label>
                      <p className="font-medium">{employee.activeDate ? new Date(employee.activeDate).toLocaleDateString() : "-"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">HR Notes</Label>
                    <p className="text-sm mt-1">{employee.hrNotes || "No notes"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <div className="space-y-6">
              {/* Document Upload and List */}
              <div className="grid lg:grid-cols-2 gap-6">
                <DocumentUpload employeeId={employeeId} onUploadComplete={() => refetchDocuments()} />
                <DocumentList 
                  employeeId={employeeId} 
                  canReview={user?.role === "admin" || user?.role === "compliance" || user?.role === "hr"}
                  canDelete={user?.role === "admin" || user?.role === "hr"}
                  key={documents?.length}
                />
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="grid md:grid-cols-2 gap-6">
              <DocuSignPacketsCard employee={employee} employeeId={employeeId} onRefresh={refetch} isHR={user?.role === "admin" || user?.role === "hr"} />

              <Card>
                <CardHeader>
                  <CardTitle>Google Drive Folders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { label: "Employee Folder", url: employee.employeeFolderUrl },
                      { label: "Offer", url: employee.offerFolderUrl },
                      { label: "Application & Intake", url: employee.applicationIntakeFolderUrl },
                      { label: "I-9", url: employee.i9FolderUrl },
                      { label: "Background", url: employee.backgroundFolderUrl },
                      { label: "Documentation", url: employee.documentationFolderUrl },
                      { label: "Medical", url: employee.medicalFolderUrl },
                      { label: "Training", url: employee.trainingFolderUrl },
                      { label: "Payroll", url: employee.payrollFolderUrl },
                      { label: "EVV/HHA", url: employee.evvHhaFolderUrl },
                    ].map(folder => (
                      <div key={folder.label} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm">{folder.label}</span>
                        {folder.url ? (
                          <a href={folder.url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not set</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clearances Tab */}
          <TabsContent value="clearances">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Background Clearances</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "PATCH", received: employee.patchReceived, date: employee.patchDate },
                    { label: "FBI", received: employee.fbiReceived, date: employee.fbiDate },
                    { label: "Child Abuse", received: employee.childAbuseReceived, date: employee.childAbuseDate },
                  ].map(clearance => (
                    <div key={clearance.label} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {clearance.received ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium">{clearance.label}</p>
                          {clearance.date && (
                            <p className="text-sm text-muted-foreground">
                              Received: {new Date(clearance.date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className={clearance.received ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                        {clearance.received ? "Received" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Certifications & Verifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {employee.i9Complete ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">I-9 Verification</p>
                        {employee.i9VerifiedBy && (
                          <p className="text-sm text-muted-foreground">
                            Verified by {employee.i9VerifiedBy}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={employee.i9Complete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                      {employee.i9Complete ? "Complete" : "Pending"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {employee.physicalTbComplete ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">Physical / TB Test</p>
                        {employee.physicalTbDate && (
                          <p className="text-sm text-muted-foreground">
                            Completed: {new Date(employee.physicalTbDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={employee.physicalTbComplete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                      {employee.physicalTbComplete ? "Complete" : "Pending"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {employee.cprComplete ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">CPR Certification</p>
                        {employee.cprExpDate && (
                          <p className="text-sm text-muted-foreground">
                            Expires: {new Date(employee.cprExpDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={employee.cprComplete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                      {employee.cprComplete ? "Complete" : "Pending"}
                    </Badge>
                  </div>

                  {employee.serviceLine === "Skilled" && (
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {employee.licenseVerified ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium">Professional License</p>
                          {employee.licenseNumber && (
                            <p className="text-sm text-muted-foreground">
                              #{employee.licenseNumber} - Exp: {employee.licenseExpDate ? new Date(employee.licenseExpDate).toLocaleDateString() : "N/A"}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className={employee.licenseVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                        {employee.licenseVerified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>Complete history of changes to this employee record</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogs && auditLogs.length > 0 ? (
                  <div className="space-y-4">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg border">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <History className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{log.action}</p>
                            <span className="text-sm text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            By {log.userName || "System"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    No audit history available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payroll Tab */}
          <TabsContent value="payroll">
            <div className="grid gap-6">
              {/* Tax Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Tax Information</CardTitle>
                  <CardDescription>W-2/1099 and withholding information for payroll</CardDescription>
                </CardHeader>
                <CardContent>
                  {taxInfo ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Tax Classification</Label>
                        <p className="font-medium">{taxInfo.taxClassification || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">SSN</Label>
                        <p className="font-medium">{taxInfo.ssnFull ? '***-**-' + taxInfo.ssnFull.slice(-4) : 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Federal Filing Status</Label>
                        <p className="font-medium">{taxInfo.federalFilingStatus || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Federal Allowances</Label>
                        <p className="font-medium">{taxInfo.federalAllowances ?? 0}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Work State</Label>
                        <p className="font-medium">{taxInfo.workState || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">State Filing Status</Label>
                        <p className="font-medium">{taxInfo.stateFilingStatus || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">W-4 Received</Label>
                        <p className="font-medium">{taxInfo.w4ReceivedDate ? new Date(taxInfo.w4ReceivedDate).toLocaleDateString() : 'No'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Federal Exempt</Label>
                        <p className="font-medium">{taxInfo.federalExempt ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No tax information on file</p>
                      <p className="text-sm">Tax information will be added during payroll setup</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Compensation */}
              <Card>
                <CardHeader>
                  <CardTitle>Compensation</CardTitle>
                  <CardDescription>Pay rate, employment type, and overtime settings</CardDescription>
                </CardHeader>
                <CardContent>
                  {compensation ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Employment Type</Label>
                        <p className="font-medium">{compensation.employmentType || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">FLSA Status</Label>
                        <p className="font-medium">{compensation.flsaStatus || 'Non-Exempt'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Pay Rate</Label>
                        <p className="font-medium">${compensation.payRate || employee?.payRate || '0.00'}/{compensation.payType === 'Salary' ? 'yr' : 'hr'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Pay Frequency</Label>
                        <p className="font-medium">{compensation.payFrequency || 'Bi-Weekly'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Overtime Eligible</Label>
                        <p className="font-medium">{compensation.overtimeEligible ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Overtime Rate</Label>
                        <p className="font-medium">{compensation.overtimeRate || '1.5'}x</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Department</Label>
                        <p className="font-medium">{compensation.departmentCode || employee?.serviceLine || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Effective Date</Label>
                        <p className="font-medium">{compensation.effectiveDate ? new Date(compensation.effectiveDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Pay Rate</Label>
                        <p className="font-medium">${employee?.payRate || '0.00'}/{employee?.payType === 'Salary' ? 'yr' : 'hr'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Pay Type</Label>
                        <p className="font-medium">{employee?.payType || 'Hourly'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Additional compensation details will be added during payroll setup</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Direct Deposit */}
              <Card>
                <CardHeader>
                  <CardTitle>Direct Deposit</CardTitle>
                  <CardDescription>Bank account information for payroll deposits</CardDescription>
                </CardHeader>
                <CardContent>
                  {directDeposits && directDeposits.length > 0 ? (
                    <div className="space-y-4">
                      {directDeposits.map((deposit, index) => (
                        <div key={deposit.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={deposit.isPrimary ? 'default' : 'secondary'}>
                                {deposit.isPrimary ? 'Primary' : `Account ${index + 1}`}
                              </Badge>
                              <span className="font-medium">{deposit.bankName || 'Bank Account'}</span>
                            </div>
                            <Badge variant="outline">{deposit.accountType}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <Label className="text-xs text-muted-foreground">Routing Number</Label>
                              <p>****{deposit.routingNumber?.slice(-4) || '****'}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Account Number</Label>
                              <p>****{deposit.accountNumber?.slice(-4) || '****'}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Deposit Type</Label>
                              <p>{deposit.depositType} {deposit.depositPercent ? `(${deposit.depositPercent}%)` : ''}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No direct deposit information on file</p>
                      <p className="text-sm">Bank information will be collected during payroll setup</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle>Benefits</CardTitle>
                  <CardDescription>Health insurance, 401k, and other benefits enrollment</CardDescription>
                </CardHeader>
                <CardContent>
                  {benefits && benefits.length > 0 ? (
                    <div className="space-y-3">
                      {benefits.map((benefit) => (
                        <div key={benefit.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{benefit.benefitType}</p>
                            <p className="text-sm text-muted-foreground">{benefit.planName || 'Standard Plan'}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={benefit.enrollmentStatus === 'Enrolled' ? 'default' : 'secondary'}>
                              {benefit.enrollmentStatus}
                            </Badge>
                            {benefit.employeeContribution && (
                              <p className="text-sm text-muted-foreground mt-1">
                                ${benefit.employeeContribution}/{benefit.contributionFrequency || 'period'}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No benefits enrolled</p>
                      <p className="text-sm">Benefits enrollment available after onboarding completion</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
