-- BUILDLy Premium — Migration 04B (CANDIDATA)
-- RBAC efetivo por operação + API de permissões para o frontend.
--
-- PRÉ-REQUISITOS:
--   Migration 01: fundação de segurança
--   Migration 02: hardening de grants/funções
--   Migration 03 V2: isolamento multiobra RESTRICTIVE
--   Migration 04A: matriz CRUD + especialidades
--
-- Esta migration remove os auth_all permissivos e cria policies
-- por módulo/operação. As policies tenant_* da Migration 03 continuam
-- obrigatórias, portanto permissão + escopo da obra devem ser verdadeiros.
--
-- NÃO APLICAR DIRETAMENTE EM PRODUÇÃO SEM EXECUTAR A VALIDAÇÃO 04B.

begin;

-- ============================================================
-- 1. REMOVER auth_all DAS TABELAS CONTROLADAS
-- ============================================================

drop policy if exists auth_all on public.ajuda_custo;
drop policy if exists auth_all on public.atividades;
drop policy if exists auth_all on public.contrato_itens;
drop policy if exists auth_all on public.contratos;
drop policy if exists auth_all on public.contratos_comerciais;
drop policy if exists auth_all on public.documento_notas;
drop policy if exists auth_all on public.documentos;
drop policy if exists auth_all on public.emissoes;
drop policy if exists auth_all on public.epi_entregas;
drop policy if exists auth_all on public.epi_funcao;
drop policy if exists auth_all on public.epis;
drop policy if exists auth_all on public.equipamentos;
drop policy if exists auth_all on public.funcoes;
drop policy if exists auth_all on public.medicao_itens;
drop policy if exists auth_all on public.medicoes;
drop policy if exists auth_all on public.mural;
drop policy if exists auth_all on public.nf_itens;
drop policy if exists auth_all on public.nfs;
drop policy if exists auth_all on public.obras;
drop policy if exists auth_all on public.ocorrencias;
drop policy if exists auth_all on public.pessoas;
drop policy if exists auth_all on public.rdo_atividades;
drop policy if exists auth_all on public.rdo_equipamentos;
drop policy if exists auth_all on public.rdo_fotos;
drop policy if exists auth_all on public.rdo_presencas;
drop policy if exists auth_all on public.rdos;
drop policy if exists auth_all on public.reuniao_participantes;
drop policy if exists auth_all on public.reuniao_pauta;
drop policy if exists auth_all on public.reuniao_topicos;
drop policy if exists auth_all on public.reunioes;
drop policy if exists auth_all on public.tarefas;

-- ============================================================
-- 2. POLICIES CRUD POR MÓDULO
-- ============================================================

-- ---------- CADASTRO ----------

drop policy if exists pessoas_rbac_select on public.pessoas;
create policy pessoas_rbac_select
on public.pessoas
for select to authenticated
using (private.tem_permissao('cadastro','visualizar'));

drop policy if exists pessoas_rbac_insert on public.pessoas;
create policy pessoas_rbac_insert
on public.pessoas
for insert to authenticated
with check (private.tem_permissao('cadastro','criar'));

drop policy if exists pessoas_rbac_update on public.pessoas;
create policy pessoas_rbac_update
on public.pessoas
for update to authenticated
using (private.tem_permissao('cadastro','editar'))
with check (private.tem_permissao('cadastro','editar'));

drop policy if exists pessoas_rbac_delete on public.pessoas;
create policy pessoas_rbac_delete
on public.pessoas
for delete to authenticated
using (private.tem_permissao('cadastro','excluir'));

drop policy if exists contratos_rbac_select on public.contratos;
create policy contratos_rbac_select
on public.contratos
for select to authenticated
using (private.tem_permissao('cadastro','visualizar'));

drop policy if exists contratos_rbac_insert on public.contratos;
create policy contratos_rbac_insert
on public.contratos
for insert to authenticated
with check (private.tem_permissao('cadastro','criar'));

drop policy if exists contratos_rbac_update on public.contratos;
create policy contratos_rbac_update
on public.contratos
for update to authenticated
using (private.tem_permissao('cadastro','editar'))
with check (private.tem_permissao('cadastro','editar'));

drop policy if exists contratos_rbac_delete on public.contratos;
create policy contratos_rbac_delete
on public.contratos
for delete to authenticated
using (private.tem_permissao('cadastro','excluir'));

drop policy if exists equipamentos_rbac_select on public.equipamentos;
create policy equipamentos_rbac_select
on public.equipamentos
for select to authenticated
using (private.tem_permissao('cadastro','visualizar'));

