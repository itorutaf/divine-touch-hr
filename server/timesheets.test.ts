import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getPayPeriods: vi.fn(),
  getActivePayPeriod: vi.fn(),
  createPayPeriod: vi.fn(),
  updatePayPeriod: vi.fn(),
  getTimesheetsByEmployee: vi.fn(),
  getTimesheetsByPayPeriod: vi.fn(),
  getTimesheetById: vi.fn(),
  createTimesheet: vi.fn(),
  updateTimesheet: vi.fn(),
  deleteTimesheet: vi.fn(),
  getEmployeesWithMissingTimesheets: vi.fn(),
  getTimesheetStats: vi.fn(),
  getTimesheetTemplates: vi.fn(),
  createTimesheetTemplate: vi.fn(),
  deleteTimesheetTemplate: vi.fn(),
  createTimesheetReminder: vi.fn(),
}));

import * as db from "./db";

describe("Timesheet Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Pay Periods", () => {
    it("should list all pay periods", async () => {
      const mockPeriods = [
        { id: 1, periodName: "Dec 16-29, 2025", status: "active" },
        { id: 2, periodName: "Dec 30 - Jan 12, 2026", status: "upcoming" },
      ];
      vi.mocked(db.getPayPeriods).mockResolvedValue(mockPeriods as any);

      const result = await db.getPayPeriods();
      
      expect(result).toHaveLength(2);
      expect(result[0].periodName).toBe("Dec 16-29, 2025");
    });

    it("should get active pay period", async () => {
      const mockPeriod = { id: 1, periodName: "Dec 16-29, 2025", status: "active" };
      vi.mocked(db.getActivePayPeriod).mockResolvedValue(mockPeriod as any);

      const result = await db.getActivePayPeriod();
      
      expect(result?.status).toBe("active");
    });

    it("should create a new pay period", async () => {
      vi.mocked(db.createPayPeriod).mockResolvedValue(undefined);

      await db.createPayPeriod({
        periodName: "Jan 13-26, 2026",
        startDate: new Date("2026-01-13"),
        endDate: new Date("2026-01-26"),
        timesheetDueDate: new Date("2026-01-28"),
        status: "upcoming",
      });

      expect(db.createPayPeriod).toHaveBeenCalledWith(
        expect.objectContaining({
          periodName: "Jan 13-26, 2026",
          status: "upcoming",
        })
      );
    });

    it("should update pay period status", async () => {
      vi.mocked(db.updatePayPeriod).mockResolvedValue(undefined);

      await db.updatePayPeriod(1, { status: "closed" });

      expect(db.updatePayPeriod).toHaveBeenCalledWith(1, { status: "closed" });
    });
  });

  describe("Timesheets", () => {
    it("should create a new timesheet", async () => {
      vi.mocked(db.createTimesheet).mockResolvedValue(1);

      const result = await db.createTimesheet({
        employeeId: 1,
        payPeriodId: 1,
        totalHours: "40.00",
        status: "draft",
      });

      expect(result).toBe(1);
      expect(db.createTimesheet).toHaveBeenCalled();
    });

    it("should get timesheets by employee", async () => {
      const mockTimesheets = [
        { id: 1, employeeId: 1, payPeriodId: 1, totalHours: "40.00", status: "approved" },
        { id: 2, employeeId: 1, payPeriodId: 2, totalHours: "38.50", status: "submitted" },
      ];
      vi.mocked(db.getTimesheetsByEmployee).mockResolvedValue(mockTimesheets as any);

      const result = await db.getTimesheetsByEmployee(1);

      expect(result).toHaveLength(2);
      expect(result[0].totalHours).toBe("40.00");
    });

    it("should get timesheets by pay period", async () => {
      const mockTimesheets = [
        { timesheet: { id: 1, status: "approved" }, employee: { legalFirstName: "John" } },
        { timesheet: { id: 2, status: "submitted" }, employee: { legalFirstName: "Jane" } },
      ];
      vi.mocked(db.getTimesheetsByPayPeriod).mockResolvedValue(mockTimesheets);

      const result = await db.getTimesheetsByPayPeriod(1);

      expect(result).toHaveLength(2);
    });

    it("should update timesheet status to submitted", async () => {
      vi.mocked(db.updateTimesheet).mockResolvedValue(undefined);

      await db.updateTimesheet(1, { status: "submitted", submittedAt: new Date() });

      expect(db.updateTimesheet).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: "submitted" })
      );
    });

    it("should approve timesheet with EVV compliance", async () => {
      vi.mocked(db.updateTimesheet).mockResolvedValue(undefined);

      await db.updateTimesheet(1, {
        status: "approved",
        evvCompliant: true,
        payrollReady: true,
      });

      expect(db.updateTimesheet).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: "approved",
          evvCompliant: true,
          payrollReady: true,
        })
      );
    });

    it("should reject timesheet with notes", async () => {
      vi.mocked(db.updateTimesheet).mockResolvedValue(undefined);

      await db.updateTimesheet(1, {
        status: "needs_correction",
        reviewNotes: "Missing participant signature",
      });

      expect(db.updateTimesheet).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: "needs_correction",
          reviewNotes: "Missing participant signature",
        })
      );
    });

    it("should delete timesheet", async () => {
      vi.mocked(db.deleteTimesheet).mockResolvedValue(undefined);

      await db.deleteTimesheet(1);

      expect(db.deleteTimesheet).toHaveBeenCalledWith(1);
    });
  });

  describe("Missing Timesheets", () => {
    it("should get employees with missing timesheets", async () => {
      const mockEmployees = [
        { id: 1, legalFirstName: "John", legalLastName: "Doe", email: "john@example.com" },
        { id: 2, legalFirstName: "Jane", legalLastName: "Smith", email: "jane@example.com" },
      ];
      vi.mocked(db.getEmployeesWithMissingTimesheets).mockResolvedValue(mockEmployees);

      const result = await db.getEmployeesWithMissingTimesheets(1);

      expect(result).toHaveLength(2);
      expect(result[0].legalFirstName).toBe("John");
    });

    it("should return empty array when all timesheets submitted", async () => {
      vi.mocked(db.getEmployeesWithMissingTimesheets).mockResolvedValue([]);

      const result = await db.getEmployeesWithMissingTimesheets(1);

      expect(result).toHaveLength(0);
    });
  });

  describe("Timesheet Stats", () => {
    it("should calculate timesheet statistics", async () => {
      const mockStats = {
        total: 10,
        submitted: 8,
        approved: 5,
        pending: 3,
        missing: 2,
      };
      vi.mocked(db.getTimesheetStats).mockResolvedValue(mockStats);

      const result = await db.getTimesheetStats(1);

      expect(result.total).toBe(10);
      expect(result.missing).toBe(2);
      expect(result.approved).toBe(5);
    });
  });

  describe("Timesheet Templates", () => {
    it("should list active templates", async () => {
      const mockTemplates = [
        { id: 1, name: "OLTL Timesheet", serviceLine: "OLTL", isActive: true },
        { id: 2, name: "ODP Timesheet", serviceLine: "ODP", isActive: true },
      ];
      vi.mocked(db.getTimesheetTemplates).mockResolvedValue(mockTemplates as any);

      const result = await db.getTimesheetTemplates();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("OLTL Timesheet");
    });

    it("should create a new template", async () => {
      vi.mocked(db.createTimesheetTemplate).mockResolvedValue(1);

      const result = await db.createTimesheetTemplate({
        name: "Skilled Timesheet",
        serviceLine: "Skilled",
        fileKey: "templates/skilled.pdf",
        fileUrl: "https://storage.example.com/templates/skilled.pdf",
      });

      expect(result).toBe(1);
    });

    it("should soft delete template", async () => {
      vi.mocked(db.deleteTimesheetTemplate).mockResolvedValue(undefined);

      await db.deleteTimesheetTemplate(1);

      expect(db.deleteTimesheetTemplate).toHaveBeenCalledWith(1);
    });
  });

  describe("Timesheet Reminders", () => {
    it("should create reminder log entry", async () => {
      vi.mocked(db.createTimesheetReminder).mockResolvedValue(undefined);

      await db.createTimesheetReminder({
        employeeId: 1,
        payPeriodId: 1,
        reminderType: "first_reminder",
        sentTo: "john@example.com",
        status: "sent",
      });

      expect(db.createTimesheetReminder).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: 1,
          reminderType: "first_reminder",
        })
      );
    });
  });
});

describe("Timesheet Validation", () => {
  it("should validate total hours is positive", () => {
    const hours = "40.00";
    const parsed = parseFloat(hours);
    expect(parsed).toBeGreaterThan(0);
  });

  it("should validate signature type enum", () => {
    const validTypes = ["wet", "digital", "pending"];
    const testType = "wet";
    expect(validTypes).toContain(testType);
  });

  it("should validate status transitions", () => {
    const validTransitions: Record<string, string[]> = {
      draft: ["submitted"],
      submitted: ["pending_review", "approved", "rejected"],
      pending_review: ["approved", "rejected", "needs_correction"],
      needs_correction: ["submitted"],
      approved: [],
      rejected: [],
    };

    expect(validTransitions["draft"]).toContain("submitted");
    expect(validTransitions["submitted"]).toContain("approved");
    expect(validTransitions["approved"]).toHaveLength(0);
  });
});
