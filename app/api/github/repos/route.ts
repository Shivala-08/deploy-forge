import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
  });
  const token = account?.access_token || process.env.GITHUB_PAT;
  if (!token)
    return NextResponse.json({ error: "No GitHub token" }, { status: 400 });

  const res = await fetch(
    "https://api.github.com/user/repos?sort=updated&per_page=100&type=all",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (res.status === 401) {
    return NextResponse.json(
      { error: "GitHub token expired. Please sign in again." },
      { status: 401 }
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }

  const repos = await res.json();

  return NextResponse.json(
    repos.map((r: Record<string, unknown>) => ({
      id: r.id,
      full_name: r.full_name,
      name: r.name,
      private: r.private,
      updated_at: r.updated_at,
      language: r.language,
      default_branch: r.default_branch,
    }))
  );
}
