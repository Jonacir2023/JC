import { workflow, trigger, node, ifElse, expr } from '@n8n/workflow-sdk';

// Workflow: Diário de Obras → Obsidian + Supabase
//
// Fluxo:
//   Webhook POST /diario-obras
//   → Mapeia campos do formulário
//   → Valida Setor (Suprimentos | Transporte | Planejamento | Administração | Segurança)
//   → Gera nota Markdown com frontmatter
//   → Salva registro na tabela diario_obras no Supabase (projeto: checkin)
//   → Cria arquivo na pasta vault/Diário/ via GitHub API
//   → Retorna confirmação
//
// Supabase: https://hvaiqfbtgumxygdsnqgl.supabase.co
// N8N ID: 7MyFcPWeBvE2LaGz

const SUPABASE_URL = 'https://hvaiqfbtgumxygdsnqgl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2YWlxZmJ0Z3VteHlnZHNucWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwOTc1NDksImV4cCI6MjA5NTY3MzU0OX0.uZmExUIYrewqw11PZp7dxFwhw2iBgn2pDAzw5yp25XI';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2,
  config: {
    name: 'Webhook',
    parameters: {
      path: 'diario-obras',
      method: 'POST',
      responseMode: 'lastNode',
      authenticationMethod: 'none'
    }
  }
});

const mapearCampos = node({
  type: 'n8n-nodes-base.set',
  version: 3,
  config: {
    name: 'Mapear Campos',
    parameters: {
      mode: 'manual',
      assignments: {
        assignments: [
          { name: 'data',        type: 'string', value: expr('$json.Data') },
          { name: 'obra',        type: 'string', value: expr('$json.Obra') },
          { name: 'responsavel', type: 'string', value: expr('$json.Responsável') },
          { name: 'setor',       type: 'string', value: expr('$json.Setor') },
          { name: 'clima',       type: 'string', value: expr('$json.Clima ?? ""') },
          { name: 'efetivo',     type: 'number', value: expr('$json.Efetivo ?? 0') },
          { name: 'atividades',  type: 'string', value: expr('$json.Atividades ?? ""') },
          { name: 'materiais',   type: 'string', value: expr('$json.Materiais ?? ""') },
          { name: 'ocorrencias', type: 'string', value: expr('$json["Ocorrências"] ?? ""') },
          { name: 'status',      type: 'string', value: expr('$json.Status ?? "Aberto"') },
          { name: 'observacoes', type: 'string', value: expr('$json["Observações"] ?? ""') },
          { name: 'timestamp',   type: 'string', value: expr('new Date().toISOString()') }
        ]
      }
    }
  }
});

const validarSetor = ifElse({
  version: 2.2,
  config: {
    name: 'Validar Setor',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [
          { leftValue: expr('$json.setor'), operator: { type: 'string', operation: 'equals' }, rightValue: 'Suprimentos' },
          { leftValue: expr('$json.setor'), operator: { type: 'string', operation: 'equals' }, rightValue: 'Transporte' },
          { leftValue: expr('$json.setor'), operator: { type: 'string', operation: 'equals' }, rightValue: 'Planejamento' },
          { leftValue: expr('$json.setor'), operator: { type: 'string', operation: 'equals' }, rightValue: 'Administração' },
          { leftValue: expr('$json.setor'), operator: { type: 'string', operation: 'equals' }, rightValue: 'Segurança' }
        ],
        combinator: 'or'
      }
    }
  }
});

const gerarConteudo = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Gerar Conteúdo',
    parameters: {
      language: 'javaScript',
      jsCode: `
const d = $input.first().json;

const climaEmoji = { 'Ensolarado': '☀️', 'Nublado': '☁️', 'Chuvoso': '🌧️', 'Parcialmente Nublado': '⛅' };
const statusEmoji = { 'Aberto': '🟡', 'Em Andamento': '🔵', 'Concluído': '✅' };
const climaIcon = climaEmoji[d.clima] || '🌡️';
const statusIcon = statusEmoji[d.status] || '⚪';

const safeObra = (d.obra || 'obra')
  .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
  .replace(/[^a-zA-Z0-9 ]/g, '')
  .trim()
  .replace(/\\s+/g, '-')
  .toLowerCase();

const fileDate = d.data || new Date().toISOString().split('T')[0];
const fileName = \`DIARIO-\${fileDate}-\${safeObra}.md\`;

const dataFormatada = d.data
  ? new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR')
  : new Date().toLocaleDateString('pt-BR');

const content = \`---
data: "\${d.data}"
obra: "\${d.obra}"
responsavel: "\${d.responsavel}"
setor: "\${d.setor}"
clima: "\${d.clima}"
efetivo: \${d.efetivo}
status: "\${d.status}"
criado_em: "\${d.timestamp}"
tags: [diário, obras]
---

# 📋 Diário de Obras — \${d.obra}

**Data:** \${dataFormatada}
**Responsável:** \${d.responsavel}
**Setor:** \${d.setor}
**Clima:** \${climaIcon} \${d.clima}
**Efetivo:** \${d.efetivo} colaboradores
**Status:** \${statusIcon} \${d.status}

---

## Atividades Realizadas

\${d.atividades || '_(sem registro)_'}

---

## Materiais Utilizados

\${d.materiais || '_(sem registro)_'}

---

## Ocorrências

\${d.ocorrencias || '_(nenhuma ocorrência)_'}

---

## Observações

\${d.observacoes || '_(sem observações)_'}

---

## Outros Registros desta Obra

\`\`\`dataview
TABLE data, responsavel, status, clima
FROM "Diário"
WHERE obra = "\${d.obra}" AND file.name != this.file.name
SORT data DESC
\`\`\`

---

## Check-ins desta Obra

\`\`\`dataview
TABLE data_lancamento AS "Data", responsavel, status, assunto
FROM "Tarefas"
WHERE tipo = "Checkin" AND obra_ref = "\${d.obra}"
SORT data_lancamento DESC
\`\`\`

## Histórico

- \${new Date().toLocaleString('pt-BR')} — Diário criado via N8N
\`;

return [{ json: { fileName, content, ...d } }];
      `
    }
  }
});

