# BUILDLy Premium — Matriz de Permissões V2

## Regra geral

- **Jonacir / proprietário global:** tudo, em todas as obras.
- **Gestor da obra:** tudo, apenas na própria obra.
- **Demais perfis:** somente a própria obra e somente os módulos permitidos.
- Onde a exclusão ainda não foi explicitamente autorizada, a regra conservadora é **não excluir**.

Legenda: V = visualizar, C = criar, E = editar, X = excluir, G = gerar.

| Perfil / módulo | RDO | Cadastro | Alertas | Ocorrências | Tarefas | NFs | Medições | Reuniões | Relatórios | Documentos | Custos* | Planejamento* |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Gestor da obra | V/C/E/X | V/C/E/X | V/C/E/X | V/C/E/X | V/C/E/X | V/C/E/X | V/C/E/X | V/C/E/X | V/G | V/C/E/X | V/C/E/X | V/C/E/X |
| Engenheiro | V/C/E/X | V/C/E/X | V | V/C/E/X | V/C/E | — | V/C/E | V/C/E | V/G | V/C/E | — | — |
| Técnico | V/C/E | V/C/E | V | V/C/E | V/C/E | — | — | — | — | — | — | — |
| Analista | V/C/E | V/C/E | V | V/C/E | V/C/E | — | — | — | — | — | — | — |
| Encarregado | V/C/E | V/C/E | — | — | — | — | — | — | — | — | — | — |
| Apontador | V/C/E | V/C/E | — | — | — | — | — | — | — | — | — | — |
| Administrativo | V/C/E | V/C/E | V | V/C/E | V/C/E | V/C/E | — | — | — | — | V/C/E | — |

\* módulos Premium ainda a construir.

## Especialidades de Engenharia

### Engenheiro de Medições / Custos

É um usuário com papel base `engenheiro` + especialidade `medicoes_custos`.

Permissões adicionais:

- Notas Fiscais: V/C/E
- Custos: V/C/E
- mantém Medições e Documentos do Engenheiro base

Escopo futuro de Custos:

- contratos e subcontratos;
- frota de ônibus;
- veículos leves;
- alojamentos;
- combustíveis;
- água;
- energia;
- condomínios;
- viagens;
- materiais;
- ferramentas;
- locações;
- demais custos da obra.

### Engenheiro de Planejamento

É um usuário com papel base `engenheiro` + especialidade `planejamento`.

Permissões adicionais:

- Planejamento: V/C/E
- cronograma de controle;
- avanço físico;
- programação semanal;
- programação quinzenal;
- restrições;
- curva S e indicadores futuros.

O cronograma base oficial permanece em Documentos.

## Observação sobre Tarefas e Medições

Mantida, por enquanto, a matriz anteriormente aprovada para o Engenheiro base:
- Tarefas: V/C/E
- Medições: V/C/E

As especialidades acrescentam capacidades; não retiram essas permissões até nova decisão explícita.

## Exclusões explicitamente aprovadas para Engenheiro

- RDO: pode excluir.
- Cadastro: pode excluir.
- Ocorrências: pode excluir.

Nos demais módulos técnicos, exclusão continua reservada ao Gestor enquanto não houver nova definição.
