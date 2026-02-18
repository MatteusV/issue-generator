"use server";

import { auth } from "@/auth";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import { createChatCompletion } from "@/lib/ai/gateway-client";
import { fallbackIssueDraft, parseIssueDraft } from "@/lib/ai/parse";
import { buildIssuePrompt } from "@/lib/ai/prompt";
import { retrieveContext } from "@/lib/ai/retriever";
import { fetchRepoContext } from "@/server-actions/ai/fetch-repo-context";
import type { ChatMessage } from "@/types/chat";

type ChatIssueInput = {
  repoFullName: string;
  message: string;
  history: ChatMessage[];
  modelId?: string;
};

type ChatIssueResult =
  | { ok: true; data: ReturnType<typeof parseIssueDraft>; raw: string }
  | { ok: false; error: string };

export async function chatIssue(
  input: ChatIssueInput,
): Promise<ChatIssueResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  const repoFullName = input.repoFullName.trim();
  const description = input.message.trim();

  if (!repoFullName || !description) {
    return { ok: false, error: "Informe o repositório e a mensagem." };
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

  const modelId = input.modelId?.trim() || DEFAULT_MODEL_ID;

  const historyMessages: ChatMessage[] = input.history.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const completion = await createChatCompletion({
    model: modelId,
    messages: [
      { role: "system", content: system },
      ...historyMessages,
      { role: "user", content: user },
    ],
    temperature: 0.2,
  });

  if (!completion.ok) {
    return { ok: false, error: completion.error };
  }

  const issue = parseIssueDraft(completion.content);
  const filled =
    issue.title || issue.body
      ? issue
      : fallbackIssueDraft(completion.content);

  return { ok: true, data: filled, raw: completion.content };
}
