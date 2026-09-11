-- BUILDLy Premium V2 — Migration 12 (RELEASE CANDIDATE)
-- RLS, grants explícitos e segregação dos módulos Premium.
-- Pressupõe private.tem_acesso_obra(), private.tem_permissao(), private.usuario_global().
begin;

-- ============================================================
-- 1. MATRIZ PROFISSIONAL COMPLEMENTAR
-- ============================================================
insert into private.papel_permissoes(papel,modulo,acao,permitido) values
('gestor','orcamento','visualizar',true),('gestor','orcamento','criar',true),('gestor','orcamento','editar',true),('gestor','orcamento','aprovar',true),
('gestor','contratos','visualizar',true),('gestor','contratos','criar',true),('gestor','contratos','editar',true),('gestor','contratos','excluir',true),('gestor','contratos','aprovar',true),
('gestor','custos','visualizar',true),('gestor','custos','criar',true),('gestor','custos','editar',true),('gestor','custos','aprovar',true),
('gestor','medicoes','aprovar',true),('gestor','nfs','aprovar',true),
('gestor','planejamento','visualizar',true),('gestor','planejamento','criar',true),('gestor','planejamento','editar',true),
('engenheiro','orcamento','visualizar',true),('engenheiro','contratos','visualizar',true),
('administrativo','orcamento','visualizar',true),('administrativo','contratos','visualizar',true)
on conflict(papel,modulo,acao) do update set permitido=excluded.permitido;

insert into private.especialidade_permissoes(especialidade,modulo,acao,permitido) values
('medicoes_custos','orcamento','visualizar',true),('medicoes_custos','orcamento','criar',true),('medicoes_custos','orcamento','editar',true),
('medicoes_custos','contratos','visualizar',true),('medicoes_custos','contratos','criar',true),('medicoes_custos','contratos','editar',true),
('medicoes_custos','medicoes','visualizar',true),('medicoes_custos','medicoes','criar',true),('medicoes_custos','medicoes','editar',true),
('medicoes_custos','nfs','visualizar',true),('medicoes_custos','nfs','criar',true),('medicoes_custos','nfs','editar',true),
('medicoes_custos','custos','visualizar',true),('medicoes_custos','custos','criar',true),('medicoes_custos','custos','editar',true),
('planejamento','planejamento','visualizar',true),('planejamento','planejamento','criar',true),('planejamento','planejamento','editar',true)
on conflict(especialidade,modulo,acao) do update set permitido=excluded.permitido;

-- ============================================================
-- 2. GRANTS EXPLÍCITOS — NÃO DEPENDER DE AUTO-EXPOSIÇÃO DO SUPABASE
-- ============================================================
revoke all on
  public.eap_itens, public.cbs_codigos, public.orcamentos, public.orcamento_itens,
  public.orcamento_alteracoes, public.orcamento_alteracao_itens,
  public.fornecedores, public.contrato_alteracoes, public.contrato_alteracao_itens,
  public.compromissos, public.compromisso_itens,
  public.custos_lancamentos, public.pagamentos, public.forecast_itens,
  public.planejamento_cronogramas, public.planejamento_atividades,
  public.planejamento_programacoes, public.planejamento_programacao_itens,
  public.planejamento_restricoes, public.documento_revisoes, public.documento_workflow,
  public.auditoria_eventos
from anon, authenticated;

grant select,insert,update on public.eap_itens to authenticated;
grant select,insert,update on public.cbs_codigos to authenticated;
grant select,insert,update on public.orcamentos to authenticated;
grant select,insert,update,delete on public.orcamento_itens to authenticated;
grant select,insert,update,delete on public.orcamento_alteracoes to authenticated;
grant select,insert,update,delete on public.orcamento_alteracao_itens to authenticated;
grant select,insert,update on public.fornecedores to authenticated;
grant select,insert,update,delete on public.contrato_alteracoes to authenticated;
grant select,insert,update,delete on public.contrato_alteracao_itens to authenticated;
grant select on public.compromissos,public.compromisso_itens to authenticated;
grant select,insert,update,delete on public.custos_lancamentos to authenticated;
grant select,insert,update on public.pagamentos to authenticated;
grant select,insert,update,delete on public.forecast_itens to authenticated;
grant select,insert,update,delete on public.planejamento_cronogramas to authenticated;
grant select,insert,update,delete on public.planejamento_atividades to authenticated;
grant select,insert,update,delete on public.planejamento_programacoes to authenticated;
grant select,insert,update,delete on public.planejamento_programacao_itens to authenticated;
grant select,insert,update,delete on public.planejamento_restricoes to authenticated;
grant select,insert,update,delete on public.documento_revisoes to authenticated;
grant select,insert,update,delete on public.documento_workflow to authenticated;
grant select on public.auditoria_eventos to authenticated;

