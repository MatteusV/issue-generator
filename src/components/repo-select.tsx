"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from "@/components/ui/select";
import type { RepoOption } from "@/server-actions/repos";

const PAGE_SIZE = 10;

type RepoSelectProps = {
  repositories: RepoOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  id?: string;
  placeholder?: string;
};

export function RepoSelect({
  repositories,
  value: controlledValue,
  onValueChange,
  id = "repo",
  placeholder = "Selecione um repositório",
}: RepoSelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string>();
  const [query, setQuery] = React.useState("");
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);

  const value = controlledValue ?? uncontrolledValue;
  const normalizedQuery = query.trim().toLowerCase();

  const filteredRepositories = React.useMemo(() => {
    if (!normalizedQuery) {
      return repositories;
    }

    return repositories.filter((repo) =>
      repo.fullName.toLowerCase().includes(normalizedQuery),
    );
  }, [repositories, normalizedQuery]);

  const visibleRepositories = React.useMemo(
    () => filteredRepositories.slice(0, visibleCount),
    [filteredRepositories, visibleCount],
  );

  const handleValueChange = React.useCallback(
    (nextValue: string) => {
      setUncontrolledValue(nextValue);
      onValueChange?.(nextValue);
    },
    [onValueChange],
  );

  const handleOpenChange = React.useCallback((open: boolean) => {
    if (open) {
      setVisibleCount(PAGE_SIZE);
    }
  }, []);

  const handleQueryChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
      setVisibleCount(PAGE_SIZE);
    },
    [],
  );

  const handleScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const element = event.currentTarget;
      const remaining =
        element.scrollHeight - element.scrollTop - element.clientHeight;

      if (remaining < 24) {
        setVisibleCount((count) =>
          Math.min(count + PAGE_SIZE, filteredRepositories.length),
        );
      }
    },
    [filteredRepositories.length],
  );

  return (
    <Select
      value={value}
      onValueChange={handleValueChange}
      onOpenChange={handleOpenChange}
    >
      <SelectTrigger id={id} aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="p-0">
        <div className="border-b border-foreground/10 p-2">
          <Input
            autoFocus
            placeholder="Pesquisar repositório..."
            value={query}
            onChange={handleQueryChange}
            onKeyDown={(event) => event.stopPropagation()}
          />
        </div>
        <SelectViewport className="max-h-64" onScroll={handleScroll}>
          {filteredRepositories.length === 0 ? (
            <SelectItem value="empty" disabled>
              Nenhum repositório encontrado
            </SelectItem>
          ) : (
            visibleRepositories.map((repo) => (
              <SelectItem key={repo.id} value={repo.fullName}>
                {repo.fullName}
                {repo.isPrivate ? " (privado)" : ""}
              </SelectItem>
            ))
          )}
        </SelectViewport>
      </SelectContent>
    </Select>
  );
}
