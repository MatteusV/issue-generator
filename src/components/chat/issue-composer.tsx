"use client";

import * as React from "react";
import { AssigneeSelector } from "@/components/assignee-selector";
import { MarkdownPreview } from "@/components/markdown-preview";
import { ProjectSelect } from "@/components/project-select";
import { RepoSelect } from "@/components/repo-select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { chatIssue } from "@/server-actions/ai/chat-issue";
import { reindexRepo } from "@/server-actions/ai/reindex-repo";
import {
  type AssigneeOption,
  fetchRepoAssignees,
} from "@/server-actions/assignees";
import { createIssueOnGithub } from "@/server-actions/create-issue";
import type { ProjectOption } from "@/server-actions/projects";
import type { RepoOption } from "@/server-actions/repos";
import type { ChatMessage } from "@/types/chat";

type IssueComposerProps = {
  repositories: RepoOption[];
  projects: ProjectOption[];
};

export function IssueComposer({ repositories, projects }: IssueComposerProps) {
  const [repo, setRepo] = React.useState("");
  const [projectId, setProjectId] = React.useState<string | undefined>();
  const [description, setDescription] = React.useState("");
  const [result, setResult] = React.useState<{
    title: string;
    body: string;
    acceptanceCriteria: string[];
    labels: string[];
    steps: string[];
    raw?: string;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [isReindexing, startReindex] = React.useTransition();
  const [isCreating, startCreate] = React.useTransition();
  const { toast } = useToast();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [assignees, setAssignees] = React.useState<string[]>([]);
  const [assigneeOptions, setAssigneeOptions] = React.useState<
    AssigneeOption[]
  >([]);

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

      setResult({ ...response.data, raw: response.raw });
      const assistantContent = [
        `**${response.data.title}**`,
        "",
        response.data.body || response.raw,
        "",
        response.data.steps?.length
          ? `Steps:\n${response.data.steps.map((s) => `- ${s}`).join("\n")}`
          : "",
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
    setAssignees([]);
    setAssigneeOptions([]);
  }, []);

  const handleCreateIssue = React.useCallback(() => {
    if (!repo || !result) {
      toast({
        variant: "destructive",
        title: "Selecione repositório",
        description: "Gere a issue antes de criar no GitHub.",
      });
      return;
    }
    startCreate(async () => {
      const response = await createIssueOnGithub({
        repoFullName: repo,
        issue: result,
        projectId,
        assignees,
      });

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Erro ao criar issue",
          description: response.error,
        });
        return;
      }

      toast({
        title: "Issue criada",
        description: response.url,
      });
    });
  }, [repo, result, projectId, assignees, toast]);

  React.useEffect(() => {
    if (!repo) {
      setAssignees([]);
      setAssigneeOptions([]);
      return;
    }
    let cancelled = false;
    setIsLoadingAssignees(true);
    fetchRepoAssignees(repo).then((list) => {
      if (cancelled) return;
      setAssigneeOptions(list);
      setAssignees((prev) =>
        prev.filter((login) => list.some((u) => u.login === login)),
      );
      setIsLoadingAssignees(false);
    });
    return () => {
      cancelled = true;
    };
  }, [repo]);

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
      {assigneeOptions.length > 0 ? (
        <div className="space-y-2">
          <Label>Responsáveis</Label>
          <AssigneeSelector
            assignees={assigneeOptions}
            value={assignees}
            onChange={setAssignees}
          />
          <p className="text-xs text-foreground/60">
            Selecione uma ou mais pessoas para atribuir a issue.
          </p>
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="project">Projeto do GitHub</Label>
        <ProjectSelect
          projects={projects}
          value={projectId}
          onValueChange={setProjectId}
          id="project"
          placeholder="Selecione um projeto (opcional)"
        />
        <p className="text-xs text-foreground/60">
          Opcional: adiciona a issue criada ao projeto selecionado.
        </p>
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
        <Button
          type="button"
          disabled={!canSubmit || isPending}
          onClick={handleSubmit}
        >
          {isPending ? "Gerando..." : "Gerar Issue"}
        </Button>
        <Button type="button" variant="outline" onClick={handleClear}>
          Limpar Conversa
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!result || isCreating}
          onClick={handleCreateIssue}
        >
          {isCreating ? "Criando issue..." : "Criar no GitHub"}
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
            <p className="text-sm font-medium text-foreground">
              {result.title}
            </p>
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
