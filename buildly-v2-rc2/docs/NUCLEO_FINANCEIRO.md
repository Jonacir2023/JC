# BUILDLy Premium V2 — Núcleo Financeiro V1

## 1. Objetivo

Criar o núcleo financeiro profissional do BUILDLy Premium.

A lógica central será:

```text
Orçamento
   ↓
Compromissos
   ↓
Realizado
   ↓
Pago
   ↓
Forecast
   ↓
Saldo disponível / custo final previsto
```

Todo valor deve ser rastreável até:
- obra;
- EAP/WBS;
- CBS/código de custo;
- origem;
- documento;
- responsável;
- data/competência.

## 2. Dimensões obrigatórias

### EAP / WBS
Representa **onde/o quê** da obra.

Exemplo:

```text
02 Drenagem
02.01 Tubulação
02.02 Caixas
02.03 Dissipadores
```

### CBS / Código de custo
Representa **qual natureza de custo**.

Exemplo:

```text
MAT   Materiais
MO    Mão de obra
EQP   Equipamentos
SUB   Subempreiteiros
COMB  Combustíveis
ADM   Administração local
```

Uma linha financeira relevante deve poder responder:

> Em qual parte da obra foi gasto e em qual natureza de custo?

## 3. Orçamento

### Orçamento Original
Baseline aprovado da obra.

Não deve ser sobrescrito.

### Alterações Orçamentárias
Somente alterações aprovadas modificam a versão vigente.

Tipos:
- transferência;
- suplementação;
- redução;
- reclassificação;
- contingência;
- revisão aprovada.

### Orçamento Atual

```text
Orçamento Atual
=
Orçamento Original
+
Alterações Orçamentárias Aprovadas
```

## 4. Compromissos

Compromisso é uma obrigação futura que já consome orçamento.

Origens previstas:

- contrato de terceiro;
- pedido de compra;
- ordem de serviço;
- locação;
- reserva manual aprovada;
- contrato recorrente;
- outro compromisso autorizado.

### Regra principal

Quando o contrato passa para **Aprovado/Contratado**:

```text
Comprometido += valor aprovado
Saldo disponível -= valor aprovado
```

Não esperar NF ou pagamento.

## 5. Ciclo de um contrato

```text
Rascunho
↓
Em Aprovação
↓
Aprovado / Contratado
↓
Ativo
↓
Encerrado
```

Alternativa:

```text
Cancelado
```

Somente status aprovados comprometem verba.

## 6. Valor do contrato

```text
Valor Atual do Contrato
=
Valor Original
+ Aditivos Aprovados
- Supressões Aprovadas
```

Aditivo aprovado:
- aumenta compromisso.

Supressão aprovada:
- reduz compromisso ainda não realizado;
- libera orçamento correspondente.

## 7. Realizado

Realizado representa custo já reconhecido/apropriado.

Fontes:
- medição aprovada;
- NF aprovada;
- lançamento direto de custo;
- folha/apropriação;
- consumo;
- outro fato gerador aceito.

Evitar contabilizar duas vezes a mesma origem.

## 8. Comprometido Restante

Não usar:

```text
Contrato + NF
```

pois causaria dupla contagem.

Usar:

```text
Comprometido Restante
=
Compromisso Atual
-
Realizado vinculado ao compromisso
```

Exemplo:

Contrato = R$ 12 mi

Realizado contra contrato = R$ 3 mi

```text
Comprometido Restante = R$ 9 mi
```

## 9. Valor Apropriado / Assigned

Conceito central:

```text
Valor Apropriado
=
Realizado
+
Comprometido Restante
+
Outras Reservas Aprovadas
```

## 10. Saldo Orçamentário Disponível

```text
Saldo Disponível
=
Orçamento Atual
-
Valor Apropriado
```

Isso responde:

> Quanto ainda posso contratar sem ultrapassar a verba atual?

## 11. Exemplo

