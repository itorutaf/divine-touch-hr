import {
  LayoutDashboard,
  Users,
  Contact,
  UserPlus,
  Clock,
  CheckSquare,
  Building2,
  FileCheck,
  TrendingUp,
  Receipt,
  Download,
  BarChart3,
  ShieldCheck,
  Search,
  AlertTriangle,
  ClipboardCheck,
  Calendar,
  AlertCircle,
  GraduationCap,
  Settings,
  UserCog,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { type NavGroup, getVisibleGroups } from "@shared/roles";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  label: string;
  group: NavGroup;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Dashboard",
    group: "dashboard",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Workers",
    group: "workers",
    items: [
      { label: "Pipeline", href: "/workers/pipeline", icon: Users },
      { label: "Directory", href: "/employees", icon: Contact },
      { label: "New Worker", href: "/employees/new", icon: UserPlus },
      { label: "Timesheets", href: "/timesheets", icon: Clock },
      { label: "Approvals", href: "/approvals", icon: CheckSquare },
    ],
  },
  {
    label: "Clients",
    group: "clients",
    items: [
      { label: "All Clients", href: "/clients", icon: Building2 },
      { label: "Authorizations", href: "/clients/authorizations", icon: FileCheck },
      { label: "Profitability", href: "/clients/profitability", icon: TrendingUp },
      { label: "Compare", href: "/clients/compare", icon: BarChart3 },
      { label: "Referral Sources", href: "/clients/referrals", icon: Users },
    ],
  },
  {
    label: "Billing",
    group: "billing",
    items: [
      { label: "Overview", href: "/billing", icon: Receipt },
      { label: "Payroll Export", href: "/payroll-export", icon: Download },
      { label: "Reports", href: "/payroll-reports", icon: BarChart3 },
    ],
  },
  {
    label: "Compliance",
    group: "compliance",
    items: [
      { label: "Clearances", href: "/compliance/clearances", icon: ShieldCheck },
      { label: "EVV", href: "/compliance/evv", icon: Wifi },
      { label: "LEIE/SAM", href: "/compliance/screenings", icon: Search },
      { label: "Incidents", href: "/compliance/incidents", icon: AlertTriangle },
      { label: "Audit Readiness", href: "/compliance/audit", icon: ClipboardCheck },
    ],
  },
  {
    label: "Operations",
    group: "operations",
    items: [
      { label: "Scheduling", href: "/operations/scheduling", icon: Calendar },
      { label: "Matching", href: "/operations/matching", icon: Users },
      { label: "Exceptions", href: "/exceptions", icon: AlertCircle },
    ],
  },
  {
    label: "Training",
    group: "training",
    items: [
      { label: "Courses", href: "/training", icon: GraduationCap },
    ],
  },
  {
    label: "Settings",
    group: "settings",
    items: [
      { label: "Integrations", href: "/settings", icon: Settings },
      { label: "Users & Roles", href: "/users/roles", icon: UserCog },
    ],
  },
];

export function getVisibleSections(role: string): NavSection[] {
  const groups = getVisibleGroups(role);
  return NAV_SECTIONS.filter((s) => groups.includes(s.group));
}
