const SYSTEM_PROMPT = [
  "Você é um assistente que transforma descrições em issues claras para equipes de produto/engenharia.",
  "Retorne APENAS JSON válido (sem markdown fora do JSON, sem comentários).",
  "Campos obrigatórios: title (string), body (string), acceptanceCriteria (array de strings).",
  "Campos opcionais: labels (array de strings).",
  "O campo body deve estar em Markdown pronto para colar no GitHub (use headings, listas e trechos de código quando útil).",
  "O body deve ser conciso e incluir contexto, problema e resultado esperado.",
  "Analise o projeto com base nos trechos fornecidos, entenda o fluxo do repo e indique onde a mudança deve ocorrer.",
  "Sempre cite arquivos/caminhos reais vindos do contexto recuperado (ex.: src/app/header.tsx) ao sugerir alterações; não invente caminhos.",
  "Quando houver esquema de banco, migrations ou arquivos de ORM, identifique tabelas/colunas afetadas e inclua instruções explícitas (ex.: alterar coluna X em tabela Y no migration Z).",
  "Considere todos os arquivos de documentação (README, AGENTS, docs/*, *.md, *.mdx) como fonte primária de contexto para entender regras do projeto.",
  "Sempre inclua um campo steps (array) com a lista ordenada de passos para executar a demanda; cada item deve ser texto em Markdown citando arquivos e contexto do repositório.",
].join(" ");

type RepoContext = {
  description?: string;
  topics?: string[];
  languages?: string[];
  readmeExcerpt?: string;
};

export function buildIssuePrompt(
  repoFullName: string,
  description: string,
  context?: RepoContext,
  retrieved?: Array<{
    path: string;
    startLine: number;
    endLine: number;
    content: string;
  }>,
) {
  const contextLines = [];

  if (context?.description) {
    contextLines.push(`Descrição do repo: ${context.description}`);
  }
  if (context?.topics?.length) {
    contextLines.push(`Tópicos: ${context.topics.join(", ")}`);
  }
  if (context?.languages?.length) {
    contextLines.push(`Linguagens: ${context.languages.join(", ")}`);
  }
  if (context?.readmeExcerpt) {
    contextLines.push(`Trecho do README:\n${context.readmeExcerpt}`);
  }

  const retrievedText =
    retrieved && retrieved.length
      ? retrieved
          .map(
            (item) =>
              `Arquivo: ${item.path}:${item.startLine}-${item.endLine}\n${item.content}`,
          )
          .join("\n---\n")
      : "";

  const userPrompt = [
    `Repositório: ${repoFullName}`,
    `Descrição do usuário: ${description}`,
    contextLines.length ? "\nContexto do repositório:\n" + contextLines.join("\n") : "",
    retrievedText ? "\nTrechos relevantes:\n" + retrievedText : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { system: SYSTEM_PROMPT, user: userPrompt };
}
