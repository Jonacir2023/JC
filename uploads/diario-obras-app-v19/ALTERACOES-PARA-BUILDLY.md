# Diário de Obras — alterações a replicar no app Buildly 3

Documento de transferência. Reúne tudo o que mudou no app atual (repositório
`Jonacir2023/JC`, publicado por `jonacir2023/diario-obras`) entre 24 e 25 de
agosto de 2026, para que as mesmas regras sejam implementadas no Diário de
Obras da plataforma Buildly, que tem repositório próprio.

Cada item traz **o que o usuário vê**, **a regra de negócio** e **como foi
resolvido aqui** — a implementação no Buildly não precisa copiar o código, mas
precisa respeitar a regra e o modelo de dados.

Obra de referência: CESBE SA — Suzano, Ribas do Rio Pardo/MS.

---

## Índice

| # | Alteração | Commit |
|---|-----------|--------|
| 1 | Sincronização entre aparelhos | `3ca109a` |
| 2 | Mais de um RDO por dia | `07359f2` |
| 3 | Diário só grava com responsável | `8d5053e` |
| 4 | Botões "+" amarelos | `55a1748` |
| 5 | Local de execução vira lista | `2c37b97` |
| 6 | Planilha leva os dois locais | `35eb81c` |
| 7 | Legenda da foto vem da atividade | `7c3d487` |
| 8 | Cadastro com histórico (baixa em vez de exclusão) | `96a6a96` |

---

## 1. Sincronização entre aparelhos

**Problema:** o app era 100% local. O que o Renan lançava no celular dele não
chegava ao celular do Jonacir, e vice-versa. Cinco RDOs feitos num aparelho
não existiam no outro.

**Regra:** os dois aparelhos precisam enxergar os mesmos lançamentos, **sem
que um apague o trabalho do outro**. A mescla nunca sobrescreve o que é local
sem critério — vale a regra do item 2.

**Como foi feito aqui:**

- Cada aparelho ganha um identificador próprio (`aparelhoId`, guardado no
  `localStorage`) e um apelido, usados como carimbo em tudo que é enviado.
- Todo salvamento carimba `atualizadoEm` (ISO 8601) e a origem.
- Envio: o backup completo (state + history + chaves de dia) sobe para o
  backend a cada gravação, com débito (*debounce*) para não disparar a cada
  tecla.
- Busca: `GET {backend}?path=backup&action=buscar-ultimo&obra={obra}`.
- Timer: `SYNC_INTERVALO_MS = 3 min`, mais um botão manual
  **"🔄 Sincronizar com os outros aparelhos"**.
- Mescla (`mesclarDaNuvem`):
  - **Cadastro** (atividades, equipamentos, frota, categorias, colaboradores,
    tipos de evento): entra o que é novo por `id`; nada é apagado.
  - **Diários**: aplica a regra do item 2.
  - **Seleções do dia** (`efetivoDia_`, `equipDia_`, `vlDia_`, `ativDia_`): só
    entram junto de um diário que é novo aqui, e nunca por cima de uma chave
    que já existe localmente.
- `mesmoConteudoDiario(a, b)` compara ignorando os carimbos, para não marcar
  como conflito um diário idêntico.

**No Buildly:** havendo backend próprio com banco, isso vira sincronização
servidor-cliente convencional. O que **precisa** ser preservado é a política
de mescla: *nunca sobrescrever cegamente*, e resolver por carimbo de hora.

---

## 2. Mais de um RDO por dia — a regra da obra

**Regra do Jonacir, textual:**

> "Se na mesma data tiver um RDO com o mesmo apontador, apaga o mais antigo.
> Caso tiver dois apontadores diferentes, permanecem os dois."

**Como foi feito aqui:** a chave do histórico deixou de ser só a data e passou
a ser `data#apontador-normalizado`.

```
2026-08-24#renan-de-souza
2026-08-24#jekyll-de-castro-vinente   ← convivem no mesmo dia
```

Funções envolvidas: `slugApontador()`, `chaveDiario(data, apontador)`,
`dataDaChave()`, `apontadorDaChave()`, `chavesDaData()`, `rdosDaData()`,
`datasDoHistorico()`, `chaveDiarioDoAparelho()`.

- `migrarHistoricoParaMultiRdo()` converte as chaves antigas (só data),
  reindexando pelo apontador gravado dentro do próprio RDO.
- `aplicarRegraRdo(chave, remoto)`: chave inexistente → entra; chave existente
  → vence o `atualizadoEm` mais recente.
- Calendário, resumos semanal/mensal/anual e navegação passaram a percorrer
  `datasDoHistorico()` (datas distintas), não as chaves.

**No Buildly:** a chave natural da tabela de RDO é
`(obra, data, apontador)` — **única**, com *upsert* pelo timestamp mais
recente. Não use `(obra, data)`.

---

## 3. Diário só grava com apontador ou supervisor

**Problema:** o salvamento automático gravava diários sem responsável,
gerando entradas `sem-apontador` no histórico.

