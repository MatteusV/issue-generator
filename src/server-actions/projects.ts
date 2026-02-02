"use server";

import { auth } from "@/auth";

export type ProjectOption = {
  id: string;
  title: string;
  description?: string | null;
};

const PROJECTS_QUERY = /* GraphQL */ `
  query ListProjects($first: Int = 20, $orgFirst: Int = 10, $orgProjectFirst: Int = 20) {
    viewer {
      projectsV2(first: $first) {
        nodes {
          id
          title
          shortDescription
        }
      }
      organizations(first: $orgFirst) {
        nodes {
          name
          projectsV2(first: $orgProjectFirst) {
            nodes {
              id
              title
              shortDescription
            }
          }
        }
      }
    }
  }
`;

export async function fetchUserProjects(): Promise<ProjectOption[]> {
  const session = await auth();
  const accessToken = session?.accessToken ?? process.env.GITHUB_TOKEN;

  if (!accessToken) return [];

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({ query: PROJECTS_QUERY }),
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as {
      data?: {
        viewer?: {
          projectsV2?: { nodes?: Array<{ id: string; title: string; shortDescription?: string }> };
          organizations?: {
            nodes?: Array<{
              name?: string;
              projectsV2?: { nodes?: Array<{ id: string; title: string; shortDescription?: string }> };
            }>;
          };
        };
      };
    };

    const viewerProjects = data.data?.viewer?.projectsV2?.nodes ?? [];
    const orgProjects =
      data.data?.viewer?.organizations?.nodes?.flatMap(
        (org) => org.projectsV2?.nodes ?? [],
      ) ?? [];
    const nodes = [...viewerProjects, ...orgProjects];

    const dedup = new Map<string, { id: string; title: string; shortDescription?: string }>();
    for (const p of nodes) {
      if (p?.id && p?.title && !dedup.has(p.id)) {
        dedup.set(p.id, p);
      }
    }

    return Array.from(dedup.values()).map((project) => ({
      id: project.id,
      title: project.title,
      description: project.shortDescription ?? null,
    }));
  } catch {
    return [];
  }
}
