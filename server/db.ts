import { eq, desc, asc, and, or, like, isNull, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  employees, InsertEmployee, Employee,
  gateApprovals, InsertGateApproval, GateApproval,
  auditLog, InsertAuditLog,
  exceptions, InsertException,
  roleMatrix, InsertRoleMatrix,
  sheetsSync, InsertSheetsSync,
  employeeTaxInfo, InsertEmployeeTaxInfo, EmployeeTaxInfo,
  employeeDirectDeposit, InsertEmployeeDirectDeposit, EmployeeDirectDeposit,
  employeeBenefits, InsertEmployeeBenefits, EmployeeBenefits,
  employeeCompensation, InsertEmployeeCompensation, EmployeeCompensation,
  payrollExports, InsertPayrollExport, PayrollExport,
  hhaEmployeeMapping, InsertHhaEmployeeMapping, HhaEmployeeMapping,
  clients, InsertClient, Client,
  authorizations, InsertAuthorization, Authorization,
  profitabilitySnapshots, InsertProfitabilitySnapshot,
  inAppNotifications, InsertInAppNotification, InAppNotification,
  integrationConfigs, InsertIntegrationConfig, IntegrationConfig,
  clearances, InsertClearance, Clearance,
  exclusionScreenings, InsertExclusionScreening, ExclusionScreening,
  incidents, InsertIncident, Incident,
} from "../drizzle/schema";
import { nanoid } from 'nanoid';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER QUERIES ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "hr" | "supervisor" | "compliance" | "billing" | "coordinator") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(data: {
  openId: string;
  email: string;
  name: string;
  password: string;
  loginMethod?: string;
  lastSignedIn?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(users).values({
    openId: data.openId,
    email: data.email,
    name: data.name,
    password: data.password,
    loginMethod: data.loginMethod ?? "email",
    role: "user",
    lastSignedIn: data.lastSignedIn ?? new Date(),
  });

  return getUserByEmail(data.email);
}

// ============ EMPLOYEE QUERIES ============

export async function generateEmployeeId(): Promise<string> {
  const prefix = "DT";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = nanoid(4).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export async function createEmployee(data: Omit<InsertEmployee, "employeeId">): Promise<Employee> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const employeeId = await generateEmployeeId();
  const insertData = { ...data, employeeId };
  
  await db.insert(employees).values(insertData);
  const result = await db.select().from(employees).where(eq(employees.employeeId, employeeId)).limit(1);
  return result[0];
}

export async function updateEmployee(id: number, data: Partial<InsertEmployee>) {
  const db = await getDb();
  if (!db) return;
  await db.update(employees).set(data).where(eq(employees.id, id));
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getEmployeeByEmployeeId(employeeId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(employees).where(eq(employees.employeeId, employeeId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllEmployees() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employees).orderBy(desc(employees.createdAt));
}

export async function getEmployeesByPhase(phase: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employees).where(sql`${employees.currentPhase} = ${phase}`).orderBy(desc(employees.createdAt));
}

export async function getEmployeesByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employees).where(sql`${employees.status} = ${status}`).orderBy(desc(employees.createdAt));
}

export async function getEmployeesWithExceptions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employees).where(
    or(
      eq(employees.escalationFlag, true),
      sql`${employees.status} IN ('Action Required', 'On Hold')`
    )
  ).orderBy(desc(employees.updatedAt));
}

export async function getPipelineStats() {
  const db = await getDb();
  if (!db) return {};
  
  const phases = ["Intake", "Screening", "Documentation", "Verification", "Provisioning", "Ready to Schedule", "Active", "Post-Onboarding"] as const;
  const stats: Record<string, number> = {};
  
  for (const phase of phases) {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.currentPhase, phase));
    stats[phase] = result[0]?.count ?? 0;
  }
  
  return stats;
}

export async function searchEmployees(query: string) {
  const db = await getDb();
  if (!db) return [];
  const searchTerm = `%${query}%`;
  return db.select().from(employees).where(
    or(
      like(employees.legalFirstName, searchTerm),
      like(employees.legalLastName, searchTerm),
      like(employees.email, searchTerm),
      like(employees.employeeId, searchTerm),
      like(employees.phone, searchTerm)
    )
  ).orderBy(desc(employees.createdAt));
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(employees).where(eq(employees.id, id));
}

// ============ GATE APPROVAL QUERIES ============

export async function createGateApproval(data: InsertGateApproval) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(gateApprovals).values(data);
}

export async function updateGateApproval(id: number, data: Partial<InsertGateApproval>) {
  const db = await getDb();
  if (!db) return;
  await db.update(gateApprovals).set(data).where(eq(gateApprovals.id, id));
}

