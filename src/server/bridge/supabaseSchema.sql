-- Optional Supabase schema for persistent encrypted WhatsApp Bridge sessions
-- and idempotent outreach logging when deploying behind orderi-server / Postgres.

create table if not exists public.whatsapp_bridge_sessions (
  user_id text primary key,
  phone_number text,
  connection_state text not null default 'Disconnected',
  encrypted_creds_blob text,
  last_connected_at timestamptz,
  last_disconnected_at timestamptz,
  last_message_at timestamptz,
  received_messages_count integer not null default 0,
  sent_messages_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_bridge_outreach_ops (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  order_id text not null,
  operation_id text not null,
  target_jid text not null,
  sent_message_id text not null,
  sent_at timestamptz not null default now(),
  unique (user_id, operation_id),
  unique (user_id, order_id)
);

alter table public.whatsapp_bridge_sessions enable row level security;
alter table public.whatsapp_bridge_outreach_ops enable row level security;

create policy "bridge_sessions_owner_isolation"
  on public.whatsapp_bridge_sessions
  for all
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

create policy "bridge_outreach_owner_isolation"
  on public.whatsapp_bridge_outreach_ops
  for all
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);
