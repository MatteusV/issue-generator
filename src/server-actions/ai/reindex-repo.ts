"use server";

import { auth } from "@/auth";
import { chunkText } from "@/lib/indexer/chunker";
import { fetchFileContent, listRepoFiles } from "@/lib/indexer/files";
import {
  clearReindexProgress,
  setReindexProgress,
} from "@/lib/reindex-progress";
import { addDocuments, resetVectorStore } from "@/lib/vector-store";

type ReindexResult =
  | { ok: true; indexed: number }
  | { ok: false; error: string };

const CONCURRENCY = 3;

export async function reindexRepo(
  repoFullName: string,
): Promise<ReindexResult> {
  const startedAt = Date.now();
  console.log(`[reindex] start repo=${repoFullName}`);

  const session = await auth();
  const accessToken = session?.accessToken ?? process.env.GITHUB_TOKEN;
  if (!accessToken) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, error: "OPENAI_API_KEY não configurada." };
  }

  const files = await listRepoFiles(accessToken, repoFullName);
  console.log(
    `[reindex] repo=${repoFullName} filesFiltered=${files.length} elapsedMs=${
      Date.now() - startedAt
    }`,
  );

  if (files.length === 0) {
    return { ok: false, error: "Nenhum arquivo elegível para indexação." };
  }

  await resetVectorStore(repoFullName);
  setReindexProgress(repoFullName, {
    total: files.length,
    processed: 0,
  });

  let totalChunks = 0;
  const documents: {
    pageContent: string;
    metadata: Record<string, unknown>;
  }[] = [];

  async function processFile(index: number) {
    const file = files[index];
    const fetchStart = Date.now();
    console.log(
      `[reindex] repo=${repoFullName} fetchFile start path=${file.path} (${index + 1}/${
        files.length
      })`,
    );
    let content = "";
    try {
      content = await fetchFileContent(accessToken, file.url);
    } catch (error) {
      console.error(
        `[reindex] repo=${repoFullName} fetch error path=${file.path} ${String(error)}`,
      );
      setReindexProgress(repoFullName, {
        processed: index + 1,
      });
      return;
    }
    const fetchElapsed = Date.now() - fetchStart;

    if (!content) {
      console.log(
        `[reindex] repo=${repoFullName} fetchFile empty path=${file.path} elapsedMs=${fetchElapsed}`,
      );
      setReindexProgress(repoFullName, {
        processed: index + 1,
      });
      return;
    }

    const chunks = chunkText(file.path, content);
    if (chunks.length === 0) {
      console.log(
        `[reindex] repo=${repoFullName} chunk=0 path=${file.path} fetchMs=${fetchElapsed}`,
      );
      setReindexProgress(repoFullName, {
        processed: index + 1,
      });
      return;
    }

    const embedStart = Date.now();
    console.log(
      `[reindex] repo=${repoFullName} enqueue chunks path=${file.path} chunks=${chunks.length}`,
    );

    totalChunks += chunks.length;
    documents.push(
      ...chunks.map((chunk) => ({
        pageContent: chunk.content,
        metadata: {
          path: chunk.path,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
        },
      })),
    );

    console.log(
      `[reindex] repo=${repoFullName} done path=${file.path} chunks=${chunks.length} fetchMs=${fetchElapsed} elapsedMs=${Date.now() - startedAt}`,
    );

    setReindexProgress(repoFullName, {
      processed: index + 1,
    });
  }

  let cursor = 0;
  async function worker() {
    while (cursor < files.length) {
      const index = cursor;
      cursor += 1;
      await processFile(index);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, files.length) }, worker);
  try {
    await Promise.all(workers);
  } catch (error) {
    console.error(`[reindex] repo=${repoFullName} worker error`, error);
    clearReindexProgress(repoFullName);
    return { ok: false, error: "Falha ao indexar arquivos (rede/GitHub)." };
  }

  const embedStart = Date.now();
  console.log(
    `[reindex] repo=${repoFullName} embedding start totalChunks=${totalChunks}`,
  );
  try {
    await addDocuments(repoFullName, documents);
  } catch (error) {
    console.error(`[reindex] repo=${repoFullName} embedding error`, error);
    clearReindexProgress(repoFullName);
    return { ok: false, error: "Falha ao salvar embeddings (banco/vector)." };
  }
  console.log(
    `[reindex] repo=${repoFullName} embedding done totalChunks=${totalChunks} embedMs=${
      Date.now() - embedStart
    }`,
  );

  console.log(
    `[reindex] done repo=${repoFullName} chunks=${totalChunks} elapsedMs=${
      Date.now() - startedAt
    }`,
  );

  clearReindexProgress(repoFullName);

  return { ok: true, indexed: totalChunks };
}