export async function getGateApprovalsForEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gateApprovals).where(eq(gateApprovals.employeeId, employeeId)).orderBy(asc(gateApprovals.createdAt));
}

export async function getGateApprovalByType(employeeId: number, gateType: GateApproval["gateType"]) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gateApprovals).where(
    and(eq(gateApprovals.employeeId, employeeId), eq(gateApprovals.gateType, gateType))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPendingApprovals(gateType?: GateApproval["gateType"]) {
  const db = await getDb();
  if (!db) return [];
  
  if (gateType) {
    return db.select().from(gateApprovals).where(
      and(eq(gateApprovals.status, "Pending"), eq(gateApprovals.gateType, gateType))
    ).orderBy(asc(gateApprovals.createdAt));
  }
  
  return db.select().from(gateApprovals).where(eq(gateApprovals.status, "Pending")).orderBy(asc(gateApprovals.createdAt));
}

// ============ AUDIT LOG QUERIES ============

export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLog).values(data);
}

export async function getAuditLogsForEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLog).where(eq(auditLog.employeeId, employeeId)).orderBy(desc(auditLog.createdAt));
}

// ============ EXCEPTIONS QUERIES ============

export async function createException(data: InsertException) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(exceptions).values(data);
}

export async function updateException(id: number, data: Partial<InsertException>) {
  const db = await getDb();
  if (!db) return;
  await db.update(exceptions).set(data).where(eq(exceptions.id, id));
}

export async function getOpenExceptions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(exceptions).where(eq(exceptions.resolved, false)).orderBy(asc(exceptions.dueDate));
}

export async function getExceptionsForEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(exceptions).where(eq(exceptions.employeeId, employeeId)).orderBy(desc(exceptions.createdAt));
}

// ============ ROLE MATRIX QUERIES ============

export async function getRoleMatrix() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(roleMatrix).orderBy(asc(roleMatrix.roleName));
}

export async function getRoleRequirements(roleName: string, serviceLine: "OLTL" | "ODP" | "Skilled") {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(roleMatrix).where(
    and(eq(roleMatrix.roleName, roleName), eq(roleMatrix.serviceLine, serviceLine))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertRoleMatrix(data: InsertRoleMatrix) {
  const db = await getDb();
  if (!db) return;
  await db.insert(roleMatrix).values(data).onDuplicateKeyUpdate({
    set: {
      requiredDocuments: data.requiredDocuments,
      requiredClearances: data.requiredClearances,
      requiredTrainings: data.requiredTrainings,
      skilledLicenseRequired: data.skilledLicenseRequired,
    }
  });
}

// ============ SHEETS SYNC QUERIES ============

export async function getSheetsSyncConfig() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sheetsSync).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSheetsSyncStatus(id: number, data: Partial<InsertSheetsSync>) {
  const db = await getDb();
  if (!db) return;
  await db.update(sheetsSync).set(data).where(eq(sheetsSync.id, id));
}

export async function createSheetsSyncConfig(data: InsertSheetsSync) {
  const db = await getDb();
  if (!db) return;
  await db.insert(sheetsSync).values(data);
}


// ============ EMPLOYEE DOCUMENTS QUERIES ============

import { employeeDocuments, InsertEmployeeDocument, EmployeeDocument } from "../drizzle/schema";

export async function createEmployeeDocument(data: InsertEmployeeDocument): Promise<EmployeeDocument> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(employeeDocuments).values(data);
  const result = await db.select().from(employeeDocuments)
    .where(eq(employeeDocuments.s3Key, data.s3Key))
    .limit(1);
  return result[0];
}

export async function getDocumentsForEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employeeDocuments)
    .where(eq(employeeDocuments.employeeId, employeeId))
    .orderBy(desc(employeeDocuments.createdAt));
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(employeeDocuments)
    .where(eq(employeeDocuments.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDocumentsByCategory(employeeId: number, category: EmployeeDocument["category"]) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employeeDocuments)
    .where(and(
      eq(employeeDocuments.employeeId, employeeId),
      eq(employeeDocuments.category, category)
    ))
    .orderBy(desc(employeeDocuments.createdAt));
}

export async function updateEmployeeDocument(id: number, data: Partial<InsertEmployeeDocument>) {
  const db = await getDb();
  if (!db) return;
  await db.update(employeeDocuments).set(data).where(eq(employeeDocuments.id, id));
}

export async function deleteEmployeeDocument(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(employeeDocuments).where(eq(employeeDocuments.id, id));
}

export async function getExpiredDocuments() {
  const db = await getDb();
  if (!db) return [];
  const today = new Date();
  return db.select().from(employeeDocuments)
    .where(and(
      sql`${employeeDocuments.expirationDate} IS NOT NULL`,
      sql`${employeeDocuments.expirationDate} < ${today}`
    ))
    .orderBy(asc(employeeDocuments.expirationDate));
}

