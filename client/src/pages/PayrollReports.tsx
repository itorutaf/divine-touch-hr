import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Download, 
  FileSpreadsheet, 
  Users, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  TrendingUp,
  ClipboardCheck,
  AlertTriangle,
  FileText,
  Settings,
  DollarSign
} from "lucide-react";
import { Link } from "wouter";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Employees", href: "/employees", icon: <Users className="h-4 w-4" /> },
  { label: "Timesheets", href: "/timesheets", icon: <FileText className="h-4 w-4" /> },
  { label: "Payroll Reports", href: "/payroll-reports", icon: <DollarSign className="h-4 w-4" /> },
  { label: "Approvals", href: "/approvals", icon: <ClipboardCheck className="h-4 w-4" /> },
  { label: "Exceptions", href: "/exceptions", icon: <AlertTriangle className="h-4 w-4" /> },
  { label: "Users", href: "/users", icon: <Users className="h-4 w-4" /> },
  { label: "Settings", href: "/settings", icon: <Settings className="h-4 w-4" /> },
];

export default function PayrollReports() {
  const [selectedPayPeriodId, setSelectedPayPeriodId] = useState<number | null>(null);
  
  const { data: payPeriods, isLoading: loadingPayPeriods } = trpc.timesheets.listPayPeriods.useQuery();
  const { data: reportData, isLoading: loadingReport } = trpc.payroll.getReportData.useQuery(
    { payPeriodId: selectedPayPeriodId! },
    { enabled: !!selectedPayPeriodId }
  );
  const { data: summary, isLoading: loadingSummary } = trpc.payroll.getSummary.useQuery(
    { payPeriodId: selectedPayPeriodId! },
    { enabled: !!selectedPayPeriodId }
  );
  
  const generateCSV = trpc.payroll.generateCSV.useMutation({
    onSuccess: (data) => {
      if (data.success && data.csv) {
        // Create and download the CSV file
        const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = data.filename || 'payroll-report.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`Downloaded ${data.recordCount} records`);
      } else {
        toast.error(data.error || 'Failed to generate report');
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleExportCSV = () => {
    if (!selectedPayPeriodId) {
      toast.error('Please select a pay period');
      return;
    }
    generateCSV.mutate({ payPeriodId: selectedPayPeriodId });
  };

  const selectedPayPeriod = payPeriods?.find(p => p.id === selectedPayPeriodId);

  return (
    <AppShell 
      title="Divine Touch HR" 
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payroll Reports</h1>
            <p className="text-muted-foreground">
              Generate and export payroll data from approved timesheets
            </p>
          </div>
        </div>

        {/* Pay Period Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Pay Period
            </CardTitle>
            <CardDescription>
              Choose a pay period to view and export approved timesheet data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select
                value={selectedPayPeriodId?.toString() || ""}
                onValueChange={(value) => setSelectedPayPeriodId(parseInt(value))}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a pay period..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingPayPeriods ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : payPeriods && payPeriods.length > 0 ? (
                    payPeriods.map((period) => (
                      <SelectItem key={period.id} value={period.id.toString()}>
                        {period.periodName} 
                        <Badge variant={period.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                          {period.status}
                        </Badge>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No pay periods found</SelectItem>
                  )}
                </SelectContent>
              </Select>
              
              <Button
                onClick={handleExportCSV}
                disabled={!selectedPayPeriodId || generateCSV.isPending || !reportData?.length}
              >
                {generateCSV.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {selectedPayPeriodId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Employees</p>
                    <p className="text-2xl font-bold">
                      {loadingSummary ? '...' : summary?.employeeCount || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FileSpreadsheet className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Approved Timesheets</p>
                    <p className="text-2xl font-bold">
                      {loadingSummary ? '...' : summary?.timesheetCount || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="text-2xl font-bold">
                      {loadingSummary ? '...' : summary?.totalHours || '0.00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Report Data Preview */}
        {selectedPayPeriodId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Payroll Data Preview
              </CardTitle>
              <CardDescription>
                {selectedPayPeriod?.periodName} - Approved timesheets ready for payroll
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingReport ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : reportData && reportData.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Employee #</TableHead>
                        <TableHead>Service Line</TableHead>
                        <TableHead>Pay Rate</TableHead>
                        <TableHead>Total Hours</TableHead>
                        <TableHead>Signatures</TableHead>
                        <TableHead>EVV</TableHead>
                        <TableHead>Reviewed By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((row) => (
                        <TableRow key={row.timesheetId}>
                          <TableCell>
                            <Link href={`/employees/${row.employeeId}`} className="hover:underline font-medium">
                              {row.legalLastName}, {row.legalFirstName}
                            </Link>
                          </TableCell>
                          <TableCell>{row.employeeIdStr}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{row.serviceLine}</Badge>
                          </TableCell>
                          <TableCell>
                            {row.payRate ? `$${row.payRate}/${row.payType || 'hr'}` : '-'}
                          </TableCell>
                          <TableCell className="font-medium">{row.totalHours || '0'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {row.participantSigned ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                              )}
                              {row.employeeSigned ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {row.evvCompliant ? (
                              <Badge variant="default" className="bg-green-500">Compliant</Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.reviewedByName || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Approved Timesheets</h3>
                  <p className="text-muted-foreground max-w-md mt-2">
                    There are no approved timesheets for this pay period yet. 
                    Timesheets must be approved before they appear in the payroll report.
                  </p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/timesheets">Go to Timesheets</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* No Pay Period Selected */}
        {!selectedPayPeriodId && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Select a Pay Period</h3>
                <p className="text-muted-foreground max-w-md mt-2">
                  Choose a pay period above to view approved timesheet data and generate payroll reports.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
