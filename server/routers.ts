import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { generateUKGExport, generateADPExport, generateHHAExchangeExport, generateGenericExport } from "./payrollExportService";
import { storagePut } from "./storage";
import { calculateProfitability, getServiceTypes, getDefaultServiceType, getRate, getDefaultPayRate, WAIVER_DURATION, DEFAULT_COSTS, OLTL_HOURLY_RATES, ODP_RATES, SKILLED_RATES, REGION_NAMES, SERVICE_TYPE_LABELS } from "./modules/profitability";

// Role-based procedure helpers
const hrProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["admin", "hr"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "HR or Admin access required" });
  }
  return next({ ctx });
});

const complianceProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["admin", "compliance", "hr"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Compliance, HR, or Admin access required" });
  }
  return next({ ctx });
});

const supervisorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["admin", "supervisor", "hr"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Supervisor, HR, or Admin access required" });
  }
  return next({ ctx });
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// Zod schemas for validation
const employeeCreateSchema = z.object({
  legalFirstName: z.string().min(1),
  legalLastName: z.string().min(1),
  preferredName: z.string().optional(),
  dob: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  ssnLast4: z.string().max(4).optional(),
  roleAppliedFor: z.string().optional(),
  serviceLine: z.enum(["OLTL", "ODP", "Skilled"]).optional(),
  hiringSource: z.string().optional(),
});

const employeeUpdateSchema = employeeCreateSchema.partial().extend({
  id: z.number(),
  currentPhase: z.enum(["Intake", "Screening", "Documentation", "Verification", "Provisioning", "Ready to Schedule", "Active", "Post-Onboarding"]).optional(),
  status: z.enum(["Pending Review", "In Progress", "Action Required", "On Hold", "Complete", "Withdrawn", "Rejected"]).optional(),
  nextAction: z.string().optional(),
  owner: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["High", "Medium", "Low"]).optional(),
  escalationFlag: z.boolean().optional(),
  dsPacket1EnvelopeId: z.string().optional(),
  dsPacket1Status: z.enum(["Not Sent", "Sent", "Delivered", "Completed", "Declined", "Voided"]).optional(),
  dsPacket1CompletedDate: z.string().optional(),
  dsPacket2EnvelopeId: z.string().optional(),
  dsPacket2Status: z.enum(["Not Sent", "Sent", "Delivered", "Completed", "Declined", "Voided"]).optional(),
  dsPacket2CompletedDate: z.string().optional(),
  i9Complete: z.boolean().optional(),
  i9VerifiedBy: z.string().optional(),
  i9VerifiedDate: z.string().optional(),
  patchReceived: z.boolean().optional(),
  patchDate: z.string().optional(),
  fbiReceived: z.boolean().optional(),
  fbiDate: z.string().optional(),
  childAbuseReceived: z.boolean().optional(),
  childAbuseDate: z.string().optional(),
  physicalTbComplete: z.boolean().optional(),
  physicalTbDate: z.string().optional(),
  cprComplete: z.boolean().optional(),
  cprExpDate: z.string().optional(),
  licenseVerified: z.boolean().optional(),
  licenseNumber: z.string().optional(),
  licenseExpDate: z.string().optional(),
  payrollAdded: z.boolean().optional(),
  payrollVerifiedBy: z.string().optional(),
  evvHhaProfileCreated: z.boolean().optional(),
  evvHhaProfileVerified: z.boolean().optional(),
  readyToSchedule: z.boolean().optional(),
  firstShiftDate: z.string().optional(),
  firstShiftConfirmed: z.boolean().optional(),
  activeDate: z.string().optional(),
  employeeFolderUrl: z.string().optional(),
  offerFolderUrl: z.string().optional(),
  applicationIntakeFolderUrl: z.string().optional(),
  i9FolderUrl: z.string().optional(),
  backgroundFolderUrl: z.string().optional(),
  documentationFolderUrl: z.string().optional(),
  medicalFolderUrl: z.string().optional(),
  trainingFolderUrl: z.string().optional(),
  payrollFolderUrl: z.string().optional(),
  evvHhaFolderUrl: z.string().optional(),
  hrNotes: z.string().optional(),
  complianceNotes: z.string().optional(),
  payRate: z.string().optional(),
  payType: z.enum(["Hourly", "Salary"]).optional(),
  proposedStartDate: z.string().optional(),
});

