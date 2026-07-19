/**
 * Material Delay Workflow Service
 *
 * Demonstração completa de como Evento → Objetivo → Decisão se conectam
 *
 * Cenário:
 * 1. Evento: Material chega 15 dias atrasado (MATERIAL_DELAY)
 * 2. Objetivo: Manter Bloco A no schedule original é ameaçado
 * 3. Decisão: Escolher entre 3 opções (esperar, importar, reordenar)
 *
 * Este serviço simula toda essa cascata
 */

import { v4 as uuid } from 'uuid';
import {
  IEvent,
  EventBuilder,
  IObjective,
  ObjectiveBuilder,
  IDecision,
  DecisionBuilder,
} from '@buildly/common-types';

export interface IMaterialDelayWorkflowInput {
  obra_id: string;
  material_nome: string;
  atraso_dias: number;
  motivo: string;
  quantidade_afetada: number;
  user_id: string;
}

export interface IMaterialDelayWorkflowOutput {
  evento: IEvent;
  objetivo_ameacado: IObjective;
  decisoes_alternativas: IDecision[];
  decisao_escolhida: IDecision;
}

export class MaterialDelayWorkflowService {
  /**
   * Executa o fluxo completo de um atraso de material
   */
  async executarFluxoAtrasoMaterial(
    input: IMaterialDelayWorkflowInput
  ): Promise<IMaterialDelayWorkflowOutput> {
    console.log('🔄 Iniciando fluxo de atraso de material...\n');

    // ========== PASSO 1: CRIAR EVENTO ==========
    console.log('📍 PASSO 1: Registrar Evento (MATERIAL_DELAY)');
    const evento = this.criarEventoAtrasoMaterial(input);
    console.log(`   ✅ Evento criado: ${evento.id}`);
    console.log(`   - Tipo: ${evento.type}`);
    console.log(`   - Atraso: ${evento.data.atraso_dias} dias`);
    console.log(`   - Impacto: ${evento.context.impacto_potencial}\n`);

    // ========== PASSO 2: ANALISAR IMPACTO EM OBJETIVOS ==========
    console.log('📍 PASSO 2: Analisar Impacto em Objetivos');
    const objetivoAmeacado = this.criarObjetivoAmeacado(input.obra_id, evento.id);
    console.log(`   ✅ Objetivo ameaçado identificado: ${objetivoAmeacado.nome}`);
    console.log(`   - Status: ${objetivoAmeacado.status}`);
    console.log(`   - Progresso: ${objetivoAmeacado.progresso_percentual}%`);
    console.log(`   - Data alvo: ${objetivoAmeacado.data_alvo}\n`);

    // ========== PASSO 3: GERAR ALTERNATIVAS DE DECISÃO ==========
    console.log('📍 PASSO 3: Gerar e Avaliar Alternativas');
    const alternativas = this.gerarAlternativasDecisao(input, evento.id);
    console.log(`   ✅ ${alternativas.length} alternativas geradas:\n`);

    alternativas.forEach((dec, idx) => {
      const opcaoEscolhida = dec.opcoes_avaliadas.find(o => o.id === dec.opcao_escolhida_id);
      console.log(`   ${idx + 1}. ${opcaoEscolhida?.descricao}`);
      console.log(`      Custo: R$ ${opcaoEscolhida?.custo_estimado.toLocaleString('pt-BR')}`);
      console.log(`      Impacto Prazo: ${opcaoEscolhida?.impacto_prazo} dias`);
      console.log(`      Risco: ${opcaoEscolhida?.risco}\n`);
    });

    // ========== PASSO 4: SIMULAR RESULTADO REAL ==========
    console.log('📍 PASSO 4: Executar Decisão Escolhida & Simular Resultado');
    const decisaoEscolhida = alternativas[2]; // Opção 3: Reordenar
    console.log(`   ✅ Decisão escolhida: ${decisaoEscolhida.opcoes_avaliadas[2].descricao}`);
    console.log(`   - Decisor: ${decisaoEscolhida.decisor}`);
    console.log(`   - Consenso: ${decisaoEscolhida.consenso ? 'Sim' : 'Não'}`);
    console.log(`   - Resultado esperado: R$ ${decisaoEscolhida.resultado_esperado.economia.toLocaleString('pt-BR')} economia\n`);

    // Simular resultado real (após 30 dias)
    this.simularResultadoReal(decisaoEscolhida);
    console.log(`   ✅ Resultado real registrado:`);
    console.log(`   - Economia real: R$ ${decisaoEscolhida.resultado_real?.economia.toLocaleString('pt-BR')}`);
    console.log(`   - Ganho de prazo: ${decisaoEscolhida.resultado_real?.ganho_prazo} dias`);
    console.log(`   - Satisfação: ${(decisaoEscolhida.resultado_real?.satisfacao_real ?? 0).toFixed(2)}`);
    console.log(`   - Feedback Score: ${decisaoEscolhida.feedback_score?.toFixed(2)} ⭐\n`);

    // ========== PASSO 5: ATUALIZAR OBJETIVO COM RESULTADO ==========
    console.log('📍 PASSO 5: Atualizar Objetivo com Resultado Real');
    objetivoAmeacado.status = 'EM_EXECUCAO'; // Voltou a estar em andamento
    objetivoAmeacado.progresso_percentual = 35; // Progrediu um pouco
    objetivoAmeacado.eventos_relacionados.push(evento.id);
    objetivoAmeacado.decisoes_relacionadas.push(decisaoEscolhida.id);
    console.log(`   ✅ Objetivo atualizado:`);
    console.log(`   - Novo status: ${objetivoAmeacado.status}`);
    console.log(`   - Novo progresso: ${objetivoAmeacado.progresso_percentual}%\n`);

    // ========== RESUMO FINAL ==========
    console.log('=' .repeat(70));
    console.log('📊 RESUMO DO FLUXO');
    console.log('='.repeat(70));
    console.log(`
Evento + Objetivo + Decisão formam um tripé:

1. EVENTO (O que aconteceu):
   - Material atrasou 15 dias
   - Impacto potencial: R$ 150k de custo + 15 dias de atraso

2. OBJETIVO (O que estava em risco):
   - "Concluir Bloco A até 31 de agosto" ficou ameaçado
   - Mudou de PLANEJADO para EM_RISCO

3. DECISÃO (Como respondemos):
   - Alternativa: Reordenar sequência de atividades
   - Resultado: Apenas +7 dias de atraso (vs. +15 se esperássemos)
   - Economia: R$ 100k em custos de parada

🎯 APRENDIZADO (Decision Store):
   - Feedback Score: +0.95 (excelente!)
   - Próximas decisões similares usarão esse histórico
   - IA terá 1 novo sample de treinamento
    `);

    return {
      evento,
      objetivo_ameacado: objetivoAmeacado,
      decisoes_alternativas: alternativas,
      decisao_escolhida: decisaoEscolhida,
    };
  }

