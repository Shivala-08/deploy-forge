const GITHUB_BASE = "https://api.github.com";

export async function getRepos(token: string) {
  const res = await fetch(
    `${GITHUB_BASE}/user/repos?sort=updated&per_page=100&type=owner`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch GitHub repos");
  return res.json();
}

export async function getRepo(token: string, fullName: string) {
  const res = await fetch(`${GITHUB_BASE}/repos/${fullName}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch repo");
  return res.json();
}
