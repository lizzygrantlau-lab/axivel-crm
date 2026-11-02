-- Axivel CRM: estrutura inicial. Executar no SQL Editor do projeto axivel-crm.
-- Não altera os arquivos JSON nem conecta o CRM local automaticamente.
begin;

-- A função automática de RLS é usada por um event trigger, não pela API.
do $$
begin
 if to_regprocedure('public.rls_auto_enable()') is not null then
  revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
 end if;
end;
$$;

create table public.equipe (
 id uuid primary key default gen_random_uuid(),
 nome text not null unique check (btrim(nome) <> ''),
 user_id uuid unique references auth.users(id) on delete set null,
 tipo text not null default 'pessoa' check (tipo in ('pessoa','automacao')),
 ativo boolean not null default true,
 criado_em timestamptz not null default now()
);
create table public.regioes (
 id uuid primary key default gen_random_uuid(),
 nome text not null check (btrim(nome) <> ''),
 uf text not null check (uf ~ '^[A-Z]{2}$'),
 criado_em timestamptz not null default now(),
 unique (nome,uf)
);
create table public.leads (
 id uuid primary key default gen_random_uuid(),
 codigo text unique,
 nome text not null check (btrim(nome) <> ''),
 tipo text not null default 'lead' check (tipo in ('lead','cliente')),
 cnpj text,
 segmento text,
 cidade text,
 uf text check (uf ~ '^[A-Z]{2}$'),
 regiao_id uuid references public.regioes(id),
 responsavel_id uuid references public.equipe(id),
 telefone text,
 whatsapp text,
 site text,
 instagram text,
 enderecos jsonb not null default '[]'::jsonb check (jsonb_typeof(enderecos) = 'array'),
 observacoes text,
 ativo boolean not null default true,
 criado_em timestamptz not null default now(),
 atualizado_em timestamptz not null default now()
);
create table public.analises_leads (
 id uuid primary key default gen_random_uuid(),
 lead_id uuid not null references public.leads(id),
 avaliador_id uuid not null references public.equipe(id),
 perfil_loja text,
 publico_observado text,
 produtos_observados text,
 apresentacao_comercial text,
 oportunidade_comercial text,
 prioridade text not null check (prioridade in ('alta','media','baixa')),
 justificativa text not null check (btrim(justificativa) <> ''),
 fontes text[] not null default '{}',
 criado_em timestamptz not null default now()
);
create table public.etapas_funil (
 codigo smallint primary key check (codigo between 0 and 16),
 nome text not null unique,
 responsavel_padrao_id uuid not null references public.equipe(id)
);
create table public.prospeccoes (
 id uuid primary key default gen_random_uuid(),
 lead_id uuid not null references public.leads(id),
 responsavel_id uuid not null references public.equipe(id),
 canal text not null check (canal in ('whatsapp','instagram','telefone','email','visita','outro')),
 status text not null default 'planejada' check (status in ('planejada','realizada','aguardando_retorno','respondida','sem_retorno','cancelada')),
 descricao text,
 resultado text,
 realizada_em timestamptz,
 data_limite_retorno date,
 resposta_em timestamptz,
 criado_em timestamptz not null default now(),
 atualizado_em timestamptz not null default now(),
 unique (id,lead_id),
 check (status <> 'aguardando_retorno' or data_limite_retorno is not null)
);
create table public.tarefas (
 id uuid primary key default gen_random_uuid(),
 lead_id uuid not null references public.leads(id),
 prospeccao_id uuid,
 etapa_codigo smallint not null references public.etapas_funil(codigo),
 responsavel_id uuid not null references public.equipe(id),
 titulo text not null check (btrim(titulo) <> ''),
 status text not null default 'pendente' check (status in ('pendente','em_andamento','aguardando_retorno','concluida','sem_retorno','nao_necessaria','cancelada')),
 prazo date,
 concluida_em timestamptz,
 observacoes text,
 criado_em timestamptz not null default now(),
 atualizado_em timestamptz not null default now(),
 foreign key (prospeccao_id,lead_id) references public.prospeccoes(id,lead_id),
 check (status <> 'aguardando_retorno' or prazo is not null)
);
create table public.historico (
 id uuid primary key default gen_random_uuid(),
 lead_id uuid not null references public.leads(id),
 autor_id uuid references public.equipe(id),
 tipo text not null check (btrim(tipo) <> ''),
 descricao text not null check (btrim(descricao) <> ''),
 dados jsonb not null default '{}'::jsonb check (jsonb_typeof(dados) = 'object'),
 criado_em timestamptz not null default now()
);

