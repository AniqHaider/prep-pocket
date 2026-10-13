"""Kata launcher icon: a torii gate (the dojo) with a terminal prompt (the code), as an Android adaptive icon.

Layers (all drawn at 4x and downsampled for clean edges):
  background  – deep indigo → near-black radial gradient
  foreground  – glowing ember-orange gate + cyan `>_` prompt, kept inside the 66dp adaptive safe zone
  monochrome  – white silhouette of the same artwork for Android 13+ themed icons
Also writes a 512px preview to assets/icon.png and legacy square/round launcher PNGs.
"""
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import os

ROOT = os.path.join(os.path.dirname(__file__), '..')
RES = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')
SS = 4  # supersampling factor

def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))

def background(size):
    """Radial gradient: lighter indigo glow top-centre fading to near-black at the corners."""
    S = size * SS
    inner, outer = (46, 40, 112), (9, 11, 22)
    im = Image.new('RGB', (S, S), outer)
    px = im.load()
    cx, cy, rmax = S * 0.5, S * 0.36, S * 0.78
    for y in range(0, S, 2):
        for x in range(0, S, 2):
            t = min(1.0, (((x - cx) ** 2 + (y - cy) ** 2) ** 0.5) / rmax)
            c = lerp(inner, outer, t ** 0.85)
            px[x, y] = c
            if x + 1 < S: px[x + 1, y] = c
            if y + 1 < S:
                px[x, y + 1] = c
                if x + 1 < S: px[x + 1, y + 1] = c
    return im.resize((size, size), Image.LANCZOS).convert('RGBA')

def gate_mask(S, scale):
    """Torii gate silhouette as an L mask on an S×S canvas, `scale` = share of the canvas it spans."""
    m = Image.new('L', (S, S), 0)
    d = ImageDraw.Draw(m)
    w = S * scale
    x0 = (S - w) / 2
    y0 = S * 0.5 - w * 0.5 - w * 0.02
    u = w / 100.0
    X = lambda v: x0 + v * u
    Y = lambda v: y0 + v * u
    # kasagi: the sweeping top beam, ends curving up
    d.polygon([(X(-6), Y(10)), (X(6), Y(15)), (X(25), Y(19)), (X(50), Y(20.5)), (X(75), Y(19)), (X(94), Y(15)), (X(106), Y(10)),
               (X(103), Y(4)), (X(88), Y(8.5)), (X(50), Y(10)), (X(12), Y(8.5)), (X(-3), Y(4))], fill=255)
    # shimaki: thin cap beam under the kasagi
    d.rectangle([X(4), Y(21), X(96), Y(26)], fill=255)
    # nuki: lower tie beam, extends past the pillars
    d.rectangle([X(10), Y(38), X(90), Y(46)], fill=255)
    # pillars: slightly tapered toward the top, with base plates
    d.polygon([(X(20), Y(26)), (X(31), Y(26)), (X(33), Y(96)), (X(18), Y(96))], fill=255)
    d.polygon([(X(69), Y(26)), (X(80), Y(26)), (X(82), Y(96)), (X(67), Y(96))], fill=255)
    d.rectangle([X(15), Y(96), X(36), Y(100)], fill=255)
    d.rectangle([X(64), Y(96), X(85), Y(100)], fill=255)
    return m, (x0, y0, u)

def prompt_mask(S, geo):
    """`>_` terminal prompt between the pillars."""
    x0, y0, u = geo
    X = lambda v: x0 + v * u
    Y = lambda v: y0 + v * u
    m = Image.new('L', (S, S), 0)
    d = ImageDraw.Draw(m)
    lw = int(4.2 * u)
    d.line([(X(40), Y(55)), (X(51), Y(66)), (X(40), Y(77))], fill=255, width=lw, joint='curve')
    for cx, cy in [(X(40), Y(55)), (X(51), Y(66)), (X(40), Y(77))]:
        d.ellipse([cx - lw / 2, cy - lw / 2, cx + lw / 2, cy + lw / 2], fill=255)
    d.rounded_rectangle([X(55), Y(76), X(67), Y(80.5)], radius=int(2 * u), fill=255)
    return m

