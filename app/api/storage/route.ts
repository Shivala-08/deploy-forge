import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get the latest meshSizeMb from any recent completed deployment
    const latest = await prisma.deployment.findFirst({
      where: {
        status: "READY",
        meshSizeMb: { not: null },
        site: { userId: session.user.id },
      },
      orderBy: { completedAt: "desc" },
      select: { meshSizeMb: true },
    });

    return NextResponse.json({ usedMb: latest?.meshSizeMb ?? 0 });
  } catch (error) {
    return NextResponse.json({ usedMb: 0 });
  }
}
