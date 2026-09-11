from pathlib import Path

base = Path(__file__).resolve().parents[1]
p = base / "sql" / "00_v1_schema_baseline.sql"
assert p.exists(), "Baseline V1 ausente"

s = p.read_text(encoding="utf-8")
low = s.lower()

expected = {
    "tables": 34,
    "views": 12,
    "functions": 11,
    "triggers": 9,
    "rls": 34,
}

actual = {
    "tables": low.count("create table public."),
    "views": low.count("create or replace view public."),
    "functions": low.count("create or replace function public."),
    "triggers": low.count("create trigger "),
    "rls": low.count(" enable row level security;"),
}

assert actual == expected, f"Baseline divergente: {actual} != {expected}"
assert "baseline reconstruído do schema atual" in low
assert "não é o sql original das 37 migrations" in low
assert "security_invoker=true" in low
assert "create policy solicitacao_anon_insere" in low
assert "create trigger ao_criar_usuario" in low
assert s.strip().endswith("commit;")
assert s.count("$$") % 2 == 0

print("OK V1 reconstructed baseline")
for k, v in actual.items():
    print(f"  {k}: {v}")
