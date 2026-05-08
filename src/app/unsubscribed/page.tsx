import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ success?: string; already?: string; error?: string }>;
}

export default async function UnsubscribedPage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (params.success) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 dark:bg-zinc-950">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Unsubscribed
          </h1>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">
            You&apos;ve been removed from Bedrock Digest. You won&apos;t hear
            from us again.
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
            Already unsubscribed
          </h1>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">
            You&apos;re already off the list.
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 dark:bg-zinc-950">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Invalid link
        </h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">
          This unsubscribe link is invalid or has already been used.
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
