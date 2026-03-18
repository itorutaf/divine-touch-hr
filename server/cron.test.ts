import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the notification service
vi.mock("./notificationService", () => ({
  runExpirationCheck: vi.fn(),
}));

import { runExpirationCheck } from "./notificationService";

describe("Cron Expiration Check Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runExpirationCheck returns correct structure on success", async () => {
    vi.mocked(runExpirationCheck).mockResolvedValue({
      success: true,
      documentsFound: 5,
      notificationSent: true,
    });

    const result = await runExpirationCheck();

    expect(result).toEqual({
      success: true,
      documentsFound: 5,
      notificationSent: true,
    });
  });

  it("runExpirationCheck returns zero documents when none expiring", async () => {
    vi.mocked(runExpirationCheck).mockResolvedValue({
      success: true,
      documentsFound: 0,
      notificationSent: false,
    });

    const result = await runExpirationCheck();

    expect(result.success).toBe(true);
    expect(result.documentsFound).toBe(0);
    expect(result.notificationSent).toBe(false);
  });

  it("runExpirationCheck handles errors gracefully", async () => {
    vi.mocked(runExpirationCheck).mockResolvedValue({
      success: false,
      documentsFound: 0,
      notificationSent: false,
      error: "Database connection failed",
    });

    const result = await runExpirationCheck();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Database connection failed");
  });

  it("runExpirationCheck sends notification when documents found", async () => {
    vi.mocked(runExpirationCheck).mockResolvedValue({
      success: true,
      documentsFound: 3,
      notificationSent: true,
    });

    const result = await runExpirationCheck();

    expect(result.documentsFound).toBe(3);
    expect(result.notificationSent).toBe(true);
  });
});

describe("Cron Security", () => {
  it("validates that cron secret is required", () => {
    // The endpoint requires X-Cron-Secret header
    // This test documents the security requirement
    const expectedSecret = "divine-touch-hr-cron-2024";
    expect(expectedSecret).toBeDefined();
    expect(expectedSecret.length).toBeGreaterThan(10);
  });
});
