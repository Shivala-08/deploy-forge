import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const site = await prisma.site.findUnique({
      where: { siteId: "peter-parker" }
    });
    if (site) {
      const latest = await prisma.deployment.findFirst({
        where: { siteId: site.id },
        orderBy: { triggeredAt: "desc" }
      });
      if (latest) {
        await prisma.deployment.update({
          where: { id: latest.id },
          data: { status: "READY" }
        });
        return NextResponse.json({ success: true, message: "Fixed deployment status to READY" });
      }
    }
    return NextResponse.json({ success: false, message: "No deployment found to fix" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
}
