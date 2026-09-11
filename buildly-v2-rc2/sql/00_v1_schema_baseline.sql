-- ============================================================================
-- BUILDLy V1 — BASELINE RECONSTRUÍDO DO SCHEMA ATUAL
-- Snapshot: 2026-09-06
--
-- FINALIDADE:
--   Bootstrap de ambiente local / homologação para o BUILDLy Premium V2.
--
-- IMPORTANTE:
--   1) Este arquivo NÃO é o SQL original das 37 migrations históricas.
--   2) Ele reconstrói o estado estrutural observado do V1 em 2026-09-06.
--   3) Não contém dados de negócio.
--   4) Não deve ser aplicado sobre a produção existente.
--   5) Em ambiente novo, executar este baseline antes de 01_seguranca.sql.
--
-- Capturado em modo somente leitura a partir do Supabase P3:
--   - 34 tabelas public
--   - constraints e índices atuais
--   - 11 funções public
--   - 12 views security_invoker
--   - 9 triggers (incluindo auth.users)
--   - RLS/policies atuais
--   - grants atuais para anon/authenticated
--
-- Itens operacionais externos ao schema (ex.: agendamento pg_cron) não fazem
-- parte deste snapshot e devem ser configurados separadamente em homologação.
-- ============================================================================

begin;

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. TABELAS
-- ============================================================================

create table public.obras (
  id uuid default gen_random_uuid() not null,
  codigo text not null,
  nome text not null,
  cidade text,
  uf text,
  ativa boolean default true not null,
  criado_em timestamptz default now() not null,
  empresa_executora text default 'Cesbe'::text not null,
  consorcio text,
  descricao_local text
);

create table public.funcoes (
  id uuid default gen_random_uuid() not null,
  nome text not null,
  categoria text not null,
  periodicidade_viagem_dias integer not null,
  criado_em timestamptz default now() not null
);

create table public.pessoas (
  id uuid default gen_random_uuid() not null,
  nome text not null,
  cpf text,
  rg text,
  data_nascimento date,
  telefone text,
  cidade_origem text,
  uf_origem text,
  criado_em timestamptz default now() not null
);

create table public.contratos (
  id uuid default gen_random_uuid() not null,
  pessoa_id uuid not null,
  obra_id uuid not null,
  funcao_id uuid not null,
  matricula text,
  cracha text,
  admissao date not null,
  desligamento date,
  motivo_desligamento text,
  alojado boolean default false not null,
  data_ultima_viagem date,
  fim_experiencia_1 date generated always as ((admissao + 45)) stored,
  fim_experiencia_2 date generated always as ((admissao + 90)) stored,
  ativo boolean generated always as ((desligamento is null)) stored,
  criado_em timestamptz default now() not null
);

create table public.ajuda_custo (
  id uuid default gen_random_uuid() not null,
  contrato_id uuid not null,
  inicio date not null,
  fim date,
  valor_mensal numeric(10,2),
  endereco_locacao text,
  observacao text,
  criado_em timestamptz default now() not null,
  autorizado_por text,
  data_autorizacao date
);

create table public.epis (
  id uuid default gen_random_uuid() not null,
  nome text not null,
  ca text,
  validade_uso_dias integer,
  ativo boolean default true not null
);

create table public.epi_funcao (
  epi_id uuid not null,
  funcao_id uuid not null
);

create table public.epi_entregas (
  id uuid default gen_random_uuid() not null,
  contrato_id uuid not null,
  epi_id uuid not null,
  data_entrega date default current_date not null,
  quantidade integer default 1 not null,
  motivo text default 'primeira_entrega'::text not null,
  entregue_por text,
  assinatura_ok boolean default false not null,
  observacao text,
  criado_em timestamptz default now() not null
);

create table public.equipamentos (
  id uuid default gen_random_uuid() not null,
  prefixo text not null,
  tipo text not null,
  marca text,
  modelo text,
  placa text,
  ano integer,
  categoria text default 'pesado'::text not null,
  propriedade text default 'proprio'::text not null,
  fornecedor text,
  obra_id uuid,
  ativo boolean default true not null,
  criado_em timestamptz default now() not null
);

create table public.atividades (
  id uuid default gen_random_uuid() not null,
  descricao text not null,
  local text,
  unidade text,
  ativo boolean default true not null,
  criado_em timestamptz default now() not null
);

create table public.rdos (
  id uuid default gen_random_uuid() not null,
  obra_id uuid not null,
  numero integer not null,
  data date not null,
  clima_manha text,
  clima_tarde text,
  condicao_trabalho text,
  jornada text,
  dss_horario time,
  dss_tema text,
  dss_ministrado_por text,
  apontador text,
  observacoes text,
  eventos_meio_ambiente text,
  criado_em timestamptz default now() not null,
  atualizado_em timestamptz default now() not null
);

create table public.rdo_presencas (
  id uuid default gen_random_uuid() not null,
  rdo_id uuid not null,
  contrato_id uuid not null,
  horas_normais numeric(4,1) default 8 not null,
  horas_extras numeric(4,1) default 0 not null,
  situacao text default 'presente'::text not null,
  observacao text
);

create table public.rdo_atividades (
  id uuid default gen_random_uuid() not null,
  rdo_id uuid not null,
  descricao text not null,
  local text,
  percentual_executado numeric(5,2),
  atividade_id uuid,
  quantidade numeric,
  unidade text
);

create table public.rdo_equipamentos (
  id uuid default gen_random_uuid() not null,
  rdo_id uuid not null,
  equipamento_id uuid not null,
  horas_operando numeric(4,1) default 0 not null,
  horas_paradas numeric(4,1) default 0 not null,
  motivo_parada text,
  operador_contrato_id uuid
);

create table public.rdo_fotos (
  id uuid default gen_random_uuid() not null,
  rdo_id uuid not null,
  url_drive text not null,
  legenda text,
  ordem integer
);

create table public.ocorrencias (
  id uuid default gen_random_uuid() not null,
  contrato_id uuid,
  data date default current_date not null,
  tipo text not null,
  gravidade text,
  descricao text not null,
  acao_tomada text,
  dias_afastamento integer default 0,
  registrado_por text,
  criado_em timestamptz default now() not null,
  rdo_id uuid
);

create table public.tarefas (
  id uuid default gen_random_uuid() not null,
  id_legado text,
  obra_id uuid,
  assunto text not null,
  descricao text,
  criador text,
  responsavel text,
  setor text,
  prioridade text default 'media'::text not null,
  status text default 'aberta'::text not null,
  data_lancamento date default current_date not null,
  data_termino date,
  concluido_em timestamptz,
  criado_em timestamptz default now() not null,
  atualizado_em timestamptz default now() not null,
  reuniao_id uuid,
  origem text default 'pauta'::text not null
);

create table public.reunioes (
  id uuid default gen_random_uuid() not null,
  id_legado text,
  obra_id uuid,
  titulo text not null,
  data date not null,
  hora_inicio time,
  hora_fim time,
  local text default ''::text,
  ausencias text default ''::text,
  proxima_data date,
  proxima_pauta text default ''::text,
  criado_em timestamptz default now() not null,
  atualizado_em timestamptz default now() not null
);

create table public.reuniao_participantes (
  id uuid default gen_random_uuid() not null,
  reuniao_id uuid not null,
  contrato_id uuid,
  nome text not null,
  cargo text default ''::text,
  responsavel boolean default false not null
);

create table public.reuniao_topicos (
  id uuid default gen_random_uuid() not null,
  reuniao_id uuid not null,
  ordem integer default 0 not null,
  titulo text not null,
  notas text default ''::text,
  decisao text default ''::text
);