drop policy if exists equipamentos_rbac_insert on public.equipamentos;
create policy equipamentos_rbac_insert
on public.equipamentos
for insert to authenticated
with check (private.tem_permissao('cadastro','criar'));

drop policy if exists equipamentos_rbac_update on public.equipamentos;
create policy equipamentos_rbac_update
on public.equipamentos
for update to authenticated
using (private.tem_permissao('cadastro','editar'))
with check (private.tem_permissao('cadastro','editar'));

drop policy if exists equipamentos_rbac_delete on public.equipamentos;
create policy equipamentos_rbac_delete
on public.equipamentos
for delete to authenticated
using (private.tem_permissao('cadastro','excluir'));

drop policy if exists epi_entregas_rbac_select on public.epi_entregas;
create policy epi_entregas_rbac_select
on public.epi_entregas
for select to authenticated
using (private.tem_permissao('cadastro','visualizar'));

drop policy if exists epi_entregas_rbac_insert on public.epi_entregas;
create policy epi_entregas_rbac_insert
on public.epi_entregas
for insert to authenticated
with check (private.tem_permissao('cadastro','criar'));

drop policy if exists epi_entregas_rbac_update on public.epi_entregas;
create policy epi_entregas_rbac_update
on public.epi_entregas
for update to authenticated
using (private.tem_permissao('cadastro','editar'))
with check (private.tem_permissao('cadastro','editar'));

drop policy if exists epi_entregas_rbac_delete on public.epi_entregas;
create policy epi_entregas_rbac_delete
on public.epi_entregas
for delete to authenticated
using (private.tem_permissao('cadastro','excluir'));

-- ---------- RDO ----------

drop policy if exists rdos_rbac_select on public.rdos;
create policy rdos_rbac_select
on public.rdos
for select to authenticated
using (private.tem_permissao('rdo','visualizar'));

drop policy if exists rdos_rbac_insert on public.rdos;
create policy rdos_rbac_insert
on public.rdos
for insert to authenticated
with check (private.tem_permissao('rdo','criar'));

drop policy if exists rdos_rbac_update on public.rdos;
create policy rdos_rbac_update
on public.rdos
for update to authenticated
using (private.tem_permissao('rdo','editar'))
with check (private.tem_permissao('rdo','editar'));

drop policy if exists rdos_rbac_delete on public.rdos;
create policy rdos_rbac_delete
on public.rdos
for delete to authenticated
using (private.tem_permissao('rdo','excluir'));

drop policy if exists rdo_atividades_rbac_select on public.rdo_atividades;
create policy rdo_atividades_rbac_select
on public.rdo_atividades
for select to authenticated
using (private.tem_permissao('rdo','visualizar'));

drop policy if exists rdo_atividades_rbac_insert on public.rdo_atividades;
create policy rdo_atividades_rbac_insert
on public.rdo_atividades
for insert to authenticated
with check (private.tem_permissao('rdo','criar'));

drop policy if exists rdo_atividades_rbac_update on public.rdo_atividades;
create policy rdo_atividades_rbac_update
on public.rdo_atividades
for update to authenticated
using (private.tem_permissao('rdo','editar'))
with check (private.tem_permissao('rdo','editar'));

drop policy if exists rdo_atividades_rbac_delete on public.rdo_atividades;
create policy rdo_atividades_rbac_delete
on public.rdo_atividades
for delete to authenticated
using (private.tem_permissao('rdo','excluir'));

drop policy if exists rdo_equipamentos_rbac_select on public.rdo_equipamentos;
create policy rdo_equipamentos_rbac_select
on public.rdo_equipamentos
for select to authenticated
using (private.tem_permissao('rdo','visualizar'));

drop policy if exists rdo_equipamentos_rbac_insert on public.rdo_equipamentos;
create policy rdo_equipamentos_rbac_insert
on public.rdo_equipamentos
for insert to authenticated
with check (private.tem_permissao('rdo','criar'));

drop policy if exists rdo_equipamentos_rbac_update on public.rdo_equipamentos;
create policy rdo_equipamentos_rbac_update
on public.rdo_equipamentos
for update to authenticated
using (private.tem_permissao('rdo','editar'))
with check (private.tem_permissao('rdo','editar'));

drop policy if exists rdo_equipamentos_rbac_delete on public.rdo_equipamentos;
create policy rdo_equipamentos_rbac_delete
on public.rdo_equipamentos
for delete to authenticated
using (private.tem_permissao('rdo','excluir'));

