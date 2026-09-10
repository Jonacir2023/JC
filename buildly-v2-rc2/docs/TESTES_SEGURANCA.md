# BUILDLy Premium — 04D Matriz de Testes de Segurança

## Objetivo

Validar três camadas ao mesmo tempo:

1. **Escopo da obra**
2. **Permissão do módulo**
3. **Permissão da operação**

A interface pode esconder o botão; o teste definitivo é a API/banco negar.

---

# Cenário-base de homologação

Criar somente em ambiente controlado de teste/homologação:

- Obra A
- Obra B

Usuários:
- proprietário global
- gestor_A
- gestor_B
- engenheiro_A
- tecnico_A
- analista_A
- encarregado_A
- apontador_A
- administrativo_A
- eng_medicoes_A
- eng_planejamento_A
- eng_completo_A (medicoes_custos + planejamento)

Nunca usar dados reais de colaboradores para estes testes.

---

# 1. PROPRIETÁRIO GLOBAL

Esperado:

- vê A e B
- CRUD em todos os módulos
- pode criar obra
- pode manter catálogos corporativos
- pode atribuir especialidades
- pode editar perfis
- tentativa de acesso legítima nunca deve ser bloqueada pela obra

---

# 2. GESTOR A

Esperado:

- vê somente Obra A
- CRUD operacional completo na Obra A
- pode editar metadados da Obra A
- não cria nova obra
- não apaga fisicamente a obra
- não vê/edita Obra B
- administra perfis somente da Obra A
- não consegue promover ninguém para `acesso_global=true`

Teste crítico:

tentar UPDATE enviando `obra_id = Obra B`.
Esperado: RLS bloqueia.

---

# 3. ENGENHEIRO A

Permitido:

- RDO: V/C/E/X
- Cadastro local: V/C/E/X
- Alertas: V
- Ocorrências: V/C/E/X
- Tarefas: V/C/E
- Medições: V/C/E
- Reuniões: V/C/E
- Relatórios: V/G
- Documentos: V/C/E

Negado:

- NFs
- excluir Tarefas
- excluir Medições
- excluir Reuniões
- excluir Documentos
- Custos, salvo especialidade
- Planejamento, salvo especialidade
- qualquer dado da Obra B

---

# 4. TÉCNICO A

Permitido:
- RDO V/C/E
- Cadastro local V/C/E
- Alertas V
- Ocorrências V/C/E
- Tarefas V/C/E

Negado:
- DELETE nesses módulos
- NFs
- Medições
- Reuniões
- Relatórios
- Documentos
- Custos
- Planejamento
- Obra B

---

# 5. ANALISTA A

Idêntico ao Técnico A nesta versão.

Teste futuro obrigatório se os papéis forem diferenciados:
nenhuma alteração de um pode herdar silenciosamente para o outro.

---

# 6. ENCARREGADO A

Permitido:
- RDO V/C/E
- Cadastro local V/C/E

Negado:
- DELETE
- Alertas
- Ocorrências
- Tarefas
- NFs
- Medições
- Reuniões
- Relatórios
- Documentos
- Custos
- Planejamento
- Obra B

---

# 7. APONTADOR A

Idêntico ao Encarregado A nesta versão.

---

# 8. ADMINISTRATIVO A

Permitido:
- RDO V/C/E
- Cadastro local V/C/E
- Alertas V
- Ocorrências V/C/E
- Tarefas V/C/E
- NFs V/C/E
- Custos V/C/E quando o módulo estiver materializado

Negado:
- DELETE nos módulos acima
- Medições
- Reuniões
- Relatórios
- Documentos
- Planejamento
- Obra B

---

# 9. ENGENHEIRO DE MEDIÇÕES / CUSTOS A

Papel base: engenheiro

Especialidade:
`medicoes_custos`

Herda tudo do Engenheiro e acrescenta:

- NFs V/C/E
- Custos V/C/E

Não recebe DELETE de NF/Custos automaticamente.

---

# 10. ENGENHEIRO DE PLANEJAMENTO A

Papel base: engenheiro

Especialidade:
`planejamento`

