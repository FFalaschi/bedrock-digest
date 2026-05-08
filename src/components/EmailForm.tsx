"use client";

import { useState, type FormEvent } from "react";

type FormState = "idle" | "loading" | "success" | "error";

export function EmailForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (new FormData(form).get("email") as string).trim();

    if (!email) return;
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setState("success");
      } else {
        const data = (await res.json()) as { error?: string };
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setState("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-6 py-5 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">
          Check your inbox
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          We sent a confirmation link. Click it to complete your subscription.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
      <input
        type="email"
        name="email"
        required
        placeholder="your@email.com"
        autoComplete="email"
        disabled={state === "loading"}
        className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {state === "loading" ? "Sending…" : "Subscribe free"}
      </button>
      {state === "error" && errorMsg && (
        <p className="w-full text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
      )}
    </form>
  );
}