drop policy if exists rdo_fotos_rbac_select on public.rdo_fotos;
create policy rdo_fotos_rbac_select
on public.rdo_fotos
for select to authenticated
using (private.tem_permissao('rdo','visualizar'));

drop policy if exists rdo_fotos_rbac_insert on public.rdo_fotos;
create policy rdo_fotos_rbac_insert
on public.rdo_fotos
for insert to authenticated
with check (private.tem_permissao('rdo','criar'));

drop policy if exists rdo_fotos_rbac_update on public.rdo_fotos;
create policy rdo_fotos_rbac_update
on public.rdo_fotos
for update to authenticated
using (private.tem_permissao('rdo','editar'))
with check (private.tem_permissao('rdo','editar'));

drop policy if exists rdo_fotos_rbac_delete on public.rdo_fotos;
create policy rdo_fotos_rbac_delete
on public.rdo_fotos
for delete to authenticated
using (private.tem_permissao('rdo','excluir'));

drop policy if exists rdo_presencas_rbac_select on public.rdo_presencas;
create policy rdo_presencas_rbac_select
on public.rdo_presencas
for select to authenticated
using (private.tem_permissao('rdo','visualizar'));

drop policy if exists rdo_presencas_rbac_insert on public.rdo_presencas;
create policy rdo_presencas_rbac_insert
on public.rdo_presencas
for insert to authenticated
with check (private.tem_permissao('rdo','criar'));

drop policy if exists rdo_presencas_rbac_update on public.rdo_presencas;
create policy rdo_presencas_rbac_update
on public.rdo_presencas
for update to authenticated
using (private.tem_permissao('rdo','editar'))
with check (private.tem_permissao('rdo','editar'));

drop policy if exists rdo_presencas_rbac_delete on public.rdo_presencas;
create policy rdo_presencas_rbac_delete
on public.rdo_presencas
for delete to authenticated
using (private.tem_permissao('rdo','excluir'));

-- ---------- OCORRENCIAS ----------

drop policy if exists ocorrencias_rbac_select on public.ocorrencias;
create policy ocorrencias_rbac_select
on public.ocorrencias
for select to authenticated
using (private.tem_permissao('ocorrencias','visualizar'));

drop policy if exists ocorrencias_rbac_insert on public.ocorrencias;
create policy ocorrencias_rbac_insert
on public.ocorrencias
for insert to authenticated
with check (private.tem_permissao('ocorrencias','criar'));

drop policy if exists ocorrencias_rbac_update on public.ocorrencias;
create policy ocorrencias_rbac_update
on public.ocorrencias
for update to authenticated
using (private.tem_permissao('ocorrencias','editar'))
with check (private.tem_permissao('ocorrencias','editar'));

drop policy if exists ocorrencias_rbac_delete on public.ocorrencias;
create policy ocorrencias_rbac_delete
on public.ocorrencias
for delete to authenticated
using (private.tem_permissao('ocorrencias','excluir'));

-- ---------- TAREFAS ----------

drop policy if exists tarefas_rbac_select on public.tarefas;
create policy tarefas_rbac_select
on public.tarefas
for select to authenticated
using (private.tem_permissao('tarefas','visualizar'));

drop policy if exists tarefas_rbac_insert on public.tarefas;
create policy tarefas_rbac_insert
on public.tarefas
for insert to authenticated
with check (private.tem_permissao('tarefas','criar'));

drop policy if exists tarefas_rbac_update on public.tarefas;
create policy tarefas_rbac_update
on public.tarefas
for update to authenticated
using (private.tem_permissao('tarefas','editar'))
with check (private.tem_permissao('tarefas','editar'));

drop policy if exists tarefas_rbac_delete on public.tarefas;
create policy tarefas_rbac_delete
on public.tarefas
for delete to authenticated
using (private.tem_permissao('tarefas','excluir'));

-- ---------- NFS ----------

drop policy if exists nfs_rbac_select on public.nfs;
create policy nfs_rbac_select
on public.nfs
for select to authenticated
using (private.tem_permissao('nfs','visualizar'));

drop policy if exists nfs_rbac_insert on public.nfs;
create policy nfs_rbac_insert
on public.nfs
for insert to authenticated
with check (private.tem_permissao('nfs','criar'));

drop policy if exists nfs_rbac_update on public.nfs;
create policy nfs_rbac_update
on public.nfs
for update to authenticated
using (private.tem_permissao('nfs','editar'))
with check (private.tem_permissao('nfs','editar'));

drop policy if exists nfs_rbac_delete on public.nfs;
create policy nfs_rbac_delete
on public.nfs
for delete to authenticated
using (private.tem_permissao('nfs','excluir'));