create table public.reuniao_pauta (
  reuniao_id uuid not null,
  tarefa_id uuid not null,
  ordem integer default 0 not null
);

create table public.contratos_comerciais (
  id uuid default gen_random_uuid() not null,
  id_legado text,
  obra_id uuid,
  tipo text not null,
  nome text not null,
  empresa text default ''::text,
  especialidade text default ''::text,
  numero_contrato text default ''::text,
  ativo boolean default true not null,
  criado_em timestamptz default now() not null
);

create table public.contrato_itens (
  id uuid default gen_random_uuid() not null,
  id_legado text,
  contrato_id uuid not null,
  item text default ''::text not null,
  descricao text not null,
  unidade text default ''::text,
  quantidade numeric(14,3) default 0 not null,
  valor_unitario numeric(14,4) default 0 not null,
  valor_total numeric(14,2)
    generated always as (round((quantidade * valor_unitario), 2)) stored,
  criado_em timestamptz default now() not null
);

create table public.medicoes (
  id uuid default gen_random_uuid() not null,
  id_legado text,
  contrato_id uuid not null,
  numero integer not null,
  mes_referencia text not null,
  data_inicio date not null,
  data_fim date not null,
  fechada boolean default false not null,
  criado_em timestamptz default now() not null
);

create table public.medicao_itens (
  id uuid default gen_random_uuid() not null,
  medicao_id uuid not null,
  item_id uuid not null,
  quantidade numeric(14,3) default 0 not null
);

create table public.nfs (
  id uuid default gen_random_uuid() not null,
  id_legado text,
  obra_id uuid,
  numero text not null,
  serie text,
  data date not null,
  fornecedor text not null,
  cnpj_fornecedor text,
  categoria text,
  responsavel text,
  observacoes text,
  total numeric(14,2) default 0 not null,
  criado_em timestamptz default now() not null
);

create table public.nf_itens (
  id uuid default gen_random_uuid() not null,
  nf_id uuid not null,
  seq integer not null,
  descricao text not null,
  unidade text,
  quantidade numeric(14,3) not null,
  preco_unitario numeric(14,4) not null,
  total_item numeric(14,2)
    generated always as (round((quantidade * preco_unitario), 2)) stored
);

create table public.documentos (
  id uuid default gen_random_uuid() not null,
  id_legado text,
  obra_id uuid,
  categoria text default 'Outros'::text not null,
  titulo text not null,
  url text not null,
  arquivo_nome text default ''::text,
  valor_orcamento numeric(14,2),
  data_cronograma date,
  notas text default ''::text,
  criado_em timestamptz default now() not null,
  atualizado_em timestamptz default now() not null
);

create table public.documento_notas (
  id uuid default gen_random_uuid() not null,
  id_legado text,
  obra_id uuid,
  texto text not null,
  autor text default ''::text,
  criado_em timestamptz default now() not null
);

create table public.mural (
  id uuid default gen_random_uuid() not null,
  id_legado text,
  obra_id uuid,
  autor text not null,
  texto text not null,
  criado_em timestamptz default now() not null
);

create table public.avisos (
  id uuid default gen_random_uuid() not null,
  obra_id uuid not null,
  tipo text not null,
  gravidade text default 'atencao'::text not null,
  titulo text not null,
  detalhe text,
  referencia text not null,
  data_ref date not null,
  criado_em timestamptz default now() not null,
  lido_em timestamptz
);

create table public.solicitacoes (
  id uuid default gen_random_uuid() not null,
  obra_codigo text not null,
  obra_id uuid,
  solicitante text not null,
  contato text,
  assunto text not null,
  descricao text,
  setor text,
  prioridade text default 'media'::text not null,
  status text default 'pendente'::text not null,
  tarefa_id uuid,
  avaliado_por text,
  avaliado_em timestamptz,
  motivo_recusa text,
  criado_em timestamptz default now() not null,
  responsavel text,
  prazo date
);

create table public.emissoes (
  id uuid default gen_random_uuid() not null,
  obra_id uuid not null,
  tipo text not null,
  referencia text not null,
  resumo jsonb default '{}'::jsonb not null,
  hash text not null,
  emitido_em timestamptz default now() not null,
  emitido_por text
);

create table public.perfis (
  id uuid not null,
  nome text default ''::text not null,
  papel text default 'apontador'::text not null,
  obra_id uuid,
  contrato_id uuid,
  ativo boolean default true not null,
  criado_em timestamptz default now() not null
);

-- ============================================================================
-- 2. CONSTRAINTS
-- ============================================================================

alter table public.obras
  add constraint obras_pkey primary key (id),
  add constraint obras_codigo_key unique (codigo);

alter table public.funcoes
  add constraint funcoes_pkey primary key (id),
  add constraint funcoes_nome_key unique (nome),
  add constraint funcoes_categoria_check
    check (categoria = any (array['tecnica','lideranca','operacional']::text[]));

alter table public.pessoas
  add constraint pessoas_pkey primary key (id),
  add constraint pessoas_cpf_key unique (cpf);

alter table public.contratos
  add constraint contratos_pkey primary key (id),
  add constraint chk_desligamento check (desligamento is null or desligamento >= admissao),
  add constraint contratos_funcao_id_fkey foreign key (funcao_id)
    references public.funcoes(id) on delete restrict,
  add constraint contratos_obra_id_fkey foreign key (obra_id)
    references public.obras(id) on delete restrict,
  add constraint contratos_pessoa_id_fkey foreign key (pessoa_id)
    references public.pessoas(id) on delete restrict;

alter table public.ajuda_custo
  add constraint ajuda_custo_pkey primary key (id),
  add constraint chk_periodo check (fim is null or fim >= inicio),
  add constraint ajuda_custo_contrato_id_fkey foreign key (contrato_id)
    references public.contratos(id) on delete restrict;

alter table public.epis
  add constraint epis_pkey primary key (id);

alter table public.epi_funcao
  add constraint epi_funcao_pkey primary key (epi_id,funcao_id),
  add constraint epi_funcao_epi_id_fkey foreign key (epi_id)
    references public.epis(id) on delete cascade,
  add constraint epi_funcao_funcao_id_fkey foreign key (funcao_id)
    references public.funcoes(id) on delete cascade;

alter table public.epi_entregas
  add constraint epi_entregas_pkey primary key (id),
  add constraint epi_entregas_motivo_check
    check (motivo = any (array[
      'primeira_entrega','troca','danificado','perda','vencimento'
    ]::text[])),
  add constraint epi_entregas_quantidade_check check (quantidade > 0),
  add constraint epi_entregas_contrato_id_fkey foreign key (contrato_id)
    references public.contratos(id) on delete restrict,
  add constraint epi_entregas_epi_id_fkey foreign key (epi_id)
    references public.epis(id) on delete restrict;

alter table public.equipamentos
  add constraint equipamentos_pkey primary key (id),
  add constraint equipamentos_prefixo_key unique (prefixo),
  add constraint equipamentos_categoria_check
    check (categoria = any (array['pesado','leve','apoio','ferramenta']::text[])),
  add constraint equipamentos_propriedade_check
    check (propriedade = any (array['proprio','locado']::text[])),
  add constraint equipamentos_obra_id_fkey foreign key (obra_id)
    references public.obras(id);

alter table public.atividades
  add constraint atividades_pkey primary key (id),
  add constraint atividades_descricao_check check (btrim(descricao) <> '');

