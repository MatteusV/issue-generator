# Documentação de Estilização (shadcn-ui)

## Princípios
- Priorize clareza, consistência e acessibilidade. Componentes devem comunicar estado e hierarquia visual de forma imediata.
- Use padrões do shadcn-ui para garantir previsibilidade: layout simples, tipografia legível e feedback explícito.

## Base do Sistema
- Tailwind CSS v4 está habilitado em `src/app/globals.css` via `@import "tailwindcss"`.
- Tokens vivem em CSS variables (`:root`) e são expostos no bloco `@theme inline`.
- O alias `@/*` aponta para `src/*` (ver `tsconfig.json`).

## Componentes shadcn-ui
- Componentes de UI devem ficar em `src/components/ui` (ex.: `src/components/ui/button.tsx`).
- Componentes de composição/página permanecem em `src/app` ou `src/components`.
- Prefira classes utilitárias e variantes do próprio componente para manter consistência.

Exemplo de uso:
```tsx
import { Button } from "@/components/ui/button";

<Button variant="default">Gerar issue</Button>
```

## Tipografia e Hierarquia
- Títulos curtos e diretos; use escalas claras (ex.: `text-2xl` para títulos de seção, `text-base` para corpo).
- Evite blocos densos; prefira parágrafos curtos e listas.

## Cores, Contraste e Estados
- Use tokens de cor (`--background`, `--foreground`) e variações do shadcn-ui para manter contraste.
- Sempre forneça estados `hover`, `focus-visible`, `disabled` e `error`.
- Mensagens de erro devem dizer o que aconteceu e como corrigir.

## Espaçamento e Layout
- Padronize espaçamentos com escala Tailwind (ex.: `gap-4`, `p-6`).
- Evite alinhamentos ambíguos: use grids simples e colunas previsíveis.
- Em telas pequenas, priorize uma coluna e botões full-width quando apropriado.

## Acessibilidade
- Use `aria-*` apenas quando necessário; prefira labels visíveis.
- Garanta foco visível em componentes interativos (`focus-visible:ring`).
- Não dependa só de cor para estado (ex.: erro + ícone + texto).

## Ícones e Mídia
- Ícones devem reforçar significado, nunca substituir texto crítico.
- Tamanho consistente e alinhado à linha de base do texto.

## Animações e Feedback
- Animações devem ser sutis e funcionais (carregamento, transições curtas).
- Evite animações longas que atrasem tarefas.

## Boas Práticas de Implementação
- Evite estilos globais novos; prefira escopo por componente.
- Reutilize componentes shadcn-ui antes de criar variações customizadas.
- Documente novas variantes no próprio componente.
