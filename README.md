<h1 align="center">ZMS: Zero-Trust Secrets for Agentic AI</h1>

<p align="center">
  <strong>The Open-Source Secret Manager for the Agentic Era.</strong><br/>
  Eliminate plaintext <code>.env</code> files. Secure your infrastructure with the Bootstrap Pattern.
</p>

<p align="center">
  <a href="https://zms.zexio.io">Documentation</a> •
  <a href="#key-features">Features</a> •
  <a href="#quickstart">Quickstart</a> •
  <a href="#architecture">Architecture</a> •
  <a href="https://github.com/zexio-io/zexio-zms/issues">Support</a>
</p>

---

## 🚀 Why ZMS?

In the age of **Agentic AI**, traditional secret management is a liability. Storing sensitive keys in plaintext `.env` files exposes your infrastructure to every autonomous agent, CI/CD pipeline, and local process scanning your directories.

**ZMS (Zexio Managed Secrets)** provides a cryptographic shield for your secrets. It is built for engineering teams who demand **Zero-Trust** security without the complexity of traditional enterprise vaults.

**Agentic-First.** **Zero-Trust Logic.** **Bootstrap Native.**

## ✨ Key Features

- **🛡️ Zero-Trust Architecture**: Secrets are never stored in plaintext. AES-256 encryption at rest and AEAD protocols ensure even the core logic cannot "see" your raw data.
- **🤖 Agentic MCP Native**: Built-in Model Context Protocol (MCP) bridge. Empower your AI Agents (GPT-4o, Claude, etc.) to orchestrate secrets securely without disk exposure.
- **🚀 The Bootstrap Pattern**: Replace hundreds of sensitive environment variables with a single, scoped `ZMS_TOKEN`. 
- **💎 Premium Dashboard**: A high-performance, hardware-accelerated UI that makes security management intuitive and beautiful.
- **🗝️ Automated Master Keys**: Local, hardware-bound master key management ensures you retain absolute control over your vault.

## ⚡ Quickstart

Get your secure vault running in under **30 seconds**.

```bash
# 1. Install the ZMS CLI globally
npm i -g @zexio/zms-cli

# 2. Initialize your local environment (Generates Master Keys)
zms init

# 3. Launch the Unified Engine & Dashboard
zms start
```

Navigate to [http://localhost:3030](http://localhost:3030) to access the ZMS Dashboard.

## 🛡️ The Bootstrap Pattern

ZMS solves the **"Last Secret"** problem by reducing your attack surface to exactly **one** variable: `ZMS_TOKEN`.

### ❌ Traditional Way (Vulnerable)
Multiple plaintext secrets sit in a `.env.local` file. If an AI agent or a malicious script leaks this file, your infrastructure is compromised.

### ✅ The ZMS Way (Secure)
1.  **Vault Everything**: Move all project secrets into the ZMS Vault.
2.  **Generate Token**: Issue a single, scoped `ZMS_TOKEN` for your service.
3.  **Bootstrap**: Use the ZMS runner to inject secrets directly into volatile memory:

```bash
zms run -- node server.js
```

**Result**: Zero secrets on disk. Volatile memory injection only. Immediate revocation (Kill Switch) available.

## 🤖 Agentic Integration (MCP)

Connect your favorite AI Agents (Claude Desktop, Cursor, etc.) to the ZMS Vault using the **Model Context Protocol (SSE)**:

```json
{
  "mcpServers": {
    "zms": {
      "type": "sse",
      "url": "http://localhost:3030/mcp",
      "headers": {
        "Authorization": "Bearer your_mcp_token_here"
      }
    }
  }
}
```

Learn more about orchestrating secrets in our [Agentic MCP Guide](https://zms.zexio.io/docs/agentic-mcp).

## 🏗️ Technical Stack

- **Core**: TypeScript, Hono (Edge-ready High-Performance API)
- **Database**: Drizzle ORM + LibSQL
- **Security**: Web Crypto API (AES-256-GCM / PBKDF2)
- **UI**: Next.js 15, Framer Motion, OKLCH Color Spaces

## 🛡️ License

ZMS is released under the **Business Source License 1.1 (BSL-1.1)**. 

You are free to use, modify, and distribute ZMS for internal and production use within your organization. The only restriction is that you may not offer ZMS as a competing managed service (SaaS) to third parties. This license will automatically convert to **Apache License 2.0** on **January 1st, 2030**.

---

<p align="center">
  <i>Built for the future of Agentic-First and Zero-Trust infrastructure by <b>Zexio.io</b></i>
</p>
