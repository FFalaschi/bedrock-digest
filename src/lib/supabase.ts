import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type SubscriberStatus = "pending" | "active" | "unsubscribed";

export interface Subscriber {
  id: string;
  encrypted_email: string;
  email_hash: string;
  status: SubscriberStatus;
  source: string;
  confirm_token_hash: string | null;
  unsubscribe_token_hash: string;
  created_at: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
}

export type SubscriberInsert = Omit<Subscriber, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

// Prefer service_role key; fall back to anon key for local dev without RLS.
function buildClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env["SUPABASE_URL"];
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??
    process.env.SUPABASE_ANON_KEY ??
    process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set"
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// Server-side only — never import in client components
export function supabaseAdmin(): SupabaseClient {
  return buildClient();
}

// Alias for pipeline code
export const getSupabaseServiceClient = supabaseAdmin;

// ── Typed wrappers for the subscribers table ──────────────────────────────

export async function findSubscriberByEmailHash(
  db: SupabaseClient,
  emailHash: string
): Promise<Pick<Subscriber, "id" | "status"> | null> {
  const { data } = await db
    .from("subscribers")
    .select("id, status")
    .eq("email_hash", emailHash)
    .maybeSingle();
  return (data as Pick<Subscriber, "id" | "status"> | null) ?? null;
}

export async function findSubscriberByConfirmToken(
  db: SupabaseClient,
  tokenHash: string
): Promise<Pick<Subscriber, "id" | "status"> | null> {
  const { data } = await db
    .from("subscribers")
    .select("id, status")
    .eq("confirm_token_hash", tokenHash)
    .maybeSingle();
  return (data as Pick<Subscriber, "id" | "status"> | null) ?? null;
}

export async function findSubscriberByUnsubToken(
  db: SupabaseClient,
  tokenHash: string
): Promise<Pick<Subscriber, "id" | "status"> | null> {
  const { data } = await db
    .from("subscribers")
    .select("id, status")
    .eq("unsubscribe_token_hash", tokenHash)
    .maybeSingle();
  return (data as Pick<Subscriber, "id" | "status"> | null) ?? null;
}

export async function insertSubscriber(
  db: SupabaseClient,
  row: SubscriberInsert
): Promise<{ error: { code: string } | null }> {
  const { error } = await db.from("subscribers").insert(row);
  return { error: error as { code: string } | null };
}

export async function updateSubscriber(
  db: SupabaseClient,
  id: string,
  patch: Partial<Subscriber>
): Promise<void> {
  await db.from("subscribers").update(patch).eq("id", id);
}
