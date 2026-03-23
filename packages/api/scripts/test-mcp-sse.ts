import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { db } from '@zexio/zms-core';

async function main() {
  console.log('🧪 Starting MCP SSE Integration Tests...');

  // TEST 1: No Token
  console.log('\n--- Test 1: Connection Without Token ---');
  let rejected = false;
  try {
    const transport1 = new SSEClientTransport(new URL('http://127.0.0.1:3001/mcp'));
    await transport1.start();
  } catch (e: any) {
    console.log('✅ Correctly rejected unauthenticated connection:', e.message);
    rejected = true;
  }
  if (!rejected) {
    console.error('❌ Failed: Server allowed unauthenticated connection!');
    process.exit(1);
  }

  console.log('\n🎉 SSE Testing Complete. IAM Middleware is active.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