grant select,insert,update,delete on public.contratos_comerciais,public.contrato_itens to authenticated;

revoke all on
  public.vw_eap_arvore, public.vw_cbs_arvore, public.vw_orcamento_base,
  public.vw_orcamento_atual, public.vw_contrato_valor_atual,
  public.vw_posicao_financeira
from anon,authenticated;
grant select on
  public.vw_eap_arvore, public.vw_cbs_arvore, public.vw_orcamento_base,
  public.vw_orcamento_atual, public.vw_contrato_valor_atual,
  public.vw_posicao_financeira
 to authenticated;

-- ============================================================
-- 3. EAP / CBS
-- ============================================================
alter table public.eap_itens enable row level security;
alter table public.cbs_codigos enable row level security;

drop policy if exists eap_select_obra on public.eap_itens;
create policy eap_select_obra on public.eap_itens for select to authenticated
using(private.tem_acesso_obra(obra_id));
drop policy if exists eap_insert_gestao on public.eap_itens;
create policy eap_insert_gestao on public.eap_itens for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and (private.usuario_global() or public.eh_gestor()));
drop policy if exists eap_update_gestao on public.eap_itens;
create policy eap_update_gestao on public.eap_itens for update to authenticated
using(private.tem_acesso_obra(obra_id) and (private.usuario_global() or public.eh_gestor()))
with check(private.tem_acesso_obra(obra_id) and (private.usuario_global() or public.eh_gestor()));

drop policy if exists cbs_select_auth on public.cbs_codigos;
create policy cbs_select_auth on public.cbs_codigos for select to authenticated using(true);
drop policy if exists cbs_insert_global on public.cbs_codigos;
create policy cbs_insert_global on public.cbs_codigos for insert to authenticated with check(private.usuario_global());
drop policy if exists cbs_update_global on public.cbs_codigos;
create policy cbs_update_global on public.cbs_codigos for update to authenticated
using(private.usuario_global()) with check(private.usuario_global());

-- ============================================================
-- 4. ORÇAMENTO
-- ============================================================
alter table public.orcamentos enable row level security;
alter table public.orcamento_itens enable row level security;
alter table public.orcamento_alteracoes enable row level security;
alter table public.orcamento_alteracao_itens enable row level security;

drop policy if exists orcamentos_select_obra on public.orcamentos;
drop policy if exists orcamentos_insert_perm on public.orcamentos;
drop policy if exists orcamentos_update_perm on public.orcamentos;
create policy orcamentos_select_obra on public.orcamentos for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('orcamento','visualizar'));
create policy orcamentos_insert_perm on public.orcamentos for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('orcamento','criar'));
create policy orcamentos_update_perm on public.orcamentos for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('orcamento','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('orcamento','editar'));

drop policy if exists orcamento_itens_select_obra on public.orcamento_itens;
drop policy if exists orc_itens_insert_perm on public.orcamento_itens;
drop policy if exists orc_itens_update_perm on public.orcamento_itens;
drop policy if exists orc_itens_delete_perm on public.orcamento_itens;
create policy orcamento_itens_select_obra on public.orcamento_itens for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('orcamento','visualizar'));
create policy orc_itens_insert_perm on public.orcamento_itens for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('orcamento','criar'));
create policy orc_itens_update_perm on public.orcamento_itens for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('orcamento','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('orcamento','editar'));
create policy orc_itens_delete_perm on public.orcamento_itens for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('orcamento','editar'));

