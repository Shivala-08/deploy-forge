// scripts/patch-db-provider.js
const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");
let content = fs.readFileSync(schemaPath, "utf-8");

const dbUrl = process.env.DATABASE_URL || "";
const isPostgres = dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");

if (isPostgres) {
  console.log("[patch-db-provider] Detected Postgres database URL. Changing provider to postgresql.");
  content = content.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, content, "utf-8");
} else {
  console.log("[patch-db-provider] Keeping sqlite provider for local SQLite file.");
}
