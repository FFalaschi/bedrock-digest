import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ success?: string; already?: string; error?: string }>;
}

export default async function ConfirmPage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (params.success) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 dark:bg-zinc-950">
        <div className="max-w-md text-center">
          <div className="mb-6 text-4xl">✓</div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            You&apos;re confirmed
          </h1>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">
            Welcome to Bedrock Digest. You&apos;ll receive the next issue when
            it drops.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block text-sm text-zinc-400 underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  if (params.already) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 dark:bg-zinc-950">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Already confirmed
          </h1>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">
            Your subscription is active. No further action needed.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block text-sm text-zinc-400 underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  // error or missing token
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 dark:bg-zinc-950">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Invalid or expired link
        </h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">
          This confirmation link is invalid or has already been used. If you
          signed up recently, try subscribing again and we&apos;ll send a fresh
          link.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block text-sm text-zinc-400 underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
