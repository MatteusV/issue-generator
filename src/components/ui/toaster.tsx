"use client";

import { cn } from "@/lib/utils";
import { useToast } from "./use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-3 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "w-full max-w-sm rounded-lg border px-4 py-3 shadow-md",
            toast.variant === "destructive"
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-foreground/15 bg-background text-foreground",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              {toast.title ? (
                <p className="text-sm font-semibold">{toast.title}</p>
              ) : null}
              {toast.description ? (
                <p className="mt-1 text-sm text-foreground/70">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="text-sm text-foreground/60 hover:text-foreground"
              onClick={() => dismiss(toast.id)}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