Herda Engenheiro e acrescenta:

- Planejamento V/C/E

Não ganha NFs/Custos por ser Planejamento.

---

# 11. ENGENHEIRO COMPLETO A

Especialidades:
- medicoes_custos
- planejamento

Esperado:
união das permissões.

Teste importante:
especialidades devem **somar**, nunca substituir o papel base.

---

# 12. CATÁLOGOS CORPORATIVOS

Tabelas:
- atividades
- epis
- funcoes
- epi_funcao

Para todos usuários locais:
- SELECT permitido quando necessário
- INSERT/UPDATE/DELETE negados

Para proprietário global:
- CRUD permitido

Teste:
apontador tenta alterar uma atividade global.
Esperado: bloqueado, mesmo possuindo Cadastro.

---

# 13. AVISOS

Usuário com Alertas:

Permitido:
- SELECT
- UPDATE somente `lido_em`

Teste negativo:
tentar alterar `titulo`, `gravidade` ou `obra_id`.
Esperado: privilégio de coluna / RLS bloqueia.

Sem Alertas:
- SELECT bloqueado
- UPDATE bloqueado

---

# 14. SOLICITAÇÕES PÚBLICAS

Sem login:

Permitido:
- INSERT em `solicitacoes`
- status inicial pendente
- tarefa_id nulo

Negado:
- SELECT
- UPDATE
- DELETE

Usuário com Tarefas:
- SELECT da própria obra
- UPDATE para avaliar
- sem DELETE físico

---

# 15. EMISSÕES

Registro de emissão é append-only.

Permitido:
- SELECT na obra acessível
- INSERT na obra acessível

Negado:
- UPDATE
- DELETE

Teste:
emitir PDF e depois tentar alterar hash.
Esperado: bloqueado.

---

# 16. TESTE DE TROCA DE OBRA NO PAYLOAD

Para toda tabela com `obra_id`:

1. autenticar usuário da Obra A
2. fazer INSERT válido na A
3. repetir alterando `obra_id` para B

Esperado:
A funciona.
B é bloqueado.

Para tabelas filhas:
trocar o FK pai para objeto da Obra B.

Exemplos:
- rdo_id
- contrato_id
- nf_id
- reuniao_id
- medicao_id

Esperado: bloqueio.

---

# 17. TESTE DE ACESSO POR CONSOLE

Mesmo com botão escondido:

Executar manualmente no console do navegador:

```js
await db.from('nfs').select('*')
```

como Técnico.

Esperado:
zero linhas / acesso negado conforme operação e policy.

Depois:

```js
await db.from('nfs').insert({...})
```

Esperado:
RLS bloqueia.

---

# 18. TESTE DE VIEWS

Validar:

- vw_status_obra
- vw_efetivo
- vw_alertas
- vw_atividade_acumulado
- vw_chuva_mes
- vw_contrato_saldo
- vw_disponibilidade_equipamento
- vw_ficha_epi
- vw_lancamento_financeiro
- vw_medicao_item
- vw_rdo_dia
- vw_rdo_resumo
- vw_minhas_permissoes
- vw_meu_contexto_buildly

Todas devem respeitar `security_invoker=true`.

Usuário sem módulo financeiro não pode obter dados financeiros
simplesmente consultando uma view.

---

# 19. TESTE DE AJUDA DE CUSTO

Situação transitória:

`ajuda_custo` ainda participa do Cadastro porque `vw_efetivo`
usa o registro para regime/viagem.

Antes de ativar usuários reais com necessidade de confidencialidade:

- separar `regime operacional`
- separar `valor financeiro`
- mover valor para módulo Custos

Este item é bloqueador para confidencialidade financeira Premium.

---

# 20. CRITÉRIO DE APROVAÇÃO

Uma migration de segurança só pode ser liberada quando:

- 100% dos testes positivos passam
- 100% dos testes negativos são bloqueados
- nenhum usuário local enxerga Obra B
- proprietário global mantém acesso
- formulário público continua funcionando
- PDFs continuam registrando emissões
- views não vazam dados
- testes de regressão atuais continuam passando
