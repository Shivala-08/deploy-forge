import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOctokit } from "@/lib/github";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { deploymentId } = await req.json();

    const deployment = await prisma.deployment.findFirst({
      where: {
        id: deploymentId,
        site: { userId: session.user.id },
      },
      include: { site: true },
    });

    if (!deployment)
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });

    if (!deployment.previousCommitSha)
      return NextResponse.json({ error: "No previous version to roll back to" }, { status: 400 });

    const callbackToken = randomBytes(32).toString("hex");

    // Create a new deployment record for the rollback
    const rollbackDeployment = await prisma.deployment.create({
      data: {
        status: "BUILDING",
        commitSha: deployment.previousCommitSha.slice(0, 7),
        commitMessage: `Rollback to ${deployment.previousCommitSha.slice(0, 7)}`,
        callbackToken,
        previousCommitSha: deployment.commitSha ?? undefined,
        site: { connect: { id: deployment.site.id } },
      },
    });

    const octokit = getOctokit();
    await octokit.repos.createDispatchEvent({
      owner: process.env.DEPLOYFORGE_REPO_OWNER!,
      repo: process.env.DEPLOYFORGE_REPO_NAME!,
      event_type: "rollback-site",
      client_payload: {
        siteId: deployment.site.siteId,
        previousCommitSha: deployment.previousCommitSha,
        deploymentId: rollbackDeployment.id,
        callbackUrl: `${process.env.NEXTAUTH_URL}/api/deploy/status`,
        callbackToken,
      },
    });

    return NextResponse.json({ deployment: rollbackDeployment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to trigger rollback";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