alter table public.rdos
  add constraint rdos_pkey primary key (id),
  add constraint uq_rdo_obra_data unique (obra_id,data),
  add constraint uq_rdo_obra_numero unique (obra_id,numero),
  add constraint rdos_condicao_trabalho_check
    check (condicao_trabalho = any (
      array['praticavel','impraticavel','parcialmente_impraticavel']::text[]
    )),
  add constraint rdos_obra_id_fkey foreign key (obra_id)
    references public.obras(id) on delete restrict;

alter table public.rdo_presencas
  add constraint rdo_presencas_pkey primary key (id),
  add constraint uq_presenca unique (rdo_id,contrato_id),
  add constraint rdo_presencas_horas_extras_check check (horas_extras >= 0),
  add constraint rdo_presencas_horas_normais_check check (horas_normais >= 0),
  add constraint rdo_presencas_situacao_check
    check (situacao = any (array[
      'presente','falta','falta_justificada','atestado','ferias','folga'
    ]::text[])),
  add constraint rdo_presencas_contrato_id_fkey foreign key (contrato_id)
    references public.contratos(id) on delete restrict,
  add constraint rdo_presencas_rdo_id_fkey foreign key (rdo_id)
    references public.rdos(id) on delete cascade;

alter table public.rdo_atividades
  add constraint rdo_atividades_pkey primary key (id),
  add constraint rdo_atividades_percentual_executado_check
    check (percentual_executado >= 0 and percentual_executado <= 100),
  add constraint rdo_atividades_quantidade_check check (quantidade >= 0),
  add constraint rdo_atividades_atividade_id_fkey foreign key (atividade_id)
    references public.atividades(id),
  add constraint rdo_atividades_rdo_id_fkey foreign key (rdo_id)
    references public.rdos(id) on delete cascade;

alter table public.rdo_equipamentos
  add constraint rdo_equipamentos_pkey primary key (id),
  add constraint uq_rdo_equip unique (rdo_id,equipamento_id),
  add constraint rdo_equipamentos_horas_operando_check check (horas_operando >= 0),
  add constraint rdo_equipamentos_horas_paradas_check check (horas_paradas >= 0),
  add constraint rdo_equipamentos_equipamento_id_fkey foreign key (equipamento_id)
    references public.equipamentos(id) on delete restrict,
  add constraint rdo_equipamentos_operador_contrato_id_fkey foreign key (operador_contrato_id)
    references public.contratos(id),
  add constraint rdo_equipamentos_rdo_id_fkey foreign key (rdo_id)
    references public.rdos(id) on delete cascade;

alter table public.rdo_fotos
  add constraint rdo_fotos_pkey primary key (id),
  add constraint rdo_fotos_rdo_id_fkey foreign key (rdo_id)
    references public.rdos(id) on delete cascade;

alter table public.ocorrencias
  add constraint ocorrencias_pkey primary key (id),
  add constraint chk_ocorrencia_vinculo check (contrato_id is not null or rdo_id is not null),
  add constraint ocorrencias_gravidade_check
    check (gravidade = any (array['baixa','media','alta','critica']::text[])),
  add constraint ocorrencias_tipo_check
    check (tipo = any (array[
      'advertencia_verbal','advertencia_escrita','suspensao','quase_acidente',
      'acidente_sem_afastamento','acidente_com_afastamento',
      'desvio_comportamental','elogio'
    ]::text[])),
  add constraint ocorrencias_contrato_id_fkey foreign key (contrato_id)
    references public.contratos(id) on delete restrict,
  add constraint ocorrencias_rdo_id_fkey foreign key (rdo_id)
    references public.rdos(id);

alter table public.reunioes
  add constraint reunioes_pkey primary key (id),
  add constraint chk_reuniao_horario
    check (hora_fim is null or hora_inicio is null or hora_fim >= hora_inicio),
  add constraint reunioes_obra_id_fkey foreign key (obra_id)
    references public.obras(id) on delete restrict;

alter table public.tarefas
  add constraint tarefas_pkey primary key (id),
  add constraint tarefas_origem_check
    check (origem = any (array['pauta','checkin','reuniao']::text[])),
  add constraint tarefas_prioridade_check
    check (prioridade = any (array['baixa','media','alta']::text[])),
  add constraint tarefas_status_check
    check (status = any (array['aberta','em_andamento','concluida','cancelada']::text[])),
  add constraint tarefas_obra_id_fkey foreign key (obra_id)
    references public.obras(id),
  add constraint tarefas_reuniao_id_fkey foreign key (reuniao_id)
    references public.reunioes(id) on delete set null;

alter table public.reuniao_participantes
  add constraint reuniao_participantes_pkey primary key (id),
  add constraint uq_participante unique (reuniao_id,nome),
  add constraint reuniao_participantes_contrato_id_fkey foreign key (contrato_id)
    references public.contratos(id) on delete set null,
  add constraint reuniao_participantes_reuniao_id_fkey foreign key (reuniao_id)
    references public.reunioes(id) on delete cascade;

alter table public.reuniao_topicos
  add constraint reuniao_topicos_pkey primary key (id),
  add constraint reuniao_topicos_reuniao_id_fkey foreign key (reuniao_id)
    references public.reunioes(id) on delete cascade;

alter table public.reuniao_pauta
  add constraint reuniao_pauta_pkey primary key (reuniao_id,tarefa_id),
  add constraint reuniao_pauta_reuniao_id_fkey foreign key (reuniao_id)
    references public.reunioes(id) on delete cascade,
  add constraint reuniao_pauta_tarefa_id_fkey foreign key (tarefa_id)
    references public.tarefas(id) on delete cascade;

alter table public.contratos_comerciais
  add constraint contratos_comerciais_pkey primary key (id),
  add constraint contratos_comerciais_tipo_check
    check (tipo = any (array['cliente','empreiteiro']::text[])),
  add constraint contratos_comerciais_obra_id_fkey foreign key (obra_id)
    references public.obras(id) on delete restrict;

alter table public.contrato_itens
  add constraint contrato_itens_pkey primary key (id),
  add constraint contrato_itens_quantidade_check check (quantidade >= 0),
  add constraint contrato_itens_valor_unitario_check check (valor_unitario >= 0),
  add constraint contrato_itens_contrato_id_fkey foreign key (contrato_id)
    references public.contratos_comerciais(id) on delete cascade;

alter table public.medicoes
  add constraint medicoes_pkey primary key (id),
  add constraint uq_medicao_numero unique (contrato_id,numero),
  add constraint chk_medicao_periodo check (data_fim >= data_inicio),
  add constraint medicoes_contrato_id_fkey foreign key (contrato_id)
    references public.contratos_comerciais(id) on delete cascade;

alter table public.medicao_itens
  add constraint medicao_itens_pkey primary key (id),
  add constraint uq_medicao_item unique (medicao_id,item_id),
  add constraint medicao_itens_quantidade_check check (quantidade >= 0),
  add constraint medicao_itens_item_id_fkey foreign key (item_id)
    references public.contrato_itens(id) on delete restrict,
  add constraint medicao_itens_medicao_id_fkey foreign key (medicao_id)
    references public.medicoes(id) on delete cascade;

alter table public.nfs
  add constraint nfs_pkey primary key (id),
  add constraint uq_nf unique nulls not distinct (numero,serie,fornecedor),
  add constraint nfs_obra_id_fkey foreign key (obra_id)
    references public.obras(id);