export async function getDocumentsPendingReview() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employeeDocuments)
    .where(eq(employeeDocuments.status, "pending_review"))
    .orderBy(asc(employeeDocuments.createdAt));
}


// ============ NOTIFICATION QUERIES ============

import { 
  notificationSettings, InsertNotificationSettings, NotificationSettings,
  notificationLog, InsertNotificationLog, NotificationLog
} from "../drizzle/schema";

export async function getNotificationSettings(): Promise<NotificationSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(notificationSettings).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertNotificationSettings(data: Partial<InsertNotificationSettings>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getNotificationSettings();
  if (existing) {
    await db.update(notificationSettings).set(data).where(eq(notificationSettings.id, existing.id));
  } else {
    await db.insert(notificationSettings).values(data as InsertNotificationSettings);
  }
}

export async function createNotificationLog(data: InsertNotificationLog): Promise<NotificationLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(notificationLog).values(data);
  const result = await db.select().from(notificationLog)
    .orderBy(desc(notificationLog.id))
    .limit(1);
  return result[0];
}

export async function getNotificationLogs(limit: number = 50): Promise<NotificationLog[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notificationLog)
    .orderBy(desc(notificationLog.sentAt))
    .limit(limit);
}

export async function getExpiringDocuments(daysThreshold: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return db.select({
    document: employeeDocuments,
    employee: {
      id: employees.id,
      legalFirstName: employees.legalFirstName,
      legalLastName: employees.legalLastName,
      email: employees.email,
      employeeId: employees.employeeId,
    }
  })
  .from(employeeDocuments)
  .innerJoin(employees, eq(employeeDocuments.employeeId, employees.id))
  .where(
    and(
      sql`${employeeDocuments.expirationDate} IS NOT NULL`,
      sql`${employeeDocuments.expirationDate} <= ${thresholdDate}`,
      sql`${employeeDocuments.expirationDate} >= ${today}`,
      eq(employeeDocuments.status, "approved")
    )
  )
  .orderBy(asc(employeeDocuments.expirationDate));
}

export async function getExpiredDocumentsToday(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return db.select({
    document: employeeDocuments,
    employee: {
      id: employees.id,
      legalFirstName: employees.legalFirstName,
      legalLastName: employees.legalLastName,
      email: employees.email,
      employeeId: employees.employeeId,
    }
  })
  .from(employeeDocuments)
  .innerJoin(employees, eq(employeeDocuments.employeeId, employees.id))
  .where(
    and(
      sql`${employeeDocuments.expirationDate} IS NOT NULL`,
      sql`${employeeDocuments.expirationDate} < ${today}`,
      eq(employeeDocuments.status, "approved")
    )
  )
  .orderBy(asc(employeeDocuments.expirationDate));
}

export async function getHRUsers(): Promise<{ id: number; email: string | null; name: string | null }[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: users.id,
    email: users.email,
    name: users.name,
  })
  .from(users)
  .where(
    or(
      eq(users.role, "hr"),
      eq(users.role, "admin")
    )
  );
}


// ============ TIMESHEET QUERIES ============

import { 
  payPeriods, InsertPayPeriod, PayPeriod,
  timesheets, InsertTimesheet, Timesheet,
  timesheetTemplates, InsertTimesheetTemplate, TimesheetTemplate,
  timesheetReminders, InsertTimesheetReminder
} from "../drizzle/schema";

// Pay Period queries
export async function createPayPeriod(data: InsertPayPeriod): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(payPeriods).values(data);
}

export async function getPayPeriods(): Promise<PayPeriod[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payPeriods).orderBy(desc(payPeriods.startDate));
}

export async function getActivePayPeriod(): Promise<PayPeriod | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payPeriods)
    .where(eq(payPeriods.status, "active"))
    .limit(1);
  return result[0];
}

export async function getPayPeriodById(id: number): Promise<PayPeriod | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payPeriods).where(eq(payPeriods.id, id)).limit(1);
  return result[0];
}

export async function updatePayPeriod(id: number, data: Partial<InsertPayPeriod>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(payPeriods).set(data).where(eq(payPeriods.id, id));
}

// Timesheet queries
export async function createTimesheet(data: InsertTimesheet): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(timesheets).values(data);
  return Number(result[0].insertId);
}

export async function getTimesheetsByEmployee(employeeId: number): Promise<Timesheet[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(timesheets)
    .where(eq(timesheets.employeeId, employeeId))
    .orderBy(desc(timesheets.createdAt));
}

