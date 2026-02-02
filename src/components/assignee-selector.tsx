"use client";

import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import type { AssigneeOption } from "@/server-actions/assignees";

type AssigneeSelectorProps = {
  assignees: AssigneeOption[];
  value: string[];
  onChange: (value: string[]) => void;
};

export function AssigneeSelector({ assignees, value, onChange }: AssigneeSelectorProps) {
  const handleToggle = (login: string) => {
    onChange(
      value.includes(login)
        ? value.filter((v) => v !== login)
        : [...value, login],
    );
  };

  if (assignees.length === 0) {
    return (
      <p className="text-xs text-foreground/60">
        Nenhum colaborador elegível encontrado para atribuição.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-h-40 overflow-auto rounded-md border border-foreground/10 p-2">
      {assignees.map((user) => (
        <label key={user.id} className="flex items-center gap-2 text-sm text-foreground/80">
          <Checkbox
            checked={value.includes(user.login)}
            onChange={() => handleToggle(user.login)}
            className="h-4 w-4"
          />
          <span className="truncate">
            {user.login}
            {user.name ? ` — ${user.name}` : ""}
          </span>
        </label>
      ))}
    </div>
  );
}
