/**
 * CareBase Notification Service (stub)
 * Replaces Manus push notifications. Will be replaced by SES/Twilio in Phase 2.
 * For now, logs to console so callers don't break.
 */

export type NotificationPayload = {
  title: string;
  content: string;
};

export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  console.log(`[Notification] ${payload.title}: ${payload.content}`);
  return true;
}
