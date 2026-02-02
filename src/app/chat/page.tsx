import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IssueComposer } from "@/components/chat/issue-composer";
import { handleLogout } from "@/server-actions/logout";
import { fetchUserRepos } from "@/server-actions/repos";

const sampleMessages = [
  {
    role: "Sistema",
    content:
      "Explique o problema, o resultado esperado e o impacto. Posso sugerir critérios de aceite.",
    time: "Agora",
  },
  {
    role: "Você",
    content:
      "Precisamos gerar issues a partir de linguagem natural para o repo X, com validação por schema.",
    time: "Agora",
  },
];

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const repositories = await fetchUserRepos(session.accessToken);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/60">
              Chat de Demandas
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Transforme Solicitações em Issues Claras
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="min-w-0 max-w-xs truncate rounded-full border border-foreground/10 bg-foreground/5 px-4 py-2 text-xs text-foreground/70"
              title={session.user.name ?? session.user.email ?? "Usuário"}
            >
              Conectado como {session.user.name ?? session.user.email ?? "Usuário"}
            </div>
            <form action={handleLogout}>
              <Button type="submit" variant="outline" size="sm">
                Sair da Conta
              </Button>
            </form>
          </div>
        </header>

        <main id="main-content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversa</CardTitle>
              <CardDescription>
                Responda ao assistente para gerar uma issue alinhada com o time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {sampleMessages.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-foreground/20 p-4 text-sm text-foreground/60">
                    Nenhuma conversa iniciada ainda.
                  </div>
                ) : (
                  <div className="space-y-4 rounded-lg border border-foreground/10 bg-foreground/5 p-4">
                    {sampleMessages.map((message) => (
                      <div key={`${message.role}-${message.content}`}>
                        <div className="flex items-center justify-between text-xs text-foreground/60">
                          <span className="font-medium text-foreground/80">
                            {message.role}
                          </span>
                          <span>{message.time}</span>
                        </div>
                        <p className="mt-2 break-words text-sm text-foreground/80">
                          {message.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <IssueComposer repositories={repositories} />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
