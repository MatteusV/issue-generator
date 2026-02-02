"use server";

import { auth } from "@/auth";

export type ProjectOption = {
  id: string;
  title: string;
  description?: string | null;
};

const PROJECTS_QUERY = /* GraphQL */ `
  query ListProjects($first: Int = 20) {
    viewer {
      projectsV2(first: $first) {
        nodes {
          id
          title
          shortDescription
        }
      }
    }
  }
`;

export async function fetchUserProjects(): Promise<ProjectOption[]> {
  const session = await auth();
  const accessToken = session?.accessToken;

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
        viewer?: { projectsV2?: { nodes?: Array<{ id: string; title: string; shortDescription?: string }> } };
      };
    };

    const nodes = data.data?.viewer?.projectsV2?.nodes ?? [];

    return nodes
      .filter((p): p is { id: string; title: string; shortDescription?: string } => Boolean(p?.id && p?.title))
      .map((project) => ({
        id: project.id,
        title: project.title,
        description: project.shortDescription ?? null,
      }));
  } catch {
    return [];
  }
}