const salvarSupabase = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4,
  config: {
    name: 'Salvar no Supabase',
    parameters: {
      method: 'POST',
      url: `${SUPABASE_URL}/rest/v1/diario_obras`,
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'apikey',        value: SUPABASE_KEY },
          { name: 'Authorization', value: `Bearer ${SUPABASE_KEY}` },
          { name: 'Content-Type',  value: 'application/json' },
          { name: 'Prefer',        value: 'return=representation' }
        ]
      },
      sendBody: true,
      bodyContentType: 'json',
      bodyParameters: {
        parameters: [
          { name: 'data',        value: expr('$json.data') },
          { name: 'obra',        value: expr('$json.obra') },
          { name: 'responsavel', value: expr('$json.responsavel') },
          { name: 'setor',       value: expr('$json.setor') },
          { name: 'clima',       value: expr('$json.clima') },
          { name: 'efetivo',     value: expr('$json.efetivo') },
          { name: 'atividades',  value: expr('$json.atividades') },
          { name: 'materiais',   value: expr('$json.materiais') },
          { name: 'ocorrencias', value: expr('$json.ocorrencias') },
          { name: 'status',      value: expr('$json.status') },
          { name: 'observacoes', value: expr('$json.observacoes') }
        ]
      },
      options: { response: { response: { responseFormat: 'json' } } }
    }
  }
});

const criarArquivoGitHub = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4,
  config: {
    name: 'Criar Arquivo no GitHub',
    parameters: {
      method: 'PUT',
      url: expr('`https://api.github.com/repos/Jonacir2023/JC/contents/vault/Di%C3%A1rio/${$json.fileName}`'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Accept',               value: 'application/vnd.github+json' },
          { name: 'X-GitHub-Api-Version', value: '2022-11-28' }
        ]
      },
      sendBody: true,
      bodyContentType: 'json',
      bodyParameters: {
        parameters: [
          { name: 'message', value: expr('`diário: adiciona ${$json.obra} (${$json.data})`') },
          { name: 'content', value: expr('Buffer.from($json.content).toString("base64")') }
        ]
      },
      options: { response: { response: { responseFormat: 'json' } } }
    }
  }
});

const respostaSucesso = node({
  type: 'n8n-nodes-base.set',
  version: 3,
  config: {
    name: 'Resposta de Sucesso',
    parameters: {
      mode: 'manual',
      assignments: {
        assignments: [
          { name: 'status',   type: 'string', value: 'ok' },
          { name: 'mensagem', type: 'string', value: expr('`Diário de "${$json.obra}" registrado com sucesso.`') },
          { name: 'arquivo',  type: 'string', value: expr('$json.fileName') }
        ]
      }
    }
  }
});

const erroSetor = node({
  type: 'n8n-nodes-base.set',
  version: 3,
  config: {
    name: 'Erro Setor Inválido',
    parameters: {
      mode: 'manual',
      assignments: {
        assignments: [
          { name: 'status',   type: 'string', value: 'erro' },
          { name: 'mensagem', type: 'string', value: expr('`Setor inválido: "${$json.setor}". Use: Suprimentos, Transporte, Planejamento, Administração ou Segurança.`') }
        ]
      }
    }
  }
});

export default workflow('diario-obras-obsidian', 'Diário de Obras → Obsidian + Supabase')
  .add(webhookTrigger)
  .to(mapearCampos)
  .to(validarSetor
    .onTrue(gerarConteudo
      .to(salvarSupabase)
      .to(criarArquivoGitHub)
      .to(respostaSucesso))
    .onFalse(erroSetor));
