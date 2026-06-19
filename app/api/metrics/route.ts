import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [total, ready, error, readyDeploys] = await Promise.all([
      prisma.deployment.count({
        where: { site: { userId: session.user.id } }
      }),
      prisma.deployment.count({
        where: { status: "READY", site: { userId: session.user.id } }
      }),
      prisma.deployment.count({
        where: { status: "ERROR", site: { userId: session.user.id } }
      }),
      prisma.deployment.findMany({
        where: {
          status: "READY",
          completedAt: { not: null },
          site: { userId: session.user.id }
        },
        select: {
          triggeredAt: true,
          completedAt: true,
        },
      }),
    ]);

    let totalDurationSeconds = 0;
    for (const d of readyDeploys) {
      if (d.completedAt) {
        const diff = (d.completedAt.getTime() - d.triggeredAt.getTime()) / 1000;
        totalDurationSeconds += diff;
      }
    }
    const avgBuildTimeSeconds = readyDeploys.length > 0 ? Math.round(totalDurationSeconds / readyDeploys.length) : 0;

    return NextResponse.json({
      successRate: total > 0 ? ((ready / total) * 100).toFixed(1) : "0.0",
      totalDeployments: total,
      failedDeployments: error,
      avgBuildTimeSeconds,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch metrics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
