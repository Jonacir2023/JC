import { workflow, trigger, node, expr } from 'n8n-workflow-sdk';

// Workflow: Atualiza Status de Tarefa
//
// Chamado pelo Kanban via POST /atualiza-status
// Body: { arquivo: "TAREFA-1-nome.md", novoStatus: "Em Andamento" | "Concluída" | "Aberta" }
//
// Fluxo:
//   Webhook POST /atualiza-status (CORS aberto)
//   → Busca arquivo atual no GitHub (precisa do SHA para o PUT)
//   → Code: atualiza frontmatter status + adiciona entrada no histórico
//   → Salva arquivo atualizado no GitHub
//   → Retorna confirmação ao Kanban

export default workflow('atualiza-status-tarefa', 'Atualiza Status de Tarefa → Obsidian')

  // ── 1. Webhook (aceita chamadas do Kanban pelo browser) ─────
  .add(trigger({
    type: 'n8n-nodes-base.webhook',
    version: 2,
    config: {
      parameters: {
        path: 'atualiza-status',
        method: 'POST',
        responseMode: 'lastNode',
        options: {
          allowedOrigins: '*'
        }
      }
    }
  }))

  // ── 2. Buscar arquivo no GitHub (necessário para obter SHA) ──
  // URL usa $json.body.arquivo do webhook
  .to(node({
    type: 'n8n-nodes-base.httpRequest',
    version: 4,
    config: {
      parameters: {
        method: 'GET',
        url: expr('`https://api.github.com/repos/Jonacir2023/JC/contents/vault/Tarefas/${$json.body.arquivo}`'),
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
        options: { response: { response: { responseFormat: 'json' } } }
      }
    }
  }))

  // ── 3. Atualizar status no frontmatter ──────────────────────
  // Acessa dados do webhook via $('Webhook') — nome padrão do trigger no n8n.
  // Se o nó trigger receber outro nome, ajuste a referência aqui.
  .to(node({
    type: 'n8n-nodes-base.code',
    version: 2,
    config: {
      parameters: {
        language: 'javaScript',
        jsCode: `
const fileData   = $input.first().json;
const body       = $('Webhook').first().json.body;
const arquivo    = body.arquivo;
const novoStatus = body.novoStatus;

// Decodifica o conteúdo base64 do GitHub
const content = Buffer.from(fileData.content.replace(/\\n/g, ''), 'base64').toString('utf-8');

// Substitui a linha de status no frontmatter
const updated = content.replace(/^status:.*$/m, \`status: \${novoStatus}\`);

// Adiciona linha no histórico
const historyLine = \`- \${new Date().toLocaleString('pt-BR')} — Status alterado para "\${novoStatus}"\`;
const withHistory = updated.replace(
  /(## Histórico\\s*\\n)/,
  \`$1\${historyLine}\\n\`
);

return [{
  json: {
    arquivo,
    novoStatus,
    sha:          fileData.sha,
    novoConteudo: Buffer.from(withHistory).toString('base64')
  }
}];
        `
      }
    }
  }))

  // ── 4. Salvar arquivo atualizado no GitHub ──────────────────
  .to(node({
    type: 'n8n-nodes-base.httpRequest',
    version: 4,
    config: {
      parameters: {
        method: 'PUT',
        url: expr('`https://api.github.com/repos/Jonacir2023/JC/contents/vault/Tarefas/${$json.arquivo}`'),
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
            { name: 'message', value: expr('`status: ${$json.arquivo} → ${$json.novoStatus}`') },
            { name: 'content', value: expr('$json.novoConteudo') },
            { name: 'sha',     value: expr('$json.sha') }
          ]
        },
        options: { response: { response: { responseFormat: 'json' } } }
      }
    }
  }))

  // ── 5. Resposta para o Kanban ───────────────────────────────
  .to(node({
    type: 'n8n-nodes-base.set',
    version: 3,
    config: {
      parameters: {
        mode: 'manual',
        assignments: {
          assignments: [
            { name: 'ok',       type: 'boolean', value: 'true' },
            { name: 'mensagem', type: 'string',  value: expr('`Status atualizado para "${$json.novoStatus}"`') }
          ]
        }
      }
    }
  }));
