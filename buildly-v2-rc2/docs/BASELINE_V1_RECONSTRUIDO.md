# Baseline V1 reconstruído

Arquivo: `sql/00_v1_schema_baseline.sql`

Este baseline é um **snapshot estrutural reconstruído** do Supabase P3 observado em
06/09/2026. Ele foi obtido por consultas somente leitura ao catálogo PostgreSQL.

## O que contém

- 34 tabelas `public`
- constraints e índices observados
- 11 funções `public`
- 12 views com `security_invoker=true`
- 9 triggers, incluindo o trigger de criação de perfil em `auth.users`
- RLS e policies V1
- grants observados para `anon` e `authenticated`

## O que não é

Ele **não substitui nem recupera o SQL original das 37 migrations históricas**.
A tabela `supabase_migrations.schema_migrations` preserva versão/nome, mas o SQL
histórico original não foi encontrado versionado no GitHub.

## Uso correto

Somente para um ambiente **novo** de desenvolvimento/homologação:

1. Subir um Supabase/PostgreSQL compatível com o ambiente Supabase.
2. Aplicar `00_v1_schema_baseline.sql`.
3. Aplicar `01_seguranca.sql` até `14_suprimentos.sql`.
4. Executar os testes e `tests/VALIDACAO_POS_HOMOLOGACAO.sql`.

Nunca aplicar `00_v1_schema_baseline.sql` sobre o banco de produção existente.

## Dados

O baseline não contém dados reais de obra, pessoas, contratos, RDOs ou documentos.
Seeds de homologação devem ser artificiais.
