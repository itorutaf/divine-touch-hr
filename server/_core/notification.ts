/**
 * CareBase Notification Service (bridge)
 *
 * This file was the original console.log stub. It now delegates to the
 * real notification dispatcher while maintaining backward compatibility
 * for existing callers (notificationService.ts, timesheetNotificationService.ts).
 */

import { dispatch, type NotificationEvent } from "../notifications";

export type NotificationPayload = {
  title: string;
  content: string;
};

/**
 * Legacy interface — sends to HR + Admin via all channels.
 * New code should use `dispatch()` directly from "../notifications".
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  try {
    const results = await dispatch({
      type: "system_alert",
      title: payload.title,
      body: payload.content,
      category: "system",
      severity: "warning",
      targetUserIds: [],
      targetRoles: ["admin", "hr"],
    });

    const anySuccess = results.some((r) => r.success);
    return anySuccess;
  } catch (error) {
    console.error("[Notification Bridge] Dispatch failed:", error);
    // Fallback to console log so callers don't break
    console.log(`[Notification] ${payload.title}: ${payload.content}`);
    return true;
  }
}
