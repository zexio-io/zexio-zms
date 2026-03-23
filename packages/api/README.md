# @zexio/zms-api

The core orchestration and secret management engine for ZMS.

## Architecture

The API is built using **Hono** for high-performance routing and **Drizzle ORM** for database interaction. It manages:
- **Project Structure**: Organization, Projects, Environments, and Services.
- **Identity & Access**: MCP Tokens and Service Tokens.
- **Vault Operations**: Blind encryption/decryption of secrets.
- **Audit Logs**: Comprehensive event tracking for compliance.

## Authentication (M2M)

ZMS API supports **Token-Only Authentication** for Machine-to-Machine (M2M) communication. 
- Header: `X-ZMS-Token: zms_st_...`
- The system automatically resolves the full context (Organization, Project, Service, and Environment) directly from the token.

## Development

```bash
# Start in development mode
pnpm dev

# Run integration tests
pnpm test
```

## Internal Services

- `M2MService`: Handles token generation and verification.
- `VaultService`: Manages secret encryption via the `@zexio/zms-core` cryptography layer.
- `OrchestrationService`: Business logic for project management.
- `AuditService`: Low-level audit log persistence.

## API Specification

The API implements the **OpenAPI 3.1** standard. You can view the documentation at `/doc` and the Swagger UI at `/ui` when the server is running.
