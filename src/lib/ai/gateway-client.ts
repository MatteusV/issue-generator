"use server";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionInput = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
};

type ChatCompletionResult =
  | { ok: true; content: string }
  | { ok: false; error: string };

const GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

export async function createChatCompletion(
  input: ChatCompletionInput,
): Promise<ChatCompletionResult> {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "AI_GATEWAY_API_KEY não configurada." };
  }

  try {
    const response = await fetch(`${GATEWAY_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model,
        messages: input.messages,
        temperature: input.temperature ?? 0.2,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        ok: false,
        error: text || "Falha ao chamar AI Gateway.",
      };
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return { ok: false, error: "Resposta vazia do AI Gateway." };
    }

    return { ok: true, content };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro inesperado.",
    };
  }
}
