import { workflow, trigger, node, expr } from 'n8n-workflow-sdk';

// Workflow: Gestão de Tarefas → Obsidian
//
// Fluxo:
//   Webhook POST /gestao-tarefas
//   → Mapeia campos do formulário
//   → Valida Prioridade (Baixa | Média | Alta)
//   → Valida Setor (Suprimentos | Transporte | Planejamento | Administração | Segurança)
//   → Gera nota Markdown com frontmatter
//   → Cria arquivo na pasta vault/Tarefas/ via GitHub API
//   → Retorna confirmação

export default workflow('gestao-tarefas-obsidian', 'Gestão de Tarefas → Obsidian')

  // ── 1. Webhook ─────────────────────────────────────────────
  .add(trigger({
    type: 'n8n-nodes-base.webhook',
    version: 2,
    config: {
      parameters: {
        path: 'gestao-tarefas',
        method: 'POST',
        responseMode: 'lastNode',
        authenticationMethod: 'none'
      }
    }
  }))

  // ── 2. Mapear campos ────────────────────────────────────────
  .to(node({
    type: 'n8n-nodes-base.set',
    version: 3,
    config: {
      parameters: {
        mode: 'manual',
        assignments: {
          assignments: [
            { name: 'id',               type: 'string', value: expr('$json.Id') },
            { name: 'assunto',          type: 'string', value: expr('$json.Assunto') },
            { name: 'descricao',        type: 'string', value: expr('$json["Descrição do Assunto"]') },
            { name: 'criador',          type: 'string', value: expr('$json.Criador') },
            { name: 'responsavel',      type: 'string', value: expr('$json.Responsável') },
            { name: 'prioridade',       type: 'string', value: expr('$json.Prioridade') },
            { name: 'setor',            type: 'string', value: expr('$json.Setor') },
            { name: 'data_lancamento',  type: 'string', value: expr('$json["Data de lançamento"]') },
            { name: 'previsao_termino', type: 'string', value: expr('$json["Previsão de Término"]') },
            { name: 'timestamp',        type: 'string', value: expr('new Date().toISOString()') }
          ]
        }
      }
    }
  }))

  // ── 3. Validar Prioridade ───────────────────────────────────
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

  // ── 4. Validar Setor ────────────────────────────────────────
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

  // ── 5. Gerar Markdown ───────────────────────────────────────
  .to(node({
    type: 'n8n-nodes-base.code',
    version: 2,
    config: {
      parameters: {
        language: 'javaScript',
        jsCode: `
const d = $input.first().json;

// Emoji de prioridade
const prioEmoji = { 'Alta': '🔴', 'Média': '🟡', 'Baixa': '🟢' };
const emoji = prioEmoji[d.prioridade] ?? '⚪';

// Nome seguro para o arquivo (sem caracteres especiais)
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

- \${new Date().toLocaleString('pt-BR')} — Tarefa criada via N8N
\`;

return [{ json: { fileName, content, ...d } }];
        `
      }
    }
  }))

  // ── 6. Criar arquivo no GitHub (vault/Tarefas/) ─────────────
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

  // ── 7. Resposta de sucesso ──────────────────────────────────
  .to(node({
    type: 'n8n-nodes-base.set',
    version: 3,
    config: {
      parameters: {
        mode: 'manual',
        assignments: {
          assignments: [
            { name: 'status',   type: 'string', value: 'ok' },
            { name: 'mensagem', type: 'string', value: expr('`Tarefa "${$json.assunto}" criada no Obsidian com sucesso.`') },
            { name: 'arquivo',  type: 'string', value: expr('$json.fileName') }
          ]
        }
      }
    }
  }));
