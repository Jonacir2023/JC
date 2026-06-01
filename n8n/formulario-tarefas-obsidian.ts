import { workflow, trigger, node, newCredential, expr } from '@n8n/workflow-sdk';

// Workflow: Formulário de Tarefas → Obsidian  (ID: Gd1NFdWTxZHXNPYR)
//
// URL pública do formulário (produção):
//   https://jonacircazelli.app.n8n.cloud/form/nova-tarefa
//
// Fluxo:
//   FormTrigger (formulário hospedado no n8n.cloud)
//   → Code (gera nota .md com frontmatter + base64 + todos os campos)
//   → HTTP PUT (salva arquivo em vault/Tarefas/ via GitHub API)
//   → Google Sheets (append row na planilha de tarefas)
//   → Form Completion (exibe mensagem de sucesso ao usuário)
//
// Configuração necessária no N8N:
//   1. Nó "Salvar no GitHub" → credencial Bearer Auth com o token GitHub
//   2. Nó "Salvar na Planilha" → credencial Google Sheets OAuth2 + URL da planilha
//      Colunas da planilha: ID | Assunto | Descrição | Criador | Responsável |
//                           Setor | Prioridade | Data de Lançamento | Previsão de Término |
//                           Status | Criado em

const formTarefas = trigger({
  type: 'n8n-nodes-base.formTrigger',
  version: 2.5,
  config: {
    name: 'Formulário de Tarefa',
    parameters: {
      formTitle: 'Nova Tarefa',
      formDescription: 'Preencha os campos abaixo para criar uma nova tarefa no Obsidian.',
      responseMode: 'lastNode',
      formFields: {
        values: [
          { fieldName: 'id', fieldLabel: 'ID da Tarefa', fieldType: 'text', placeholder: 'Ex: 001', requiredField: true },
          { fieldName: 'assunto', fieldLabel: 'Assunto', fieldType: 'text', placeholder: 'Título da tarefa', requiredField: true },
          { fieldName: 'descricao', fieldLabel: 'Descrição', fieldType: 'textarea', placeholder: 'Detalhe o que precisa ser feito...' },
          { fieldName: 'criador', fieldLabel: 'Criador', fieldType: 'text', placeholder: 'Seu nome', requiredField: true },
          { fieldName: 'responsavel', fieldLabel: 'Responsável', fieldType: 'text', placeholder: 'Nome do responsável', requiredField: true },
          {
            fieldName: 'prioridade',
            fieldLabel: 'Prioridade',
            fieldType: 'dropdown',
            requiredField: true,
            fieldOptions: { values: [{ option: 'Baixa' }, { option: 'Média' }, { option: 'Alta' }] }
          },
          {
            fieldName: 'setor',
            fieldLabel: 'Setor',
            fieldType: 'dropdown',
            requiredField: true,
            fieldOptions: { values: [{ option: 'Suprimentos' }, { option: 'Transporte' }, { option: 'Planejamento' }, { option: 'Administração' }, { option: 'Segurança' }] }
          },
          { fieldName: 'data_lancamento', fieldLabel: 'Data de Lançamento', fieldType: 'date', requiredField: true },
          { fieldName: 'previsao_termino', fieldLabel: 'Previsão de Término', fieldType: 'date', requiredField: true }
        ]
      },
      options: {
        path: 'nova-tarefa',
        buttonLabel: 'Criar Tarefa',
        appendAttribution: false
      }
    }
  }
});

const gerarNota = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Gerar Nota Markdown',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const d = $input.first().json;
const timestamp = new Date().toISOString();
const prioEmoji = { 'Alta': '🔴', 'Média': '🟡', 'Baixa': '🟢' };
const emoji = prioEmoji[d.prioridade] ?? '⚪';
const safeName = d.assunto
  .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
  .replace(/[^a-zA-Z0-9 ]/g, '')
  .trim()
  .replace(/\\s+/g, '-')
  .toLowerCase();
