# ZMS: Zero-Trust Secrets for Agentic AI 🕵️‍♂️🤖

[![GitHub Stars](https://img.shields.io/github/stars/zexio-io/zexio-zms?style=for-the-badge)](https://github.com/zexio-io/zexio-zms/stargazers)
[![License](https://img.shields.io/badge/License-BSL%201.1-blue.svg?style=for-the-badge)](LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@zexio/zms-cli?style=for-the-badge)](https://www.npmjs.com/package/@zexio/zms-cli)

**ZMS (Zexio Secret Management System)** is a high-performance, open-source secret management ecosystem designed for the agentic age. It eliminates plaintext `.env` files and puts your infrastructure behind a cryptographic shield.

[Documentation](https://zms.zexio.io) | [Getting Started](https://zms.zexio.io/docs/getting-started) | [Discord](https://discord.gg/zexio) | [Twitter](https://twitter.com/zMS_zexio)

---

## 🚀 Why ZMS?

In the age of **Agentic AI**, traditional secret management is a liability. Storing sensitive keys in plaintext `.env` files exposes your infrastructure to every autonomous agent, CI/CD pipeline, and local process scanning your directories.

ZMS provides a **Zero-Trust** environment where secrets are injected directly into memory, never touching the disk as plaintext.

### 💎 The "WOW" Features
- **🛡️ Blind Indexing**: Search for secrets without the core ever seeing the plaintext key name.
- **🤖 MCP Native**: Native Model Context Protocol (MCP) server for Claude, GPT-4, and Cursor.
- **🗝️ Shamir's Recovery**: Split your master key into 5 shards. Reconstruct only when needed.
- **🚀 The Bootstrap Pattern**: One `ZMS_TOKEN` to rule them all. Zero secrets in your codebase.

---
## 💎 ZMS Ecosystem
| Feature | Community Edition (OSS) | ZMS Cloud (Enterprise) |
| :--- | :---: | :---: |
| **AES-256 GCM Encryption** | ✅ | ✅ |
| **Local Master Key Recovery** | ✅ | ✅ |
| **MCP AI Tools** | ✅ | ✅ |
| **Multi-Region Replication** | ❌ | ✅ |
| **Advanced RBAC & Teams** | ❌ | ✅ |
| **SSO & Audit Logs (SIEM)** | ❌ | ✅ |

---

## ⚡ Quickstart (60 Seconds)

```bash
# 1. Install CLI
npm i -g @zexio/zms-cli

# 2. Setup Vault
zms init

# 3. Launch Engine
zms start
```
*Open `http://localhost:3030` to enter your high-performance vault.*

---

## 🤖 AI Agent Integration (MCP)
ZMS is the first vault built specifically to prevent **Agentic Hallucination** of secrets. AI agents can list, manage, and verify secrets via the MCP protocol securely, without ever seeing the plaintext values (Agent Isolation).

> [!IMPORTANT]  
> **Shift to Zero-Trust**: Upload your plaintext `.env` files to encrypted ZMS to ensure your AI agents never have access to sensitive keys on disk.

For step-by-step guides on connecting ZMS to Claude Desktop, Cursor, and other AI tools, please refer to our **[Agentic MCP Guide](https://zms.zexio.io/docs/agentic-mcp)**.

---

## 🏗️ Technical Stack
- **API**: Hono & Node.js (Ultra Fast)
- **DB**: Drizzle ORM + LibSQL (Local-First)
- **UI**: Next.js 15 & Framer Motion (Premium Feel)
- **Security**: Web Crypto AEAD (Standard Compliant)

---

## 🛡️ License
ZMS is licensed under the **Business Source License 1.1 (BSL-1.1)**. It is free for individuals and internal production use. You may not offer ZMS as a managed service to third parties.

---
<p align="center">Built with 💎 by <b>Zexio.io</b></p>
