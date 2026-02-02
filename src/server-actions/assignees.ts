"use server";

import { auth } from "@/auth";

export type AssigneeOption = {
  id: string;
  login: string;
  name?: string | null;
};

const ASSIGNEES_QUERY = /* GraphQL */ `
  query RepoAssignable($owner: String!, $name: String!, $first: Int = 30) {
    repository(owner: $owner, name: $name) {
      assignableUsers(first: $first) {
        nodes {
          id
          login
          name
        }
      }
    }
  }
`;

export async function fetchRepoAssignees(repoFullName: string): Promise<AssigneeOption[]> {
  const session = await auth();
  const accessToken = session?.accessToken;
  if (!accessToken) return [];

  const [owner, name] = repoFullName.split("/");
  if (!owner || !name) return [];

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        query: ASSIGNEES_QUERY,
        variables: { owner, name },
      }),
    });

    if (!response.ok) return [];

    const data = (await response.json()) as {
      data?: {
        repository?: { assignableUsers?: { nodes?: Array<{ id: string; login: string; name?: string }> } };
      };
    };

    const nodes = data.data?.repository?.assignableUsers?.nodes ?? [];
    return nodes
      .filter((u): u is { id: string; login: string; name?: string } => Boolean(u?.id && u?.login))
      .map((u) => ({ id: u.id, login: u.login, name: u.name ?? null }));
  } catch {
    return [];
  }
}
