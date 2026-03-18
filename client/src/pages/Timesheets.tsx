import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Users, TrendingUp, ClipboardCheck, AlertTriangle, 
  Clock, FileText, Upload, Download, Calendar,
  CheckCircle2, XCircle, Eye, Plus, Settings
} from "lucide-react";

export default function Timesheets() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedPayPeriod, setSelectedPayPeriod] = useState<number | null>(null);
  const [showNewPeriodDialog, setShowNewPeriodDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  
  // Form state for new pay period
  const [newPeriod, setNewPeriod] = useState({
    periodName: "",
    startDate: "",
    endDate: "",
    timesheetDueDate: "",
  });
  
  // Queries
  const { data: payPeriods, isLoading: periodsLoading, refetch: refetchPeriods } = trpc.timesheets.listPayPeriods.useQuery();
  const { data: activePayPeriod } = trpc.timesheets.getActivePayPeriod.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();
  const { data: templates } = trpc.timesheets.listTemplates.useQuery();
  
  const currentPeriodId = selectedPayPeriod || activePayPeriod?.id;
  
  const { data: timesheets, refetch: refetchTimesheets } = trpc.timesheets.list.useQuery(
    { payPeriodId: currentPeriodId! },
    { enabled: !!currentPeriodId }
  );
  
  const { data: stats } = trpc.timesheets.getStats.useQuery(
    { payPeriodId: currentPeriodId! },
    { enabled: !!currentPeriodId }
  );
  
  const { data: missingTimesheets } = trpc.timesheets.getMissingTimesheets.useQuery(
    { payPeriodId: currentPeriodId! },
    { enabled: !!currentPeriodId }
  );
  
  // Mutations
  const createPayPeriodMutation = trpc.timesheets.createPayPeriod.useMutation({
    onSuccess: () => {
      toast.success("Pay period created successfully");
      setShowNewPeriodDialog(false);
      setNewPeriod({ periodName: "", startDate: "", endDate: "", timesheetDueDate: "" });
      refetchPeriods();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const updatePayPeriodMutation = trpc.timesheets.updatePayPeriod.useMutation({
    onSuccess: () => {
      toast.success("Pay period updated");
      refetchPeriods();
    },
  });
  
  const approveTimesheetMutation = trpc.timesheets.approve.useMutation({
    onSuccess: () => {
      toast.success("Timesheet approved");
      refetchTimesheets();
    },
  });
  
  const rejectTimesheetMutation = trpc.timesheets.reject.useMutation({
    onSuccess: () => {
      toast.success("Timesheet returned for correction");
      refetchTimesheets();
    },
  });
  
  const sendReminderMutation = trpc.timesheets.sendReminder.useMutation({
    onSuccess: () => {
      toast.success("Reminder sent successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const runReminderCheckMutation = trpc.timesheets.runReminderCheck.useMutation({
    onSuccess: (result) => {
      if (result.employeesNotified > 0) {
        toast.success(`Reminders sent for ${result.employeesNotified} employees`);
      } else {
        toast.info("No reminders needed");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const isHROrAdmin = user?.role === "admin" || user?.role === "hr";
  const isSupervisor = user?.role === "supervisor" || user?.role === "admin" || user?.role === "hr";
  
  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Employees", href: "/employees", icon: <Users className="h-4 w-4" /> },
    { label: "Timesheets", href: "/timesheets", icon: <FileText className="h-4 w-4" /> },
    { label: "Approvals", href: "/approvals", icon: <ClipboardCheck className="h-4 w-4" /> },
    { label: "Exceptions", href: "/exceptions", icon: <AlertTriangle className="h-4 w-4" /> },
  ];

  if (user?.role === "admin") {
    navItems.push({ label: "Users", href: "/users", icon: <Users className="h-4 w-4" /> });
    navItems.push({ label: "Settings", href: "/settings", icon: <Settings className="h-4 w-4" /> });
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      draft: { variant: "secondary", className: "bg-slate-100 text-slate-700" },
      submitted: { variant: "default", className: "bg-blue-100 text-blue-700" },
      pending_review: { variant: "default", className: "bg-amber-100 text-amber-700" },
      approved: { variant: "default", className: "bg-emerald-100 text-emerald-700" },
      rejected: { variant: "destructive", className: "bg-red-100 text-red-700" },
      needs_correction: { variant: "destructive", className: "bg-orange-100 text-orange-700" },
    };
    const config = variants[status] || variants.draft;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  return (
    <DashboardLayout 
      title="Timesheets" 
      navItems={navItems}
      actions={
        isHROrAdmin && (
          <Button onClick={() => setShowNewPeriodDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            New Pay Period
          </Button>
        )
      }
    >
      <div className="space-y-6">
        {/* Pay Period Selector */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pay Period</CardTitle>
                <CardDescription>Select a pay period to view timesheets</CardDescription>
              </div>
              <Select 
                value={currentPeriodId?.toString() || ""} 
                onValueChange={(v) => setSelectedPayPeriod(parseInt(v))}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Select pay period" />
                </SelectTrigger>
                <SelectContent>
                  {payPeriods?.map((period) => (
                    <SelectItem key={period.id} value={period.id.toString()}>
                      {period.periodName} {period.status === "active" && "(Active)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Submitted</CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Approved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{stats.approved}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card className={stats.missing > 0 ? "border-red-200 bg-red-50" : ""}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Missing</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.missing > 0 ? "text-red-600" : ""}`}>
                  {stats.missing}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="submitted" className="space-y-4">
          <TabsList>
            <TabsTrigger value="submitted">Submitted Timesheets</TabsTrigger>
            <TabsTrigger value="missing" className="relative">
              Missing Timesheets
              {missingTimesheets && missingTimesheets.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {missingTimesheets.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            {isHROrAdmin && <TabsTrigger value="periods">Pay Periods</TabsTrigger>}
          </TabsList>

          {/* Submitted Timesheets Tab */}
          <TabsContent value="submitted">
            <Card>
              <CardHeader>
                <CardTitle>Submitted Timesheets</CardTitle>
                <CardDescription>Review and approve employee timesheets</CardDescription>
              </CardHeader>
              <CardContent>
                {!timesheets || timesheets.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No timesheets submitted for this pay period yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timesheets.map((item: any) => (
                      <div key={item.timesheet.id} className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-slate-50">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {item.employee.legalFirstName} {item.employee.legalLastName}
                            </p>
                            <p className="text-sm text-slate-500">
                              {item.employee.employeeId} • {item.employee.serviceLine || "N/A"}
                              {item.timesheet.totalHours && ` • ${item.timesheet.totalHours} hours`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(item.timesheet.status)}
                          <div className="flex items-center gap-1">
                            {item.timesheet.participantSigned ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Signed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending Sig
                              </Badge>
                            )}
                          </div>
                          {item.timesheet.fileUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={item.timesheet.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </a>
                            </Button>
                          )}
                          {isSupervisor && item.timesheet.status === "submitted" && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => approveTimesheetMutation.mutate({ 
                                  id: item.timesheet.id,
                                  evvCompliant: true,
                                })}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => {
                                  const notes = prompt("Enter reason for rejection:");
                                  if (notes) {
                                    rejectTimesheetMutation.mutate({ 
                                      id: item.timesheet.id,
                                      reviewNotes: notes,
                                    });
                                  }
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Missing Timesheets Tab */}
          <TabsContent value="missing">
            <Card className="border-red-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-red-700">Missing Timesheets</CardTitle>
                    <CardDescription>Employees who have not submitted timesheets for this pay period</CardDescription>
                  </div>
                  {isHROrAdmin && missingTimesheets && missingTimesheets.length > 0 && (
                    <Button 
                      variant="outline" 
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => runReminderCheckMutation.mutate()}
                      disabled={runReminderCheckMutation.isPending}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Send All Reminders
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!missingTimesheets || missingTimesheets.length === 0 ? (
                  <div className="text-center py-8 text-emerald-600">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                    All employees have submitted their timesheets!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {missingTimesheets.map((emp: any) => (
                      <div key={emp.id} className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium">{emp.legalFirstName} {emp.legalLastName}</p>
                            <p className="text-sm text-slate-500">
                              {emp.employeeId} • {emp.serviceLine || "N/A"} • {emp.email || "No email"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">Missing Timesheet</Badge>
                          {isHROrAdmin && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => sendReminderMutation.mutate({ employeeId: emp.id, payPeriodId: currentPeriodId! })}
                              disabled={sendReminderMutation.isPending}
                            >
                              Send Reminder
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Timesheet Templates</CardTitle>
                    <CardDescription>Download blank timesheet forms to fill out</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!templates || templates.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>No templates available yet.</p>
                    {isHROrAdmin && (
                      <p className="text-sm mt-2">Upload a timesheet template to get started.</p>
                    )}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template) => (
                      <Card key={template.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          {template.description && (
                            <CardDescription className="text-sm">{template.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{template.serviceLine}</Badge>
                            <Button variant="outline" size="sm" asChild>
                              <a href={template.fileUrl} target="_blank" rel="noopener noreferrer" download>
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pay Periods Tab (Admin/HR only) */}
          {isHROrAdmin && (
            <TabsContent value="periods">
              <Card>
                <CardHeader>
                  <CardTitle>Pay Periods</CardTitle>
                  <CardDescription>Manage pay periods and timesheet deadlines</CardDescription>
                </CardHeader>
                <CardContent>
                  {!payPeriods || payPeriods.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                      <p>No pay periods created yet.</p>
                      <Button 
                        className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => setShowNewPeriodDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Pay Period
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payPeriods.map((period) => (
                        <div key={period.id} className="flex items-center justify-between p-4 rounded-lg border bg-white">
                          <div>
                            <p className="font-medium">{period.periodName}</p>
                            <p className="text-sm text-slate-500">
                              {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                              {" • "}Due: {new Date(period.timesheetDueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={period.status === "active" ? "default" : "secondary"}>
                              {period.status}
                            </Badge>
                            {period.status === "upcoming" && (
                              <Button 
                                size="sm" 
                                onClick={() => updatePayPeriodMutation.mutate({ id: period.id, status: "active" })}
                              >
                                Activate
                              </Button>
                            )}
                            {period.status === "active" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updatePayPeriodMutation.mutate({ id: period.id, status: "closed" })}
                              >
                                Close Period
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* New Pay Period Dialog */}
      <Dialog open={showNewPeriodDialog} onOpenChange={setShowNewPeriodDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Pay Period</DialogTitle>
            <DialogDescription>Set up a new pay period for timesheet collection</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="periodName">Period Name</Label>
              <Input 
                id="periodName" 
                placeholder="e.g., Dec 16-29, 2025"
                value={newPeriod.periodName}
                onChange={(e) => setNewPeriod({ ...newPeriod, periodName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input 
                  id="startDate" 
                  type="date"
                  value={newPeriod.startDate}
                  onChange={(e) => setNewPeriod({ ...newPeriod, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input 
                  id="endDate" 
                  type="date"
                  value={newPeriod.endDate}
                  onChange={(e) => setNewPeriod({ ...newPeriod, endDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="dueDate">Timesheet Due Date</Label>
              <Input 
                id="dueDate" 
                type="date"
                value={newPeriod.timesheetDueDate}
                onChange={(e) => setNewPeriod({ ...newPeriod, timesheetDueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPeriodDialog(false)}>Cancel</Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => createPayPeriodMutation.mutate(newPeriod)}
              disabled={!newPeriod.periodName || !newPeriod.startDate || !newPeriod.endDate || !newPeriod.timesheetDueDate}
            >
              Create Pay Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
