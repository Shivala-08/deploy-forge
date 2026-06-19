import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { triggerDeployWorkflow } from "@/lib/github";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  try {
    const { deploymentId, status, error, runId, meshSizeMb } = await req.json();
    const authHeader = req.headers.get("authorization");

    // Verify the per-deployment callback token
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: { site: true },
    });

    if (!deployment || authHeader !== `Bearer ${deployment.callbackToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the completed deployment
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status,
        errorMessage: error ?? null,
        ...(runId ? { workflowRunId: String(runId) } : {}),
        ...(status === "READY" || status === "ERROR" ? { completedAt: new Date() } : {}),
        meshSizeMb: meshSizeMb !== undefined ? meshSizeMb : undefined,
        callbackToken: null, // Invalidate after use
      },
    });

    // Mark queue entry as done
    await prisma.deployQueue.updateMany({
      where: { deploymentId },
      data: { status: "DONE" },
    });

    // Process next item in queue
    const next = await prisma.deployQueue.findFirst({
      where: { status: "WAITING" },
      orderBy: { createdAt: "asc" },
      include: {
        deployment: true,
        site: true,
      },
    });

    if (next) {
      const callbackToken = randomBytes(32).toString("hex");

      await prisma.deployQueue.update({
        where: { id: next.id },
        data: { status: "PROCESSING" },
      });

      await prisma.deployment.update({
        where: { id: next.deploymentId },
        data: { status: "BUILDING", callbackToken },
      });

      await triggerDeployWorkflow({
        siteId: next.site.siteId,
        repoFullName: next.site.repoFullName,
        repoBranch: next.site.repoBranch,
        buildCommand: next.site.buildCommand,
        outputDir: next.site.outputDir,
        commitSha: next.deployment.commitSha ?? "",
        deploymentId: next.deploymentId,
        callbackUrl: `${process.env.NEXTAUTH_URL}/api/deploy/status`,
        callbackToken,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update deployment status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
