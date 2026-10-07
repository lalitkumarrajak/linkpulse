"use client";

import { XIcon } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

const normalise = (raw: string) =>
  raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

export function TagInput({
  value,
  onChange,
  suggestions = [],
  id,
  max = 10,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  id?: string;
  max?: number;
}) {
  const [draft, setDraft] = useState("");
  const listId = useId();

  function commit(raw: string) {
    const tag = normalise(raw);
    if (tag && !value.includes(tag) && value.length < max) onChange([...value, tag]);
    setDraft("");
  }

  return (
    <div
      className={cn(
        "flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-card px-2 py-1.5 shadow-xs focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20",
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-accent py-0.5 pr-1 pl-2 text-xs font-medium text-accent-foreground"
        >
          {tag}
          <button
            type="button"
            className="rounded p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            aria-label={`Remove tag ${tag}`}
          >
            <XIcon className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        list={listId}
        value={draft}
        onChange={(e) => {
          const v = e.target.value;
          if (v.endsWith(",")) commit(v.slice(0, -1));
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => draft && commit(draft)}
        placeholder={value.length ? "" : "Add tags — press Enter"}
        className="h-6 min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/80"
        disabled={value.length >= max}
      />
      <datalist id={listId}>
        {suggestions
          .filter((s) => !value.includes(s))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  );
}