drop policy if exists nf_itens_rbac_select on public.nf_itens;
create policy nf_itens_rbac_select
on public.nf_itens
for select to authenticated
using (private.tem_permissao('nfs','visualizar'));

drop policy if exists nf_itens_rbac_insert on public.nf_itens;
create policy nf_itens_rbac_insert
on public.nf_itens
for insert to authenticated
with check (private.tem_permissao('nfs','criar'));

drop policy if exists nf_itens_rbac_update on public.nf_itens;
create policy nf_itens_rbac_update
on public.nf_itens
for update to authenticated
using (private.tem_permissao('nfs','editar'))
with check (private.tem_permissao('nfs','editar'));

drop policy if exists nf_itens_rbac_delete on public.nf_itens;
create policy nf_itens_rbac_delete
on public.nf_itens
for delete to authenticated
using (private.tem_permissao('nfs','excluir'));

-- ---------- MEDICOES ----------

drop policy if exists contratos_comerciais_rbac_select on public.contratos_comerciais;
create policy contratos_comerciais_rbac_select
on public.contratos_comerciais
for select to authenticated
using (private.tem_permissao('medicoes','visualizar'));

drop policy if exists contratos_comerciais_rbac_insert on public.contratos_comerciais;
create policy contratos_comerciais_rbac_insert
on public.contratos_comerciais
for insert to authenticated
with check (private.tem_permissao('medicoes','criar'));

drop policy if exists contratos_comerciais_rbac_update on public.contratos_comerciais;
create policy contratos_comerciais_rbac_update
on public.contratos_comerciais
for update to authenticated
using (private.tem_permissao('medicoes','editar'))
with check (private.tem_permissao('medicoes','editar'));

drop policy if exists contratos_comerciais_rbac_delete on public.contratos_comerciais;
create policy contratos_comerciais_rbac_delete
on public.contratos_comerciais
for delete to authenticated
using (private.tem_permissao('medicoes','excluir'));

drop policy if exists contrato_itens_rbac_select on public.contrato_itens;
create policy contrato_itens_rbac_select
on public.contrato_itens
for select to authenticated
using (private.tem_permissao('medicoes','visualizar'));

drop policy if exists contrato_itens_rbac_insert on public.contrato_itens;
create policy contrato_itens_rbac_insert
on public.contrato_itens
for insert to authenticated
with check (private.tem_permissao('medicoes','criar'));

drop policy if exists contrato_itens_rbac_update on public.contrato_itens;
create policy contrato_itens_rbac_update
on public.contrato_itens
for update to authenticated
using (private.tem_permissao('medicoes','editar'))
with check (private.tem_permissao('medicoes','editar'));

drop policy if exists contrato_itens_rbac_delete on public.contrato_itens;
create policy contrato_itens_rbac_delete
on public.contrato_itens
for delete to authenticated
using (private.tem_permissao('medicoes','excluir'));

drop policy if exists medicoes_rbac_select on public.medicoes;
create policy medicoes_rbac_select
on public.medicoes
for select to authenticated
using (private.tem_permissao('medicoes','visualizar'));

drop policy if exists medicoes_rbac_insert on public.medicoes;
create policy medicoes_rbac_insert
on public.medicoes
for insert to authenticated
with check (private.tem_permissao('medicoes','criar'));

drop policy if exists medicoes_rbac_update on public.medicoes;
create policy medicoes_rbac_update
on public.medicoes
for update to authenticated
using (private.tem_permissao('medicoes','editar'))
with check (private.tem_permissao('medicoes','editar'));

drop policy if exists medicoes_rbac_delete on public.medicoes;
create policy medicoes_rbac_delete
on public.medicoes
for delete to authenticated
using (private.tem_permissao('medicoes','excluir'));

drop policy if exists medicao_itens_rbac_select on public.medicao_itens;
create policy medicao_itens_rbac_select
on public.medicao_itens
for select to authenticated
using (private.tem_permissao('medicoes','visualizar'));

drop policy if exists medicao_itens_rbac_insert on public.medicao_itens;
create policy medicao_itens_rbac_insert
on public.medicao_itens
for insert to authenticated
with check (private.tem_permissao('medicoes','criar'));

drop policy if exists medicao_itens_rbac_update on public.medicao_itens;
create policy medicao_itens_rbac_update
on public.medicao_itens
for update to authenticated
using (private.tem_permissao('medicoes','editar'))
with check (private.tem_permissao('medicoes','editar'));

