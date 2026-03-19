import { useAuth } from "@/_core/hooks/useAuth";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useState, useMemo } from "react";
import { 
  Users, UserPlus, Search, TrendingUp, ClipboardCheck, 
  AlertTriangle, Clock, Filter, Eye, FileText, Settings,
  Download, DollarSign, Heart, Stethoscope, Building2
} from "lucide-react";

const PHASES = [
  "All",
  "Intake",
  "Screening", 
  "Documentation",
  "Verification",
  "Provisioning",
  "Ready to Schedule",
  "Active",
  "Post-Onboarding"
];

const STATUS_COLORS: Record<string, string> = {
  "Pending Review": "bg-muted text-foreground",
  "In Progress": "bg-blue-100 text-blue-700",
  "Action Required": "bg-amber-100 text-amber-700",
  "On Hold": "bg-orange-100 text-orange-700",
  "Complete": "bg-emerald-100 text-emerald-700",
  "Withdrawn": "bg-muted text-foreground",
  "Rejected": "bg-red-100 text-red-700",
};

const PHASE_COLORS: Record<string, string> = {
  "Intake": "bg-muted0",
  "Screening": "bg-amber-500",
  "Documentation": "bg-blue-500",
  "Verification": "bg-purple-500",
  "Provisioning": "bg-indigo-500",
  "Ready to Schedule": "bg-cyan-500",
  "Active": "bg-emerald-500",
  "Post-Onboarding": "bg-teal-500",
};

// Service line configurations with documentation requirements
const SERVICE_LINES = {
  "All": {
    label: "All Employees",
    icon: Users,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    description: "View all employees across all service lines"
  },
  "OLTL": {
    label: "OLTL (Non-Skilled)",
    icon: Heart,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    description: "611 Documentation - Personal care and home support services",
    docType: "611"
  },
  "Skilled": {
    label: "OLTL Skilled",
    icon: Stethoscope,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    description: "601 Documentation - Licensed nursing and therapy services",
    docType: "601"
  },
  "ODP": {
    label: "ODP",
    icon: Building2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    description: "State-specific documentation - Intellectual disability services",
    docType: "ODP"
  }
};

type ServiceLineKey = keyof typeof SERVICE_LINES;

