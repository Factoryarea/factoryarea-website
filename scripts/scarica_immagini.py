#!/usr/bin/env python3
"""
Scarica le foto del vecchio sito Framer e le salva, ottimizzate, in assets/img.

Viene eseguito in automatico da GitHub (.github/workflows/pubblica.yml) la prima
volta che il sito viene pubblicato. Si può lanciare anche a mano:

    pip install pillow
    python3 scripts/scarica_immagini.py

Per ogni foto crea due versioni JPEG (lato lungo 1024 px e 2048 px): il browser
sceglie quella giusta in base allo schermo. I dati EXIF (es. posizione GPS)
vengono rimossi.
"""
import io
import sys
import urllib.request
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Manca Pillow: installalo con  pip install pillow")

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "assets" / "img"
CDN = "https://framerusercontent.com/images/"

# percorso di destinazione (senza estensione)  ->  file sul CDN di Framer
FOTO = {
    "edizioni/2025/copertina": "vfHNpOCKerT8sIjXghkBjzKts.jpg",
    "edizioni/2025/foto-1": "wZQL7VO9mMLfmboyPQo1PVROBeQ.jpg",
    "edizioni/2025/foto-2": "mbm93SFHY7rS3p4OIqCwKxjLisE.jpg",
    "edizioni/2025/foto-3": "kdmiXfdg0s5eizGyUpJtiA01vnc.jpg",
    "edizioni/2025/foto-4": "S3Y7jS9AZWPNdE6msdCJC59AmM.png",
    "edizioni/2024/copertina": "aHgEG42uoc0Iyx0heswrcXF2qk.jpg",
    "edizioni/2024/foto-1": "nQndGqATdrupX9eTzGbXr8HUA.jpg",
    "edizioni/2024/foto-2": "WVdpJpocgekL82qSmqrsflxEvlk.jpg",
    "edizioni/2024/foto-3": "iRrRrH4epQHYl6xv1AaBEXNHeg.jpg",
    "edizioni/2024/foto-4": "bkNztmSAlXSk2xiBjvla0cCcqjI.jpg",
    "edizioni/2023/copertina": "JjmmEI81hz21nlmdou8p1hXTkU.jpg",
    "edizioni/2023/foto-1": "aejgxB8xBYERz2IidjRfUJLfSp8.jpg",
    "edizioni/2023/foto-2": "7cL3c1LgLwdp3QSjJEiNubogiA.jpg",
    "edizioni/2023/foto-3": "i8eHNzvapEsp5NAeoH1AJbz7eQ.jpg",
    "edizioni/2023/foto-4": "PEMz9F9FDYAejapozGpEobWhqxY.jpg",
    "edizioni/2022/copertina": "VTGK4EXTLPZLbrf3dveOXrCEz0.jpg",
    "edizioni/2022/foto-1": "3zcl5E8qeShqX300FeEmgW5fuNk.jpg",
    "edizioni/2022/foto-2": "kAx1tN7SciTFDrHUZU2wS0Zcw.jpg",
    "edizioni/2022/foto-3": "1gI3NNm2qv8jzNtTqaVxdX6Gty4.jpg",
    "edizioni/2022/foto-4": "tn3jP78gnLS50RLon366n6BrUU.jpg",
    "edizioni/2021/copertina": "uhddYWNTLGY8CGtFWc56FECQ.jpg",
    "edizioni/2021/foto-1": "tnPkKT8DWNk8JRQSjUibk9XvA.jpg",
    "edizioni/2021/foto-2": "N4Dpi88EWIz41KNWV4URUfZs.jpg",
    "edizioni/2021/foto-3": "oon70kgSJMzSnwTwuwfhHfrXQU.jpg",
    "edizioni/2021/foto-4": "Ny1RJULFXT0r1MAUzEjpC2Az4k.jpg",
}

# file copiati così come sono (icone e anteprima social)
FILE = {
    "og-image.png": "https://framerusercontent.com/assets/0mYBVX2yJOSGkekJYXb6QxA0a4.png",
    "favicon-light.png": CDN + "kRMnGjBULyS2M1UfnKqWyN5yQs4.png",
    "favicon-dark.png": CDN + "Xd4AwKDDv2JJr8EXSROAUcSBrHw.png",
    "apple-touch-icon.png": CDN + "Xd4AwKDDv2JJr8EXSROAUcSBrHw.png",
}

SIZES = (1024, 2048)


def download(url):
    req = urllib.request.Request(url, headers={"User-Agent": "factoryarea-site-builder"})
    with urllib.request.urlopen(req, timeout=120) as res:
        return res.read()


def save_versions(data, dest_base):
    im = Image.open(io.BytesIO(data))
    im = ImageOps.exif_transpose(im)
    if im.mode not in ("RGB", "L"):
        background = Image.new("RGB", im.size, (20, 21, 23))
        im = im.convert("RGBA")
        background.paste(im, mask=im.split()[-1])
        im = background
    else:
        im = im.convert("RGB")
    dest_base.parent.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        copy = im.copy()
        copy.thumbnail((size, size), Image.LANCZOS)
        out = dest_base.parent / f"{dest_base.name}-{size}.jpg"
        copy.save(out, "JPEG", quality=82 if size > 1024 else 80, optimize=True, progressive=True)
        print(f"  {out.relative_to(ROOT)}  {copy.size[0]}x{copy.size[1]}")


def main():
    force = "--forza" in sys.argv
    errors = 0
    for dest, name in FOTO.items():
        base = IMG_DIR / dest
        if not force and (base.parent / f"{base.name}-2048.jpg").exists():
            continue
        url = CDN + name + "?scale-down-to=4096"
        print(f"Scarico {name}")
        try:
            save_versions(download(url), base)
        except Exception as exc:  # noqa: BLE001
            errors += 1
            print(f"  ERRORE: {exc}")
    for dest, url in FILE.items():
        out = IMG_DIR / dest
        if out.exists() and not force:
            continue
        print(f"Scarico {dest}")
        try:
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_bytes(download(url))
        except Exception as exc:  # noqa: BLE001
            errors += 1
            print(f"  ERRORE: {exc}")
    if errors:
        sys.exit(f"{errors} file non scaricati")
    print("Fatto.")


if __name__ == "__main__":
    main()
