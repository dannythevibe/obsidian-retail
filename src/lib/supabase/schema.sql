-- Obsidian Retail — Database Schema
-- Run this in your Supabase SQL editor

-- ─── MERCHANTS ────────────────────────────────────────────────────────────────
create table if not exists merchants (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null unique,
  handle        text not null unique,                  -- herboutique → herboutique.obsidianretail.com
  store_name    text not null,
  phone         text,
  custom_domain text unique,                           -- herboutique.com (when they buy)
  logo_url      text,
  banner_url    text,
  description   text,
  is_live       boolean default false not null,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- ─── PRODUCTS ─────────────────────────────────────────────────────────────────
create table if not exists products (
  id              uuid primary key default gen_random_uuid(),
  merchant_id     uuid references merchants(id) on delete cascade not null,
  name            text not null,
  description     text,
  price           integer not null,                    -- kobo-equivalent (store in naira * 100)
  sale_price      integer,                             -- null = no discount active
  category        text,
  image_url       text,
  in_stock        boolean default true not null,
  is_best_seller  boolean default false not null,
  source          text default 'manual',               -- 'instagram' | 'whatsapp' | 'upload'
  ai_confidence   numeric(4,3),                        -- 0.000–1.000
  sales_count     integer default 0 not null,
  position        integer default 0 not null,          -- display order
  approved        boolean default false not null,      -- merchant approved after AI ingestion
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

-- ─── REVIEWS ──────────────────────────────────────────────────────────────────
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references products(id) on delete cascade not null,
  body        text not null,
  source      text default 'instagram',               -- 'instagram' | 'manual'
  created_at  timestamptz default now() not null
);

-- ─── ORDERS ───────────────────────────────────────────────────────────────────
create table if not exists orders (
  id                   uuid primary key default gen_random_uuid(),
  merchant_id          uuid references merchants(id) on delete cascade not null,
  product_id           uuid references products(id) on delete set null,
  reference            text not null unique,           -- ORD-HERB-ABC123
  customer_name        text,
  customer_phone       text,
  customer_email       text,
  customer_address     text,
  amount               integer not null,               -- in naira
  status               text default 'pending' not null check (status in ('pending','paid','fulfilled','cancelled')),
  payaza_account_no    text,
  payaza_bank_name     text,
  payaza_account_ref   text,
  expires_at           timestamptz,
  paid_at              timestamptz,
  created_at           timestamptz default now() not null,
  updated_at           timestamptz default now() not null
);

-- ─── PAYAZA TRANSACTIONS ──────────────────────────────────────────────────────
-- Raw webhook payloads — source of truth for reconciliation
create table if not exists payaza_transactions (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid references orders(id) on delete set null,
  merchant_id     uuid references merchants(id) on delete cascade not null,
  payaza_ref      text not null unique,                -- idempotency key
  amount          integer not null,
  status          text not null,
  raw_payload     jsonb not null,                      -- full Payaza webhook body
  processed_at    timestamptz default now() not null
);

-- ─── INGESTION JOBS ───────────────────────────────────────────────────────────
create table if not exists ingestion_jobs (
  id            uuid primary key default gen_random_uuid(),
  merchant_id   uuid references merchants(id) on delete cascade not null,
  source        text not null check (source in ('instagram','whatsapp','upload')),
  source_url    text,
  status        text default 'processing' not null check (status in ('processing','done','failed')),
  total         integer default 0,
  processed     integer default 0,
  created_at    timestamptz default now() not null,
  completed_at  timestamptz
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
create index if not exists idx_products_merchant    on products(merchant_id);
create index if not exists idx_products_approved    on products(merchant_id, approved);
create index if not exists idx_orders_merchant      on orders(merchant_id);
create index if not exists idx_orders_reference     on orders(reference);
create index if not exists idx_payaza_ref           on payaza_transactions(payaza_ref);
create index if not exists idx_merchants_handle     on merchants(handle);
create index if not exists idx_merchants_domain     on merchants(custom_domain);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table merchants           enable row level security;
alter table products            enable row level security;
alter table reviews             enable row level security;
alter table orders              enable row level security;
alter table payaza_transactions enable row level security;
alter table ingestion_jobs      enable row level security;

-- Merchants: own their row
drop policy if exists "merchant_own" on merchants;
create policy "merchant_own" on merchants
  for all using (auth.uid() = user_id);

-- Products: merchant owns their products
drop policy if exists "products_merchant_own" on products;
create policy "products_merchant_own" on products
  for all using (
    merchant_id in (select id from merchants where user_id = auth.uid())
  );

-- Products: public can read approved + in-stock products (for storefront)
drop policy if exists "products_public_read" on products;
create policy "products_public_read" on products
  for select using (approved = true);

-- Reviews: public can read
drop policy if exists "reviews_public_read" on reviews;
create policy "reviews_public_read" on reviews
  for select using (true);

-- Reviews: merchant can insert/delete
drop policy if exists "reviews_merchant_write" on reviews;
create policy "reviews_merchant_write" on reviews
  for all using (
    product_id in (
      select p.id from products p
      join merchants m on m.id = p.merchant_id
      where m.user_id = auth.uid()
    )
  );

-- Orders: merchant reads their orders
drop policy if exists "orders_merchant_read" on orders;
create policy "orders_merchant_read" on orders
  for select using (
    merchant_id in (select id from merchants where user_id = auth.uid())
  );

-- Orders: service role writes (webhooks use service key)
drop policy if exists "orders_service_write" on orders;
create policy "orders_service_write" on orders
  for all using (auth.role() = 'service_role');

-- Payaza transactions: merchant read, service write
drop policy if exists "payaza_merchant_read" on payaza_transactions;
create policy "payaza_merchant_read" on payaza_transactions
  for select using (
    merchant_id in (select id from merchants where user_id = auth.uid())
  );
drop policy if exists "payaza_service_write" on payaza_transactions;
create policy "payaza_service_write" on payaza_transactions
  for all using (auth.role() = 'service_role');

-- Ingestion jobs: merchant owns
drop policy if exists "ingestion_merchant_own" on ingestion_jobs;
create policy "ingestion_merchant_own" on ingestion_jobs
  for all using (
    merchant_id in (select id from merchants where user_id = auth.uid())
  );

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists merchants_updated_at on merchants;
create trigger merchants_updated_at before update on merchants
  for each row execute function update_updated_at();

drop trigger if exists products_updated_at on products;
create trigger products_updated_at before update on products
  for each row execute function update_updated_at();

drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at before update on orders
  for each row execute function update_updated_at();

-- ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

-- Called by webhook handler when a payment lands
create or replace function increment_sales(product_id uuid)
returns void as $$
begin
  update products
  set sales_count = sales_count + 1,
      updated_at  = now()
  where id = product_id;
end;
$$ language plpgsql security definer;

-- ─── STORAGE ──────────────────────────────────────────────────────────────────
-- Run this after creating the bucket in the Supabase dashboard:
-- Storage → New bucket → "product-images" → Public

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Allow public access to read images
drop policy if exists "Public Read" on storage.objects;
create policy "Public Read"
on storage.objects for select
using ( bucket_id = 'product-images' );

-- Allow authenticated users to upload images
drop policy if exists "Authenticated Upload" on storage.objects;
create policy "Authenticated Upload"
on storage.objects for insert
with check (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to manage their own folder in the bucket
drop policy if exists "Merchant Manage Own Folder" on storage.objects;
create policy "Merchant Manage Own Folder"
on storage.objects for all
using (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] in (
    select id::text from merchants where user_id = auth.uid()
  )
);
