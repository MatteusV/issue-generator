"use server";

import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

import { auth } from "@/auth";
import { parseIssueDraft } from "@/lib/ai/parse";
import { buildIssuePrompt } from "@/lib/ai/prompt";
import { retrieveContext } from "@/lib/ai/retriever";
import { fetchRepoContext } from "@/server-actions/ai/fetch-repo-context";
import type { ChatMessage } from "@/types/chat";

type ChatIssueInput = {
  repoFullName: string;
  message: string;
  history: ChatMessage[];
};

type ChatIssueResult =
  | { ok: true; data: ReturnType<typeof parseIssueDraft> }
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

  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, error: "OPENAI_API_KEY não configurada." };
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

  const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-3.5-turbo",
    temperature: 0.2,
  });

  const historyMessages = input.history.map((msg) =>
    msg.role === "user"
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content),
  );

  const response = await model.invoke([
    new SystemMessage(system),
    ...historyMessages,
    new HumanMessage(user),
  ]);

  const content =
    typeof response.content === "string" ? response.content : "";
  const issue = parseIssueDraft(content);

  return { ok: true, data: issue };
}
