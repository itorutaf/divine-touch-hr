import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Scheduled expiration check API (called by cron job)
  app.post("/api/cron/expiration-check", async (req, res) => {
    try {
      // Verify cron secret for security
      const cronSecret = req.headers["x-cron-secret"];
      const expectedSecret = process.env.CRON_SECRET || "divine-touch-hr-cron-2024";
      
      if (cronSecret !== expectedSecret) {
        console.log("[Cron] Unauthorized expiration check attempt");
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Import and run the expiration check
      const { runExpirationCheck } = await import("../notificationService");
      const result = await runExpirationCheck();
      
      console.log(`[Cron] Expiration check completed: ${result.documentsFound} documents found, notification sent: ${result.notificationSent}`);
      
      res.json({
        success: result.success,
        documentsFound: result.documentsFound,
        notificationSent: result.notificationSent,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Cron] Expiration check error:", error);
      res.status(500).json({ error: "Expiration check failed" });
    }
  });

  // Scheduled timesheet reminder check API (called by cron job)
  app.post("/api/cron/timesheet-reminder", async (req, res) => {
    try {
      // Verify cron secret for security
      const cronSecret = req.headers["x-cron-secret"];
      const expectedSecret = process.env.CRON_SECRET || "divine-touch-hr-cron-2024";
      
      if (cronSecret !== expectedSecret) {
        console.log("[Cron] Unauthorized timesheet reminder attempt");
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Import and run the timesheet reminder check
      const { runTimesheetReminderCheck } = await import("../timesheetNotificationService");
      const result = await runTimesheetReminderCheck();
      
      console.log(`[Cron] Timesheet reminder completed: ${result.employeesNotified} employees notified, notification sent: ${result.notificationSent}`);
      
      res.json({
        success: result.success,
        employeesNotified: result.employeesNotified,
        notificationSent: result.notificationSent,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Cron] Timesheet reminder error:", error);
      res.status(500).json({ error: "Timesheet reminder check failed" });
    }
  });

  // File upload API
  app.post("/api/upload", async (req, res) => {
    try {
      const { fileName, fileData, mimeType } = req.body;
      
      if (!fileName || !fileData || !mimeType) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Import storage helper
      const { storagePut } = await import("../storage");
      
      // Convert base64 to buffer
      const buffer = Buffer.from(fileData, "base64");
      
      // Upload to S3
      const result = await storagePut(fileName, buffer, mimeType);
      
      res.json(result);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
