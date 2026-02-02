import { normalizeIssueDraft, type IssueDraft } from "@/lib/ai/schema";

function extractJsonPayload(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : "";
}

export function parseIssueDraft(text: string): IssueDraft {
  const payload = extractJsonPayload(text);

  if (!payload) {
    return normalizeIssueDraft({});
  }

  try {
    const parsed = JSON.parse(payload) as unknown;
    return normalizeIssueDraft(parsed);
  } catch {
    return normalizeIssueDraft({});
  }
}
