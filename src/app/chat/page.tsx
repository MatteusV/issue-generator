import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { IssueComposer } from "@/components/chat/issue-composer";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { handleLogout } from "@/server-actions/logout";
import { fetchUserProjects } from "@/server-actions/projects";
import { fetchUserRepos } from "@/server-actions/repos";

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const [repositories, projects] = await Promise.all([
    fetchUserRepos(session.accessToken),
    fetchUserProjects(),
  ]);

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
              Conectado como{" "}
              {session.user.name ?? session.user.email ?? "Usuário"}
            </div>
            <form action={handleLogout}>
              <Button type="submit" variant="outline" size="sm">
                Sair da Conta
              </Button>
            </form>
            <ThemeToggle />
          </div>
        </header>

        <main id="main-content" className="space-y-6">
          <IssueComposer repositories={repositories} projects={projects} />
        </main>
      </div>
    </div>
  );
}
