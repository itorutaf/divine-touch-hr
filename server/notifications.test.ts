import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Mock database functions
vi.mock("./db", () => ({
  getNotificationSettings: vi.fn().mockResolvedValue(null),
  upsertNotificationSettings: vi.fn().mockResolvedValue(undefined),
  getNotificationLogs: vi.fn().mockResolvedValue([]),
  createNotificationLog: vi.fn().mockResolvedValue({
    id: 1,
    notificationType: "daily_digest",
    sentAt: new Date(),
    status: "sent",
  }),
  getExpiringDocuments: vi.fn().mockResolvedValue([]),
  getExpiredDocumentsToday: vi.fn().mockResolvedValue([]),
  getHRUsers: vi.fn().mockResolvedValue([]),
}));

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
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

function createHRContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
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

describe("notifications router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSettings", () => {
    it("returns default settings when none exist", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.getSettings();

      expect(result).toBeDefined();
      expect(result.alertThreshold30Day).toBe(true);
      expect(result.alertThreshold14Day).toBe(true);
      expect(result.alertThreshold7Day).toBe(true);
      expect(result.alertThresholdExpired).toBe(true);
      expect(result.dailyDigest).toBe(true);
      expect(result.immediateAlerts).toBe(false);
    });

    it("rejects non-admin users", async () => {
      const ctx = createRegularUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.notifications.getSettings()).rejects.toThrow(
        "Admin access required"
      );
    });
  });

  describe("updateSettings", () => {
    it("allows admin to update settings", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.updateSettings({
        alertThreshold30Day: false,
        dailyDigest: false,
      });

      expect(result.success).toBe(true);
    });

    it("rejects non-admin users", async () => {
      const ctx = createHRContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.notifications.updateSettings({
          alertThreshold30Day: false,
        })
      ).rejects.toThrow("Admin access required");
    });
  });

  describe("getLogs", () => {
    it("returns empty array when no logs exist", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.getLogs({ limit: 10 });

      expect(result).toEqual([]);
    });

    it("rejects non-admin users", async () => {
      const ctx = createRegularUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.notifications.getLogs({ limit: 10 })).rejects.toThrow(
        "Admin access required"
      );
    });
  });

  describe("getExpirationSummary", () => {
    it("allows HR users to view expiration summary", async () => {
      const ctx = createHRContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.getExpirationSummary();

      expect(result).toBeDefined();
      expect(result.expired).toBe(0);
      expect(result.expiring7Day).toBe(0);
      expect(result.expiring14Day).toBe(0);
      expect(result.expiring30Day).toBe(0);
    });

    it("rejects regular users", async () => {
      const ctx = createRegularUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.notifications.getExpirationSummary()
      ).rejects.toThrow("HR or Admin access required");
    });
  });

  describe("runExpirationCheck", () => {
    it("allows admin to run expiration check", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.runExpirationCheck();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.documentsFound).toBe(0);
    });

    it("rejects non-admin users", async () => {
      const ctx = createHRContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.notifications.runExpirationCheck()
      ).rejects.toThrow("Admin access required");
    });
  });
});
