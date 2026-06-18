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

export async function PATCH(
  req: Request,
  { params }: { params: { siteId: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = params;
  const body = await req.json();
  const { name, repoBranch, buildCommand, outputDir } = body;

  try {
    const site = await prisma.site.findFirst({
      where: { siteId, userId: session.user.id },
    });

    if (!site)
      return NextResponse.json({ error: "Site not found" }, { status: 404 });

    const updated = await prisma.site.update({
      where: { id: site.id },
      data: {
        name: name !== undefined ? name : site.name,
        repoBranch: repoBranch !== undefined ? repoBranch : site.repoBranch,
        buildCommand: buildCommand !== undefined ? buildCommand : site.buildCommand,
        outputDir: outputDir !== undefined ? outputDir : site.outputDir,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update site" },
      { status: 500 }
    );
  }
}

