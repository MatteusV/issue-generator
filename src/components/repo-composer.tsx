"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RepoSelect } from "@/components/repo-select";
import { Textarea } from "@/components/ui/textarea";
import type { RepoOption } from "@/server-actions/repos";

type RepoComposerProps = {
  repositories: RepoOption[];
};

export function RepoComposer({ repositories }: RepoComposerProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="repo">Repositório</Label>
        <div className="grid gap-2">
          <RepoSelect repositories={repositories} />
          <p className="text-xs text-foreground/60">
            Apenas repositórios que você pode acessar aparecem aqui.
          </p>
        </div>
      </div>
      <Label htmlFor="prompt">Descrição da Demanda</Label>
      <Textarea
        id="prompt"
        name="prompt"
        placeholder="Ex.: Validar assignees e listar apenas repositórios permitidos…"
        autoComplete="off"
        className="min-h-[200px]"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button">Gerar Issue</Button>
        <Button type="button" variant="outline">
          Limpar Conversa
        </Button>
      </div>
      <div className="rounded-md border border-foreground/10 bg-foreground/5 px-3 py-2 text-xs text-foreground/60">
        Dica: descreva o problema, o resultado esperado e o impacto.
      </div>
    </div>
  );
}
