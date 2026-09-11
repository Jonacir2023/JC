# BUILDLy Premium V2.1 — Release Candidate

Data: 06/09/2026

## Estado da entrega

Esta versão é uma **Release Candidate funcional em modo DEMO** e um pacote de backend candidato para homologação. O Supabase de produção permanece intocado.

## Melhorias da RC 2.1

- persistência local da demonstração;
- exportação dos dados DEMO em JSON;
- restauração da base DEMO;
- cálculo por EAP com descendentes recursivos;
- rateio proporcional de medição quando um contrato atende múltiplas EAPs;
- baseline orçamentária aprovada imutável;
- alterações orçamentárias aprovadas imutáveis;
- transferências/reclassificações precisam fechar em zero;
- contrato aprovado exige itens com EAP + CBS;
- contrato aprovado fica imutável, com mudanças via aditivo/supressão;
- aditivo aprovado recalcula compromisso automaticamente;
- compromisso com integridade multiobra;
- medição Premium com aprovação e imutabilidade;
- NF Premium com origem, aprovação e vínculo a contrato/medição;
- pagamento parcial não marca NF como paga;
- pagamento acima do saldo é bloqueado;
- custo aprovado é imutável;
- grants explícitos dos objetos Premium;
- RLS cobrindo todas as tabelas novas;
- funções internas não expostas como RPC;
- auditoria ampliada para objetos financeiros, contratuais, planejamento e GED.

## Testes automáticos

A RC possui:

- `tests/static_check.py`
- `tests/rc_check.py`
- `tests/smoke.js`

Validações atuais:

- motor financeiro;
- estrutura do pacote;
- cobertura de RLS;
- views `security_invoker`;
- ausência de `SECURITY DEFINER` novo no schema público;
- especialidades;
- rateio multi-EAP;
- sintaxe JavaScript via `node --check`.

## Importante

`RELEASE CANDIDATE` não significa autorização para aplicar em produção. Antes:

1. backup/export do estado atual;
2. versionamento Git;
3. ambiente de homologação gratuito/local ou banco separado já existente;
4. aplicar SQL 01 → 14;
5. executar validação estrutural e testes positivos/negativos;
6. somente depois planejar rollout.


## RC2 — baseline V1 reconstruído

Foi adicionado `sql/00_v1_schema_baseline.sql`, reconstruído por consultas somente leitura ao catálogo do Supabase de produção. Ele contém 34 tabelas, 11 funções, 12 views, 9 triggers, RLS/policies e grants observados, sem dados de negócio.

Finalidade: permitir bootstrap de um ambiente novo de homologação sem depender dos SQLs históricos não versionados. O arquivo não representa os SQLs originais das 37 migrations antigas.


## Atualização 07/09/2026 — standalone offline

Após observar que a prévia do ChatGPT/macOS solicitava acesso de rede para `sw.js`, o standalone foi endurecido:

- `BUILDLy_Premium_V2_STANDALONE.html` agora é offline;
- `BUILDLy_Premium_V2_STANDALONE_OFFLINE.html` é a cópia explicitamente nomeada;
- `ABRIR_BUILDLY_OFFLINE.command` abre o arquivo local no macOS;
- não existe registro de Service Worker no standalone;
- não existem URLs externas, `fetch`, XHR, WebSocket ou EventSource;
- CSP bloqueia `connect-src` e `worker-src`;
- `tests/offline_check.py` impede regressão.

O PWA continua somente no fluxo `index.html` + `sw.js` quando a aplicação é servida por HTTP/hosting.
