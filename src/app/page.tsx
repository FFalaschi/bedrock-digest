import { EmailForm } from "@/components/EmailForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-zinc-950">
      <div className="w-full max-w-xl">
        {/* Eyebrow — placeholder copy, CEO will replace */}
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Weekly digest
        </p>

        {/* Headline — placeholder copy, CEO will replace */}
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Product Design × AI,{" "}
          <span className="text-zinc-400 dark:text-zinc-500">curated weekly.</span>
        </h1>

        <p className="mt-5 text-lg leading-relaxed text-zinc-500 dark:text-zinc-400">
          Every week we surface the most useful Product Design news from the AI
          space and deliver it straight to your inbox — no noise, no fluff.
        </p>

        <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-600">
          Join practitioners staying ahead of the curve.
        </p>

        <div className="mt-8">
          <EmailForm />
        </div>

        <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-600">
          Free. One email per week. Unsubscribe any time.
        </p>
      </div>
    </main>
  );
}