alter table public.nf_itens
  add constraint nf_itens_pkey primary key (id),
  add constraint uq_nf_item unique (nf_id,seq),
  add constraint nf_itens_preco_unitario_check check (preco_unitario >= 0),
  add constraint nf_itens_quantidade_check check (quantidade > 0),
  add constraint nf_itens_nf_id_fkey foreign key (nf_id)
    references public.nfs(id) on delete cascade;

alter table public.documentos
  add constraint documentos_pkey primary key (id),
  add constraint chk_documento_url check (btrim(url) <> ''),
  add constraint documentos_categoria_check
    check (categoria = any (array[
      'Contrato','Cronograma','Programação Semanal','Orçamento','Outros'
    ]::text[])),
  add constraint documentos_obra_id_fkey foreign key (obra_id)
    references public.obras(id) on delete restrict;

alter table public.documento_notas
  add constraint documento_notas_pkey primary key (id),
  add constraint documento_notas_obra_id_fkey foreign key (obra_id)
    references public.obras(id) on delete restrict;

alter table public.mural
  add constraint mural_pkey primary key (id),
  add constraint chk_mural_texto check (btrim(texto) <> ''),
  add constraint mural_obra_id_fkey foreign key (obra_id)
    references public.obras(id) on delete restrict;

alter table public.avisos
  add constraint avisos_pkey primary key (id),
  add constraint avisos_gravidade_check
    check (gravidade = any (array['atencao','grave']::text[])),
  add constraint avisos_tipo_check
    check (tipo = any (array[
      'experiencia','viagem','tarefa_atrasada','rdo_faltando','epi_vencido'
    ]::text[])),
  add constraint avisos_obra_id_fkey foreign key (obra_id)
    references public.obras(id) on delete cascade;

alter table public.solicitacoes
  add constraint solicitacoes_pkey primary key (id),
  add constraint chk_assunto
    check (char_length(btrim(assunto)) >= 3 and char_length(btrim(assunto)) <= 200),
  add constraint chk_contato check (contato is null or char_length(contato) <= 120),
  add constraint chk_descricao check (descricao is null or char_length(descricao) <= 2000),
  add constraint chk_solicitante
    check (char_length(btrim(solicitante)) >= 2 and char_length(btrim(solicitante)) <= 120),
  add constraint solicitacoes_prioridade_check
    check (prioridade = any (array['baixa','media','alta']::text[])),
  add constraint solicitacoes_responsavel_check
    check (responsavel is null or char_length(responsavel) <= 120),
  add constraint solicitacoes_status_check
    check (status = any (array['pendente','aceita','recusada']::text[])),
  add constraint solicitacoes_obra_id_fkey foreign key (obra_id)
    references public.obras(id) on delete set null,
  add constraint solicitacoes_tarefa_id_fkey foreign key (tarefa_id)
    references public.tarefas(id) on delete set null;

alter table public.emissoes
  add constraint emissoes_pkey primary key (id),
  add constraint emissoes_hash_check check (hash ~ '^[0-9a-f]{64}$'),
  add constraint emissoes_tipo_check
    check (tipo = any (array['rdo','diarios','chuva','medicao','custos']::text[])),
  add constraint emissoes_obra_id_fkey foreign key (obra_id)
    references public.obras(id) on delete cascade;

alter table public.perfis
  add constraint perfis_pkey primary key (id),
  add constraint perfis_papel_check
    check (papel = any (array[
      'gestor','engenheiro','encarregado','apontador','administrativo'
    ]::text[])),
  add constraint perfis_contrato_id_fkey foreign key (contrato_id)
    references public.contratos(id),
  add constraint perfis_id_fkey foreign key (id)
    references auth.users(id) on delete cascade,
  add constraint perfis_obra_id_fkey foreign key (obra_id)
    references public.obras(id);

-- ============================================================================
-- 3. ÍNDICES NÃO CRIADOS POR CONSTRAINT
-- ============================================================================

create index idx_ajuda_contrato on public.ajuda_custo (contrato_id);
create unique index uq_ajuda_ativa on public.ajuda_custo (contrato_id) where fim is null;
create unique index uq_atividade_desc on public.atividades (lower(btrim(descricao)));
create index idx_aviso_obra on public.avisos (obra_id,lido_em,data_ref desc);
create unique index uq_aviso on public.avisos (obra_id,tipo,referencia,data_ref);
create index idx_ct_itens_contrato on public.contrato_itens (contrato_id);
create unique index uq_ct_itens_legado on public.contrato_itens (id_legado) where id_legado is not null;
create index idx_contratos_obra on public.contratos (obra_id);
create index idx_contratos_pessoa on public.contratos (pessoa_id);
create unique index uq_contrato_ativo on public.contratos (pessoa_id) where desligamento is null;
create index idx_ct_comerciais_obra on public.contratos_comerciais (obra_id);
create unique index uq_ct_comerciais_legado on public.contratos_comerciais (id_legado) where id_legado is not null;
create index idx_doc_notas_obra on public.documento_notas (obra_id,criado_em desc);
create index idx_documentos_obra on public.documentos (obra_id,categoria);
create unique index uq_documentos_legado on public.documentos (id_legado) where id_legado is not null;
create index ix_emissoes_obra on public.emissoes (obra_id,emitido_em desc);
create unique index uq_emissao_codigo on public.emissoes (left(hash,12));
create index idx_epi_entregas_contrato on public.epi_entregas (contrato_id);
create index ix_epi_funcao_funcao on public.epi_funcao (funcao_id);
create index idx_equipamentos_obra on public.equipamentos (obra_id);
create index idx_medicao_itens_item on public.medicao_itens (item_id);
create index idx_medicoes_contrato on public.medicoes (contrato_id,numero);
create unique index uq_medicoes_legado on public.medicoes (id_legado) where id_legado is not null;
create index idx_mural_obra on public.mural (obra_id,criado_em desc);
create index idx_nf_itens_nf on public.nf_itens (nf_id);
create unique index uq_nfs_id_legado on public.nfs (id_legado) where id_legado is not null;
create index idx_ocorrencias_contrato on public.ocorrencias (contrato_id);
create index idx_ocorrencias_rdo on public.ocorrencias (rdo_id);
create index idx_perfis_obra on public.perfis (obra_id);
create unique index uq_perfis_contrato on public.perfis (contrato_id) where contrato_id is not null;
create unique index uq_rdo_atividade on public.rdo_atividades (rdo_id,atividade_id) where atividade_id is not null;
create index idx_presencas_contrato on public.rdo_presencas (contrato_id);
create index idx_rdos_data on public.rdos (data);
create index idx_reuniao_part on public.reuniao_participantes (reuniao_id);
create index idx_reuniao_top on public.reuniao_topicos (reuniao_id,ordem);
create index idx_reunioes_data on public.reunioes (obra_id,data desc);
create unique index uq_reunioes_legado on public.reunioes (id_legado) where id_legado is not null;
create index idx_solicitacao_status on public.solicitacoes (status,criado_em desc);
create index idx_tarefas_obra on public.tarefas (obra_id);
create index idx_tarefas_reuniao on public.tarefas (reuniao_id);
create index idx_tarefas_status on public.tarefas (status);
create unique index uq_tarefas_id_legado on public.tarefas (id_legado) where id_legado is not null;

-- ============================================================================
-- 4. FUNÇÕES BASE NECESSÁRIAS ÀS VIEWS
-- ============================================================================

create or replace function public.e_chuva(txt text)
returns boolean
language sql
immutable
as $$
  select coalesce(
    translate(lower(txt), 'áàâãéêíóôõúç', 'aaaaeeiooouc')
      ~ '(chuva|chuvoso|garoa|chuvisco|temporal|tempestade)',
    false
  );
