create table if not exists public.cold_email_requests (
  id uuid primary key default gen_random_uuid(),
  applicant_role text not null default 'sales' check (
    applicant_role in ('sales', 'recruiter', 'investor')
  ),
  applicant_email text not null,
  applicant_company text not null,
  product_name text not null,
  product_description text not null check (
    char_length(product_description) between 30 and 500
  ),
  additional_request text,
  target_company jsonb not null,
  privacy_agreed boolean not null default true check (privacy_agreed),
  submitted_at timestamptz not null default now()
);

alter table public.cold_email_requests
  add column if not exists applicant_role text not null default 'sales';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cold_email_requests_applicant_role_check'
      and conrelid = 'public.cold_email_requests'::regclass
  ) then
    alter table public.cold_email_requests
      add constraint cold_email_requests_applicant_role_check
      check (applicant_role in ('sales', 'recruiter', 'investor'));
  end if;
end
$$;

alter table public.cold_email_requests enable row level security;

grant select, insert on public.cold_email_requests to service_role;

create index if not exists cold_email_requests_submitted_at_idx
  on public.cold_email_requests (submitted_at desc);
