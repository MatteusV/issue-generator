export type IssueDraft = {
  title: string;
  body: string;
  acceptanceCriteria: string[];
  labels: string[];
  steps: string[];
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => String(item ?? "").trim())
    .filter((item) => item.length > 0);
}

export function normalizeIssueDraft(input: unknown): IssueDraft {
  const data = (input ?? {}) as Record<string, unknown>;
  const title = String(data.title ?? "").trim();
  const body = String(data.body ?? "").trim();

  return {
    title: title || "Issue sem título",
    body: body || "Sem detalhes fornecidos.",
    acceptanceCriteria: toStringArray(data.acceptanceCriteria),
    labels: toStringArray(data.labels),
    steps: toStringArray((data as Record<string, unknown>).steps),
  };
}
