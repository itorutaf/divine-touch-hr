import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppSettingsProvider } from "./contexts/AppSettingsContext";

// Public
import Home from "./pages/Home";
import Login from "./pages/Login";
import PasswordReset from "./pages/PasswordReset";
import Landing from "./pages/Landing";

// Dashboards
import DashboardRouter from "./pages/DashboardRouter";

// Workers
import WorkerPipeline from "./pages/WorkerPipeline";
import Employees from "./pages/Employees";
import EmployeeDetail from "./pages/EmployeeDetail";
import NewEmployee from "./pages/NewEmployee";
import Timesheets from "./pages/Timesheets";
import EmployeeTimesheets from "./pages/EmployeeTimesheets";
import Approvals from "./pages/Approvals";
import Exceptions from "./pages/Exceptions";

// Clients
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import ProfitabilityCalculator from "./pages/ProfitabilityCalculator";
import ClientComparison from "./pages/ClientComparison";
import AuthorizationTracker from "./pages/AuthorizationTracker";
import ReferralSources from "./pages/ReferralSources";

// Billing
import BillingDashboard from "./pages/BillingDashboard";
import PayrollReports from "./pages/PayrollReports";
import PayrollExport from "./pages/PayrollExport";

// Compliance
import ClearanceTracker from "./pages/ClearanceTracker";
import EVVCompliance from "./pages/EVVCompliance";
import LEIEScreening from "./pages/LEIEScreening";
import IncidentReporting from "./pages/IncidentReporting";
import ClaimsDashboard from "./pages/ClaimsDashboard";
import WorkersCompDetail from "./pages/WorkersCompDetail";
import UnemploymentClaimDetail from "./pages/UnemploymentClaimDetail";
import AuditReadiness from "./pages/AuditReadiness";

// Operations
import OperationsDashboard from "./pages/OperationsDashboard";
import CaregiverMatching from "./pages/CaregiverMatching";

// Training
import TrainingCourses from "./pages/TrainingCourses";

// Settings
import Users from "./pages/Users";
import IntegrationSettings from "./pages/IntegrationSettings";
import GeneralSettings from "./pages/GeneralSettings";
import RolesOverview from "./pages/RolesOverview";

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/reset-password" component={PasswordReset} />
      <Route path="/landing" component={Landing} />

      {/* Dashboard (role-based) */}
      <Route path="/dashboard" component={DashboardRouter} />

      {/* Workers */}
      <Route path="/workers/pipeline" component={WorkerPipeline} />
      <Route path="/employees" component={Employees} />
      <Route path="/employees/new" component={NewEmployee} />
      <Route path="/employees/:id" component={EmployeeDetail} />
      <Route path="/employees/:id/timesheets" component={EmployeeTimesheets} />
      <Route path="/timesheets" component={Timesheets} />
      <Route path="/approvals" component={Approvals} />
      <Route path="/exceptions" component={Exceptions} />

      {/* Clients — specific routes before :id param */}
      <Route path="/clients" component={Clients} />
      <Route path="/clients/authorizations" component={AuthorizationTracker} />
      <Route path="/clients/profitability" component={ProfitabilityCalculator} />
      <Route path="/clients/compare" component={ClientComparison} />
      <Route path="/clients/referrals" component={ReferralSources} />
      <Route path="/clients/:id" component={ClientDetail} />

      {/* Billing */}
      <Route path="/billing" component={BillingDashboard} />
      <Route path="/payroll-reports" component={PayrollReports} />
      <Route path="/payroll-export" component={PayrollExport} />

      {/* Compliance */}
      <Route path="/compliance/clearances" component={ClearanceTracker} />
      <Route path="/compliance/evv" component={EVVCompliance} />
      <Route path="/compliance/screenings" component={LEIEScreening} />
      <Route path="/compliance/incidents" component={IncidentReporting} />
      <Route path="/compliance/claims" component={ClaimsDashboard} />
      <Route path="/compliance/claims/wc/:id" component={WorkersCompDetail} />
      <Route path="/compliance/claims/uc/:id" component={UnemploymentClaimDetail} />
      <Route path="/compliance/audit" component={AuditReadiness} />

      {/* Operations */}
      <Route path="/operations/scheduling" component={OperationsDashboard} />
      <Route path="/operations/matching" component={CaregiverMatching} />

      {/* Training */}
      <Route path="/training" component={TrainingCourses} />

      {/* Settings */}
      <Route path="/users" component={Users} />
      <Route path="/users/roles" component={RolesOverview} />
      <Route path="/users/roles/:role" component={RolesOverview} />
      <Route path="/settings" component={GeneralSettings} />
      <Route path="/settings/integrations" component={IntegrationSettings} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <AppSettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AppSettingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
