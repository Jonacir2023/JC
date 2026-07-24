/**
 * 🧬 DEMO: Digital Twin Demonstração
 *
 * Executar: npx ts-node demo.ts
 *
 * Este arquivo demonstra o Digital Twin funcionando:
 * Compara REAL vs PLANEJADO vs FORECAST do cenário de atraso de material
 */

import { DigitalTwinDemoService } from './src/digital-twin-demo.service';

async function main() {
  console.log('\n');
  console.log('🏗️  BUILDLY PREMIUM — DIGITAL TWIN PHASE 2');
  console.log('='.repeat(70));
  console.log('\n');

  const service = new DigitalTwinDemoService();

  // Gerar snapshot do Digital Twin
  const resultado = await service.gerarSnapshotAtrasoMaterial();

  // Exibir análise textual
  console.log(resultado.analise_textual);

  // Exibir snapshot JSON
  console.log('\n');
  console.log('=' .repeat(70));
  console.log('📦 SNAPSHOT COMPLETO (JSON)');
  console.log('='.repeat(70));
  console.log('\n');
  console.log(JSON.stringify(resultado.snapshot, null, 2));

  console.log('\n');
  console.log('=' .repeat(70));
  console.log('🔄 PRÓXIMA ETAPA: BMI Calculation');
  console.log('='.repeat(70));
  console.log(`
O Digital Twin consolidou 3 realidades (REAL, PLANEJADO, FORECAST).

Agora o BMI (Buildly Maturity Index) deve:

1. Calcular impacto nas 8 dimensões:
   - Execução: +5% (mais progresso que esperado)
   - Financeiro: +20k economia
   - Risco: +0.95 (evento mitigado com sucesso)
   - Governança: Mantém score alto (decisão documentada)
   - Planejamento: Melhora (cronograma mais realista)
   - Recursos: Sem mudança (mesma equipe)
   - Sustentabilidade: Sem mudança
   - Segurança: Sem mudança

2. Gerar BMI Score agregado:
   Σ (score_dimensão × peso_dimensão) → 77/100 "BOM"

3. Contribuição ao histórico:
   - BMI aumentou de 75 → 77 em 1 dia
   - Tendência: SUBINDO (decisões boas)
   - Confiança: AUMENTANDO (model acurácia +0.92)

🎯 Phase 2 Status:
   ✓ Neo4j interfaces: GraphNode, GraphRelationship, Pathfinding
   ✓ Digital Twin interfaces: Real vs Planejado vs Forecast
   ✓ BMI interfaces: 8 dimensões, scorer, histórico
   ✓ Demo service: Mostrando fluxo completo

⏳ Phase 2 Próximas Atividades:
   - Implementar sync de eventos para Neo4j
   - Criar consultas de pathfinding (cascata de impactos)
   - Implementar BMI engine (calcular scores)
   - Integrar com Phase 1 (IEvent → Graph Sync)
  `);
}

main().catch(console.error);
