import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { 
  Download, FileSpreadsheet, CheckCircle, XCircle, 
  AlertCircle, Building2, Users, Clock, FileText,
  TrendingUp, ClipboardCheck, AlertTriangle, 
  Settings, DollarSign, FileDown, ShieldCheck, ShieldAlert,
  ChevronRight, ExternalLink, Info, Heart, Stethoscope
} from "lucide-react";

type TargetSystem = "UKG" | "ADP" | "Paychex" | "HHA_Exchange" | "Generic_CSV";

const systemInfo: Record<TargetSystem, { name: string; description: string; icon: React.ReactNode; color: string }> = {
  UKG: { 
    name: "UKG (Ultimate Kronos Group)", 
    description: "Export employee data in UKG-compatible format for workforce management",
    icon: <Building2 className="h-8 w-8" />,
    color: "text-blue-500"
  },
  ADP: { 
    name: "ADP", 
    description: "Export employee data in ADP format for payroll processing",
    icon: <Building2 className="h-8 w-8" />,
    color: "text-red-500"
  },
  Paychex: { 
    name: "Paychex", 
    description: "Export employee data in Paychex format",
    icon: <Building2 className="h-8 w-8" />,
    color: "text-green-500"
  },
  HHA_Exchange: { 
    name: "HHA Exchange", 
    description: "Export/sync employee data with HHA Exchange for EVV compliance",
    icon: <Building2 className="h-8 w-8" />,
    color: "text-purple-500"
  },
  Generic_CSV: { 
    name: "Generic CSV", 
    description: "Export all employee data in a comprehensive CSV format",
    icon: <FileSpreadsheet className="h-8 w-8" />,
    color: "text-gray-500"
  },
};

// Validation requirements for each system
const validationRequirements: Record<TargetSystem, { required: string[]; recommended: string[] }> = {
  UKG: {
    required: ["name", "ssn", "address", "payRate", "taxInfo"],
    recommended: ["directDeposit", "benefits", "emergencyContact"]
  },
  ADP: {
    required: ["name", "ssn", "address", "payRate", "taxInfo", "directDeposit"],
    recommended: ["benefits", "emergencyContact"]
  },
  Paychex: {
    required: ["name", "ssn", "address", "payRate", "taxInfo"],
    recommended: ["directDeposit", "benefits"]
  },
  HHA_Exchange: {
    required: ["name", "address", "serviceLine", "clearances"],
    recommended: ["phone", "email", "certifications"]
  },
  Generic_CSV: {
    required: ["name"],
    recommended: ["ssn", "address", "payRate", "taxInfo", "directDeposit"]
  }
};

interface ValidationIssue {
  employeeId: number;
  employeeName: string;
  field: string;
  severity: "error" | "warning";
  message: string;
}

