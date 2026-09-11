# Checklist de Homologação — BUILDLy Premium V2.2

## Antes de aplicar SQL

- [ ] GitHub contém snapshot do V1 atual
- [ ] Baseline 00 + migrations 01–14 versionados
- [ ] Backup do Supabase atual disponível
- [ ] Ambiente não produtivo definido
- [ ] Usuários de teste sem dados pessoais reais

## Aplicação

Em banco **NOVO/local**, aplicar na ordem:

1. `00_v1_schema_baseline.sql`
2. `01_seguranca.sql`
3. `02_hardening.sql`
4. `03_rls_multiobra.sql`
5. `04a_permissoes.sql`
6. `04b_rbac.sql`
7. `05_eap_cbs_orcamento.sql`
8. `06_contratos_premium.sql`
9. `07_motor_compromissos.sql`
10. `08_posicao_financeira.sql`
11. `09_planejamento.sql`
12. `10_documentos_premium.sql`
13. `11_auditoria.sql`
14. `12_rls_premium.sql`
15. `13_workflows_financeiros.sql`
16. `14_suprimentos.sql`

O arquivo `00` é um snapshot estrutural reconstruído do V1 e **nunca** deve ser aplicado sobre a produção existente.

Para macOS, o caminho automatizado está em `scripts/preparar_homologacao_local.sh`.

## Testes de segurança

- [ ] Proprietário global vê todas as obras
- [ ] Gestor A não vê Obra B
- [ ] Engenheiro A não vê NF sem especialidade
- [ ] Técnico não vê Medições/NF/Documentos
- [ ] Encarregado e Apontador só operam RDO/Cadastro
- [ ] Administrativo não vê Medições/Documentos
- [ ] Eng. Medições/Custos vê custos/NF e não aprova sem permissão
- [ ] Eng. Planejamento vê Planejamento
- [ ] tentativa de trocar `obra_id` pela API é bloqueada
- [ ] formulário público continua somente INSERT em solicitações

## Testes financeiros

- [ ] orçamento rascunho aceita itens
- [ ] orçamento aprovado não aceita edição de baseline
- [ ] contrato aprovado exige EAP/CBS em todos os itens
- [ ] contrato aprovado cria compromisso
- [ ] aditivo aprovado aumenta compromisso
- [ ] supressão aprovada reduz compromisso
- [ ] medição aprovada migra comprometido restante → realizado
- [ ] medição aprovada é imutável
- [ ] NF aprovada é imutável
- [ ] pagamento parcial não quita NF
- [ ] pagamento total quita NF
- [ ] pagamento acima do saldo é rejeitado
- [ ] custo aprovado é imutável
- [ ] saldo disponível não muda ao simplesmente pagar algo já apropriado

## Testes de planejamento e documentos

- [ ] atividade de planejamento não cruza obra
- [ ] programação semanal/quinzenal respeita obra
- [ ] revisão documental não cruza obra
- [ ] histórico de revisão permanece
- [ ] auditoria registra antes/depois nas tabelas críticas

## Gate de produção

Produção só pode ser considerada quando:

- [ ] todos os testes positivos passam
- [ ] todos os testes negativos são bloqueados
- [ ] advisors do Supabase sem alertas críticos introduzidos pela V2
- [ ] rollback testado
- [ ] Git e banco contam a mesma história
