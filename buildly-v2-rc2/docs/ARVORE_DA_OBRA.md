# BUILDLy Premium V2 — Especificação da Árvore da Obra V1

## 1. Objetivo

A Árvore da Obra é a navegação principal do BUILDLy Premium.

Ela não é apenas um menu.

Cada nó representa uma entidade, agrupamento ou contexto real da obra e pode:
- abrir um módulo;
- abrir um registro;
- abrir uma EAP;
- mostrar um indicador;
- mostrar status;
- filtrar todo o conteúdo da área de trabalho.

## 2. Estrutura base

```text
OBRA
├── Dashboard
├── Planejamento
│   ├── Cronograma
│   ├── Avanço físico
│   ├── Curva S
│   ├── Programação semanal
│   ├── Programação quinzenal
│   └── Restrições
├── EAP da Obra
│   ├── 01 Terraplenagem
│   │   ├── 01.01 Limpeza
│   │   ├── 01.02 Escavação
│   │   └── 01.03 Aterro
│   ├── 02 Drenagem
│   │   ├── 02.01 Tubulação
│   │   ├── 02.02 Caixas
│   │   └── 02.03 Dissipadores
│   └── ...
├── Custos
├── Contratos
├── Medições
├── Notas fiscais
├── RDO
├── Cadastro
├── Equipamentos
├── Efetivo
├── Alertas
├── Ocorrências
├── Tarefas
├── Reuniões
├── Relatórios
└── Documentos
```

## 3. Tipos de nó

### obra
Raiz do contexto.

### modulo
Abre um módulo funcional.

### grupo
Agrupa nós sem ser necessariamente uma entidade do banco.

### wbs
Representa um item da EAP/WBS.

### contrato
Representa contrato estruturado de terceiro.

### documento
Representa documento ou pasta lógica.

### periodo
Ano, mês, semana ou outro agrupador temporal.

### registro
Registro individual, como RDO, NF, medição ou reunião.

## 4. Contrato do nó

Todo nó deverá possuir conceitualmente:

```js
{
  id,
  tipo,
  titulo,
  codigo,
  parent_id,
  obra_id,
  entidade_id,
  modulo,
  rota,
  icone,
  ordem,
  expansivel,
  status,
  indicador,
  permissoes
}
```

Nem todo campo precisa existir no banco.
A árvore pode ser construída a partir de múltiplas fontes.

## 5. Regra de contexto

Ao selecionar um nó, criar um `contextoAtual`.

Exemplo:

```js
contextoAtual = {
  obra_id: "...",
  tipo: "wbs",
  wbs_id: "...",
  wbs_codigo: "02.01",
  titulo: "Tubulação"
}
```

Todos os componentes da área principal recebem este contexto.

## 6. EAP como eixo integrador

Ao clicar em `02.01 Tubulação`, mostrar:

- orçamento vinculado;
- CBS/códigos de custo;
- contratos vinculados;
- valor comprometido;
- realizado;
- saldo;
- cronograma;
- avanço físico;
- produção;
- RDOs;
- fotos;
- medições;
- notas fiscais;
- documentos;
- restrições;
- tarefas;
- responsáveis.

A EAP torna-se o ponto comum entre campo, planejamento e financeiro.

## 7. Contrato como contexto

Ao clicar num contrato:

```text
Contrato
├── Resumo
├── Itens
├── Medições
├── Notas fiscais
├── Aditivos
├── Retenções
├── Pagamentos
├── Documentos
├── EAP vinculada
├── Custos
└── Saldo
```

O valor aprovado do contrato gera compromisso orçamentário.

## 8. Indicadores na árvore

Nós podem exibir informações resumidas.

Exemplos:

```text
Custos                R$ 105 mi
Comprometido           R$ 72 mi
Saldo disponível       R$ 29 mi
```

```text
02 Drenagem                58%
02.01 Tubulação             63%
02.02 Caixas                52%
02.03 Dissipadores          38%
```

```text
Contratos                  18
Alertas                     12
Tarefas                     23
Restrições                   7
```

Indicadores devem ser curtos.
Detalhamento pertence à área principal.

## 9. Status

Status devem ter semântica consistente:

- verde: normal
- amarelo: atenção
- vermelho: crítico
- cinza: inativo / arquivado
- azul: informativo / em andamento

Não usar cor como única forma de comunicar estado.

## 10. Breadcrumb

Toda navegação deve atualizar o breadcrumb.

Exemplo:

```text
TESTE > EAP > 02 Drenagem > 02.01 Tubulação
```

Contrato:

```text
TESTE > Contratos > CT-002 Drenagem
```

Documento:

```text
TESTE > Documentos > Projetos > Civil > TESTE-CIV-DRG-00125 Rev.03
```

## 11. Segurança

A árvore respeita RBAC.

Se o usuário não possui `visualizar` no módulo:
- o módulo não aparece;
- filhos daquele módulo também não aparecem.

Mesmo assim:
- o banco continua protegendo os dados via RLS.

A árvore nunca é autoridade de segurança.

## 12. Gestor Global

Jonacir poderá navegar:

```text
PORTFÓLIO
├── TESTE
├── Obra B
├── Obra C
└── ...
```

Selecionar uma obra muda toda a árvore para o contexto daquela obra.

Futuramente haverá um Dashboard de Portfólio acima do nível obra.

## 13. Pesquisa na árvore

Busca deve localizar:
- EAP
- contrato
- RDO
- documento
- módulo
- equipamento
- colaborador quando permitido

Resultados nunca podem ultrapassar o escopo do usuário.

## 14. Lazy loading

Não carregar milhares de nós de uma vez.

Exemplo:
- carregar Obras;
- ao expandir EAP, carregar primeiro nível;
- ao expandir Documentos, carregar pasta/revisões;
- ao expandir RDO, carregar meses;
- ao expandir mês, carregar RDOs.

Isso mantém desempenho.

## 15. Persistência de estado

Guardar no navegador:
- obra atual;
- nós abertos;
- último nó selecionado.

Prefixo sugerido:
`buildly-v2::tree::`

Não guardar dados sensíveis em localStorage.

## 16. Integração futura com URL

Cada contexto deverá poder virar URL navegável.

Exemplos:

```text
/app/obra/{obraId}/eap/{wbsId}
/app/obra/{obraId}/contrato/{contratoId}
/app/obra/{obraId}/rdo/{rdoId}
```

Permite:
- bookmark;
- compartilhar link interno;
- voltar/avançar do navegador;
- abrir nova aba.

## 17. Primeiro MVP da árvore

Construir nesta ordem:

1. obra
2. módulos principais
3. EAP
4. contratos
5. documentos
6. RDO por mês
7. indicadores
8. busca
9. persistência
10. deep links

## 18. Critério de pronto

A Árvore da Obra estará pronta quando:

- respeitar RBAC;
- suportar milhares de registros sem travar;
- abrir contexto correto;
- manter breadcrumb;
- manter seleção;
- integrar EAP;
- integrar contratos;
- integrar documentos;
- integrar RDO;
- restaurar estado da navegação;
- funcionar bem em desktop e tablet.
