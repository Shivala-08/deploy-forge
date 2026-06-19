import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { triggerDeployWorkflow, getLatestCommit, getOctokit } from "@/lib/github";
import { randomBytes } from "crypto";
import { validateBuildCommand } from "@/lib/validateBuildCommand";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId, repoFullName, repoBranch, buildCommand, outputDir } = await req.json();

  if (buildCommand && !validateBuildCommand(buildCommand)) {
    return NextResponse.json(
      { error: "Invalid build command. Only standard npm, yarn, pnpm, and npx build scripts are allowed." },
      { status: 400 }
    );
  }

  if (!process.env.GITHUB_PAT || !process.env.DEPLOYFORGE_REPO_OWNER || !process.env.DEPLOYFORGE_REPO_NAME) {
    return NextResponse.json(
      { error: "Monorepo host configuration is incomplete. Please ensure GITHUB_PAT, DEPLOYFORGE_REPO_OWNER, and DEPLOYFORGE_REPO_NAME are set in your environment variables (.env file)." },
      { status: 500 }
    );
  }

  try {
    const site = await prisma.site.findFirst({
      where: { siteId, userId: session.user.id },
    });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, provider: "github" },
    });
    const userToken = account?.access_token || undefined;

    // 1. Get latest commit info from the target repo
    const commitInfo = await getLatestCommit(repoFullName, repoBranch || "main", userToken);
    const callbackToken = randomBytes(32).toString("hex");

    // Get current HEAD SHA of DeployForge repo (before the new deploy) to support rollback
    let previousCommitSha: string | null = null;
    try {
      const octokit = getOctokit();
      const { data: ref } = await octokit.git.getRef({
        owner: process.env.DEPLOYFORGE_REPO_OWNER!,
        repo: process.env.DEPLOYFORGE_REPO_NAME!,
        ref: "heads/main",
      });
      previousCommitSha = ref.object.sha;
    } catch (err) {
      console.error("Failed to fetch previous commit SHA:", err);
    }

    // Wrap checking and creation in a Transaction with Postgres advisory lock
    const { deployment, isQueued } = await prisma.$transaction(async (tx) => {
      const isPostgres = process.env.DATABASE_URL?.startsWith("postgres") || process.env.DATABASE_URL?.startsWith("postgresql");
      if (isPostgres) {
        // Lock atomically to prevent concurrency check race conditions
        await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(148203)`);
      }

      const activeBuilds = await tx.deployment.count({
        where: {
          site: { userId: session.user.id },
          status: { in: ["BUILDING", "QUEUED"] },
        },
      });

      const queuedState = activeBuilds > 0;

      const newDeployment = await tx.deployment.create({
        data: {
          status: queuedState ? "QUEUED" : "BUILDING",
          commitSha: commitInfo.sha,
          commitMessage: commitInfo.message,
          callbackToken,
          previousCommitSha,
          site: { connect: { id: site.id } },
        },
      });

      return { deployment: newDeployment, isQueued: queuedState };
    });

    // Update live URL on site record
    await prisma.site.update({
      where: { id: site.id },
      data: {
        liveUrl: `${process.env.NEXTAUTH_URL}/sites/${siteId}`,
        updatedAt: new Date(),
      },
    });

    if (isQueued) {
      // Queue it — don't fire the workflow yet
      const queuePosition = await prisma.deployQueue.count({
        where: { status: "WAITING" },
      });

      await prisma.deployQueue.create({
        data: {
          siteId: site.id,
          deploymentId: deployment.id,
          status: "WAITING",
          position: queuePosition + 1,
        },
      });

      return NextResponse.json({
        deployment,
        status: "QUEUED",
        queuePosition: queuePosition + 1,
        message: `Queued at position ${queuePosition + 1}. Will deploy automatically.`,
      }, { status: 202 });
    }

    // No active builds — fire immediately
    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/deploy/status`;
    await triggerDeployWorkflow({
      siteId,
      repoFullName,
      repoBranch: repoBranch || "main",
      buildCommand: buildCommand || "npm run build",
      outputDir: outputDir || "dist",
      commitSha: commitInfo.sha,
      deploymentId: deployment.id,
      callbackUrl,
      callbackToken,
    });

    return NextResponse.json({ deployment, status: "BUILDING" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to trigger deployment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