const gateApprovalSchema = z.object({
  employeeId: z.number(),
  gateType: z.enum([
    "HR_COMPLETENESS_REVIEW",
    "PAY_RATE_START_DATE_APPROVAL",
    "CLEARANCES_VERIFICATION",
    "I9_VERIFICATION",
    "LICENSE_VERIFICATION",
    "PAYROLL_VERIFICATION",
    "EVV_HHA_VERIFICATION",
    "SUPERVISOR_READY_SIGNOFF"
  ]),
  status: z.enum(["Pending", "Approved", "Rejected", "Needs Review"]),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // User management
  users: router({
    list: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),
    updateRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin", "hr", "supervisor", "compliance", "billing", "coordinator"]) }))
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),

  // Employee management
  employees: router({
    list: protectedProcedure.query(async () => {
      return db.getAllEmployees();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getEmployeeById(input.id);
      }),
    
    getByEmployeeId: protectedProcedure
      .input(z.object({ employeeId: z.string() }))
      .query(async ({ input }) => {
        return db.getEmployeeByEmployeeId(input.employeeId);
      }),
    
    create: hrProcedure
      .input(employeeCreateSchema)
      .mutation(async ({ input, ctx }) => {
        const employee = await db.createEmployee({
          ...input,
          dob: input.dob ? new Date(input.dob) : undefined,
          createdBy: ctx.user.id,
          lastModifiedBy: ctx.user.id,
        });
        
        // Create initial gate approval for HR review
        await db.createGateApproval({
          employeeId: employee.id,
          gateType: "HR_COMPLETENESS_REVIEW",
          status: "Pending",
        });
        
        // Log the creation
        await db.createAuditLog({
          employeeId: employee.id,
          userId: ctx.user.id,
          userName: ctx.user.name || "Unknown",
          action: "CREATE",
          tableName: "employees",
          recordId: employee.id,
          newValue: JSON.stringify(input),
        });
        
        return employee;
      }),
    
    update: hrProcedure
      .input(employeeUpdateSchema)
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        
        // Get current state for audit
        const current = await db.getEmployeeById(id);
        
        // Convert date strings to Date objects
        const updateData: Record<string, unknown> = { ...data };
        const dateFields = ['dob', 'dueDate', 'dsPacket1CompletedDate', 'dsPacket2CompletedDate', 
          'i9VerifiedDate', 'patchDate', 'fbiDate', 'childAbuseDate', 'physicalTbDate', 
          'cprExpDate', 'licenseExpDate', 'firstShiftDate', 'activeDate', 'proposedStartDate'];
        
        for (const field of dateFields) {
          if (updateData[field] && typeof updateData[field] === 'string') {
            updateData[field] = new Date(updateData[field] as string);
          }
        }
        
        updateData.lastModifiedBy = ctx.user.id;
        
        await db.updateEmployee(id, updateData);
        
        // Log the update
        await db.createAuditLog({
          employeeId: id,
          userId: ctx.user.id,
          userName: ctx.user.name || "Unknown",
          action: "UPDATE",
          tableName: "employees",
          recordId: id,
          oldValue: JSON.stringify(current),
          newValue: JSON.stringify(input),
        });
        
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.createAuditLog({
          employeeId: input.id,
          userId: ctx.user.id,
          userName: ctx.user.name || "Unknown",
          action: "DELETE",
          tableName: "employees",
          recordId: input.id,
        });
        
        await db.deleteEmployee(input.id);
        return { success: true };
      }),
    
    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return db.searchEmployees(input.query);
      }),
    
    byPhase: protectedProcedure
      .input(z.object({ phase: z.string() }))
      .query(async ({ input }) => {
        return db.getEmployeesByPhase(input.phase);
      }),
    
    byStatus: protectedProcedure
      .input(z.object({ status: z.string() }))
      .query(async ({ input }) => {
        return db.getEmployeesByStatus(input.status);
      }),
    
    withExceptions: protectedProcedure.query(async () => {
      return db.getEmployeesWithExceptions();
    }),
  }),

  // Dashboard stats
  dashboard: router({
    pipelineStats: protectedProcedure.query(async () => {
      return db.getPipelineStats();
    }),
    
    pendingApprovals: protectedProcedure.query(async () => {
      return db.getPendingApprovals();
    }),
    
    openExceptions: protectedProcedure.query(async () => {
      return db.getOpenExceptions();
    }),
    
    expiringDocumentsSummary: protectedProcedure.query(async () => {
      const [expired, expiring7, expiring14, expiring30] = await Promise.all([
        db.getExpiredDocumentsToday(),
        db.getExpiringDocuments(7),
        db.getExpiringDocuments(14),
        db.getExpiringDocuments(30),
      ]);
      
      // Helper to format document data
      const formatDoc = (d: any) => ({
        id: d.document.id,
        documentName: d.document.documentName || d.document.category,
        category: d.document.category,
        expirationDate: d.document.expirationDate,
        employeeId: d.employee.id,
        employeeName: `${d.employee.legalFirstName || ''} ${d.employee.legalLastName || ''}`.trim() || 'Unknown',
        employeeEmail: d.employee.email,
      });
      
      // Filter out duplicates (7-day is subset of 14-day, etc.)
      const expiring7Only = expiring7.map(formatDoc);
      const expiring14Only = expiring14.filter((d: any) => !expiring7.some((e: any) => e.document.id === d.document.id)).map(formatDoc);
      const expiring30Only = expiring30.filter((d: any) => !expiring14.some((e: any) => e.document.id === d.document.id)).map(formatDoc);
      const expiredFormatted = expired.map(formatDoc);
      
      return {
        expired: expiredFormatted.length,
        expiring7Days: expiring7Only.length,
        expiring14Days: expiring14Only.length,
        expiring30Days: expiring30Only.length,
        total: expiredFormatted.length + expiring30.length,
        documents: {
          expired: expiredFormatted,
          expiring7Days: expiring7Only,
          expiring14Days: expiring14Only,
          expiring30Days: expiring30Only,
        }
      };
    }),
  }),

  // Gate approvals
  gates: router({
    getForEmployee: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return db.getGateApprovalsForEmployee(input.employeeId);
      }),
    
    approve: protectedProcedure
      .input(gateApprovalSchema)
      .mutation(async ({ input, ctx }) => {
        // Check role permissions for each gate type
        const gateRoleMap: Record<string, string[]> = {
          HR_COMPLETENESS_REVIEW: ["admin", "hr"],
          PAY_RATE_START_DATE_APPROVAL: ["admin", "hr"],
          CLEARANCES_VERIFICATION: ["admin", "compliance", "hr"],
          I9_VERIFICATION: ["admin", "hr"],
          LICENSE_VERIFICATION: ["admin", "compliance"],
          PAYROLL_VERIFICATION: ["admin", "hr"],
          EVV_HHA_VERIFICATION: ["admin", "hr"],
          SUPERVISOR_READY_SIGNOFF: ["admin", "supervisor", "hr"],
        };
        
        const allowedRoles = gateRoleMap[input.gateType] || ["admin"];
        if (!allowedRoles.includes(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: `You don't have permission to approve ${input.gateType}` });
        }
        
        // Check if gate already exists
        const existing = await db.getGateApprovalByType(input.employeeId, input.gateType);
        
        if (existing) {
          await db.updateGateApproval(existing.id, {
            status: input.status,
            approvedBy: ctx.user.id,
            approvedByName: ctx.user.name || "Unknown",
            approvedAt: new Date(),
            notes: input.notes,
            rejectionReason: input.rejectionReason,
          });
        } else {
          await db.createGateApproval({
            employeeId: input.employeeId,
            gateType: input.gateType,
            status: input.status,
            approvedBy: ctx.user.id,
            approvedByName: ctx.user.name || "Unknown",
            approvedAt: new Date(),
            notes: input.notes,
            rejectionReason: input.rejectionReason,
          });
        }
        
        // Log the approval
        await db.createAuditLog({
          employeeId: input.employeeId,
          userId: ctx.user.id,
          userName: ctx.user.name || "Unknown",
          action: `GATE_${input.status.toUpperCase()}`,
          tableName: "gate_approvals",
          newValue: JSON.stringify(input),
        });
        
        // Auto-advance phase based on gate completion
        if (input.status === "Approved") {
          await advancePhaseIfReady(input.employeeId, input.gateType);
        }
        
        return { success: true };
      }),
    
    getPending: protectedProcedure
      .input(z.object({ gateType: z.string().optional() }))
      .query(async ({ input }) => {
        return db.getPendingApprovals(input.gateType as any);
      }),
  }),

  // Exceptions
  exceptions: router({
    list: protectedProcedure.query(async () => {
      return db.getOpenExceptions();
    }),
    
    getForEmployee: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return db.getExceptionsForEmployee(input.employeeId);
      }),
    
    create: hrProcedure
      .input(z.object({
        employeeId: z.number(),
        issue: z.string(),
        owner: z.string().optional(),
        dueDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createException({
          ...input,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        });
        return { success: true };
      }),
    
    resolve: hrProcedure
      .input(z.object({ id: z.number(), notes: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        await db.updateException(input.id, {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: ctx.user.id,
          notes: input.notes,
        });
        return { success: true };
      }),
  }),

  // Audit log
  audit: router({
    getForEmployee: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return db.getAuditLogsForEmployee(input.employeeId);
      }),
  }),

  // Documents
  documents: router({
    getForEmployee: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return db.getDocumentsForEmployee(input.employeeId);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getDocumentById(input.id);
      }),
    
    getByCategory: protectedProcedure
      .input(z.object({ 
        employeeId: z.number(), 
        category: z.enum([
          "clearance_patch", "clearance_fbi", "clearance_child_abuse",
          "id_drivers_license", "id_social_security", "id_passport", "id_work_authorization",
          "medical_physical", "medical_tb_test",
          "certification_cpr", "certification_license", "certification_training",
          "form_i9", "form_w4", "form_direct_deposit",
          "application", "resume", "reference", "other"
        ])
      }))
      .query(async ({ input }) => {
        return db.getDocumentsByCategory(input.employeeId, input.category);
      }),
    
    upload: hrProcedure
      .input(z.object({
        employeeId: z.number(),
        fileName: z.string(),
        originalFileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        s3Key: z.string(),
        s3Url: z.string(),
        category: z.enum([
          "clearance_patch", "clearance_fbi", "clearance_child_abuse",
          "id_drivers_license", "id_social_security", "id_passport", "id_work_authorization",
          "medical_physical", "medical_tb_test",
          "certification_cpr", "certification_license", "certification_training",
          "form_i9", "form_w4", "form_direct_deposit",
          "application", "resume", "reference", "other"
        ]),
        expirationDate: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const doc = await db.createEmployeeDocument({
          ...input,
          expirationDate: input.expirationDate ? new Date(input.expirationDate) : undefined,
          uploadedBy: ctx.user.id,
          uploadedByName: ctx.user.name || "Unknown",
        });
        
        await db.createAuditLog({
          employeeId: input.employeeId,
          userId: ctx.user.id,
          userName: ctx.user.name || "Unknown",
          action: "DOCUMENT_UPLOAD",
          tableName: "employee_documents",
          recordId: doc.id,
          newValue: JSON.stringify({ fileName: input.originalFileName, category: input.category }),
        });
        
        return doc;
      }),
    
    review: complianceProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["approved", "rejected", "expired"]),
        reviewNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateEmployeeDocument(input.id, {
          status: input.status,
          reviewedBy: ctx.user.id,
          reviewedByName: ctx.user.name || "Unknown",
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes,
        });
        
        const doc = await db.getDocumentById(input.id);
        if (doc) {
          await db.createAuditLog({
            employeeId: doc.employeeId,
            userId: ctx.user.id,
            userName: ctx.user.name || "Unknown",
            action: `DOCUMENT_${input.status.toUpperCase()}`,
            tableName: "employee_documents",
            recordId: input.id,
            newValue: JSON.stringify({ status: input.status, notes: input.reviewNotes }),
          });
        }
        
        return { success: true };
      }),
    
    delete: hrProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const doc = await db.getDocumentById(input.id);
        if (doc) {
          await db.createAuditLog({
            employeeId: doc.employeeId,
            userId: ctx.user.id,
            userName: ctx.user.name || "Unknown",
            action: "DOCUMENT_DELETE",
            tableName: "employee_documents",
            recordId: input.id,
            oldValue: JSON.stringify({ fileName: doc.originalFileName, category: doc.category }),
          });
        }
        
        await db.deleteEmployeeDocument(input.id);
        return { success: true };
      }),
    
    getPendingReview: complianceProcedure.query(async () => {
      return db.getDocumentsPendingReview();
    }),
    
    getExpired: complianceProcedure.query(async () => {
      return db.getExpiredDocuments();
    }),
  }),

  // Notifications
  notifications: router({
    getSettings: adminProcedure.query(async () => {
      const settings = await db.getNotificationSettings();
      // Return default settings if none exist
      if (!settings) {
        return {
          id: 0,
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
          lastCheckRun: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return settings;
    }),
    
    updateSettings: adminProcedure
      .input(z.object({
        alertThreshold30Day: z.boolean().optional(),
        alertThreshold14Day: z.boolean().optional(),
        alertThreshold7Day: z.boolean().optional(),
        alertThresholdExpired: z.boolean().optional(),
        monitorClearances: z.boolean().optional(),
        monitorCertifications: z.boolean().optional(),
        monitorLicenses: z.boolean().optional(),
        monitorMedical: z.boolean().optional(),
        dailyDigest: z.boolean().optional(),
        immediateAlerts: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.upsertNotificationSettings(input);
        return { success: true };
      }),
    
    getLogs: adminProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        const logs = await db.getNotificationLogs(input.limit || 50);
        return logs || [];
      }),
    
    getExpirationSummary: hrProcedure.query(async () => {
      const { getExpirationSummary } = await import("./notificationService");
      return getExpirationSummary();
    }),
    
    runExpirationCheck: adminProcedure.mutation(async () => {
      const { runExpirationCheck } = await import("./notificationService");
      return runExpirationCheck();
    }),

    // In-app notification bell endpoints
    inApp: router({
      list: protectedProcedure
        .input(z.object({
          limit: z.number().min(1).max(100).optional(),
          offset: z.number().min(0).optional(),
          unreadOnly: z.boolean().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
          return db.getInAppNotifications(ctx.user.id, input);
        }),

      unreadCount: protectedProcedure.query(async ({ ctx }) => {
        return db.getUnreadNotificationCount(ctx.user.id);
      }),

      markRead: protectedProcedure
        .input(z.object({ notificationId: z.number() }))
        .mutation(async ({ ctx, input }) => {
          await db.markNotificationRead(input.notificationId, ctx.user.id);
          return { success: true };
        }),

      markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
        await db.markAllNotificationsRead(ctx.user.id);
        return { success: true };
      }),
    }),
  }),

  // Clearances
  clearances: router({
    getForEmployee: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return db.getClearancesForEmployee(input.employeeId);
      }),

    create: hrProcedure
      .input(z.object({
        employeeId: z.number(),
        type: z.enum(["PA_PATCH", "FBI", "CHILDLINE"]),
        status: z.enum(["not_started", "initiated", "pending", "clear", "flagged", "expired"]).optional(),
        submissionDate: z.string().optional(),
        resultDate: z.string().optional(),
        expirationDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createClearance(input as any);
        return { id };
      }),

    update: complianceProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["not_started", "initiated", "pending", "clear", "flagged", "expired"]).optional(),
        resultDate: z.string().optional(),
        expirationDate: z.string().optional(),
        certificateS3Key: z.string().optional(),
        checkrCandidateId: z.string().optional(),
        checkrReportId: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateClearance(id, data as any);
        return { success: true };
      }),

    getExpiring: complianceProcedure
      .input(z.object({ daysThreshold: z.number().default(60) }))
      .query(async ({ input }) => {
        return db.getExpiringClearances(input.daysThreshold);
      }),
  }),

  // Exclusion Screenings (LEIE/SAM)
  exclusions: router({
    list: complianceProcedure
      .input(z.object({
        employeeId: z.number().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getExclusionScreenings(input);
      }),

    resolve: complianceProcedure
      .input(z.object({
        id: z.number(),
        notes: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.resolveExclusionScreening(input.id, ctx.user.id, input.notes);
        return { success: true };
      }),

    runNow: adminProcedure.mutation(async () => {
      const { runMonthlyScreening } = await import("./integrations/exclusions/orchestrator");
      return runMonthlyScreening();
    }),
  }),

  // Integration Configs
  integrations: router({
    list: adminProcedure.query(async () => {
      return db.getAllIntegrationConfigs();
    }),

    get: adminProcedure
      .input(z.object({ provider: z.string() }))
      .query(async ({ input }) => {
        return db.getIntegrationConfig(input.provider);
      }),

    upsert: adminProcedure
      .input(z.object({
        provider: z.string(),
        isActive: z.boolean().optional(),
        configJson: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { provider, ...data } = input;
        await db.upsertIntegrationConfig(provider, data);
        return { success: true };
      }),
  }),

  // DocuSign
  docusign: router({
    sendPacket: hrProcedure
      .input(z.object({
        employeeId: z.number(),
        packetType: z.enum(["1", "2"]),
        templateId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createEnvelope } = await import("./integrations/docusign/envelopes");
        return createEnvelope(input.employeeId, Number(input.packetType) as 1 | 2, input.templateId);
      }),

    getSigningUrl: protectedProcedure
      .input(z.object({
        envelopeId: z.string(),
        employeeId: z.number(),
        returnUrl: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { getSigningUrl } = await import("./integrations/docusign/envelopes");
        const returnUrl = input.returnUrl || `${process.env.APP_URL || "http://localhost:3000"}/employees/${input.employeeId}`;
        return getSigningUrl(input.envelopeId, input.employeeId, returnUrl);
      }),

    voidEnvelope: hrProcedure
      .input(z.object({
        envelopeId: z.string(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { voidEnvelope } = await import("./integrations/docusign/envelopes");
        return voidEnvelope(input.envelopeId, input.reason);
      }),
  }),

  // Checkr Background Checks
  checkr: router({
    initiate: hrProcedure
      .input(z.object({
        employeeId: z.number(),
        clearanceType: z.enum(["PA_PATCH", "FBI", "CHILDLINE"]).default("PA_PATCH"),
        packageSlug: z.string().default("tasker_standard"),
      }))
      .mutation(async ({ input }) => {
        const { initiateBackgroundCheck } = await import("./integrations/checkr/service");
        return initiateBackgroundCheck(input.employeeId, input.clearanceType, input.packageSlug);
      }),

    getStatus: protectedProcedure
      .input(z.object({ reportId: z.string() }))
      .query(async ({ input }) => {
        const { getReport } = await import("./integrations/checkr/client");
        return getReport(input.reportId);
      }),
  }),

  // Role matrix
  roleMatrix: router({
    list: protectedProcedure.query(async () => {
      return db.getRoleMatrix();
    }),

    getRequirements: protectedProcedure
      .input(z.object({ roleName: z.string(), serviceLine: z.enum(["OLTL", "ODP", "Skilled"]) }))
      .query(async ({ input }) => {
        return db.getRoleRequirements(input.roleName, input.serviceLine);
      }),

    upsert: adminProcedure
      .input(z.object({
        roleName: z.string(),
        serviceLine: z.enum(["OLTL", "ODP", "Skilled"]),
        requiredDocuments: z.string().optional(),
        requiredClearances: z.string().optional(),
        requiredTrainings: z.string().optional(),
        skilledLicenseRequired: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.upsertRoleMatrix(input);
        return { success: true };
      }),
  }),

  // Timesheet management
  timesheets: router({
    // Pay Period management
    listPayPeriods: protectedProcedure.query(async () => {
      return (await db.getPayPeriods()) || [];
    }),
    
    getActivePayPeriod: protectedProcedure.query(async () => {
      const period = await db.getActivePayPeriod();
      return period || null;
    }),
    
    createPayPeriod: hrProcedure
      .input(z.object({
        periodName: z.string().min(1),
        startDate: z.string(),
        endDate: z.string(),
        timesheetDueDate: z.string(),
        payrollProcessDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createPayPeriod({
          ...input,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          timesheetDueDate: new Date(input.timesheetDueDate),
          payrollProcessDate: input.payrollProcessDate ? new Date(input.payrollProcessDate) : undefined,
          status: "upcoming",
        });
        return { success: true };
      }),
    
    updatePayPeriod: hrProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["upcoming", "active", "closed", "processed"]).optional(),
        reminderSent: z.boolean().optional(),
        finalReminderSent: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updatePayPeriod(id, data);
        return { success: true };
      }),
    
    // Timesheet CRUD
    list: protectedProcedure
      .input(z.object({ payPeriodId: z.number() }))
      .query(async ({ input }) => {
        return (await db.getTimesheetsByPayPeriod(input.payPeriodId)) || [];
      }),
    
    listByEmployee: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return (await db.getTimesheetsByEmployee(input.employeeId)) || [];
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const timesheet = await db.getTimesheetById(input.id);
        return timesheet || null;
      }),
    
    create: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        payPeriodId: z.number(),
        fileKey: z.string().optional(),
        fileUrl: z.string().optional(),
        originalFileName: z.string().optional(),
        mimeType: z.string().optional(),
        fileSize: z.number().optional(),
        totalHours: z.string().optional(),
        participantName: z.string().optional(),
        signatureType: z.enum(["wet", "digital", "pending"]).optional(),
        participantSigned: z.boolean().optional(),
        employeeSigned: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createTimesheet({
          ...input,
          totalHours: input.totalHours || undefined,
          uploadedBy: ctx.user.id,
          uploadedByName: ctx.user.name || "Unknown",
          status: "draft",
        });
        return { success: true, id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        fileKey: z.string().optional(),
        fileUrl: z.string().optional(),
        originalFileName: z.string().optional(),
        mimeType: z.string().optional(),
        fileSize: z.number().optional(),
        totalHours: z.string().optional(),
        participantName: z.string().optional(),
        signatureType: z.enum(["wet", "digital", "pending"]).optional(),
        participantSigned: z.boolean().optional(),
        participantSignedDate: z.string().optional(),
        employeeSigned: z.boolean().optional(),
        employeeSignedDate: z.string().optional(),
        status: z.enum(["draft", "submitted", "pending_review", "approved", "rejected", "needs_correction"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: Record<string, unknown> = { ...data };
        
        if (data.participantSignedDate) {
          updateData.participantSignedDate = new Date(data.participantSignedDate);
        }
        if (data.employeeSignedDate) {
          updateData.employeeSignedDate = new Date(data.employeeSignedDate);
        }
        if (data.status === "submitted") {
          updateData.submittedAt = new Date();
        }
        
        await db.updateTimesheet(id, updateData);
        return { success: true };
      }),
    
    submit: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateTimesheet(input.id, {
          status: "submitted",
          submittedAt: new Date(),
        });
        return { success: true };
      }),
    
    approve: supervisorProcedure
      .input(z.object({
        id: z.number(),
        evvCompliant: z.boolean().optional(),
        evvNotes: z.string().optional(),
        reviewNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateTimesheet(input.id, {
          status: "approved",
          reviewedBy: ctx.user.id,
          reviewedByName: ctx.user.name || "Unknown",
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes,
          evvCompliant: input.evvCompliant,
          evvVerifiedBy: ctx.user.id,
          evvVerifiedByName: ctx.user.name || "Unknown",
          evvVerifiedDate: new Date(),
          evvNotes: input.evvNotes,
          payrollReady: true,
        });
        return { success: true };
      }),
    
    reject: supervisorProcedure
      .input(z.object({
        id: z.number(),
        reviewNotes: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateTimesheet(input.id, {
          status: "needs_correction",
          reviewedBy: ctx.user.id,
          reviewedByName: ctx.user.name || "Unknown",
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes,
        });
        return { success: true };
      }),
    
    delete: hrProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTimesheet(input.id);
        return { success: true };
      }),
    
    // Stats and reports
    getStats: protectedProcedure
      .input(z.object({ payPeriodId: z.number() }))
      .query(async ({ input }) => {
        const stats = await db.getTimesheetStats(input.payPeriodId);
        return stats || { total: 0, submitted: 0, approved: 0, pending: 0, missing: 0 };
      }),
    
    getMissingTimesheets: hrProcedure
      .input(z.object({ payPeriodId: z.number() }))
      .query(async ({ input }) => {
        return (await db.getEmployeesWithMissingTimesheets(input.payPeriodId)) || [];
      }),
    
    // Templates
    listTemplates: protectedProcedure.query(async () => {
      return (await db.getTimesheetTemplates()) || [];
    }),
    
    createTemplate: hrProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        serviceLine: z.enum(["OLTL", "ODP", "Skilled", "All"]).optional(),
        fileKey: z.string(),
        fileUrl: z.string(),
        originalFileName: z.string().optional(),
        mimeType: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createTimesheetTemplate({
          ...input,
          uploadedBy: ctx.user.id,
          uploadedByName: ctx.user.name || "Unknown",
        });
        return { success: true, id };
      }),
    
    deleteTemplate: hrProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTimesheetTemplate(input.id);
        return { success: true };
      }),
    
    // Send reminder to specific employee
    sendReminder: hrProcedure
      .input(z.object({
        employeeId: z.number(),
        payPeriodId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { sendIndividualReminder } = await import("./timesheetNotificationService");
        return sendIndividualReminder(input.employeeId, input.payPeriodId);
      }),
    
    // Run reminder check manually
    runReminderCheck: hrProcedure.mutation(async () => {
      const { runTimesheetReminderCheck } = await import("./timesheetNotificationService");
      return runTimesheetReminderCheck();
    }),
  }),

  // Payroll Reports
  payroll: router({
    // Get payroll report data for a pay period
    getReportData: hrProcedure
      .input(z.object({ payPeriodId: z.number() }))
      .query(async ({ input }) => {
        return (await db.getPayrollReportData(input.payPeriodId)) || [];
      }),
    
    // Get payroll summary for a pay period
    getSummary: hrProcedure
      .input(z.object({ payPeriodId: z.number() }))
      .query(async ({ input }) => {
        const summary = await db.getPayrollSummary(input.payPeriodId);
        return summary || { employeeCount: 0, timesheetCount: 0, totalHours: '0.00' };
      }),
    
    // Generate CSV export
    generateCSV: hrProcedure
      .input(z.object({ payPeriodId: z.number() }))
      .mutation(async ({ input }) => {
        const reportData = await db.getPayrollReportData(input.payPeriodId);
        const payPeriod = await db.getPayPeriodById(input.payPeriodId);
        
        if (!reportData || reportData.length === 0) {
          return { success: false, error: 'No approved timesheets found for this pay period' };
        }
        
        // Generate CSV content
        const headers = [
          'Employee ID',
          'Employee Number',
          'First Name',
          'Last Name',
          'Email',
          'Phone',
          'Service Line',
          'Pay Rate',
          'Pay Type',
          'Total Hours',
          'Status',
          'Signature Type',
          'Participant Signed',
          'Employee Signed',
          'EVV Compliant',
          'Submitted At',
          'Reviewed At',
          'Reviewed By'
        ];
        
        const rows = reportData.map(row => [
          row.employeeId,
          row.employeeIdStr,
          row.legalFirstName,
          row.legalLastName,
          row.email || '',
          row.phone || '',
          row.serviceLine,
          row.payRate || '',
          row.payType || '',
          row.totalHours || '0',
          row.status,
          row.signatureType || '',
          row.participantSigned ? 'Yes' : 'No',
          row.employeeSigned ? 'Yes' : 'No',
          row.evvCompliant ? 'Yes' : 'No',
          row.submittedAt ? new Date(row.submittedAt).toISOString() : '',
          row.reviewedAt ? new Date(row.reviewedAt).toISOString() : '',
          row.reviewedByName || ''
        ]);
        
        // Escape CSV values
        const escapeCSV = (val: string | number | boolean) => {
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };
        
        const csvContent = [
          headers.map(escapeCSV).join(','),
          ...rows.map(row => row.map(escapeCSV).join(','))
        ].join('\n');
        
        return {
          success: true,
          csv: csvContent,
          filename: `payroll-report-${payPeriod?.periodName?.replace(/[^a-zA-Z0-9]/g, '-') || input.payPeriodId}.csv`,
          recordCount: reportData.length
        };
      }),
  }),

  // ============ PAYROLL EXPORT ROUTER ============
  payrollExport: router({
    // Get employee tax info
    getTaxInfo: hrProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEmployeeTaxInfo(input.employeeId);
      }),
    
    // Save employee tax info
    saveTaxInfo: hrProcedure
      .input(z.object({
        employeeId: z.number(),
        taxClassification: z.enum(['W2', '1099']).optional(),
        ssnFull: z.string().optional(),
        federalFilingStatus: z.enum(['Single', 'Married Filing Jointly', 'Married Filing Separately', 'Head of Household']).optional(),
        federalAllowances: z.number().optional(),
        additionalFederalWithholding: z.string().optional(),
        federalExempt: z.boolean().optional(),
        stateFilingStatus: z.string().optional(),
        stateAllowances: z.number().optional(),
        additionalStateWithholding: z.string().optional(),
        stateExempt: z.boolean().optional(),
        workState: z.string().optional(),
        residentState: z.string().optional(),
        localTaxCode: z.string().optional(),
        localWithholding: z.string().optional(),
        multipleJobsOrSpouseWorks: z.boolean().optional(),
        dependentsAmount: z.string().optional(),
        otherIncome: z.string().optional(),
        deductions: z.string().optional(),
        ein: z.string().optional(),
        businessName: z.string().optional(),
        w4ReceivedDate: z.string().optional(),
        w9ReceivedDate: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.upsertEmployeeTaxInfo({
          ...input,
          w4VerifiedBy: ctx.user.id,
        } as any);
        return { success: true };
      }),
    
    // Get employee direct deposits
    getDirectDeposits: hrProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEmployeeDirectDeposits(input.employeeId);
      }),
    
    // Add direct deposit
    addDirectDeposit: hrProcedure
      .input(z.object({
        employeeId: z.number(),
        bankName: z.string().optional(),
        accountType: z.enum(['Checking', 'Savings']).optional(),
        routingNumber: z.string().optional(),
        accountNumber: z.string().optional(),
        depositType: z.enum(['Full', 'Percentage', 'Fixed Amount']).optional(),
        depositAmount: z.string().optional(),
        depositPercent: z.number().optional(),
        isPrimary: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createDirectDeposit({
          ...input,
          verifiedBy: ctx.user.id,
          verifiedDate: new Date().toISOString().split('T')[0],
        } as any);
        return { success: true, id };
      }),
    
    // Delete direct deposit
    deleteDirectDeposit: hrProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDirectDeposit(input.id);
        return { success: true };
      }),
    
    // Get employee compensation
    getCompensation: hrProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEmployeeCompensation(input.employeeId);
      }),
    
    // Save employee compensation
    saveCompensation: hrProcedure
      .input(z.object({
        employeeId: z.number(),
        employmentType: z.enum(['Full-Time', 'Part-Time', 'PRN', 'Contract']).optional(),
        flsaStatus: z.enum(['Exempt', 'Non-Exempt']).optional(),
        payRate: z.string().optional(),
        payType: z.enum(['Hourly', 'Salary', 'Per Visit', 'Per Diem']).optional(),
        payFrequency: z.enum(['Weekly', 'Bi-Weekly', 'Semi-Monthly', 'Monthly']).optional(),
        overtimeEligible: z.boolean().optional(),
        overtimeRate: z.string().optional(),
        weekendDifferential: z.string().optional(),
        nightDifferential: z.string().optional(),
        holidayRate: z.string().optional(),
        annualSalary: z.string().optional(),
        effectiveDate: z.string().optional(),
        departmentCode: z.string().optional(),
        costCenter: z.string().optional(),
        jobCode: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.upsertEmployeeCompensation(input as any);
        return { success: true };
      }),
    
    // Get employee benefits
    getBenefits: hrProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEmployeeBenefits(input.employeeId);
      }),
    
    // Add benefit
    addBenefit: hrProcedure
      .input(z.object({
        employeeId: z.number(),
        benefitType: z.enum(['Health Insurance', 'Dental Insurance', 'Vision Insurance', 'Life Insurance', '401k', 'HSA', 'FSA', 'Other']),
        planName: z.string().optional(),
        planId: z.string().optional(),
        coverageLevel: z.enum(['Employee Only', 'Employee + Spouse', 'Employee + Children', 'Family']).optional(),
        employeeContribution: z.string().optional(),
        employerContribution: z.string().optional(),
        contributionFrequency: z.enum(['Per Pay Period', 'Monthly', 'Annual']).optional(),
        enrollmentStatus: z.enum(['Enrolled', 'Waived', 'Pending', 'Terminated']).optional(),
        effectiveDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createBenefit(input as any);
        return { success: true, id };
      }),
    
    // Delete benefit
    deleteBenefit: hrProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteBenefit(input.id);
        return { success: true };
      }),
    
    // Get export history
    getExportHistory: hrProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getPayrollExports(input.limit || 50);
      }),
    
    // Generate employee export
    generateEmployeeExport: hrProcedure
      .input(z.object({
        targetSystem: z.enum(['UKG', 'ADP', 'Paychex', 'HHA_Exchange', 'Generic_CSV']),
        filters: z.object({
          serviceLine: z.string().optional(),
          status: z.string().optional(),
          phase: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Get all employees with full data
        const employees = await db.getAllEmployeesForExport(input.filters);
        
        if (employees.length === 0) {
          return { success: false, error: 'No employees found matching the criteria' };
        }
        
        // Generate CSV based on target system
        let csvContent: string;
        switch (input.targetSystem) {
          case 'UKG':
            csvContent = generateUKGExport(employees);
            break;
          case 'ADP':
            csvContent = generateADPExport(employees);
            break;
          case 'HHA_Exchange':
            csvContent = generateHHAExchangeExport(employees);
            break;
          default:
            csvContent = generateGenericExport(employees);
        }
        
        // Generate filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `employee-export-${input.targetSystem.toLowerCase()}-${timestamp}.csv`;
        
        // Upload to S3
        const fileKey = `payroll-exports/${filename}`;
        const { url } = await storagePut(fileKey, csvContent, 'text/csv');
        
        // Log the export
        const exportId = await db.createPayrollExport({
          exportType: 'employee_new_hire',
          targetSystem: input.targetSystem,
          fileName: filename,
          fileUrl: url,
          fileKey: fileKey,
          recordCount: employees.length,
          status: 'completed',
          exportedBy: ctx.user.id,
        });
        
        return {
          success: true,
          csv: csvContent,
          filename,
          fileUrl: url,
          recordCount: employees.length,
          exportId,
        };
      }),
    
    // Get full employee data for preview
    getEmployeeExportPreview: hrProcedure
      .input(z.object({
        filters: z.object({
          serviceLine: z.string().optional(),
          status: z.string().optional(),
          phase: z.string().optional(),
        }).optional(),
      }))
      .query(async ({ input }) => {
        const employees = await db.getAllEmployeesForExport(input.filters);
        return employees.map(e => ({
          id: e.employee.id,
          employeeId: e.employee.employeeId,
          name: `${e.employee.legalFirstName} ${e.employee.legalLastName}`,
          serviceLine: e.employee.serviceLine,
          status: e.employee.status,
          phase: e.employee.currentPhase,
          hasTaxInfo: !!e.taxInfo,
          hasDirectDeposit: e.directDeposits.length > 0,
          hasCompensation: !!e.compensation,
          payRate: e.compensation?.payRate || e.employee.payRate,
          payType: e.compensation?.payType || e.employee.payType,
        }));
      }),
    
    // Review/approve export
    reviewExport: hrProcedure
      .input(z.object({
        exportId: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updatePayrollExport(input.exportId, {
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          reviewNotes: input.notes,
        });
        return { success: true };
      }),
  }),

  // ── Profitability Calculator ───────────────────────────────────────
  profitability: router({
    calculate: protectedProcedure
      .input(z.object({
        clientName: z.string(),
        waiverType: z.enum(["OLTL", "ODP", "Skilled"]),
        region: z.number().min(1).max(4),
        serviceType: z.string().optional(),
        hoursPerWeek: z.number().min(0),
        scheduleType: z.enum(["fixed", "mostly_fixed", "variable"]),
        caregiverType: z.enum(["family", "non_family"]),
        caregiverSource: z.enum(["referral", "indeed", "job_board", "word_of_mouth", "other"]),
        payRateOverride: z.number().optional(),
        fitAssessment: z.object({
          hasCaregiversAvailable: z.boolean(),
          inServiceArea: z.boolean(),
          scheduleCompatible: z.boolean(),
          withinCapabilities: z.boolean(),
          familyDynamicsGood: z.boolean(),
        }),
        useMultiWorker: z.boolean().optional(),
        staffingModel: z.any().optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ input }) => {
        return calculateProfitability(input as any);
      }),

    getRateTables: protectedProcedure.query(() => {
      return {
        OLTL: OLTL_HOURLY_RATES,
        ODP: ODP_RATES,
        Skilled: SKILLED_RATES,
        regions: REGION_NAMES,
        serviceTypeLabels: SERVICE_TYPE_LABELS,
        defaultCosts: DEFAULT_COSTS,
        waiverDuration: WAIVER_DURATION,
      };
    }),

    getServiceTypes: protectedProcedure
      .input(z.object({ waiverType: z.enum(["OLTL", "ODP", "Skilled"]) }))
      .query(({ input }) => {
        return {
          types: getServiceTypes(input.waiverType),
          defaultType: getDefaultServiceType(input.waiverType),
        };
      }),

    getRate: protectedProcedure
      .input(z.object({
        waiverType: z.enum(["OLTL", "ODP", "Skilled"]),
        serviceType: z.string(),
        region: z.number().min(1).max(4),
      }))
      .query(({ input }) => {
        return {
          rate: getRate(input.waiverType, input.serviceType, input.region as any),
          defaultPayRate: getDefaultPayRate(input.waiverType, input.serviceType),
        };
      }),
  }),

  // ── Client Management ─────────────────────────────────────────────
  clients: router({
    list: protectedProcedure.query(async () => {
      return db.getAllClients();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getClientById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        serviceLine: z.enum(["OLTL", "ODP", "Skilled"]).optional(),
        region: z.number().min(1).max(4).optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        county: z.string().optional(),
        mcoId: z.string().optional(),
        referralSource: z.string().optional(),
        serviceType: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createClient({
          ...input,
          createdBy: ctx.user.id,
          lastModifiedBy: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        serviceLine: z.enum(["OLTL", "ODP", "Skilled"]).optional(),
        region: z.number().optional(),
        status: z.enum(["referral", "assessment", "active", "on_hold", "discharged"]).optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        return db.updateClient(id, { ...data, lastModifiedBy: ctx.user.id });
      }),
  }),

  // ── Authorizations ────────────────────────────────────────────────
  authorizations: router({
    list: protectedProcedure.query(async () => {
      return db.getAllAuthorizations();
    }),

    getByClientId: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return db.getAuthorizationsByClientId(input.clientId);
      }),

    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        mco: z.string().optional(),
        serviceType: z.string().optional(),
        authorizedHoursPerWeek: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        authorizationNumber: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createAuthorization({
          ...input,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
        } as any);
      }),
  }),

  // ── Executive Dashboard Stats ─────────────────────────────────────
  dashboardStats: router({
    executive: protectedProcedure.query(async () => {
      const employees = await db.getAllEmployees();
      const clients = await db.getAllClients();

      const activeEmployees = employees.filter(e => e.currentPhase === "Active").length;
      const activeClients = clients.filter(c => (c as any).status === "active").length;
      const inPipeline = employees.filter(e => e.currentPhase !== "Active" && e.currentPhase !== "Post-Onboarding").length;

      return {
        activeClients,
        activeEmployees,
        inPipeline,
        totalEmployees: employees.length,
        totalClients: clients.length,
      };
    }),

    hr: protectedProcedure.query(async () => {
      const employees = await db.getAllEmployees();

      const pipelinePhases = ["Intake", "Screening", "Documentation", "Verification", "Provisioning", "Ready to Schedule"];
      const inPipeline = employees.filter(e => pipelinePhases.includes(e.currentPhase ?? ""));
      const stuckCount = inPipeline.filter(e => {
        if (!e.updatedAt) return false;
        const daysSinceUpdate = (Date.now() - new Date(e.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate > 7;
      }).length;

      // Group by phase for mini-kanban
      const byPhase: Record<string, typeof employees> = {};
      for (const phase of pipelinePhases) {
        byPhase[phase] = employees.filter(e => e.currentPhase === phase);
      }

      return {
        pipelineCount: inPipeline.length,
        stuckCount,
        byPhase,
      };
    }),
  }),
});