export async function getTimesheetsByPayPeriod(payPeriodId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    timesheet: timesheets,
    employee: {
      id: employees.id,
      employeeId: employees.employeeId,
      legalFirstName: employees.legalFirstName,
      legalLastName: employees.legalLastName,
      email: employees.email,
      serviceLine: employees.serviceLine,
    }
  })
  .from(timesheets)
  .innerJoin(employees, eq(timesheets.employeeId, employees.id))
  .where(eq(timesheets.payPeriodId, payPeriodId))
  .orderBy(asc(employees.legalLastName));
}

export async function getTimesheetById(id: number): Promise<Timesheet | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(timesheets).where(eq(timesheets.id, id)).limit(1);
  return result[0];
}

export async function updateTimesheet(id: number, data: Partial<InsertTimesheet>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(timesheets).set(data).where(eq(timesheets.id, id));
}

export async function deleteTimesheet(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(timesheets).where(eq(timesheets.id, id));
}

export async function getEmployeesWithMissingTimesheets(payPeriodId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Get all active employees
  const activeEmployees = await db.select({
    id: employees.id,
    employeeId: employees.employeeId,
    legalFirstName: employees.legalFirstName,
    legalLastName: employees.legalLastName,
    email: employees.email,
    serviceLine: employees.serviceLine,
  })
  .from(employees)
  .where(eq(employees.currentPhase, "Active"));
  
  // Get employees who have submitted timesheets for this period
  const submittedTimesheets = await db.select({
    employeeId: timesheets.employeeId,
  })
  .from(timesheets)
  .where(
    and(
      eq(timesheets.payPeriodId, payPeriodId),
      sql`${timesheets.status} != 'draft'`
    )
  );
  
  const submittedEmployeeIds = new Set(submittedTimesheets.map(t => t.employeeId));
  
  // Return employees without submitted timesheets
  return activeEmployees.filter(emp => !submittedEmployeeIds.has(emp.id));
}

export async function getTimesheetStats(payPeriodId: number): Promise<{
  total: number;
  submitted: number;
  approved: number;
  pending: number;
  missing: number;
}> {
  const db = await getDb();
  if (!db) return { total: 0, submitted: 0, approved: 0, pending: 0, missing: 0 };
  
  const allTimesheets = await db.select().from(timesheets)
    .where(eq(timesheets.payPeriodId, payPeriodId));
  
  const activeEmployeeCount = await db.select({ count: sql<number>`count(*)` })
    .from(employees)
    .where(eq(employees.currentPhase, "Active"));
  
  const total = activeEmployeeCount[0]?.count || 0;
  const submitted = allTimesheets.filter(t => t.status !== 'draft').length;
  const approved = allTimesheets.filter(t => t.status === 'approved').length;
  const pending = allTimesheets.filter(t => t.status === 'pending_review' || t.status === 'submitted').length;
  const missing = total - submitted;
  
  return { total, submitted, approved, pending, missing };
}

// Timesheet template queries
export async function createTimesheetTemplate(data: InsertTimesheetTemplate): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(timesheetTemplates).values(data);
  return Number(result[0].insertId);
}

export async function getTimesheetTemplates(): Promise<TimesheetTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(timesheetTemplates)
    .where(eq(timesheetTemplates.isActive, true))
    .orderBy(desc(timesheetTemplates.createdAt));
}

export async function getTimesheetTemplateById(id: number): Promise<TimesheetTemplate | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(timesheetTemplates).where(eq(timesheetTemplates.id, id)).limit(1);
  return result[0];
}

export async function updateTimesheetTemplate(id: number, data: Partial<InsertTimesheetTemplate>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(timesheetTemplates).set(data).where(eq(timesheetTemplates.id, id));
}

export async function deleteTimesheetTemplate(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(timesheetTemplates).set({ isActive: false }).where(eq(timesheetTemplates.id, id));
}

// Timesheet reminder queries
export async function createTimesheetReminder(data: InsertTimesheetReminder): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(timesheetReminders).values(data);
}

export async function getTimesheetReminders(employeeId: number, payPeriodId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(timesheetReminders)
    .where(
      and(
        eq(timesheetReminders.employeeId, employeeId),
        eq(timesheetReminders.payPeriodId, payPeriodId)
      )
    )
    .orderBy(desc(timesheetReminders.sentAt));
}


// ============ PAYROLL REPORT QUERIES ============

export interface PayrollReportRow {
  employeeId: number;
  employeeIdStr: string;
  legalFirstName: string;
  legalLastName: string;
  email: string | null;
  phone: string | null;
  serviceLine: string;
  payRate: string | null;
  payType: string | null;
  timesheetId: number;
  totalHours: string;
  status: string;
  signatureType: string;
  participantSigned: boolean;
  employeeSigned: boolean;
  evvCompliant: boolean;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewedByName: string | null;
}

