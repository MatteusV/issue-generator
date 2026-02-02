"use server";

import { auth } from "@/auth";
import type { IssueDraft } from "@/lib/ai/schema";

type CreateIssueInput = {
  repoFullName: string;
  issue: IssueDraft;
  projectId?: string | null;
  assignees?: string[];
};

type CreateIssueResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

function buildIssueBody(issue: IssueDraft) {
  const parts: string[] = [];

  parts.push("## Descrição & contexto do repositório");
  parts.push(issue.body || "Sem descrição.");

  if (issue.steps.length > 0) {
    parts.push("\n## Passos sugeridos");
    parts.push(issue.steps.map((s) => `- ${s}`).join("\n"));
  }

  if (issue.acceptanceCriteria.length > 0) {
    parts.push("\n## Critérios de aceite");
    parts.push(issue.acceptanceCriteria.map((c) => `- ${c}`).join("\n"));
  }

  return parts.filter(Boolean).join("\n");
}

export async function createIssueOnGithub(
  input: CreateIssueInput,
): Promise<CreateIssueResult> {
  const session = await auth();
  const accessToken = session?.accessToken;

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
          body: buildIssueBody(input.issue),
          labels: input.issue.labels,
          assignees: input.assignees,
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
