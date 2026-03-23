#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Try compiled index first (dist), then fallback to tsx-based index for dev
const distPath = path.join(__dirname, '../dist/index.js');

if (fs.existsSync(distPath)) {
  require(distPath);
} else {
  // Development fallback: require tsx if available
  require('tsx/register');
  require('../src/index.ts');
}
