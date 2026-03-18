import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createHRContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "hr-user",
    email: "hr@example.com",
    name: "HR User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createRegularUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
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
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("payroll router", () => {
  describe("getReportData", () => {
    it("allows HR users to get payroll report data", async () => {
      const ctx = createHRContext();
      const caller = appRouter.createCaller(ctx);
      
      // Should not throw - returns empty array if no data
      const result = await caller.payroll.getReportData({ payPeriodId: 1 });
      expect(Array.isArray(result)).toBe(true);
    });

    it("rejects regular users from accessing payroll data", async () => {
      const ctx = createRegularUserContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.payroll.getReportData({ payPeriodId: 1 })
      ).rejects.toThrow();
    });
  });

  describe("getSummary", () => {
    it("allows HR users to get payroll summary", async () => {
      const ctx = createHRContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.payroll.getSummary({ payPeriodId: 1 });
      expect(result).toHaveProperty("employeeCount");
      expect(result).toHaveProperty("timesheetCount");
      expect(result).toHaveProperty("totalHours");
    });

    it("returns default values when no data exists", async () => {
      const ctx = createHRContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.payroll.getSummary({ payPeriodId: 999 });
      expect(result.employeeCount).toBe(0);
      expect(result.timesheetCount).toBe(0);
      expect(result.totalHours).toBe("0.00");
    });
  });

  describe("generateCSV", () => {
    it("allows HR users to generate CSV", async () => {
      const ctx = createHRContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.payroll.generateCSV({ payPeriodId: 1 });
      // Should return error when no approved timesheets
      expect(result).toHaveProperty("success");
    });

    it("rejects regular users from generating CSV", async () => {
      const ctx = createRegularUserContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.payroll.generateCSV({ payPeriodId: 1 })
      ).rejects.toThrow();
    });

    it("returns error when no approved timesheets exist", async () => {
      const ctx = createHRContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.payroll.generateCSV({ payPeriodId: 999 });
      expect(result.success).toBe(false);
      expect(result.error).toContain("No approved timesheets");
    });
  });
});

describe("CSV generation logic", () => {
  it("properly escapes CSV values with commas", () => {
    const escapeCSV = (val: string | number | boolean) => {
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    expect(escapeCSV("Hello, World")).toBe('"Hello, World"');
    expect(escapeCSV('Say "Hello"')).toBe('"Say ""Hello"""');
    expect(escapeCSV("Line1\nLine2")).toBe('"Line1\nLine2"');
    expect(escapeCSV("Normal")).toBe("Normal");
    expect(escapeCSV(123)).toBe("123");
    expect(escapeCSV(true)).toBe("true");
  });
});