drop policy if exists orc_alt_select_obra on public.orcamento_alteracoes;
drop policy if exists orc_alt_insert_perm on public.orcamento_alteracoes;
drop policy if exists orc_alt_update_perm on public.orcamento_alteracoes;
drop policy if exists orc_alt_delete_perm on public.orcamento_alteracoes;
create policy orc_alt_select_obra on public.orcamento_alteracoes for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('orcamento','visualizar'));
create policy orc_alt_insert_perm on public.orcamento_alteracoes for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('orcamento','criar'));
create policy orc_alt_update_perm on public.orcamento_alteracoes for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('orcamento','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('orcamento','editar'));
create policy orc_alt_delete_perm on public.orcamento_alteracoes for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('orcamento','editar'));

drop policy if exists orc_alt_itens_select_obra on public.orcamento_alteracao_itens;
drop policy if exists orc_alt_itens_write_perm on public.orcamento_alteracao_itens;
drop policy if exists orc_alt_itens_insert_perm on public.orcamento_alteracao_itens;
drop policy if exists orc_alt_itens_update_perm on public.orcamento_alteracao_itens;
drop policy if exists orc_alt_itens_delete_perm on public.orcamento_alteracao_itens;
create policy orc_alt_itens_select_obra on public.orcamento_alteracao_itens for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('orcamento','visualizar'));
create policy orc_alt_itens_insert_perm on public.orcamento_alteracao_itens for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('orcamento','editar'));
create policy orc_alt_itens_update_perm on public.orcamento_alteracao_itens for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('orcamento','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('orcamento','editar'));
create policy orc_alt_itens_delete_perm on public.orcamento_alteracao_itens for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('orcamento','editar'));

-- ============================================================
-- 5. FORNECEDORES / CONTRATOS PREMIUM
-- ============================================================
alter table public.fornecedores enable row level security;
alter table public.contrato_alteracoes enable row level security;
alter table public.contrato_alteracao_itens enable row level security;

drop policy if exists fornecedores_select on public.fornecedores;
drop policy if exists fornecedores_insert_global on public.fornecedores;
drop policy if exists fornecedores_update_global on public.fornecedores;
create policy fornecedores_select on public.fornecedores for select to authenticated
using(private.tem_permissao('contratos','visualizar'));
create policy fornecedores_insert_global on public.fornecedores for insert to authenticated
with check(private.usuario_global());
create policy fornecedores_update_global on public.fornecedores for update to authenticated
using(private.usuario_global()) with check(private.usuario_global());

-- Contratos comerciais deixam de ser governados pelo módulo Medições.
drop policy if exists contratos_comerciais_rbac_select on public.contratos_comerciais;
drop policy if exists contratos_comerciais_rbac_insert on public.contratos_comerciais;
drop policy if exists contratos_comerciais_rbac_update on public.contratos_comerciais;
drop policy if exists contratos_comerciais_rbac_delete on public.contratos_comerciais;
create policy contratos_comerciais_rbac_select on public.contratos_comerciais for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','visualizar'));
create policy contratos_comerciais_rbac_insert on public.contratos_comerciais for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','criar'));
create policy contratos_comerciais_rbac_update on public.contratos_comerciais for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','editar'));
create policy contratos_comerciais_rbac_delete on public.contratos_comerciais for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','excluir'));

drop policy if exists contrato_itens_rbac_select on public.contrato_itens;
drop policy if exists contrato_itens_rbac_insert on public.contrato_itens;
drop policy if exists contrato_itens_rbac_update on public.contrato_itens;
drop policy if exists contrato_itens_rbac_delete on public.contrato_itens;
create policy contrato_itens_rbac_select on public.contrato_itens for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','visualizar'));
create policy contrato_itens_rbac_insert on public.contrato_itens for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','criar'));
create policy contrato_itens_rbac_update on public.contrato_itens for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','editar'));
create policy contrato_itens_rbac_delete on public.contrato_itens for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','editar'));

