import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  getAllEmployees: vi.fn().mockResolvedValue([]),
  getEmployeeById: vi.fn().mockResolvedValue(null),
  getEmployeeByEmployeeId: vi.fn().mockResolvedValue(null),
  createEmployee: vi.fn().mockImplementation((data) => ({
    id: 1,
    employeeId: "EMP-2024-0001",
    ...data,
    currentPhase: "Intake",
    status: "Pending Review",
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  updateEmployee: vi.fn().mockResolvedValue(undefined),
  deleteEmployee: vi.fn().mockResolvedValue(undefined),
  searchEmployees: vi.fn().mockResolvedValue([]),
  getEmployeesByPhase: vi.fn().mockResolvedValue([]),
  getEmployeesByStatus: vi.fn().mockResolvedValue([]),
  getEmployeesWithExceptions: vi.fn().mockResolvedValue([]),
  getPipelineStats: vi.fn().mockResolvedValue({
    Intake: 5,
    Screening: 3,
    Documentation: 2,
    Verification: 1,
    Provisioning: 0,
    "Ready to Schedule": 0,
    Active: 10,
  }),
  getPendingApprovals: vi.fn().mockResolvedValue([]),
  getOpenExceptions: vi.fn().mockResolvedValue([]),
  getGateApprovalsForEmployee: vi.fn().mockResolvedValue([]),
  getGateApprovalByType: vi.fn().mockResolvedValue(null),
  createGateApproval: vi.fn().mockResolvedValue({ id: 1 }),
  updateGateApproval: vi.fn().mockResolvedValue(undefined),
  createAuditLog: vi.fn().mockResolvedValue(undefined),
  getAuditLogsForEmployee: vi.fn().mockResolvedValue([]),
  getExceptionsForEmployee: vi.fn().mockResolvedValue([]),
  createException: vi.fn().mockResolvedValue({ id: 1 }),
  updateException: vi.fn().mockResolvedValue(undefined),
  getAllUsers: vi.fn().mockResolvedValue([]),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  getRoleMatrix: vi.fn().mockResolvedValue([]),
  getRoleRequirements: vi.fn().mockResolvedValue(null),
  upsertRoleMatrix: vi.fn().mockResolvedValue(undefined),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(role: "user" | "admin" | "hr" | "supervisor" | "compliance" = "admin"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
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

describe("employees router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("employees.list", () => {
    it("returns empty array when no employees exist", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.employees.list();

      expect(result).toEqual([]);
    });
  });

  describe("employees.create", () => {
    it("creates an employee with HR role", async () => {
      const ctx = createMockContext("hr");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.employees.create({
        legalFirstName: "John",
        legalLastName: "Doe",
        email: "john.doe@example.com",
        serviceLine: "OLTL",
      });

      expect(result).toMatchObject({
        id: 1,
        employeeId: "EMP-2024-0001",
        legalFirstName: "John",
        legalLastName: "Doe",
      });
    });

    it("creates an employee with admin role", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.employees.create({
        legalFirstName: "Jane",
        legalLastName: "Smith",
      });

      expect(result).toMatchObject({
        id: 1,
        legalFirstName: "Jane",
        legalLastName: "Smith",
      });
    });

    it("rejects employee creation for regular user role", async () => {
      const ctx = createMockContext("user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.employees.create({
          legalFirstName: "Test",
          legalLastName: "User",
        })
      ).rejects.toThrow("HR or Admin access required");
    });

    it("rejects employee creation for supervisor role", async () => {
      const ctx = createMockContext("supervisor");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.employees.create({
          legalFirstName: "Test",
          legalLastName: "User",
        })
      ).rejects.toThrow("HR or Admin access required");
    });
  });

  describe("employees.delete", () => {
    it("allows admin to delete employees", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.employees.delete({ id: 1 });

      expect(result).toEqual({ success: true });
    });

    it("rejects deletion for HR role", async () => {
      const ctx = createMockContext("hr");
      const caller = appRouter.createCaller(ctx);

      await expect(caller.employees.delete({ id: 1 })).rejects.toThrow(
        "Admin access required"
      );
    });
  });
});

describe("dashboard router", () => {
  it("returns pipeline stats", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.pipelineStats();

    expect(result).toMatchObject({
      Intake: 5,
      Screening: 3,
      Active: 10,
    });
  });

  it("returns pending approvals", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.pendingApprovals();

    expect(result).toEqual([]);
  });

  it("returns open exceptions", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.openExceptions();

    expect(result).toEqual([]);
  });
});

describe("gates router", () => {
  describe("gates.approve", () => {
    it("allows HR to approve HR_COMPLETENESS_REVIEW gate", async () => {
      const ctx = createMockContext("hr");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.gates.approve({
        employeeId: 1,
        gateType: "HR_COMPLETENESS_REVIEW",
        status: "Approved",
        notes: "All documents complete",
      });

      expect(result).toEqual({ success: true });
    });

    it("allows admin to approve any gate", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.gates.approve({
        employeeId: 1,
        gateType: "SUPERVISOR_READY_SIGNOFF",
        status: "Approved",
      });

      expect(result).toEqual({ success: true });
    });

    it("allows supervisor to approve SUPERVISOR_READY_SIGNOFF gate", async () => {
      const ctx = createMockContext("supervisor");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.gates.approve({
        employeeId: 1,
        gateType: "SUPERVISOR_READY_SIGNOFF",
        status: "Approved",
      });

      expect(result).toEqual({ success: true });
    });

    it("rejects supervisor from approving HR gates", async () => {
      const ctx = createMockContext("supervisor");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.gates.approve({
          employeeId: 1,
          gateType: "HR_COMPLETENESS_REVIEW",
          status: "Approved",
        })
      ).rejects.toThrow("You don't have permission to approve HR_COMPLETENESS_REVIEW");
    });

    it("allows compliance to approve CLEARANCES_VERIFICATION gate", async () => {
      const ctx = createMockContext("compliance");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.gates.approve({
        employeeId: 1,
        gateType: "CLEARANCES_VERIFICATION",
        status: "Approved",
      });

      expect(result).toEqual({ success: true });
    });

    it("rejects regular user from approving any gate", async () => {
      const ctx = createMockContext("user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.gates.approve({
          employeeId: 1,
          gateType: "HR_COMPLETENESS_REVIEW",
          status: "Approved",
        })
      ).rejects.toThrow();
    });
  });
});

describe("users router", () => {
  describe("users.updateRole", () => {
    it("allows admin to update user roles", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.users.updateRole({
        userId: 2,
        role: "hr",
      });

      expect(result).toEqual({ success: true });
    });

    it("rejects role updates from non-admin users", async () => {
      const ctx = createMockContext("hr");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.users.updateRole({
          userId: 2,
          role: "admin",
        })
      ).rejects.toThrow("Admin access required");
    });
  });
});

describe("auth router", () => {
  it("returns current user from auth.me", async () => {
    const ctx = createMockContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toMatchObject({
      id: 1,
      email: "test@example.com",
      role: "admin",
    });
  });

  it("clears cookie on logout", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});
