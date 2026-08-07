# Diário de Obras — Especificação para migração

Levantamento extraído do código de `index.html` (6.554 linhas, PWA de arquivo único).
Serve de base para reimplementar o sistema em outra plataforma.

---

## 1. Visão geral

Aplicativo de **RDO (Relatório Diário de Obra)** para construção civil, usado em campo por
apontador, em celular. Hoje é um PWA de arquivo único, offline-first: todo o estado vive no
`localStorage` do aparelho e é espelhado no Google Sheets/Drive por um Apps Script.

**Idioma:** português (PT-BR) em toda a interface e nos dados.

### Telas (abas)

| Aba | Função |
|---|---|
| `diario` | Preenchimento do RDO do dia |
| `gerar` | Saídas: texto para WhatsApp, PDF, acumulado |
| `resumo` | Consolidados por semana / mês / ano |
| `calendario` | Navegação e edição de diários passados |
| `config` | Cadastros (obra, atividades, colaboradores, equipamentos, frota) |

---

## 2. Modelo de dados

### 2.1 Cadastros — `state` (persistente, por obra)

```
state.obra                    objeto único
  nome, empresa, local, contrato
  logo                        imagem base64
  encerramentoNormal          padrão "17:00"
  encerramentoSexta           padrão "16:00"
  encerramentoSabado          padrão "16:00"

state.atividades[]            { id, desc, local, unidade }
                              unidade: m³, m², kg, un, ...

state.colaboradores           { categorias: [ ... ] }
  categorias[]                { id, icon, nome, itens: [] }
  categorias[].itens[]        { id, mat, nome, funcao }
                              mat = matrícula

state.equipamentos[]          { id, numero, desc, isMotorista }
                              isMotorista distingue veículo pesado de máquina

state.veiculosFrota[]         { id, desc, placa }     veículos leves

state.seguranca[]             { id, desc }  tipos de evento de segurança
state.meio_ambiente[]         { id, desc }  tipos de evento ambiental

state.localObraHistorico[]    strings, autocompletar de frentes de serviço
```

> **Atenção na modelagem:** `colaboradores` é o único cadastro com dois níveis
> (categoria → pessoas). Todos os outros são listas planas.

### 2.2 Lançamento diário — `currentDay` / `history[data]`

Chave do registro: `data` no formato `YYYY-MM-DD`.

```
data                    YYYY-MM-DD  (chave)
apontador               nome do responsável pelo apontamento

— Clima, por período —
tempo{Periodo}          'sol' | 'nublado' | 'chuva'
chuva{Periodo}Qtd       precipitação em mm (decimal)
prat{Periodo}           praticabilidade do terreno
                        Períodos: Madrugada (00–07h), Manha (07–12h),
                                  Tarde (13–17h), Noite (17–24h)

— Jornada —
cafeInicio, cafeFim
almocoInicio, almocoFim
encerramento

— DSS (Diálogo Diário de Segurança) —
dssHorario, dssMinistrou, dssTema

— Atividades —
atividadesMarcadas      { atividadeId: true }
atividadesQtd           { atividadeId: quantidade executada }
atividadesStatus        { atividadeId: 'andamento' | 'concluida' }
atividadesAvulsas[]     { desc, local }   fora do cadastro
atividadesExtra         texto livre, uma por linha
atividadesParalisadas[] { id, desc, just }

— Recursos —
efetivo                 { colaboradorId: true }
equipamentos            { equipId: { ativo, operadorMat, operadorNome, status, horimetro } }
horimetros              { equipId: { ini, fim } }
veiculosLeves[]         { id, desc, placa, motorista }
veiculosParados         { recursoId: justificativa }   equipamentos e veículos não usados

— Ocorrências —
eventosSeguranca[]      { tipo, gravidade, desc, acao }
eventosAmbiente[]       { tipo, gravidade, desc, acao }
                        gravidade: 'leve' | 'media' | 'grave'

— Local, registro e fecho —
localObra, descricaoLocal
observacoesDia          texto livre
fotos[]                 { fileId, url, legenda, ativId }
                        arquivo fica no Drive; o app guarda só o link
assinaturas             { apontador: dataURL, fiscal: dataURL }  PNG de assinatura em tela
```

---

## 3. Regras de negócio

Estas são as regras que **precisam ser reproduzidas**, não apenas os campos.

### 3.1 Numeração do RDO
Sequencial por ordem cronológica dos diários existentes, com 3 dígitos:

```
ordena todas as datas do histórico
numero = (posição da data na lista) + 1, com zero à esquerda  →  "001", "165"
```

> Consequência importante: **o número não é fixo**. Inserir um diário de data
> anterior renumera todos os posteriores. Se a plataforma exigir número imutável,
> isso precisa ser decidido antes da migração.

### 3.2 Quantidade de atividade
Lê `atividadesQtd[id]`; se vazio, tenta `atividadesMarcadas[id].qty` (formato legado).
Aceita **vírgula decimal** (`"12,5"` → `12.5`). Valor inválido conta como zero.

### 3.3 Horímetro
`total = fim − início`. Retorna vazio se algum lado faltar ou se `fim < início`.
Também aceita vírgula decimal.

### 3.4 Encerramento padrão por dia da semana
Sexta usa `encerramentoSexta`, sábado usa `encerramentoSabado`, demais usam
`encerramentoNormal`.

### 3.5 Precipitação total do dia
Soma de `chuva{Periodo}Qtd` dos quatro períodos.

### 3.6 Efetivo do dia
Contagem de colaboradores marcados, percorrendo todas as categorias.

### 3.7 Recursos parados
Todo equipamento ou veículo **não marcado** no dia entra automaticamente como parado
e admite justificativa. É uma lista por exclusão, não por seleção.

