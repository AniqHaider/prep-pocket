"""Preppy launcher icon and splash: a geometric lime "P" whose baseline ends in a full stop, on flat near-black.

The mark is one stroked path (stem, then a round bowl) plus a dot; no gradients, no glow, matching the app's flat design
system (docs/design.md). Everything is drawn at 4x and downsampled for clean edges.

Outputs
  mipmap-*/ic_launcher_{background,foreground,monochrome}.png   Android adaptive icon layers (foreground kept in the 66dp safe zone)
  mipmap-*/ic_launcher{,_round}.png                              legacy launchers
  drawable/ic_splash_mark.xml                                    vector launch-screen icon (crisp at any size)
  drawable/ic_launcher_fg.xml, ic_launcher_mono.xml              vector adaptive-icon layers used by mipmap-anydpi-v26
  assets/icon.png                                                512px preview used by the README
Usage: python3 scripts/make-icons.py   (needs `pip install pillow`)
"""
from PIL import Image, ImageDraw, ImageChops
import glob
import os

ROOT = os.path.join(os.path.dirname(__file__), '..')
RES = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')
SS = 4  # supersampling factor
BG = (10, 10, 11)
LIME = (198, 242, 78)  # --accent
WHITE = (255, 255, 255)


def mark_mask(S, span):
    """The P + dot as an L mask on an S×S canvas. `span` = height of the mark as a share of S."""
    m = Image.new('L', (S, S), 0)
    d = ImageDraw.Draw(m)
    h = S * span                      # overall height of the P (stem foot to stem top)
    u = h / 115.0                     # design units; the P is 115 tall including caps
    cx, top = S * 0.5 - 8 * u, (S - h) / 2 + 7.5 * u
    X = lambda v: cx + v * u
    Y = lambda v: top + v * u
    w, rc = 15, 21.5                  # stroke width, bowl centre-line radius
    ro, ri = rc + w / 2, rc - w / 2   # outer / inner bowl radius
    ell = lambda x, y, r, fill: d.ellipse([X(x - r), Y(y - r), X(x + r), Y(y + r)], fill=fill)
    bx = 16                           # where the bowl's straight run ends and the curve starts
    # outer D, then carve the counter
    d.rectangle([X(0), Y(-w / 2), X(bx), Y(2 * rc + w / 2)], fill=255)
    d.pieslice([X(bx - ro), Y(rc - ro), X(bx + ro), Y(rc + ro)], -90, 90, fill=255)  # right half only
    d.rectangle([X(w / 2), Y(w / 2), X(bx), Y(2 * rc - w / 2)], fill=0)
    d.pieslice([X(bx - ri), Y(rc - ri), X(bx + ri), Y(rc + ri)], -90, 90, fill=0)
    # stem with rounded ends
    d.rounded_rectangle([X(-w / 2), Y(-w / 2), X(w / 2), Y(100 + w / 2)], radius=int(w / 2 * u), fill=255)
    # the full stop, level with the stem's foot
    dr = 8.5
    ell(38, 100 + w / 2 - dr, dr, 255)
    return m


def layer(size, colour, span):
    S = size * SS
    out = Image.new('RGBA', (S, S), colour + (0,))
    out.putalpha(mark_mask(S, span))
    return out.resize((size, size), Image.LANCZOS)


def flat(size):
    return Image.new('RGBA', (size, size), BG + (255,))


def save(path, img):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)


dens = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for name, k in dens.items():
    base = os.path.join(RES, f'mipmap-{name}')
    px = int(108 * k)
    save(os.path.join(base, 'ic_launcher_background.png'), flat(px).convert('RGB'))
    save(os.path.join(base, 'ic_launcher_foreground.png'), layer(px, LIME, 0.40))
    save(os.path.join(base, 'ic_launcher_monochrome.png'), layer(px, WHITE, 0.40))
    leg = int(48 * k)  # legacy launchers (pre-adaptive / some OEM fallbacks)
    tile = flat(leg)
    tile.alpha_composite(layer(leg, LIME, 0.56))
    sq = tile.copy(); mk = Image.new('L', (leg, leg), 0)
    ImageDraw.Draw(mk).rounded_rectangle([0, 0, leg - 1, leg - 1], radius=int(leg * 0.22), fill=255); sq.putalpha(mk)
    save(os.path.join(base, 'ic_launcher.png'), sq)
    rd = tile.copy(); rm = Image.new('L', (leg, leg), 0)
    ImageDraw.Draw(rm).ellipse([0, 0, leg - 1, leg - 1], fill=255); rd.putalpha(rm)
    save(os.path.join(base, 'ic_launcher_round.png'), rd)

# --- vector versions of the mark: the launch screen and the adaptive icon use these so they stay sharp at any density
# (a raster foreground is upscaled by the system splash screen and looks blurred).
# Geometry in design units (P is 115 tall incl. caps): stem, bowl and the full stop, all one stroke width.
MARK_PATHS = (
    '<path android:pathData="M0,0 L0,100" android:strokeColor="{c}" android:strokeWidth="15" android:strokeLineCap="round"/>'
    '<path android:pathData="M0,0 H16 A21.5,21.5 0 0 1 16,43 H0" android:strokeColor="{c}" android:strokeWidth="15" '
    'android:strokeLineCap="round" android:strokeLineJoin="round"/>'
    '<path android:pathData="M29.5,99 a8.5,8.5 0 1,0 17,0 a8.5,8.5 0 1,0 -17,0" android:fillColor="{c}"/>'
)

def vector(viewport, mark_dp, colour):
    sc = mark_dp / 115.0
    tx, ty = viewport / 2 - 19.5 * sc, viewport / 2 - 50 * sc  # centre the mark's bounding box (x -7.5..46.5, y -7.5..107.5)
    return f'''<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="{viewport}dp" android:height="{viewport}dp" android:viewportWidth="{viewport}" android:viewportHeight="{viewport}">
    <group android:translateX="{tx:.2f}" android:translateY="{ty:.2f}" android:scaleX="{sc:.4f}" android:scaleY="{sc:.4f}">
        {MARK_PATHS.format(c=colour)}
    </group>
</vector>
'''

def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as fh:
        fh.write(text)

write(os.path.join(RES, 'drawable', 'ic_launcher_fg.xml'), vector(108, 43.2, '#C6F24E'))      # 40% of the 108dp canvas, inside the 66dp safe zone
write(os.path.join(RES, 'drawable', 'ic_launcher_mono.xml'), vector(108, 43.2, '#FFFFFF'))
write(os.path.join(RES, 'drawable', 'ic_splash_mark.xml'), vector(288, 84, '#C6F24E'))        # splash icon area is 288dp, visible circle 192dp

adaptive = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_fg"/>
    <monochrome android:drawable="@drawable/ic_launcher_mono"/>
</adaptive-icon>
'''
for f in ('ic_launcher.xml', 'ic_launcher_round.xml'):
    write(os.path.join(RES, 'mipmap-anydpi-v26', f), adaptive)

# README preview: the adaptive icon with a rounded mask at 512px
big = flat(512)
big.alpha_composite(layer(512, LIME, 0.52))
mk = Image.new('L', (512, 512), 0)
ImageDraw.Draw(mk).rounded_rectangle([0, 0, 511, 511], radius=112, fill=255); big.putalpha(mk)
save(os.path.join(ROOT, 'assets', 'icon.png'), big)
print('icons written')