// Helper function to auto-advance phases based on gate completion
async function advancePhaseIfReady(employeeId: number, completedGate: string) {
  const employee = await db.getEmployeeById(employeeId);
  if (!employee) return;
  
  const gates = await db.getGateApprovalsForEmployee(employeeId);
  const approvedGates = gates.filter(g => g.status === "Approved").map(g => g.gateType);
  
  // Phase advancement logic
  const phaseTransitions: Record<string, { requiredGates: string[]; nextPhase: string }> = {
    "Intake": { requiredGates: ["HR_COMPLETENESS_REVIEW"], nextPhase: "Screening" },
    "Screening": { requiredGates: ["CLEARANCES_VERIFICATION"], nextPhase: "Documentation" },
    "Documentation": { requiredGates: [], nextPhase: "Verification" },
    "Verification": { requiredGates: ["I9_VERIFICATION"], nextPhase: "Provisioning" },
    "Provisioning": { requiredGates: ["PAYROLL_VERIFICATION", "EVV_HHA_VERIFICATION"], nextPhase: "Ready to Schedule" },
    "Ready to Schedule": { requiredGates: ["SUPERVISOR_READY_SIGNOFF"], nextPhase: "Active" },
  };
  
  const currentPhase = employee.currentPhase;
  if (!currentPhase) return;
  
  const transition = phaseTransitions[currentPhase];
  if (!transition) return;
  
  // Check if all required gates are approved
  const allGatesApproved = transition.requiredGates.every(gate => approvedGates.includes(gate as typeof approvedGates[number]));
  
  if (allGatesApproved && transition.requiredGates.includes(completedGate)) {
    await db.updateEmployee(employeeId, {
      currentPhase: transition.nextPhase as any,
      status: "In Progress",
    });
    
    // Create next gate approval if needed
    const nextGates: Record<string, string> = {
      "Screening": "CLEARANCES_VERIFICATION",
      "Verification": "I9_VERIFICATION",
      "Provisioning": "PAYROLL_VERIFICATION",
      "Ready to Schedule": "SUPERVISOR_READY_SIGNOFF",
    };
    
    const nextGate = nextGates[transition.nextPhase];
    if (nextGate) {
      await db.createGateApproval({
        employeeId,
        gateType: nextGate as any,
        status: "Pending",
      });
    }
  }
}

export type AppRouter = typeof appRouter;
