"use server";

type RepoMetadata = {
  description?: string;
  topics?: string[];
  languages?: string[];
  readmeExcerpt?: string;
};

const README_MAX_CHARS = 2000;

async function fetchRepoDetails(accessToken: string, repoFullName: string) {
  const response = await fetch(`https://api.github.com/repos/${repoFullName}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  const data = (await response.json()) as {
    description?: string;
    topics?: string[];
  };
  return {
    description: data.description,
    topics: data.topics ?? [],
  };
}

async function fetchRepoLanguages(accessToken: string, repoFullName: string) {
  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/languages`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) return [];
  const data = (await response.json()) as Record<string, number>;
  return Object.keys(data);
}

async function fetchReadmeExcerpt(accessToken: string, repoFullName: string) {
  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/readme`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.raw",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) return undefined;

  const text = await response.text();
  return text.slice(0, README_MAX_CHARS);
}

export async function fetchRepoContext(
  accessToken: string,
  repoFullName: string,
): Promise<RepoMetadata> {
  const token = accessToken ?? process.env.GITHUB_TOKEN ?? "";
  const [details, languages, readmeExcerpt] = await Promise.all([
    fetchRepoDetails(token, repoFullName),
    fetchRepoLanguages(token, repoFullName),
    fetchReadmeExcerpt(token, repoFullName),
  ]);

  return {
    description: details?.description,
    topics: details?.topics ?? [],
    languages,
    readmeExcerpt,
  };
}