$$;

-- ============================================================================
-- 5. VIEWS — TODAS security_invoker
-- ============================================================================

create or replace view public.vw_efetivo
with (security_invoker=true)
as
select
  c.id as contrato_id,
  p.nome,
  c.matricula,
  c.cracha,
  f.nome as funcao,
  o.codigo as obra,
  c.admissao,
  c.fim_experiencia_1,
  c.fim_experiencia_2,
  c.alojado,
  a.id is not null as recebe_ajuda_custo,
  a.valor_mensal as ajuda_custo_valor,
  f.periodicidade_viagem_dias,
  case
    when a.id is not null then null::date
    when c.alojado then coalesce(c.data_ultima_viagem,c.admissao) + f.periodicidade_viagem_dias
    else null::date
  end as proxima_viagem,
  case
    when a.id is not null then 'ajuda_moradia'::text
    when c.alojado then 'viagem_familiar'::text
    else 'local'::text
  end as regime,
  c.funcao_id
from public.contratos c
join public.pessoas p on p.id=c.pessoa_id
join public.funcoes f on f.id=c.funcao_id
join public.obras o on o.id=c.obra_id
left join public.ajuda_custo a on a.contrato_id=c.id and a.fim is null
where c.desligamento is null;

create or replace view public.vw_alertas
with (security_invoker=true)
as
select contrato_id,nome,funcao,obra,
       'experiencia_45'::text as tipo,
       fim_experiencia_1 as vencimento,
       fim_experiencia_1-current_date as dias_restantes
from public.vw_efetivo
where fim_experiencia_1 >= current_date-3
  and fim_experiencia_1 <= current_date+7
union all
select contrato_id,nome,funcao,obra,
       'experiencia_90'::text,
       fim_experiencia_2,
       fim_experiencia_2-current_date
from public.vw_efetivo
where fim_experiencia_2 >= current_date-3
  and fim_experiencia_2 <= current_date+7
union all
select contrato_id,nome,funcao,obra,
       'viagem'::text,
       proxima_viagem,
       proxima_viagem-current_date
from public.vw_efetivo
where proxima_viagem is not null
  and proxima_viagem <= current_date+7;

create or replace view public.vw_atividade_acumulado
with (security_invoker=true)
as
select
  a.id as atividade_id,
  o.id as obra_id,
  o.codigo as obra,
  a.descricao,
  a.local,
  a.unidade,
  a.ativo,
  a.criado_em,
  coalesce(sum(ra.quantidade),0::numeric) as quantidade_total,
  count(distinct r.data) filter (where ra.id is not null) as dias_lancados,
  max(r.data) filter (where ra.id is not null) as ultimo_dia
from public.atividades a
cross join public.obras o
left join public.rdos r on r.obra_id=o.id
left join public.rdo_atividades ra
  on ra.rdo_id=r.id and ra.atividade_id=a.id
group by a.id,o.id,o.codigo,a.descricao,a.local,a.unidade,a.ativo,a.criado_em;

create or replace view public.vw_chuva_mes
with (security_invoker=true)
as
with dias as (
  select
    o.codigo as obra,
    date_trunc('month',r.data::timestamptz)::date as mes,
    r.data,
    public.e_chuva(r.clima_manha) or public.e_chuva(r.clima_tarde) as choveu,
    public.e_chuva(r.clima_manha) as choveu_manha,
    public.e_chuva(r.clima_tarde) as choveu_tarde,
    r.condicao_trabalho
  from public.rdos r
  join public.obras o on o.id=r.obra_id
)
select
  obra,mes,
  count(*) as dias_com_rdo,
  count(*) filter (where choveu) as dias_com_chuva,
  count(*) filter (where choveu_manha) as dias_chuva_manha,
  count(*) filter (where choveu_tarde) as dias_chuva_tarde,
  count(*) filter (where condicao_trabalho='impraticavel') as dias_impraticavel,
  count(*) filter (where condicao_trabalho='parcialmente_impraticavel') as dias_parcial,
  count(*) filter (where condicao_trabalho='praticavel') as dias_praticavel,
  count(*) filter (where condicao_trabalho is null) as dias_sem_condicao,
  round(
    count(*) filter (where condicao_trabalho='impraticavel')::numeric +
    0.5 * count(*) filter (where condicao_trabalho='parcialmente_impraticavel')::numeric,
    1
  ) as dias_perdidos
from dias
group by obra,mes;

create or replace view public.vw_contrato_saldo
with (security_invoker=true)
as
select
  c.id as contrato_id,
  c.tipo,
  c.nome,
  c.empresa,
  o.codigo as obra,
  coalesce(sum(i.valor_total),0::numeric) as valor_contratado,
  coalesce((
    select sum(round(mi.quantidade*ci.valor_unitario,2))
    from public.medicao_itens mi
    join public.contrato_itens ci on ci.id=mi.item_id
    where ci.contrato_id=c.id
  ),0::numeric) as valor_medido,
  coalesce(sum(i.valor_total),0::numeric) -
  coalesce((
    select sum(round(mi.quantidade*ci.valor_unitario,2))
    from public.medicao_itens mi
    join public.contrato_itens ci on ci.id=mi.item_id
    where ci.contrato_id=c.id
  ),0::numeric) as valor_saldo,
  (select count(*) from public.medicoes m where m.contrato_id=c.id) as medicoes_lancadas
from public.contratos_comerciais c
left join public.obras o on o.id=c.obra_id
left join public.contrato_itens i on i.contrato_id=c.id
group by c.id,c.tipo,c.nome,c.empresa,o.codigo;

create or replace view public.vw_disponibilidade_equipamento
with (security_invoker=true)
as
select
  e.prefixo,
  e.tipo,
  o.codigo as obra,
  date_trunc('month',r.data::timestamptz)::date as mes,
  sum(re.horas_operando) as horas_operando,
  sum(re.horas_paradas) as horas_paradas,
  round(
    100.0*sum(re.horas_operando)/
    nullif(sum(re.horas_operando+re.horas_paradas),0::numeric),
    1
  ) as disponibilidade_pct
from public.rdo_equipamentos re
join public.rdos r on r.id=re.rdo_id
join public.equipamentos e on e.id=re.equipamento_id
join public.obras o on o.id=r.obra_id
group by e.prefixo,e.tipo,o.codigo,date_trunc('month',r.data::timestamptz);

create or replace view public.vw_ficha_epi
with (security_invoker=true)
as
select
  c.id as contrato_id,
  p.nome,
  o.codigo as obra,
  e.nome as epi,
  e.ca,
  ee.data_entrega,
  ee.quantidade,
  ee.motivo,
  ee.assinatura_ok,
  case
    when e.validade_uso_dias is not null then ee.data_entrega+e.validade_uso_dias
    else null::date
  end as troca_prevista,
  e.id as epi_id
from public.epi_entregas ee
join public.contratos c on c.id=ee.contrato_id
join public.pessoas p on p.id=c.pessoa_id
join public.obras o on o.id=c.obra_id
join public.epis e on e.id=ee.epi_id;

create or replace view public.vw_lancamento_financeiro
with (security_invoker=true)
as
select
  o.codigo as obra,
  m.data_fim as data,
  case when cc.tipo='cliente' then 'medicao_receber'::text
       else 'medicao_pagar'::text end as tipo,
  cc.nome || ' · medição ' || m.numero as referencia,
  cc.empresa as parte,
  coalesce(sum(round(mi.quantidade*ci.valor_unitario,2)),0::numeric) as valor,
  m.fechada,
  m.contrato_id,
  m.id as origem_id