### 3.8 Acumulados por período
Para semana, mês ou ano:
- **dias com registro** — quantidade de diários no intervalo
- **efetivo médio/dia** — soma do efetivo ÷ dias que tiveram efetivo (arredondado)
- **quantitativos por serviço** — soma de `atividadesQtd` por atividade

A **semana é de segunda a sábado** (domingo pertence à semana anterior).
Os períodos são contados a partir da **data do próprio RDO**, não da data de hoje.

---

## 4. Saídas do sistema

### 4.1 Relatório em PDF (A4)
Seções, na ordem: cabeçalho (logo, título, número do RDO) · dados do contrato ·
Resumo Geral · Condições Climáticas · Jornada e DSS · Atividades do Dia · Efetivo ·
Máquinas e Equipamentos · Observações · **Registro Fotográfico (inicia em página nova)** ·
Resumo da Semana · Resumo do Mês · assinaturas · rodapé.

Formatação: folha de 210mm, margem de 1cm em todos os lados (área útil 190mm),
fontes em 12pt. Nome do arquivo: `RDO {num} {dd-mm-aaaa}.pdf`.

### 4.2 Texto para WhatsApp
Mensagem formatada com marcação do WhatsApp (`*negrito*`, `_itálico_`) e divisores.
Cobre os mesmos dados do dia e fecha com os acumulados de **semana, mês e ano**.

### 4.3 Resumo por período
Tela própria com navegação entre semanas/meses/anos e envio por WhatsApp.

---

## 5. Integrações externas

Tudo passa por **um único Google Apps Script** (`APPS_SCRIPT_URL_DIARIO`), variando
`path` e `action`:

| Chamada | Método | Payload | Retorno |
|---|---|---|---|
| `?path=diario&action=salvar` | POST | 26 campos (ver 5.1) | `{ ok }` |
| `?path=ia&action=perguntar` | POST | `{ pergunta, obra, data, atividades, observacoes }` | `{ resposta }` |
| `?path=backup&action=buscar-ultimo&obra=` | GET | — | último backup |
| corpo com `path: 'foto'` | POST | `{ path, data, obra, base64 }` | `{ fileId, url }` |

### 5.1 Campos enviados à planilha

```
rdoNum, data, diaSemana, obra, empresa, local, descricaoObra, tempo, jornada,
dssHorario, dssMinistrou, dssTema, atividades, efetivoTotal, efetivoPorFuncao,
colaboradoresPresentes, equipamentos, veiculosLeves, veiculosParados,
eventosSeguranca, eventosMeioAmbiente, observacoes, apontador, localObra,
descricaoLocal, fotos
```

> Os campos de lista chegam como **texto com quebras de linha**, não estruturados.
> Numa plataforma com banco relacional, isso deve virar tabela filha.
> O comentário no código alerta que o Apps Script precisa ser a versão de 23 colunas —
> há histórico de descasamento entre app e planilha.

### 5.2 Fotos
Enviadas em base64 ao Apps Script, que grava no Google Drive e devolve `fileId` e `url`.
São exibidas pela URL de miniatura `drive.google.com/thumbnail?id={fileId}&sz=w400`.

> **Limitação conhecida:** essa URL **não envia cabeçalho CORS**. As imagens aparecem
> normalmente na tela e na impressão, mas não podem ser capturadas por `canvas`
> (html2canvas) — o que impede embuti-las no PDF gerado para compartilhamento.
> Numa plataforma com storage próprio e CORS configurado, essa restrição desaparece.

---

## 6. Persistência local

Chaves do `localStorage`, todas isoladas **por obra** (sufixo com o nome da obra):

```
obra_atual                     nome da obra ativa
diario_obras_v4_state_{obra}   cadastros
diario_obras_v4_history_{obra} todos os diários
ativDia_{data}                 seleção de atividades do dia
efetivoDia_{data}              seleção de efetivo
equipDia_{data}                seleção de equipamentos
vlDia_{data}                   seleção de veículos leves
ultimoBackupNuvem              controle de backup
```

Há migração automática das chaves da versão 3 para a versão 4.

> **Ponto de atenção na migração:** parte da seleção do dia mora em chaves separadas
> (`ativDia_`, `efetivoDia_`, `equipDia_`, `vlDia_`) e não dentro do objeto do diário.
> Ao exportar os dados históricos, é preciso ler essas chaves também, senão os
> diários vêm sem equipamentos e sem efetivo.

---

## 7. Recursos que dependem do ambiente

Itens que hoje existem por ser um app de navegador e precisam de equivalente na plataforma:

- **Funcionamento offline** — o apontador trabalha em campo sem sinal; a gravação é local
  e a sincronização acontece depois
- **Assinatura em tela** — captura por toque, salva como PNG
- **Compressão de foto** antes do envio
- **Câmera** do aparelho
- **Compartilhamento nativo** do sistema (Web Share API), para enviar o PDF ao WhatsApp
- **Backup e restauração** por arquivo, além do backup em nuvem

---

## 8. Questões a decidir antes de migrar

1. **Numeração do RDO** — manter sequencial recalculado (como hoje) ou fixar no momento
   da criação? Hoje inserir um diário retroativo renumera os seguintes.
2. **Multi-obra** — hoje o isolamento é por chave de armazenamento no aparelho. Numa
   plataforma multiusuário isso vira escopo de permissão.
3. **Dados em texto** — os campos de lista enviados à planilha são texto corrido. Migrar
   para tabelas relacionais exige reprocessar o histórico já gravado.
4. **Fotos** — sair do Drive para um storage com CORS resolve a limitação do PDF.
5. **Um apontador por obra?** — o app atual não tem noção de usuários; `apontador` é
   apenas um campo de texto.