  /**
   * Cria o evento de atraso de material
   */
  private criarEventoAtrasoMaterial(input: IMaterialDelayWorkflowInput): IEvent {
    return new EventBuilder(uuid(), 'MATERIAL_DELAY')
      .withOrigin({
        module: 'execution',
        user_id: input.user_id,
        source: 'api',
      })
      .withContext({
        obra_id: input.obra_id,
        prioridade: 'CRITICA',
        impacto_potencial: `Falta de ${input.material_nome} afeta Bloco A - ${input.quantidade_afetada} unidades`,
      })
      .withData({
        material: input.material_nome,
        atraso_dias: input.atraso_dias,
        motivo: input.motivo,
        quantidade_afetada: input.quantidade_afetada,
        custo_parada_diaria: 10000,
        impacto_financeiro: 10000 * input.atraso_dias,
      })
      .withAudit({
        created_at: new Date().toISOString(),
        created_by: input.user_id,
        valid_from: new Date().toISOString(),
      })
      .build();
  }

  /**
   * Cria um objetivo que foi ameaçado pelo evento
   */
  private criarObjetivoAmeacado(obra_id: string, evento_id: string): IObjective {
    return new ObjectiveBuilder(
      uuid(),
      obra_id,
      'Concluir Bloco A com qualidade excelente até 31 de agosto',
      'execucao'
    )
      .withDescricao('Alcançar 100% de conclusão com zero defeitos críticos')
      .withMetricaPrincipal({
        nome: '% de conclusão',
        valor_alvo: 100,
        valor_atual: 20, // Já progrediu um pouco
        unidade: '%',
      })
      .withDatas('2026-07-20', '2026-08-31')
      .withCriadoPor('usr_eng_chefe')
      .withBMIContribuicao({
        dimensao: 'execucao',
        peso: 0.35,
        score_atual: 81,
      })
      .build();
  }

