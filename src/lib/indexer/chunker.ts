type ChunkOptions = {
  size?: number;
  overlap?: number;
};

export type TextChunk = {
  id: string;
  content: string;
  path: string;
  startLine: number;
  endLine: number;
};

const DEFAULT_SIZE = 800;
const DEFAULT_OVERLAP = 160;

export function chunkText(
  path: string,
  content: string,
  { size = DEFAULT_SIZE, overlap = DEFAULT_OVERLAP }: ChunkOptions = {},
): TextChunk[] {
  if (!content.trim()) return [];

  const chunks: TextChunk[] = [];
  let cursor = 0;
  const lines = content.split("\n");

  while (cursor < lines.length) {
    const window = lines.slice(cursor, cursor + size);
    const chunkText = window.join("\n").trim();

    if (chunkText) {
      const start = cursor + 1;
      const end = cursor + window.length;
      chunks.push({
        id: `${path}:${start}-${end}`,
        content: chunkText,
        path,
        startLine: start,
        endLine: end,
      });
    }

    if (cursor + size >= lines.length) break;
    cursor += size - overlap;
  }

  return chunks;
}
