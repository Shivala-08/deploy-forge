// scripts/rewrite-paths.js
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const siteId = process.argv[2];
if (!siteId) {
  console.error("Usage: node rewrite-paths.js <siteId>");
  process.exit(1);
}

const basePath = `/sites/${siteId}`;
const siteDir = path.join(process.cwd(), "public", "sites", siteId);

// Build a whitelist of files that actually exist in the output
// Only rewrite paths that point to real local files
function getLocalFiles(dir, baseDir = dir) {
  const results = new Set();
  if (!fs.existsSync(dir)) {
    return results;
  }
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      getLocalFiles(full, baseDir).forEach((f) => results.add(f));
    } else {
      // Store as absolute path from site root e.g. "/assets/main.js"
      results.add("/" + path.relative(baseDir, full).replace(/\\/g, "/"));
    }
  }
  return results;
}

function shouldRewrite(href, localFiles) {
  if (!href) return false;
  if (!href.startsWith("/")) return false;       // relative path — leave alone
  if (href.startsWith("//")) return false;       // protocol-relative CDN URL — leave alone
  if (href.startsWith("/api/")) return false;    // API call — leave alone
  if (href.startsWith(basePath)) return false;   // already rewritten — skip
  // Only rewrite if the file actually exists locally
  return localFiles.has(href) || localFiles.has(href + "/index.html");
}

function rewriteHtml(filePath, localFiles) {
  const content = fs.readFileSync(filePath, "utf-8");
  const $ = cheerio.load(content, { decodeEntities: false });

  // Rewrite href attributes
  $("[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (shouldRewrite(href, localFiles)) {
      $(el).attr("href", basePath + href);
    }
  });

  // Rewrite src attributes
  $("[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (shouldRewrite(src, localFiles)) {
      $(el).attr("src", basePath + src);
    }
  });

  // Rewrite srcset
  $("[srcset]").each((_, el) => {
    const srcset = $(el).attr("srcset");
    if (srcset) {
      const rewritten = srcset
        .split(",")
        .map((part) => {
          const [url, descriptor] = part.trim().split(/\s+/);
          if (shouldRewrite(url, localFiles)) {
            return descriptor ? `${basePath}${url} ${descriptor}` : `${basePath}${url}`;
          }
          return part.trim();
        })
        .join(", ");
      $(el).attr("srcset", rewritten);
    }
  });

  // Rewrite inline <style> url() references
  $("style").each((_, el) => {
    const css = $(el).html() || "";
    const rewritten = css.replace(/url\(['"]?(\/[^'")\s]+)['"]?\)/g, (match, p1) => {
      if (shouldRewrite(p1, localFiles)) return `url(${basePath}${p1})`;
      return match;
    });
    $(el).html(rewritten);
  });

  fs.writeFileSync(filePath, $.html());
}

function rewriteCss(filePath, localFiles) {
  let content = fs.readFileSync(filePath, "utf-8");
  content = content.replace(/url\(['"]?(\/[^'")\s]+)['"]?\)/g, (match, p1) => {
    if (shouldRewrite(p1, localFiles)) return `url(${basePath}${p1})`;
    return match;
  });
  fs.writeFileSync(filePath, content);
}

function walkAndRewrite(dir, localFiles) {
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    return;
  }
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      walkAndRewrite(full, localFiles);
    } else if (item.name.endsWith(".html")) {
      rewriteHtml(full, localFiles);
    } else if (item.name.endsWith(".css")) {
      rewriteCss(full, localFiles);
    }
  }
}

console.log(`[rewrite-paths] Rewriting paths for site: ${siteId}`);
const localFiles = getLocalFiles(siteDir);
console.log(`[rewrite-paths] Found ${localFiles.size} local files`);
walkAndRewrite(siteDir, localFiles);
console.log(`[rewrite-paths] Done.`);
