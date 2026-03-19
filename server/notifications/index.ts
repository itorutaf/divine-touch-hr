/**
 * CareBase Notification Engine — Public API
 *
 * Re-exports everything consumers need. Import from here:
 *   import { dispatch, notifyHRAndAdmin } from "./notifications";
 */

export { dispatch, notifyHRAndAdmin, notifyComplianceTeam } from "./dispatcher";
export type {
  NotificationEvent,
  NotificationCategory,
  NotificationSeverity,
  DeliveryResult,
} from "./types";
