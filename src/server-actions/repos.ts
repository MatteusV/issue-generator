"use server";

export type RepoOption = {
  id: number;
  fullName: string;
  isPrivate: boolean;
};

export async function fetchUserRepos(
  accessToken?: string,
): Promise<RepoOption[]> {
  const token = accessToken ?? process.env.GITHUB_TOKEN;

  if (!token) {
    return [];
  }

  const response = await fetch(
    "https://api.github.com/user/repos?per_page=100&sort=updated",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as Array<{
    id: number;
    full_name: string;
    private: boolean;
  }>;

  return data.map((repo) => ({
    id: repo.id,
    fullName: repo.full_name,
    isPrivate: repo.private,
  }));
}
