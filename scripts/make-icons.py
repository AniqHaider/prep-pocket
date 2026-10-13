"""Generates the Android launcher icons (adaptive foreground + legacy) — a red torii gate on navy."""
from PIL import Image, ImageDraw
import os

RES = os.path.join(os.path.dirname(__file__), '..', 'android', 'app', 'src', 'main', 'res')
NAVY, RED = (11, 15, 22, 255), (255, 90, 60, 255)

def gate(size: int, scale: float = 0.62) -> Image.Image:
    """Torii gate drawn on a transparent square canvas; `scale` = share of the canvas it occupies."""
    S = size * 4  # supersample
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    w = S * scale; x0 = (S - w) / 2; y0 = (S - w) / 2 + S * 0.01
    u = w / 100
    # top beam (kasagi) — slightly upswept ends
    d.polygon([(x0 + 0 * u, y0 + 22 * u), (x0 + 100 * u, y0 + 22 * u), (x0 + 108 * u, y0 + 6 * u), (x0 + -8 * u, y0 + 6 * u)], fill=RED)
    # second beam (nuki)
    d.rectangle([x0 + 12 * u, y0 + 32 * u, x0 + 88 * u, y0 + 42 * u], fill=RED)
    # pillars
    d.rectangle([x0 + 20 * u, y0 + 22 * u, x0 + 32 * u, y0 + 100 * u], fill=RED)
    d.rectangle([x0 + 68 * u, y0 + 22 * u, x0 + 80 * u, y0 + 100 * u], fill=RED)
    return im.resize((size, size), Image.LANCZOS)

def save(path, img):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)

dens = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for name, k in dens.items():
    base = os.path.join(RES, f'mipmap-{name}')
    fg = gate(int(108 * k), 0.50)                       # adaptive: gate stays inside the 66dp safe zone
    save(os.path.join(base, 'ic_launcher_foreground.png'), fg)
    leg = int(48 * k)
    tile = Image.new('RGBA', (leg, leg), NAVY)
    tile.alpha_composite(gate(leg, 0.74))
    sq = tile.copy(); mask = Image.new('L', (leg, leg), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, leg - 1, leg - 1], radius=int(leg * 0.2), fill=255); sq.putalpha(mask)
    save(os.path.join(base, 'ic_launcher.png'), sq)
    circ = tile.copy(); cm = Image.new('L', (leg, leg), 0)
    ImageDraw.Draw(cm).ellipse([0, 0, leg - 1, leg - 1], fill=255); circ.putalpha(cm)
    save(os.path.join(base, 'ic_launcher_round.png'), circ)

with open(os.path.join(RES, 'values', 'ic_launcher_background.xml'), 'w') as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0B0F16</color>\n</resources>\n')
print('icons written')
