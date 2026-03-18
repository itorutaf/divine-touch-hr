import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getExpiredDocumentsToday: vi.fn(),
  getExpiringDocuments: vi.fn(),
  getPipelineStats: vi.fn(),
  getPendingApprovals: vi.fn(),
  getOpenExceptions: vi.fn(),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
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

describe("dashboard.expiringDocumentsSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns correct counts when no documents are expiring", async () => {
    vi.mocked(db.getExpiredDocumentsToday).mockResolvedValue([]);
    vi.mocked(db.getExpiringDocuments).mockResolvedValue([]);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.expiringDocumentsSummary();

    expect(result).toEqual({
      expired: 0,
      expiring7Days: 0,
      expiring14Days: 0,
      expiring30Days: 0,
      total: 0,
      documents: {
        expired: [],
        expiring7Days: [],
        expiring14Days: [],
        expiring30Days: [],
      },
    });
  });

  it("returns correct counts with expiring documents", async () => {
    const mockExpiredDoc = {
      document: {
        id: 1,
        documentName: "Expired PATCH",
        category: "clearance",
        expirationDate: new Date("2025-12-20"),
      },
      employee: {
        id: 1,
        legalFirstName: "John",
        legalLastName: "Doe",
        email: "john@example.com",
      },
    };

    const mock7DayDoc = {
      document: {
        id: 2,
        documentName: "CPR Certification",
        category: "certification",
        expirationDate: new Date("2025-12-29"),
      },
      employee: {
        id: 1,
        legalFirstName: "John",
        legalLastName: "Doe",
        email: "john@example.com",
      },
    };

    const mock14DayDoc = {
      document: {
        id: 3,
        documentName: "FBI Clearance",
        category: "clearance",
        expirationDate: new Date("2026-01-05"),
      },
      employee: {
        id: 2,
        legalFirstName: "Jane",
        legalLastName: "Smith",
        email: "jane@example.com",
      },
    };

    const mock30DayDoc = {
      document: {
        id: 4,
        documentName: "Driver License",
        category: "identification",
        expirationDate: new Date("2026-01-20"),
      },
      employee: {
        id: 2,
        legalFirstName: "Jane",
        legalLastName: "Smith",
        email: "jane@example.com",
      },
    };

    vi.mocked(db.getExpiredDocumentsToday).mockResolvedValue([mockExpiredDoc]);
    vi.mocked(db.getExpiringDocuments).mockImplementation(async (days: number) => {
      if (days === 7) return [mock7DayDoc];
      if (days === 14) return [mock7DayDoc, mock14DayDoc];
      if (days === 30) return [mock7DayDoc, mock14DayDoc, mock30DayDoc];
      return [];
    });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.expiringDocumentsSummary();

    expect(result.expired).toBe(1);
    expect(result.expiring7Days).toBe(1);
    expect(result.expiring14Days).toBe(1); // Only the 14-day doc, not the 7-day one
    expect(result.expiring30Days).toBe(1); // Only the 30-day doc, not the 7 or 14-day ones
    expect(result.total).toBe(4); // 1 expired + 3 expiring in 30 days
  });

  it("formats document data correctly", async () => {
    const mockDoc = {
      document: {
        id: 1,
        documentName: "Test Document",
        category: "clearance",
        expirationDate: new Date("2025-12-29"),
      },
      employee: {
        id: 1,
        legalFirstName: "John",
        legalLastName: "Doe",
        email: "john@example.com",
      },
    };

    vi.mocked(db.getExpiredDocumentsToday).mockResolvedValue([]);
    vi.mocked(db.getExpiringDocuments).mockImplementation(async (days: number) => {
      if (days === 7) return [mockDoc];
      return [mockDoc];
    });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.expiringDocumentsSummary();

    expect(result.documents.expiring7Days[0]).toEqual({
      id: 1,
      documentName: "Test Document",
      category: "clearance",
      expirationDate: new Date("2025-12-29"),
      employeeId: 1,
      employeeName: "John Doe",
      employeeEmail: "john@example.com",
    });
  });

  it("uses category as documentName when documentName is missing", async () => {
    const mockDoc = {
      document: {
        id: 1,
        documentName: null,
        category: "clearance",
        expirationDate: new Date("2025-12-29"),
      },
      employee: {
        id: 1,
        legalFirstName: "John",
        legalLastName: "Doe",
        email: "john@example.com",
      },
    };

    vi.mocked(db.getExpiredDocumentsToday).mockResolvedValue([]);
    vi.mocked(db.getExpiringDocuments).mockImplementation(async (days: number) => {
      if (days === 7) return [mockDoc];
      return [mockDoc];
    });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.expiringDocumentsSummary();

    expect(result.documents.expiring7Days[0].documentName).toBe("clearance");
  });
});

describe("dashboard.pipelineStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns pipeline statistics", async () => {
    const mockStats = {
      Intake: 5,
      Screening: 3,
      Documentation: 8,
      Verification: 2,
      Provisioning: 1,
      "Ready to Schedule": 4,
      Active: 10,
    };

    vi.mocked(db.getPipelineStats).mockResolvedValue(mockStats);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.pipelineStats();

    expect(result).toEqual(mockStats);
  });
});

describe("dashboard.pendingApprovals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns pending approvals list", async () => {
    const mockApprovals = [
      { id: 1, employeeId: 1, gateType: "HR_COMPLETENESS_REVIEW", status: "pending" },
      { id: 2, employeeId: 2, gateType: "CLEARANCES_VERIFICATION", status: "pending" },
    ];

    vi.mocked(db.getPendingApprovals).mockResolvedValue(mockApprovals);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.pendingApprovals();

    expect(result).toEqual(mockApprovals);
    expect(result).toHaveLength(2);
  });
});

describe("dashboard.openExceptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns open exceptions list", async () => {
    const mockExceptions = [
      { id: 1, employeeId: 1, issue: "Missing document", status: "open", owner: "HR" },
      { id: 2, employeeId: 2, issue: "Failed background check", status: "open", owner: null },
    ];

    vi.mocked(db.getOpenExceptions).mockResolvedValue(mockExceptions);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.openExceptions();

    expect(result).toEqual(mockExceptions);
    expect(result).toHaveLength(2);
  });
});
