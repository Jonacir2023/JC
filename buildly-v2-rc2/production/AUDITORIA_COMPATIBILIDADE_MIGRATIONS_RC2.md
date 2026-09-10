# Auditoria de compatibilidade — Migrations BUILDLy Premium V2.2 Feature Complete

**Data:** 06/09/2026  
**Alvo auditado:** Supabase P3 em modo somente leitura  
**Produção alterada:** NÃO

## Resultado executivo

O pacote continua **NO-GO para produção enquanto a homologação local real não passar**, mas a compatibilidade estrutural com o snapshot atual do P3 está favorável.

Condições confirmadas por consulta somente leitura:

- 34 tabelas `public`;
- 12 views `public`;
- 37 migrations históricas;
- schema `private` ainda ausente;
- 0 colunas Premium já presentes;
- 0 tabelas financeiras V1 com dados (`contratos_comerciais`, `contrato_itens`, `medicoes`, `medicao_itens`, `nfs`, `nf_itens`);
- 1 gestor ativo sem obra;
- esse é também o único perfil ativo sem obra;
- 0 colisões esperadas com tabelas Premium;
- dois jobs `pg_cron` conhecidos permanecem ativos.

## Tabelas Premium realmente criadas

A lista abaixo é derivada das migrations 05–11 e agora é validada automaticamente contra o pre-flight:

```text
eap_itens
cbs_codigos
orcamentos
orcamento_itens
orcamento_alteracoes
orcamento_alteracao_itens
fornecedores
contrato_alteracoes
contrato_alteracao_itens
compromissos
compromisso_itens
custos_lancamentos
pagamentos
forecast_itens
planejamento_cronogramas
planejamento_atividades
planejamento_programacoes
planejamento_programacao_itens
planejamento_restricoes
documento_revisoes
documento_workflow
auditoria_eventos
```

Total: **27 tabelas**.

## Dependências críticas de ordem

### Produção existente

**NUNCA executar `00_v1_schema_baseline.sql` em produção.**

Ordem operacional:

```text
01_seguranca.sql
→ BOOTSTRAP_PROPRIETARIO_GLOBAL.sql
→ 02_hardening.sql
→ 03_rls_multiobra.sql
→ 04a_permissoes.sql
→ 04b_rbac.sql
→ 05 ... 13
```

O bootstrap entre 01 e 03 é obrigatório. Sem `acesso_global=true` para o proprietário, o RLS multiobra pode retirar o acesso esperado do gestor sem `obra_id`.

### Janela única de manutenção

As Migrations 06 e 13 criam workflows que consultam ações `aprovar`. A matriz complementar dessas ações é consolidada na Migration 12. Portanto, **não liberar usuários entre as migrations**. O conjunto 01→14 deve ser tratado como uma janela única de implantação.

## Gates que agora abortam o deploy

O pre-flight deve retornar NO-GO se ocorrer qualquer uma destas situações:

- quantidade de tabelas/views/migrations divergir do snapshot;
- aparecer schema `private` ou `perfis.acesso_global` antes do deploy (sinal de implantação parcial);
- qualquer uma das 27 tabelas Premium já existir;
- surgir dado nas tabelas financeiras V1 ainda não homologado para migração;
- não existir exatamente um gestor ativo sem obra;
- existir outro perfil ativo sem obra além do proprietário esperado.

## Correções feitas nesta auditoria

1. O pre-flight usava três nomes conceituais antigos que não correspondem às tabelas reais. Foi corrigido para a lista derivada das migrations.
2. Foi adicionado teste automático que compara a lista do pre-flight com todas as tabelas `CREATE TABLE public...` do pacote.
3. O DEMO foi sanitizado: obra e fornecedores agora usam somente nomes `TESTE`; valores e lógica financeira foram preservados.
4. Foi adicionado teste para impedir retorno de nomes reais ao DEMO e aos exemplos visuais.

## Status

```text
Compatibilidade estática com snapshot P3: FAVORÁVEL
Pre-flight corrigido:                 SIM
Dados financeiros V1 novos:           NÃO
Produção modificada:                   NÃO
Homologação PostgreSQL/Supabase real:  PENDENTE
GO para produção:                      NÃO
```