```text
Orçamento Atual                 100 mi
Contrato A aprovado              40 mi
Contrato B aprovado              20 mi
Realizado sem compromisso         3 mi
```

Primeiro:

```text
Compromissos                     60 mi
Realizado direto                  3 mi
Valor apropriado                 63 mi
Saldo disponível                 37 mi
```

Depois o Contrato A é medido em R$ 5 mi.

```text
Realizado vinculado              5 mi
Comprometido restante A         35 mi
Comprometido restante B         20 mi
Realizado direto                 3 mi
```

Total apropriado continua:

```text
35 + 20 + 5 + 3 = 63 mi
```

Saldo continua:

```text
100 - 63 = 37 mi
```

A medição não libera orçamento.

## 12. Pago

Pagamento é fluxo financeiro, não consumo novo de orçamento.

```text
Pago <= Realizado
```

Na visão gerencial:

```text
Comprometido
→ Realizado
→ Pago
```

O valor muda de estágio, sem ser contado duas vezes.

## 13. Forecast

Forecast representa o custo final esperado.

```text
EAC / Forecast Final
=
Realizado
+
Comprometido Restante
+
Estimativa para terminar ainda não contratada
```

### ETC

```text
ETC
=
Estimativa para concluir
```

### EAC

```text
EAC
=
Realizado + ETC
```

O sistema deverá permitir forecast por:
- obra;
- EAP;
- CBS;
- mês;
- contrato;
- responsável.

## 14. Saldo Projetado ao Final

```text
Saldo Projetado
=
Orçamento Atual
-
Forecast Final
```

Se negativo:
- tendência de estouro.

Se positivo:
- margem prevista.

## 15. Fluxo de caixa

Separado de saldo orçamentário.

Contrato aprovado:
- compromete orçamento imediatamente;
- cria previsão de desembolso futuro.

Fluxo mensal:

```text
Previsto
Contratado
Medido
Faturado
Pago
```

O fluxo deve poder ser distribuído por:
- medição prevista;
- condição contratual;
- cronograma;
- programação manual.

## 16. Contratos de terceiros

Contrato deve ser entidade estruturada.

Campos mínimos:

- obra;
- número;
- fornecedor;
- CNPJ;
- objeto;
- tipo;
- status;
- data início;
- data fim;
- valor original;
- valor atual;
- retenção;
- reajuste;
- responsável;
- EAP;
- CBS;
- condição de pagamento;
- documentos;
- observações.

## 17. Itens contratuais

Cada contrato deve possuir itens.

Exemplo:

```text
CT-002 Drenagem

01 Tubo PEAD DN 400     m
02 Caixa pluvial        un
03 Escavação            m³
04 Reaterro             m³
```

Cada item pode possuir:
- EAP;
- CBS;
- unidade;
- quantidade;
- preço unitário;
- valor total.

## 18. Medições

Fluxo:

```text
Contrato
↓
Item contratual
↓
Quantidade medida
↓
Valor medido
↓
Aprovação
↓
Realizado
```

A medição aprovada deve reduzir o compromisso restante na mesma proporção em que aumenta o realizado.

## 19. Nota Fiscal

NF pode ter origem:

- medição;
- contrato;
- pedido de compra;
- custo direto;
- viagem;
- combustível;
- alojamento;
- utilidade;
- outro.

Evitar usar a NF como único fato financeiro.

A NF é documento fiscal ligado ao fato gerador.

## 20. Aditivos

Tipos:

- aumento de valor;
- supressão;
- prazo;
- escopo;
- reajuste;
- combinação.

Somente aditivo aprovado modifica valor contratual e compromisso.

Guardar histórico imutável.

## 21. Orçamento por EAP + CBS

Exemplo:

```text
02.01 Tubulação

MAT   4,0 mi
MO    1,2 mi
EQP   0,8 mi
SUB   2,0 mi
----------------
Total 8,0 mi
```