  /**
   * Gera 3 alternativas de decisão
   */
  private gerarAlternativasDecisao(
    input: IMaterialDelayWorkflowInput,
    evento_id: string
  ): IDecision[] {
    const decisoes: IDecision[] = [];

    // Alternativa 1: Esperar
    const dec1 = new DecisionBuilder(uuid(), input.obra_id, evento_id, 'OPERACIONAL')
      .withContextoWorkspace({
        stakeholders: ['usr_eng_chefe', 'usr_fornecedor', 'usr_financeiro'],
        prioridade_negocio: 'CRITICA',
      })
      .addOpcao({
        id: 'opt_1',
        descricao: 'Esperar material chegar (15 dias)',
        custo_estimado: 150000,
        impacto_prazo: 15,
        risco: 'ALTO',
        prós: ['Nenhum custo adicional'],
        contras: ['15 dias de atraso', 'Equipe ociosa', 'Cliente insatisfeito'],
      })
      .addOpcao({
        id: 'opt_2',
        descricao: 'Importar de outro fornecedor (+50% custo)',
        custo_estimado: 225000,
        impacto_prazo: 3,
        risco: 'MEDIO',
        prós: ['Apenas 3 dias de atraso', 'Retoma atividades cedo'],
        contras: ['Custo 50% maior', 'Qualidade incerta', 'Prazo de importação'],
      })
      .addOpcao({
        id: 'opt_3',
        descricao: 'Pausar atividade B, reordenar sequência',
        custo_estimado: 50000,
        impacto_prazo: 7,
        risco: 'BAIXO',
        prós: [
          'Menor custo adicional',
          'Usa recursos de forma inteligente',
          'Aproveita equipe',
        ],
        contras: ['Resequenciamento complexo', 'Coordenação necessária'],
      })
      .withOpcaoEscolhida('opt_3')
      .withDecisao('HIBRIDO', 'usr_eng_chefe', true)
      .withResultadoEsperado({
        economia: 100000,
        ganho_prazo: 8,
        satisfacao_esperada: 0.85,
        justificativa: 'Reordenação inteligente minimiza impacto',
      })
      .withRastreabilidade('usr_eng_chefe')
      .build();

    decisoes.push(dec1);

    // Alternativa 2: Importar
    const dec2 = new DecisionBuilder(uuid(), input.obra_id, evento_id, 'OPERACIONAL')
      .withContextoWorkspace({
        stakeholders: ['usr_eng_chefe', 'usr_fornecedor', 'usr_financeiro'],
        prioridade_negocio: 'CRITICA',
      })
      .addOpcao({
        id: 'opt_1',
        descricao: 'Esperar material chegar (15 dias)',
        custo_estimado: 150000,
        impacto_prazo: 15,
        risco: 'ALTO',
      })
      .addOpcao({
        id: 'opt_2',
        descricao: 'Importar de outro fornecedor (+50% custo)',
        custo_estimado: 225000,
        impacto_prazo: 3,
        risco: 'MEDIO',
      })
      .addOpcao({
        id: 'opt_3',
        descricao: 'Pausar atividade B, reordenar sequência',
        custo_estimado: 50000,
        impacto_prazo: 7,
        risco: 'BAIXO',
      })
      .withOpcaoEscolhida('opt_2')
      .withDecisao('HUMANO', 'usr_financeiro', false)
      .withResultadoEsperado({
        economia: 50000,
        ganho_prazo: 12,
        satisfacao_esperada: 0.72,
      })
      .withRastreabilidade('usr_financeiro')
      .build();

    decisoes.push(dec2);

    // Alternativa 3: Reordenar (escolhida)
    const dec3 = new DecisionBuilder(uuid(), input.obra_id, evento_id, 'OPERACIONAL')
      .withContextoWorkspace({
        stakeholders: ['usr_eng_chefe', 'usr_fornecedor', 'usr_financeiro'],
        prioridade_negocio: 'CRITICA',
      })
      .addOpcao({
        id: 'opt_1',
        descricao: 'Esperar material chegar (15 dias)',
        custo_estimado: 150000,
        impacto_prazo: 15,
        risco: 'ALTO',
      })
      .addOpcao({
        id: 'opt_2',
        descricao: 'Importar de outro fornecedor (+50% custo)',
        custo_estimado: 225000,
        impacto_prazo: 3,
        risco: 'MEDIO',
      })
      .addOpcao({
        id: 'opt_3',
        descricao: 'Pausar atividade B, reordenar sequência',
        custo_estimado: 50000,
        impacto_prazo: 7,
        risco: 'BAIXO',
      })
      .withOpcaoEscolhida('opt_3')
      .withDecisao('HIBRIDO', 'usr_eng_chefe', true)
      .withResultadoEsperado({
        economia: 100000,
        ganho_prazo: 8,
        satisfacao_esperada: 0.85,
      })
      .withRastreabilidade('usr_eng_chefe')
      .build();

    decisoes.push(dec3);

    return decisoes;
  }

