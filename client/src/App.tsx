import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import EmployeeDetail from "./pages/EmployeeDetail";
import NewEmployee from "./pages/NewEmployee";
import Approvals from "./pages/Approvals";
import Exceptions from "./pages/Exceptions";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Timesheets from "./pages/Timesheets";
import EmployeeTimesheets from "./pages/EmployeeTimesheets";
import PayrollReports from "./pages/PayrollReports";
import PayrollExport from "./pages/PayrollExport";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/employees" component={Employees} />
      <Route path="/employees/new" component={NewEmployee} />
      <Route path="/employees/:id" component={EmployeeDetail} />
      <Route path="/employees/:id/timesheets" component={EmployeeTimesheets} />
      <Route path="/timesheets" component={Timesheets} />
      <Route path="/payroll-reports" component={PayrollReports} />
      <Route path="/payroll-export" component={PayrollExport} />
      <Route path="/approvals" component={Approvals} />
      <Route path="/exceptions" component={Exceptions} />
      <Route path="/users" component={Users} />
      <Route path="/settings" component={Settings} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
