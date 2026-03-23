import { vi, beforeAll, afterAll, beforeEach } from "vitest";
import { db, schema } from "@zexio/zms-core";
import { sql } from "drizzle-orm";

// 1. Global Setup
beforeAll(async () => {
  // Set Master Key for Cryptographic Operations in Test Mode
  process.env.MASTER_KEY = "0123456789abcdef0123456789abcdef"; // 32 chars
  (process.env as any).NODE_ENV = "test";
  
  if (!process.env.DATABASE_URL?.includes("test") && process.env.NODE_ENV !== "test") {
    // console.warn("DATABASE_URL might not be a test database. Proceeding with caution.");
  }
});

// 2. Clear state before each test
beforeEach(async () => {
  // SQLite specific cleanup
  const tables = [
    "audit_logs",
    "secrets",
    "services",
    "environments",
    "projects",
    "pending_onboarding",
    "user",
    "account",
    "session",
    "verification",
    "organization"
  ];

  try {
    await (db as any).run(sql.raw('PRAGMA foreign_keys = OFF'));
    for (const table of tables) {
      await (db as any).run(sql.raw(`DELETE FROM "${table}"`));
    }
    await (db as any).run(sql.raw('PRAGMA foreign_keys = ON'));
  } catch (e: any) {
    console.warn(`⚠️  Test Setup: Database cleanup failed: ${e.message}`);
  }
});

afterAll(async () => {
  // Close connections if needed (drizzle-orm/postgres-js handles this usually)
});
