"use server";

import { getReindexProgress } from "@/lib/reindex-progress";

export async function getReindexStatus(repoFullName: string) {
  return getReindexProgress(repoFullName);
}
