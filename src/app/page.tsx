import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signIn } from "@/auth";

async function handleLoginWithGithub() {
  "use server";
  await signIn("github");
}

const features = [
  "Acesso somente aos repositórios permitidos",
  "Indexação segura via GitHub API",
  "Geração de issues com validação por schema",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-center">
        <section className="flex-1 space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground/60">
              RF-01 · Autenticação
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Conecte sua conta GitHub
            </h1>
            <p className="max-w-xl text-base text-foreground/70">
              Inicie a criação de issues com IA autenticando sua conta. O acesso
              é controlado e limitado aos repositórios permitidos pela sua
              organização.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-foreground/70">
            {features.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/70" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="inline-flex items-center gap-3 rounded-full border border-foreground/10 bg-foreground/5 px-4 py-2 text-xs text-foreground/70">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Compatível com políticas organizacionais e auditoria interna.
          </div>
        </section>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Autenticar</CardTitle>
            <CardDescription>
              Informe o domínio corporativo e siga com o OAuth do GitHub.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="gh-domain">Domínio do GitHub</Label>
              <Input
                id="gh-domain"
                placeholder="https://github.suaempresa.com"
                autoComplete="url"
              />
              <p className="text-xs text-foreground/50">
                Use o domínio padrão do GitHub.com da sua organização.
              </p>
            </div>
            <Separator />
            <div className="space-y-3">
              <form action={handleLoginWithGithub}>
                <Button className="w-full" type="submit">
                  <GitHubIcon className="h-4 w-4" />
                  Continuar com GitHub
                </Button>
              </form>
              <p className="text-xs text-foreground/50">
                Ao continuar, você autoriza o acesso conforme as permissões
                aprovadas pelo seu time.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-2 text-xs text-foreground/50">
            <span>Precisa de ajuda? Fale com o time de plataforma.</span>
            <span>Logs de auditoria serão registrados automaticamente.</span>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.24c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.48 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.38-3.37-1.38-.45-1.18-1.11-1.49-1.11-1.49-.9-.64.07-.63.07-.63 1 .07 1.53 1.07 1.53 1.07.89 1.57 2.34 1.12 2.91.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.15-4.56-5.12 0-1.13.39-2.06 1.03-2.79-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.06A9.2 9.2 0 0 1 12 6.86c.85 0 1.71.12 2.51.35 1.9-1.34 2.75-1.06 2.75-1.06.55 1.41.2 2.45.1 2.71.64.73 1.03 1.66 1.03 2.79 0 3.98-2.35 4.86-4.58 5.11.36.32.68.95.68 1.92 0 1.39-.01 2.51-.01 2.85 0 .27.18.59.69.48A10.14 10.14 0 0 0 22 12.24C22 6.58 17.52 2 12 2z" />
    </svg>
  );
}