drop policy if exists contrato_alt_select on public.contrato_alteracoes;
drop policy if exists contrato_alt_insert on public.contrato_alteracoes;
drop policy if exists contrato_alt_update on public.contrato_alteracoes;
drop policy if exists contrato_alt_delete on public.contrato_alteracoes;
create policy contrato_alt_select on public.contrato_alteracoes for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','visualizar'));
create policy contrato_alt_insert on public.contrato_alteracoes for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','criar'));
create policy contrato_alt_update on public.contrato_alteracoes for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','editar'));
create policy contrato_alt_delete on public.contrato_alteracoes for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','editar'));

drop policy if exists contrato_alt_item_select on public.contrato_alteracao_itens;
drop policy if exists contrato_alt_item_insert on public.contrato_alteracao_itens;
drop policy if exists contrato_alt_item_update on public.contrato_alteracao_itens;
drop policy if exists contrato_alt_item_delete on public.contrato_alteracao_itens;
create policy contrato_alt_item_select on public.contrato_alteracao_itens for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','visualizar'));
create policy contrato_alt_item_insert on public.contrato_alteracao_itens for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','editar'));
create policy contrato_alt_item_update on public.contrato_alteracao_itens for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','editar'));
create policy contrato_alt_item_delete on public.contrato_alteracao_itens for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('contratos','editar'));

-- ============================================================
-- 6. COMPROMISSOS — LEITURA PELO APP, ESCRITA SOMENTE PELO MOTOR
-- ============================================================
alter table public.compromissos enable row level security;
alter table public.compromisso_itens enable row level security;

drop policy if exists compromissos_select on public.compromissos;
create policy compromissos_select on public.compromissos for select to authenticated
using(private.tem_acesso_obra(obra_id) and (
  private.tem_permissao('custos','visualizar') or
  private.tem_permissao('contratos','visualizar') or
  private.tem_permissao('orcamento','visualizar')
));
drop policy if exists compromisso_itens_select on public.compromisso_itens;
create policy compromisso_itens_select on public.compromisso_itens for select to authenticated
using(private.tem_acesso_obra(obra_id) and (
  private.tem_permissao('custos','visualizar') or
  private.tem_permissao('contratos','visualizar') or
  private.tem_permissao('orcamento','visualizar')
));

-- ============================================================
-- 7. CUSTOS / PAGAMENTOS / FORECAST
-- ============================================================
alter table public.custos_lancamentos enable row level security;
alter table public.pagamentos enable row level security;
alter table public.forecast_itens enable row level security;

drop policy if exists custos_lancamentos_select_perm on public.custos_lancamentos;
drop policy if exists custos_lancamentos_insert_perm on public.custos_lancamentos;
drop policy if exists custos_lancamentos_update_perm on public.custos_lancamentos;
drop policy if exists custos_lancamentos_delete_perm on public.custos_lancamentos;
create policy custos_lancamentos_select_perm on public.custos_lancamentos for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('custos','visualizar'));
create policy custos_lancamentos_insert_perm on public.custos_lancamentos for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('custos','criar'));
create policy custos_lancamentos_update_perm on public.custos_lancamentos for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('custos','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('custos','editar'));
create policy custos_lancamentos_delete_perm on public.custos_lancamentos for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('custos','editar'));

drop policy if exists pagamentos_select_perm on public.pagamentos;
drop policy if exists pagamentos_insert_perm on public.pagamentos;
drop policy if exists pagamentos_update_perm on public.pagamentos;
create policy pagamentos_select_perm on public.pagamentos for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('custos','visualizar'));
create policy pagamentos_insert_perm on public.pagamentos for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('custos','aprovar'));
create policy pagamentos_update_perm on public.pagamentos for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('custos','aprovar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('custos','aprovar'));
drop policy if exists forecast_itens_select_perm on public.forecast_itens;
drop policy if exists forecast_itens_insert_perm on public.forecast_itens;
drop policy if exists forecast_itens_update_perm on public.forecast_itens;
drop policy if exists forecast_itens_delete_perm on public.forecast_itens;
create policy forecast_itens_select_perm on public.forecast_itens for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('custos','visualizar'));
create policy forecast_itens_insert_perm on public.forecast_itens for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('custos','criar'));
create policy forecast_itens_update_perm on public.forecast_itens for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('custos','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('custos','editar'));
create policy forecast_itens_delete_perm on public.forecast_itens for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('custos','editar'));