drop policy if exists medicao_itens_rbac_delete on public.medicao_itens;
create policy medicao_itens_rbac_delete
on public.medicao_itens
for delete to authenticated
using (private.tem_permissao('medicoes','excluir'));

-- ---------- REUNIOES ----------

drop policy if exists reunioes_rbac_select on public.reunioes;
create policy reunioes_rbac_select
on public.reunioes
for select to authenticated
using (private.tem_permissao('reunioes','visualizar'));

drop policy if exists reunioes_rbac_insert on public.reunioes;
create policy reunioes_rbac_insert
on public.reunioes
for insert to authenticated
with check (private.tem_permissao('reunioes','criar'));

drop policy if exists reunioes_rbac_update on public.reunioes;
create policy reunioes_rbac_update
on public.reunioes
for update to authenticated
using (private.tem_permissao('reunioes','editar'))
with check (private.tem_permissao('reunioes','editar'));

drop policy if exists reunioes_rbac_delete on public.reunioes;
create policy reunioes_rbac_delete
on public.reunioes
for delete to authenticated
using (private.tem_permissao('reunioes','excluir'));

drop policy if exists reuniao_participantes_rbac_select on public.reuniao_participantes;
create policy reuniao_participantes_rbac_select
on public.reuniao_participantes
for select to authenticated
using (private.tem_permissao('reunioes','visualizar'));

drop policy if exists reuniao_participantes_rbac_insert on public.reuniao_participantes;
create policy reuniao_participantes_rbac_insert
on public.reuniao_participantes
for insert to authenticated
with check (private.tem_permissao('reunioes','criar'));

drop policy if exists reuniao_participantes_rbac_update on public.reuniao_participantes;
create policy reuniao_participantes_rbac_update
on public.reuniao_participantes
for update to authenticated
using (private.tem_permissao('reunioes','editar'))
with check (private.tem_permissao('reunioes','editar'));

drop policy if exists reuniao_participantes_rbac_delete on public.reuniao_participantes;
create policy reuniao_participantes_rbac_delete
on public.reuniao_participantes
for delete to authenticated
using (private.tem_permissao('reunioes','excluir'));

drop policy if exists reuniao_topicos_rbac_select on public.reuniao_topicos;
create policy reuniao_topicos_rbac_select
on public.reuniao_topicos
for select to authenticated
using (private.tem_permissao('reunioes','visualizar'));

drop policy if exists reuniao_topicos_rbac_insert on public.reuniao_topicos;
create policy reuniao_topicos_rbac_insert
on public.reuniao_topicos
for insert to authenticated
with check (private.tem_permissao('reunioes','criar'));

drop policy if exists reuniao_topicos_rbac_update on public.reuniao_topicos;
create policy reuniao_topicos_rbac_update
on public.reuniao_topicos
for update to authenticated
using (private.tem_permissao('reunioes','editar'))
with check (private.tem_permissao('reunioes','editar'));

drop policy if exists reuniao_topicos_rbac_delete on public.reuniao_topicos;
create policy reuniao_topicos_rbac_delete
on public.reuniao_topicos
for delete to authenticated
using (private.tem_permissao('reunioes','excluir'));

drop policy if exists reuniao_pauta_rbac_select on public.reuniao_pauta;
create policy reuniao_pauta_rbac_select
on public.reuniao_pauta
for select to authenticated
using (private.tem_permissao('reunioes','visualizar'));

drop policy if exists reuniao_pauta_rbac_insert on public.reuniao_pauta;
create policy reuniao_pauta_rbac_insert
on public.reuniao_pauta
for insert to authenticated
with check (private.tem_permissao('reunioes','criar'));

drop policy if exists reuniao_pauta_rbac_update on public.reuniao_pauta;
create policy reuniao_pauta_rbac_update
on public.reuniao_pauta
for update to authenticated
using (private.tem_permissao('reunioes','editar'))
with check (private.tem_permissao('reunioes','editar'));

drop policy if exists reuniao_pauta_rbac_delete on public.reuniao_pauta;
create policy reuniao_pauta_rbac_delete
on public.reuniao_pauta
for delete to authenticated
using (private.tem_permissao('reunioes','excluir'));

-- ---------- DOCUMENTOS ----------

drop policy if exists documentos_rbac_select on public.documentos;
create policy documentos_rbac_select
on public.documentos
for select to authenticated
using (private.tem_permissao('documentos','visualizar'));

drop policy if exists documentos_rbac_insert on public.documentos;
create policy documentos_rbac_insert
on public.documentos
for insert to authenticated
with check (private.tem_permissao('documentos','criar'));

