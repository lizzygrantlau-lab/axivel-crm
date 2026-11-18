-- Preparada para aplicação manual no Supabase; não executar automaticamente.
alter table public.leads
  add column if not exists compradores jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'leads_compradores_array'
       and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_compradores_array check (jsonb_typeof(compradores) = 'array');
  end if;
end $$;
