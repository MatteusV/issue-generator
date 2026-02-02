import { similaritySearch } from "@/lib/vector-store";

export type RetrievedChunk = {
  content: string;
  path: string;
  startLine: number;
  endLine: number;
};

const TOP_K = 6;
const TOP_K_SCHEMA = 4;

export async function retrieveContext(
  repoFullName: string,
  query: string,
): Promise<RetrievedChunk[]> {
  const primary = await similaritySearch(repoFullName, query, TOP_K);
  const schemaBoost = await similaritySearch(
    repoFullName,
    `${query} schema tables database prisma migration sql column`,
    TOP_K_SCHEMA,
  );

  const merged = [...primary, ...schemaBoost];

  const deduped = merged.reduce<RetrievedChunk[]>((acc, doc) => {
    const key = `${doc.metadata.path}:${doc.metadata.startLine}-${doc.metadata.endLine}`;
    if (acc.some((item) => `${item.path}:${item.startLine}-${item.endLine}` === key)) {
      return acc;
    }
    acc.push({
      content: doc.content,
      path: (doc.metadata.path as string) ?? "",
      startLine: (doc.metadata.startLine as number) ?? 0,
      endLine: (doc.metadata.endLine as number) ?? 0,
    });
    return acc;
  }, []);

  return deduped;
}
