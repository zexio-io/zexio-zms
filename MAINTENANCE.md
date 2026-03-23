# ZMS Maintenance & Deployment Guide

This document contains internal procedures for maintaining the ZMS monorepo, managing releases, and deploying the documentation hub.

## 🦋 Release Workflow (Changesets)

ZMS uses **Changesets** to manage semantic versioning and changelogs.

### 1. Record a Change
When you contribute a feature or fix, record it by running:
```bash
pnpm changeset
```
Follow the prompts to select packages and the bump type (patch, minor, or major).

### 2. Version and Release (Manual Backup)
To prepare a new release manually:
```bash
pnpm version-packages  # Consumes changesets and bumps versions
pnpm release           # Publishes to npm
```

---

## 🤖 CI/CD Release Workflow (GitHub Actions)

ZMS is configured with an automated release pipeline via GitHub Actions (`.github/workflows/release.yml`).

### How it Works:
1.  **Version PR**: When changes with changesets are merged into `main`, GitHub Actions will automatically create (or update) a **"Version Packages" Pull Request**.
2.  **Changelog**: This PR includes all version bumps and updated `CHANGELOG.md` files based on your changesets.
3.  **Automated Release**: When the **Version Packages PR** is merged into `main`, GitHub Actions will automatically:
    -   Publish the new versions to the npm registry.
    -   Create a GitHub Release with the corresponding changelog.

### Requirements:
-   **`NPM_TOKEN`**: Must be added to GitHub Repository Secrets for publishing.
-   **`GITHUB_TOKEN`**: Handled automatically by the action.

### Manual Trigger:
You can also trigger a release manually via the **GitHub Actions Tab > Release > Run Workflow** if needed.

---

## 🚀 Vercel Deployment (Docs Hub)

The documentation hub (`packages/docs`) is hosted on Vercel and mapped to `zms.zexio.io`.

### Vercel Project Settings
- **Root Directory**: `packages/docs`
- **Framework Preset**: Next.js
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`

### Ignored Build Step (Optimization)
To only trigger builds when relevant files change, use this command in Vercel settings:
```bash
git diff --quiet HEAD^ HEAD .
```

### ⚡ Preview vs Production
- **Preview Deployments**: Every Pull Request (including the automated "Version Packages" PR) will trigger a Vercel Preview. You can verify the documentation and changelog appearance before merging.
- **Production Deployment**: Merging to `main` triggers the official update to `zms.zexio.io`.

---

## 🏗️ Architecture Stack
- **API**: Hono + LibSQL
- **Dashboard**: Next.js 15
- **SDK**: Token-Only Auth Protocol
- **MCP**: SSE-based Agentic Bridge
