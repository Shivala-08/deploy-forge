import { notFound } from "next/navigation";
import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { siteId: string; slug?: string[] } }
) {
  const { siteId, slug = [] } = params;

  // Build the file path
  let filePath = slug.join("/") || "index.html";

  // If the path has no extension, try index.html
  if (!filePath.includes(".")) {
    filePath = `${filePath}/index.html`.replace(/^\//, "");
  }

  const fullPath = join(
    process.cwd(),
    "public",
    "sites",
    siteId,
    filePath
  );

  try {
    const content = await readFile(fullPath);

    // Detect content type
    const ext = filePath.split(".").pop();
    const contentTypes: Record<string, string> = {
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
      json: "application/json",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      svg: "image/svg+xml",
      ico: "image/x-icon",
      woff2: "font/woff2",
      woff: "font/woff",
    };

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentTypes[ext || "html"] || "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    // File not found — try index.html of the directory
    try {
      const indexPath = join(
        process.cwd(),
        "public",
        "sites",
        siteId,
        filePath.replace(/[^/]+$/, ""),
        "index.html"
      );
      const content = await readFile(indexPath);
      return new NextResponse(content, {
        headers: { "Content-Type": "text/html" },
      });
    } catch {
      return notFound();
    }
  }
}
