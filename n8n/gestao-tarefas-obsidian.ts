import { workflow, trigger, node, expr } from 'n8n-workflow-sdk';

// Workflow: Gestão de Tarefas → Obsidian
//
// Fluxo:
//   FormTrigger (URL compartilhada — abre no celular)
//   → Gera ID sequencial automático (Static Data — persiste entre execuções)
//   → Mapeia campos do formulário
//   → Valida Prioridade (Baixa | Média | Alta)
//   → Valida Setor (Suprimentos | Transporte | Planejamento | Administração | Segurança)
//   → Gera nota Markdown com frontmatter
//   → Cria arquivo na pasta vault/Tarefas/ via GitHub API
//   → Retorna confirmação na tela do formulário

export default workflow('gestao-tarefas-obsidian', 'Gestão de Tarefas → Obsidian')

  // ── 1. Formulário (acessível por URL no celular) ────────────
  .add(trigger({
    type: 'n8n-nodes-base.formTrigger',
    version: 2,
    config: {
      parameters: {
        formTitle: 'Nova Tarefa',
        formDescription: 'Preencha os dados para registrar uma tarefa.',
        responseMode: 'lastNode',
        formFields: {
          values: [
            {
              fieldLabel: 'Assunto',
              fieldType: 'text',
              requiredField: true,
              placeholder: 'Título curto da tarefa'
            },
            {
              fieldLabel: 'Descricao',
              fieldType: 'textarea',
              requiredField: false,
              placeholder: 'Descreva a tarefa com detalhes'
            },
            {
              fieldLabel: 'Criador',
              fieldType: 'text',
              requiredField: true,
              placeholder: 'Seu nome completo'
            },
            {
              fieldLabel: 'Responsavel',
              fieldType: 'text',
              requiredField: true,
              placeholder: 'Nome do responsável pela execução'
            },
            {
              fieldLabel: 'Prioridade',
              fieldType: 'dropdown',
              requiredField: true,
              fieldOptions: {
                values: [
                  { option: 'Alta' },
                  { option: 'Média' },
                  { option: 'Baixa' }
                ]
              }
            },
            {
              fieldLabel: 'Setor',
              fieldType: 'dropdown',
              requiredField: true,
              fieldOptions: {
                values: [
                  { option: 'Suprimentos' },
                  { option: 'Transporte' },
                  { option: 'Planejamento' },
                  { option: 'Administração' },
                  { option: 'Segurança' }
                ]
              }
            },
            {
              fieldLabel: 'DataLancamento',
              fieldType: 'date',
              requiredField: true
            },
            {
              fieldLabel: 'PrevisaoTermino',
              fieldType: 'date',
              requiredField: true
            }
          ]
        }
      }
    }
  }))

  // ── 2. Gerar ID sequencial automático (Static Data) ─────────
  // Static Data persiste no banco do n8n entre execuções.
  // Sem race condition relevante para uso sequencial de formulário.
  .to(node({
    type: 'n8n-nodes-base.code',
    version: 2,
    config: {
      parameters: {
        language: 'javaScript',
        jsCode: `
const staticData = $getWorkflowStaticData('global');
if (!staticData.lastId) staticData.lastId = 0;
staticData.lastId += 1;

const item = $input.first().json;
return [{ json: { ...item, id: String(staticData.lastId) } }];
        `
      }
    }
  }))

  // ── 3. Mapear campos ────────────────────────────────────────
  .to(node({
    type: 'n8n-nodes-base.set',
    version: 3,
    config: {
      parameters: {
        mode: 'manual',
        assignments: {
          assignments: [
            { name: 'id',               type: 'string', value: expr('$json.id') },
            { name: 'assunto',          type: 'string', value: expr('$json.Assunto') },
            { name: 'descricao',        type: 'string', value: expr('$json.Descricao') },
            { name: 'criador',          type: 'string', value: expr('$json.Criador') },
            { name: 'responsavel',      type: 'string', value: expr('$json.Responsavel') },
            { name: 'prioridade',       type: 'string', value: expr('$json.Prioridade') },
            { name: 'setor',            type: 'string', value: expr('$json.Setor') },
            { name: 'data_lancamento',  type: 'string', value: expr('$json.DataLancamento') },
            { name: 'previsao_termino', type: 'string', value: expr('$json.PrevisaoTermino') },
            { name: 'timestamp',        type: 'string', value: expr('new Date().toISOString()') }
          ]
        }
      }
    }
  }))

  // ── 4. Validar Prioridade ───────────────────────────────────
  .to(node({
    type: 'n8n-nodes-base.if',
    version: 2,
    config: {
      parameters: {
        conditions: {
          conditions: [
            { operator: { type: 'string', operation: 'equals' }, value1: expr('$json.prioridade'), value2: 'Baixa' },
            { operator: { type: 'string', operation: 'equals' }, value1: expr('$json.prioridade'), value2: 'Média' },
            { operator: { type: 'string', operation: 'equals' }, value1: expr('$json.prioridade'), value2: 'Alta' }
          ],
          combinator: 'or',
          options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }
        }
      }
    }
  }))

  // ── 5. Validar Setor ────────────────────────────────────────
  .to(node({
    type: 'n8n-nodes-base.if',
    version: 2,
    config: {
      parameters: {
        conditions: {
          conditions: [
            { operator: { type: 'string', operation: 'equals' }, value1: expr('$json.setor'), value2: 'Suprimentos' },
            { operator: { type: 'string', operation: 'equals' }, value1: expr('$json.setor'), value2: 'Transporte' },
            { operator: { type: 'string', operation: 'equals' }, value1: expr('$json.setor'), value2: 'Planejamento' },
            { operator: { type: 'string', operation: 'equals' }, value1: expr('$json.setor'), value2: 'Administração' },
            { operator: { type: 'string', operation: 'equals' }, value1: expr('$json.setor'), value2: 'Segurança' }
          ],
          combinator: 'or',
          options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }
        }
      }
    }
  }))

  // ── 6. Gerar Markdown ───────────────────────────────────────
  .to(node({
    type: 'n8n-nodes-base.code',
    version: 2,
    config: {
      parameters: {
        language: 'javaScript',
        jsCode: `
const d = $input.first().json;

const prioEmoji = { 'Alta': '🔴', 'Média': '🟡', 'Baixa': '🟢' };
const emoji = prioEmoji[d.prioridade] ?? '⚪';

const safeName = d.assunto
  .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
  .replace(/[^a-zA-Z0-9 ]/g, '')
  .trim()
  .replace(/\\s+/g, '-')
  .toLowerCase();

const fileName = \`TAREFA-\${d.id}-\${safeName}.md\`;

const dataLancamento = d.data_lancamento
  ? new Date(d.data_lancamento).toLocaleDateString('pt-BR')
  : '';
const previsaoTermino = d.previsao_termino
  ? new Date(d.previsao_termino).toLocaleDateString('pt-BR')
  : '';

const content = \`---
id: "\${d.id}"
assunto: "\${d.assunto}"
descricao: "\${d.descricao}"
criador: "\${d.criador}"
responsavel: "\${d.responsavel}"
setor: "\${d.setor}"
prioridade: "\${d.prioridade}"
data_lancamento: "\${d.data_lancamento}"
previsao_termino: "\${d.previsao_termino}"
status: Aberta
criado_em: "\${d.timestamp}"
tags: [tarefa, \${d.setor.toLowerCase()}, \${d.prioridade.toLowerCase()}]
---

# \${emoji} \${d.assunto}

| Campo | Valor |
|---|---|
| **ID** | \${d.id} |
| **Setor** | \${d.setor} |
| **Prioridade** | \${emoji} \${d.prioridade} |
| **Criador** | \${d.criador} |
| **Responsável** | \${d.responsavel} |
| **Lançamento** | \${dataLancamento} |
| **Prazo** | \${previsaoTermino} |

---

## Descrição

\${d.descricao}

---

## Anotações



## Histórico

- \${new Date().toLocaleString('pt-BR')} — Tarefa criada via Formulário N8N
\`;

return [{ json: { fileName, content, ...d } }];
        `
      }
    }
  }))

  // ── 7. Criar arquivo no GitHub (vault/Tarefas/) ─────────────
  .to(node({
    type: 'n8n-nodes-base.httpRequest',
    version: 4,
    config: {
      parameters: {
        method: 'PUT',
        url: expr('`https://api.github.com/repos/Jonacir2023/JC/contents/vault/Tarefas/${$json.fileName}`'),
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'Accept',               value: 'application/vnd.github+json' },
            { name: 'X-GitHub-Api-Version', value: '2022-11-28' },
            { name: 'Authorization',         value: expr('`Bearer ${$credentials.githubToken}`') }
          ]
        },
        sendBody: true,
        bodyContentType: 'json',
        bodyParameters: {
          parameters: [
            {
              name: 'message',
              value: expr('`tarefa: adiciona ${$json.assunto} (${$json.id})`')
            },
            {
              name: 'content',
              value: expr('Buffer.from($json.content).toString("base64")')
            }
          ]
        },
        options: { response: { response: { responseFormat: 'json' } } }
      }
    }
  }))

  // ── 8. Resposta exibida no formulário ───────────────────────
  .to(node({
    type: 'n8n-nodes-base.set',
    version: 3,
    config: {
      parameters: {
        mode: 'manual',
        assignments: {
          assignments: [
            { name: 'status',   type: 'string', value: 'ok' },
            { name: 'mensagem', type: 'string', value: expr('`✅ Tarefa #${$json.id} — "${$json.assunto}" registrada com sucesso!`') },
            { name: 'arquivo',  type: 'string', value: expr('$json.fileName') }
          ]
        }
      }
    }
  }));
