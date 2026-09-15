create extension if not exists pg_trgm;

create table if not exists products (
  id text primary key,
  title text not null,
  name text not null,
  brand text not null,
  price integer not null,
  image_url text not null,
  mall text not null,
  category text not null,
  subcategory text not null,
  gender text not null,
  colors text[] not null default '{}',
  materials text[] not null default '{}',
  styles text[] not null default '{}',
  keywords text[] not null default '{}',
  search_text text not null,
  product_link text not null,
  immersive_token text,
  direct_url text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  price_updated_at timestamptz not null default now()
);

create index if not exists products_search_text_trgm on products using gin (search_text gin_trgm_ops);

create index if not exists products_mall_idx on products (mall);

create index if not exists products_brand_idx on products (brand);

create index if not exists products_last_seen_idx on products (last_seen_at);

create table if not exists collect_queries (
  query text primary key,
  last_run_at timestamptz,
  last_count integer
);
