"use client";

import * as React from "react";

import { RepoSelect } from "@/components/repo-select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Textarea } from "@/components/ui/textarea";
import type { RepoOption } from "@/server-actions/repos";
import { generateIssue } from "@/server-actions/ai/generate-issue";
import { reindexRepo } from "@/server-actions/ai/reindex-repo";
import { useToast } from "@/components/ui/use-toast";
import { chatIssue } from "@/server-actions/ai/chat-issue";
import type { ChatMessage } from "@/types/chat";

type IssueComposerProps = {
  repositories: RepoOption[];
};

export function IssueComposer({ repositories }: IssueComposerProps) {
  const [repo, setRepo] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [result, setResult] = React.useState<{
    title: string;
    body: string;
    acceptanceCriteria: string[];
    labels: string[];
    steps: string[];
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [isReindexing, startReindex] = React.useTransition();
  const { toast } = useToast();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);

  const canSubmit = repo.length > 0 && description.trim().length > 0;

  const handleSubmit = React.useCallback(() => {
    setError(null);
    startTransition(async () => {
      setResult(null);
      const history = messages;
      const response = await chatIssue({
        repoFullName: repo,
        message: description,
        history,
      });

      if (!response.ok) {
        setError(response.error);
        toast({
          variant: "destructive",
          title: "Erro ao gerar issue",
          description: response.error,
        });
        setResult(null);
        return;
      }

      setResult(response.data);
      const assistantContent = [
        `**${response.data.title}**`,
        "",
        response.data.body,
        "",
        response.data.steps?.length ? `Steps:\n${response.data.steps.map((s) => `- ${s}`).join("\n")}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      setMessages((prev) => [
        ...prev,
        { role: "user", content: description },
        { role: "assistant", content: assistantContent },
      ]);
    });
  }, [repo, description, toast, messages]);

  const handleClear = React.useCallback(() => {
    setRepo("");
    setDescription("");
    setResult(null);
    setError(null);
    setMessages([]);
  }, []);

  const handleReindex = React.useCallback(() => {
    if (!repo) return;
    setError(null);
    startReindex(async () => {
      const response = await reindexRepo(repo);
      if (!response.ok) {
        setError(response.error);
        toast({
          variant: "destructive",
          title: "Erro ao atualizar contexto",
          description: response.error,
        });
        return;
      }
      toast({
        title: "Contexto atualizado",
        description: "Indexação concluída com sucesso.",
      });
    });
  }, [repo, toast]);

  return (
      <div className="space-y-4">
        {messages.length > 0 ? (
          <div className="space-y-3 rounded-md border border-foreground/10 bg-foreground/5 p-3">
            {messages.map((msg, idx) => (
              <div key={`${msg.role}-${idx}`} className="space-y-1">
                <div className="text-xs font-semibold text-foreground/60">
                  {msg.role === "user" ? "Você" : "Assistente"}
                </div>
                <div className="prose prose-sm prose-invert text-foreground/80">
                  <MarkdownPreview>{msg.content}</MarkdownPreview>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="repo">Repositório</Label>
          <div className="grid gap-2">
            <RepoSelect
              repositories={repositories}
            value={repo}
            onValueChange={setRepo}
            id="repo"
          />
          <p className="text-xs text-foreground/60">
            Apenas repositórios que você pode acessar aparecem aqui.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="prompt">Descrição da Demanda</Label>
        <Textarea
          id="prompt"
          name="prompt"
          placeholder="Ex.: Validar assignees e listar apenas repositórios permitidos…"
          autoComplete="off"
          className="min-h-[200px]"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={!canSubmit || isPending} onClick={handleSubmit}>
          {isPending ? "Gerando..." : "Gerar Issue"}
        </Button>
        <Button type="button" variant="outline" onClick={handleClear}>
          Limpar Conversa
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!repo || isReindexing}
          onClick={handleReindex}
        >
          {isReindexing ? "Atualizando contexto..." : "Atualizar contexto"}
        </Button>
      </div>
      {error ? (
        <div className="rounded-md border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm text-foreground/70">
          {error}
        </div>
      ) : null}
      {isReindexing ? (
        <div className="rounded-md border border-foreground/10 bg-foreground/5 px-3 py-2 text-xs text-foreground/60">
          Atualizando contexto…
        </div>
      ) : null}
      {result ? (
        <div className="space-y-3 rounded-md border border-foreground/10 bg-background p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
              Título sugerido
            </p>
            <p className="text-sm font-medium text-foreground">{result.title}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
              Descrição
            </p>
            <div className="prose prose-sm prose-invert text-foreground/80">
              <MarkdownPreview>{result.body}</MarkdownPreview>
            </div>
          </div>
          {result.acceptanceCriteria.length > 0 ? (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
                Critérios de aceite
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-foreground/80">
                {result.acceptanceCriteria.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.labels.length > 0 ? (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
                Labels sugeridas
              </p>
              <div className="flex flex-wrap gap-2">
                {result.labels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-foreground/10 bg-foreground/5 px-2 py-1 text-xs text-foreground/70"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {result.steps.length > 0 ? (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
                Passos sugeridos
              </p>
              <div className="prose prose-sm prose-invert text-foreground/80">
                <MarkdownPreview>{result.steps.join("\n")}</MarkdownPreview>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="rounded-md border border-foreground/10 bg-foreground/5 px-3 py-2 text-xs text-foreground/60">
        Dica: descreva o problema, o resultado esperado e o impacto.
      </div>
    </div>
  );
}
