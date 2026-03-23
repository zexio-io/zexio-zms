import fs from 'fs';
import path from 'path';

const ZMS_MCP_URL = 'http://localhost:3001/mcp';
const MCP_TOKEN = 'zms_mcp_aa4b788e9fdc1cab9f8922c63139dbb7c36c4029ffcc17c779274aaaf1209ad3';

async function mcpCall(method: string, params: any = {}) {
    const res = await fetch(ZMS_MCP_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'Authorization': `Bearer ${MCP_TOKEN}`
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method: `tools/call`,
            params: {
                name: method,
                arguments: params
            }
        })
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No reader available');

    let buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += new TextDecoder().decode(value);
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const json = line.slice(6);
                const data = JSON.parse(json);
                if (data.id && data.result) return data.result;
                if (data.error) throw new Error(`MCP Error: ${JSON.stringify(data.error)}`);
            }
        }
    }
    throw new Error('No result found in SSE stream');
}

async function sync() {
    console.log('🚀 Starting ZMS MCP Professional Sync...');

    // 1. Read .env.local
    const envPath = path.resolve(process.cwd(), '../../.env.local');
    const content = fs.readFileSync(envPath, 'utf-8');
    const secrets: Record<string, string> = {};
    
    content.split('\n').forEach(line => {
        if (line.trim() && !line.startsWith('#')) {
            const [key, ...rest] = line.split('=');
            const val = rest.join('=').split('#')[0].trim();
            if (key && val) secrets[key.trim()] = val;
        }
    });

    console.log(`📦 Parsed ${Object.keys(secrets).length} secrets.`);

    // 2. List Projects
    console.log('🔍 Checking existing projects...');
    const projectList = await mcpCall('list_projects');
    const projectText = projectList.content[0].text;
    
    let projectId = '';
    const matches = projectText.match(/zexio-zms \(UUID: ([a-f0-9-]+)\)/);
    
    if (matches) {
        projectId = matches[1];
        console.log(`✅ Project "zexio-zms" already exists (ID: ${projectId})`);
    } else {
        console.log('🏗️ Project "zexio-zms" not found. Provisioning...');
        const provisionRes = await mcpCall('provision_project', {
            projectName: 'zexio-zms',
            services: ['api-core']
        });
        console.log(provisionRes.content[0].text);
        
        // Re-fetch list to get ID
        const updatedList = await mcpCall('list_projects');
        const newMatches = updatedList.content[0].text.match(/zexio-zms \(UUID: ([a-f0-9-]+)\)/);
        if (!newMatches) throw new Error('Failed to retrieve new project ID');
        projectId = newMatches[1];
    }

    // 3. Bulk Save
    console.log('🔐 Uploading secrets via ZMS MCP bulk_save_secrets...');
    const saveRes = await mcpCall('bulk_save_secrets', {
        projectId,
        serviceName: 'api-core',
        secrets
    });
    console.log(saveRes.content[0].text);

    console.log('\n✅ Mission Accomplished: Secrets synchronized via MCP.');
}

sync().catch(e => {
    console.error('❌ Sync failed:', e.message);
    process.exit(1);
});