export async function getPayrollReportData(payPeriodId: number): Promise<PayrollReportRow[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      employeeId: employees.id,
      employeeIdStr: employees.employeeId,
      legalFirstName: employees.legalFirstName,
      legalLastName: employees.legalLastName,
      email: employees.email,
      phone: employees.phone,
      serviceLine: employees.serviceLine,
      payRate: employees.payRate,
      payType: employees.payType,
      timesheetId: timesheets.id,
      totalHours: timesheets.totalHours,
      status: timesheets.status,
      signatureType: timesheets.signatureType,
      participantSigned: timesheets.participantSigned,
      employeeSigned: timesheets.employeeSigned,
      evvCompliant: timesheets.evvCompliant,
      submittedAt: timesheets.submittedAt,
      reviewedAt: timesheets.reviewedAt,
      reviewedByName: timesheets.reviewedByName,
    })
    .from(timesheets)
    .innerJoin(employees, eq(timesheets.employeeId, employees.id))
    .where(
      and(
        eq(timesheets.payPeriodId, payPeriodId),
        eq(timesheets.status, 'approved')
      )
    )
    .orderBy(employees.legalLastName, employees.legalFirstName);

  return result as PayrollReportRow[];
}

export async function getPayrollSummary(payPeriodId: number) {
  const db = await getDb();
  if (!db) return null;

  const reportData = await getPayrollReportData(payPeriodId);
  
  let totalEmployees = new Set<number>();
  let totalHours = 0;
  let totalTimesheets = 0;
  
  for (const row of reportData) {
    totalEmployees.add(row.employeeId);
    totalHours += parseFloat(row.totalHours || '0');
    totalTimesheets++;
  }

  return {
    employeeCount: totalEmployees.size,
    timesheetCount: totalTimesheets,
    totalHours: totalHours.toFixed(2),
  };
}


// ============ EMPLOYEE TAX INFO QUERIES ============

export async function getEmployeeTaxInfo(employeeId: number): Promise<EmployeeTaxInfo | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(employeeTaxInfo).where(eq(employeeTaxInfo.employeeId, employeeId)).limit(1);
  return result[0] || null;
}

export async function upsertEmployeeTaxInfo(data: InsertEmployeeTaxInfo): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getEmployeeTaxInfo(data.employeeId);
  if (existing) {
    await db.update(employeeTaxInfo).set(data).where(eq(employeeTaxInfo.employeeId, data.employeeId));
  } else {
    await db.insert(employeeTaxInfo).values(data);
  }
}

// ============ EMPLOYEE DIRECT DEPOSIT QUERIES ============

export async function getEmployeeDirectDeposits(employeeId: number): Promise<EmployeeDirectDeposit[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(employeeDirectDeposit)
    .where(eq(employeeDirectDeposit.employeeId, employeeId))
    .orderBy(asc(employeeDirectDeposit.priority));
}

export async function createDirectDeposit(data: InsertEmployeeDirectDeposit): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.insert(employeeDirectDeposit).values(data);
  return Number(result[0].insertId);
}

export async function updateDirectDeposit(id: number, data: Partial<InsertEmployeeDirectDeposit>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(employeeDirectDeposit).set(data).where(eq(employeeDirectDeposit.id, id));
}

export async function deleteDirectDeposit(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(employeeDirectDeposit).where(eq(employeeDirectDeposit.id, id));
}

// ============ EMPLOYEE BENEFITS QUERIES ============

export async function getEmployeeBenefits(employeeId: number): Promise<EmployeeBenefits[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(employeeBenefits)
    .where(eq(employeeBenefits.employeeId, employeeId));
}

export async function createBenefit(data: InsertEmployeeBenefits): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.insert(employeeBenefits).values(data);
  return Number(result[0].insertId);
}

export async function updateBenefit(id: number, data: Partial<InsertEmployeeBenefits>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(employeeBenefits).set(data).where(eq(employeeBenefits.id, id));
}

export async function deleteBenefit(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(employeeBenefits).where(eq(employeeBenefits.id, id));
}

// ============ EMPLOYEE COMPENSATION QUERIES ============

export async function getEmployeeCompensation(employeeId: number): Promise<EmployeeCompensation | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(employeeCompensation).where(eq(employeeCompensation.employeeId, employeeId)).limit(1);
  return result[0] || null;
}

export async function upsertEmployeeCompensation(data: InsertEmployeeCompensation): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getEmployeeCompensation(data.employeeId);
  if (existing) {
    await db.update(employeeCompensation).set(data).where(eq(employeeCompensation.employeeId, data.employeeId));
  } else {
    await db.insert(employeeCompensation).values(data);
  }
}

