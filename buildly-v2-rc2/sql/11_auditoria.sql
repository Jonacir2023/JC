-- BUILDLy Premium V2 — Migration 11 (CANDIDATA) — trilha de auditoria.
begin;
create table if not exists public.auditoria_eventos (
 id bigserial primary key, obra_id uuid, usuario_id uuid, entidade text not null, entidade_id text, operacao text not null,
 antes jsonb, depois jsonb, ocorrido_em timestamptz not null default now(), origem text default 'app', observacao text
);
create index if not exists ix_auditoria_entidade on public.auditoria_eventos(entidade,entidade_id,ocorrido_em desc);
create index if not exists ix_auditoria_obra on public.auditoria_eventos(obra_id,ocorrido_em desc);
alter table public.auditoria_eventos enable row level security;

create or replace function private.auditar_mutacao() returns trigger
language plpgsql security definer set search_path='' as $$
declare oldj jsonb; newj jsonb; oid text; obra uuid;
begin
  oldj=case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end;
  newj=case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end;
  oid=coalesce(newj->>'id',oldj->>'id');
  begin obra=coalesce((newj->>'obra_id')::uuid,(oldj->>'obra_id')::uuid); exception when others then obra=null; end;
  insert into public.auditoria_eventos(obra_id,usuario_id,entidade,entidade_id,operacao,antes,depois)
  values(obra,auth.uid(),tg_table_schema||'.'||tg_table_name,oid,tg_op,oldj,newj);
  return coalesce(new,old);
end $$;

-- Tabelas de maior risco financeiro/contratual/documental.
do $$ declare t text; begin
 foreach t in array array['orcamentos','orcamento_itens','orcamento_alteracoes','orcamento_alteracao_itens','contratos_comerciais','contrato_itens','contrato_alteracoes','contrato_alteracao_itens','compromissos','compromisso_itens','custos_lancamentos','pagamentos','forecast_itens','medicoes','medicao_itens','planejamento_cronogramas','planejamento_atividades','planejamento_programacoes','planejamento_programacao_itens','planejamento_restricoes','documentos','documento_revisoes','documento_workflow'] loop
   execute format('drop trigger if exists audit_%I on public.%I',t,t);
   execute format('create trigger audit_%I after insert or update or delete on public.%I for each row execute function private.auditar_mutacao()',t,t);
 end loop;
end $$;
commit;
