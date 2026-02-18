"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { AssigneeSelector } from "@/components/assignee-selector";
import { ProjectSelect } from "@/components/project-select";
import { RepoSelect } from "@/components/repo-select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useModelContext } from "@/contexts/model-context";
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
import { InputPrompt } from "../input-prompt";

type IssueComposerProps = {
  repositories: RepoOption[];
  projects: ProjectOption[];
};

export function IssueComposer({ repositories, projects }: IssueComposerProps) {
  const [repo, setRepo] = useState("");
  const [projectId, setProjectId] = useState<string | undefined>();
  const [description, setDescription] = useState("");
  const { models, modelId, setModelId, isLoading: isLoadingModels } =
    useModelContext();
  const [result, setResult] = useState<{
    title: string;
    body: string;
    acceptanceCriteria: string[];
    labels: string[];
    steps: string[];
    raw?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isReindexing, startReindex] = useTransition();
  const [isCreating, startCreate] = useTransition();
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(false);
  const [modelQuery, setModelQuery] = useState("");
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>([]);

  const canSubmit = repo.length > 0 && description.trim().length > 0;

  const normalizedModelQuery = modelQuery.trim().toLowerCase();
  const filteredModels = normalizedModelQuery
    ? models.filter((model) => {
        const haystack = `${model.label} ${model.id} ${model.provider ?? ""}`
          .toLowerCase();
        return haystack.includes(normalizedModelQuery);
      })
    : models;

  const handleSubmit = useCallback(
    (text: string) => {
      setError(null);
      startTransition(async () => {
        setResult(null);
        const history = messages;
        const response = await chatIssue({
          repoFullName: repo,
          message: text,
          history,
          modelId,
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
        const acceptanceCriteria = response.data.acceptanceCriteria?.length
          ? `## Critérios de aceite\n${response.data.acceptanceCriteria.map((item) => `- ${item}`).join("\n")}`
          : "";
        const labels = response.data.labels?.length
          ? `## Labels\n${response.data.labels.map((item) => `- ${item}`).join("\n")}`
          : "";
        const steps = response.data.steps?.length
          ? `## Passos\n${response.data.steps.map((s) => `- ${s}`).join("\n")}`
          : "";

        const assistantContent = [
          `# ${response.data.title}`,
          response.data.body || response.raw,
          acceptanceCriteria,
          labels,
          steps,
        ]
          .filter(Boolean)
          .join("\n\n");

        setMessages((prev) => [
          ...prev,
          { role: "user", content: text },
          { role: "assistant", content: assistantContent },
        ]);
      });
  },
    [repo, toast, messages, modelId],
  );

  const handleClear = useCallback(() => {
    setRepo("");
    setDescription("");
    setResult(null);
    setError(null);
    setMessages([]);
    setAssignees([]);
    setAssigneeOptions([]);
  }, []);

  const handleCreateIssue = useCallback(() => {
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

  useEffect(() => {
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

  const handleReindex = useCallback(() => {
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

  const handlePromptSubmit = useCallback(
    async ({ text }: PromptInputMessage) => {
      const trimmed = text.trim();
      if (!trimmed || !repo) {
        return;
      }
      handleSubmit(trimmed);
      setDescription("");
    },
    [repo, handleSubmit],
  );

  return (
    <div className="space-y-4">
      <Conversation className="rounded-md border border-foreground/10 bg-foreground/5">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Sem mensagens ainda"
              description="Selecione um repositório e descreva a demanda para gerar a issue."
            />
          ) : (
            messages.map((msg, idx) => (
              <Message
                key={`${msg.role}-${idx}`}
                from={msg.role === "user" ? "user" : "assistant"}
              >
                <MessageContent>
                  <MessageResponse>{msg.content}</MessageResponse>
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <PromptInput onSubmit={handlePromptSubmit}>
        <PromptInputHeader>
          <div className="flex w-full flex-col gap-4">
            <div className="grid w-full gap-3 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">
                Repositório
              </p>
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
              {isLoadingAssignees ? (
                <div className="rounded-md border border-foreground/10 bg-foreground/5 px-3 py-2 text-xs text-foreground/60">
                  Carregando responsáveis...
                </div>
              ) : assigneeOptions.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">
                    Responsáveis
                  </p>
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
            </div>
            <div className="grid w-full gap-3 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">
                Projeto do GitHub
              </p>
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
              <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">
                Modelo de IA
              </p>
              <PromptInputSelect
                value={modelId}
                onValueChange={setModelId}
                disabled={isLoadingModels}
              >
                <PromptInputSelectTrigger
                  id="model"
                  aria-label="Selecione um modelo"
                >
                  <PromptInputSelectValue
                    placeholder={
                      isLoadingModels
                        ? "Carregando modelos..."
                        : "Selecione um modelo"
                    }
                  />
                </PromptInputSelectTrigger>
                <PromptInputSelectContent position="popper" align="start" sideOffset={6}>
                  <div className="border-b border-foreground/10 p-2">
                    <Input
                      autoFocus
                      placeholder="Pesquisar modelo..."
                      value={modelQuery}
                      onChange={(event) => setModelQuery(event.target.value)}
                      onKeyDown={(event) => event.stopPropagation()}
                    />
                  </div>
                  {filteredModels.length === 0 ? (
                    <PromptInputSelectItem value="empty" disabled>
                      Nenhum modelo encontrado
                    </PromptInputSelectItem>
                  ) : (
                    filteredModels.map((model) => (
                      <PromptInputSelectItem key={model.id} value={model.id}>
                        {model.label}
                      </PromptInputSelectItem>
                    ))
                  )}
                </PromptInputSelectContent>
              </PromptInputSelect>
              <p className="text-xs text-foreground/60">
                Escolha o modelo que gera a issue.
              </p>
            </div>
            </div>
          </div>
        </PromptInputHeader>
        <PromptInputBody>
          <div className="p-4 w-full h-full">
            <PromptInputTextarea
              className="border rounded-2xl py-10 px-4"
              placeholder="Descreva o objetivo, contexto e critérios de aceite. Ex.: Implementar CRUD de usuários com autenticação, validações e testes."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools className="w-1/2 flex justify-between">
            <InputPrompt label="Limpar" onClick={handleClear} />

            <InputPrompt
              type="button"
              variant="secondary"
              disabled={!result || isCreating}
              onClick={handleCreateIssue}
              label={isCreating ? "Criando issue..." : "Criar no Github"}
            />

            <InputPrompt
              type="button"
              variant="ghost"
              disabled={!repo || isReindexing}
              onClick={handleReindex}
              label={
                isReindexing ? "Atualizando contexto..." : "Atualizar contexto"
              }
            />
          </PromptInputTools>
          <PromptInputSubmit
            disabled={!canSubmit || isPending}
            status={isPending ? "submitted" : "ready"}
          />
        </PromptInputFooter>
      </PromptInput>
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
      <div className="rounded-md border border-foreground/10 bg-foreground/5 px-3 py-2 text-xs text-foreground/60">
        Dica: descreva o problema, o resultado esperado e o impacto.
      </div>
    </div>
  );
}
