import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-utils";
import { processNextInQueue } from "@/lib/queue";

export async function GET(_req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return apiError("Cron endpoint not configured", 500);
  }

  const { searchParams } = new URL(_req.url);
  const token = searchParams.get("token");

  if (token !== cronSecret) {
    return apiError("Unauthorized", 401);
  }

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

      await prisma.deployQueue.updateMany({
        where: { deploymentId: d.id },
        data: { status: "DONE" },
      });
    }

    if (stuck.length > 0) {
      await processNextInQueue();
    }

    return apiSuccess({ cleanedCount: stuck.length });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Failed to cleanup stuck deployments", 500);
  }
}
