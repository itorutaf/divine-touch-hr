import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { authenticateRequest } from "../auth/authService";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

/** Mock admin user for development without a database */
const DEV_MOCK_USER: User = {
  id: 1,
  openId: "dev-admin",
  name: "CareBase Admin",
  email: "admin@carebase.dev",
  password: null,
  loginMethod: "email",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const useDevMock = !process.env.DATABASE_URL && process.env.NODE_ENV !== "production";

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  if (useDevMock) {
    // No database — return mock admin user for UI development
    user = DEV_MOCK_USER;
  } else {
    try {
      user = await authenticateRequest(opts.req);
    } catch {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
