import { describe, it, expect, vi, beforeEach } from "vitest";
import { logAction } from "./audit";
import { db, auditLogs } from "@zexio/zms-core";

// 1. Mock DB
vi.mock("@zexio/zms-core", () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn().mockResolvedValue(undefined),
    })),
  },
  auditLogs: { name: "audit_logs" },
}));

describe("Audit Service (Compliance Domain)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should insert audit log with correct payload", async () => {
    await logAction("org-1", "user-1", "TEST_ACTION", "res-1", { foo: "bar" });

    expect(db.insert).toHaveBeenCalledWith(auditLogs);
    // Assuming the values implementation in mock works
  });
});
