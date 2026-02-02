import { NextResponse } from "next/server";

import { getReindexProgress } from "@/lib/reindex-progress";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get("repo");

  if (!repo) {
    return NextResponse.json({ error: "repo is required" }, { status: 400 });
  }

  const progress = getReindexProgress(repo);

  if (!progress) {
    return NextResponse.json({ total: 0, processed: 0 });
  }

  return NextResponse.json({
    total: progress.total,
    processed: progress.processed,
    startedAt: progress.startedAt,
  });
}
