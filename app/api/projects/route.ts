import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sites = await prisma.site.findMany({
    where: { userId: session.user.id },
    include: {
      deployments: { orderBy: { triggeredAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(sites);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, repoFullName, repoBranch, framework, buildCommand, outputDir } =
    body;

  const siteId = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  try {
    // Check if siteId is unique
    const existing = await prisma.site.findUnique({
      where: { siteId },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Site ID '${siteId}' is already taken. Please choose another project name.` },
        { status: 400 }
      );
    }

    const site = await prisma.site.create({
      data: {
        name,
        siteId,
        repoFullName,
        repoBranch: repoBranch || "main",
        framework,
        buildCommand: buildCommand || "npm run build",
        outputDir: outputDir || "dist",
        userId: session.user.id,
      },
    });

    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create site";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