def vertical_gradient(S, top, bottom):
    g = Image.new('RGBA', (S, S))
    gd = ImageDraw.Draw(g)
    for y in range(S):
        gd.line([(0, y), (S, y)], fill=lerp(top, bottom, y / (S - 1)) + (255,))
    return g

def foreground(size, scale=0.52, glow=True):
    S = size * SS
    gate, geo = gate_mask(S, scale)
    prompt = prompt_mask(S, geo)
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    if glow:  # soft ember glow behind the gate
        halo = gate.filter(ImageFilter.GaussianBlur(S * 0.022))
        glow_layer = Image.new('RGBA', (S, S), (255, 96, 48, 0))
        glow_layer.putalpha(halo.point(lambda v: int(v * 0.55)))
        out.alpha_composite(glow_layer)
    ember = vertical_gradient(S, (255, 150, 72), (236, 52, 34))
    ember.putalpha(gate)
    out.alpha_composite(ember)
    cyan_glow = Image.new('RGBA', (S, S), (125, 211, 252, 0))
    cyan_glow.putalpha(prompt.filter(ImageFilter.GaussianBlur(S * 0.012)).point(lambda v: int(v * 0.6)))
    out.alpha_composite(cyan_glow)
    cyan = Image.new('RGBA', (S, S), (160, 228, 255, 255))
    cyan.putalpha(prompt)
    out.alpha_composite(cyan)
    return out.resize((size, size), Image.LANCZOS)

def monochrome(size, scale=0.52):
    S = size * SS
    gate, geo = gate_mask(S, scale)
    prompt = prompt_mask(S, geo)
    alpha = ImageChops.lighter(gate, prompt)
    out = Image.new('RGBA', (S, S), (255, 255, 255, 0))
    out.putalpha(alpha)
    return out.resize((size, size), Image.LANCZOS)

def save(path, img):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)

dens = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for name, k in dens.items():
    base = os.path.join(RES, f'mipmap-{name}')
    px = int(108 * k)
    save(os.path.join(base, 'ic_launcher_background.png'), background(px).convert('RGB'))
    save(os.path.join(base, 'ic_launcher_foreground.png'), foreground(px))
    save(os.path.join(base, 'ic_launcher_monochrome.png'), monochrome(px))
    leg = int(48 * k)  # legacy launchers (pre-adaptive / some OEM fallbacks)
    tile = background(leg)
    tile.alpha_composite(foreground(leg, scale=0.80, glow=False))
    sq = tile.copy(); mk = Image.new('L', (leg, leg), 0)
    ImageDraw.Draw(mk).rounded_rectangle([0, 0, leg - 1, leg - 1], radius=int(leg * 0.22), fill=255); sq.putalpha(mk)
    save(os.path.join(base, 'ic_launcher.png'), sq)
    rd = tile.copy(); rm = Image.new('L', (leg, leg), 0)
    ImageDraw.Draw(rm).ellipse([0, 0, leg - 1, leg - 1], fill=255); rd.putalpha(rm)
    save(os.path.join(base, 'ic_launcher_round.png'), rd)

adaptive = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>
'''
for f in ('ic_launcher.xml', 'ic_launcher_round.xml'):
    with open(os.path.join(RES, 'mipmap-anydpi-v26', f), 'w') as fh: fh.write(adaptive)

# README / store preview: the adaptive icon composited at 512px with a rounded mask
big = background(512)
big.alpha_composite(foreground(512, scale=0.62))
mk = Image.new('L', (512, 512), 0)
ImageDraw.Draw(mk).rounded_rectangle([0, 0, 511, 511], radius=112, fill=255); big.putalpha(mk)
save(os.path.join(ROOT, 'assets', 'icon.png'), big)
print('icons written')
