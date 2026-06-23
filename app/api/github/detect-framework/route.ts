import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectFramework } from "@/lib/detectFramework";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const repoFullName = searchParams.get("repoFullName");

  if (!repoFullName) {
    return NextResponse.json({ error: "Missing repoFullName param" }, { status: 400 });
  }

  try {
    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, provider: "github" },
    });
    const token = account?.access_token || process.env.GITHUB_PAT;
    if (!token) {
      return NextResponse.json({ error: "No GitHub token found" }, { status: 400 });
    }

    const result = await detectFramework(repoFullName, token);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to detect framework" },
      { status: 500 }
    );
  }
}
