// scripts/patch-nextconfig.js
const fs = require("fs");
const path = require("path");

const siteDir = process.argv[2];
const siteId = process.argv[3];
const basePath = `/sites/${siteId}`;

if (!siteDir || !siteId) {
  console.error("Usage: node patch-nextconfig.js <siteDir> <siteId>");
  process.exit(1);
}

const possibleConfigs = [
  "next.config.js",
  "next.config.ts",
  "next.config.mjs",
];

let configPath = null;
for (const name of possibleConfigs) {
  const full = path.join(siteDir, name);
  if (fs.existsSync(full)) {
    configPath = full;
    break;
  }
}

if (!configPath) {
  console.log("[patch-nextconfig] No Next.js config found — skipping.");
  process.exit(0);
}

console.log(`[patch-nextconfig] Patching ${configPath} for subpath: ${basePath}`);

let content = fs.readFileSync(configPath, "utf-8");

// Check if it's using the new config object style or the withX wrapper style
// Strategy: inject our required fields before the closing of the config object

const patch = `
  // === DeployForge Subpath Patch ===
  output: "export",
  basePath: "${basePath}",
  assetPrefix: "${basePath}",
  trailingSlash: true,
  images: { unoptimized: true },
  // === End DeployForge Patch ===
`;

// Handle: module.exports = { ... }
if (content.includes("module.exports")) {
  content = content.replace(
    /module\.exports\s*=\s*\{/,
    `module.exports = {${patch}`
  );
}
// Handle: export default { ... }
else if (content.includes("export default {")) {
  content = content.replace(
    /export default \{/,
    `export default {${patch}`
  );
}
// Handle: const nextConfig = { ... }
else if (content.match(/const\s+\w+\s*=\s*\{/)) {
  content = content.replace(
    /const\s+(\w+)\s*=\s*\{/,
    (match) => `${match}${patch}`
  );
}
else {
  // Fallback: prepend a complete config
  console.log("[patch-nextconfig] Could not parse config format — prepending new config.");
  content = `
const deployForgeConfig = {${patch}};
module.exports = { ...require("${configPath}"), ...deployForgeConfig };
`;
}

fs.writeFileSync(configPath, content);
console.log("[patch-nextconfig] Done.");