drop policy if exists documentos_rbac_update on public.documentos;
create policy documentos_rbac_update
on public.documentos
for update to authenticated
using (private.tem_permissao('documentos','editar'))
with check (private.tem_permissao('documentos','editar'));

drop policy if exists documentos_rbac_delete on public.documentos;
create policy documentos_rbac_delete
on public.documentos
for delete to authenticated
using (private.tem_permissao('documentos','excluir'));

drop policy if exists documento_notas_rbac_select on public.documento_notas;
create policy documento_notas_rbac_select
on public.documento_notas
for select to authenticated
using (private.tem_permissao('documentos','visualizar'));

drop policy if exists documento_notas_rbac_insert on public.documento_notas;
create policy documento_notas_rbac_insert
on public.documento_notas
for insert to authenticated
with check (private.tem_permissao('documentos','criar'));

drop policy if exists documento_notas_rbac_update on public.documento_notas;
create policy documento_notas_rbac_update
on public.documento_notas
for update to authenticated
using (private.tem_permissao('documentos','editar'))
with check (private.tem_permissao('documentos','editar'));

drop policy if exists documento_notas_rbac_delete on public.documento_notas;
create policy documento_notas_rbac_delete
on public.documento_notas
for delete to authenticated
using (private.tem_permissao('documentos','excluir'));

drop policy if exists mural_rbac_select on public.mural;
create policy mural_rbac_select
on public.mural
for select to authenticated
using (private.tem_permissao('documentos','visualizar'));

drop policy if exists mural_rbac_insert on public.mural;
create policy mural_rbac_insert
on public.mural
for insert to authenticated
with check (private.tem_permissao('documentos','criar'));

drop policy if exists mural_rbac_update on public.mural;
create policy mural_rbac_update
on public.mural
for update to authenticated
using (private.tem_permissao('documentos','editar'))
with check (private.tem_permissao('documentos','editar'));

drop policy if exists mural_rbac_delete on public.mural;
create policy mural_rbac_delete
on public.mural
for delete to authenticated
using (private.tem_permissao('documentos','excluir'));

-- ---------- AJUDA DE CUSTO (TRANSIÇÃO) ----------
-- Mantida no módulo Cadastro nesta versão porque vw_efetivo usa a existência
-- da ajuda para determinar regime e próxima viagem. O futuro módulo Custos
-- separará informação operacional de valor financeiro.

drop policy if exists ajuda_custo_rbac_select on public.ajuda_custo;
create policy ajuda_custo_rbac_select
on public.ajuda_custo
for select to authenticated
using (private.tem_permissao('cadastro','visualizar'));

drop policy if exists ajuda_custo_rbac_insert on public.ajuda_custo;
create policy ajuda_custo_rbac_insert
on public.ajuda_custo
for insert to authenticated
with check (private.tem_permissao('cadastro','criar'));

drop policy if exists ajuda_custo_rbac_update on public.ajuda_custo;
create policy ajuda_custo_rbac_update
on public.ajuda_custo
for update to authenticated
using (private.tem_permissao('cadastro','editar'))
with check (private.tem_permissao('cadastro','editar'));

drop policy if exists ajuda_custo_rbac_delete on public.ajuda_custo;
create policy ajuda_custo_rbac_delete
on public.ajuda_custo
for delete to authenticated
using (private.tem_permissao('cadastro','excluir'));

-- ============================================================
-- 3. SOLICITAÇÕES
-- O formulário público continua tendo somente INSERT via policy anon.
-- Usuário autenticado da obra pode ler/avaliar se tiver Tarefas.
-- Solicitação é histórico: sem DELETE por usuário normal.
-- ============================================================

drop policy if exists solicitacao_leitura on public.solicitacoes;
drop policy if exists solicitacao_avalia on public.solicitacoes;

drop policy if exists solicitacoes_rbac_select on public.solicitacoes;
create policy solicitacoes_rbac_select
on public.solicitacoes
for select to authenticated
using (private.tem_permissao('tarefas','visualizar'));

drop policy if exists solicitacoes_rbac_update on public.solicitacoes;
create policy solicitacoes_rbac_update
on public.solicitacoes
for update to authenticated
using (private.tem_permissao('tarefas','editar'))
with check (private.tem_permissao('tarefas','editar'));

revoke delete on public.solicitacoes from authenticated;

-- A policy solicitacao_anon_insere NÃO é removida.

-- ============================================================
-- 4. ALERTAS / AVISOS
-- Usuário somente lê e marca lido_em.
-- O robô do sistema é responsável por criar/limpar avisos.
-- ============================================================

