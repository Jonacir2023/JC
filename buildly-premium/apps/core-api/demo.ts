/**
 * 🎬 DEMO: Material Delay Workflow
 *
 * Executar: npx ts-node demo.ts
 *
 * Este arquivo demonstra o fluxo completo:
 * Evento (material atrasado) → Objetivo (ameaçado) → Decisão (3 alternativas)
 */

import { MaterialDelayWorkflowService } from './src/use-cases/material-delay-workflow.service';

async function main() {
  console.log('\n');
  console.log('🏗️  BUILDLY PREMIUM — DEMONSTRAÇÃO DE FLUXO INTELIGENTE');
  console.log('=' .repeat(70));
  console.log('\n');

  const service = new MaterialDelayWorkflowService();

  // Executar o fluxo completo
  const resultado = await service.executarFluxoAtrasoMaterial({
    obra_id: 'obr_suzano_2026',
    material_nome: 'Cimento CP II',
    atraso_dias: 15,
    motivo: 'Greve de transportadores',
    quantidade_afetada: 50000,
    user_id: 'usr_eng_chefe_001',
  });

  // Exibir estruturas de dados criadas
  console.log('=' .repeat(70));
  console.log('📦 ESTRUTURAS DE DADOS CRIADAS');
  console.log('='.repeat(70));

  console.log('\n1️⃣  EVENTO (O que aconteceu):');
  console.log(JSON.stringify(resultado.evento, null, 2));

  console.log('\n\n2️⃣  OBJETIVO AMEAÇADO (O que estava em risco):');
  console.log(JSON.stringify(resultado.objetivo_ameacado, null, 2));

  console.log('\n\n3️⃣  DECISÃO ESCOLHIDA (Como respondemos):');
  console.log(JSON.stringify(resultado.decisao_escolhida, null, 2));

  console.log('\n');
  console.log('=' .repeat(70));
  console.log('✅ FLUXO COMPLETO EXECUTADO COM SUCESSO');
  console.log('='.repeat(70));

  console.log(`
📊 APRENDIZADOS:

1. IEvent captura O QUÊ aconteceu (material, atraso, motivo)
   → Imutável no Event Store
   → Base para rastreabilidade

2. IObjective registra O QUÊ estava em risco (Bloco A no schedule)
   → Rastreável a eventos que o afetaram
   → Contribui ao BMI (Buildly Maturity Index)

3. IDecision documenta COMO respondemos (3 alternativas avaliadas)
   → Previsão vs. Realidade
   → Feedback Score para Machine Learning
   → Entrada para Decision Store (aprendizado corporativo)

🔗 A CONEXÃO:
   Evento (aconteceu) → Objetivo (ameaçado) → Decisão (respondemos)
   ↓
   Decision Store aprende: "Reordenação funciona melhor que esperado"
   ↓
   Próxima IA terá histórico para sugerir reordenação mais rapidamente

🎯 PRÓXIMOS PASSOS:
   1. Persistir Evento no Event Store (PostgreSQL append-only)
   2. Sincronizar para Neo4j (criar nodos + relações)
   3. Treinar IA com histórico de Decisões
   4. Implementar Recomendações Automáticas
  `);
}

main().catch(console.error);
