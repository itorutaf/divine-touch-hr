import * as db from "./db";
import { notifyOwner } from "./_core/notification";

const CATEGORY_LABELS: Record<string, string> = {
  clearance_patch: "PATCH Clearance",
  clearance_fbi: "FBI Clearance",
  clearance_child_abuse: "Child Abuse Clearance",
  id_drivers_license: "Driver's License",
  id_social_security: "Social Security Card",
  id_passport: "Passport",
  id_work_authorization: "Work Authorization",
  medical_physical: "Physical Exam",
  medical_tb_test: "TB Test",
  certification_cpr: "CPR Certification",
  certification_license: "Professional License",
  certification_training: "Training Certificate",
  form_i9: "I-9 Form",
  form_w4: "W-4 Form",
  form_direct_deposit: "Direct Deposit Form",
  application: "Application",
  resume: "Resume",
  reference: "Reference Letter",
  other: "Other Document",
};

interface ExpiringDocument {
  document: {
    id: number;
    employeeId: number;
    category: string;
    originalFileName: string;
    expirationDate: Date;
  };
  employee: {
    id: number;
    legalFirstName: string;
    legalLastName: string;
    email: string | null;
    employeeId: string;
  };
}

interface ExpirationCheckResult {
  expiring30Day: ExpiringDocument[];
  expiring14Day: ExpiringDocument[];
  expiring7Day: ExpiringDocument[];
  expired: ExpiringDocument[];
}

/**
 * Check for documents expiring within different thresholds
 */