-- ============================================================
-- 8. PLANEJAMENTO
-- ============================================================
alter table public.planejamento_cronogramas enable row level security;
alter table public.planejamento_atividades enable row level security;
alter table public.planejamento_programacoes enable row level security;
alter table public.planejamento_programacao_itens enable row level security;
alter table public.planejamento_restricoes enable row level security;
drop policy if exists planejamento_cronogramas_select_perm on public.planejamento_cronogramas;
drop policy if exists planejamento_cronogramas_insert_perm on public.planejamento_cronogramas;
drop policy if exists planejamento_cronogramas_update_perm on public.planejamento_cronogramas;
drop policy if exists planejamento_cronogramas_delete_perm on public.planejamento_cronogramas;
create policy planejamento_cronogramas_select_perm on public.planejamento_cronogramas for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','visualizar'));
create policy planejamento_cronogramas_insert_perm on public.planejamento_cronogramas for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','criar'));
create policy planejamento_cronogramas_update_perm on public.planejamento_cronogramas for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','editar'));
create policy planejamento_cronogramas_delete_perm on public.planejamento_cronogramas for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','editar'));
drop policy if exists planejamento_atividades_select_perm on public.planejamento_atividades;
drop policy if exists planejamento_atividades_insert_perm on public.planejamento_atividades;
drop policy if exists planejamento_atividades_update_perm on public.planejamento_atividades;
drop policy if exists planejamento_atividades_delete_perm on public.planejamento_atividades;
create policy planejamento_atividades_select_perm on public.planejamento_atividades for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','visualizar'));
create policy planejamento_atividades_insert_perm on public.planejamento_atividades for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','criar'));
create policy planejamento_atividades_update_perm on public.planejamento_atividades for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','editar'));
create policy planejamento_atividades_delete_perm on public.planejamento_atividades for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','editar'));
drop policy if exists planejamento_programacoes_select_perm on public.planejamento_programacoes;
drop policy if exists planejamento_programacoes_insert_perm on public.planejamento_programacoes;
drop policy if exists planejamento_programacoes_update_perm on public.planejamento_programacoes;
drop policy if exists planejamento_programacoes_delete_perm on public.planejamento_programacoes;
create policy planejamento_programacoes_select_perm on public.planejamento_programacoes for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','visualizar'));
create policy planejamento_programacoes_insert_perm on public.planejamento_programacoes for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','criar'));
create policy planejamento_programacoes_update_perm on public.planejamento_programacoes for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','editar'));
create policy planejamento_programacoes_delete_perm on public.planejamento_programacoes for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','editar'));
drop policy if exists planejamento_programacao_itens_select_perm on public.planejamento_programacao_itens;
drop policy if exists planejamento_programacao_itens_insert_perm on public.planejamento_programacao_itens;
drop policy if exists planejamento_programacao_itens_update_perm on public.planejamento_programacao_itens;
drop policy if exists planejamento_programacao_itens_delete_perm on public.planejamento_programacao_itens;
create policy planejamento_programacao_itens_select_perm on public.planejamento_programacao_itens for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','visualizar'));
create policy planejamento_programacao_itens_insert_perm on public.planejamento_programacao_itens for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','criar'));
create policy planejamento_programacao_itens_update_perm on public.planejamento_programacao_itens for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','editar'));
create policy planejamento_programacao_itens_delete_perm on public.planejamento_programacao_itens for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','editar'));
drop policy if exists planejamento_restricoes_select_perm on public.planejamento_restricoes;
drop policy if exists planejamento_restricoes_insert_perm on public.planejamento_restricoes;
drop policy if exists planejamento_restricoes_update_perm on public.planejamento_restricoes;
drop policy if exists planejamento_restricoes_delete_perm on public.planejamento_restricoes;
create policy planejamento_restricoes_select_perm on public.planejamento_restricoes for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','visualizar'));
create policy planejamento_restricoes_insert_perm on public.planejamento_restricoes for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','criar'));
create policy planejamento_restricoes_update_perm on public.planejamento_restricoes for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','editar'));
create policy planejamento_restricoes_delete_perm on public.planejamento_restricoes for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('planejamento','editar'));

