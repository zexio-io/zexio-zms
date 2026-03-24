import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * ZMS Automated Changeset Generator 🕶️💎
 * Detects modified packages compared to main and generates a patch changeset.
 */

try {
  // 1. Get changed files compared to origin/main or main
  let baseBranch = 'main';
  try {
    execSync('git fetch origin main');
    baseBranch = 'origin/main';
  } catch (e) {
    console.log('⚠️ Could not fetch origin/main, falling back to local main.');
  }

  const diffCmd = `git diff --name-only ${baseBranch}`;
  let changedFiles = execSync(diffCmd).toString().split('\n').filter(Boolean);
  
  // Fallback: If no files changed against main, check the last commit (HEAD~1)
  if (changedFiles.length === 0) {
    console.log(`ℹ️ ZMS: No files changed against ${baseBranch}. Checking LAST COMMIT (HEAD~1)...`);
    changedFiles = execSync('git diff --name-only HEAD~1 HEAD').toString().split('\n').filter(Boolean);
  }

  const changedPackages = new Set();

  // 2. Map files to package names
  changedFiles.forEach(file => {
    const segments = file.split('/');
    if (segments[0] === 'packages' && segments[1]) {
      const packagePath = path.join('packages', segments[1], 'package.json');
      if (fs.existsSync(packagePath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
          if (pkg.name) {
            changedPackages.add(pkg.name);
          }
        } catch (e) {
            // Skip invalid package.json
        }
      }
    }
  });

  if (changedPackages.size === 0) {
    console.log("💎 ZMS: No changes detected in packages. Skipping changeset generation.");
    process.exit(0);
  }

  // 3. Generate changeset content
  const pkgLines = Array.from(changedPackages)
    .map(p => `"${p}": minor`)
    .join('\n');

  const content = `---
${pkgLines}
---

Automated patch for changes detected in:
${Array.from(changedPackages).map(p => `- ${p}`).join('\n')}
`;

  // 4. Write to .changeset folder
  if (!fs.existsSync('.changeset')) {
    fs.mkdirSync('.changeset');
  }

  const timestamp = Date.now();
  const filename = `.changeset/auto-patch-${timestamp}.md`;
  fs.writeFileSync(filename, content);

  console.log(`✅ ZMS: Generated automated changeset for ${changedPackages.size} packages.`);
  console.log(`📂 Path: ${filename}`);

} catch (err) {
  console.error("❌ ZMS: Failed to generate automated changeset:", err.message);
  process.exit(1);
}
