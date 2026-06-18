import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getLatestCommit, triggerDeployWorkflow } from "@/lib/github";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId, repoFullName, repoBranch, buildCommand, outputDir } =
    await req.json();

  if (!process.env.GITHUB_PAT || !process.env.DEPLOYFORGE_REPO_OWNER || !process.env.DEPLOYFORGE_REPO_NAME) {
    return NextResponse.json(
      { error: "Monorepo host configuration is incomplete. Please ensure GITHUB_PAT, DEPLOYFORGE_REPO_OWNER, and DEPLOYFORGE_REPO_NAME are set in your environment variables (.env file)." },
      { status: 500 }
    );
  }

  try {
    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, provider: "github" },
    });
    const userToken = account?.access_token || undefined;

    // 1. Get latest commit info from the target repo
    const commitInfo = await getLatestCommit(repoFullName, repoBranch || "main", userToken);

    // 2. Create a deployment record in DB
    const deployment = await prisma.deployment.create({
      data: {
        status: "QUEUED",
        commitSha: commitInfo.sha,
        commitMessage: commitInfo.message,
        site: { connect: { siteId } },
      },
    });

    // 3. Fire the GitHub Actions workflow via repository_dispatch
    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/deploy/status`;

    await triggerDeployWorkflow({
      siteId,
      repoFullName,
      buildCommand: buildCommand || "npm run build",
      outputDir: outputDir || "dist",
      commitSha: commitInfo.sha,
      deploymentId: deployment.id,
      callbackUrl,
      callbackToken: process.env.NEXTAUTH_SECRET!,
    });

    // 4. Update site record
    await prisma.site.update({
      where: { siteId },
      data: {
        liveUrl: `${process.env.NEXTAUTH_URL}/sites/${siteId}`,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ deployment, status: "QUEUED" }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to trigger deployment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
