import { describe, it, expect, beforeEach } from "vitest";
import app from "../src/index";
import { db, schema } from "@zexio/zms-core";

describe("MCP Protocol & AI Agent Hub (Integration)", () => {
  const testUser = {
    name: "Architect",
    email: "architect@zexio.test",
    password: "secure-password-123"
  };

  let authToken: string;
  let orgId: string;
  let mcpToken: string;

  beforeEach(async () => {
    // 1. Setup system
    const setupRes = await app.request("/v1/auth/setup", {
      method: "POST",
      body: JSON.stringify(testUser),
      headers: { "Content-Type": "application/json" }
    });
    const setupData = await setupRes.json();
    authToken = setupData.token;

    // 2. Get Org
    const orgsRes = await app.request("/v1/orgs", {
      method: "GET",
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    const orgsData = await orgsRes.json();
    orgId = orgsData.data[0].id;

    // 3. Generate MCP Token
    const mcpRes = await app.request(`/v1/orgs/${orgId}/mcp-tokens`, {
      method: "POST",
      body: JSON.stringify({ name: "Cursor AI" }),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      }
    });
    const mcpData = await mcpRes.json();
    mcpToken = mcpData.token;
  });

  it("should authenticate and initialize an MCP session via GET /mcp/", async () => {
    // Note: The MCP SDK uses POST/GET combinations. 
    // Here we test the basic token validation on the MCP endpoint.
    const res = await app.request(`/mcp/?token=${mcpToken}`, {
      method: "GET",
      headers: {
        "Accept": "text/event-stream"
      }
    });

    // The GET request on /mcp is usually for SSE initialization.
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
  });

  it("should block MCP access with invalid token", async () => {
    const res = await app.request("/mcp/?token=invalid-logic", {
      method: "GET",
      headers: {
        "Accept": "text/event-stream"
      }
    });
    expect(res.status).toBe(401);
  });

  it("should list projects via MCP tool call simulation (Connection check only)", async () => {
    // Testing that a POST with valid token reaches the transport (even if transport rejects w/o session)
    const res = await app.request(`/mcp/?token=${mcpToken}`, {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "list_projects", arguments: {} }
      }),
      headers: { 
        "Content-Type": "application/json"
      }
    });

    // 406 or 200 is acceptable here as long as it's not 401 (Auth works)
    expect(res.status).not.toBe(401);
  });
});
