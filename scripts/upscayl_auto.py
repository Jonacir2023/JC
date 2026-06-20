#!/usr/bin/env python3
"""
upscayl_auto.py — Automação CLI para o Upscayl no macOS.

Modos:
  batch    Processa todas as imagens de uma pasta de entrada.
  watch    Monitora uma pasta e processa novas imagens automaticamente.
  single   Upscala uma única imagem.

Uso:
  python upscayl_auto.py batch  -i ~/Fotos/originais -o ~/Fotos/upscaladas
  python upscayl_auto.py watch  -i ~/Fotos/originais -o ~/Fotos/upscaladas
  python upscayl_auto.py single -i ~/Fotos/foto.jpg  -o ~/Fotos/foto_4x.jpg

Opções comuns:
  --scale   Fator de escala: 2, 4 (padrão) ou 8
  --model   Modelo de IA (padrão: realesrgan-x4plus)
  --format  Formato de saída: png (padrão), jpg, webp
"""

import argparse
import subprocess
import sys
import time
import hashlib
from pathlib import Path

# Caminho padrão do binário dentro do Upscayl.app
UPSCAYL_BIN = Path("/Applications/Upscayl.app/Contents/MacOS/upscayl-bin")
MODELS_PATH = Path("/Applications/Upscayl.app/Contents/Resources/models")

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}

MODELS = [
    "realesrgan-x4plus",        # qualidade geral (padrão)
    "realesrgan-x4plus-anime",  # ilustrações/anime
    "realesrnet-x4plus",        # mais rápido
    "remacri",                  # artes digitais
    "ultramix_balanced",        # equilibrado
    "ultrasharp",               # muito nítido
]


def check_binary():
    if not UPSCAYL_BIN.exists():
        print(f"[ERRO] Binário não encontrado em: {UPSCAYL_BIN}")
        print("Verifique se o Upscayl está instalado em /Applications/.")
        sys.exit(1)


def file_hash(path: Path) -> str:
    return hashlib.md5(path.read_bytes()).hexdigest()


def upscale(input_path: Path, output_path: Path, scale: int, model: str, fmt: str) -> bool:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # O upscayl-bin espera o output sem extensão (ele adiciona automaticamente)
    output_stem = output_path.parent / output_path.stem

    cmd = [
        str(UPSCAYL_BIN),
        "-i", str(input_path),
        "-o", str(output_stem),
        "-s", str(scale),
        "-m", str(MODELS_PATH),
        "-n", model,
        "-f", fmt,
    ]

    print(f"[→] {input_path.name}  (escala {scale}x, modelo {model})")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode == 0:
        print(f"[✓] Salvo em: {output_stem}.{fmt}")
        return True
    else:
        print(f"[✗] Falhou: {result.stderr.strip()}")
        return False


def build_output_path(input_path: Path, output_dir: Path, fmt: str) -> Path:
    return output_dir / f"{input_path.stem}_upscayl.{fmt}"


def mode_single(args):
    check_binary()
    inp = Path(args.input).expanduser().resolve()
    out = Path(args.output).expanduser().resolve()
    if not inp.exists():
        print(f"[ERRO] Arquivo não encontrado: {inp}")
        sys.exit(1)
    upscale(inp, out, args.scale, args.model, args.format)


def mode_batch(args):
    check_binary()
    inp_dir = Path(args.input).expanduser().resolve()
    out_dir = Path(args.output).expanduser().resolve()

    if not inp_dir.is_dir():
        print(f"[ERRO] Pasta não encontrada: {inp_dir}")
        sys.exit(1)

    images = [f for f in inp_dir.iterdir() if f.suffix.lower() in IMAGE_EXTENSIONS]
    if not images:
        print("[AVISO] Nenhuma imagem encontrada na pasta.")
        return

    print(f"[i] {len(images)} imagem(ns) encontrada(s) em {inp_dir}")
    ok = fail = 0
    for img in sorted(images):
        out = build_output_path(img, out_dir, args.format)
        if out.exists() and not args.force:
            print(f"[–] Pulado (já existe): {out.name}")
            continue
        if upscale(img, out, args.scale, args.model, args.format):
            ok += 1
        else:
            fail += 1

    print(f"\n[=] Concluído: {ok} sucesso(s), {fail} falha(s).")


def mode_watch(args):
    check_binary()
    inp_dir = Path(args.input).expanduser().resolve()
    out_dir = Path(args.output).expanduser().resolve()

    if not inp_dir.is_dir():
        print(f"[ERRO] Pasta não encontrada: {inp_dir}")
        sys.exit(1)

    print(f"[👁] Monitorando: {inp_dir}")
    print("[i] Pressione Ctrl+C para parar.\n")

    seen: dict[Path, str] = {}

    # Registra imagens já existentes sem processar
    for f in inp_dir.iterdir():
        if f.suffix.lower() in IMAGE_EXTENSIONS:
            seen[f] = file_hash(f)

    while True:
        try:
            for f in inp_dir.iterdir():
                if f.suffix.lower() not in IMAGE_EXTENSIONS:
                    continue
                current_hash = file_hash(f)
                if f not in seen or seen[f] != current_hash:
                    seen[f] = current_hash
                    out = build_output_path(f, out_dir, args.format)
                    if not out.exists() or args.force:
                        upscale(f, out, args.scale, args.model, args.format)
            time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\n[i] Monitoramento encerrado.")
            break


def main():
    parser = argparse.ArgumentParser(
        description="Automação do Upscayl via linha de comando.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--scale", type=int, default=4, choices=[2, 4, 8],
                        help="Fator de escala (padrão: 4)")
    parser.add_argument("--model", default="realesrgan-x4plus", choices=MODELS,
                        help="Modelo de IA (padrão: realesrgan-x4plus)")
    parser.add_argument("--format", default="png", choices=["png", "jpg", "webp"],
                        help="Formato de saída (padrão: png)")
    parser.add_argument("--force", action="store_true",
                        help="Reprocessar mesmo se o arquivo de saída já existir")

    sub = parser.add_subparsers(dest="mode", required=True)

    # single
    p_single = sub.add_parser("single", help="Upscala uma única imagem")
    p_single.add_argument("-i", "--input", required=True, help="Arquivo de entrada")
    p_single.add_argument("-o", "--output", required=True, help="Arquivo de saída")

    # batch
    p_batch = sub.add_parser("batch", help="Processa todas as imagens de uma pasta")
    p_batch.add_argument("-i", "--input", required=True, help="Pasta de entrada")
    p_batch.add_argument("-o", "--output", required=True, help="Pasta de saída")

    # watch
    p_watch = sub.add_parser("watch", help="Monitora pasta e processa novas imagens")
    p_watch.add_argument("-i", "--input", required=True, help="Pasta monitorada")
    p_watch.add_argument("-o", "--output", required=True, help="Pasta de saída")
    p_watch.add_argument("--interval", type=float, default=3.0,
                         help="Intervalo de checagem em segundos (padrão: 3)")

    args = parser.parse_args()

    if args.mode == "single":
        mode_single(args)
    elif args.mode == "batch":
        mode_batch(args)
    elif args.mode == "watch":
        mode_watch(args)


if __name__ == "__main__":
    main()