export default function Employees() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("All");
  const [serviceLineTab, setServiceLineTab] = useState<ServiceLineKey>("All");
  
  const { data: employees, isLoading } = trpc.employees.list.useQuery();
  const { data: pendingApprovals } = trpc.dashboard.pendingApprovals.useQuery();
  const { data: openExceptions } = trpc.dashboard.openExceptions.useQuery();

  const totalPending = pendingApprovals?.length || 0;
  const totalExceptions = openExceptions?.length || 0;

  // Count employees by service line
  const serviceLineCounts = useMemo(() => {
    if (!employees) return { All: 0, OLTL: 0, Skilled: 0, ODP: 0 };
    
    const counts = { All: employees.length, OLTL: 0, Skilled: 0, ODP: 0 };
    
    employees.forEach(emp => {
      const serviceLine = emp.serviceLine;
      
      if (serviceLine === "OLTL") {
        counts.OLTL++;
      } else if (serviceLine === "ODP") {
        counts.ODP++;
      } else if (serviceLine === "Skilled") {
        counts.Skilled++;
      }
    });
    
    return counts;
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    
    return employees.filter(emp => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        emp.legalFirstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.legalLastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Phase filter
      const matchesPhase = phaseFilter === "All" || emp.currentPhase === phaseFilter;
      
      // Service line filter
      let matchesServiceLine = true;
      if (serviceLineTab !== "All") {
        matchesServiceLine = emp.serviceLine === serviceLineTab;
      }
      
      return matchesSearch && matchesPhase && matchesServiceLine;
    });
  }, [employees, searchQuery, phaseFilter, serviceLineTab]);

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

  const currentServiceLine = SERVICE_LINES[serviceLineTab];
  const ServiceLineIcon = currentServiceLine.icon;

  return (
    <AppShell 
      title="Employees" 
      actions={
        (user?.role === "admin" || user?.role === "hr") && (
          <Button onClick={() => setLocation("/employees/new")} className="bg-emerald-600 hover:bg-emerald-700">
            <UserPlus className="h-4 w-4 mr-2" />
            New Employee
          </Button>
        )
      }
    >
      <div className="space-y-6">
        {/* Service Line Tabs */}
        <Tabs value={serviceLineTab} onValueChange={(v) => setServiceLineTab(v as ServiceLineKey)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted">
            {(Object.keys(SERVICE_LINES) as ServiceLineKey[]).map((key) => {
              const config = SERVICE_LINES[key];
              const Icon = config.icon;
              const count = serviceLineCounts[key];
              
              return (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${serviceLineTab === key ? config.color : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">{key === "All" ? "All" : key === "Skilled" ? "OLTL Skilled" : key}</span>
                  </div>
                  <Badge variant="secondary" className={`text-xs ${serviceLineTab === key ? config.bgColor : ''}`}>
                    {count}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Service Line Info Card */}
          {serviceLineTab !== "All" && (
            <Card className={`mt-4 border-l-4 ${
              serviceLineTab === "OLTL" ? "border-l-blue-500" :
              serviceLineTab === "Skilled" ? "border-l-purple-500" :
              "border-l-emerald-500"
            }`}>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${currentServiceLine.bgColor}`}>
                    <ServiceLineIcon className={`h-5 w-5 ${currentServiceLine.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{currentServiceLine.label}</h3>
                    <p className="text-sm text-muted-foreground">{currentServiceLine.description}</p>
                  </div>
                  {'docType' in currentServiceLine && (
                    <Badge className="ml-auto" variant="outline">
                      {currentServiceLine.docType} Documentation
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by phase" />
                    </SelectTrigger>
                    <SelectContent>
                      {PHASES.map(phase => (
                        <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employee Table - Same for all tabs */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ServiceLineIcon className={`h-5 w-5 ${currentServiceLine.color}`} />
                  <span>{currentServiceLine.label}</span>
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  {filteredEmployees.length} {filteredEmployees.length === 1 ? "employee" : "employees"}
                </span>
              </CardTitle>
              {serviceLineTab !== "All" && (
                <CardDescription>
                  Employees in the {currentServiceLine.label} service line
                  {'docType' in currentServiceLine && ` - Requires ${currentServiceLine.docType} documentation`}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                  <ServiceLineIcon className="h-12 w-12 mb-4 text-muted-foreground" />
                  <p>No employees found in {currentServiceLine.label}</p>
                  {searchQuery && <p className="text-sm">Try adjusting your search</p>}
                  {serviceLineTab !== "All" && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setLocation("/employees/new")}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add {serviceLineTab} Employee
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Service Line</TableHead>
                        <TableHead>Phase</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee) => (
                        <TableRow key={employee.id} className="cursor-pointer hover:bg-muted">
                          <TableCell className="font-mono text-sm">{employee.employeeId}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {employee.escalationFlag && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="font-medium">
                                {employee.legalFirstName} {employee.legalLastName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{employee.email || "-"}</TableCell>
                          <TableCell>
                            {employee.roleAppliedFor ? (
                              <Badge variant="outline" className="text-xs">{employee.roleAppliedFor}</Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            {employee.serviceLine ? (
                              <Badge 
                                className={`${
                                  employee.serviceLine === "OLTL" ? "bg-blue-100 text-blue-700" :
                                  employee.serviceLine === "ODP" ? "bg-emerald-100 text-emerald-700" :
                                  employee.serviceLine === "Skilled" ? "bg-purple-100 text-purple-700" :
                                  "bg-muted text-foreground"
                                }`}
                              >
                                {employee.serviceLine === "Skilled" ? "OLTL Skilled" : employee.serviceLine}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${PHASE_COLORS[employee.currentPhase || ""] || "bg-muted-foreground/30"}`}></div>
                              <span className="text-sm">{employee.currentPhase}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[employee.status || ""] || "bg-muted"}>
                              {employee.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${employee.completionPercent || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-muted-foreground">{employee.completionPercent || 0}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setLocation(`/employees/${employee.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </AppShell>
  );
}
