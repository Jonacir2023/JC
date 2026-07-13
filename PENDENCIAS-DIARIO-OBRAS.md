# Pendências — Diário de Obras

_Guardado em 2026-07-13._

## Você (instalação do que já está pronto)

1. Subir `index.html` (v15) em `github.com/Jonacir2023/diario-obras/upload/main` → Commit
2. Colar `DiarioObras-v4.gs.txt` no Apps Script → Salvar → Implantar → ✏️ → **Nova versão** → Implantar
3. Validar: salvar diário → coluna Y (RDO Nº) preenchida → Cadastro → ☁️ Backup na Nuvem → pasta `Diario de Obras - Backups` no Drive
4. Ajustar cadastro de equipamentos: número da frota no campo Número, descrição genérica idêntica entre iguais (para o PDF acumular por tipo)
5. Cadastrar campo Empresa nos colaboradores terceirizados (vazio = Cesbe)

## Desenvolvimento (fila, nesta ordem)

6. **Multi-obra** — cadastrar/alternar obras, cadastros e histórico por obra; resolve também a numeração de RDO com 2 aparelhos
7. **SINAPI** — retomar fluxo de orçamentos; você vai listar as dores antes
8. Dashboard de indicadores (chuva/impraticáveis, efetivo, horas de equipamento)
9. Boletim de Medição a partir das quantidades dos diários
10. Notificações (lembrete de diário + alertas via @Assuntos_bot)
11. Multi-usuário por apontador (Supabase) — só se a demanda real aparecer

## Configuração opcional parada

12. Claude Code no Mac — login está caindo em conta API Billing; antes do `/login` (opção 1), a sessão do Safari em claude.ai precisa estar na conta Pro. Publicação manual atende enquanto isso.
