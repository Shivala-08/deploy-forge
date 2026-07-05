import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return apiError("Unauthorized", 401);

  try {
    const latest = await prisma.deployment.findFirst({
      where: {
        status: "READY",
        meshSizeMb: { not: null },
        site: { userId: session.user.id },
      },
      orderBy: { completedAt: "desc" },
      select: { meshSizeMb: true },
    });

    return apiSuccess({ usedMb: latest?.meshSizeMb ?? 0 });
  } catch (error) {
    console.error("Storage API error:", error);
    return apiError("Failed to fetch storage data", 500);
  }
}
}