from public.medicoes m
join public.contratos_comerciais cc on cc.id=m.contrato_id
join public.obras o on o.id=cc.obra_id
left join public.medicao_itens mi on mi.medicao_id=m.id
left join public.contrato_itens ci on ci.id=mi.item_id
group by o.codigo,m.id,m.data_fim,cc.tipo,cc.nome,cc.empresa,m.numero,m.fechada,m.contrato_id
union all
select
  o.codigo,
  n.data,
  'nota_fiscal'::text,
  'NF ' || n.numero || coalesce(' · ' || n.categoria,''),
  n.fornecedor,
  n.total,
  true,
  null::uuid,
  n.id
from public.nfs n
join public.obras o on o.id=n.obra_id;

create or replace view public.vw_medicao_item
with (security_invoker=true)
as
select
  m.contrato_id,
  m.id as medicao_id,
  m.numero as medicao_numero,
  m.mes_referencia,
  m.data_inicio,
  m.data_fim,
  i.id as item_id,
  i.item,
  i.descricao,
  i.unidade,
  i.quantidade as qtd_contratada,
  i.valor_unitario,
  coalesce(mi.quantidade,0::numeric) as qtd_atual,
  coalesce(sum(coalesce(mi.quantidade,0::numeric))
    over (partition by i.id order by m.numero rows between unbounded preceding and 1 preceding),0::numeric
  ) as qtd_anterior,
  coalesce(sum(coalesce(mi.quantidade,0::numeric))
    over (partition by i.id order by m.numero rows between unbounded preceding and current row),0::numeric
  ) as qtd_acumulada,
  i.quantidade -
  coalesce(sum(coalesce(mi.quantidade,0::numeric))
    over (partition by i.id order by m.numero rows between unbounded preceding and current row),0::numeric
  ) as qtd_saldo,
  round(coalesce(mi.quantidade,0::numeric)*i.valor_unitario,2) as valor_atual,
  round(
    coalesce(sum(coalesce(mi.quantidade,0::numeric))
      over (partition by i.id order by m.numero rows between unbounded preceding and current row),0::numeric
    )*i.valor_unitario,
    2
  ) as valor_acumulado
from public.medicoes m
join public.contrato_itens i on i.contrato_id=m.contrato_id
left join public.medicao_itens mi
  on mi.medicao_id=m.id and mi.item_id=i.id;

create or replace view public.vw_rdo_dia
with (security_invoker=true)
as
select
  r.id as rdo_id,
  o.codigo as obra,
  r.numero,
  r.data,
  r.clima_manha,
  r.clima_tarde,
  r.condicao_trabalho,
  r.jornada,
  r.apontador,
  public.e_chuva(r.clima_manha) or public.e_chuva(r.clima_tarde) as choveu,
  count(p.*) filter (where p.situacao='presente') as presentes,
  count(p.*) filter (where p.situacao='falta') as faltas,
  count(p.*) filter (where p.situacao='falta_justificada') as faltas_justificadas,
  count(p.*) filter (where p.situacao='atestado') as atestados,
  count(p.*) filter (where p.situacao='ferias') as ferias,
  count(p.*) filter (where p.situacao='folga') as folgas,
  count(p.*) as efetivo_previsto,
  coalesce(sum(p.horas_normais+p.horas_extras)
    filter (where p.situacao='presente'),0::numeric) as homem_hora,
  coalesce(sum(p.horas_extras)
    filter (where p.situacao='presente'),0::numeric) as horas_extras,
  (select count(*) from public.rdo_atividades a where a.rdo_id=r.id) as atividades,
  (select count(*) from public.rdo_fotos f where f.rdo_id=r.id) as fotos,
  (select coalesce(sum(re.horas_operando),0::numeric)
     from public.rdo_equipamentos re where re.rdo_id=r.id) as equip_operando,
  (select coalesce(sum(re.horas_paradas),0::numeric)
     from public.rdo_equipamentos re where re.rdo_id=r.id) as equip_paradas
from public.rdos r
join public.obras o on o.id=r.obra_id
left join public.rdo_presencas p on p.rdo_id=r.id
group by r.id,o.codigo;

create or replace view public.vw_rdo_resumo
with (security_invoker=true)
as
select
  r.id as rdo_id,
  r.numero,
  r.data,
  o.codigo as obra,
  count(*) filter (where pr.situacao='presente') as efetivo,
  sum(pr.horas_normais+pr.horas_extras)
    filter (where pr.situacao='presente') as homem_hora,
  sum(pr.horas_extras)
    filter (where pr.situacao='presente') as total_horas_extras
from public.rdos r
join public.obras o on o.id=r.obra_id
left join public.rdo_presencas pr on pr.rdo_id=r.id
group by r.id,r.numero,r.data,o.codigo;

create or replace view public.vw_status_obra
with (security_invoker=true)
as
select
  id as obra_id,
  codigo,
  nome,
  (select count(*) from public.tarefas t
   where t.obra_id=o.id and t.status=any(array['aberta','em_andamento']::text[]))
    as tarefas_abertas,
  (select count(*) from public.tarefas t
   where t.obra_id=o.id
     and t.status=any(array['aberta','em_andamento']::text[])
     and t.data_termino is not null
     and t.data_termino<current_date)
    as tarefas_atrasadas,
  (select max(r.data) from public.rdos r where r.obra_id=o.id) as ultimo_rdo,
  current_date-(select max(r.data) from public.rdos r where r.obra_id=o.id) as dias_sem_rdo,
  (select count(*) from public.rdos r
   where r.obra_id=o.id and r.data>=current_date-30) as rdos_30_dias,
  (select count(*) from public.contratos c
   where c.obra_id=o.id and c.desligamento is null) as efetivo_ativo,
  (select count(*) from public.equipamentos e
   where e.obra_id=o.id and e.ativo) as equipamentos_ativos,
  (select count(*) from public.contratos_comerciais cc
   where cc.obra_id=o.id and cc.ativo) as contratos_ativos,
  (select count(*) from public.documentos d where d.obra_id=o.id) as documentos,
  (select count(*) from public.reunioes rn
   where rn.obra_id=o.id and rn.data>=current_date-30) as reunioes_30_dias,
  (select count(*) from public.mural m
   where m.obra_id=o.id and m.criado_em>=now()-interval '7 days') as recados_semana,
  (select count(*) from public.ocorrencias oc
   where oc.data>=current_date-30
     and (
       exists(select 1 from public.contratos c where c.id=oc.contrato_id and c.obra_id=o.id)
       or exists(select 1 from public.rdos r where r.id=oc.rdo_id and r.obra_id=o.id)
     )
  ) as ocorrencias_30_dias,
  (select count(*) from public.atividades a where a.ativo) as atividades_cadastradas,
  (select count(*) from public.epis e where e.ativo) as epis_no_catalogo
from public.obras o
where ativa;

-- ============================================================================
-- 6. DEMAIS FUNÇÕES V1
-- ============================================================================

create or replace function public.carimbar_atualizacao()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end
$$;

create or replace function public.carimbar_conclusao_tarefa()
returns trigger
language plpgsql
as $$
begin
  if new.status='concluida' and coalesce(old.status,'')<>'concluida' then
    new.concluido_em := now();
  elsif new.status<>'concluida' then
    new.concluido_em := null;
  end if;
  return new;
end;
$$;

create or replace function public.criar_perfil_do_usuario()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into perfis (id,nome)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'nome'),''),
      split_part(new.email,'@',1)
    )
  )
  on conflict (id) do nothing;
  return new;
