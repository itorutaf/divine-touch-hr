import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, date, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow with role-based access control.
 * Roles: admin, hr, supervisor, compliance, billing, coordinator
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  password: varchar("password", { length: 256 }), // scrypt hash (nullable for legacy/SSO users)
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "hr", "supervisor", "compliance", "billing", "coordinator"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Role matrix defining requirements for each role/service line combination
 */
export const roleMatrix = mysqlTable("role_matrix", {
  id: int("id").autoincrement().primaryKey(),
  roleName: varchar("roleName", { length: 128 }).notNull(),
  serviceLine: mysqlEnum("serviceLine", ["OLTL", "ODP", "Skilled"]).notNull(),
  requiredDocuments: text("requiredDocuments"),
  requiredClearances: text("requiredClearances"),
  requiredTrainings: text("requiredTrainings"),
  skilledLicenseRequired: boolean("skilledLicenseRequired").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RoleMatrix = typeof roleMatrix.$inferSelect;
export type InsertRoleMatrix = typeof roleMatrix.$inferInsert;

/**
 * Main employee onboarding tracker - 76 columns from Google Sheets schema
 * Designed to scale for future payroll module integration
 */
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  
  // Basic Information (Columns 1-16)
  employeeId: varchar("employeeId", { length: 32 }).notNull().unique(),
  legalFirstName: varchar("legalFirstName", { length: 128 }).notNull(),
  legalLastName: varchar("legalLastName", { length: 128 }).notNull(),
  preferredName: varchar("preferredName", { length: 128 }),
  dob: date("dob"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  addressLine1: varchar("addressLine1", { length: 256 }),
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 64 }),
  zip: varchar("zip", { length: 16 }),
  ssnLast4: varchar("ssnLast4", { length: 4 }),
  roleAppliedFor: varchar("roleAppliedFor", { length: 128 }),
  serviceLine: mysqlEnum("serviceLine", ["OLTL", "ODP", "Skilled"]),
  hiringSource: varchar("hiringSource", { length: 128 }),
  submissionId: varchar("submissionId", { length: 128 }),
  submissionTimestamp: timestamp("submissionTimestamp"),
  
  // Pipeline Status (Columns 17-25)
  currentPhase: mysqlEnum("currentPhase", [
    "Intake", "Screening", "Documentation", "Verification", 
    "Provisioning", "Ready to Schedule", "Active", "Post-Onboarding"
  ]).default("Intake"),
  status: mysqlEnum("status", [
    "Pending Review", "In Progress", "Action Required", 
    "On Hold", "Complete", "Withdrawn", "Rejected"
  ]).default("Pending Review"),
  nextAction: text("nextAction"),
  owner: varchar("owner", { length: 128 }),
  dueDate: date("dueDate"),
  priority: mysqlEnum("priority", ["High", "Medium", "Low"]).default("Medium"),
  escalationFlag: boolean("escalationFlag").default(false),
  completionPercent: int("completionPercent").default(0),
  
  // DocuSign Packet 1 (Columns 26-28)
  dsPacket1EnvelopeId: varchar("dsPacket1EnvelopeId", { length: 128 }),
  dsPacket1Status: mysqlEnum("dsPacket1Status", ["Not Sent", "Sent", "Delivered", "Completed", "Declined", "Voided"]).default("Not Sent"),
  dsPacket1CompletedDate: date("dsPacket1CompletedDate"),
  
  // DocuSign Packet 2 (Columns 29-31)
  dsPacket2EnvelopeId: varchar("dsPacket2EnvelopeId", { length: 128 }),
  dsPacket2Status: mysqlEnum("dsPacket2Status", ["Not Sent", "Sent", "Delivered", "Completed", "Declined", "Voided"]).default("Not Sent"),
  dsPacket2CompletedDate: date("dsPacket2CompletedDate"),
  
  // I-9 Verification (Columns 32-34)
  i9Complete: boolean("i9Complete").default(false),
  i9VerifiedBy: varchar("i9VerifiedBy", { length: 128 }),
  i9VerifiedDate: date("i9VerifiedDate"),
  
  // Background Clearances (Columns 35-42)
  patchReceived: boolean("patchReceived").default(false),
  patchDate: date("patchDate"),
  fbiReceived: boolean("fbiReceived").default(false),
  fbiDate: date("fbiDate"),
  childAbuseReceived: boolean("childAbuseReceived").default(false),
  childAbuseDate: date("childAbuseDate"),
  physicalTbComplete: boolean("physicalTbComplete").default(false),
  physicalTbDate: date("physicalTbDate"),
  
  // CPR Certification (Columns 43-44)
  cprComplete: boolean("cprComplete").default(false),
  cprExpDate: date("cprExpDate"),
  
  // License Verification - Skilled Roles (Columns 45-47)
  licenseVerified: boolean("licenseVerified").default(false),
  licenseNumber: varchar("licenseNumber", { length: 64 }),
  licenseExpDate: date("licenseExpDate"),
  
  // Payroll Setup (Columns 48-49)
  payrollAdded: boolean("payrollAdded").default(false),
  payrollVerifiedBy: varchar("payrollVerifiedBy", { length: 128 }),
  
  // EVV/HHA Setup (Columns 50-51)
  evvHhaProfileCreated: boolean("evvHhaProfileCreated").default(false),
  evvHhaProfileVerified: boolean("evvHhaProfileVerified").default(false),
  
  // Scheduling Status (Columns 52-55)
  readyToSchedule: boolean("readyToSchedule").default(false),
  firstShiftDate: date("firstShiftDate"),
  firstShiftConfirmed: boolean("firstShiftConfirmed").default(false),
  activeDate: date("activeDate"),
  
  // Google Drive Folder URLs (Columns 56-65)
  employeeFolderUrl: text("employeeFolderUrl"),
  offerFolderUrl: text("offerFolderUrl"),
  applicationIntakeFolderUrl: text("applicationIntakeFolderUrl"),
  i9FolderUrl: text("i9FolderUrl"),
  backgroundFolderUrl: text("backgroundFolderUrl"),
  documentationFolderUrl: text("documentationFolderUrl"),
  medicalFolderUrl: text("medicalFolderUrl"),
  trainingFolderUrl: text("trainingFolderUrl"),
  payrollFolderUrl: text("payrollFolderUrl"),
  evvHhaFolderUrl: text("evvHhaFolderUrl"),
  
  // Notes (Columns 66-67)
  hrNotes: text("hrNotes"),
  complianceNotes: text("complianceNotes"),
  
  // Pay Rate - Future Payroll Integration (Columns 68-70)
  payRate: decimal("payRate", { precision: 10, scale: 2 }),
  payType: mysqlEnum("payType", ["Hourly", "Salary"]),
  proposedStartDate: date("proposedStartDate"),
  
  // Audit Fields (Columns 71-76)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
  lastModifiedBy: int("lastModifiedBy"),
  googleSheetRowId: int("googleSheetRowId"),
  lastSyncedAt: timestamp("lastSyncedAt"),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

/**
 * Human gate approvals - tracks all 8 approval workflows
 */
export const gateApprovals = mysqlTable("gate_approvals", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  gateType: mysqlEnum("gateType", [
    "HR_COMPLETENESS_REVIEW",
    "PAY_RATE_START_DATE_APPROVAL",
    "CLEARANCES_VERIFICATION",
    "I9_VERIFICATION",
    "LICENSE_VERIFICATION",
    "PAYROLL_VERIFICATION",
    "EVV_HHA_VERIFICATION",
    "SUPERVISOR_READY_SIGNOFF"
  ]).notNull(),
  status: mysqlEnum("status", ["Pending", "Approved", "Rejected", "Needs Review"]).default("Pending"),
  approvedBy: int("approvedBy"),
  approvedByName: varchar("approvedByName", { length: 128 }),
  approvedAt: timestamp("approvedAt"),
  notes: text("notes"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GateApproval = typeof gateApprovals.$inferSelect;
export type InsertGateApproval = typeof gateApprovals.$inferInsert;

/**
 * Audit log for compliance tracking
 */
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId"),
  userId: int("userId"),
  userName: varchar("userName", { length: 128 }),
  action: varchar("action", { length: 64 }).notNull(),
  tableName: varchar("tableName", { length: 64 }),
  recordId: int("recordId"),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

/**
 * Exceptions tracking for weekly digest
 */
export const exceptions = mysqlTable("exceptions", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  issue: text("issue").notNull(),
  owner: varchar("owner", { length: 128 }),
  dueDate: date("dueDate"),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: int("resolvedBy"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Exception = typeof exceptions.$inferSelect;
export type InsertException = typeof exceptions.$inferInsert;

/**
 * Google Sheets sync configuration and status
 */
export const sheetsSync = mysqlTable("sheets_sync", {
  id: int("id").autoincrement().primaryKey(),
  spreadsheetId: varchar("spreadsheetId", { length: 256 }),
  sheetName: varchar("sheetName", { length: 128 }),
  lastSyncAt: timestamp("lastSyncAt"),
  syncDirection: mysqlEnum("syncDirection", ["to_sheets", "from_sheets", "bidirectional"]).default("bidirectional"),
  syncStatus: mysqlEnum("syncStatus", ["idle", "syncing", "error", "disabled"]).default("idle"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SheetsSync = typeof sheetsSync.$inferSelect;
export type InsertSheetsSync = typeof sheetsSync.$inferInsert;


/**
 * Employee documents - stores uploaded files for onboarding
 */
export const employeeDocuments = mysqlTable("employee_documents", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  
  // Document metadata
  fileName: varchar("fileName", { length: 256 }).notNull(),
  originalFileName: varchar("originalFileName", { length: 256 }).notNull(),
  fileSize: int("fileSize").notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  
  // S3 storage
  s3Key: varchar("s3Key", { length: 512 }).notNull(),
  s3Url: text("s3Url").notNull(),
  
  // Document categorization
  category: mysqlEnum("category", [
    "clearance_patch",
    "clearance_fbi", 
    "clearance_child_abuse",
    "id_drivers_license",
    "id_social_security",
    "id_passport",
    "id_work_authorization",
    "medical_physical",
    "medical_tb_test",
    "certification_cpr",
    "certification_license",
    "certification_training",
    "form_i9",
    "form_w4",
    "form_direct_deposit",
    "application",
    "resume",
    "reference",
    "other"
  ]).notNull(),
  
  // Status tracking
  status: mysqlEnum("status", ["pending_review", "approved", "rejected", "expired"]).default("pending_review"),
  reviewedBy: int("reviewedBy"),
  reviewedByName: varchar("reviewedByName", { length: 128 }),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  
  // Expiration tracking (for clearances, certifications)
  expirationDate: date("expirationDate"),
  
  // Audit fields
  uploadedBy: int("uploadedBy"),
  uploadedByName: varchar("uploadedByName", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmployeeDocument = typeof employeeDocuments.$inferSelect;
export type InsertEmployeeDocument = typeof employeeDocuments.$inferInsert;


/**
 * Notification settings for document expiration alerts
 */
export const notificationSettings = mysqlTable("notification_settings", {
  id: int("id").autoincrement().primaryKey(),
  
  // Alert thresholds (days before expiration)
  alertThreshold30Day: boolean("alertThreshold30Day").default(true),
  alertThreshold14Day: boolean("alertThreshold14Day").default(true),
  alertThreshold7Day: boolean("alertThreshold7Day").default(true),
  alertThresholdExpired: boolean("alertThresholdExpired").default(true),
  
  // Document categories to monitor
  monitorClearances: boolean("monitorClearances").default(true),
  monitorCertifications: boolean("monitorCertifications").default(true),
  monitorLicenses: boolean("monitorLicenses").default(true),
  monitorMedical: boolean("monitorMedical").default(true),
  
  // Notification frequency
  dailyDigest: boolean("dailyDigest").default(true),
  immediateAlerts: boolean("immediateAlerts").default(false),
  
  // Last run timestamp
  lastCheckRun: timestamp("lastCheckRun"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = typeof notificationSettings.$inferInsert;

/**
 * Notification log for tracking sent alerts
 */
export const notificationLog = mysqlTable("notification_log", {
  id: int("id").autoincrement().primaryKey(),
  
  // Reference to document
  documentId: int("documentId"),
  employeeId: int("employeeId"),
  
  // Notification details
  notificationType: mysqlEnum("notificationType", [
    "expiring_30_day",
    "expiring_14_day", 
    "expiring_7_day",
    "expired",
    "daily_digest"
  ]).notNull(),
  
  // Employee and document info at time of notification
  employeeName: varchar("employeeName", { length: 256 }),
  documentCategory: varchar("documentCategory", { length: 64 }),
  expirationDate: date("expirationDate"),
  
  // Delivery status
  sentTo: text("sentTo"), // JSON array of email addresses
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["sent", "failed", "pending"]).default("pending"),
  errorMessage: text("errorMessage"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationLog = typeof notificationLog.$inferSelect;
export type InsertNotificationLog = typeof notificationLog.$inferInsert;


/**
 * Pay periods for timesheet tracking
 */
export const payPeriods = mysqlTable("pay_periods", {
  id: int("id").autoincrement().primaryKey(),
  
  // Period details
  periodName: varchar("periodName", { length: 64 }).notNull(), // e.g., "Dec 16-29, 2025"
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  
  // Payroll deadline
  timesheetDueDate: date("timesheetDueDate").notNull(),
  payrollProcessDate: date("payrollProcessDate"),
  
  // Status
  status: mysqlEnum("status", ["upcoming", "active", "closed", "processed"]).default("upcoming"),
  
  // Reminder settings
  reminderSent: boolean("reminderSent").default(false),
  finalReminderSent: boolean("finalReminderSent").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PayPeriod = typeof payPeriods.$inferSelect;
export type InsertPayPeriod = typeof payPeriods.$inferInsert;

/**
 * Employee timesheets with EVV compliance tracking
 */
export const timesheets = mysqlTable("timesheets", {
  id: int("id").autoincrement().primaryKey(),
  
  // Employee and pay period reference
  employeeId: int("employeeId").notNull(),
  payPeriodId: int("payPeriodId").notNull(),
  
  // Timesheet file
  fileKey: varchar("fileKey", { length: 512 }),
  fileUrl: varchar("fileUrl", { length: 1024 }),
  originalFileName: varchar("originalFileName", { length: 256 }),
  mimeType: varchar("mimeType", { length: 128 }),
  fileSize: int("fileSize"),
  
  // Timesheet details
  totalHours: decimal("totalHours", { precision: 6, scale: 2 }),
  participantName: varchar("participantName", { length: 256 }),
  
  // Signature tracking
  signatureType: mysqlEnum("signatureType", ["wet", "digital", "pending"]).default("pending"),
  participantSigned: boolean("participantSigned").default(false),
  participantSignedDate: date("participantSignedDate"),
  employeeSigned: boolean("employeeSigned").default(false),
  employeeSignedDate: date("employeeSignedDate"),
  
  // EVV compliance
  evvCompliant: boolean("evvCompliant").default(false),
  evvVerifiedBy: int("evvVerifiedBy"),
  evvVerifiedByName: varchar("evvVerifiedByName", { length: 128 }),
  evvVerifiedDate: timestamp("evvVerifiedDate"),
  evvNotes: text("evvNotes"),
  
  // Approval workflow
  status: mysqlEnum("status", [
    "draft",
    "submitted", 
    "pending_review",
    "approved",
    "rejected",
    "needs_correction"
  ]).default("draft"),
  
  // Review tracking
  reviewedBy: int("reviewedBy"),
  reviewedByName: varchar("reviewedByName", { length: 128 }),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  
  // Payroll integration
  payrollReady: boolean("payrollReady").default(false),
  payrollProcessedDate: timestamp("payrollProcessedDate"),
  
  // Audit fields
  submittedAt: timestamp("submittedAt"),
  uploadedBy: int("uploadedBy"),
  uploadedByName: varchar("uploadedByName", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Timesheet = typeof timesheets.$inferSelect;
export type InsertTimesheet = typeof timesheets.$inferInsert;

/**
 * Timesheet templates for download/print
 */
export const timesheetTemplates = mysqlTable("timesheet_templates", {
  id: int("id").autoincrement().primaryKey(),
  
  // Template details
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  serviceLine: mysqlEnum("serviceLine", ["OLTL", "ODP", "Skilled", "All"]).default("All"),
  
  // File storage
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1024 }).notNull(),
  originalFileName: varchar("originalFileName", { length: 256 }),
  mimeType: varchar("mimeType", { length: 128 }),
  
  // Status
  isActive: boolean("isActive").default(true),
  
  // Audit fields
  uploadedBy: int("uploadedBy"),
  uploadedByName: varchar("uploadedByName", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TimesheetTemplate = typeof timesheetTemplates.$inferSelect;
export type InsertTimesheetTemplate = typeof timesheetTemplates.$inferInsert;

/**
 * Timesheet reminder log
 */
export const timesheetReminders = mysqlTable("timesheet_reminders", {
  id: int("id").autoincrement().primaryKey(),
  
  // References
  employeeId: int("employeeId").notNull(),
  payPeriodId: int("payPeriodId").notNull(),
  
  // Reminder details
  reminderType: mysqlEnum("reminderType", [
    "first_reminder",
    "second_reminder", 
    "final_reminder",
    "overdue_notice"
  ]).notNull(),
  
  // Delivery status
  sentTo: varchar("sentTo", { length: 320 }),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["sent", "failed", "pending"]).default("pending"),
  errorMessage: text("errorMessage"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TimesheetReminder = typeof timesheetReminders.$inferSelect;
export type InsertTimesheetReminder = typeof timesheetReminders.$inferInsert;


// ============ PAYROLL & TAX INFORMATION ============

/**
 * Employee tax information for W-2/1099 and payroll processing
 */
export const employeeTaxInfo = mysqlTable("employee_tax_info", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull().unique(),
  
  // Tax Classification
  taxClassification: mysqlEnum("taxClassification", ["W2", "1099"]).default("W2"),
  
  // SSN (encrypted/masked - full SSN for payroll)
  ssnFull: varchar("ssnFull", { length: 11 }), // Format: XXX-XX-XXXX (encrypted in production)
  
  // W-4 Federal Tax Information
  federalFilingStatus: mysqlEnum("federalFilingStatus", [
    "Single", 
    "Married Filing Jointly", 
    "Married Filing Separately",
    "Head of Household"
  ]),
  federalAllowances: int("federalAllowances").default(0),
  additionalFederalWithholding: decimal("additionalFederalWithholding", { precision: 10, scale: 2 }),
  federalExempt: boolean("federalExempt").default(false),
  
  // State Tax Information
  stateFilingStatus: varchar("stateFilingStatus", { length: 64 }),
  stateAllowances: int("stateAllowances").default(0),
  additionalStateWithholding: decimal("additionalStateWithholding", { precision: 10, scale: 2 }),
  stateExempt: boolean("stateExempt").default(false),
  workState: varchar("workState", { length: 2 }),
  residentState: varchar("residentState", { length: 2 }),
  
  // Local Tax
  localTaxCode: varchar("localTaxCode", { length: 32 }),
  localWithholding: decimal("localWithholding", { precision: 10, scale: 2 }),
  
  // W-4 Form Details (2020+ version)
  multipleJobsOrSpouseWorks: boolean("multipleJobsOrSpouseWorks").default(false),
  dependentsAmount: decimal("dependentsAmount", { precision: 10, scale: 2 }),
  otherIncome: decimal("otherIncome", { precision: 10, scale: 2 }),
  deductions: decimal("deductions", { precision: 10, scale: 2 }),
  
  // 1099 Specific
  ein: varchar("ein", { length: 12 }), // For 1099 contractors with business
  businessName: varchar("businessName", { length: 256 }),
  
  // Verification
  w4ReceivedDate: date("w4ReceivedDate"),
  w4VerifiedBy: int("w4VerifiedBy"),
  w9ReceivedDate: date("w9ReceivedDate"), // For 1099
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmployeeTaxInfo = typeof employeeTaxInfo.$inferSelect;
export type InsertEmployeeTaxInfo = typeof employeeTaxInfo.$inferInsert;

/**
 * Employee direct deposit information
 */
export const employeeDirectDeposit = mysqlTable("employee_direct_deposit", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  
  // Bank Information
  bankName: varchar("bankName", { length: 128 }),
  accountType: mysqlEnum("accountType", ["Checking", "Savings"]),
  routingNumber: varchar("routingNumber", { length: 9 }),
  accountNumber: varchar("accountNumber", { length: 17 }), // Encrypted in production
  
  // Split deposit settings
  depositType: mysqlEnum("depositType", ["Full", "Percentage", "Fixed Amount"]).default("Full"),
  depositAmount: decimal("depositAmount", { precision: 10, scale: 2 }),
  depositPercent: int("depositPercent"),
  priority: int("priority").default(1), // For multiple accounts
  
  // Status
  isActive: boolean("isActive").default(true),
  isPrimary: boolean("isPrimary").default(true),
  
  // Verification
  voidedCheckReceived: boolean("voidedCheckReceived").default(false),
  verifiedBy: int("verifiedBy"),
  verifiedDate: date("verifiedDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmployeeDirectDeposit = typeof employeeDirectDeposit.$inferSelect;
export type InsertEmployeeDirectDeposit = typeof employeeDirectDeposit.$inferInsert;

/**
 * Employee benefits enrollment
 */
export const employeeBenefits = mysqlTable("employee_benefits", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  
  // Benefit Type
  benefitType: mysqlEnum("benefitType", [
    "Health Insurance",
    "Dental Insurance", 
    "Vision Insurance",
    "Life Insurance",
    "401k",
    "HSA",
    "FSA",
    "Other"
  ]).notNull(),
  
  // Plan Details
  planName: varchar("planName", { length: 128 }),
  planId: varchar("planId", { length: 64 }),
  coverageLevel: mysqlEnum("coverageLevel", [
    "Employee Only",
    "Employee + Spouse",
    "Employee + Children",
    "Family"
  ]),
  
  // Contribution
  employeeContribution: decimal("employeeContribution", { precision: 10, scale: 2 }),
  employerContribution: decimal("employerContribution", { precision: 10, scale: 2 }),
  contributionFrequency: mysqlEnum("contributionFrequency", ["Per Pay Period", "Monthly", "Annual"]),
  
  // Status
  enrollmentStatus: mysqlEnum("enrollmentStatus", ["Enrolled", "Waived", "Pending", "Terminated"]).default("Pending"),
  effectiveDate: date("effectiveDate"),
  terminationDate: date("terminationDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmployeeBenefits = typeof employeeBenefits.$inferSelect;
export type InsertEmployeeBenefits = typeof employeeBenefits.$inferInsert;

/**
 * Employee compensation details (extends basic pay rate)
 */
export const employeeCompensation = mysqlTable("employee_compensation", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull().unique(),
  
  // Employment Classification
  employmentType: mysqlEnum("employmentType", ["Full-Time", "Part-Time", "PRN", "Contract"]),
  flsaStatus: mysqlEnum("flsaStatus", ["Exempt", "Non-Exempt"]).default("Non-Exempt"),
  
  // Pay Information
  payRate: decimal("payRate", { precision: 10, scale: 2 }),
  payType: mysqlEnum("payType", ["Hourly", "Salary", "Per Visit", "Per Diem"]),
  payFrequency: mysqlEnum("payFrequency", ["Weekly", "Bi-Weekly", "Semi-Monthly", "Monthly"]),
  
  // Overtime
  overtimeEligible: boolean("overtimeEligible").default(true),
  overtimeRate: decimal("overtimeRate", { precision: 5, scale: 2 }).default("1.50"), // Multiplier (1.5x)
  
  // Differentials
  weekendDifferential: decimal("weekendDifferential", { precision: 10, scale: 2 }),
  nightDifferential: decimal("nightDifferential", { precision: 10, scale: 2 }),
  holidayRate: decimal("holidayRate", { precision: 5, scale: 2 }), // Multiplier
  
  // Annual Salary (for salaried employees)
  annualSalary: decimal("annualSalary", { precision: 12, scale: 2 }),
  
  // Effective dates
  effectiveDate: date("effectiveDate"),
  previousPayRate: decimal("previousPayRate", { precision: 10, scale: 2 }),
  lastRaiseDate: date("lastRaiseDate"),
  
  // Department/Cost Center
  departmentCode: varchar("departmentCode", { length: 32 }),
  costCenter: varchar("costCenter", { length: 32 }),
  jobCode: varchar("jobCode", { length: 32 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmployeeCompensation = typeof employeeCompensation.$inferSelect;
export type InsertEmployeeCompensation = typeof employeeCompensation.$inferInsert;

/**
 * Payroll export history - tracks all exports for audit
 */
export const payrollExports = mysqlTable("payroll_exports", {
  id: int("id").autoincrement().primaryKey(),
  
  // Export Details
  exportType: mysqlEnum("exportType", [
    "employee_new_hire",
    "employee_update",
    "payroll_run",
    "hha_sync"
  ]).notNull(),
  
  targetSystem: mysqlEnum("targetSystem", [
    "UKG",
    "ADP",
    "Paychex",
    "HHA_Exchange",
    "Generic_CSV"
  ]).notNull(),
  
  // File Information
  fileName: varchar("fileName", { length: 256 }),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 256 }),
  recordCount: int("recordCount"),
  
  // Pay Period (for payroll run exports)
  payPeriodId: int("payPeriodId"),
  
  // Status
  status: mysqlEnum("status", ["pending", "completed", "failed", "cancelled"]).default("pending"),
  errorMessage: text("errorMessage"),
  
  // Review
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  
  // Audit
  exportedBy: int("exportedBy").notNull(),
  exportedAt: timestamp("exportedAt").defaultNow().notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PayrollExport = typeof payrollExports.$inferSelect;
export type InsertPayrollExport = typeof payrollExports.$inferInsert;

/**
 * HHA Exchange employee mapping
 */
export const hhaEmployeeMapping = mysqlTable("hha_employee_mapping", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull().unique(),
  
  // HHA Exchange IDs
  hhaEmployeeId: varchar("hhaEmployeeId", { length: 64 }),
  hhaProviderId: varchar("hhaProviderId", { length: 64 }),
  
  // Sync Status
  lastSyncedAt: timestamp("lastSyncedAt"),
  syncStatus: mysqlEnum("syncStatus", ["synced", "pending", "error", "not_synced"]).default("not_synced"),
  syncErrorMessage: text("syncErrorMessage"),
  
  // Data direction
  sourceSystem: mysqlEnum("sourceSystem", ["divine_touch", "hha_exchange"]),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HhaEmployeeMapping = typeof hhaEmployeeMapping.$inferSelect;
export type InsertHhaEmployeeMapping = typeof hhaEmployeeMapping.$inferInsert;


// ============ CAREBASE PHASE 1: CLIENT & COMPLIANCE TABLES ============

/**
 * Client records — referral through discharge lifecycle
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 36 }),

  // Identity
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  dob: date("dob"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  addressLine1: varchar("addressLine1", { length: 256 }),
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 64 }),
  zip: varchar("zip", { length: 16 }),
  county: varchar("county", { length: 128 }),

  // Service configuration
  serviceLine: mysqlEnum("serviceLine", ["OLTL", "ODP", "Skilled"]),
  region: int("region"), // 1-4 PA regions
  serviceType: varchar("serviceType", { length: 128 }),
  mcoId: varchar("mcoId", { length: 50 }),
  referralSource: varchar("referralSource", { length: 200 }),

  // Lifecycle
  status: mysqlEnum("clientStatus", ["referral", "assessment", "active", "on_hold", "discharged"]).default("referral"),
  assignedCoordinatorId: int("assignedCoordinatorId"),
  startDate: date("startDate"),
  dischargeDate: date("dischargeDate"),
  dischargeReason: text("dischargeReason"),

  // Emergency contact
  emergencyContactName: varchar("emergencyContactName", { length: 200 }),
  emergencyContactPhone: varchar("emergencyContactPhone", { length: 20 }),
  emergencyContactRelation: varchar("emergencyContactRelation", { length: 100 }),

  // Service coordinator (MCO side)
  serviceCoordinatorName: varchar("serviceCoordinatorName", { length: 200 }),
  serviceCoordinatorPhone: varchar("serviceCoordinatorPhone", { length: 20 }),
  serviceCoordinatorEmail: varchar("serviceCoordinatorEmail", { length: 320 }),

  // Onboarding
  onboardingChecklist: text("onboardingChecklist"), // JSON
  notes: text("notes"),

  // Audit
  createdBy: int("createdBy"),
  lastModifiedBy: int("lastModifiedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Authorization tracking — authorized vs delivered hours per client
 */
export const authorizations = mysqlTable("authorizations", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  mco: varchar("mco", { length: 100 }),
  serviceType: varchar("serviceType", { length: 100 }),
  authorizedHoursPerWeek: decimal("authorizedHoursPerWeek", { precision: 6, scale: 2 }),
  startDate: date("startDate"),
  endDate: date("endDate"),
  authorizationNumber: varchar("authorizationNumber", { length: 100 }),
  status: mysqlEnum("authStatus", ["active", "expiring", "expired", "pending_renewal"]).default("active"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Authorization = typeof authorizations.$inferSelect;
export type InsertAuthorization = typeof authorizations.$inferInsert;

/**
 * Profitability snapshots — stored calculation results per client
 */
export const profitabilitySnapshots = mysqlTable("profitability_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  weekOf: date("weekOf"),

  // Financials
  revenue: decimal("revenue", { precision: 10, scale: 2 }),
  laborCost: decimal("laborCost", { precision: 10, scale: 2 }),
  overtimeCost: decimal("overtimeCost", { precision: 10, scale: 2 }),
  overheadAllocation: decimal("overheadAllocation", { precision: 10, scale: 2 }),
  grossProfit: decimal("grossProfit", { precision: 10, scale: 2 }),
  grossMargin: decimal("grossMargin", { precision: 5, scale: 2 }),

  // Full calculation I/O stored as JSON
  inputJson: text("inputJson"),
  resultsJson: text("resultsJson"),

  // Summary fields for quick querying
  profitabilityScore: int("profitabilityScore"),
  recommendation: varchar("recommendation", { length: 32 }),

  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProfitabilitySnapshot = typeof profitabilitySnapshots.$inferSelect;
export type InsertProfitabilitySnapshot = typeof profitabilitySnapshots.$inferInsert;

/**
 * Background clearances — PA Act 153 compliance (60-month validity)
 */
export const clearances = mysqlTable("clearances", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  type: mysqlEnum("clearanceType", ["PA_PATCH", "FBI", "CHILDLINE"]).notNull(),
  status: mysqlEnum("clearanceStatus", ["not_started", "initiated", "pending", "clear", "flagged", "expired"]).default("not_started"),
  submissionDate: date("submissionDate"),
  resultDate: date("resultDate"),
  expirationDate: date("expirationDate"), // submissionDate + 60 months
  certificateS3Key: varchar("certificateS3Key", { length: 500 }),
  checkrCandidateId: varchar("checkrCandidateId", { length: 100 }),
  checkrReportId: varchar("checkrReportId", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Clearance = typeof clearances.$inferSelect;
export type InsertClearance = typeof clearances.$inferInsert;

/**
 * Training records — PA track-specific requirements (OLTL/ODP/Skilled)
 */
export const trainingRecords = mysqlTable("training_records", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  courseName: varchar("courseName", { length: 200 }),
  courseSource: mysqlEnum("courseSource", ["NEVVON", "MYODP", "CUSTOM", "EXTERNAL"]),
  trackRequirement: mysqlEnum("trackRequirement", ["OLTL", "ODP", "Skilled", "ALL"]),
  isInitial: boolean("isInitial"), // true = pre-service, false = annual
  status: mysqlEnum("trainingStatus", ["assigned", "in_progress", "completed", "expired"]).default("assigned"),
  assignedDate: date("assignedDate"),
  completedDate: date("completedDate"),
  score: int("score"),
  hoursCredit: decimal("hoursCredit", { precision: 4, scale: 1 }),
  certificateS3Key: varchar("certificateS3Key", { length: 500 }),
  expirationDate: date("expirationDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrainingRecord = typeof trainingRecords.$inferSelect;
export type InsertTrainingRecord = typeof trainingRecords.$inferInsert;

/**
 * Incident reports — PA-mandated timeline tracking
 */
export const incidents = mysqlTable("incidents", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 36 }),
  clientId: int("clientId"),
  reportedBy: int("reportedBy"),

  category: mysqlEnum("incidentCategory", [
    "abuse_physical", "abuse_psychological", "abuse_sexual", "abuse_verbal",
    "neglect", "exploitation", "abandonment", "death", "serious_injury",
    "medication_error", "service_interruption", "rights_violation", "elopement", "other"
  ]).notNull(),
  severity: mysqlEnum("incidentSeverity", ["critical", "major", "minor"]).notNull(),

  incidentDate: timestamp("incidentDate"),
  description: text("description"),
  immediateActions: text("immediateActions"),

  // PA-mandated deadlines
  scNotifiedAt: timestamp("scNotifiedAt"),              // 24hr deadline
  eimEnteredAt: timestamp("eimEnteredAt"),              // 48hr deadline
  investigationStartedAt: timestamp("investigationStartedAt"), // 24hr deadline
  investigationCompletedAt: timestamp("investigationCompletedAt"), // 30 day deadline
  participantNotifiedAt: timestamp("participantNotifiedAt"),   // 24hr deadline

  resolution: text("resolution"),
  correctiveActions: text("correctiveActions"),
  status: mysqlEnum("incidentStatus", ["open", "investigating", "resolved", "closed"]).default("open"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = typeof incidents.$inferInsert;

/**
 * LEIE/SAM exclusion screenings — monthly OIG compliance
 */
export const exclusionScreenings = mysqlTable("exclusion_screenings", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  screeningDate: date("screeningDate"),
  leieResult: mysqlEnum("leieResult", ["clear", "match", "error"]),
  samResult: mysqlEnum("samResult", ["clear", "match", "error"]),
  matchDetails: text("matchDetails"), // JSON
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: int("resolvedBy"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExclusionScreening = typeof exclusionScreenings.$inferSelect;
export type InsertExclusionScreening = typeof exclusionScreenings.$inferInsert;
