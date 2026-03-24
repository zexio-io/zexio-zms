import { describe, it, expect } from "vitest";
import app from "../src/index";
import { db, schema } from "@zexio/zms-core";
import { eq } from "drizzle-orm";

describe("Auth & Onboarding Lifecycle (Integration Journey)", () => {
  const testUser = {
    name: "Tactical Admin",
    email: "admin@zexio.test",
    password: "secure-password-123"
  };

  it("should complete the full admin journey: setup -> lockout -> login -> session", async () => {
    // 1. Block access to protected routes
    const initialRes = await app.request("/v1/orgs", { method: "GET" });
    expect(initialRes.status).toBe(401);

    // 2. Perform initial system setup
    const setupRes = await app.request("/v1/auth/setup", {
      method: "POST",
      body: JSON.stringify(testUser),
      headers: { "Content-Type": "application/json" }
    });

    const setupData = await setupRes.json();
    expect(setupRes.status).toBe(201);
    expect(setupData.user.email).toBe(testUser.email);
    expect(setupData.token).toBeDefined();
    
    const authToken = setupData.token;

    // 3. Verify duplicate setup is blocked (Lockout)
    const duplicateRes = await app.request("/v1/auth/setup", {
      method: "POST",
      body: JSON.stringify(testUser),
      headers: { "Content-Type": "application/json" }
    });
    expect(duplicateRes.status).toBe(403);

    // 4. Perform Login
    const loginRes = await app.request("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      }),
      headers: { "Content-Type": "application/json" }
    });

    const loginData = await loginRes.json();
    expect(loginRes.status).toBe(200);
    expect(loginData.token).toBeDefined();

    // 5. Verify Session with Login Token
    const sessionRes = await app.request("/v1/auth/session", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${loginData.token}`
      }
    });

    const sessionData = await sessionRes.json();
    expect(sessionRes.status).toBe(200);
    expect(sessionData.user.email).toBe(testUser.email);

    // 6. Verify Session with Setup Token (Original)
    const sessionResOriginal = await app.request("/v1/auth/session", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${authToken}`
      }
    });
    expect(sessionResOriginal.status).toBe(200);
  });
});
