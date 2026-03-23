# @zexio/zms-cli

The ZMS CLI is a tactical tool for managing the Zexio Secret Management System locally and injecting secrets into your application environment.

## Installation

```bash
pnpm install -g @zexio/zms-cli
```

## Commands

### 1. Initialize
Sets up the local `.zexio` directory and synchronizes the database schema.
```bash
zms init
```

### 2. Start Engine
Launches the ZMS Unified Engine (API + Dashboard).
```bash
zms start --port 3030
```

### 3. Run Command (Secret Injection)
Runs a sub-process with ZMS secrets automatically injected as environment variables.

```bash
# Explicit Mode
zms run -p <project-id> -e production -- pnpm dev

# Auto-Resolution Mode (Recommended)
zms run -t zms_st_... -- pnpm dev
```

## Options for `zms run`
- `-t, --token <string>`: Service Token. If provided, ZMS will **auto-resolve** the Project and Environment.
- `-p, --project <id>`: Project ID (Optional if token is provided).
- `-e, --env <name>`: Environment name (Optional if token is provided).
- `-o, --org <id>`: Organization ID (Optional, defaults to primary).

> [!IMPORTANT]
> **Token Scoping**: In ZMS Community Edition, Service Tokens are strictly locked to a **1-1-1-1 mapping** (1 Org, 1 Project, 1 Service, 1 Environment). Using a token generated for `development` to fetch secrets for `production` will fail, even if you use the explicit `-e production` flag.

## Reset
Wipe all local data and start fresh.
```bash
zms reset
```