drop policy if exists avisos_leitura on public.avisos;
drop policy if exists avisos_marcar_lido on public.avisos;

drop policy if exists avisos_rbac_select on public.avisos;
create policy avisos_rbac_select
on public.avisos
for select to authenticated
using (private.tem_permissao('alertas','visualizar'));

drop policy if exists avisos_rbac_update on public.avisos;
create policy avisos_rbac_update
on public.avisos
for update to authenticated
using (private.tem_permissao('alertas','visualizar'))
with check (private.tem_permissao('alertas','visualizar'));

revoke insert, delete on public.avisos from authenticated;
revoke update on public.avisos from authenticated;
grant update (lido_em) on public.avisos to authenticated;

-- ============================================================
-- 5. CATÁLOGOS CORPORATIVOS
--
-- atividades, epis, funcoes e epi_funcao são globais no modelo atual.
-- Todos autenticados podem ler porque RDO/Cadastro dependem deles.
-- Somente o proprietário global altera, evitando que uma obra mude
-- o catálogo usado por todas as outras.
-- ============================================================

drop policy if exists atividades_catalogo_select on public.atividades;
create policy atividades_catalogo_select
on public.atividades
for select to authenticated
using (true);

drop policy if exists atividades_catalogo_insert on public.atividades;
create policy atividades_catalogo_insert
on public.atividades
for insert to authenticated
with check (private.usuario_global());

drop policy if exists atividades_catalogo_update on public.atividades;
create policy atividades_catalogo_update
on public.atividades
for update to authenticated
using (private.usuario_global())
with check (private.usuario_global());

drop policy if exists atividades_catalogo_delete on public.atividades;
create policy atividades_catalogo_delete
on public.atividades
for delete to authenticated
using (private.usuario_global());

drop policy if exists epis_catalogo_select on public.epis;
create policy epis_catalogo_select
on public.epis
for select to authenticated
using (true);

drop policy if exists epis_catalogo_insert on public.epis;
create policy epis_catalogo_insert
on public.epis
for insert to authenticated
with check (private.usuario_global());

drop policy if exists epis_catalogo_update on public.epis;
create policy epis_catalogo_update
on public.epis
for update to authenticated
using (private.usuario_global())
with check (private.usuario_global());

drop policy if exists epis_catalogo_delete on public.epis;
create policy epis_catalogo_delete
on public.epis
for delete to authenticated
using (private.usuario_global());

drop policy if exists funcoes_catalogo_select on public.funcoes;
create policy funcoes_catalogo_select
on public.funcoes
for select to authenticated
using (true);

drop policy if exists funcoes_catalogo_insert on public.funcoes;
create policy funcoes_catalogo_insert
on public.funcoes
for insert to authenticated
with check (private.usuario_global());

drop policy if exists funcoes_catalogo_update on public.funcoes;
create policy funcoes_catalogo_update
on public.funcoes
for update to authenticated
using (private.usuario_global())
with check (private.usuario_global());

drop policy if exists funcoes_catalogo_delete on public.funcoes;
create policy funcoes_catalogo_delete
on public.funcoes
for delete to authenticated
using (private.usuario_global());

drop policy if exists epi_funcao_catalogo_select on public.epi_funcao;
create policy epi_funcao_catalogo_select
on public.epi_funcao
for select to authenticated
using (true);

drop policy if exists epi_funcao_catalogo_insert on public.epi_funcao;
create policy epi_funcao_catalogo_insert
on public.epi_funcao
for insert to authenticated
with check (private.usuario_global());

drop policy if exists epi_funcao_catalogo_update on public.epi_funcao;
create policy epi_funcao_catalogo_update
on public.epi_funcao
for update to authenticated
using (private.usuario_global())
with check (private.usuario_global());

drop policy if exists epi_funcao_catalogo_delete on public.epi_funcao;
create policy epi_funcao_catalogo_delete
on public.epi_funcao
for delete to authenticated
using (private.usuario_global());

-- ============================================================
-- 6. CADASTRO MESTRE DA OBRA
--
-- SELECT continua limitado pela tenant_obras_select.
-- Proprietário global cria/remove obras.
-- Gestor local pode editar os metadados da própria obra.
-- Exclusão física da obra fica somente com o proprietário global:
-- em produto Premium a rotina normal será ARQUIVAR/INATIVAR, não apagar.
-- ============================================================

drop policy if exists obras_rbac_select on public.obras;
create policy obras_rbac_select
on public.obras
for select to authenticated
using (true);

