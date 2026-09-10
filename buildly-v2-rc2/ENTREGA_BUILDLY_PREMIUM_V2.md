# ENTREGA — BUILDLy Premium V2

Data da entrega: 06/09/2026

## Status

**Versão funcional demonstrável entregue.**

O aplicativo entregue é um novo shell V2 independente do V1, com motor de regras em memória e dados demo. O backend de produção não foi alterado.

## Principais pilares implementados na demonstração

1. Árvore da Obra
2. EAP
3. CBS
4. Dashboard executivo
5. Planejamento
6. Orçamento
7. Contratos
8. Comprometimento automático
9. Medições
10. Custos
11. Notas fiscais
12. Forecast
13. RDO
14. Documentos
15. Tarefas
16. Alertas
17. Ocorrências
18. Reuniões
19. Equipamentos
20. Efetivo
21. Relatórios
22. Perfis e especialidades
23. Pesquisa global
24. Responsividade

## O que é demonstração e o que é produção

### Funcional agora

O frontend e o motor financeiro demo podem ser abertos e utilizados imediatamente.

### Preparado, mas não aplicado ao banco real

As migrations SQL 01–12.

Isso é intencional: aplicar segurança, estrutura financeira e triggers diretamente no banco produtivo sem homologação contradiz a governança definida para o projeto.

## Marco financeiro validado

O teste automático confirma:

```text
Orçamento Atual       105,0 mi
Comprometido           72,0 mi
Medido                 38,0 mi
Custos diretos          4,0 mi
Valor apropriado       76,0 mi
Saldo disponível       29,0 mi
Forecast final        102,8 mi
Saldo projetado         2,2 mi
Pago                   31,4 mi
```

Aprovar novo contrato no demo muda imediatamente o comprometido e o saldo.
