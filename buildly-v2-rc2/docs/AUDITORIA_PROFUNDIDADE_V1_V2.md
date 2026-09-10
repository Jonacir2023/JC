# BUILDLy Premium — Auditoria de profundidade V1 → V2

## Decisão corretiva

A V2 não pode ser aprovada apenas porque possui mais módulos. Cada função operacional já utilizada no V1 é um **baseline mínimo obrigatório** até existir decisão explícita de substituição por solução superior. A RC1 falhou nesse critério.

## Baseline já instituído no V1

| Módulo | Baseline V1 obrigatório | Estado V2 após revisão | Gate |
|---|---|---|---|
| RDO | calendário; clima/chuva; DSS; chamada; horas; atividades; equipamentos; fotos; PDF; resumos | **RECUPERADO na RC2** | PASS frontend; banco local pendente |
| Efetivo | pessoas + contratos; regime/moradia; experiência/viagem; baixa lógica | PARCIAL | recuperar profundidade |
| EPI | catálogo; EPI × função; ficha de entrega; troca prevista | PARCIAL | recuperar profundidade |
| Alertas | prazos; experiência 45/90; viagem; tarefa atrasada; falta de RDO; EPI vencido | PARCIAL/DEMO | validar automações e tela |
| Ocorrências | segurança/disciplina; oito tipos; elogio; vínculo com contrato/RDO; ação | PARCIAL | recuperar baseline e vínculos |
| Tarefas | Kanban + lista; setas/arrastar; pedidos públicos entram em caixa e são aceitos | PARCIAL | recuperar fluxo completo |
| Notas Fiscais | cabeçalho + itens; cálculo do total no banco; edição longa sem perda | PARCIAL | recuperar itens/autosave na UI Premium |
| Equipamentos | frota; alocação; horas de RDO; disponibilidade mensal | PARCIAL | reconciliar com RDO e cálculo derivado |
| Medições | contrato → itens → boletim mensal → acumulado → saldo | PARCIAL | tornar UI itemizada/acumulada |
| Reuniões | ata; participantes; tópicos; pauta; tópico pode virar tarefa | PARCIAL | recuperar ata completa/autosave |
| Documentos | documentos/links; mural; notas | PARCIAL | recuperar mural/notas sem perder revisões Premium |
| Relatórios | semana, mês e ano | PARCIAL | comparar saídas V1 e Premium |
| Busca/avisos | busca global da obra + sino | EXISTE NA V2, precisa regressão | validar cobertura e comportamento |

## Regras transversais que também são baseline

- Português em toda a interface.
- Exemplos e fixtures somente `TESTE`.
- Telas longas salvam campo a campo; não depender de um botão final.
- Data do RDO no fuso `America/Sao_Paulo`.
- Dados derivados calculados no banco, não duplicados no frontend.
- Baixa lógica quando o histórico não pode ser apagado.
- Lista fechada quando existe constraint/check no banco.
- Alvos de toque adequados a uso de canteiro.
- Calendário evidencia dia que falta, não apenas dia que existe.
- Cor nunca é a única informação.
- Nenhum módulo recebe selo `PRONTO` antes de teste de regressão contra o baseline V1.

## Nova definição de pronto

```text
regra Premium
+ baseline V1 preservado
+ banco correto
+ UI com profundidade operacional
+ RBAC/RLS
+ teste funcional
+ teste de regressão V1→V2
+ documentação
= PRONTO
```

## Ordem de recuperação

1. RDO — concluído nesta RC2.
2. Efetivo + EPI + Equipamentos — porque alimentam o RDO.
3. Tarefas + Ocorrências + Alertas — rotina diária.
4. NFs + Medições — preservando o núcleo financeiro Premium.
5. Reuniões + Documentos + Relatórios.
6. Regressão transversal, homologação local e somente depois nova avaliação de completude.
