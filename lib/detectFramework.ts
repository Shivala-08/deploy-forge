import { Octokit } from "@octokit/rest";

export async function detectFramework(repoFullName: string, token: string) {
  try {
    const octokit = new Octokit({ auth: token });
    const [owner, repo] = repoFullName.split("/");

    const { data: files } = await octokit.repos.getContent({
      owner,
      repo,
      path: "",
    });

    if (!Array.isArray(files)) {
      return { framework: "static", buildCommand: "", outputDir: "." };
    }

    const names = files.map((f) => f.name);

    if (names.includes("next.config.js") || names.includes("next.config.ts") || names.includes("next.config.mjs")) {
      return { framework: "nextjs", buildCommand: "npm run build", outputDir: ".next" };
    }
    if (names.includes("vite.config.js") || names.includes("vite.config.ts") || names.includes("vite.config.mjs")) {
      return { framework: "vite", buildCommand: "npm run build", outputDir: "dist" };
    }
    if (names.includes("astro.config.mjs") || names.includes("astro.config.ts")) {
      return { framework: "astro", buildCommand: "npm run build", outputDir: "dist" };
    }
    if (names.includes("package.json")) {
      return { framework: "react", buildCommand: "npm run build", outputDir: "build" };
    }

    return { framework: "static", buildCommand: "", outputDir: "." };
  } catch (error) {
    console.error("Failed to detect framework:", error);
    return { framework: "static", buildCommand: "", outputDir: "." };
  }
}
