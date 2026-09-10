-- BUILDLy Premium — Migration 03 (CANDIDATA)
-- Segregação multiobra por RLS RESTRITIVO.
-- Pré-requisitos:
--   1) Migration 01 aplicada e validada
--   2) proprietário global configurado via bootstrap
--   3) Migration 02 aplicada e validada
--
-- IMPORTANTE:
-- Esta migration NÃO substitui ainda os auth_all existentes.
-- Ela adiciona policies RESTRITIVAS. Assim:
--   - a policy permissiva existente continua fornecendo o CRUD atual;
--   - as policies abaixo obrigam que o registro pertença à obra do usuário;
--   - o proprietário global continua vendo todas as obras.
--
-- CRUD fino por papel/módulo ficará para a Migration 04.

begin;

-- ============================================================
-- 1. HELPERS PRIVADOS DE ESCOPO
-- ============================================================

create or replace function private.tem_acesso_contrato(p_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.contratos c
    where c.id = p_id
      and private.tem_acesso_obra(c.obra_id)
  );
$$;

create or replace function private.tem_acesso_contrato_comercial(p_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.contratos_comerciais c
    where c.id = p_id
      and private.tem_acesso_obra(c.obra_id)
  );
$$;

create or replace function private.tem_acesso_rdo(p_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.rdos r
    where r.id = p_id
      and private.tem_acesso_obra(r.obra_id)
  );
$$;

create or replace function private.tem_acesso_equipamento(p_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.equipamentos e
    where e.id = p_id
      and private.tem_acesso_obra(e.obra_id)
  );
$$;

create or replace function private.tem_acesso_nf(p_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.nfs n
    where n.id = p_id
      and private.tem_acesso_obra(n.obra_id)
  );
$$;

create or replace function private.tem_acesso_reuniao(p_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.reunioes r
    where r.id = p_id
      and private.tem_acesso_obra(r.obra_id)
  );
$$;

create or replace function private.tem_acesso_tarefa(p_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.tarefas t
    where t.id = p_id
      and private.tem_acesso_obra(t.obra_id)
  );
$$;

create or replace function private.tem_acesso_medicao(p_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.medicoes m
    join public.contratos_comerciais c on c.id = m.contrato_id
    where m.id = p_id
      and private.tem_acesso_obra(c.obra_id)
  );
$$;

