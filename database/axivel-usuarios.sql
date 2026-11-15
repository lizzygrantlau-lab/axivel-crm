-- Contas do CRM: acesso exclusivo do servidor; nenhuma senha de usuário neste arquivo.
begin;
create table if not exists public.crm_usuarios (
 id uuid primary key default gen_random_uuid(),
 equipe_id uuid not null unique references public.equipe(id),
 login text not null unique check (login = lower(login)),
 nome text not null,
 senha_hash text not null,
 ativo boolean not null default true,
 criado_em timestamptz not null default now()
);
create table if not exists public.crm_sessoes (
 token_hash text primary key,
 usuario_id uuid not null references public.crm_usuarios(id) on delete cascade,
 expira_em timestamptz not null,
 criado_em timestamptz not null default now()
);
create index if not exists crm_sessoes_usuario_idx on public.crm_sessoes(usuario_id);
create index if not exists crm_sessoes_expira_idx on public.crm_sessoes(expira_em);
create table if not exists public.crm_login_limites (
 chave text primary key,
 tentativas integer not null,
 inicio timestamptz not null
);
alter table public.crm_usuarios enable row level security;
alter table public.crm_sessoes enable row level security;
alter table public.crm_login_limites enable row level security;
revoke all on public.crm_usuarios,public.crm_sessoes,public.crm_login_limites from anon,authenticated;
grant select,insert,update,delete on public.crm_usuarios,public.crm_sessoes,public.crm_login_limites to service_role;
create or replace function public.crm_limitar_login(chave_login text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare total integer;
begin
 insert into public.crm_login_limites as limite(chave,tentativas,inicio)
 values(chave_login,1,now())
 on conflict(chave) do update set
 tentativas=case when limite.inicio < now()-interval '15 minutes' then 1 else limite.tentativas+1 end,
 inicio=case when limite.inicio < now()-interval '15 minutes' then now() else limite.inicio end
 returning tentativas into total;
 return total<=10;
end;
$$;
revoke all on function public.crm_limitar_login(text) from public,anon,authenticated;
grant execute on function public.crm_limitar_login(text) to service_role;
commit;