// ============ PAYROLL EXPORT QUERIES ============

export async function createPayrollExport(data: InsertPayrollExport): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.insert(payrollExports).values(data);
  return Number(result[0].insertId);
}

export async function getPayrollExports(limit: number = 50): Promise<PayrollExport[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(payrollExports)
    .orderBy(desc(payrollExports.exportedAt))
    .limit(limit);
}

export async function getPayrollExportById(id: number): Promise<PayrollExport | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(payrollExports).where(eq(payrollExports.id, id)).limit(1);
  return result[0] || null;
}

export async function updatePayrollExport(id: number, data: Partial<InsertPayrollExport>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(payrollExports).set(data).where(eq(payrollExports.id, id));
}

// ============ HHA EMPLOYEE MAPPING QUERIES ============

export async function getHhaMapping(employeeId: number): Promise<HhaEmployeeMapping | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(hhaEmployeeMapping).where(eq(hhaEmployeeMapping.employeeId, employeeId)).limit(1);
  return result[0] || null;
}

export async function upsertHhaMapping(data: InsertHhaEmployeeMapping): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getHhaMapping(data.employeeId);
  if (existing) {
    await db.update(hhaEmployeeMapping).set(data).where(eq(hhaEmployeeMapping.employeeId, data.employeeId));
  } else {
    await db.insert(hhaEmployeeMapping).values(data);
  }
}

// ============ COMPREHENSIVE EMPLOYEE DATA FOR EXPORT ============

export interface FullEmployeeExportData {
  employee: Employee;
  taxInfo: EmployeeTaxInfo | null;
  directDeposits: EmployeeDirectDeposit[];
  benefits: EmployeeBenefits[];
  compensation: EmployeeCompensation | null;
  hhaMapping: HhaEmployeeMapping | null;
}

export async function getFullEmployeeDataForExport(employeeId: number): Promise<FullEmployeeExportData | null> {
  const db = await getDb();
  if (!db) return null;
  
  const employee = await getEmployeeById(employeeId);
  if (!employee) return null;
  
  const [taxInfo, directDeposits, benefits, compensation, hhaMapping] = await Promise.all([
    getEmployeeTaxInfo(employeeId),
    getEmployeeDirectDeposits(employeeId),
    getEmployeeBenefits(employeeId),
    getEmployeeCompensation(employeeId),
    getHhaMapping(employeeId)
  ]);
  
  return {
    employee,
    taxInfo,
    directDeposits,
    benefits,
    compensation,
    hhaMapping
  };
}

export async function getAllEmployeesForExport(filters?: {
  serviceLine?: string;
  status?: string;
  phase?: string;
}): Promise<FullEmployeeExportData[]> {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(employees);
  
  const conditions = [];
  if (filters?.serviceLine) {
    conditions.push(eq(employees.serviceLine, filters.serviceLine as any));
  }
  if (filters?.status) {
    conditions.push(eq(employees.status, filters.status as any));
  }
  if (filters?.phase) {
    conditions.push(eq(employees.currentPhase, filters.phase as any));
  }
  
  const employeeList = conditions.length > 0 
    ? await query.where(and(...conditions))
    : await query;
  
  const results: FullEmployeeExportData[] = [];
  for (const emp of employeeList) {
    const fullData = await getFullEmployeeDataForExport(emp.id);
    if (fullData) {
      results.push(fullData);
    }
  }

  return results;
}


// ============ CLIENT QUERIES ============

export async function getAllClients() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createClient(data: Partial<InsertClient> & { firstName: string; lastName: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(data as InsertClient);
  return getClientById(Number(result[0].insertId));
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set(data).where(eq(clients.id, id));
  return getClientById(id);
}


// ============ AUTHORIZATION QUERIES ============

export async function getAllAuthorizations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(authorizations).orderBy(desc(authorizations.createdAt));
}

/**
 * Get all authorizations with client names joined in.
 * Used by the Authorization Tracker page to avoid N+1 queries.
 */
export async function getAllAuthorizationsWithClients() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: authorizations.id,
      clientId: authorizations.clientId,
      clientFirstName: clients.firstName,
      clientLastName: clients.lastName,
      mco: authorizations.mco,
      serviceType: authorizations.serviceType,
      authorizedHoursPerWeek: authorizations.authorizedHoursPerWeek,
      startDate: authorizations.startDate,
      endDate: authorizations.endDate,
      authorizationNumber: authorizations.authorizationNumber,
      status: authorizations.status,
      notes: authorizations.notes,
      createdAt: authorizations.createdAt,
    })
    .from(authorizations)
    .leftJoin(clients, eq(authorizations.clientId, clients.id))
    .orderBy(desc(authorizations.createdAt));
}

