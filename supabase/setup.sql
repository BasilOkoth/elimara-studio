-- ELIMARA STUDIO ADMIN V1
-- Run once in Supabase SQL Editor.
-- Admin account expected: info@shulehub.org

create extension if not exists pgcrypto;

create table if not exists public.studio_admins (
  email text primary key
);
insert into public.studio_admins(email) values ('info@shulehub.org')
on conflict (email) do nothing;

create or replace function public.is_studio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.studio_admins
    where lower(email) = lower(coalesce(auth.jwt()->>'email',''))
  );
$$;

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  sort_order integer not null default 10,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.artworks (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references public.collections(id) on delete set null,
  slug text not null unique,
  title text not null,
  short_title text default '',
  year integer,
  price numeric(12,2) not null default 0,
  edition_size integer not null default 25 check (edition_size > 0),
  editions_sold integer not null default 0 check (editions_sold >= 0 and editions_sold <= edition_size),
  code text unique,
  medium text default '',
  dimensions text default '',
  availability text not null default 'Available',
  story text default '',
  seo_description text default '',
  main_image_url text default '',
  main_image_path text default '',
  show_homepage boolean not null default true,
  allow_wall_preview boolean not null default true,
  published boolean not null default false,
  sort_order integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artwork_mockups (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.artworks(id) on delete cascade,
  image_url text not null,
  image_path text default '',
  caption text default '',
  sort_order integer not null default 10,
  created_at timestamptz not null default now()
);

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  value text default '',
  sort_order integer not null default 10,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists artworks_touch_updated_at on public.artworks;
create trigger artworks_touch_updated_at before update on public.artworks
for each row execute function public.touch_updated_at();

alter table public.studio_admins enable row level security;
alter table public.collections enable row level security;
alter table public.artworks enable row level security;
alter table public.artwork_mockups enable row level security;
alter table public.site_content enable row level security;

drop policy if exists "Admins read admin list" on public.studio_admins;
create policy "Admins read admin list" on public.studio_admins for select to authenticated using (public.is_studio_admin());

drop policy if exists "Public read collections" on public.collections;
create policy "Public read collections" on public.collections for select to anon, authenticated using (published = true or public.is_studio_admin());
drop policy if exists "Admins manage collections" on public.collections;
create policy "Admins manage collections" on public.collections for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());

drop policy if exists "Public read artworks" on public.artworks;
create policy "Public read artworks" on public.artworks for select to anon, authenticated using (published = true or public.is_studio_admin());
drop policy if exists "Admins manage artworks" on public.artworks;
create policy "Admins manage artworks" on public.artworks for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());

drop policy if exists "Public read mockups" on public.artwork_mockups;
create policy "Public read mockups"
on public.artwork_mockups
for select
to anon, authenticated
using (
  public.is_studio_admin()
  OR artwork_id IN (
    SELECT id
    FROM public.artworks
    WHERE published = true
  )
);
drop policy if exists "Admins manage mockups" on public.artwork_mockups;
create policy "Admins manage mockups" on public.artwork_mockups for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());

drop policy if exists "Public read site content" on public.site_content;
create policy "Public read site content" on public.site_content for select to anon, authenticated using (true);
drop policy if exists "Admins manage site content" on public.site_content;
create policy "Admins manage site content" on public.site_content for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());

insert into storage.buckets(id,name,public) values ('studio-media','studio-media',true)
on conflict(id) do update set public=true;

drop policy if exists "Public reads studio media" on storage.objects;
create policy "Public reads studio media" on storage.objects for select to public using (bucket_id='studio-media');
drop policy if exists "Admins upload studio media" on storage.objects;
create policy "Admins upload studio media" on storage.objects for insert to authenticated with check (bucket_id='studio-media' and public.is_studio_admin());
drop policy if exists "Admins update studio media" on storage.objects;
create policy "Admins update studio media" on storage.objects for update to authenticated using (bucket_id='studio-media' and public.is_studio_admin()) with check (bucket_id='studio-media' and public.is_studio_admin());
drop policy if exists "Admins delete studio media" on storage.objects;
create policy "Admins delete studio media" on storage.objects for delete to authenticated using (bucket_id='studio-media' and public.is_studio_admin());

