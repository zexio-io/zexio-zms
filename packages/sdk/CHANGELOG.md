# @zexio/zms-sdk

## 1.3.0

### Minor Changes

- eb79fdf: Automated Release: Transition to Pure Hono & Ultra-Lean Infrastructure (v1.1.0).
  - Nuclear refactor to Pure Hono (removed OpenAPI/Scalar bloat).
  - Purged heavy Cloud KMS SDKs for lean LocalFile distribution.
  - Hardened atomic onboarding flow and dashboard context navigation.

## 1.2.0

### Minor Changes

- c0f4161: Automated Release: Transition to Pure Hono & Ultra-Lean Infrastructure (v1.1.0).
  - Nuclear refactor to Pure Hono (removed OpenAPI/Scalar bloat).
  - Purged heavy Cloud KMS SDKs for lean LocalFile distribution.
  - Hardened atomic onboarding flow and dashboard context navigation.

## 1.1.0

### Minor Changes

- Refactor API to Pure Hono for maximum performance and minimum footprint.
  - Removed @hono/zod-openapi and Scalar SDK dependencies.
  - Migrated all routes to standard Hono with zValidator.
  - Purged cloud KMS SDKs (AWS/GCP) from core for ultra-lean distribution.
  - Hardened onboarding flow with atomic transactions.

## 1.0.1

### Patch Changes

- 0393c57: fix: resolve CI permission issues (test.db) and align marketing docs with implementation. Sync core suite to 1.1.0-hardening.

## 1.0.0

### Patch Changes

- Initial official release of the ZMS ecosystem. Includes Zero-Trust Vault, CLI, Agentic MCP Bridge, and Documentation Hub.
