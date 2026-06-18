import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { siteId: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = params;

  const site = await prisma.site.findFirst({
    where: { siteId, userId: session.user.id },
    include: { deployments: { orderBy: { triggeredAt: "desc" } } },
  });

  if (!site)
    return NextResponse.json({ error: "Site not found" }, { status: 404 });

  return NextResponse.json(site);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { siteId: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = params;

  const site = await prisma.site.findFirst({
    where: { siteId, userId: session.user.id },
  });

  if (!site)
    return NextResponse.json({ error: "Site not found" }, { status: 404 });

  await prisma.site.delete({ where: { id: site.id } });

  return NextResponse.json({ ok: true });
}
