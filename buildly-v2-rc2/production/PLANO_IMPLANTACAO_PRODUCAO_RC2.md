# BUILDLy Premium V2.2 Feature Complete — Plano de Implantação em Produção

**Status:** preparado, NÃO autorizado e NÃO executado.  
**Banco:** Supabase P3.  
**Objetivo:** transformar a RC2 homologada em implantação controlada, preservando o V1 e permitindo aborto seguro.

## Regra mais importante

Em produção **NÃO executar `00_v1_schema_baseline.sql`**.

O baseline 00 existe somente para banco novo/local/homologação. O P3 já contém o V1.

A implantação produtiva começa em `01_seguranca.sql`.

## Estado congelado em 06/09/2026

Pré-check somente leitura confirmou:

- 34 tabelas `public`;
- 12 views;
- 37 migrations históricas;
- 2 obras, ambas ativas;
- 1 perfil ativo;
- 1 gestor ativo sem obra;
- zero colisões com os 27 nomes Premium;
- tabelas financeiras estruturais ainda sem registros.

Qualquer divergência futura aborta a implantação até nova auditoria.

## Escritores automáticos conhecidos

`pg_cron` atual:

- `gerar_avisos()` — `0 9 * * *` UTC;
- `limpar_avisos_antigos()` — `30 9 * * 0` UTC.

Evitar implantação próxima dessas janelas ou pausar/religar os jobs explicitamente.

## Gate 0 — homologação obrigatória

Antes de produção:

1. executar o kit de homologação local;
2. `supabase db reset` precisa subir do zero;
3. pgTAP/RLS precisa passar;
4. lint precisa passar;
5. testar Obra A x Obra B;
6. testar proprietário global e todos os papéis;
7. validar fluxo financeiro completo;
8. guardar o relatório PASS.

Sem isso: **NO-GO**.

## Gate 1 — freeze de produção

Como há apenas um perfil ativo hoje, fazer uma janela curta em que ninguém usa o V1.

- fechar abas do app;
- não lançar RDO/NF/tarefas durante a janela;
- registrar horário de início;
- garantir que nenhum job cron esteja prestes a disparar.

## Gate 2 — backup lógico obrigatório

Usar uma conexão PostgreSQL administrativa fornecida localmente, sem gravá-la em arquivo.

Exemplo com Supabase CLI:

```bash
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
DIR=$(ls -dt backups/* | head -1)

supabase db dump --db-url "$DATABASE_URL" --schema public -f "$DIR/schema_public.sql"
supabase db dump --db-url "$DATABASE_URL" --data-only --schema public -f "$DIR/data_public.sql"
```

Também salvar:

- resultado de `PREFLIGHT_PRODUCAO_READONLY.sql`;
- lista de migrations remotas;
- lista dos dois cron jobs;
- SHA/tag exata do pacote aprovado.

**Nunca commitar backup de produção no Git.**

## Gate 3 — pre-flight

Executar:

```text
production/PREFLIGHT_PRODUCAO_READONLY.sql
```

Precisa retornar PASS.

Ele aborta se detectar:

- número diferente de tabelas/views/migrations;
- mais ou menos de um gestor ativo sem obra;
- tabelas Premium já existentes;
- sinais de implantação parcial;
- novos dados financeiros V1 que não foram reavaliados.

## Gate 4 — ordem produtiva correta

### Fase A — fundação

```text
01_seguranca.sql
02_hardening.sql
```

Logo após `01_seguranca.sql`, executar o bootstrap administrativo:

```text
operations/BOOTSTRAP_PROPRIETARIO_GLOBAL.sql
```

**Não aplicar `03_rls_multiobra.sql` antes de confirmar `acesso_global=true` para o proprietário.**

Validação mínima:

```sql
select count(*)
from public.perfis
where ativo and acesso_global=true;
```

Esperado: `1`.

### Fase B — isolamento e RBAC

```text
03_rls_multiobra.sql
04a_permissoes.sql
04b_rbac.sql
```

Neste ponto validar login do proprietário e leitura das duas obras antes de continuar.

### Fase C — núcleo Premium

```text
05_eap_cbs_orcamento.sql
06_contratos_premium.sql
07_motor_compromissos.sql
08_posicao_financeira.sql
09_planejamento.sql
10_documentos_premium.sql
11_auditoria.sql
12_rls_premium.sql
13_workflows_financeiros.sql
14_suprimentos.sql
```

Cada arquivo já usa `BEGIN/COMMIT`, portanto uma falha dentro de um arquivo reverte aquele arquivo. Porém migrations anteriores já confirmadas permanecem aplicadas.

## Gate 5 — pós-deploy imediato

Executar:

```text
production/SMOKE_POS_DEPLOY_READONLY.sql
```

Critérios mínimos:

- 56 tabelas public;
- pelo menos 19 views;
- exatamente 1 proprietário global ativo;
- schema `private` presente;
- zero policy `auth_all`;
- 27/27 tabelas Premium com RLS;
- 27/27 tabelas Premium com policy;
- views públicas `security_invoker`;
- `anon` sem privilégios perigosos.

## Gate 6 — smoke pelo aplicativo

Antes de liberar o uso normal:

1. login do proprietário;
2. abrir as duas obras existentes;
3. abrir RDO, Cadastro, Tarefas, Alertas e Documentos;
4. confirmar que registros V1 continuam visíveis;
5. confirmar que botões respeitam RBAC;
6. gerar uma visualização/relatório sem criar fato financeiro fictício;
7. confirmar formulário público de solicitação;
8. confirmar que avisos podem ser marcados como lidos.

Não criar dados `TESTE` na produção.

## GO / NO-GO

### GO

Somente se todos forem verdadeiros:

- homologação local PASS;
- backup criado e validado;
- pre-flight PASS;
- bootstrap global confirmado;
- migrations 01..14 aplicadas sem erro;
- smoke SQL PASS;
- smoke do app PASS;
- V1 sem regressão.

### NO-GO / ABORTAR

Abortar imediatamente se ocorrer:

- divergência do pre-flight;
- falha de migration;
- proprietário perder acesso;
- policy `auth_all` permanecer;
- RLS bloquear o proprietário;
- anon ganhar acesso indevido;
- dado V1 desaparecer;
- cálculo financeiro divergir;
- qualquer erro não compreendido.

## Rollback

Não criar um “rollback automático cego” para segurança/RLS/financeiro.

Se uma migration falhar:

1. não continuar para a próxima;
2. registrar qual arquivo e erro;
3. manter produção congelada;
4. decidir entre correção-forward revisada ou restauração do backup;
5. se houver risco de perda de acesso/dado, restaurar o estado pré-deploy.

A restauração deve ser ensaiada primeiro em ambiente separado. Nunca usar `supabase db reset --linked` em produção: o comando é destrutivo para banco remoto.

## Depois da estabilização

- manter V1 disponível durante período de observação;
- sincronizar migrations e documentação no GitHub quando a permissão de escrita estiver corrigida;
- atualizar `ESTADO_ATUAL.md`;
- registrar versão final somente depois de estabilidade confirmada.
