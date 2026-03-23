# @zexio/zms-dashboard

The official web-based management interface for the Zexio Secret Management System.

## Features

- **Project Isolation**: Manage multiple projects and environments (Production, Staging, Development).
- **Service Management**: Provision and revoke Service Tokens for machine-to-machine authentication.
- **Blind Secret Vault**: Securely write and read secrets encrypted with AES-256-GCM.
- **Audit Logs**: Full visibility into every secret access and administrative action.
- **Premium UI**: Hardware-accelerated, dark-mode first design for modern SecOps.

## Development

The dashboard is built with Next.js 14 and Tailwind CSS.

```bash
# Run the development server
pnpm dev
```

The dashboard communicates with the ZMS API (port 3030 by default). Ensure the API is running for the dashboard to function correctly.

## Environment Variables

- `NEXT_PUBLIC_ZMS_API_URL`: The URL of your ZMS API (default: `http://localhost:3030`).
