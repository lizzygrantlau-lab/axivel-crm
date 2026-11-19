-- Preparada para aplicação manual no Supabase; não executar automaticamente.
-- Lista vazia significa que a origem ainda não foi informada.
alter table public.leads
  add column if not exists origens text[] not null default '{}'::text[],
  add column if not exists origem_detalhe text;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'leads_origens_validas'
       and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_origens_validas check (
        origens <@ array[
          'indicacao_ia',
          'indicacao_proprietarios',
          'lista_vendedor',
          'pesquisa_manual',
          'outros'
        ]::text[]
      );
  end if;
end $$;
