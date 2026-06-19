import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { processNextInQueue } from "@/lib/queue";

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

    // Process next item in queue using shared helper
    await processNextInQueue();

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update deployment status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
