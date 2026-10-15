"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, SendHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";

type InputBoxProps = {
  disabled?: boolean;
  placeholder?: string;
  onSend: (value: string) => Promise<void> | void;
};

export function InputBox({ disabled = false, placeholder = "Type a message…", onSend }: InputBoxProps) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedValue = value.trim();
    if (!trimmedValue || disabled) return;
    setIsSubmitting(true);
    try {
      await onSend(trimmedValue);
      setValue("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="flex items-center gap-2 rounded-xl border border-rb-border bg-white px-3 py-2 transition-all focus-within:border-[#3b2ae1] focus-within:ring-2 focus-within:ring-[rgba(59,42,225,0.1)]"
      onSubmit={handleSubmit}
    >
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        disabled={disabled || isSubmitting}
        className="h-9 border-0 bg-transparent px-2 text-base md:text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <button
        type="submit"
        disabled={disabled || isSubmitting || !value.trim()}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3b2ae1] text-white transition-colors hover:bg-[#2d1fc7] disabled:opacity-60"
        aria-label="Send message"
      >
        {isSubmitting ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <SendHorizontal className="h-4 w-4" />
        )}
      </button>
    </form>
  );
}