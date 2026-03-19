/**
 * NotificationBell — Real-time notification dropdown for the AppShell top bar.
 *
 * Polls trpc.notifications.inApp.unreadCount every 30s for the badge count.
 * Shows a popover with recent notifications, grouped by severity.
 * Mark-as-read on click, bulk mark-all-read button in header.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Bell, Check, CheckCheck, ShieldAlert, Clock, FileX, UserPlus, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";

const CATEGORY_ICONS: Record<string, typeof Bell> = {
  intake: UserPlus,
  compliance: ShieldAlert,
  billing: FileX,
  scheduling: Clock,
  system: Info,
};

const SEVERITY_STYLES = {
  critical: {
    dot: "bg-red-500",
    row: "bg-red-500/[0.04] dark:bg-red-500/[0.08]",
    badge: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  },
  warning: {
    dot: "bg-amber-500",
    row: "bg-amber-500/[0.03] dark:bg-amber-500/[0.06]",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  info: {
    dot: "bg-blue-500",
    row: "",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
};

function timeAgo(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Poll unread count every 30s
  const { data: unreadCount = 0 } = trpc.notifications.inApp.unreadCount.useQuery(
    undefined,
    { refetchInterval: 30000 }
  );

  // Fetch notifications when popover opens
  const { data: notifications = [], isLoading } = trpc.notifications.inApp.list.useQuery(
    { limit: 20 },
    { enabled: open }
  );

  const markRead = trpc.notifications.inApp.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.inApp.unreadCount.invalidate();
      utils.notifications.inApp.list.invalidate();
    },
  });

  const markAllRead = trpc.notifications.inApp.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.inApp.unreadCount.invalidate();
      utils.notifications.inApp.list.invalidate();
    },
  });

  const handleNotificationClick = (id: number, read: boolean, actionUrl?: string | null) => {
    if (!read) {
      markRead.mutate({ notificationId: id });
    }
    if (actionUrl) {
      navigate(actionUrl);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center px-1 animate-in zoom-in duration-200">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[380px] p-0 shadow-xl border-border"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification List */}
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notif) => {
                const severity = notif.severity as keyof typeof SEVERITY_STYLES;
                const styles = SEVERITY_STYLES[severity] || SEVERITY_STYLES.info;
                const Icon = CATEGORY_ICONS[notif.category] || Bell;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.id, notif.read, notif.actionUrl)}
                    className={`
                      flex items-start gap-3 px-4 py-3 cursor-pointer
                      hover:bg-accent/30 transition-colors duration-150
                      ${!notif.read ? styles.row : "opacity-60"}
                    `}
                  >
                    {/* Category Icon */}
                    <div className={`
                      h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5
                      ${severity === "critical"
                        ? "bg-red-500/10 dark:bg-red-500/20 text-red-500"
                        : severity === "warning"
                          ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-500"
                          : "bg-blue-500/10 dark:bg-blue-500/20 text-blue-500"
                      }
                    `}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-[13px] font-medium truncate ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${styles.dot}`} />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {notif.body}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-border px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs text-primary hover:text-primary"
              onClick={() => {
                navigate("/notifications");
                setOpen(false);
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
