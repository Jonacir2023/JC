import { workflow, trigger, node, expr } from 'n8n-workflow-sdk';

export default workflow('gestao-tarefas-projetos', 'Gestão de Tarefas e Projetos')
  .add(trigger({
    type: 'n8n-nodes-base.webhook',
    version: 2,
    config: {
      parameters: {
        path: 'gestao-tarefas',
        method: 'POST',
        responseMode: 'onReceived',
        authenticationMethod: 'none'
      }
    }
  }))
  .to(node({
    type: 'n8n-nodes-base.set',
    version: 3,
    config: {
      parameters: {
        mode: 'manual',
        assignments: {
          assignments: [
            { name: 'Id', type: 'string', value: expr('$json.Id') },
            { name: 'Assunto', type: 'string', value: expr('$json.Assunto') },
            { name: 'Descricao do Assunto', type: 'string', value: expr('$json["Descrição do Assunto"]') },
            { name: 'Criador', type: 'string', value: expr('$json.Criador') },
            { name: 'Responsavel', type: 'string', value: expr('$json.Responsável') },
            { name: 'Data de lancamento', type: 'string', value: expr('$json["Data de lançamento"]') },
            { name: 'Previsao de Termino', type: 'string', value: expr('$json["Previsão de Término"]') },
            { name: 'Setor', type: 'string', value: expr('$json.Setor') },
            { name: 'timestamp', type: 'string', value: expr('new Date().toISOString()') }
          ]
        }
      }
    }
  }))
  .to(node({
    type: 'n8n-nodes-base.if',
    version: 2,
    config: {
      parameters: {
        conditions: {
          conditions: [
            { operator: { type: 'string', operation: 'equals' }, value1: expr('$json.Prioridade'), value2: 'Baixa' },
            { operator: { type: 'string', operation: 'equals' }, value1: expr('$json.Prioridade'), value2: 'Média' },
            { operator: { type: 'string', operation: 'equals' }, value1: expr('$json.Prioridade'), value2: 'Alta' }
          ],
          combinator: 'or',
          options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }
        }
      }
    }
  }))
  .to(node({
    type: 'n8n-nodes-base.if',
    version: 2,
    config: {
      parameters: {
        conditions: {
          conditions: [
            { operator: { type: 'string', operation: 'equals' }, value1: expr('$json.Setor'), value2: 'Suprimentos' },
            { operator: { type: 'string', operation: 'equals' }, value1: expr('$json.Setor'), value2: 'Transporte' },
            { operator: { type: 'string', operation: 'equals' }, value1: expr('$json.Setor'), value2: 'Planejamento' },
            { operator: { type: 'string', operation: 'equals' }, value1: expr('$json.Setor'), value2: 'Administração' },
            { operator: { type: 'string', operation: 'equals' }, value1: expr('$json.Setor'), value2: 'Segurança' }
          ],
          combinator: 'or',
          options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }
        }
      }
    }
  }))
  .to(node({
    type: 'n8n-nodes-base.postgres',
    version: 2,
    config: {
      parameters: {
        operation: 'insert',
        schema: '={{"public"}}',
        table: '={{"tarafas_projetos"}}',
        fieldsUi: {
          values: [
            { fieldName: 'Id', fieldValue: expr('$json.Id') },
            { fieldName: 'Assunto', fieldValue: expr('$json.Assunto') },
            { fieldName: 'Descricao do Assunto', fieldValue: expr('$json["Descrição do Assunto"]') },
            { fieldName: 'Criador', fieldValue: expr('$json.Criador') },
            { fieldName: 'Responsavel', fieldValue: expr('$json.Responsável') },
            { fieldName: 'Data de lancamento', fieldValue: expr('$json["Data de lançamento"]') },
            { fieldName: 'Previsao de Termino', fieldValue: expr('$json["Previsão de Término"]') },
            { fieldName: 'Setor', fieldValue: expr('$json.Setor') },
            { fieldName: 'timestamp', fieldValue: expr('$json.timestamp') }
          ]
        }
      }
    }
  }));
