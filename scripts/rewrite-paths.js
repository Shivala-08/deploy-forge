#!/usr/bin/env node
/**
 * DeployForge: Rewrite asset paths in deployed static files
 *
 * Usage: node rewrite-paths.js <deployDir> <siteId>
 * Example: node rewrite-paths.js public/sites/compuserve compuserve
 *
 * Rewrites absolute /_next/ paths in HTML and JS files to /sites/<siteId>/_next/
 */

const fs = require("fs");
const path = require("path");

const [, , deployDir, siteId] = process.argv;

if (!deployDir || !siteId) {
  console.error("Usage: node rewrite-paths.js <deployDir> <siteId>");
  process.exit(1);
}

const basePath = `/sites/${siteId}`;
let htmlFixed = 0;
let jsFixed = 0;

function walk(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile()) {
      if (entry.name.endsWith(".html")) {
        rewriteHtml(fullPath);
      } else if (entry.name.endsWith(".js")) {
        rewriteJs(fullPath);
      } else if (entry.name.endsWith(".css")) {
        rewriteCss(fullPath);
      }
    }
  }
}

function rewriteHtml(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const original = content;

  // Fix href/src/action pointing to /<path> (absolute, not protocol-relative)
  content = content.replace(
    /(href|src|action|content)="(\/(?![\/\s])(?!sites\/)[^"]*)"/g,
    (match, attr, p) => `${attr}="${basePath}${p}"`
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    htmlFixed++;
    console.log(`  HTML patched: ${path.relative(deployDir, filePath)}`);
  }
}

function rewriteJs(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const original = content;

  // Fix "/_next/ → "/sites/siteId/_next/
  // These appear in webpack bootstrap as string literals
  content = content.replace(/"\/(_next\/)/g, `"${basePath}/$1`);
  content = content.replace(/'\/(_next\/)/g, `'${basePath}/$1`);

  // Fix publicPath setting: e.g. e.p="/_next/" or r.p="/_next/"
  content = content.replace(
    /(\w\.p\s*=\s*)"\/(_next\/)"/g,
    `$1"${basePath}/$2"`
  );
  content = content.replace(
    /(\w\.p\s*=\s*)"\/"/g,
    `$1"${basePath}/"`
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    jsFixed++;
    console.log(`  JS patched: ${path.relative(deployDir, filePath)}`);
  }
}

function rewriteCss(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const original = content;

  // Fix url(/_next/...) in CSS
  content = content.replace(/url\(\/(_next\/[^)]*)\)/g, `url(${basePath}/$1)`);

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`  CSS patched: ${path.relative(deployDir, filePath)}`);
  }
}

console.log(`🔧 Rewriting paths in ${deployDir} for basePath=${basePath}`);
walk(deployDir);
console.log(`✅ Done: ${htmlFixed} HTML files, ${jsFixed} JS files patched`);