end
$$;

create or replace function public.eh_gestor()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.perfis
    where id=auth.uid() and papel='gestor' and ativo
  );
$$;

create or replace function public.papel_atual()
returns text
language sql
stable
security definer
set search_path to 'public'
as $$
  select papel from perfis where id=auth.uid()
$$;

create or replace function public.protege_ultimo_gestor()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if old.papel='gestor'
     and (new.papel is distinct from 'gestor' or new.ativo=false) then
    if not exists (
      select 1 from public.perfis
      where papel='gestor' and ativo and id<>old.id
    ) then
      raise exception
        'Não dá para tirar o último gestor: a obra ficaria sem quem administra. Promova outra pessoa a gestor antes.';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.recalcular_total_nf()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare alvo uuid;
begin
  alvo := coalesce(new.nf_id,old.nf_id);
  update nfs
     set total=coalesce(
       (select sum(total_item) from nf_itens where nf_id=alvo),0
     )
   where id=alvo;
  return coalesce(new,old);
end;
$$;

create or replace function public.resolver_obra_da_solicitacao()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  new.obra_codigo := upper(btrim(new.obra_codigo));
  select id into new.obra_id
    from obras
   where upper(codigo)=new.obra_codigo and ativa;
  if new.obra_id is null then
    raise exception 'Obra % não encontrada ou inativa.',new.obra_codigo
      using errcode='foreign_key_violation';
  end if;
  return new;
end;
$$;

create or replace function public.limpar_avisos_antigos()
returns integer
language sql
security definer
set search_path to 'public'
as $$
  with apagados as (
    delete from avisos
     where lido_em is not null
       and lido_em < now()-interval '60 days'
    returning 1
  )
  select count(*)::int from apagados;
$$;

create or replace function public.gerar_avisos()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  antes int;
  depois int;
begin
  select count(*) into antes from avisos;

  insert into avisos (obra_id,tipo,gravidade,titulo,detalhe,referencia,data_ref)
  select c.obra_id,'experiencia',
         case when e.venc-current_date<=3 then 'grave' else 'atencao' end,
         p.nome||' — experiência vence em '||to_char(e.venc,'DD/MM'),
         f.nome||' · admitido em '||to_char(c.admissao,'DD/MM/YYYY')||
           ' · experiência de '||e.qual||' dias',
         c.id::text||':'||e.qual,e.venc
    from contratos c
    join pessoas p on p.id=c.pessoa_id
    join funcoes f on f.id=c.funcao_id
    cross join lateral (
      values ('45',c.fim_experiencia_1),('90',c.fim_experiencia_2)
    ) as e(qual,venc)
   where c.desligamento is null
     and e.venc between current_date and current_date+7
  on conflict do nothing;

  insert into avisos (obra_id,tipo,gravidade,titulo,detalhe,referencia,data_ref)
  select c.obra_id,'viagem',
         case when v.proxima_viagem-current_date<=3 then 'grave' else 'atencao' end,
         v.nome||' — viagem prevista para '||to_char(v.proxima_viagem,'DD/MM'),
         v.funcao||' · giro de '||v.periodicidade_viagem_dias||' dias',
         c.id::text,v.proxima_viagem
    from vw_efetivo v
    join contratos c on c.id=v.contrato_id
   where v.proxima_viagem between current_date and current_date+7
  on conflict do nothing;

  insert into avisos (obra_id,tipo,gravidade,titulo,detalhe,referencia,data_ref)
  select t.obra_id,'tarefa_atrasada',
         case when current_date-t.data_termino>7 then 'grave' else 'atencao' end,
         'Tarefa atrasada: '||t.assunto,
         coalesce(nullif(t.responsavel,''),'sem responsável')||
           ' · venceu em '||to_char(t.data_termino,'DD/MM/YYYY'),
         t.id::text,t.data_termino
    from tarefas t
   where t.status in ('aberta','em_andamento')
     and t.data_termino is not null
     and t.data_termino<current_date
     and t.obra_id is not null
  on conflict do nothing;

  insert into avisos (obra_id,tipo,gravidade,titulo,detalhe,referencia,data_ref)
  select o.id,'rdo_faltando',
         case when g.n>3 then 'grave' else 'atencao' end,
         'Sem RDO em '||to_char(current_date-g.n,'DD/MM/YYYY'),
         'Dia sem diário lançado. Dia não lançado não conta em medição nem em pleito.',
         to_char(current_date-g.n,'YYYY-MM-DD'),current_date-g.n
    from obras o
    cross join generate_series(1,7) as g(n)
    join lateral (
      select min(r.data) as primeiro
      from rdos r
      where r.obra_id=o.id
    ) pr on true
   where o.ativa
     and pr.primeiro is not null
     and current_date-g.n>=pr.primeiro
     and not exists (
       select 1 from rdos r
       where r.obra_id=o.id and r.data=current_date-g.n
     )
     and extract(isodow from current_date-g.n)<7
  on conflict do nothing;

  insert into avisos (obra_id,tipo,gravidade,titulo,detalhe,referencia,data_ref)
  select c.obra_id,'epi_vencido','atencao',
         p.nome||' — troca de EPI vencida',
         e.nome||' · entregue em '||to_char(ee.data_entrega,'DD/MM/YYYY')||
           ' · troca era '||to_char(ee.data_entrega+e.validade_uso_dias,'DD/MM/YYYY'),
         ee.id::text,ee.data_entrega+e.validade_uso_dias
    from epi_entregas ee
    join epis e on e.id=ee.epi_id
    join contratos c on c.id=ee.contrato_id
    join pessoas p on p.id=c.pessoa_id
   where c.desligamento is null
     and e.validade_uso_dias is not null
     and ee.data_entrega+e.validade_uso_dias<current_date
     and not exists (
       select 1 from epi_entregas ee2
       where ee2.contrato_id=ee.contrato_id
         and ee2.epi_id=ee.epi_id
         and ee2.data_entrega>ee.data_entrega
     )
  on conflict do nothing;

  select count(*) into depois from avisos;
  return depois-antes;
end;
$$;

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

drop trigger if exists documentos_carimbo on public.documentos;
create trigger documentos_carimbo
before update on public.documentos
for each row execute function public.carimbar_atualizacao();

drop trigger if exists nf_itens_recalcula on public.nf_itens;
create trigger nf_itens_recalcula
after insert or delete or update on public.nf_itens
for each row execute function public.recalcular_total_nf();

drop trigger if exists nao_deixa_sem_gestor on public.perfis;
create trigger nao_deixa_sem_gestor
before update on public.perfis
for each row execute function public.protege_ultimo_gestor();

drop trigger if exists rdos_carimbo on public.rdos;
create trigger rdos_carimbo
before update on public.rdos
for each row execute function public.carimbar_atualizacao();

drop trigger if exists reunioes_carimbo on public.reunioes;
create trigger reunioes_carimbo
before update on public.reunioes
for each row execute function public.carimbar_atualizacao();

drop trigger if exists solicitacao_resolve_obra on public.solicitacoes;
create trigger solicitacao_resolve_obra
before insert on public.solicitacoes
for each row execute function public.resolver_obra_da_solicitacao();

drop trigger if exists tarefas_carimbo on public.tarefas;
create trigger tarefas_carimbo
before update on public.tarefas
for each row execute function public.carimbar_atualizacao();

drop trigger if exists tarefas_conclusao on public.tarefas;
create trigger tarefas_conclusao
before insert or update on public.tarefas
for each row execute function public.carimbar_conclusao_tarefa();

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
after insert on auth.users
for each row execute function public.criar_perfil_do_usuario();

