# BUILDLy Premium — Matriz de recuperação do RDO

## Motivo

A V2.2.0 RC1 simplificou indevidamente o RDO para poucos campos agregados. Isso foi classificado como **regressão funcional** porque o RDO V1 já possuía um fluxo de campo muito mais completo.

O arquivo de referência preservado é `docs/reference/RDO_V1_INSTITUIDO.html`.

## Baseline mínimo obrigatório

O RDO Premium não pode ficar abaixo deste conjunto já instituído:

- Data do diário e edição de diário passado.
- Cópia estruturada do último diário sem copiar produção/eventos/fotos do dia anterior.
- Local da obra e descrição da frente/local.
- Clima por período, precipitação em mm e condição de operação.
- Jornada de trabalho.
- DSS com horário, ministrante e tema.
- Chamada nominal do efetivo, situação, horas normais e extras e observação.
- Equipamentos/veículos utilizados, operador, status, horas operando/paradas, horímetro e justificativa de parada.
- Atividades do catálogo, EAP, local, quantidade, unidade e status.
- Atividades avulsas e atividades paralisadas com justificativa.
- Observações do dia.
- Eventos de Segurança e Meio Ambiente com gravidade, descrição e ação tomada.
- Registro fotográfico com legenda e vínculo com atividade.
- Apontador responsável.
- Assinatura do apontador e da fiscalização/cliente.
- Emissão/visualização do RDO para impressão/PDF.
- Texto copiável para comunicação.
- Resumo semanal, mensal e anual com acumulados de serviço, efetivo e chuva.
- Calendário mensal de RDOs.
- Integração com cadastros de equipe, equipamentos e atividades.
- Salvamento campo a campo para reduzir risco de perda de apontamento.
- Data calculada no fuso `America/Sao_Paulo`.

## Integração Premium

Na V2, além de preservar o baseline acima:

- atividade do RDO pode ser associada à EAP;
- permissões vêm do RBAC `rdo` e do isolamento por obra;
- fatos aprovados/emitidos entram na trilha de auditoria;
- os cadastros são compartilhados com Efetivo, Equipamentos e Cadastro Premium;
- a persistência DEMO continua local/offline e o backend candidato usa as tabelas V1 mais a Migration 15 de extensão do RDO.

## Regra de aceite

Nenhuma release futura pode ser chamada de `FEATURE COMPLETE` se o módulo RDO perder qualquer capacidade do baseline acima sem decisão explícita e documentada.
