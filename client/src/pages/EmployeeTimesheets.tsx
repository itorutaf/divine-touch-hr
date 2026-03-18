import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { 
  Users, TrendingUp, ClipboardCheck, AlertTriangle, 
  FileText, Upload, Download, Calendar, ArrowLeft,
  CheckCircle2, Clock, Send, Loader2, Settings
} from "lucide-react";

export default function EmployeeTimesheets() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const employeeId = parseInt(id || "0");
  
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedPayPeriod, setSelectedPayPeriod] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [timesheetData, setTimesheetData] = useState({
    totalHours: "",
    participantName: "",
    signatureType: "wet" as "wet" | "digital" | "pending",
    participantSigned: false,
    employeeSigned: false,
  });
  
  // Queries
  const { data: employee } = trpc.employees.getById.useQuery({ id: employeeId }, { enabled: !!employeeId });
  const { data: payPeriods } = trpc.timesheets.listPayPeriods.useQuery();
  const { data: activePayPeriod } = trpc.timesheets.getActivePayPeriod.useQuery();
  const { data: timesheets, refetch: refetchTimesheets } = trpc.timesheets.listByEmployee.useQuery(
    { employeeId },
    { enabled: !!employeeId }
  );
  const { data: templates } = trpc.timesheets.listTemplates.useQuery();
  
  // Mutations
  const createTimesheetMutation = trpc.timesheets.create.useMutation({
    onSuccess: () => {
      toast.success("Timesheet uploaded successfully");
      setShowUploadDialog(false);
      resetUploadForm();
      refetchTimesheets();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const submitTimesheetMutation = trpc.timesheets.submit.useMutation({
    onSuccess: () => {
      toast.success("Timesheet submitted for review");
      refetchTimesheets();
    },
  });
  
  const updateTimesheetMutation = trpc.timesheets.update.useMutation({
    onSuccess: () => {
      toast.success("Timesheet updated");
      refetchTimesheets();
    },
  });
  
  const resetUploadForm = () => {
    setUploadFile(null);
    setSelectedPayPeriod(null);
    setTimesheetData({
      totalHours: "",
      participantName: "",
      signatureType: "wet",
      participantSigned: false,
      employeeSigned: false,
    });
  };
  
  const handleFileUpload = async () => {
    if (!uploadFile || !selectedPayPeriod) {
      toast.error("Please select a file and pay period");
      return;
    }
    
    setUploading(true);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        
        // Upload to server
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: uploadFile.name,
            fileData: base64,
            mimeType: uploadFile.type,
          }),
        });
        
        if (!response.ok) {
          throw new Error("Upload failed");
        }
        
        const { url, key } = await response.json();
        
        // Create timesheet record
        createTimesheetMutation.mutate({
          employeeId,
          payPeriodId: selectedPayPeriod,
          fileKey: key,
          fileUrl: url,
          originalFileName: uploadFile.name,
          mimeType: uploadFile.type,
          fileSize: uploadFile.size,
          totalHours: timesheetData.totalHours || undefined,
          participantName: timesheetData.participantName || undefined,
          signatureType: timesheetData.signatureType,
          participantSigned: timesheetData.participantSigned,
          employeeSigned: timesheetData.employeeSigned,
        });
      };
      
      reader.readAsDataURL(uploadFile);
    } catch (error) {
      toast.error("Failed to upload timesheet");
    } finally {
      setUploading(false);
    }
  };
  
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

  if (!employee) {
    return (
      <DashboardLayout title="Employee Timesheets" navItems={navItems}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={`Timesheets - ${employee.legalFirstName} ${employee.legalLastName}`}
      navItems={navItems}
      actions={
        <Button onClick={() => setShowUploadDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Upload className="h-4 w-4 mr-2" />
          Upload Timesheet
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Employee Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <a href={`/employees/${employeeId}`}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Employee
                  </a>
                </Button>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Employee ID</p>
                <p className="font-medium">{employee.employeeId}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Templates Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timesheet Templates</CardTitle>
            <CardDescription>Download blank timesheet forms to fill out</CardDescription>
          </CardHeader>
          <CardContent>
            {!templates || templates.length === 0 ? (
              <p className="text-slate-500 text-sm">No templates available yet.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {templates.map((template) => (
                  <Button key={template.id} variant="outline" asChild>
                    <a href={template.fileUrl} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-4 w-4 mr-2" />
                      {template.name}
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timesheets List */}
        <Card>
          <CardHeader>
            <CardTitle>Submitted Timesheets</CardTitle>
            <CardDescription>View and manage timesheet submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {!timesheets || timesheets.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>No timesheets uploaded yet.</p>
                <Button 
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setShowUploadDialog(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Timesheet
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {timesheets.map((ts: any) => {
                  const payPeriod = payPeriods?.find(p => p.id === ts.payPeriodId);
                  return (
                    <div key={ts.id} className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium">{payPeriod?.periodName || "Unknown Period"}</p>
                          <p className="text-sm text-slate-500">
                            {ts.totalHours ? `${ts.totalHours} hours` : "Hours not entered"}
                            {ts.participantName && ` • ${ts.participantName}`}
                            {ts.submittedAt && ` • Submitted ${new Date(ts.submittedAt).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(ts.status)}
                        <div className="flex items-center gap-1">
                          {ts.participantSigned ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Participant Signed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              <Clock className="h-3 w-3 mr-1" />
                              Needs Signature
                            </Badge>
                          )}
                        </div>
                        {ts.fileUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={ts.fileUrl} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                        )}
                        {ts.status === "draft" && (
                          <Button 
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => submitTimesheetMutation.mutate({ id: ts.id })}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Submit
                          </Button>
                        )}
                        {ts.status === "needs_correction" && (
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPayPeriod(ts.payPeriodId);
                              setShowUploadDialog(true);
                            }}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Re-upload
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
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Timesheet</DialogTitle>
            <DialogDescription>Upload a completed timesheet for this pay period</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payPeriod">Pay Period *</Label>
              <Select 
                value={selectedPayPeriod?.toString() || ""} 
                onValueChange={(v) => setSelectedPayPeriod(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pay period" />
                </SelectTrigger>
                <SelectContent>
                  {payPeriods?.filter(p => p.status === "active" || p.status === "upcoming").map((period) => (
                    <SelectItem key={period.id} value={period.id.toString()}>
                      {period.periodName} {period.status === "active" && "(Active)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="file">Timesheet File *</Label>
              <Input 
                id="file" 
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-slate-500 mt-1">Accepted: PDF, JPG, PNG, DOC, DOCX</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalHours">Total Hours</Label>
                <Input 
                  id="totalHours" 
                  type="number"
                  step="0.5"
                  placeholder="e.g., 40"
                  value={timesheetData.totalHours}
                  onChange={(e) => setTimesheetData({ ...timesheetData, totalHours: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="participantName">Participant Name</Label>
                <Input 
                  id="participantName" 
                  placeholder="Client name"
                  value={timesheetData.participantName}
                  onChange={(e) => setTimesheetData({ ...timesheetData, participantName: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label>Signature Type</Label>
              <Select 
                value={timesheetData.signatureType} 
                onValueChange={(v: "wet" | "digital" | "pending") => setTimesheetData({ ...timesheetData, signatureType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wet">Wet Signature (Physical)</SelectItem>
                  <SelectItem value="digital">Digital Signature</SelectItem>
                  <SelectItem value="pending">Pending Signature</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="participantSigned" 
                  checked={timesheetData.participantSigned}
                  onCheckedChange={(checked) => setTimesheetData({ ...timesheetData, participantSigned: !!checked })}
                />
                <Label htmlFor="participantSigned" className="text-sm font-normal">
                  Participant has signed this timesheet
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="employeeSigned" 
                  checked={timesheetData.employeeSigned}
                  onCheckedChange={(checked) => setTimesheetData({ ...timesheetData, employeeSigned: !!checked })}
                />
                <Label htmlFor="employeeSigned" className="text-sm font-normal">
                  I (employee) have signed this timesheet
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowUploadDialog(false); resetUploadForm(); }}>
              Cancel
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleFileUpload}
              disabled={!uploadFile || !selectedPayPeriod || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Timesheet
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