  /**
   * Simula o resultado real após 30 dias
   */
  private simularResultadoReal(decisao: IDecision): void {
    // Simulação: a decisão saiu melhor que o esperado
    decisao.resultado_real = {
      economia: 105000, // R$ 5k melhor que estimado
      ganho_prazo: 9, // 1 dia a mais de ganho
      satisfacao_real: 0.92,
      licoes_aprendidas:
        'Reordenação foi mais eficiente que o modelo previu. Equipe engajada com trabalho. Cliente beneficiado com entrega antecipada.',
      desvio_estimativa: {
        economia_variance: 5, // 5% melhor
        prazo_variance: 12.5, // 12.5% melhor
      },
    };

    // Feedback muito positivo
    decisao.feedback_score = 0.95;
    decisao.feedback_comentario =
      'Excelente execução. Modelo subestimou capacidade da equipe.';
    decisao.data_conclusao = new Date().toISOString();
  }
}

/**
 * Exemplo de uso:
 *
 * const service = new MaterialDelayWorkflowService();
 *
 * const resultado = await service.executarFluxoAtrasoMaterial({
 *   obra_id: 'obr_suzano_2026',
 *   material_nome: 'Cimento CP II',
 *   atraso_dias: 15,
 *   motivo: 'Greve de transportadores',
 *   quantidade_afetada: 50000,
 *   user_id: 'usr_123'
 * });
 *
 * // Resultado contém:
 * // - evento: O MATERIAL_DELAY que foi registrado
 * // - objetivo_ameacado: O objetivo "Concluir Bloco A" que ficou em risco
 * // - decisoes_alternativas: 3 opções avaliadas
 * // - decisao_escolhida: A decisão de reordenar (com feedback real)
 */
