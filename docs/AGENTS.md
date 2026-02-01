# Repository Guidelines

## Project Structure & Module Organization
- `src/app` contains the Next.js App Router entry points (`layout.tsx`, `page.tsx`) and global styles (`globals.css`).
- `public/` holds static assets served at the site root (e.g., `/globe.svg`).
- Root configs include `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`, and `biome.json`.

## Build, Test, and Development Commands
- `pnpm install`: install dependencies (this repo uses `pnpm-lock.yaml`).
- `pnpm dev`: run the Next.js dev server with HMR.
- `pnpm build`: create a production build.
- `pnpm start`: serve the production build locally.
- `pnpm lint`: run Biome checks.
- `pnpm format`: auto-format with Biome.

## Coding Style & Naming Conventions
- Formatting is enforced by Biome (`biome.json`) with 2-space indentation.
- TypeScript + React: components in `PascalCase`, hooks in `camelCase` prefixed with `use`.
- File naming follows Next.js conventions (`page.tsx`, `layout.tsx`) inside `src/app`.
- Tailwind CSS is enabled via `@import "tailwindcss"` in `src/app/globals.css`.

## Testing Guidelines
- No test framework or scripts are configured yet.
- If you add tests, prefer `*.test.ts` / `*.test.tsx` and either colocate under `src/` or add a `tests/` folder.
- Update `package.json` with a `test` script and document how to run it.

## Commit & Pull Request Guidelines
- Git history currently contains a single commit (“Initial commit from Create Next App”), so no established convention exists yet.
- Use short, imperative commit messages (e.g., “Add issue form validation”).
- PRs should include: a clear description, linked issue (if any), and UI screenshots for visual changes.
- Note any breaking changes and list local verification steps (e.g., `pnpm dev`, `pnpm lint`).

## Security & Configuration Tips
- Keep sensitive values out of the repo; use environment variables and document them in the PR.
- Review config changes in `next.config.ts` and `postcss.config.mjs` carefully, as they affect build and styling pipelines.
- LLM integration is designed for provider/model choice at runtime via LangChain; document any new provider setup in the PR.
