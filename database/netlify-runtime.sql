-- Estado do servidor online; acesso somente pelas Functions protegidas do CRM.
begin;
create table if not exists public.crm_runtime (
 chave text primary key check (chave in ('CLI-0001/tasks','CLI-0001/activities','CLI-0001/post-sale','CLI-0001/client')),
 valor jsonb not null,
 versao integer not null default 1 check (versao > 0)
);
alter table public.crm_runtime enable row level security;
revoke all on public.crm_runtime from public, anon, authenticated;
grant select, insert, update on public.crm_runtime to service_role;
commit;
