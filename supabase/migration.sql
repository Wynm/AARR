-- AARR — المخطط الأولي (مطابق للهجرة init_aarr_schema المطبقة على المشروع rdendsijoowivydpvqho)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  whatsapp text check (whatsapp is null or char_length(whatsapp) <= 30),
  source text not null default 'landing',
  interest text not null default 'ebook',
  consent boolean not null default false,
  utm_source text,
  utm_medium text,
  utm_campaign text
);

create table if not exists public.products (
  id text primary key,
  created_at timestamptz not null default now(),
  title text not null,
  slug text not null unique,
  price_mad numeric(10,2) not null check (price_mad >= 0),
  kind text not null default 'ebook',
  active boolean not null default true
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  product_id text references public.products(id),
  email text not null,
  amount_mad numeric(10,2) not null default 0,
  channel text not null default 'manual',
  status text not null default 'pending' check (status in ('pending','paid','refunded'))
);

create table if not exists public.kpi_snapshots (
  id bigint generated always as identity primary key,
  taken_at timestamptz not null default now(),
  leads_total integer not null default 0,
  orders_paid integer not null default 0,
  revenue_mad numeric(12,2) not null default 0,
  notes text
);

alter table public.leads enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.kpi_snapshots enable row level security;

create policy leads_insert_anon on public.leads
  for insert to anon with check (consent = true);
create policy leads_insert_auth on public.leads
  for insert to authenticated with check (true);
create policy products_read_all on public.products
  for select to anon, authenticated using (active = true);
-- orders و kpi_snapshots: بدون سياسات لـ anon ⇒ لا يمكن قراءتهما أو الكتابة فيهما إلا بمفتاح الخدمة.

insert into public.products (id, title, slug, price_mad, kind, active) values
  ('ebook-ai-freelance', 'حزمة الذكاء الاصطناعي للمستقل المغربي (دليل + قوالب)', 'ai-freelance-morocco', 99, 'ebook', true)
on conflict (id) do nothing;

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
