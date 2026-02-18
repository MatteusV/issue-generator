"use server";

import { auth } from "@/auth";
import { createChatCompletion } from "@/lib/ai/gateway-client";
import { parseIssueDraft } from "@/lib/ai/parse";
import { buildIssuePrompt } from "@/lib/ai/prompt";
import { retrieveContext } from "@/lib/ai/retriever";
import { fetchRepoContext } from "@/server-actions/ai/fetch-repo-context";

type GenerateIssueInput = {
  repoFullName: string;
  description: string;
};

type GenerateIssueResult =
  | { ok: true; data: ReturnType<typeof parseIssueDraft> }
  | { ok: false; error: string };

export async function generateIssue(
  input: GenerateIssueInput,
): Promise<GenerateIssueResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  const repoFullName = input.repoFullName.trim();
  const description = input.description.trim();

  if (!repoFullName || !description) {
    return { ok: false, error: "Informe o repositório e a descrição." };
  }

  if (!process.env.AI_GATEWAY_API_KEY) {
    return { ok: false, error: "AI_GATEWAY_API_KEY não configurada." };
  }

  const repoContext =
    session.accessToken && repoFullName
      ? await fetchRepoContext(session.accessToken, repoFullName)
      : undefined;

  const retrievedChunks =
    repoFullName && description
      ? await retrieveContext(repoFullName, description)
      : [];

  const { system, user } = buildIssuePrompt(
    repoFullName,
    description,
    repoContext,
    retrievedChunks,
  );

  const completion = await createChatCompletion({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.2,
  });

  if (!completion.ok) {
    return { ok: false, error: completion.error };
  }

  const issue = parseIssueDraft(completion.content);

  return { ok: true, data: issue };
}