export async function getAuthorizationsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(authorizations).where(eq(authorizations.clientId, clientId));
}

export async function createAuthorization(data: Partial<InsertAuthorization> & { clientId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(authorizations).values(data as InsertAuthorization);
  return { id: Number(result[0].insertId) };
}


// ============ PROFITABILITY SNAPSHOT QUERIES ============

export async function createProfitabilitySnapshot(data: Partial<InsertProfitabilitySnapshot>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(profitabilitySnapshots).values(data as InsertProfitabilitySnapshot);
  return { id: Number(result[0].insertId) };
}

export async function getSnapshotsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(profitabilitySnapshots).where(eq(profitabilitySnapshots.clientId, clientId)).orderBy(desc(profitabilitySnapshots.createdAt));
}


// ============ EMPLOYEE LOOKUP BY ENVELOPE/CANDIDATE ID ============

export async function getEmployeeByEnvelopeId(envelopeId: string): Promise<Employee | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(employees)
    .where(or(
      eq(employees.dsPacket1EnvelopeId, envelopeId),
      eq(employees.dsPacket2EnvelopeId, envelopeId)
    ))
    .limit(1);
  return result[0];
}

export async function getClearanceByCheckrCandidateId(candidateId: string): Promise<{ clearance: Clearance; employee: Employee } | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({
    clearance: clearances,
    employee: employees,
  })
  .from(clearances)
  .innerJoin(employees, eq(clearances.employeeId, employees.id))
  .where(eq(clearances.checkrCandidateId, candidateId))
  .limit(1);
  return result[0];
}

// ============ IN-APP NOTIFICATION QUERIES ============

export async function getInAppNotifications(userId: number, options?: { limit?: number; offset?: number; unreadOnly?: boolean }): Promise<InAppNotification[]> {
  const db = await getDb();
  if (!db) return [];

  const limit = options?.limit || 30;
  const offset = options?.offset || 0;

  const conditions = [eq(inAppNotifications.userId, userId)];
  if (options?.unreadOnly) {
    conditions.push(eq(inAppNotifications.read, false));
  }

  return db.select()
    .from(inAppNotifications)
    .where(and(...conditions))
    .orderBy(desc(inAppNotifications.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: sql<number>`count(*)` })
    .from(inAppNotifications)
    .where(and(
      eq(inAppNotifications.userId, userId),
      eq(inAppNotifications.read, false)
    ));
  return result[0]?.count || 0;
}

export async function markNotificationRead(notificationId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(inAppNotifications)
    .set({ read: true })
    .where(and(
      eq(inAppNotifications.id, notificationId),
      eq(inAppNotifications.userId, userId)
    ));
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(inAppNotifications)
    .set({ read: true })
    .where(and(
      eq(inAppNotifications.userId, userId),
      eq(inAppNotifications.read, false)
    ));
}

export async function deleteOldNotifications(daysOld: number = 90): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  const result = await db.delete(inAppNotifications)
    .where(sql`${inAppNotifications.createdAt} < ${cutoff}`);
  return (result as any)[0]?.affectedRows || 0;
}


// ============ INTEGRATION CONFIG QUERIES ============

export async function getIntegrationConfig(provider: string): Promise<IntegrationConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(integrationConfigs)
    .where(eq(integrationConfigs.provider, provider as any))
    .limit(1);
  return result[0];
}

export async function getAllIntegrationConfigs(): Promise<IntegrationConfig[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(integrationConfigs).orderBy(asc(integrationConfigs.provider));
}

export async function upsertIntegrationConfig(provider: string, data: Partial<InsertIntegrationConfig>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await getIntegrationConfig(provider);
  if (existing) {
    await db.update(integrationConfigs).set(data).where(eq(integrationConfigs.id, existing.id));
  } else {
    await db.insert(integrationConfigs).values({ provider: provider as any, ...data } as InsertIntegrationConfig);
  }
}


// ============ CLEARANCE QUERIES ============

export async function getClearancesForEmployee(employeeId: number): Promise<Clearance[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clearances)
    .where(eq(clearances.employeeId, employeeId))
    .orderBy(desc(clearances.createdAt));
}

export async function createClearance(data: InsertClearance): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(clearances).values(data);
  return Number(result[0].insertId);
}

export async function updateClearance(id: number, data: Partial<InsertClearance>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(clearances).set(data).where(eq(clearances.id, id));
}

