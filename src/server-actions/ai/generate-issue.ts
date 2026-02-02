"use server";

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { auth } from "@/auth";
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
    model: "gpt-4o-mini",
    temperature: 0.2,
  });

  const response = await model.invoke([
    new SystemMessage(system),
    new HumanMessage(user),
  ]);

  const content =
    typeof response.content === "string" ? response.content : "";
  const issue = parseIssueDraft(content);

  return { ok: true, data: issue };
}
