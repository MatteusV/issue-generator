export type ModelOption = {
  id: string;
  label: string;
  provider?: string;
};

export const DEFAULT_MODEL_ID = "gpt-4o-mini";

export const FALLBACK_MODEL_OPTIONS: ModelOption[] = [
  { id: "gpt-4o-mini", label: "GPT-4o mini", provider: "openai" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 mini", provider: "openai" },
  { id: "gpt-4.1", label: "GPT-4.1", provider: "openai" },
  {
    id: "claude-3-5-sonnet-latest",
    label: "Claude 3.5 Sonnet",
    provider: "anthropic",
  },
  {
    id: "claude-3-5-haiku-latest",
    label: "Claude 3.5 Haiku",
    provider: "anthropic",
  },
];