**Regra:** sem apontador ou supervisor escolhido, **não há gravação** — nem
manual, nem automática.

**Como foi feito aqui:**

- `_ehResponsavelValido(texto)` → aceita o responsável cujo cargo ou categoria
  contenha `apontador`, `apontamento` ou `supervis` (cobre supervisor,
  supervisão, supervisora).
- `responsavelDoDiario(day)` e `diarioPodeSerSalvo(day)` guardam a entrada de
  `salvarDiarioDia()`.
- `avisarFaltaResponsavel()` mostra o aviso e leva o foco ao campo.
- A lista de escolha (`_apontadoresFiltrados()`) já traz só quem se enquadra.

**No Buildly:** validação obrigatória no formulário **e** no servidor. O papel
não deve ser inferido por texto livre — o ideal é um campo `funcao`/`papel`
com valores controlados, e a regra passa a ser `papel IN ('Apontador',
'Supervisor')`.

---

## 4. Botões "+" amarelos

**Problema:** os botões de adicionar na aba Diário eram cinza sobre fundo
claro e ninguém enxergava.

**Como foi feito aqui:** classe `.icon-add` — `color: #f5b334`, borda
`1.5px solid #f5b334`, fonte 22px, realce ao toque
(`rgba(245, 179, 52, 0.32)`). Aplicada a Efetivo, Equipamentos, Veículos
Leves, Atividades, Atividades Paralisadas, Eventos de Segurança e Eventos de
Meio Ambiente.

**Detalhe que custou tempo:** o botão usava o emoji `➕`, que no iOS ignora
`color` — a cor sozinha não resolveria. Trocou-se pelo caractere `+`.

---

## 5. Local de execução vira lista fechada

**Problema:** o campo era texto livre. O mesmo lugar aparecia com grafias
diferentes ("Filtros ETA", "filtro eta", "ETA"), o que estragava os
acumulados por local.

**Lista oficial da obra (13 opções):**

```
Filtro 1 · Filtro 2 · Filtro 3 · Filtro 4 · Filtro 5
Filtro 6 · Filtro 7 · Filtro 8 · Filtro 9 · Filtro 10
ETA · Casa de Bombas · Canal do Reservatório
```

**Como foi feito aqui:** constante `LOCAIS_EXECUCAO` + `opcoesLocalExecucao(atual)`,
que monta o `<select>`. Um valor antigo fora da lista é **preservado** como
opção extra já selecionada, para não corromper o que já foi lançado. A opção
inicial é `— Selecionar local —`.

**No Buildly:** tabela/enum de locais por obra, editável no cadastro da obra.

---

## 6. Planilha: a atividade leva os dois locais

**Regra:** na célula **"Atividades do Dia"** deve ir a descrição, **os dois
locais** (o do cadastro da atividade e o escolhido na lista do dia), a
unidade e a quantidade.

**Formato produzido:**

```
Inspeção de bags – ETA – Filtro 9 (5 un)
Enchimento de bags – ETA (72 m³)
Limpeza geral – Casa de Bombas
```

Regras de montagem, em `textoAtividadesDia(day)`:

- locais iguais → aparece **uma vez** só;
- local ausente → simplesmente não entra;
- sem quantidade → não escreve os parênteses;
- separador entre descrição e locais: ` – ` (travessão).

---

## 7. Legenda da foto vem da atividade escolhida

**Antes:** cada foto tinha um campo de texto livre *e* uma lista de
atividades. O PDF ainda numerava duas vezes: `1. Foto 1 - ...`.

**Agora:**

- O campo de texto livre **foi removido**. Sobra só a lista com as atividades
  marcadas naquele dia.
- A legenda é montada como **`Foto {n} - {atividade}`**
  → `Foto 1 - Enchimento de bags`.
- Sem atividade escolhida, fica só `Foto 2`.
- O número repetido antes de "Foto" saiu.
- Vale nos três destinos: **PDF**, **texto do WhatsApp** e **planilha**.
- Legendas antigas em texto livre continuam sendo exibidas enquanto a foto não
  tiver atividade vinculada (compatibilidade).

Função única: `legendaFoto(foto, indice)`.

---

## 8. Cadastro com histórico — baixa em vez de exclusão ⭐

**Este é o mais importante para o modelo de dados. Descrição do Jonacir:**

> "Imagine que tenha um Uno e um Fusca nos veículos leves utilizados hoje.
> Amanhã o Fusca sai e fica só o Uno. Se eu volto pra editar o dia de ontem, o
> Fusca não está mais nas minhas opções, e se eu salvo o RDO nesta atualização
> fica diferente do real."

**Regra:** uma vez gravado o dia, remover um item do cadastro **não pode**
alterar o que já foi lançado. O item some das listas dali para frente, mas
continua onde foi usado.

**Como foi feito aqui — nada é apagado:**

Três campos por item de cadastro:

| Campo | Tipo | Para quê |
|-------|------|----------|
| `inativo` | boolean | item deu baixa |
| `inativoEm` | `YYYY-MM-DD` | data da baixa — é o que define a vigência |
| `statusEm` | ISO 8601 | resolve conflito de baixa/retorno entre aparelhos |

