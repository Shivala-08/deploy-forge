// scripts/patch-db-provider.js
const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");
let content = fs.readFileSync(schemaPath, "utf-8");

const rawDbUrl = process.env.DATABASE_URL || "";
const dbUrl = rawDbUrl.trim().replace(/^["']|["']$/g, "").toLowerCase();

const isVercel = process.env.VERCEL === "1";
const isNonSqlite = dbUrl && !dbUrl.startsWith("file:") && !dbUrl.startsWith("sqlite:");

if (isVercel || isNonSqlite) {
  console.log(`[patch-db-provider] Detected Postgres environment (VERCEL=${process.env.VERCEL}, DATABASE_URL="${rawDbUrl.substring(0, 15)}..."). Changing provider to postgresql.`);
  content = content.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, content, "utf-8");
} else {
  console.log(`[patch-db-provider] Keeping sqlite provider (VERCEL=${process.env.VERCEL}, DATABASE_URL="${rawDbUrl.substring(0, 15)}...")`);
}
