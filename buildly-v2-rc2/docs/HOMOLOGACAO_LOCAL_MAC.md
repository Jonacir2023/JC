# Homologação local gratuita — macOS

Objetivo: executar a RC2 inteira em um Supabase local, sem tocar no projeto P3 de produção.

## Pré-requisitos

A documentação oficial do Supabase exige:

- Supabase CLI;
- runtime de containers compatível com a API Docker.

O próprio Supabase lista Docker Desktop, Rancher Desktop, Podman, OrbStack e colima como opções de runtime no macOS. Use apenas uma opção que já seja permitida/licenciada no seu ambiente.

A CLI pode ser instalada como dependência do projeto com npm ou como comando global. Este kit espera o comando `supabase` disponível no PATH.

## Execução

Na raiz do pacote:

```bash
./scripts/preparar_homologacao_local.sh
```

O script:

1. verifica Supabase CLI e runtime;
2. inicializa `supabase/` se necessário;
3. copia os 16 SQLs para `supabase/migrations/` em ordem determinística;
4. usa `tests/seed_homologacao.sql`, somente com `TESTE-A` e `TESTE-B`;
5. inicia o stack local;
6. executa `supabase db reset`;
7. cria usuários artificiais pelo Auth local;
8. executa `supabase test db` com pgTAP;
9. executa `supabase db lint`;
10. imprime o status do ambiente local.

## Usuários locais

Todos usam a senha temporária:

```text
Teste123!Buildly
```

E-mails:

```text
proprietario@teste.local
gestor.a@teste.local
gestor.b@teste.local
engenheiro.a@teste.local
tecnico.a@teste.local
analista.a@teste.local
encarregado.a@teste.local
apontador.a@teste.local
administrativo.a@teste.local
eng.medicoes.a@teste.local
eng.planejamento.a@teste.local
eng.completo.a@teste.local
```

Nunca reutilizar essa senha fora do ambiente local.

## Testes pgTAP

- `001_estrutura.test.sql`: tabelas, RLS, grants e views;
- `002_rls.test.sql`: isolamento TESTE-A × TESTE-B e matriz de papéis;
- `003_financeiro.test.sql`: orçamento 100 mi → contrato 12 mi → saldo 88 mi → medição 3 mi sem liberar orçamento → aditivo 2 mi.

Todos os testes usam transação e `rollback`.

## Segurança

O script não faz `supabase link`, `db push` nem usa o project ref de produção. Ele trabalha somente com `supabase start` local.
