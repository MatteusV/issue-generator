"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { ModelOption } from "@/lib/ai/models";
import { DEFAULT_MODEL_ID, FALLBACK_MODEL_OPTIONS } from "@/lib/ai/models";

type ModelContextValue = {
  models: ModelOption[];
  isLoading: boolean;
  error: string | null;
  modelId: string;
  setModelId: (value: string) => void;
};

const ModelContext = createContext<ModelContextValue | null>(null);

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [models, setModels] = useState<ModelOption[]>(FALLBACK_MODEL_OPTIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/models");
        if (!response.ok) {
          throw new Error("Falha ao carregar modelos.");
        }
        const data = (await response.json()) as {
          models?: ModelOption[];
          defaultModelId?: string;
        };

        if (cancelled) return;

        const nextModels =
          Array.isArray(data.models) && data.models.length > 0
            ? data.models
            : FALLBACK_MODEL_OPTIONS;
        setModels(nextModels);

        const nextDefault = data.defaultModelId || DEFAULT_MODEL_ID;
        setModelId((current) => current || nextDefault);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setModels(FALLBACK_MODEL_OPTIONS);
        setError(err instanceof Error ? err.message : "Erro ao carregar modelos.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ models, isLoading, error, modelId, setModelId }),
    [models, isLoading, error, modelId],
  );

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
}

export function useModelContext() {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error("useModelContext must be used within <ModelProvider />");
  }
  return context;
}
