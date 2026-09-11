# PLANO TÉCNICO — Recuperação Efetivo + EPI + Equipamentos (V1→V2 RC2)

**Data:** 2026-09-10  
**Etapa:** 2 (após RDO recuperado)  
**Status:** Em andamento

---

## 1. BASELINE V1 → V2

### 1.1 Efetivo (V1)
**Tabelas V1:**
- `contratos` (empregados)
- `contrato_dados_adicionais` (CPF, CTPS, CNH, PIS, etc)
- `historico_funcoes` (mudanças de função com período)

**Campos V1 observados (contratos):**
- id, numero, obra_id, empresa_id, nome, cpf, ctps, data_admissao, data_desligamento, funcao_id
- empresa (nome empresa/fornecedor), tipo (proprio/terceiro)
- status (ativo/inativo)

**Campos V1 observados (contrato_dados_adicionais):**
- contrato_id, tipo_doc, numero, validade, arquivo_url

**Operações V1:**
- CRUD contrato
- Editar dados adicionais
- Registrar entrada/saída
- Alocar/desalocar função com período
- Gerar folha de pessoal
- Relatório efetivo por período/função

**Ligação RDO V1:**
- `rdos.efetivo[]` → array de `{contrato_id, presente: true/false}`
- RDO referencia colaboradores pelo contrato_id

### 1.2 V2 RC2 Observado
**Estruturas data.js:**
- `people`: id, name, company, function, type (proprio/terceiro), admission, status
- `workforce`: agregado por company (own, third, total)
- `functionsCatalog`: id, name, category, travelDays

**Telas:**
- `workforcePage()`: KPI + tabela básica
- `rdoPersonOptions()`: carga pessoas para RDO
- `rdoAttendanceEditor()`: tabela attendance (presente/falta/extra/observação)

**Gaps:**
- [ ] Dados adicionais (CPF, CTPS, CNH, PIS, CNH validade, etc)
- [ ] Histórico de funções (período de alocação)
- [ ] Tela de cadastro/edição de pessoa completa
- [ ] Tela de dados adicionais (upload/visualização)
- [ ] Entrada/saída com data
- [ ] Filtros (ativo, função, período, empresa)
- [ ] Relatório efetivo

---

### 2. EQUIPAMENTOS (V1)

**Tabelas V1:**
- `equipamentos` (frota)
- `tipo_equipamento` (catálogo)
- `equipamento_obra` (alocação com datas)

**Campos V1 observados:**
- id, codigo_interno, tipo_id, modelo, serial, marca, valor
- data_aquisicao, data_saida (sucata)
- status (ativo, manutencao, sucata)
- proprietario (corporativo/locado), fornecedor

**Tabela equipamento_obra:**
- equipamento_id, obra_id, data_entrada, data_saida
- Histórico de movimento

**Operações V1:**
- Criar/editar equipamento
- Alocar/desalocar de obra
- Movimentar entre obras
- Registrar manutenção
- Marcar como danificado
- Relatório utilização/movimento

**Ligação RDO V1:**
- `efetivo.equipamento_id` (opcional)
- RDO.equipmentUse → array de `{equipamento_id, operador, horas, status}`

### 2.2 V2 RC2 Observado
**Estrutura data.js:**
- `equipment`: id, prefix, type, owner (Locada/Próprio), supplier, availability, utilization, status

**Telas:**
- `equipmentPage()`: existe e permite CRUD
- `rdoEquipmentEditor()`: tabela de uso em RDO (ativo/operador/horas/horimetro)

**Gaps:**
- [ ] Dados adicionais (modelo, serial, marca, valor, data aquisição)
- [ ] Tipo de equipamento (catálogo)
- [ ] Alocação a obra com data de entrada/saída
- [ ] Histórico de movimento entre obras
- [ ] Status completo (operando, parado, manutenção, sucata)
- [ ] Relatório movimento/utilização

---

### 3. EPI (V1)

**Tabelas V1:**
- `epis` (catálogo global)
- `epi_funcao` (ligação EPI ↔ função)
- `entrega_epis` (fato: pessoa recebe EPI em data)
- `retorno_epis` (devolução)

**Campos V1 observados:**
- epis: id, descricao, ca, periodo_validade_dias, ativo
- epi_funcao: epi_id, funcao_id, obrigatorio
- entrega_epis: id, contrato_id, epi_id, data, qtd, motivo, assinado_url
- retorno_epis: id, entrega_id, data, qtd, motivo

**Operações V1:**
- Manter catálogo EPI
- Vincular EPI a funções (relação M:M)
- Registrar entrega individual (nunca automático)
- Registrar devolução
- Gerar relatório entrega/devolução por pessoa/período
- RDO pode registrar EPI utilizado na atividade

**Ligação RDO V1:**
- RDO.activities[] → pode incluir `epi_id` (EPI utilizado)

### 3.2 V2 RC2 Observado
**Estrutura data.js:**
- `epis`: id, name, ca, validityDays, active
- `epiDeliveries`: id, person, epi, date, qty, reason, signed

