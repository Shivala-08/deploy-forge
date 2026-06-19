import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { processNextInQueue } from "@/lib/queue";

export async function GET(req: Request) {
  try {
    const stuck = await prisma.deployment.findMany({
      where: {
        status: { in: ["BUILDING", "QUEUED"] },
        triggeredAt: { lt: new Date(Date.now() - 20 * 60 * 1000) } // 20 min ago
      }
    });

    for (const d of stuck) {
      await prisma.deployment.update({
        where: { id: d.id },
        data: {
          status: "ERROR",
          errorMessage: "Deployment timed out after 20 minutes. GitHub Actions may be unavailable.",
          completedAt: new Date(),
          callbackToken: null,
        }
      });

      // Mark queue entry as done
      await prisma.deployQueue.updateMany({
        where: { deploymentId: d.id },
        data: { status: "DONE" },
      });
    }

    if (stuck.length > 0) {
      // Unblock queue
      await processNextInQueue();
    }

    return NextResponse.json({ ok: true, cleanedCount: stuck.length });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to cleanup stuck deployments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