-- ============================================================
-- 9. GED / REVISÕES / WORKFLOW DOCUMENTAL
-- ============================================================
alter table public.documento_revisoes enable row level security;
alter table public.documento_workflow enable row level security;
drop policy if exists documento_revisoes_select_perm on public.documento_revisoes;
drop policy if exists documento_revisoes_insert_perm on public.documento_revisoes;
drop policy if exists documento_revisoes_update_perm on public.documento_revisoes;
drop policy if exists documento_revisoes_delete_perm on public.documento_revisoes;
create policy documento_revisoes_select_perm on public.documento_revisoes for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('documentos','visualizar'));
create policy documento_revisoes_insert_perm on public.documento_revisoes for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('documentos','criar'));
create policy documento_revisoes_update_perm on public.documento_revisoes for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('documentos','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('documentos','editar'));
create policy documento_revisoes_delete_perm on public.documento_revisoes for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('documentos','editar'));
drop policy if exists documento_workflow_select_perm on public.documento_workflow;
drop policy if exists documento_workflow_insert_perm on public.documento_workflow;
drop policy if exists documento_workflow_update_perm on public.documento_workflow;
drop policy if exists documento_workflow_delete_perm on public.documento_workflow;
create policy documento_workflow_select_perm on public.documento_workflow for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('documentos','visualizar'));
create policy documento_workflow_insert_perm on public.documento_workflow for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('documentos','criar'));
create policy documento_workflow_update_perm on public.documento_workflow for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('documentos','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('documentos','editar'));
create policy documento_workflow_delete_perm on public.documento_workflow for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('documentos','editar'));

-- ============================================================
-- 10. AUDITORIA
-- ============================================================
alter table public.auditoria_eventos enable row level security;
drop policy if exists auditoria_select on public.auditoria_eventos;
create policy auditoria_select on public.auditoria_eventos for select to authenticated
using(
  private.usuario_global()
  or (obra_id is not null and private.tem_acesso_obra(obra_id) and public.eh_gestor())
);

-- ============================================================
-- 11. FUNÇÕES INTERNAS: NÃO EXPOR EXECUTE A CLIENTES
-- ============================================================
revoke execute on function private.validar_eap_hierarquia() from public,anon,authenticated;
revoke execute on function private.validar_cbs_hierarquia() from public,anon,authenticated;
revoke execute on function private.validar_orcamento_aprovacao() from public,anon,authenticated;
revoke execute on function private.bloquear_item_orcamento_aprovado() from public,anon,authenticated;
revoke execute on function private.validar_obra_item_alteracao() from public,anon,authenticated;
revoke execute on function private.validar_alteracao_orcamentaria_aprovacao() from public,anon,authenticated;
revoke execute on function private.bloquear_orcamento_alteracao_aprovada() from public,anon,authenticated;
revoke execute on function private.bloquear_item_orc_alt_aprovada() from public,anon,authenticated;
revoke execute on function private.preencher_obra_contrato_item() from public,anon,authenticated;
-- valor_total de contrato_itens é GENERATED ALWAYS; não existe função de recálculo manual.
revoke execute on function private.validar_contrato_aprovacao() from public,anon,authenticated;
revoke execute on function private.preencher_obra_contrato_alteracao() from public,anon,authenticated;
revoke execute on function private.preencher_obra_contrato_alt_item() from public,anon,authenticated;
revoke execute on function private.validar_alteracao_contratual_aprovacao() from public,anon,authenticated;
revoke execute on function private.recalcular_compromisso_contrato(uuid) from public,anon,authenticated;
revoke execute on function private.trg_compromisso_contrato() from public,anon,authenticated;
revoke execute on function private.bloquear_item_contrato_aprovado() from public,anon,authenticated;
revoke execute on function private.trg_compromisso_alteracao_contrato() from public,anon,authenticated;
revoke execute on function private.bloquear_item_alteracao_aprovada() from public,anon,authenticated;
revoke execute on function private.bloquear_cabecalho_alteracao_aprovada() from public,anon,authenticated;
revoke execute on function private.auditar_mutacao() from public,anon,authenticated;

commit;