**Gaps:**
- [ ] Tela catálogo EPI (CRUD)
- [ ] Vinculação EPI × função (nova tabela/estrutura)
- [ ] Tela entrega de EPI (datepicker, qty, motivo)
- [ ] Tela retorno/devolução
- [ ] Histórico de entrega/devolução por pessoa
- [ ] Validação de validade
- [ ] Relatório EPI
- [ ] Integração RDO para EPI utilizado

---

## 2. ORDEM DE IMPLEMENTAÇÃO

### Fase 2A — Efetivo (básico)

**2A.1 Expandir D.people com campos V1**
```javascript
people: [
  {
    id, name, company, function,
    type (proprio/terceiro),
    admission, discharge (null se ativo),
    status (ativo/inativo),
    // Novos campos V1
    cpf, ctps, pis, cnh, 
    birthDate, phone, address,
    // Dados adicionais array
    documents: [{type, number, validUntil, url}]
  }
]
```

**2A.2 Criar tela Cadastro/Edição Pessoa**
- Form: nome, CPF, CTPS, PIS, CNH, data nasc, telefone, endereço
- Campo empresa (select)
- Campo função (select do catálogo)
- Campo tipo (radio: próprio/terceiro)
- Data admissão (datepicker)
- Documentos adicionais (upload/edit)
- Botão Salvar

**2A.3 Integrar com RDO**
- `rdoPersonOptions()` já funciona
- Testar attendance preenchimento

**2A.4 Teste mínimo**
- Criar pessoa
- Editar dados
- Vincular a RDO
- Verificar attendance preenchido

### Fase 2B — Equipamentos (básico)

**2B.1 Expandir D.equipment**
```javascript
equipment: [
  {
    id, prefix, type, owner, supplier,
    availability, utilization, status,
    // Novos V1
    model, serial, brand, value, acquisitionDate,
    typeEquipment (ref a tipo_equipamento),
    // Histórico alocação
    allocations: [{workId, dateIn, dateOut}]
  }
]
```

**2B.2 Criar tela Equipamentos com abas**
- Tab "Lista": grid com filtros (type, status, owner)
- Tab "Cadastro": form modelo/serial/marca/valor/tipo
- Tab "Alocações": histórico movimento entre obras
- Tab "Manutenção": planejar/registrar manutenção

**2B.3 Testar RDO**
- `rdoEquipmentEditor()` já funciona
- Verificar uso registrado em RDO

### Fase 2C — EPI (iniciado)

**2C.1 Catálogo EPI**
- Tela de CRUD (nome, CA, validade dias, ativo)
- Tabela com filtro

**2C.2 Vinculação EPI × Função**
```javascript
epiFunctionLinks: [
  { epi_id, function_id, required: true/false }
]
```
- Tela: select EPI × Função, checkbox obrigatório
- Preview: quais EPIs são obrigatórios por função

**2C.3 Entrega de EPI**
- Tela entrega: select pessoa, select EPI, qty, data, motivo, checkbox assinado
- Registra em `epiDeliveries`

**2C.4 Retorno EPI**
- Tela retorno: select entrega anterior, qty devolvida, data, motivo

**2C.5 Relatório EPI**
- Por pessoa: quais EPIs tem, datas entrega/validade
- Por EPI: quem recebeu, datas

### Fase 2D — Testes

**2D.1 Testes locais**
```bash
node --check app.js
python3 tests/baseline_check.py
python3 tests/static_check.py
python3 tests/rc_check.py
python3 tests/offline_check.py
node tests/smoke.js
node tests/business_logic.js
```

**2D.2 Browser test**
- Abrir V2 RC2 em navegador
- Testar Efetivo: criar, editar, deletar pessoa
- Testar Equipamentos: criar, editar, alocar obra
- Testar EPI: catálogo, vincular função, entregar, devolver
- Testar RDO: preencher attendance, selecionar equipamento
- Testar relatórios

**2D.3 Regressão**
- RDO continua recuperado
- Nenhum funcionalidade anterior quebrada

---

## 3. DEFINIÇÃO DE PRONTO

- [ ] Tabelas/estruturas V1 identificadas e comparadas
- [ ] Campos V1 adicionados a D.people/D.equipment/epiFunctionLinks
- [ ] Telas de CRUD funcionando (Efetivo, Equipamentos, EPI)
- [ ] Integração RDO confirmada (attendance, equipmentUse)
- [ ] Testes locais PASS
- [ ] Browser test PASS
- [ ] Nenhuma regressão
- [ ] Commit com mensagem clara de gaps recuperados

---

## 4. PRÓXIMAS ETAPAS (após esta)

- Etapa 3: Tarefas + Ocorrências + Alertas
- Etapa 4: NFs + Medições
- Etapa 5: Reuniões + Documentos + Relatórios
- Etapa 6: Regressão transversal
- Etapa 7: Homologação PostgreSQL/Supabase
- Etapa 8: Reavaliar completude

---

## REFERÊNCIAS

- V1 briefing: `/tmp/BUILDLy_Claude_Handoff_V2_2_RC2/01_REFERENCIAS_V1/`
- V2 código: `buildly-v2-rc2/`
- Handoff geral: `00_CONTEXTO/` (checklist, regras, matriz)
