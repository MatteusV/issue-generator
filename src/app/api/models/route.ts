import { NextResponse } from "next/server";

import { DEFAULT_MODEL_ID, FALLBACK_MODEL_OPTIONS } from "@/lib/ai/models";

export const revalidate = 3600;

type ModelApiItem = {
  id?: string;
  owned_by?: string;
  provider?: string;
};

const normalizeLabel = (id: string) =>
  id
    .replace(/[-_/]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

export async function GET() {
  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/models", {
      next: { revalidate },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          models: FALLBACK_MODEL_OPTIONS,
          defaultModelId: DEFAULT_MODEL_ID,
        },
        { status: 200 },
      );
    }

    const data = (await response.json()) as { data?: ModelApiItem[] };
    const models = Array.isArray(data?.data) ? data.data : [];

    const normalized = models
      .map((model) => {
        const id = model.id?.trim();
        if (!id) return null;
        return {
          id,
          label: normalizeLabel(id),
          provider: model.provider ?? model.owned_by ?? "unknown",
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      models: normalized,
      defaultModelId: DEFAULT_MODEL_ID,
    });
  } catch {
    return NextResponse.json(
      {
        models: FALLBACK_MODEL_OPTIONS,
        defaultModelId: DEFAULT_MODEL_ID,
      },
      { status: 200 },
    );
  }
}
