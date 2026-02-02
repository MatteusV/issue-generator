type Progress = {
  total: number;
  processed: number;
  startedAt: number;
};

const progressMap = new Map<string, Progress>();

const keyFor = (repoFullName: string) => repoFullName.toLowerCase();

export function setReindexProgress(
  repoFullName: string,
  data: Partial<Omit<Progress, "startedAt">> & { total?: number; processed?: number },
) {
  const key = keyFor(repoFullName);
  const existing = progressMap.get(key) ?? {
    total: data.total ?? 0,
    processed: data.processed ?? 0,
    startedAt: Date.now(),
  };
  progressMap.set(key, {
    ...existing,
    ...data,
    startedAt: existing.startedAt,
  });
}

export function getReindexProgress(repoFullName: string): Progress | null {
  const entry = progressMap.get(keyFor(repoFullName));
  if (!entry) return null;
  return entry;
}

export function clearReindexProgress(repoFullName: string) {
  progressMap.delete(keyFor(repoFullName));
}
