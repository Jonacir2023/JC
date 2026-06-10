import { workflow, trigger, node, expr } from 'n8n-workflow-sdk';

// Workflow: Gestão de Tarefas, Check-ins e Pautas → Obsidian
//
// Fluxo:
//   Webhook POST /gestao-tarefas
//   → Mapeia campos do formulário (inclui Tipo: Tarefa | Checkin | Pauta)
//   → Valida Prioridade (Baixa | Média | Alta)
//   → Valida Setor (Suprimentos | Transporte | Planejamento | Administração | Segurança)
//   → Gera nota Markdown com frontmatter conforme o Tipo
//   → Cria/atualiza arquivo na pasta vault/Tarefas/ via GitHub API
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
            { name: 'tipo',             type: 'string', value: expr('$json.Tipo ?? "Tarefa"') },
            { name: 'assunto',          type: 'string', value: expr('$json.Assunto') },
            { name: 'descricao',        type: 'string', value: expr('$json["Descrição do Assunto"]') },
            { name: 'criador',          type: 'string', value: expr('$json.Criador') },
            { name: 'responsavel',      type: 'string', value: expr('$json.Responsável') },
            { name: 'prioridade',       type: 'string', value: expr('$json.Prioridade') },
            { name: 'setor',            type: 'string', value: expr('$json.Setor') },
            { name: 'data_lancamento',  type: 'string', value: expr('$json["Data de lançamento"]') },
            { name: 'previsao_termino', type: 'string', value: expr('$json["Previsão de Término"]') },
            { name: 'pauta_ref',        type: 'string', value: expr('$json.Pauta ?? ""') },
            { name: 'obra_ref',         type: 'string', value: expr('$json.Obra ?? ""') },
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

  // ── 5. Gerar Markdown conforme o Tipo ───────────────────────
  .to(node({
    type: 'n8n-nodes-base.code',
    version: 2,
    config: {
      parameters: {
        language: 'javaScript',
        jsCode: `
const d = $input.first().json;
const tipo = d.tipo || 'Tarefa';

// Emojis
const prioEmoji = { 'Alta': '🔴', 'Média': '🟡', 'Baixa': '🟢' };
const emoji = prioEmoji[d.prioridade] ?? '⚪';
const tipoEmoji = { 'Tarefa': emoji, 'Checkin': '✅', 'Pauta': '📋' };
const headerEmoji = tipoEmoji[tipo] ?? emoji;

// Prefixo do arquivo por tipo
const tipoPrefix = { 'Tarefa': 'TAREFA', 'Checkin': 'CHECKIN', 'Pauta': 'PAUTA' };
const prefix = tipoPrefix[tipo] ?? 'TAREFA';
const tipoTag = tipo.toLowerCase();

// Prefixo do commit por tipo
const commitPrefixMap = { 'Tarefa': 'tarefa', 'Checkin': 'checkin', 'Pauta': 'pauta' };
const commitPrefix = commitPrefixMap[tipo] ?? 'tarefa';

// Nome seguro para o arquivo (sem caracteres especiais)
const safeName = d.assunto
  .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
  .replace(/[^a-zA-Z0-9 ]/g, '')
  .trim()
  .replace(/\\s+/g, '-')
  .toLowerCase();

const fileName = \`\${prefix}-\${d.id}-\${safeName}.md\`;

const dataLancamento = d.data_lancamento
  ? new Date(d.data_lancamento).toLocaleDateString('pt-BR')
  : '';
const previsaoTermino = d.previsao_termino
  ? new Date(d.previsao_termino).toLocaleDateString('pt-BR')
  : '';

// Seções extras por tipo
const secaoExtra = {
  'Pauta': \`
## Tópicos Discutidos



## Decisões



## Encaminhamentos

- [ ]
\`,
  'Checkin': \`
## Observações


\`,
  'Tarefa': ''
};

const pautaRefFrontmatter = d.pauta_ref ? \`\npauta_ref: "\${d.pauta_ref}"\` : '';
const obraRefFrontmatter = d.obra_ref ? \`\nobra_ref: "\${d.obra_ref}"\` : '';
const pautaRefLinha = d.pauta_ref ? \`| **Pauta de Origem** | [[\${d.pauta_ref}]] |\n\` : '';
const obraRefLinha = d.obra_ref ? \`| **Obra** | \${d.obra_ref} |\n\` : '';

const content = \`---
id: "\${d.id}"
tipo: "\${tipo}"
assunto: "\${d.assunto}"
descricao: "\${d.descricao}"
criador: "\${d.criador}"
responsavel: "\${d.responsavel}"
setor: "\${d.setor}"
prioridade: "\${d.prioridade}"
data_lancamento: "\${d.data_lancamento}"
previsao_termino: "\${d.previsao_termino}"
status: Aberta
criado_em: "\${d.timestamp}"\${pautaRefFrontmatter}\${obraRefFrontmatter}
tags: [\${tipoTag}, \${d.setor.toLowerCase()}, \${d.prioridade.toLowerCase()}]
---

# \${headerEmoji} \${d.assunto}

| Campo | Valor |
|---|---|
| **ID** | \${d.id} |
| **Tipo** | \${tipo} |
| **Setor** | \${d.setor} |
| **Prioridade** | \${emoji} \${d.prioridade} |
| **Criador** | \${d.criador} |
| **Responsável** | \${d.responsavel} |
| **Lançamento** | \${dataLancamento} |
| **Prazo** | \${previsaoTermino} |
\${pautaRefLinha}\${obraRefLinha}
---

## Descrição

\${d.descricao}

---
\${secaoExtra[tipo] ?? ''}

## Anotações



## Histórico

- \${new Date().toLocaleString('pt-BR')} — \${tipo} criado via N8N
\`;

return [{ json: { fileName, content, commitPrefix, ...d } }];
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
              value: expr('`${$json.commitPrefix}: adiciona ${$json.assunto} (${$json.id})`')
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
            { name: 'mensagem', type: 'string', value: expr('`${$json.tipo} "${$json.assunto}" criado no Obsidian com sucesso.`') },
            { name: 'arquivo',  type: 'string', value: expr('$json.fileName') }
          ]
        }
      }
    }
  }));