insert into public.collections(name,slug,description,sort_order,published) values
('Nebula','nebula','Fluid computational fields exploring emergence, convergence, repetition and atmosphere.',10,true),
('Threshold','threshold','A study of invisible systems, boundaries, repeated structures and luminous transitions.',20,true)
on conflict(slug) do update set name=excluded.name,description=excluded.description,sort_order=excluded.sort_order,published=excluded.published;

insert into public.artworks(collection_id,slug,title,short_title,year,price,edition_size,editions_sold,code,medium,dimensions,availability,story,main_image_url,show_homepage,allow_wall_preview,published,sort_order)
values
((select id from public.collections where slug='nebula'),'nebula-i-emergence','Nebula I — Emergence','Emergence',2026,28000,25,0,'ELA-NB01','Archival pigment print on 100% cotton rag','700 × 1000 mm','Available','Emergence explores the moment order begins to surface from repetition. Curved geometric fields accumulate, echo and shift until the system feels almost alive — suspended between code, rhythm and perception.','assets/images/nebula-emergence.webp',true,true,true,10),
((select id from public.collections where slug='nebula'),'nebula-ii-convergence','Nebula II — Convergence','Convergence',2026,28000,25,0,'ELA-NB02','Archival pigment print on 100% cotton rag','700 × 1000 mm','Available','Convergence studies attraction, repetition and shared direction. Warm metallic forms gather around luminous points, creating a field that feels architectural from a distance and intricate at close range.','assets/images/nebula-convergence.webp',true,true,true,20),
((select id from public.collections where slug='threshold'),'threshold-i-verdant','Threshold I — Verdant','Verdant',2026,28000,25,0,'ELA-TH01','Archival pigment print on 100% cotton rag','','Available','Verdant explores balance inside a computational field: luminous green boundaries hold a dark central structure in tension, suggesting an organic system that is both ordered and alive.','assets/images/threshold-verdant.webp',true,true,false,10),
((select id from public.collections where slug='threshold'),'threshold-ii-violet','Threshold II — Violet','Violet',2026,28000,25,0,'ELA-TH02','Archival pigment print on 100% cotton rag','','Available','Violet turns repeated structures into a shifting spatial field. Lavender light gathers at intersections while darker forms bend and recede, creating tension between repetition and instability.','assets/images/threshold-violet.webp',true,true,false,20),
((select id from public.collections where slug='threshold'),'threshold-iii-aureum','Threshold III — Aureum','Aureum',2026,28000,25,0,'ELA-TH03','Archival pigment print on 100% cotton rag','','Available','Aureum develops a warm architectural rhythm from repeated computational cells. Bronze and gold light move across the field, making the work especially suited to large-scale interiors and hospitality spaces.','assets/images/threshold-aureum.webp',true,true,false,30)
on conflict(slug) do update set title=excluded.title,price=excluded.price,edition_size=excluded.edition_size,code=excluded.code,main_image_url=excluded.main_image_url;

insert into public.site_content(key,label,value,sort_order) values
('home_hero_lead','Homepage hero','Limited-edition generative works produced as archival collector objects — signed, numbered and documented with provenance.',10),
('home_statement','Homepage statement','Each work begins as a computational system and ends as a physical object: material, scale, edition, signature and provenance.',20),
('works_intro','Available works introduction','Made to order rather than mass produced. Each collector edition is produced only when acquired, individually signed and accompanied by a matching authenticity record.',30),
('about_p1','About — paragraph 1','Elimara Studio explores the meeting point between computation, repetition, visual rhythm and physical space. The works are generated through custom computational processes and then deliberately translated into limited physical editions.',40),
('about_p2','About — paragraph 2','The studio is a creative division of Elimara Technologies Limited and is developing a contemporary African digital-to-physical art practice from Nairobi.',50),
('about_p3','About — paragraph 3','The aim is not unlimited reproduction. It is to make computational work that can exist with the material presence, documentation and permanence expected of collectible art.',60),
('commission_hero_lead','Commission page hero','Site-specific computational art for residences, executive offices, hotels, receptions and interior-design projects. Begin with the space. We develop the artwork around it.',70)
on conflict(key) do nothing;
