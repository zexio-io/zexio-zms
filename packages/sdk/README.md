# @zexio/zms-sdk

The official Node.js SDK for Zexio Secret Management System (ZMS).

## Installation

```bash
npm install @zexio/zms-sdk
```

## Usage

### 1. Simple Injection (Startup)

Automatically fetch all secrets and inject them into `process.env`.

```javascript
import { inject } from '@zexio/zms-sdk';

await inject({
  baseUrl: 'http://localhost:3030',
  apiKey: 'zms_st_...'
});

console.log(process.env.DATABASE_URL);
```

### 2. Client Pattern (Dynamic Fetching)

Fetch specific secrets at runtime for rotation or multi-tenant use cases.

```javascript
import { ZmsClient } from '@zexio/zms-sdk';

const zms = new ZmsClient({
  baseUrl: 'http://localhost:3030',
  apiKey: 'zms_st_...'
});

const dbUrl = await zms.getSecret('DATABASE_URL');
const all = await zms.getAllSecrets();
```

## Security Note

This SDK communicates with your local or remote ZMS instance via HTTPS. Ensure your `apiKey` (Service Token) is kept secure and not committed to version control.
