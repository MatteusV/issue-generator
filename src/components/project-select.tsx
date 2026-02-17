"use client";

import {
  PromptInputSelect as Select,
  PromptInputSelectContent as SelectContent,
  PromptInputSelectItem as SelectItem,
  PromptInputSelectTrigger as SelectTrigger,
  PromptInputSelectValue as SelectValue,
} from "@/components/ai-elements/prompt-input";
import type { ProjectOption } from "@/server-actions/projects";

type ProjectSelectProps = {
  projects: ProjectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  id?: string;
  placeholder?: string;
};

export function ProjectSelect({
  projects,
  value,
  onValueChange,
  id = "project",
  placeholder = "Selecione um projeto",
}: ProjectSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {projects.length === 0 ? (
          <SelectItem value="empty" disabled>
            Nenhum projeto encontrado
          </SelectItem>
        ) : (
          projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.title}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
