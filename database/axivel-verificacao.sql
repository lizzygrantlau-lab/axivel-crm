-- Testes transacionais: todos os registros de teste são descartados por ROLLBACK.
rollback;
begin;
create table public.axivel_rls_verificacao_transacional(id integer);
do $$
declare lead_a uuid; lead_b uuid; pessoa uuid; contato uuid; quantidade integer;
begin
 if not exists(select 1 from pg_tables where schemaname='public' and tablename='axivel_rls_verificacao_transacional' and rowsecurity) then raise exception 'Falha: RLS automatica desativada';end if;
 select count(*) into quantidade from pg_tables where schemaname='public' and tablename in ('equipe','regioes','leads','analises_leads','etapas_funil','prospeccoes','tarefas','historico') and rowsecurity;
 if quantidade<>8 then raise exception 'Falha: RLS deve estar ativa nas oito tabelas'; end if;
 if (select count(*) from public.etapas_funil)<>17 then raise exception 'Falha: faltam etapas';end if;
 if exists(select 1 from pg_tables where schemaname='public' and has_table_privilege('anon',format('%I.%I',schemaname,tablename),'SELECT,INSERT,UPDATE,DELETE')) then raise exception 'Falha: acesso anonimo';end if;
 select id into pessoa from public.equipe where nome='Laura';
 insert into public.leads(nome) values ('TESTE TRANSACIONAL A') returning id into lead_a;
 insert into public.leads(nome) values ('TESTE TRANSACIONAL B') returning id into lead_b;
 insert into public.analises_leads(lead_id,avaliador_id,prioridade,justificativa) values(lead_a,pessoa,'alta','Primeira avaliação de teste');
 insert into public.analises_leads(lead_id,avaliador_id,prioridade,justificativa) values(lead_a,pessoa,'media','Segunda avaliação de teste');
 if (select count(*) from public.analises_leads where lead_id=lead_a)<>2 then raise exception 'Falha: historico de analises';end if;
 begin
  insert into public.analises_leads(lead_id,avaliador_id,prioridade,justificativa) values(lead_a,pessoa,'invalida','Teste');
  raise exception 'Falha: prioridade invalida foi aceita';
 exception when check_violation then null;end;
 begin
  insert into public.tarefas(lead_id,etapa_codigo,responsavel_id,titulo,status) values(lead_a,3,pessoa,'Teste de espera','aguardando_retorno');
  raise exception 'Falha: espera sem prazo foi aceita';
 exception when check_violation then null;end;
 insert into public.prospeccoes(lead_id,responsavel_id,canal,status,data_limite_retorno) values(lead_a,pessoa,'whatsapp','aguardando_retorno',current_date+3) returning id into contato;
 insert into public.tarefas(lead_id,prospeccao_id,etapa_codigo,responsavel_id,titulo,status,prazo) values(lead_a,contato,3,pessoa,'Aguardar retorno','aguardando_retorno',current_date+3);
 begin
  insert into public.tarefas(lead_id,prospeccao_id,etapa_codigo,responsavel_id,titulo) values(lead_b,contato,3,pessoa,'Vinculo errado');
  raise exception 'Falha: contato de outra lead foi aceito';
 exception when foreign_key_violation then null;end;
 insert into public.historico(lead_id,autor_id,tipo,descricao) values(lead_a,pessoa,'teste','Evento transacional');
 update public.leads set observacoes='Teste de atualização' where id=lead_a;
end;
$$;

-- Sem usuário vinculado à equipe: nenhuma linha é visível ou gravável.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';
do $$
begin
 if exists(select 1 from public.leads) then raise exception 'Falha: leitura fora da equipe';end if;
 begin
  insert into public.leads(nome) values('TESTE NAO AUTORIZADO');
  raise exception 'Falha: escrita fora da equipe';
 exception when insufficient_privilege then null;end;
end;
$$;
reset role;
rollback;
select 'Validações, vínculos, histórico e bloqueio fora da equipe: OK; dados de teste descartados.' as resultado;
