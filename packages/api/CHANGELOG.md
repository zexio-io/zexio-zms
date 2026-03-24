# @zexio/zms-api

## 1.1.0

### Minor Changes

- Refactor API to Pure Hono for maximum performance and minimum footprint.
  - Removed @hono/zod-openapi and Scalar SDK dependencies.
  - Migrated all routes to standard Hono with zValidator.
  - Purged cloud KMS SDKs (AWS/GCP) from core for ultra-lean distribution.
  - Hardened onboarding flow with atomic transactions.

### Patch Changes

- Updated dependencies
  - @zexio/zms-core@1.1.0

## 1.0.1

### Patch Changes

- 0393c57: fix: resolve CI permission issues (test.db) and align marketing docs with implementation. Sync core suite to 1.1.0-hardening.
- Updated dependencies [0393c57]
  - @zexio/zms-core@1.0.1

## 1.0.0

### Patch Changes

- Initial official release of the ZMS ecosystem. Includes Zero-Trust Vault, CLI, Agentic MCP Bridge, and Documentation Hub.
- Updated dependencies
  - @zexio/zms-core@1.0.0