Permite comparação:

```text
Orçado
Comprometido
Realizado
Forecast
Saldo
```

em cada interseção EAP × CBS.

## 22. Árvore da Obra

Ao clicar:

```text
02.01 Tubulação
```

mostrar:

- Orçamento;
- Comprometido;
- Realizado;
- Pago;
- Forecast;
- Saldo;
- Contratos;
- Medições;
- NFs;
- RDOs;
- Planejamento;
- Documentos.

## 23. Dashboard financeiro

Indicadores mínimos:

```text
Orçamento Original
Orçamento Atual
Comprometido
Comprometido Restante
Realizado
Pago
Forecast Final
Saldo Disponível
Saldo Projetado
```

Drill-down obrigatório.

Nenhum número executivo deve existir sem permitir abrir sua composição.

## 24. Estrutura conceitual de dados

### Reutilizar
- contratos_comerciais
- contrato_itens
- medicoes
- medicao_itens
- nfs
- nf_itens
- documentos
- emissoes

### Criar futuramente
- eap_itens
- cbs_codigos
- orcamentos
- orcamento_versoes
- orcamento_itens
- compromissos
- compromisso_itens
- contrato_alteracoes
- custos_lancamentos
- pagamentos
- forecast_versoes
- forecast_itens

Nomes finais ainda sujeitos à revisão antes de migration.

## 25. Regra de fonte única

Evitar tabelas paralelas com o mesmo fato.

Exemplo:

Se uma medição aprovada gera realizado:
- não criar outro lançamento manual duplicando esse valor.

Usar origem:

```text
origem_tipo = medicao
origem_id = ...
```

## 26. Ledger financeiro

Recomendação:

Toda movimentação relevante deverá gerar evento financeiro rastreável.

Exemplos:

```text
ORCAMENTO_CRIADO
ORCAMENTO_REVISADO
CONTRATO_APROVADO
ADITIVO_APROVADO
SUPRESSAO_APROVADA
MEDICAO_APROVADA
NF_APROVADA
PAGAMENTO_REALIZADO
COMPROMISSO_CANCELADO
FORECAST_REVISADO
```

Isso cria histórico auditável.

## 27. Não apagar histórico financeiro

Contratos, medições, aditivos, compromissos e custos aprovados:

- não excluir fisicamente;
- cancelar/reverter com registro de motivo;
- manter usuário/data/hora.

## 28. Primeiro MVP financeiro

Construir nesta ordem:

1. EAP
2. CBS
3. Orçamento Base
4. Orçamento Atual
5. Contratos de terceiros
6. Itens contratuais
7. Motor de compromisso
8. Saldo disponível
9. Aditivos/supressões
10. Medições
11. Realizado
12. NF
13. Pagamento
14. Forecast
15. Dashboard

## 29. Primeiro marco Premium

Teste:

```text
Orçamento Atual = R$ 100 mi
```

Cadastrar e aprovar:

```text
Contrato Drenagem = R$ 12 mi
```

Resultado instantâneo:

```text
Comprometido       R$ 12 mi
Saldo disponível   R$ 88 mi
```

Medir R$ 3 mi:

```text
Realizado             R$ 3 mi
Comprometido restante R$ 9 mi
Valor apropriado      R$ 12 mi
Saldo disponível      R$ 88 mi
```

Esse teste é o primeiro grande marco financeiro do BUILDLy Premium.

## 30. Critério de pronto

O núcleo financeiro estará pronto quando:

- não houver dupla contagem;
- todo número tiver origem;
- todo contrato aprovado comprometer verba;
- aditivo alterar compromisso;
- supressão liberar somente saldo não consumido;
- medição migrar compromisso para realizado;
- pagamento não consumir orçamento novamente;
- forecast projetar custo final;
- EAP e CBS permitirem drill-down;
- nenhuma alteração aprovada puder desaparecer do histórico.