export async function getExpiringClearances(daysThreshold: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return db.select({
    clearance: clearances,
    employee: {
      id: employees.id,
      legalFirstName: employees.legalFirstName,
      legalLastName: employees.legalLastName,
      email: employees.email,
      employeeId: employees.employeeId,
    }
  })
  .from(clearances)
  .innerJoin(employees, eq(clearances.employeeId, employees.id))
  .where(
    and(
      sql`${clearances.expirationDate} IS NOT NULL`,
      sql`${clearances.expirationDate} <= ${thresholdDate}`,
      sql`${clearances.expirationDate} >= ${today}`,
      eq(clearances.status, "clear")
    )
  )
  .orderBy(asc(clearances.expirationDate));
}


// ============ EXCLUSION SCREENING QUERIES ============

export async function getExclusionScreenings(options?: { employeeId?: number; limit?: number }): Promise<ExclusionScreening[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (options?.employeeId) {
    conditions.push(eq(exclusionScreenings.employeeId, options.employeeId));
  }

  const query = conditions.length > 0
    ? db.select().from(exclusionScreenings).where(and(...conditions))
    : db.select().from(exclusionScreenings);

  return query.orderBy(desc(exclusionScreenings.createdAt)).limit(options?.limit || 100);
}

export async function createExclusionScreening(data: InsertExclusionScreening): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(exclusionScreenings).values(data);
  return Number(result[0].insertId);
}

export async function resolveExclusionScreening(id: number, resolvedBy: number, notes: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(exclusionScreenings).set({
    resolvedAt: new Date(),
    resolvedBy,
    notes,
  }).where(eq(exclusionScreenings.id, id));
}

// ============ INCIDENT QUERIES ============

export async function getAllIncidents() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: incidents.id,
      tenantId: incidents.tenantId,
      clientId: incidents.clientId,
      clientFirstName: clients.firstName,
      clientLastName: clients.lastName,
      reportedBy: incidents.reportedBy,
      caregiverId: incidents.caregiverId,
      caregiverFirstName: employees.legalFirstName,
      caregiverLastName: employees.legalLastName,
      category: incidents.category,
      severity: incidents.severity,
      incidentDate: incidents.incidentDate,
      description: incidents.description,
      immediateActions: incidents.immediateActions,
      scNotifiedAt: incidents.scNotifiedAt,
      eimEnteredAt: incidents.eimEnteredAt,
      investigationStartedAt: incidents.investigationStartedAt,
      investigationCompletedAt: incidents.investigationCompletedAt,
      participantNotifiedAt: incidents.participantNotifiedAt,
      resolution: incidents.resolution,
      correctiveActions: incidents.correctiveActions,
      investigatorName: incidents.investigatorName,
      isWorkplaceInjury: incidents.isWorkplaceInjury,
      workersCompClaimId: incidents.workersCompClaimId,
      status: incidents.status,
      createdAt: incidents.createdAt,
      updatedAt: incidents.updatedAt,
    })
    .from(incidents)
    .leftJoin(clients, eq(incidents.clientId, clients.id))
    .leftJoin(employees, eq(incidents.caregiverId, employees.id))
    .orderBy(desc(incidents.createdAt));
}

export async function getIncidentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      id: incidents.id,
      tenantId: incidents.tenantId,
      clientId: incidents.clientId,
      clientFirstName: clients.firstName,
      clientLastName: clients.lastName,
      reportedBy: incidents.reportedBy,
      caregiverId: incidents.caregiverId,
      caregiverFirstName: employees.legalFirstName,
      caregiverLastName: employees.legalLastName,
      category: incidents.category,
      severity: incidents.severity,
      incidentDate: incidents.incidentDate,
      description: incidents.description,
      immediateActions: incidents.immediateActions,
      scNotifiedAt: incidents.scNotifiedAt,
      eimEnteredAt: incidents.eimEnteredAt,
      investigationStartedAt: incidents.investigationStartedAt,
      investigationCompletedAt: incidents.investigationCompletedAt,
      participantNotifiedAt: incidents.participantNotifiedAt,
      resolution: incidents.resolution,
      correctiveActions: incidents.correctiveActions,
      investigatorName: incidents.investigatorName,
      isWorkplaceInjury: incidents.isWorkplaceInjury,
      workersCompClaimId: incidents.workersCompClaimId,
      status: incidents.status,
      createdAt: incidents.createdAt,
      updatedAt: incidents.updatedAt,
    })
    .from(incidents)
    .leftJoin(clients, eq(incidents.clientId, clients.id))
    .leftJoin(employees, eq(incidents.caregiverId, employees.id))
    .where(eq(incidents.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createIncident(data: InsertIncident): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(incidents).values(data);
  return Number(result[0].insertId);
}

export async function updateIncident(id: number, data: Partial<InsertIncident>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(incidents).set(data).where(eq(incidents.id, id));
}