Regra de vigência, aplicada em toda listagem:

```js
function itemVigenteNoDia(item, dia, usado) {
  if (usado) return true;                       // lançado naquele dia: aparece sempre
  if (!item.inativo) return true;               // nunca teve baixa
  if (!dia || !item.inativoEm) return false;
  return String(dia) < String(item.inativoEm);  // ainda existia naquela data
}
```

Auxiliares: `vigentesNoDia()`, `baixadosNoDia()`, `categoriasVigentes()`,
`baixarDoCadastro()`, `reativarNoCadastro()`.

**Vale para os quatro grupos:** atividades, equipamentos, veículos leves e
efetivo (colaborador e categoria inteira).

**Onde a vigência foi aplicada** — todo ponto que lista o "mundo" de um dia:

- listas de seleção do dia (as quatro);
- veículos e equipamentos **parados** (derivados de "não selecionados") — nas
  quatro saídas: tela, PDF, WhatsApp e planilha;
- totais de efetivo (presentes / ausentes / total);
- "marcar todos";
- seletor de operador de equipamento e de motorista de veículo leve;
- lista de apontador/supervisor;
- lista de DSS ministrado por;
- lista de atividade paralisada;
- sugestões (*datalists*) de descrição.

**Não precisou mudar** o que já lê pelo dado do dia (`filter(c => day.efetivo[c.id])`):
com a baixa lógica, o item continua no array e o relatório antigo se resolve
sozinho.

**Interface:**

- Item baixado que aparece num dia antigo mostra, em vermelho,
  `removido em dd/mm/aaaa`.
- Cada lista do cadastro ganhou o bloco recolhível **"🗑️ Removidos (N)"**, com
  botão ↩️ para trazer de volta. Restaurar uma categoria traz junto quem saiu
  na mesma data.
- Recadastrar **reativa em vez de duplicar**, casando por: placa (veículo),
  número (equipamento), matrícula (colaborador), descrição (atividade).
- Editar um item baixado **não** o ressuscita sem querer (os campos de status
  são preservados).
- Remover uma atividade tira ela do rascunho **de hoje**; um dia passado que
  já a registrou fica intacto.

**Sincronização:** `mesclarStatusCadastro()` faz a baixa e o retorno viajarem
entre aparelhos, vencendo sempre o `statusEm` mais recente.

**No Buildly — o ponto central:** os itens de cadastro precisam de
`ativo`/`inativo_em` (soft delete), e a listagem para um dia precisa ser
consultada **com a data como parâmetro**, não como "cadastro atual". Em SQL:

```sql
SELECT * FROM veiculos
WHERE obra_id = :obra
  AND (inativo_em IS NULL OR inativo_em > :data_do_rdo)
UNION
SELECT * FROM veiculos WHERE id IN (:ids_lancados_nesse_dia);
```

O `DELETE` físico deve ser proibido nessas tabelas.

**Ressalva:** isso vale de agora em diante. Itens apagados de verdade antes
desta versão não têm como voltar.

---

## Pontos de atenção herdados (valem para o Buildly)

1. **Nunca apagar dado do usuário para "limpar cache".** Uma orientação minha
   de limpar os dados do site provavelmente causou a perda dos lançamentos do
   Renan — no app atual o estado vive em `localStorage`. Num app com backend,
   isso deixa de ser risco, e é mais um argumento a favor da migração.
2. **Compartilhar PDF no WhatsApp (Android):** o app rejeita arquivo + texto
   juntos. A solução foi tentar de novo só com o arquivo.
3. **Bibliotecas por CDN quebram em campo.** html2canvas e jsPDF foram
   embutidos no arquivo — sem internet no canteiro, o CDN falhava na hora de
   gerar o PDF.
4. **Fotos do Google Drive não têm cabeçalho CORS.** `crossorigin="anonymous"`
   faz a imagem falhar por completo; as fotos precisam virar *data URI* pelo
   backend antes da captura do PDF.
5. **PDF:** A4 com 1 cm de margem, pré-visualização a 80%, quebra de página
   antes de Registro Fotográfico, Resumo da Semana e Resumo do Mês, foto nunca
   cortada ao meio (`break-inside: avoid`), foto na proporção original, e cada
   travessão nas observações inicia nova linha.
6. **Nome do arquivo gerado:** `RDO {número} {dd-mm-aaaa}`.

---

## Fontes

- Repositório de trabalho: `Jonacir2023/JC` — app em
  `uploads/diario-obras-app-v19/index.html`
- Repositório que publica: `jonacir2023/diario-obras` — `index.html` na raiz
- Especificação completa e anterior do app:
  `uploads/diario-obras-app-v19/ESPECIFICACAO-BUILDLY.md`
- Commits: `3ca109a`, `07359f2`, `8d5053e`, `55a1748`, `2c37b97`, `35eb81c`,
  `7c3d487`, `96a6a96`
