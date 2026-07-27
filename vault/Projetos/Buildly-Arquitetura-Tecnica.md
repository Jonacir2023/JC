---
id: "buildly-arch-001"
tipo: "Nota"
assunto: "Buildly - Arquitetura Técnica e Estrutura"
descricao: "Documentação técnica da estrutura do projeto Buildly com 20 campos operacionais"
status: "Ativo"
criado_em: "2026-07-19T00:00:00Z"
tags: [buildly, arquitetura, desenvolvimento, técnico]
---

# 🏗️ Buildly - Arquitetura Técnica

## 📊 Estrutura do Projeto

```
/workspace/buildly/
│
├── index.html                                    # Shell HTML principal
├── CLAUDE.md                                     # Documentação do projeto
│
├── js/
│   ├── app.js                                    # Roteamento e shell base
│   ├── supabase-client.js                        # Cliente Supabase
│   ├── vendor/supabase.js                        # Biblioteca Supabase JS
│   └── modulos/
│       ├── equipes.js                            # ✅ MODIFICADO - Gestão de Equipes (20 campos)
│       ├── efetivo.js                            # Presença diária
│       ├── rdo.js                                # Diário de Obras
│       └── rdo-dashboard.js                      # Dashboard RDO
│
├── css/
│   └── styles.css                                # ✅ MODIFICADO - Estilos (tema claro/escuro)
│
├── supabase/
│   └── migrations/
│       ├── 0001_schema_inicial.sql               # Schema inicial (28 tabelas)
│       ├── 0002_rls_autenticado.sql              # RLS policies
│       ├── 0003_seed_obra_inicial.sql            # Dados iniciais
│       └── 0004_expand_colaborador_operacional.sql  # ✅ NOVO - Expansão de colaborador
│
└── [outros arquivos]
```

---

## 🗄️ Mudanças no Banco de Dados

### Migration: `0004_expand_colaborador_operacional.sql`

**Criada:** 2026-07-19
**Commit:** `67db85a`

#### ENUM Types Criados (6)

```sql
-- Situação do colaborador
create type situacao_enum as enum ('ativo', 'inativo', 'afastado', 'licença');

-- Tipo de mão de obra
create type tipo_mao_obra_enum as enum ('moi', 'mod', 'terceirizado');

-- Sexo
create type sexo_enum as enum ('masculino', 'feminino', 'não_informado');

-- Estado/UF (27 estados + DF)
create type estado_enum as enum ('AC', 'AL', 'AP', ... 'TO');

-- Status de mobilização
create type status_mobilizacao_enum as enum 
  ('não_iniciado', 'em_progresso', 'concluído', 'cancelado');

-- Status de alojamento
create type status_alojamento_enum as enum 
  ('não_necessário', 'necessário', 'fornecido', 'recusado');
```

#### Colunas Adicionadas à Tabela `colaborador` (20)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `matricula` | INTEGER UNIQUE | Número de matrícula |
| `data_admissao` | DATE | Data de admissão |
| `data_demissao` | DATE | Data de demissão |
| `situacao` | situacao_enum | Situação atual |
| `cargo` | TEXT | Cargo operacional |
| `tipo_mao_obra` | tipo_mao_obra_enum | Tipo de mão de obra |
| `estabilidade` | TEXT | Status de estabilidade |
| `cidade` | TEXT | Cidade de trabalho |
| `estado` | estado_enum | Estado/UF |
| `sexo` | sexo_enum | Sexo |
| `local_registro` | TEXT | Local de registro |
| `status_mobilizacao` | status_mobilizacao_enum | Status mobilização |
| `data_termino_exp1` | DATE | Término 1ª experiência |
| `data_termino_exp2` | DATE | Término 2ª experiência |
| `status_alojamento` | status_alojamento_enum | Status alojamento |
| `eng_responsavel_id` | UUID | FK - Engenheiro responsável |
| `supervisor_id` | UUID | FK - Supervisor (auto-ref) |
| `frente_servico` | TEXT | Frente de serviço |
| `atualizado_em` | TIMESTAMPTZ | Timestamp atualização |

#### Índices Criados (6)

```sql
-- Performance para buscas comuns
CREATE INDEX idx_colaborador_empresa ON colaborador(empresa);
CREATE INDEX idx_colaborador_situacao ON colaborador(situacao);
CREATE INDEX idx_colaborador_frente_servico ON colaborador(frente_servico);
CREATE INDEX idx_colaborador_supervisor ON colaborador(supervisor_id);
CREATE INDEX idx_colaborador_matricula ON colaborador(matricula);
CREATE INDEX idx_colaborador_mobilizacao ON colaborador(status_mobilizacao);
```

#### Foreign Keys

```sql
-- Supervisor é referência a outro colaborador (auto-referência)
ALTER TABLE colaborador
  ADD CONSTRAINT fk_supervisor
  FOREIGN KEY (supervisor_id)
  REFERENCES colaborador(id) ON DELETE SET NULL;
```

---

## 🎨 Mudanças no Frontend

### Módulo: `js/modulos/equipes.js`

**Modificação:** 2026-07-19
**Linhas Originais:** 73
**Linhas Novas:** 392
**Commit:** `7b53f50`

#### Principais Mudanças

1. **Modal de Formulário**
   - Modal dinâmico com 3 abas
   - Reutilizado para novo e editar
   - Transições suaves entre abas

