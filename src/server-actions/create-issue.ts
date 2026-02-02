"use server";

import { auth } from "@/auth";
import type { IssueDraft } from "@/lib/ai/schema";

type CreateIssueInput = {
  repoFullName: string;
  issue: IssueDraft;
  projectId?: string | null;
};

type CreateIssueResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createIssueOnGithub(
  input: CreateIssueInput,
): Promise<CreateIssueResult> {
  const session = await auth();
  const accessToken = session?.accessToken ?? process.env.GITHUB_TOKEN;

  if (!accessToken) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  const [owner, repo] = input.repoFullName.split("/");
  if (!owner || !repo) {
    return { ok: false, error: "Repositório inválido." };
  }

  try {
    const createResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
          title: input.issue.title,
          body: input.issue.body,
          labels: input.issue.labels,
        }),
      },
    );

    if (!createResponse.ok) {
      return { ok: false, error: "Falha ao criar issue no GitHub." };
    }

    const created = (await createResponse.json()) as {
      html_url: string;
      node_id: string;
    };

    if (input.projectId) {
      await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
          query: `mutation AddIssueToProject($projectId: ID!, $contentId: ID!) {
            addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
              item { id }
            }
          }`,
          variables: {
            projectId: input.projectId,
            contentId: created.node_id,
          },
        }),
      });
    }

    return { ok: true, url: created.html_url };
  } catch (error) {
    console.error("[createIssueOnGithub] error", error);
    return { ok: false, error: "Erro inesperado ao criar issue." };
  }
}
