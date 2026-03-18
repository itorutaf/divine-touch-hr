import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Mock database functions
vi.mock("./db", () => ({
  getDocumentsForEmployee: vi.fn().mockResolvedValue([
    {
      id: 1,
      employeeId: 1,
      fileName: "test-file.pdf",
      originalFileName: "test-file.pdf",
      fileSize: 1024,
      mimeType: "application/pdf",
      s3Key: "1/clearance_patch/test.pdf",
      s3Url: "https://s3.example.com/test.pdf",
      category: "clearance_patch",
      status: "pending_review",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getDocumentById: vi.fn().mockResolvedValue({
    id: 1,
    employeeId: 1,
    fileName: "test-file.pdf",
    originalFileName: "test-file.pdf",
    fileSize: 1024,
    mimeType: "application/pdf",
    s3Key: "1/clearance_patch/test.pdf",
    s3Url: "https://s3.example.com/test.pdf",
    category: "clearance_patch",
    status: "pending_review",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getDocumentsByCategory: vi.fn().mockResolvedValue([]),
  createEmployeeDocument: vi.fn().mockResolvedValue({
    id: 2,
    employeeId: 1,
    fileName: "new-file.pdf",
    originalFileName: "new-file.pdf",
    fileSize: 2048,
    mimeType: "application/pdf",
    s3Key: "1/clearance_fbi/new.pdf",
    s3Url: "https://s3.example.com/new.pdf",
    category: "clearance_fbi",
    status: "pending_review",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updateEmployeeDocument: vi.fn().mockResolvedValue(undefined),
  deleteEmployeeDocument: vi.fn().mockResolvedValue(undefined),
  getDocumentsPendingReview: vi.fn().mockResolvedValue([]),
  getExpiredDocuments: vi.fn().mockResolvedValue([]),
  createAuditLog: vi.fn().mockResolvedValue(undefined),
}));

function createHRContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "hr-user",
    email: "hr@example.com",
    name: "HR User",
    loginMethod: "manus",
    role: "hr",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createComplianceContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "compliance-user",
    email: "compliance@example.com",
    name: "Compliance User",
    loginMethod: "manus",
    role: "compliance",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createRegularUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 3,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("documents router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getForEmployee", () => {
    it("returns documents for an employee", async () => {
      const ctx = createHRContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.documents.getForEmployee({ employeeId: 1 });

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe("clearance_patch");
    });

    it("allows regular users to view documents", async () => {
      const ctx = createRegularUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.documents.getForEmployee({ employeeId: 1 });

      expect(result).toHaveLength(1);
    });
  });

  describe("upload", () => {
    it("allows HR to upload documents", async () => {
      const ctx = createHRContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.documents.upload({
        employeeId: 1,
        fileName: "new-file.pdf",
        originalFileName: "new-file.pdf",
        fileSize: 2048,
        mimeType: "application/pdf",
        s3Key: "1/clearance_fbi/new.pdf",
        s3Url: "https://s3.example.com/new.pdf",
        category: "clearance_fbi",
      });

      expect(result.id).toBe(2);
      expect(result.category).toBe("clearance_fbi");
    });

    it("rejects upload from regular users", async () => {
      const ctx = createRegularUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.documents.upload({
          employeeId: 1,
          fileName: "new-file.pdf",
          originalFileName: "new-file.pdf",
          fileSize: 2048,
          mimeType: "application/pdf",
          s3Key: "1/clearance_fbi/new.pdf",
          s3Url: "https://s3.example.com/new.pdf",
          category: "clearance_fbi",
        })
      ).rejects.toThrow("HR or Admin access required");
    });
  });

  describe("review", () => {
    it("allows compliance to review documents", async () => {
      const ctx = createComplianceContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.documents.review({
        id: 1,
        status: "approved",
        reviewNotes: "Document verified",
      });

      expect(result.success).toBe(true);
    });

    it("allows HR to review documents", async () => {
      const ctx = createHRContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.documents.review({
        id: 1,
        status: "approved",
      });

      expect(result.success).toBe(true);
    });

    it("rejects review from regular users", async () => {
      const ctx = createRegularUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.documents.review({
          id: 1,
          status: "approved",
        })
      ).rejects.toThrow("Compliance, HR, or Admin access required");
    });
  });

  describe("delete", () => {
    it("allows HR to delete documents", async () => {
      const ctx = createHRContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.documents.delete({ id: 1 });

      expect(result.success).toBe(true);
    });

    it("rejects delete from regular users", async () => {
      const ctx = createRegularUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.documents.delete({ id: 1 })).rejects.toThrow(
        "HR or Admin access required"
      );
    });
  });
});