create or replace function private.tem_acesso_pessoa(p_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.usuario_global()
     or exists (
       select 1
       from public.contratos c
       where c.pessoa_id = p_id
         and private.tem_acesso_obra(c.obra_id)
     );
$$;

revoke all on function private.tem_acesso_contrato(uuid) from public, anon;
revoke all on function private.tem_acesso_contrato_comercial(uuid) from public, anon;
revoke all on function private.tem_acesso_rdo(uuid) from public, anon;
revoke all on function private.tem_acesso_equipamento(uuid) from public, anon;
revoke all on function private.tem_acesso_nf(uuid) from public, anon;
revoke all on function private.tem_acesso_reuniao(uuid) from public, anon;
revoke all on function private.tem_acesso_tarefa(uuid) from public, anon;
revoke all on function private.tem_acesso_medicao(uuid) from public, anon;
revoke all on function private.tem_acesso_pessoa(uuid) from public, anon;

grant execute on function private.tem_acesso_contrato(uuid) to authenticated;
grant execute on function private.tem_acesso_contrato_comercial(uuid) to authenticated;
grant execute on function private.tem_acesso_rdo(uuid) to authenticated;
grant execute on function private.tem_acesso_equipamento(uuid) to authenticated;
grant execute on function private.tem_acesso_nf(uuid) to authenticated;
grant execute on function private.tem_acesso_reuniao(uuid) to authenticated;
grant execute on function private.tem_acesso_tarefa(uuid) to authenticated;
grant execute on function private.tem_acesso_medicao(uuid) to authenticated;
grant execute on function private.tem_acesso_pessoa(uuid) to authenticated;

-- ============================================================
-- 2. OBRAS
-- Usuário comum enxerga só sua obra.
-- Criar/editar/excluir obra fica reservado ao proprietário global.
-- ============================================================

drop policy if exists tenant_obras_select on public.obras;
create policy tenant_obras_select
on public.obras as restrictive
for select to authenticated
using (private.tem_acesso_obra(id));

drop policy if exists tenant_obras_insert on public.obras;
create policy tenant_obras_insert
on public.obras as restrictive
for insert to authenticated
with check (private.usuario_global());

drop policy if exists tenant_obras_update on public.obras;
create policy tenant_obras_update
on public.obras as restrictive
for update to authenticated
using (private.usuario_global())
with check (private.usuario_global());

drop policy if exists tenant_obras_delete on public.obras;
create policy tenant_obras_delete
on public.obras as restrictive
for delete to authenticated
using (private.usuario_global());

-- ============================================================
-- 3. TABELAS COM obra_id DIRETO
-- ============================================================

-- Macro expandida manualmente para manter SQL explícito e auditável.

drop policy if exists tenant_contratos on public.contratos;
create policy tenant_contratos on public.contratos as restrictive
for all to authenticated
using (private.tem_acesso_obra(obra_id))
with check (private.tem_acesso_obra(obra_id));

drop policy if exists tenant_contratos_comerciais on public.contratos_comerciais;
create policy tenant_contratos_comerciais on public.contratos_comerciais as restrictive
for all to authenticated
using (private.tem_acesso_obra(obra_id))
with check (private.tem_acesso_obra(obra_id));

drop policy if exists tenant_equipamentos on public.equipamentos;
create policy tenant_equipamentos on public.equipamentos as restrictive
for all to authenticated
using (private.tem_acesso_obra(obra_id))
with check (private.tem_acesso_obra(obra_id));

drop policy if exists tenant_rdos on public.rdos;
create policy tenant_rdos on public.rdos as restrictive
for all to authenticated
using (private.tem_acesso_obra(obra_id))
with check (private.tem_acesso_obra(obra_id));

drop policy if exists tenant_tarefas on public.tarefas;
create policy tenant_tarefas on public.tarefas as restrictive
for all to authenticated
using (private.tem_acesso_obra(obra_id))
with check (private.tem_acesso_obra(obra_id));

drop policy if exists tenant_reunioes on public.reunioes;
create policy tenant_reunioes on public.reunioes as restrictive
for all to authenticated
using (private.tem_acesso_obra(obra_id))
with check (private.tem_acesso_obra(obra_id));

drop policy if exists tenant_documentos on public.documentos;
create policy tenant_documentos on public.documentos as restrictive
for all to authenticated
using (private.tem_acesso_obra(obra_id))
with check (private.tem_acesso_obra(obra_id));

drop policy if exists tenant_documento_notas on public.documento_notas;
create policy tenant_documento_notas on public.documento_notas as restrictive
for all to authenticated
using (private.tem_acesso_obra(obra_id))
with check (private.tem_acesso_obra(obra_id));

drop policy if exists tenant_mural on public.mural;
create policy tenant_mural on public.mural as restrictive
for all to authenticated
using (private.tem_acesso_obra(obra_id))
with check (private.tem_acesso_obra(obra_id));

drop policy if exists tenant_avisos on public.avisos;
create policy tenant_avisos on public.avisos as restrictive
for all to authenticated
using (private.tem_acesso_obra(obra_id))
with check (private.tem_acesso_obra(obra_id));

drop policy if exists tenant_nfs on public.nfs;
create policy tenant_nfs on public.nfs as restrictive
for all to authenticated
using (private.tem_acesso_obra(obra_id))
with check (private.tem_acesso_obra(obra_id));

drop policy if exists tenant_emissoes on public.emissoes;
create policy tenant_emissoes on public.emissoes as restrictive
for all to authenticated
using (private.tem_acesso_obra(obra_id))
with check (private.tem_acesso_obra(obra_id));

drop policy if exists tenant_solicitacoes_auth on public.solicitacoes;
create policy tenant_solicitacoes_auth on public.solicitacoes as restrictive
for all to authenticated
using (private.tem_acesso_obra(obra_id))
with check (private.tem_acesso_obra(obra_id));

-- ============================================================
-- 4. FILHOS DE CONTRATO DE PESSOAL
-- ============================================================

drop policy if exists tenant_ajuda_custo on public.ajuda_custo;
create policy tenant_ajuda_custo on public.ajuda_custo as restrictive
for all to authenticated
using (private.tem_acesso_contrato(contrato_id))
with check (private.tem_acesso_contrato(contrato_id));

drop policy if exists tenant_epi_entregas on public.epi_entregas;
create policy tenant_epi_entregas on public.epi_entregas as restrictive
for all to authenticated
using (private.tem_acesso_contrato(contrato_id))
with check (private.tem_acesso_contrato(contrato_id));

-- ============================================================
-- 5. RDO E FILHOS
-- ============================================================

drop policy if exists tenant_rdo_atividades on public.rdo_atividades;
create policy tenant_rdo_atividades on public.rdo_atividades as restrictive
for all to authenticated
using (private.tem_acesso_rdo(rdo_id))
with check (private.tem_acesso_rdo(rdo_id));

drop policy if exists tenant_rdo_fotos on public.rdo_fotos;
create policy tenant_rdo_fotos on public.rdo_fotos as restrictive
for all to authenticated
using (private.tem_acesso_rdo(rdo_id))
with check (private.tem_acesso_rdo(rdo_id));

drop policy if exists tenant_rdo_presencas on public.rdo_presencas;
create policy tenant_rdo_presencas on public.rdo_presencas as restrictive
for all to authenticated
using (
  private.tem_acesso_rdo(rdo_id)
  and private.tem_acesso_contrato(contrato_id)
)
with check (
  private.tem_acesso_rdo(rdo_id)
  and private.tem_acesso_contrato(contrato_id)
);

drop policy if exists tenant_rdo_equipamentos on public.rdo_equipamentos;
create policy tenant_rdo_equipamentos on public.rdo_equipamentos as restrictive
for all to authenticated
using (
  private.tem_acesso_rdo(rdo_id)
  and private.tem_acesso_equipamento(equipamento_id)
  and (
    operador_contrato_id is null
    or private.tem_acesso_contrato(operador_contrato_id)
  )
)
with check (
  private.tem_acesso_rdo(rdo_id)
  and private.tem_acesso_equipamento(equipamento_id)
  and (
    operador_contrato_id is null
    or private.tem_acesso_contrato(operador_contrato_id)
  )
);

-- ============================================================
-- 6. OCORRÊNCIAS
-- Pode estar ligada a contrato, RDO ou ambos.
-- Se houver ambos, ambos precisam pertencer ao escopo do usuário.
-- ============================================================

drop policy if exists tenant_ocorrencias on public.ocorrencias;
create policy tenant_ocorrencias on public.ocorrencias as restrictive
for all to authenticated
using (
  private.usuario_global()
  or (
    (contrato_id is not null or rdo_id is not null)
    and (contrato_id is null or private.tem_acesso_contrato(contrato_id))
    and (rdo_id is null or private.tem_acesso_rdo(rdo_id))
  )
)
with check (
  private.usuario_global()
  or (
    (contrato_id is not null or rdo_id is not null)
    and (contrato_id is null or private.tem_acesso_contrato(contrato_id))
    and (rdo_id is null or private.tem_acesso_rdo(rdo_id))
  )
);

-- ============================================================
-- 7. CONTRATOS COMERCIAIS / MEDIÇÕES
-- ============================================================

drop policy if exists tenant_contrato_itens on public.contrato_itens;
create policy tenant_contrato_itens on public.contrato_itens as restrictive
for all to authenticated
using (private.tem_acesso_contrato_comercial(contrato_id))
with check (private.tem_acesso_contrato_comercial(contrato_id));

drop policy if exists tenant_medicoes on public.medicoes;
create policy tenant_medicoes on public.medicoes as restrictive
for all to authenticated
using (private.tem_acesso_contrato_comercial(contrato_id))
with check (private.tem_acesso_contrato_comercial(contrato_id));

drop policy if exists tenant_medicao_itens on public.medicao_itens;
create policy tenant_medicao_itens on public.medicao_itens as restrictive
for all to authenticated
using (
  private.tem_acesso_medicao(medicao_id)
  and exists (
    select 1
    from public.contrato_itens ci
    where ci.id = item_id
      and private.tem_acesso_contrato_comercial(ci.contrato_id)
  )
)
with check (
  private.tem_acesso_medicao(medicao_id)
  and exists (
    select 1
    from public.contrato_itens ci
    where ci.id = item_id
      and private.tem_acesso_contrato_comercial(ci.contrato_id)
  )
);

-- ============================================================
-- 8. NOTAS FISCAIS E ITENS
-- ============================================================

drop policy if exists tenant_nf_itens on public.nf_itens;
create policy tenant_nf_itens on public.nf_itens as restrictive
for all to authenticated
using (private.tem_acesso_nf(nf_id))
with check (private.tem_acesso_nf(nf_id));

-- ============================================================
-- 9. REUNIÕES E FILHOS
-- ============================================================

drop policy if exists tenant_reuniao_topicos on public.reuniao_topicos;
create policy tenant_reuniao_topicos on public.reuniao_topicos as restrictive
for all to authenticated
using (private.tem_acesso_reuniao(reuniao_id))
with check (private.tem_acesso_reuniao(reuniao_id));

drop policy if exists tenant_reuniao_participantes on public.reuniao_participantes;
create policy tenant_reuniao_participantes on public.reuniao_participantes as restrictive
for all to authenticated
using (
  private.tem_acesso_reuniao(reuniao_id)
  and (
    contrato_id is null
    or private.tem_acesso_contrato(contrato_id)
  )
)
with check (
  private.tem_acesso_reuniao(reuniao_id)
  and (
    contrato_id is null
    or private.tem_acesso_contrato(contrato_id)
  )
);

drop policy if exists tenant_reuniao_pauta on public.reuniao_pauta;
create policy tenant_reuniao_pauta on public.reuniao_pauta as restrictive
for all to authenticated
using (
  private.tem_acesso_reuniao(reuniao_id)
  and private.tem_acesso_tarefa(tarefa_id)
)
with check (
  private.tem_acesso_reuniao(reuniao_id)
  and private.tem_acesso_tarefa(tarefa_id)
);

-- ============================================================
-- 10. PERFIS
-- Proprietário: todos.
-- Usuário: o próprio perfil.
-- Gestor local: perfis vinculados à própria obra.
-- A policy permissiva atual ainda exige eh_gestor() para UPDATE;
-- esta policy RESTRITIVA limita o gestor ao seu escopo.
-- ============================================================

drop policy if exists tenant_perfis_select on public.perfis;
create policy tenant_perfis_select
on public.perfis as restrictive
for select to authenticated
using (
  id = (select auth.uid())
  or private.usuario_global()
  or (obra_id is not null and private.tem_acesso_obra(obra_id))
);

drop policy if exists tenant_perfis_update on public.perfis;
create policy tenant_perfis_update
on public.perfis as restrictive
for update to authenticated
using (
  private.usuario_global()
  or (
    public.eh_gestor()
    and obra_id is not null
    and private.tem_acesso_obra(obra_id)
  )
)
with check (
  private.usuario_global()
  or (
    public.eh_gestor()
    and obra_id is not null
    and private.tem_acesso_obra(obra_id)
    and acesso_global = false
  )
);

-- ============================================================
-- 11. PESSOAS — DADO PESSOAL GLOBAL/SENSÍVEL
--
-- SELECT: somente pessoas vinculadas a contrato de obra acessível.
-- INSERT: permitido a quem possui acesso ao módulo Cadastro.
-- UPDATE/DELETE: somente quando a pessoa não possui contrato fora
-- do escopo do usuário; proprietário global sempre pode.
-- ============================================================

drop policy if exists tenant_pessoas_select on public.pessoas;
create policy tenant_pessoas_select
on public.pessoas as restrictive
for select to authenticated
using (private.tem_acesso_pessoa(id));

drop policy if exists tenant_pessoas_insert on public.pessoas;
create policy tenant_pessoas_insert
on public.pessoas as restrictive
for insert to authenticated
with check (
  private.usuario_global()
  or private.tem_permissao('cadastro','acessar')
);

drop policy if exists tenant_pessoas_update on public.pessoas;
create policy tenant_pessoas_update
on public.pessoas as restrictive
for update to authenticated
using (
  private.usuario_global()
  or (
    private.tem_permissao('cadastro','acessar')
    and exists (
      select 1 from public.contratos c
      where c.pessoa_id = pessoas.id
        and private.tem_acesso_obra(c.obra_id)
    )
    and not exists (
      select 1 from public.contratos c
      where c.pessoa_id = pessoas.id
        and not private.tem_acesso_obra(c.obra_id)
    )
  )
)
with check (
  private.usuario_global()
  or (
    private.tem_permissao('cadastro','acessar')
    and exists (
      select 1 from public.contratos c
      where c.pessoa_id = pessoas.id
        and private.tem_acesso_obra(c.obra_id)
    )
    and not exists (
      select 1 from public.contratos c
      where c.pessoa_id = pessoas.id
        and not private.tem_acesso_obra(c.obra_id)
    )
  )
);

drop policy if exists tenant_pessoas_delete on public.pessoas;
create policy tenant_pessoas_delete
on public.pessoas as restrictive
for delete to authenticated
using (
  private.usuario_global()
  or (
    private.tem_permissao('cadastro','acessar')
    and exists (
      select 1 from public.contratos c
      where c.pessoa_id = pessoas.id
        and private.tem_acesso_obra(c.obra_id)
    )
    and not exists (
      select 1 from public.contratos c
      where c.pessoa_id = pessoas.id
        and not private.tem_acesso_obra(c.obra_id)
    )
  )
);

-- ============================================================
-- 12. CATÁLOGOS GLOBAIS
-- Todos autenticados continuam lendo.
-- Alteração estrutural fica reservada ao proprietário global,
-- porque esses cadastros afetam todas as obras.
-- ============================================================

-- FUNÇÕES
drop policy if exists tenant_funcoes_insert on public.funcoes;
create policy tenant_funcoes_insert on public.funcoes as restrictive
for insert to authenticated with check (private.usuario_global());
drop policy if exists tenant_funcoes_update on public.funcoes;
create policy tenant_funcoes_update on public.funcoes as restrictive
for update to authenticated using (private.usuario_global()) with check (private.usuario_global());
drop policy if exists tenant_funcoes_delete on public.funcoes;
create policy tenant_funcoes_delete on public.funcoes as restrictive
for delete to authenticated using (private.usuario_global());

-- EPIs
drop policy if exists tenant_epis_insert on public.epis;
create policy tenant_epis_insert on public.epis as restrictive
for insert to authenticated with check (private.usuario_global());
drop policy if exists tenant_epis_update on public.epis;
create policy tenant_epis_update on public.epis as restrictive
for update to authenticated using (private.usuario_global()) with check (private.usuario_global());
drop policy if exists tenant_epis_delete on public.epis;
create policy tenant_epis_delete on public.epis as restrictive
for delete to authenticated using (private.usuario_global());

-- ATIVIDADES (catálogo comum a todas as obras)
drop policy if exists tenant_atividades_insert on public.atividades;
create policy tenant_atividades_insert on public.atividades as restrictive
for insert to authenticated with check (private.usuario_global());
drop policy if exists tenant_atividades_update on public.atividades;
create policy tenant_atividades_update on public.atividades as restrictive
for update to authenticated using (private.usuario_global()) with check (private.usuario_global());
drop policy if exists tenant_atividades_delete on public.atividades;
create policy tenant_atividades_delete on public.atividades as restrictive
for delete to authenticated using (private.usuario_global());

-- EPI × FUNÇÃO
drop policy if exists tenant_epi_funcao_insert on public.epi_funcao;
create policy tenant_epi_funcao_insert on public.epi_funcao as restrictive
for insert to authenticated with check (private.usuario_global());
drop policy if exists tenant_epi_funcao_update on public.epi_funcao;
create policy tenant_epi_funcao_update on public.epi_funcao as restrictive
for update to authenticated using (private.usuario_global()) with check (private.usuario_global());
drop policy if exists tenant_epi_funcao_delete on public.epi_funcao;
create policy tenant_epi_funcao_delete on public.epi_funcao as restrictive
for delete to authenticated using (private.usuario_global());

commit;
