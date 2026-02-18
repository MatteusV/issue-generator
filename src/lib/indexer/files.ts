import { Buffer } from "node:buffer";

const ALLOWED_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".mdx",
  ".yaml",
  ".yml",
  ".sql",
  ".prisma",
  ".env.example",
];

const IGNORE_PREFIXES = [
  "node_modules/",
  ".next/",
  "dist/",
  "build/",
  ".git/",
  "public/",
  ".cursor/",
];

const MAX_FILE_BYTES = 200_000;
const MAX_FILES = 200;

type RepoFile = {
  path: string;
  size: number;
  url: string;
};

function isAllowed(path: string, size?: number) {
  const lowered = path.toLowerCase();

  if (IGNORE_PREFIXES.some((prefix) => lowered.startsWith(prefix)))
    return false;
  if (!ALLOWED_EXTENSIONS.some((ext) => lowered.endsWith(ext))) return false;
  if (typeof size === "number" && size > MAX_FILE_BYTES) return false;

  return true;
}

export async function listRepoFiles(
  accessToken: string,
  repoFullName: string,
): Promise<RepoFile[]> {
  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/git/trees/HEAD?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    tree?: Array<{ path: string; type: string; size?: number }>;
  };

  const scored = (data.tree ?? [])
    .filter((item) => item.type === "blob" && isAllowed(item.path, item.size))
    .map((file) => {
      const pathLower = file.path.toLowerCase();
      let score = 0;
      if (pathLower === "readme.md") score += 100;
      if (pathLower === "agents.md") score += 90;
      if (pathLower.startsWith("docs/")) score += 80;
      if (pathLower.endsWith(".md") || pathLower.endsWith(".mdx")) score += 60;
      return { ...file, score };
    })
    .sort((a, b) => b.score - a.score);

  const files = scored.slice(0, MAX_FILES).map<RepoFile>((file) => ({
    path: file.path,
    size: file.size ?? 0,
    url: `https://raw.githubusercontent.com/${repoFullName}/HEAD/${file.path}`,
  }));

  return files;
}

export async function fetchFileContent(
  accessToken: string | undefined,
  url: string,
) {
  if (typeof accessToken === "undefined") {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.raw",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `[fetchFileContent] failed status=${response.status} url=${url}`,
      );
      return "";
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.toString("utf-8");
  } catch (error) {
    console.error(`[fetchFileContent] error url=${url}`, error);
    return "";
  }
}