export async function checkExpiringDocuments(): Promise<ExpirationCheckResult> {
  const [docs30, docs14, docs7, expired] = await Promise.all([
    db.getExpiringDocuments(30),
    db.getExpiringDocuments(14),
    db.getExpiringDocuments(7),
    db.getExpiredDocumentsToday(),
  ]);

  // Filter to get unique documents per threshold
  const expiring30Day = docs30.filter((d: ExpiringDocument) => {
    const daysUntil = Math.ceil((new Date(d.document.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil > 14 && daysUntil <= 30;
  });

  const expiring14Day = docs14.filter((d: ExpiringDocument) => {
    const daysUntil = Math.ceil((new Date(d.document.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil > 7 && daysUntil <= 14;
  });

  const expiring7Day = docs7.filter((d: ExpiringDocument) => {
    const daysUntil = Math.ceil((new Date(d.document.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 7;
  });

  return {
    expiring30Day,
    expiring14Day,
    expiring7Day,
    expired,
  };
}

/**
 * Format a single document for notification
 */
function formatDocumentLine(doc: ExpiringDocument): string {
  const categoryLabel = CATEGORY_LABELS[doc.document.category] || doc.document.category;
  const expDate = new Date(doc.document.expirationDate).toLocaleDateString();
  return `• ${doc.employee.legalFirstName} ${doc.employee.legalLastName} (${doc.employee.employeeId}) - ${categoryLabel} expires ${expDate}`;
}

/**
 * Build notification content for expiring documents
 */
type NotificationSeverity = "info" | "warning" | "critical";

function buildNotificationContent(result: ExpirationCheckResult, settings: any): { title: string; content: string; severity: NotificationSeverity } | null {
  const sections: string[] = [];
  
  if (settings?.alertThresholdExpired && result.expired.length > 0) {
    sections.push(`🚨 EXPIRED DOCUMENTS (${result.expired.length}):\n${result.expired.map(formatDocumentLine).join("\n")}`);
  }
  
  if (settings?.alertThreshold7Day && result.expiring7Day.length > 0) {
    sections.push(`⚠️ EXPIRING IN 7 DAYS (${result.expiring7Day.length}):\n${result.expiring7Day.map(formatDocumentLine).join("\n")}`);
  }
  
  if (settings?.alertThreshold14Day && result.expiring14Day.length > 0) {
    sections.push(`📋 EXPIRING IN 14 DAYS (${result.expiring14Day.length}):\n${result.expiring14Day.map(formatDocumentLine).join("\n")}`);
  }
  
  if (settings?.alertThreshold30Day && result.expiring30Day.length > 0) {
    sections.push(`📅 EXPIRING IN 30 DAYS (${result.expiring30Day.length}):\n${result.expiring30Day.map(formatDocumentLine).join("\n")}`);
  }
  
  if (sections.length === 0) {
    return null;
  }
  
  const totalCount = result.expired.length + result.expiring7Day.length + result.expiring14Day.length + result.expiring30Day.length;

  // Derive severity from the most urgent threshold present:
  //   expired → critical (triggers SMS), 7/14-day → warning (email + in-app), 30-day only → info
  let severity: NotificationSeverity = "info";
  if (result.expiring7Day.length > 0 || result.expiring14Day.length > 0) severity = "warning";
  if (result.expired.length > 0) severity = "critical";

  return {
    title: `📋 Divine Touch HR: ${totalCount} Document${totalCount !== 1 ? "s" : ""} Require Attention`,
    content: `Document Expiration Alert\n\n${sections.join("\n\n")}\n\nPlease review these documents in the HR system and take appropriate action.`,
    severity,
  };
}

/**
 * Run the daily expiration check and send notifications
 */
export async function runExpirationCheck(): Promise<{
  success: boolean;
  documentsFound: number;
  notificationSent: boolean;
  error?: string;
}> {
  try {
    // Get notification settings
    let settings = await db.getNotificationSettings();
    
    // Create default settings if none exist
    if (!settings) {
      await db.upsertNotificationSettings({
        alertThreshold30Day: true,
        alertThreshold14Day: true,
        alertThreshold7Day: true,
        alertThresholdExpired: true,
        monitorClearances: true,
        monitorCertifications: true,
        monitorLicenses: true,
        monitorMedical: true,
        dailyDigest: true,
        immediateAlerts: false,
      });
      settings = await db.getNotificationSettings();
    }
    
    // Check for expiring documents
    const result = await checkExpiringDocuments();
    const totalDocs = result.expired.length + result.expiring7Day.length + result.expiring14Day.length + result.expiring30Day.length;
    
    if (totalDocs === 0) {
      // Update last check run
      await db.upsertNotificationSettings({ lastCheckRun: new Date() });
      
      return {
        success: true,
        documentsFound: 0,
        notificationSent: false,
      };
    }
    
    // Build and send notification
    const notification = buildNotificationContent(result, settings);
    
    if (notification) {
      const sent = await notifyOwner(notification);
      
      // Log the notification
      await db.createNotificationLog({
        notificationType: "daily_digest",
        sentTo: JSON.stringify(["owner"]),
        status: sent ? "sent" : "failed",
        errorMessage: sent ? undefined : "Failed to send notification",
      });
      
      // Update last check run
      await db.upsertNotificationSettings({ lastCheckRun: new Date() });
      
      return {
        success: true,
        documentsFound: totalDocs,
        notificationSent: sent,
      };
    }
    
    return {
      success: true,
      documentsFound: totalDocs,
      notificationSent: false,
    };
  } catch (error) {
    console.error("[NotificationService] Error running expiration check:", error);
    return {
      success: false,
      documentsFound: 0,
      notificationSent: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get a summary of expiring documents for display
 */
export async function getExpirationSummary(): Promise<{
  expired: number;
  expiring7Day: number;
  expiring14Day: number;
  expiring30Day: number;
  documents: ExpiringDocument[];
}> {
  const result = await checkExpiringDocuments();
  
  return {
    expired: result.expired.length,
    expiring7Day: result.expiring7Day.length,
    expiring14Day: result.expiring14Day.length,
    expiring30Day: result.expiring30Day.length,
    documents: [
      ...result.expired,
      ...result.expiring7Day,
      ...result.expiring14Day,
      ...result.expiring30Day,
    ],
  };
}
