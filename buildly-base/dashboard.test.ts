import { test, expect } from '@playwright/test';

test.describe('Buildly Dashboard — Testes de Interação', () => {
  test.beforeAll(async () => {
    // HTTP server já rodando em localhost:8000
  });

  test('PASSO 1: Dashboard carrega sem erros', async ({ page }) => {
    await page.goto('http://localhost:8000/test-dashboard.html', {
      waitUntil: 'networkidle',
    });

    // Verifica status board
    const statusBoard = page.locator('text=Tests Passed');
    await expect(statusBoard).toBeVisible();

    // Verifica formulários visíveis
    await expect(page.locator('text=Criar Evento')).toBeVisible();
    await expect(page.locator('text=Criar Decisão')).toBeVisible();
    await expect(page.locator('text=Executar Workflow')).toBeVisible();

    console.log('✅ PASSO 1: Dashboard carregado com sucesso');
  });

  test('PASSO 2: Criar Evento', async ({ page }) => {
    await page.goto('http://localhost:8000/test-dashboard.html');
    await page.waitForLoadState('networkidle');

    // Clica botão "Criar Evento"
    await page.click('button:has-text("✅ Criar Evento")');
    await page.waitForTimeout(500);

    // Captura resultado JSON
    const resultPanel = page.locator('.result-panel').first();
    const jsonText = await resultPanel.textContent();

    console.log('📌 JSON Evento Criado:');
    console.log(jsonText);

    // Verifica estrutura
    expect(jsonText).toContain('id');
    expect(jsonText).toContain('timestamp');
    expect(jsonText).toContain('MATERIAL_DELAY');
    expect(jsonText).toContain('context');

    // Verifica métrica
    const eventCounter = page.locator('text=Events Criados:');
    await expect(eventCounter).toContainText('1');

    console.log('✅ PASSO 2: Evento criado com sucesso');
  });

  test('PASSO 3: Criar Decisão', async ({ page }) => {
    await page.goto('http://localhost:8000/test-dashboard.html');
    await page.waitForLoadState('networkidle');

    // Clica botão "Criar Decisão"
    await page.click('button:has-text("✅ Criar Decisão")');
    await page.waitForTimeout(500);

    // Captura resultado JSON
    const resultPanel = page.locator('.result-panel').nth(1);
    const jsonText = await resultPanel.textContent();

    console.log('📌 JSON Decisão Criada:');
    console.log(jsonText);

    // Verifica estrutura
    expect(jsonText).toContain('decision_id');
    expect(jsonText).toContain('type');
    expect(jsonText).toContain('status');
    expect(jsonText).toContain('PENDING');

    // Verifica métrica
    const decisionCounter = page.locator('text=Decisions Criadas:');
    await expect(decisionCounter).toContainText('1');

    console.log('✅ PASSO 3: Decisão criada com sucesso');
  });

  test('PASSO 4: Executar Workflow Completo', async ({ page }) => {
    await page.goto('http://localhost:8000/test-dashboard.html');
    await page.waitForLoadState('networkidle');

    // Clica botão "Executar Workflow Completo"
    await page.click('button:has-text("🚀 Executar Workflow")');
    await page.waitForTimeout(1000);

    // Captura resultado completo
    const workflowResult = page.locator('.result-panel').nth(2);
    const jsonText = await workflowResult.textContent();

    console.log('📌 JSON Workflow Completo:');
    console.log(jsonText);

    // Verifica todos os 4 componentes
    expect(jsonText).toContain('event');
    expect(jsonText).toContain('prediction');
    expect(jsonText).toContain('decision');
    expect(jsonText).toContain('feedback');

    // Verifica console log
    const log = page.locator('.console-log');
    const logContent = await log.textContent();

    expect(logContent).toContain('Evento criado');
    expect(logContent).toContain('Predição gerada');
    expect(logContent).toContain('Decisão criada');
    expect(logContent).toContain('Feedback registrado');

    console.log('✅ PASSO 4: Workflow completo executado');
  });

  test('PASSO 5: Testar Endpoints', async ({ page }) => {
    await page.goto('http://localhost:8000/test-dashboard.html');
    await page.waitForLoadState('networkidle');

    // Testa GET /health
    console.log('🔌 Testando GET /health...');
    await page.click('button:has-text("GET /health")');
    await page.waitForTimeout(300);

    let resultText = await page.locator('.result-panel').first().textContent();
    expect(resultText).toContain('200');
    expect(resultText).toContain('UP');
    console.log('✅ GET /health OK');

    // Testa POST /predict
    console.log('🔌 Testando POST /predict...');
    await page.click('button:has-text("POST /predict")');
    await page.waitForTimeout(300);

    resultText = await page.locator('.result-panel').nth(1).textContent();
    expect(resultText).toContain('prediction');
    console.log('✅ POST /predict OK');

    // Testa POST /decisions
    console.log('🔌 Testando POST /decisions...');
    await page.click('button:has-text("POST /decisions")');
    await page.waitForTimeout(300);

    resultText = await page.locator('.result-panel').nth(2).textContent();
    expect(resultText).toContain('decision_id');
    console.log('✅ POST /decisions OK');

    console.log('✅ PASSO 5: Todos os endpoints respondendo');
  });

  test('PASSO 6: Registrar Feedback', async ({ page }) => {
    await page.goto('http://localhost:8000/test-dashboard.html');
    await page.waitForLoadState('networkidle');

    // Preenchendo feedback
    await page.fill('input[placeholder*="Feedback"]', 'Teste realizado com sucesso');
    await page.selectOption('select', 'success');

    // Clica registrar
    await page.click('button:has-text("📤 Registrar Feedback")');
    await page.waitForTimeout(500);

    // Captura resultado
    const resultPanel = page.locator('.result-panel').last();
    const jsonText = await resultPanel.textContent();

    console.log('📌 JSON Feedback:');
    console.log(jsonText);

    expect(jsonText).toContain('outcome');
    expect(jsonText).toContain('success');
    expect(jsonText).toContain('feedback');

    // Verifica métrica
    const feedbackCounter = page.locator('text=Feedback Registrado:');
    await expect(feedbackCounter).toContainText('1');

    console.log('✅ PASSO 6: Feedback registrado com sucesso');
  });

  test('PASSO 7: Verificar Métricas Finais', async ({ page }) => {
    await page.goto('http://localhost:8000/test-dashboard.html');
    await page.waitForLoadState('networkidle');

    // Executa um workflow completo
    await page.click('button:has-text("🚀 Executar Workflow")');
    await page.waitForTimeout(1000);

    // Captura métricas
    const metrics = page.locator('.metrics-board');
    const metricsText = await metrics.textContent();

    console.log('📊 Métricas Finais:');
    console.log(metricsText);

    // Verifica que as métricas aumentaram
    expect(metricsText).toContain('Events Criados');
    expect(metricsText).toContain('Decisions Criadas');
    expect(metricsText).toContain('Feedback Registrado');
    expect(metricsText).toContain('Workflows OK');

    console.log('✅ PASSO 7: Métricas funcionando corretamente');
  });

  test('PASSO 8: Reset de Métricas', async ({ page }) => {
    await page.goto('http://localhost:8000/test-dashboard.html');
    await page.waitForLoadState('networkidle');

    // Primeiro executa algo
    await page.click('button:has-text("✅ Criar Evento")');
    await page.waitForTimeout(300);

    // Depois reseta
    await page.click('button:has-text("Limpar Métricas")');
    await page.waitForTimeout(300);

    // Verifica que voltou a 0
    const metrics = page.locator('.metrics-board');
    const metricsText = await metrics.textContent();

    console.log('✅ Métricas resetadas:');
    console.log(metricsText);

    expect(metricsText).toContain('0');

    // Verifica mensagem no console
    const log = page.locator('.console-log');
    const logContent = await log.textContent();
    expect(logContent).toContain('Métricas resetadas');

    console.log('✅ PASSO 8: Reset funcionando corretamente');
  });
});
