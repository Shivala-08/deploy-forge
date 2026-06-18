#!/usr/bin/env node
/**
 * DeployForge: Patch Next.js config for subpath hosting
 *
 * Usage: node patch-nextconfig.js <projectDir> <siteId>
 * Example: node patch-nextconfig.js /tmp/target-site compuserve
 *
 * Injects basePath, assetPrefix, output:'export', trailingSlash, images.unoptimized
 * so the site works when served from /sites/<siteId>/
 */

const fs = require("fs");
const path = require("path");

const [, , projectDir, siteId] = process.argv;

if (!projectDir || !siteId) {
  console.error("Usage: node patch-nextconfig.js <projectDir> <siteId>");
  process.exit(1);
}

const basePath = `/sites/${siteId}`;

// Find the next.config file
const candidates = [
  "next.config.ts",
  "next.config.mjs",
  "next.config.js",
];
let configFile = null;
for (const c of candidates) {
  const full = path.join(projectDir, c);
  if (fs.existsSync(full)) {
    configFile = full;
    break;
  }
}

if (!configFile) {
  // No config found — create a minimal one
  const content = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '${basePath}',
  assetPrefix: '${basePath}',
  trailingSlash: true,
  images: { unoptimized: true },
};
module.exports = nextConfig;
`;
  const newPath = path.join(projectDir, "next.config.js");
  fs.writeFileSync(newPath, content, "utf8");
  console.log(`✅ Created ${newPath} with basePath=${basePath}`);
  process.exit(0);
}

let src = fs.readFileSync(configFile, "utf8");
console.log(`📄 Found ${configFile}`);
console.log(`📝 Original (first 300 chars):\n${src.substring(0, 300)}\n`);

// Strip any existing conflicting settings
src = src.replace(/\boutput\s*:\s*['"][^'"]*['"]\s*,?\s*\n?/g, "");
src = src.replace(/\bbasePath\s*:\s*['"][^'"]*['"]\s*,?\s*\n?/g, "");
src = src.replace(/\bassetPrefix\s*:\s*['"][^'"]*['"]\s*,?\s*\n?/g, "");
src = src.replace(/\btrailingSlash\s*:\s*(true|false)\s*,?\s*\n?/g, "");
// Strip existing images block if unoptimized is already set
src = src.replace(/\bimages\s*:\s*\{\s*unoptimized\s*:\s*(true|false)\s*\}\s*,?\s*\n?/g, "");

// Injection block
const injection = `
  output: 'export',
  basePath: '${basePath}',
  assetPrefix: '${basePath}',
  trailingSlash: true,
  images: { unoptimized: true },`;

// Match the config object opening brace — support various export styles
// e.g.: const nextConfig = {, const config = {, module.exports = {, export default {
const patterns = [
  /((?:const|let|var)\s+\w+\s*(?::\s*\w[\w<>]*\s*)?\s*=\s*\{)/,
  /(module\.exports\s*=\s*\{)/,
  /(export\s+default\s+\{)/,
];

let patched = false;
for (const pattern of patterns) {
  if (pattern.test(src)) {
    src = src.replace(pattern, (m) => m + injection);
    patched = true;
    break;
  }
}

if (!patched) {
  // Fallback: prepend a wrapper
  console.warn("⚠️  Could not find config object — prepending wrapper");
  src = `/** @type {import('next').NextConfig} */
const _deployforgeBase = ${src};
module.exports = {
  ..._deployforgeBase,${injection}
};
`;
}

fs.writeFileSync(configFile, src, "utf8");
console.log(`✅ Patched ${configFile} with basePath=${basePath}`);
console.log(`📝 New content (first 500 chars):\n${src.substring(0, 500)}`);