-- ============================================================================
-- 8. RLS — ESTADO V1 OBSERVADO
-- ============================================================================

alter table public.ajuda_custo enable row level security;
alter table public.atividades enable row level security;
alter table public.avisos enable row level security;
alter table public.contrato_itens enable row level security;
alter table public.contratos enable row level security;
alter table public.contratos_comerciais enable row level security;
alter table public.documento_notas enable row level security;
alter table public.documentos enable row level security;
alter table public.emissoes enable row level security;
alter table public.epi_entregas enable row level security;
alter table public.epi_funcao enable row level security;
alter table public.epis enable row level security;
alter table public.equipamentos enable row level security;
alter table public.funcoes enable row level security;
alter table public.medicao_itens enable row level security;
alter table public.medicoes enable row level security;
alter table public.mural enable row level security;
alter table public.nf_itens enable row level security;
alter table public.nfs enable row level security;
alter table public.obras enable row level security;
alter table public.ocorrencias enable row level security;
alter table public.perfis enable row level security;
alter table public.pessoas enable row level security;
alter table public.rdo_atividades enable row level security;
alter table public.rdo_equipamentos enable row level security;
alter table public.rdo_fotos enable row level security;
alter table public.rdo_presencas enable row level security;
alter table public.rdos enable row level security;
alter table public.reuniao_participantes enable row level security;
alter table public.reuniao_pauta enable row level security;
alter table public.reuniao_topicos enable row level security;
alter table public.reunioes enable row level security;
alter table public.solicitacoes enable row level security;
alter table public.tarefas enable row level security;

-- auth_all observado nas tabelas abaixo.
create policy auth_all on public.ajuda_custo
for all to authenticated using (true) with check (true);
create policy auth_all on public.atividades
for all to authenticated using (true) with check (true);
create policy auth_all on public.contrato_itens
for all to authenticated using (true) with check (true);
create policy auth_all on public.contratos
for all to authenticated using (true) with check (true);
create policy auth_all on public.contratos_comerciais
for all to authenticated using (true) with check (true);
create policy auth_all on public.documento_notas
for all to authenticated using (true) with check (true);
create policy auth_all on public.documentos
for all to authenticated using (true) with check (true);
create policy auth_all on public.emissoes
for all to authenticated using (true) with check (true);
create policy auth_all on public.epi_entregas
for all to authenticated using (true) with check (true);
create policy auth_all on public.epi_funcao
for all to authenticated using (true) with check (true);
create policy auth_all on public.epis
for all to authenticated using (true) with check (true);
create policy auth_all on public.equipamentos
for all to authenticated using (true) with check (true);
create policy auth_all on public.funcoes
for all to authenticated using (true) with check (true);
create policy auth_all on public.medicao_itens
for all to authenticated using (true) with check (true);
create policy auth_all on public.medicoes
for all to authenticated using (true) with check (true);
create policy auth_all on public.mural
for all to authenticated using (true) with check (true);
create policy auth_all on public.nf_itens
for all to authenticated using (true) with check (true);
create policy auth_all on public.nfs
for all to authenticated using (true) with check (true);
create policy auth_all on public.obras
for all to authenticated using (true) with check (true);
create policy auth_all on public.ocorrencias
for all to authenticated using (true) with check (true);
create policy auth_all on public.pessoas
for all to authenticated using (true) with check (true);
create policy auth_all on public.rdo_atividades
for all to authenticated using (true) with check (true);
create policy auth_all on public.rdo_equipamentos
for all to authenticated using (true) with check (true);
create policy auth_all on public.rdo_fotos
for all to authenticated using (true) with check (true);
create policy auth_all on public.rdo_presencas
for all to authenticated using (true) with check (true);
create policy auth_all on public.rdos
for all to authenticated using (true) with check (true);
create policy auth_all on public.reuniao_participantes
for all to authenticated using (true) with check (true);
create policy auth_all on public.reuniao_pauta
for all to authenticated using (true) with check (true);
create policy auth_all on public.reuniao_topicos
for all to authenticated using (true) with check (true);
create policy auth_all on public.reunioes
for all to authenticated using (true) with check (true);
create policy auth_all on public.tarefas
for all to authenticated using (true) with check (true);

create policy avisos_leitura on public.avisos
for select to authenticated using (true);

create policy avisos_marcar_lido on public.avisos
for update to authenticated using (true) with check (true);

create policy perfis_leitura on public.perfis
for select to authenticated using (true);

create policy perfis_gestor_atualiza on public.perfis
for update to authenticated
using (public.eh_gestor())
with check (public.eh_gestor());

create policy solicitacao_anon_insere on public.solicitacoes
for insert to anon
with check (status='pendente' and tarefa_id is null);

create policy solicitacao_leitura on public.solicitacoes
for select to authenticated using (true);

create policy solicitacao_avalia on public.solicitacoes
for update to authenticated using (true) with check (true);

-- ============================================================================
-- 9. GRANTS — ESTADO V1 OBSERVADO
-- ============================================================================

grant usage on schema public to anon, authenticated;

-- authenticated tinha privilégios amplos sobre tabelas e views.
grant all privileges on all tables in schema public to authenticated;

-- anon: privilégios amplos observados em 31 tabelas de negócio e 12 views.
grant all privileges on
  public.ajuda_custo,
  public.atividades,
  public.contrato_itens,
  public.contratos,
  public.contratos_comerciais,
  public.documento_notas,
  public.documentos,
  public.emissoes,
  public.epi_entregas,
  public.epi_funcao,
  public.epis,
  public.equipamentos,
  public.funcoes,
  public.medicao_itens,
  public.medicoes,
  public.mural,
  public.nf_itens,
  public.nfs,
  public.obras,
  public.ocorrencias,
  public.pessoas,
  public.rdo_atividades,
  public.rdo_equipamentos,
  public.rdo_fotos,
  public.rdo_presencas,
  public.rdos,
  public.reuniao_participantes,
  public.reuniao_pauta,
  public.reuniao_topicos,
  public.reunioes,
  public.tarefas,
  public.vw_alertas,
  public.vw_atividade_acumulado,
  public.vw_chuva_mes,
  public.vw_contrato_saldo,
  public.vw_disponibilidade_equipamento,
  public.vw_efetivo,
  public.vw_ficha_epi,
  public.vw_lancamento_financeiro,
  public.vw_medicao_item,
  public.vw_rdo_dia,
  public.vw_rdo_resumo,
  public.vw_status_obra
to anon;

-- solicitacoes tinha apenas o conjunto abaixo para anon.
grant insert, references, trigger, truncate on public.solicitacoes to anon;

-- Funções: remover herança pública e reproduzir os EXECUTEs observados.
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.carimbar_atualizacao() to anon, authenticated;
grant execute on function public.carimbar_conclusao_tarefa() to anon, authenticated;
grant execute on function public.criar_perfil_do_usuario() to anon, authenticated;
grant execute on function public.e_chuva(text) to anon, authenticated;
grant execute on function public.limpar_avisos_antigos() to anon, authenticated;
grant execute on function public.papel_atual() to anon, authenticated;
grant execute on function public.protege_ultimo_gestor() to anon, authenticated;
grant execute on function public.recalcular_total_nf() to anon, authenticated;
grant execute on function public.resolver_obra_da_solicitacao() to anon, authenticated;

grant execute on function public.eh_gestor() to authenticated;
grant execute on function public.gerar_avisos() to authenticated;

commit;