create index leads_regiao_idx on public.leads(regiao_id);
create index leads_responsavel_idx on public.leads(responsavel_id);
create index leads_cidade_idx on public.leads(uf,cidade);
create index analises_lead_data_idx on public.analises_leads(lead_id,criado_em desc);
create index analises_avaliador_idx on public.analises_leads(avaliador_id);
create index etapas_responsavel_idx on public.etapas_funil(responsavel_padrao_id);
create index prospeccoes_lead_idx on public.prospeccoes(lead_id,criado_em desc);
create index prospeccoes_responsavel_idx on public.prospeccoes(responsavel_id);
create index prospeccoes_retorno_idx on public.prospeccoes(data_limite_retorno) where status = 'aguardando_retorno';
create index tarefas_lead_idx on public.tarefas(lead_id);
create index tarefas_prospeccao_idx on public.tarefas(prospeccao_id,lead_id);
create index tarefas_etapa_idx on public.tarefas(etapa_codigo);
create index tarefas_responsavel_idx on public.tarefas(responsavel_id);
create index tarefas_prazo_idx on public.tarefas(prazo) where status in ('pendente','em_andamento','aguardando_retorno');
create index historico_lead_data_idx on public.historico(lead_id,criado_em desc);
create index historico_autor_idx on public.historico(autor_id);

create function public.axivel_atualizar_timestamp() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
 new.atualizado_em = now();
 return new;
end;
$$;
revoke all on function public.axivel_atualizar_timestamp() from public,anon,authenticated;
create trigger leads_timestamp before update on public.leads for each row execute function public.axivel_atualizar_timestamp();
create trigger prospeccoes_timestamp before update on public.prospeccoes for each row execute function public.axivel_atualizar_timestamp();
create trigger tarefas_timestamp before update on public.tarefas for each row execute function public.axivel_atualizar_timestamp();

-- Sem acesso anônimo. Login só terá acesso após vincular auth.users a equipe.user_id.
-- O cadastro da equipe é administrado pelo painel, nunca pelo navegador do CRM.
do $$
declare tabela text;
begin
 foreach tabela in array array['equipe','regioes','leads','analises_leads','etapas_funil','prospeccoes','tarefas','historico'] loop
  execute format('alter table public.%I enable row level security',tabela);
  execute format('revoke all on table public.%I from public,anon,authenticated',tabela);
  execute format('grant all on table public.%I to service_role',tabela);
 end loop;
end;
$$;
grant select on public.equipe to authenticated;
create policy equipe_proprio_cadastro on public.equipe for select to authenticated using (user_id = (select auth.uid()) and ativo);

do $$
declare tabela text;
 membro text := 'exists (select 1 from public.equipe e where e.user_id = (select auth.uid()) and e.ativo)';
begin
 foreach tabela in array array['regioes','leads','analises_leads','etapas_funil','prospeccoes','tarefas','historico'] loop
  execute format('grant select on table public.%I to authenticated',tabela);
  execute format('create policy equipe_leitura on public.%I for select to authenticated using (%s)',tabela,membro);
 end loop;
 foreach tabela in array array['regioes','leads','analises_leads','prospeccoes','tarefas','historico'] loop
  execute format('grant insert on table public.%I to authenticated',tabela);
  execute format('create policy equipe_insercao on public.%I for insert to authenticated with check (%s)',tabela,membro);
 end loop;
 foreach tabela in array array['regioes','leads','prospeccoes','tarefas'] loop
  execute format('grant update on table public.%I to authenticated',tabela);
  execute format('create policy equipe_atualizacao on public.%I for update to authenticated using (%s) with check (%s)',tabela,membro,membro);
 end loop;
end;
$$;

insert into public.equipe(nome,tipo) values ('IA','automacao'),('Laura','pessoa'),('Samanta','pessoa'),('Ronaldo','pessoa');
insert into public.etapas_funil(codigo,nome,responsavel_padrao_id)
select v.codigo,v.nome,e.id from (values
 (0,'Cliente identificado pela IA','IA'),
 (1,'Preparar o tipo de prospecção','Laura'),
 (2,'Primeiro contato enviado','Laura'),
 (3,'Retorno do cliente','Laura'),
 (4,'Segundo contato','Samanta'),
 (5,'Conversa virtual agendada','Samanta'),
 (6,'Visita física agendada','Ronaldo'),
 (7,'Visita realizada','Ronaldo'),
 (8,'Proposta apresentada','Ronaldo'),
 (9,'Negociação','Ronaldo'),
 (10,'Pedido-teste','Ronaldo'),
 (11,'Venda fechada','Ronaldo'),
 (12,'Pós-venda iniciado','Samanta'),
 (13,'Satisfação após 7 dias','Samanta'),
 (14,'Satisfação após 30 dias','Samanta'),
 (15,'Satisfação após 90 dias','Samanta'),
 (16,'Recompra ou relacionamento contínuo','Samanta')
) as v(codigo,nome,responsavel) join public.equipe e on e.nome=v.responsavel;

comment on table public.leads is 'Cadastro único da loja, preservado ao se tornar cliente.';
comment on table public.analises_leads is 'Análises comerciais e visuais da equipe; novos registros preservam avaliações anteriores.';
comment on table public.historico is 'Eventos comerciais; acesso da aplicação somente para consulta e inclusão.';
comment on table public.equipe is 'Vincular user_id a um usuário do Supabase Auth para autorizar o acesso ao CRM.';
commit;

select 'Estrutura Axivel criada' as resultado,
 (select count(*) from public.equipe) as integrantes,
 (select count(*) from public.etapas_funil) as etapas;