export default function PayrollExport() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedSystem, setSelectedSystem] = useState<TargetSystem>("Generic_CSV");
  const [filters, setFilters] = useState<{
    serviceLine?: string;
    status?: string;
    phase?: string;
  }>({});
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);
  
  const { data: previewData, isLoading: previewLoading } = trpc.payrollExport.getEmployeeExportPreview.useQuery({ filters });
  const { data: exportHistory } = trpc.payrollExport.getExportHistory.useQuery({ limit: 20 });
  const { data: pendingApprovals } = trpc.dashboard.pendingApprovals.useQuery();
  const { data: openExceptions } = trpc.dashboard.openExceptions.useQuery();
  
  const totalPending = pendingApprovals?.length || 0;
  const totalExceptions = openExceptions?.length || 0;
  
  const generateExport = trpc.payrollExport.generateEmployeeExport.useMutation({
    onSuccess: (data) => {
      if (data.success && data.csv) {
        const blob = new Blob([data.csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename || 'export.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast.success(`Export complete! ${data.recordCount} employees exported.`);
      } else {
        toast.error(data.error || 'Export failed');
      }
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });
  
  // Build navigation items
  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Employees", href: "/employees", icon: <Users className="h-4 w-4" /> },
    { label: "Timesheets", href: "/timesheets", icon: <FileText className="h-4 w-4" /> },
    { label: "Approvals", href: "/approvals", icon: <ClipboardCheck className="h-4 w-4" />, badge: totalPending > 0 ? totalPending : undefined },
    { label: "Exceptions", href: "/exceptions", icon: <AlertTriangle className="h-4 w-4" />, badge: totalExceptions > 0 ? totalExceptions : undefined },
  ];

  if (user?.role === "admin" || user?.role === "hr") {
    navItems.push({ label: "Payroll Reports", href: "/payroll-reports", icon: <DollarSign className="h-4 w-4" /> });
    navItems.push({ label: "Payroll Export", href: "/payroll-export", icon: <FileDown className="h-4 w-4" /> });
  }

  if (user?.role === "admin") {
    navItems.push({ label: "Users", href: "/users", icon: <Users className="h-4 w-4" /> });
    navItems.push({ label: "Settings", href: "/settings", icon: <Settings className="h-4 w-4" /> });
  }
  
  // Calculate validation issues
  const validationIssues: ValidationIssue[] = [];
  const requirements = validationRequirements[selectedSystem];
  
  previewData?.forEach(emp => {
    // Required field checks
    if (requirements.required.includes("ssn") && !emp.hasTaxInfo) {
      validationIssues.push({
        employeeId: emp.id,
        employeeName: emp.name,
        field: "Tax Info / SSN",
        severity: "error",
        message: "Missing SSN and tax information - required for payroll"
      });
    }
    if (requirements.required.includes("payRate") && !emp.hasCompensation) {
      validationIssues.push({
        employeeId: emp.id,
        employeeName: emp.name,
        field: "Compensation",
        severity: "error",
        message: "Missing pay rate and compensation details"
      });
    }
    if (requirements.required.includes("directDeposit") && !emp.hasDirectDeposit) {
      validationIssues.push({
        employeeId: emp.id,
        employeeName: emp.name,
        field: "Direct Deposit",
        severity: "error",
        message: "Missing direct deposit information - required for this system"
      });
    }
    
    // Recommended field checks (warnings)
    if (requirements.recommended.includes("directDeposit") && !emp.hasDirectDeposit) {
      validationIssues.push({
        employeeId: emp.id,
        employeeName: emp.name,
        field: "Direct Deposit",
        severity: "warning",
        message: "No direct deposit configured - employee will receive paper check"
      });
    }
  });
  
  const errorCount = validationIssues.filter(i => i.severity === "error").length;
  const warningCount = validationIssues.filter(i => i.severity === "warning").length;
  const hasBlockingErrors = errorCount > 0 && selectedSystem !== "Generic_CSV";
  
  // Completeness stats
  const completenessStats = previewData ? {
    total: previewData.length,
    withTaxInfo: previewData.filter(e => e.hasTaxInfo).length,
    withDirectDeposit: previewData.filter(e => e.hasDirectDeposit).length,
    withCompensation: previewData.filter(e => e.hasCompensation).length,
    complete: previewData.filter(e => e.hasTaxInfo && e.hasDirectDeposit && e.hasCompensation).length,
  } : null;
  
  const completenessPercent = completenessStats 
    ? Math.round((completenessStats.complete / Math.max(completenessStats.total, 1)) * 100)
    : 0;
  
  const handleExport = () => {
    if (hasBlockingErrors) {
      toast.error("Please resolve all validation errors before exporting");
      return;
    }
    
    generateExport.mutate({
      targetSystem: selectedSystem,
      filters,
    });
  };
  
  const toggleEmployeeSelection = (id: number) => {
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };
  
  const selectAllEmployees = () => {
    if (previewData) {
      setSelectedEmployees(previewData.map(e => e.id));
    }
  };
  
  const filteredPreviewData = showOnlyIncomplete 
    ? previewData?.filter(e => !e.hasTaxInfo || !e.hasDirectDeposit || !e.hasCompensation)
    : previewData;
  
  return (
    <DashboardLayout title="Payroll Export" navItems={navItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payroll Export Center</h1>
            <p className="text-muted-foreground">
              Export employee data for UKG, ADP, Paychex, or HHA Exchange
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {completenessStats?.total || 0} Employees
          </Badge>
        </div>
        
        <Tabs defaultValue="export" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="export">
              <FileDown className="h-4 w-4 mr-2" />
              Generate Export
            </TabsTrigger>
            <TabsTrigger value="validation">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Validation ({errorCount + warningCount})
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              Export History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="space-y-6">
            {/* System Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Target System</CardTitle>
                <CardDescription>Choose where you want to export employee data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {(Object.keys(systemInfo) as TargetSystem[]).map((system) => (
                    <Card 
                      key={system}
                      className={`cursor-pointer transition-all ${
                        selectedSystem === system 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedSystem(system)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className={`flex justify-center mb-2 ${systemInfo[system].color}`}>
                          {systemInfo[system].icon}
                        </div>
                        <h3 className="font-medium text-sm">{system === "HHA_Exchange" ? "HHA Exchange" : system === "Generic_CSV" ? "Generic CSV" : system}</h3>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Validation Summary Alert */}
            {hasBlockingErrors && (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Validation Errors Found</AlertTitle>
                <AlertDescription>
                  {errorCount} employee(s) have missing required information for {systemInfo[selectedSystem].name}. 
                  Please resolve these issues before exporting.
                  <Button 
                    variant="link" 
                    className="p-0 h-auto ml-2"
                    onClick={() => document.querySelector('[data-value="validation"]')?.dispatchEvent(new MouseEvent('click'))}
                  >
                    View Issues <ChevronRight className="h-4 w-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {warningCount > 0 && !hasBlockingErrors && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Recommendations</AlertTitle>
                <AlertDescription>
                  {warningCount} employee(s) have incomplete optional information. 
                  Export will proceed but some data may be missing.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Data Completeness Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Data Completeness</span>
                  <Badge variant={completenessPercent === 100 ? "default" : "secondary"}>
                    {completenessPercent}% Complete
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={completenessPercent} className="h-3" />
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold">{completenessStats?.total || 0}</div>
                    <div className="text-xs text-muted-foreground">Total Employees</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{completenessStats?.withTaxInfo || 0}</div>
                    <div className="text-xs text-muted-foreground">With Tax Info</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{completenessStats?.withDirectDeposit || 0}</div>
                    <div className="text-xs text-muted-foreground">With Direct Deposit</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{completenessStats?.withCompensation || 0}</div>
                    <div className="text-xs text-muted-foreground">With Compensation</div>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">{completenessStats?.complete || 0}</div>
                    <div className="text-xs text-muted-foreground">Fully Complete</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Employees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Service Line</label>
                    <Select 
                      value={filters.serviceLine || "all"} 
                      onValueChange={(v) => setFilters(f => ({ ...f, serviceLine: v === "all" ? undefined : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Service Lines" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Service Lines</SelectItem>
                        <SelectItem value="OLTL">OLTL (Non-Skilled)</SelectItem>
                        <SelectItem value="ODP">ODP</SelectItem>
                        <SelectItem value="Skilled">OLTL Skilled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Status</label>
                    <Select 
                      value={filters.status || "all"} 
                      onValueChange={(v) => setFilters(f => ({ ...f, status: v === "all" ? undefined : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Complete">Complete</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Phase</label>
                    <Select 
                      value={filters.phase || "all"} 
                      onValueChange={(v) => setFilters(f => ({ ...f, phase: v === "all" ? undefined : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Phases" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Phases</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Ready to Schedule">Ready to Schedule</SelectItem>
                        <SelectItem value="Provisioning">Provisioning</SelectItem>
                        <SelectItem value="Verification">Verification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox 
                        checked={showOnlyIncomplete}
                        onCheckedChange={(checked) => setShowOnlyIncomplete(checked === true)}
                      />
                      <span className="text-sm">Show only incomplete</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Export Button */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {filteredPreviewData?.length || 0} employees will be exported
              </div>
              <Button 
                onClick={handleExport} 
                disabled={generateExport.isPending || !previewData?.length || hasBlockingErrors}
                size="lg"
                className="min-w-[200px]"
              >
                <Download className="h-4 w-4 mr-2" />
                {generateExport.isPending ? 'Generating...' : `Export to ${selectedSystem === "HHA_Exchange" ? "HHA" : selectedSystem === "Generic_CSV" ? "CSV" : selectedSystem}`}
              </Button>
            </div>
            
            {/* Preview Table */}
            <Card>
              <CardHeader>
                <CardTitle>Export Preview</CardTitle>
                <CardDescription>
                  Review employees before exporting. Click on an employee to edit their payroll data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {previewLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : filteredPreviewData && filteredPreviewData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Service Line</TableHead>
                        <TableHead>Phase</TableHead>
                        <TableHead>Pay Rate</TableHead>
                        <TableHead className="text-center">Tax Info</TableHead>
                        <TableHead className="text-center">Direct Deposit</TableHead>
                        <TableHead className="text-center">Compensation</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPreviewData.map((emp) => {
                        const isComplete = emp.hasTaxInfo && emp.hasDirectDeposit && emp.hasCompensation;
                        return (
                          <TableRow 
                            key={emp.id} 
                            className={`cursor-pointer hover:bg-muted/50 ${!isComplete ? 'bg-amber-50/50' : ''}`}
                            onClick={() => setLocation(`/employees/${emp.id}?tab=payroll`)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {!isComplete && <AlertCircle className="h-4 w-4 text-amber-500" />}
                                <div>
                                  <div className="font-medium">{emp.name}</div>
                                  <div className="text-xs text-muted-foreground">{emp.employeeId}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline"
                                className={
                                  emp.serviceLine === "OLTL" ? "border-blue-300 text-blue-700" :
                                  emp.serviceLine === "ODP" ? "border-emerald-300 text-emerald-700" :
                                  emp.serviceLine === "Skilled" ? "border-purple-300 text-purple-700" :
                                  ""
                                }
                              >
                                {emp.serviceLine === "Skilled" ? "OLTL Skilled" : emp.serviceLine || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={emp.phase === 'Active' ? 'default' : 'secondary'}>
                                {emp.phase}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {emp.payRate ? `$${emp.payRate}/${emp.payType === 'Salary' ? 'yr' : 'hr'}` : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              {emp.hasTaxInfo ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {emp.hasDirectDeposit ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {emp.hasCompensation ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/employees/${emp.id}?tab=payroll`);
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No employees found matching the selected filters
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="validation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Validation Results for {systemInfo[selectedSystem].name}
                </CardTitle>
                <CardDescription>
                  Review and resolve issues before exporting to ensure data quality
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Validation Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                    <div className="text-xs text-muted-foreground">Errors (Blocking)</div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">{warningCount}</div>
                    <div className="text-xs text-muted-foreground">Warnings</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {(previewData?.length || 0) - new Set(validationIssues.map(i => i.employeeId)).size}
                    </div>
                    <div className="text-xs text-muted-foreground">Passing</div>
                  </div>
                </div>
                
                {/* Requirements Info */}
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium mb-2">Requirements for {systemInfo[selectedSystem].name}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-red-600">Required:</span>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {requirements.required.map(r => (
                          <li key={r}>{r.replace(/([A-Z])/g, ' $1').trim()}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium text-amber-600">Recommended:</span>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {requirements.recommended.map(r => (
                          <li key={r}>{r.replace(/([A-Z])/g, ' $1').trim()}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Issues List */}
                {validationIssues.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Severity</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationIssues.map((issue, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            {issue.severity === "error" ? (
                              <Badge variant="destructive">Error</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700">Warning</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{issue.employeeName}</TableCell>
                          <TableCell>{issue.field}</TableCell>
                          <TableCell className="text-muted-foreground">{issue.message}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setLocation(`/employees/${issue.employeeId}?tab=payroll`)}
                            >
                              Fix <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="font-medium text-lg">All Validations Passed!</h3>
                    <p className="text-muted-foreground">
                      All employees have the required information for {systemInfo[selectedSystem].name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Export History</CardTitle>
                <CardDescription>Recent payroll data exports</CardDescription>
              </CardHeader>
              <CardContent>
                {exportHistory && exportHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Target System</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exportHistory.map((exp) => (
                        <TableRow key={exp.id}>
                          <TableCell>
                            {new Date(exp.exportedAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{exp.exportType}</Badge>
                          </TableCell>
                          <TableCell>{exp.targetSystem}</TableCell>
                          <TableCell>{exp.recordCount}</TableCell>
                          <TableCell>
                            <Badge variant={exp.status === 'completed' ? 'default' : 'secondary'}>
                              {exp.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {exp.fileUrl && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={exp.fileUrl} download>
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No export history yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
