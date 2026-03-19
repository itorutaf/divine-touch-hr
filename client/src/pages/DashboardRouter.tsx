import { useAuth } from "@/_core/hooks/useAuth";
import ExecutiveDashboard from "./ExecutiveDashboard";
import HRDashboard from "./HRDashboard";

export default function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading) return null;

  // Route to role-specific dashboard
  switch (user?.role) {
    case "admin":
      return <ExecutiveDashboard />;
    case "hr":
    case "supervisor":
      return <HRDashboard />;
    case "billing":
      return <ExecutiveDashboard />; // Billing gets exec view for now
    case "coordinator":
      return <HRDashboard />; // Coordinators get HR view for now
    case "compliance":
      return <HRDashboard />;
    default:
      return <ExecutiveDashboard />;
  }
}
