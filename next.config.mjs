import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Run database provider patcher and generate client before Next.js configuration is exported
try {
  const schemaPath = path.join(__dirname, "prisma/schema.prisma");
  let content = fs.readFileSync(schemaPath, "utf-8");

  const rawDbUrl = process.env.DATABASE_URL || "";
  const dbUrl = rawDbUrl.trim().replace(/^["']|["']$/g, "").toLowerCase();

  const isVercel = 
    process.env.VERCEL === "1" || 
    process.env.VERCEL_ENV !== undefined || 
    process.env.NOW_BUILDER !== undefined ||
    (process.cwd() && (process.cwd().startsWith("/vercel") || process.cwd().startsWith("/var/task"))) ||
    (__dirname && (__dirname.startsWith("/vercel") || __dirname.startsWith("/var/task")));

  const isNonSqlite = dbUrl && !dbUrl.startsWith("file:") && !dbUrl.startsWith("sqlite:");

  if (isVercel || isNonSqlite) {
    console.log(`[next.config.mjs] Detected Postgres environment. Changing provider to postgresql.`);
    content = content.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
    fs.writeFileSync(schemaPath, content, "utf-8");
  } else {
    console.log(`[next.config.mjs] Keeping sqlite provider.`);
    content = content.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
    fs.writeFileSync(schemaPath, content, "utf-8");
  }

  console.log("[next.config.mjs] Running prisma generate...");
  execSync("npx prisma generate", { stdio: "inherit" });
} catch (e) {
  console.error("[next.config.mjs] Error running prisma patcher / generate:", e);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["three"],
  experimental: {
    outputFileTracingIncludes: {
      '/sites/[siteId]/[[...slug]]': ['./public/sites/**/*'],
    },
  },
};

export default nextConfig;