drop policy if exists obras_rbac_insert on public.obras;
create policy obras_rbac_insert
on public.obras
for insert to authenticated
with check (private.usuario_global());

-- Substitui a restrição de UPDATE criada na Migration 03.
drop policy if exists tenant_obras_update on public.obras;
create policy tenant_obras_update
on public.obras as restrictive
for update to authenticated
using (
  private.usuario_global()
  or (
    public.eh_gestor()
    and private.tem_acesso_obra(id)
  )
)
with check (
  private.usuario_global()
  or (
    public.eh_gestor()
    and private.tem_acesso_obra(id)
  )
);

drop policy if exists obras_rbac_update on public.obras;
create policy obras_rbac_update
on public.obras
for update to authenticated
using (
  private.usuario_global()
  or public.eh_gestor()
)
with check (
  private.usuario_global()
  or public.eh_gestor()
);

drop policy if exists obras_rbac_delete on public.obras;
create policy obras_rbac_delete
on public.obras
for delete to authenticated
using (private.usuario_global());

-- ============================================================
-- 7. EMISSÕES — LEDGER DE AUDITORIA DE PDF/RELATÓRIO
--
-- append-only: usuário da obra pode ler e inserir uma emissão,
-- mas não editar nem apagar o registro depois.
-- A tenant policy garante que seja da obra acessível.
-- ============================================================

drop policy if exists emissoes_ledger_select on public.emissoes;
create policy emissoes_ledger_select
on public.emissoes
for select to authenticated
using (true);

drop policy if exists emissoes_ledger_insert on public.emissoes;
create policy emissoes_ledger_insert
on public.emissoes
for insert to authenticated
with check (true);

revoke update, delete on public.emissoes from authenticated;

-- ============================================================
-- 8. PERFIS
--
-- A leitura continua via perfis_leitura + tenant_perfis_select.
-- O update continua via perfis_gestor_atualiza + tenant_perfis_update.
-- Acesso global segue protegido pelo trigger criado na Migration 01.
-- Nenhum usuário comum ganha INSERT/DELETE direto em perfis.
-- ============================================================

revoke insert, delete on public.perfis from authenticated;

-- ============================================================
-- 9. CONTEXTO/PERMISSÕES PARA O FRONTEND
--
-- SECURITY DEFINER permanece no schema private.
-- O schema public expõe apenas views security_invoker de leitura.
-- ============================================================

grant usage on schema private to authenticated;

create or replace function private.minhas_permissoes_frontend()
returns table (modulo text, acao text)
language sql
stable
security definer
set search_path = ''
as $$
  with combinacoes as (
    select pp.modulo, pp.acao
    from private.papel_permissoes pp

    union

    select ep.modulo, ep.acao
    from private.especialidade_permissoes ep

    union

    select up.modulo, up.acao
    from private.perfil_permissoes up
    where up.user_id = (select auth.uid())
  )
  select distinct c.modulo, c.acao
  from combinacoes c
  where (select auth.uid()) is not null
    and private.tem_permissao(c.modulo, c.acao)
  order by c.modulo, c.acao;
$$;

revoke all on function private.minhas_permissoes_frontend() from public, anon;
grant execute on function private.minhas_permissoes_frontend() to authenticated;

create or replace function private.meu_contexto_buildly()
returns table (
  nome text,
  papel text,
  obra_id uuid,
  acesso_global boolean,
  especialidades text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.nome,
    p.papel,
    p.obra_id,
    p.acesso_global,
    coalesce(
      array(
        select pe.especialidade
        from private.perfil_especialidades pe
        where pe.user_id = p.id
        order by pe.especialidade
      ),
      array[]::text[]
    )
  from public.perfis p
  where p.id = (select auth.uid())
    and p.ativo = true;
$$;

revoke all on function private.meu_contexto_buildly() from public, anon;
grant execute on function private.meu_contexto_buildly() to authenticated;

drop view if exists public.vw_minhas_permissoes;
create view public.vw_minhas_permissoes
with (security_invoker=true)
as
select * from private.minhas_permissoes_frontend();

drop view if exists public.vw_meu_contexto_buildly;
create view public.vw_meu_contexto_buildly
with (security_invoker=true)
as
select * from private.meu_contexto_buildly();

revoke all on public.vw_minhas_permissoes from public, anon;
revoke all on public.vw_meu_contexto_buildly from public, anon;
grant select on public.vw_minhas_permissoes to authenticated;
grant select on public.vw_meu_contexto_buildly to authenticated;

commit;
