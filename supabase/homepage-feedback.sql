create table if not exists public.homepage_feedback (
  id uuid primary key default gen_random_uuid(),
  rating integer not null check (rating between 1 and 5),
  message text not null check (
    char_length(message) between 1 and 1000
  ),
  email text,
  page_path text not null default '/' check (
    char_length(page_path) between 1 and 200
  ),
  submitted_at timestamptz not null default now()
);

alter table public.homepage_feedback enable row level security;

grant select, insert on public.homepage_feedback to service_role;

create index if not exists homepage_feedback_submitted_at_idx
  on public.homepage_feedback (submitted_at desc);