const fileName = \`TAREFA-\${d.id}-\${safeName}.md\`;
const dataLancamento = d.data_lancamento ? new Date(d.data_lancamento).toLocaleDateString('pt-BR') : '';
const previsaoTermino = d.previsao_termino ? new Date(d.previsao_termino).toLocaleDateString('pt-BR') : '';
const content = \`---
id: "\${d.id}"
assunto: "\${d.assunto}"
descricao: "\${d.descricao || ''}"
criador: "\${d.criador}"
responsavel: "\${d.responsavel}"
setor: "\${d.setor}"
prioridade: "\${d.prioridade}"
data_lancamento: "\${d.data_lancamento}"
previsao_termino: "\${d.previsao_termino}"
status: Aberta
criado_em: "\${timestamp}"
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

\${d.descricao || ''}

---

## Anotações



## Histórico

- \${new Date().toLocaleString('pt-BR')} — Tarefa criada via N8N (Formulário)
\`;
return [{ json: {
  fileName,
  contentBase64: Buffer.from(content).toString('base64'),
  id: d.id,
  assunto: d.assunto,
  descricao: d.descricao || '',
  criador: d.criador,
  responsavel: d.responsavel,
  setor: d.setor,
  prioridade: d.prioridade,
  data_lancamento: d.data_lancamento,
  previsao_termino: d.previsao_termino,
  timestamp
} }];`
    }
  }
});

const salvarGitHub = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4,
  config: {
    name: 'Salvar no GitHub (Obsidian)',
    credentials: { httpBearerAuth: newCredential('GitHub Token') },
    parameters: {
      method: 'PUT',
      url: expr('{{ "https://api.github.com/repos/Jonacir2023/JC/contents/vault/Tarefas/" + $json.fileName }}'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpBearerAuth',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'Accept', value: 'application/vnd.github+json' },
          { name: 'X-GitHub-Api-Version', value: '2022-11-28' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'keypair',
      bodyParameters: {
        parameters: [
          { name: 'message', value: expr('{{ "tarefa: adiciona " + $json.assunto + " (" + $json.id + ")" }}') },
          { name: 'content', value: expr('{{ $json.contentBase64 }}') }
        ]
      }
    }
  }
});

const salvarPlanilha = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Salvar na Planilha (Google)',
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets') },
    parameters: {
      resource: 'sheet',
      operation: 'append',
      authentication: 'oAuth2',
      documentId: { __rl: true, mode: 'url', value: 'COLE_A_URL_DA_PLANILHA_AQUI' },
      sheetName: { __rl: true, mode: 'name', value: 'Tarefas' },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          'ID': expr("{{ $('Gerar Nota Markdown').item.json.id }}"),
          'Assunto': expr("{{ $('Gerar Nota Markdown').item.json.assunto }}"),
          'Descrição': expr("{{ $('Gerar Nota Markdown').item.json.descricao }}"),
          'Criador': expr("{{ $('Gerar Nota Markdown').item.json.criador }}"),
          'Responsável': expr("{{ $('Gerar Nota Markdown').item.json.responsavel }}"),
          'Setor': expr("{{ $('Gerar Nota Markdown').item.json.setor }}"),
          'Prioridade': expr("{{ $('Gerar Nota Markdown').item.json.prioridade }}"),
          'Data de Lançamento': expr("{{ $('Gerar Nota Markdown').item.json.data_lancamento }}"),
          'Previsão de Término': expr("{{ $('Gerar Nota Markdown').item.json.previsao_termino }}"),
          'Status': 'Aberta',
          'Criado em': expr("{{ $('Gerar Nota Markdown').item.json.timestamp }}")
        }
      }
    }
  }
});

const concluido = node({
  type: 'n8n-nodes-base.form',
  version: 2.5,
  config: {
    name: 'Tarefa Criada!',
    parameters: {
      operation: 'completion',
      respondWith: 'text',
      completionTitle: '✅ Tarefa criada com sucesso!',
      completionMessage: 'Sua tarefa foi registrada no Obsidian e na planilha do Google Drive.'
    }
  }
});

export default workflow('formulario-tarefas-obsidian', 'Formulário de Tarefas → Obsidian')
  .add(formTarefas)
  .to(gerarNota)
  .to(salvarGitHub)
  .to(salvarPlanilha)
  .to(concluido);
