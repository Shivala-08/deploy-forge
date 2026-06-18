import { prisma } from "./prisma";

export interface MeshNode {
  id: string;
  siteId: string;
  name: string;
  status: string;
  liveUrl: string | null;
  lastDeployedAt: Date | null;
  depth: number;
}

export interface MeshTree {
  root: {
    id: "deployforge";
    name: "DeployForge";
    url: string;
  };
  nodes: MeshNode[];
  edges: Array<{ from: string; to: string }>;
  stats: {
    total: number;
    ready: number;
    building: number;
    error: number;
  };
}

export async function buildMeshTree(userId: string): Promise<MeshTree> {
  const sites = await prisma.site.findMany({
    where: { userId },
    include: {
      deployments: {
        orderBy: { triggeredAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const nodes: MeshNode[] = sites.map((site) => ({
    id: site.id,
    siteId: site.siteId,
    name: site.name,
    status: site.deployments[0]?.status ?? "NEVER_DEPLOYED",
    liveUrl: site.liveUrl,
    lastDeployedAt: site.deployments[0]?.completedAt ?? null,
    depth: 1,
  }));

  // All edges connect from root to each site (star topology)
  const edges = nodes.map((node) => ({
    from: "deployforge",
    to: node.id,
  }));

  const stats = {
    total: nodes.length,
    ready: nodes.filter((n) => n.status === "READY").length,
    building: nodes.filter((n) => n.status === "BUILDING" || n.status === "QUEUED").length,
    error: nodes.filter((n) => n.status === "ERROR").length,
  };

  return {
    root: {
      id: "deployforge",
      name: "DeployForge",
      url: process.env.NEXTAUTH_URL || "http://localhost:3000",
    },
    nodes,
    edges,
    stats,
  };
}
