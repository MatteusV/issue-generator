import { Pool } from "pg";

import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import type { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";

const DEFAULT_URL = "postgres://postgres:postgres@localhost:5434/vector";
const DEFAULT_SCHEMA = "public";

const tableNameFromRepo = (repoFullName: string) =>
  `vs_${repoFullName.replace(/[^a-zA-Z0-9]/g, "_")}`;

let pool: Pool | null = null;

function getPool() {
  if (pool) return pool;
  const connectionString = process.env.VECTOR_DB_URL ?? DEFAULT_URL;
  pool = new Pool({ connectionString });
  return pool;
}

async function ensureExtension() {
  const client = await getPool().connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "vector";');
  } finally {
    client.release();
  }
}

function getEmbeddings() {
  return new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    model: "text-embedding-3-small",
  });
}

async function getStore(repoFullName: string) {
  await ensureExtension();
  const tableName = tableNameFromRepo(repoFullName);

  return PGVectorStore.initialize(getEmbeddings(), {
    pool: getPool(),
    tableName,
    schema: process.env.VECTOR_DB_SCHEMA ?? DEFAULT_SCHEMA,
  });
}

export async function resetVectorStore(repoFullName: string) {
  const client = await getPool().connect();
  const tableName = tableNameFromRepo(repoFullName);
  const schema = process.env.VECTOR_DB_SCHEMA ?? DEFAULT_SCHEMA;
  try {
    await client.query(
      `DROP TABLE IF EXISTS "${schema}"."${tableName}" CASCADE;`,
    );
  } finally {
    client.release();
  }
}

export async function addDocuments(
  repoFullName: string,
  documents: Document<Record<string, unknown>>[],
) {
  const store = await getStore(repoFullName);
  await store.addDocuments(documents);
}

export async function similaritySearch(
  repoFullName: string,
  query: string,
  k = 6,
) {
  const store = await getStore(repoFullName);
  return store.similaritySearch(query, k);
}