2. **Estrutura de Abas**
   ```
   📋 Dados Pessoais (7 campos)
   └─ matricula, nome, sexo, cidade, estado, cargo, empresa
   
   📅 Temporal (5 campos)
   └─ admissao, demissao, termino_exp1, termino_exp2, estabilidade
   
   🏗️ Operacional (8 campos)
   └─ situacao, mao_obra, frente, local_registro, mobilizacao, alojamento
   ```

3. **Funcionalidades Implementadas**

   | Ação | Função | Status |
   |------|--------|--------|
   | Novo Colaborador | `renderModuloEquipes()` | ✅ |
   | Editar | `abrirFormularioEdicao()` | ✅ |
   | Ver Detalhes | `mostrarDetalhes()` | ✅ |
   | Remover | `removerColaborador()` | ✅ |
   | Salvar (INSERT/UPDATE) | `salvarColaborador()` | ✅ |
   | Validações | Obrigatoriedade, datas | ✅ |

4. **Tabela de Colaboradores**
   - Colunas: Matrícula, Nome, Empresa, Cargo, Frente, Situação, Ações
   - Responsiva e estilizada
   - Hovering effect nas linhas

### Estilos: `css/styles.css`

**Adicionados:** 250+ linhas
**Commit:** `7b53f50`

#### Classes CSS Novas

```css
/* Modal */
.modal, .modal-content, .modal-header, .modal-body, .modal-footer

/* Abas */
.tabs, .tab-btn, .tab-btn.active, .tab-content, .tab-content.active

/* Formulário */
.form-group, .form-control, .form-control:focus

/* Tabela */
.tabela-colaboradores, .tabela-colaboradores thead, .tabela-colaboradores td
.badge-success, .badge-warning

/* Botões */
.btn-sm, .btn-sm.btn-info, .btn-sm.btn-danger, .btn-sm.btn-secondary
.btn-primary, .btn-secondary
```

#### Características de Estilo

- ✅ Tema claro/escuro (suportado via CSS vars)
- ✅ Responsivo (mobile-friendly)
- ✅ Acessibilidade (focus states, contrast)
- ✅ Transições suaves

---

## 📡 Fluxo de Dados

```
Usuário
   ↓
[Formulário Modal] (3 abas)
   ↓
[Validação Client-Side] (nome obrigatório, datas)
   ↓
[Supabase JS Client]
   ↓
[PostgreSQL Database]
   ├─ Insert nova linha (novo colaborador)
   └─ Update linha existente (editar)
   ↓
[Re-render da Lista] (tabela com 7 colunas)
```

---

## 🧪 Testes Necessários

### Testes Manuais (Fase 5)

- [ ] Form novo: preencher todos 20 campos → verificar INSERT
- [ ] Form novo: preencher apenas obrigatórios → verificar INSERT
- [ ] Form editar: carregar dados → modificar → verificar UPDATE
- [ ] Validação: deixar Nome vazio → deve bloquear
- [ ] Validação: data demissão < admissão → deve bloquear
- [ ] Matrícula: inserir duplicada → deve validar no DB
- [ ] Remover: clicar remover → confirmar → verificar DELETE
- [ ] Detalhes: ver modal com 20 campos
- [ ] Tabela: verificar ordem alfabética por nome
- [ ] Tema: alternar claro/escuro → estilos consistentes

### Testes de Integração

- [ ] Efetivo.js continua funcionando (usa colaborador)
- [ ] RDO continua funcionando (usa colaborador como responsavel)
- [ ] Export de dados (se houver)

---

## 🔗 Dependências

### Frontend

- **Supabase JS Client** — `js/vendor/supabase.js`
- **CSS Grid/Flexbox** — Nativo (sem frameworks)
- **Vanilla JavaScript** — ES6+

### Backend

- **PostgreSQL** — Supabase
- **Supabase RLS** — Row Level Security (MVP: authenticated full access)

### Sem Dependências Adicionais

- ✅ Sem npm/bundler
- ✅ Sem jQuery
- ✅ Sem React/Vue/Angular
- ✅ Sem TypeScript

---

## 🚀 Deploy

### Ambiente Local

```bash
# 1. Clone repositório
git clone https://github.com/jonacir2023/buildly /workspace/buildly

# 2. Aplicar migrations no Supabase
# (via Supabase dashboard ou CLI)

# 3. Abrir no navegador
open https://jonacir2023.github.io/buildly/
```

### GitHub Pages

- **Branch:** `main`
- **Pasta:** `/` (raiz)
- **URL:** https://jonacir2023.github.io/buildly/
- **Auto-deploy:** A cada push para `main`

---

## 📋 Checklist de Implementação

- [x] Fase 1: Database Migration (ENUMs, colunas, índices)
- [x] Fase 3: Frontend Form (modal, abas, handlers)
- [ ] Fase 2: Backend API (se necessário - pode usar Supabase JS client)
- [ ] Fase 4: List View (melhorias adicionais)
- [ ] Fase 5: Testes Integrados
- [ ] Fase 6: Documentação Final

---

## 📞 Referências

- **Projeto:** [[Buildly-Expansao-Colaborador]]
- **GitHub:** https://github.com/jonacir2023/buildly
- **Supabase:** hvaiqfbtgumxygdsnqgl.supabase.co
- **Site ao Vivo:** https://jonacir2023.github.io/buildly/

