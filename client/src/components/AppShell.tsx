import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getVisibleSections, type NavSection } from "@/config/navigation";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Bell,
  ChevronsUpDown,
  LogOut,
  Search,
  PanelLeft,
  LayoutDashboard,
  Users,
  Building2,
  Receipt,
  ShieldCheck,
  Calendar,
  GraduationCap,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { type ReactNode, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import CommandSearch from "./CommandSearch";

// ── Module icon mapping ──────────────────────────────────────────────

const MODULE_ICONS: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Workers: Users,
  Clients: Building2,
  Billing: Receipt,
  Compliance: ShieldCheck,
  Operations: Calendar,
  Training: GraduationCap,
  Settings: Settings,
};

// ── Types ────────────────────────────────────────────────────────────

type AppShellProps = {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
};

// ── Main Export ──────────────────────────────────────────────────────

export default function AppShell({ children, title, actions }: AppShellProps) {
  const { loading, user } = useAuth();

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50">
      <AppShellSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppShellTopBar title={title} actions={actions} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <CommandSearch />
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────

function AppShellSidebar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);

  const sections = getVisibleSections(user?.role ?? "user");

  // Determine which module is active based on current route
  const activeModule = useMemo(() => {
    for (const section of sections) {
      for (const item of section.items) {
        if (location === item.href || location.startsWith(item.href + "/")) {
          return section.label;
        }
      }
    }
    return sections[0]?.label ?? "Dashboard";
  }, [location, sections]);

  const [selectedModule, setSelectedModule] = useState(activeModule);

  // Sync selected module when route changes
  useMemo(() => {
    setSelectedModule(activeModule);
  }, [activeModule]);

  const activeSection = sections.find((s) => s.label === selectedModule);

  if (isMobile && collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed top-3 left-3 z-50 h-9 w-9 rounded-lg bg-white border shadow-sm flex items-center justify-center hover:bg-slate-50"
      >
        <PanelLeft className="h-4 w-4" />
      </button>
    );
  }

  const roleBadgeColor = (role: string) => {
    const map: Record<string, string> = {
      admin: "bg-red-50 text-red-700",
      hr: "bg-blue-50 text-blue-700",
      billing: "bg-emerald-50 text-emerald-700",
      coordinator: "bg-cyan-50 text-cyan-700",
      supervisor: "bg-purple-50 text-purple-700",
      compliance: "bg-amber-50 text-amber-700",
    };
    return map[role] || "bg-slate-100 text-slate-600";
  };

  return (
    <div className="flex h-full shrink-0">
      {/* ── Icon Rail (module tabs) ──────────────── */}
      <div className="w-[56px] bg-[#1B3A4B] flex flex-col items-center py-3 gap-1 shrink-0">
        {/* Logo */}
        <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center mb-3">
          <span className="text-white font-bold text-xs tracking-tight">CB</span>
        </div>

        {/* Module tabs */}
        <div className="flex-1 flex flex-col gap-0.5 w-full px-1.5">
          {sections.map((section) => {
            const Icon = MODULE_ICONS[section.label] || LayoutDashboard;
            const isActive = selectedModule === section.label;

            return (
              <Tooltip key={section.label} delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      setSelectedModule(section.label);
                      // Navigate to the first item in this section
                      if (section.items[0]) {
                        setLocation(section.items[0].href);
                      }
                    }}
                    className={`
                      w-full h-10 rounded-lg flex items-center justify-center transition-all
                      ${isActive
                        ? "bg-white/15 text-white"
                        : "text-white/50 hover:text-white/80 hover:bg-white/5"
                      }
                    `}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {section.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* User avatar at bottom */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="mt-auto focus:outline-none">
              <Avatar className="h-8 w-8 border-2 border-white/20 hover:border-white/40 transition-colors">
                <AvatarFallback
                  className="text-[10px] font-semibold bg-emerald-400/20 text-emerald-200"
                >
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium mt-1.5 ${roleBadgeColor(user?.role || "user")}`}>
                {user?.role?.toUpperCase()}
              </span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Sub-nav Panel ────────────────────────── */}
      <div className="w-[180px] bg-white border-r border-slate-200 flex flex-col">
        {/* Module title */}
        <div className="h-14 flex items-center px-4 border-b border-slate-100">
          <span className="text-[13px] font-semibold text-slate-900 tracking-tight">
            {selectedModule}
          </span>
        </div>

        {/* Sub-items */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {activeSection?.items.map((item) => {
            const isActive =
              location === item.href ||
              (item.href !== "/dashboard" && location.startsWith(item.href + "/"));

            return (
              <button
                key={item.href}
                onClick={() => setLocation(item.href)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors text-left
                  ${isActive
                    ? "bg-emerald-50 text-emerald-700 font-medium"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

// ── Top Bar ──────────────────────────────────────────────────────────

function AppShellTopBar({ title, actions }: { title?: string; actions?: ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();
  const sections = getVisibleSections(user?.role ?? "user");

  const activeItem = sections
    .flatMap((s) => s.items)
    .find((item) => location === item.href || location.startsWith(item.href + "/"));

  const pageTitle = title || activeItem?.label || "Dashboard";

  return (
    <div className="h-14 flex items-center justify-between border-b bg-white px-5 shrink-0">
      <h1 className="text-[15px] font-semibold text-slate-900 tracking-tight">
        {pageTitle}
      </h1>

      <div className="flex items-center gap-1.5">
        {/* Cmd+K Search */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true })
            );
          }}
          className="hidden md:flex items-center gap-2 text-muted-foreground h-8 px-2.5 text-xs border border-slate-200 bg-slate-50/50 hover:bg-slate-100"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search</span>
          <kbd className="pointer-events-none hidden md:inline-flex h-5 items-center gap-0.5 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-[11px]">⌘</span>K
          </kbd>
        </Button>

        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center px-1">
            3
          </span>
        </Button>

        {actions && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />
            {actions}
          </>
        )}
      </div>
    </div>
  );
}
