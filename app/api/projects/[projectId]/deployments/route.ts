import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });

  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const deployments = await prisma.deployment.findMany({
    where: { projectId },
    orderBy: { triggeredAt: "desc" },
    take: 20,
  });

  return NextResponse.json(deployments);
}
