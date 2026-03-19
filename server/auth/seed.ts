/**
 * CareBase Dev Seed Script
 * Creates an admin user for local development.
 * Run: npx tsx server/auth/seed.ts
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./authService";
import { nanoid } from "nanoid";

async function seed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set. Create a .env file with your MySQL connection string.");
    process.exit(1);
  }

  const db = drizzle(dbUrl);

  const email = "admin@carebase.dev";
  const password = "admin123";
  const name = "CareBase Admin";

  // Check if user already exists
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    console.log(`Admin user already exists (id: ${existing[0].id}, email: ${email})`);
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);

  await db.insert(users).values({
    openId: nanoid(),
    email,
    name,
    password: passwordHash,
    loginMethod: "email",
    role: "admin",
    lastSignedIn: new Date(),
  });

  console.log("Seed complete:");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Role:     admin`);
  console.log("");
  console.log("You can now log in at /login");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
