#!/usr/bin/env python3
"""docs/readme/build.py — typesets the plates of the project README.

The plates are set in EB Garamond (Georg Duffner, SIL Open Font License),
shaped with HarfBuzz (kerning, ligatures, small caps, old-style figures) and
converted to outlines with fontTools, so every SVG renders the same anywhere
without a font. The plates are transparent and inked twice — for GitHub's
light themes and for its dark ones; the README picks one with <picture>.

    python3 docs/readme/build.py          # writes docs/readme/*.svg

Needs python3 with fontTools, HarfBuzz's `hb-shape` (brew install harfbuzz)
and Duffner's EB Garamond OTFs (EBGaramond12-*, EBGaramond08-*,
EBGaramond-Initials*) in a font folder or $FONT_DIR.
"""

import collections
import functools
import json
import math
import os
import re
import subprocess
from contextlib import contextmanager

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))

# ─── Fonts ──────────────────────────────────────────────────────────────────

FONT_FILES = {  # key: (file, face in a collection, size factor)
    'rm': ('EBGaramond12-Regular.otf', 0, 1.0),     # text & display
    'it': ('EBGaramond12-Italic.otf', 0, 1.0),
    'rm8': ('EBGaramond08-Regular.otf', 0, 1.0),    # the sturdier cut for small sizes
    'it8': ('EBGaramond08-Italic.otf', 0, 1.0),
    'mono': ('PTMono.ttc', 1, 1.0),                 # code (ParaType Free Font License)
    'code': ('PTMono.ttc', 1, 0.82),                # code inside Garamond text, matched to its x-height
}
FONT_DIRS = [os.environ.get('FONT_DIR'), '~/Library/Fonts', '/Library/Fonts', '/System/Library/Fonts/Supplemental',
             '~/.fonts', '~/.local/share/fonts', '/usr/share/fonts', '/usr/local/share/fonts']


def find_font(name):
    for d in FONT_DIRS:
        if not d:
            continue
        d = os.path.expanduser(d)
        for base, _, files in os.walk(d):
            if name in files:
                return os.path.join(base, name)
    raise SystemExit(f'font not found: {name} (set FONT_DIR)')


class Font:
    def __init__(self, key):
        self.key = key
        name, self.face, self.scale = FONT_FILES[key]
        self.path = find_font(name)
        self.tt = TTFont(self.path, fontNumber=self.face) if name.endswith('.ttc') else TTFont(self.path)
        self.glyphs = self.tt.getGlyphSet()
        self.upm = self.tt['head'].unitsPerEm
        self._d = {}

    def outline(self, name):
        if name not in self._d:
            pen = SVGPathPen(self.glyphs, ntos=lambda v: str(round(v)))
            self.glyphs[name].draw(pen)
            self._d[name] = pen.getCommands()
        return self._d[name]


FONTS = {}


def font(key):
    if key not in FONTS:
        FONTS[key] = Font(key)
    return FONTS[key]


@functools.lru_cache(maxsize=None)
def shape(fk, text, feats=''):
    """HarfBuzz shaping → ((glyph name, advance, dx, dy), …) in font units."""
    if not text:
        return ()
    f = font(fk)
    args = ['hb-shape', '--output-format=json', f'--face-index={f.face}', f.path, '--text=' + text]
    if feats:
        args.insert(2, '--features=' + feats)
    out = json.loads(subprocess.run(args, capture_output=True, text=True, check=True).stdout)
    return tuple((g['g'], g['ax'], g['dx'], g['dy']) for g in out)


def measure(text, size, fk='rm', feats='', ls=0.0):
    gl = shape(fk, text, feats)
    f = font(fk)
    return (sum(g[1] for g in gl) + ls * f.upm * max(0, len(gl) - 1)) * size * f.scale / f.upm


# ─── Printings ──────────────────────────────────────────────────────────────

THEMES = {
    # GitHub's light themes: its own text colours, rubricated in vermilion.
    'light': dict(ink='#1F2328', ink2='#59636E', accent='#BC3F26', pencil='#B9BFC6'),
    # Every dark theme (dark, dimmed, high contrast): light ink, a coral accent.
    'dark': dict(ink='#D6DDE4', ink2='#8B949E', accent='#F0876C', pencil='#4B535D'),
}

# Line weights (ISO 128: wide 2 : narrow 1) and patterns, in plate units.
THICK, THIN, FINE = 2.4, 1.15, 0.8
DASHED = '7 3.5'            # hidden lines
CHAIN = '20 4 2.5 4'        # centre lines, cutting planes

# Every plate is inked over a pencil underdrawing: each drawn line exists twice,
# a static pencil line and an animated ink line on top of it. Browsers start an
# image's animation when it is first painted, so a plate is inked as it scrolls
# into view. The first frame is a finished drawing in pencil with all its type,
# so anything that freezes the image (a paused tab, autoplay switched off, a
# rasteriser) still shows a complete plate. Running heads do not move.
CSS = """
.d{animation:draw 1.1s cubic-bezier(.65,.04,.35,1) both}
@keyframes draw{from{stroke-dasharray:0 1}to{stroke-dasharray:1 0}}
@media (prefers-reduced-motion:reduce){.d{animation:none}}
"""


def n(v):
    """Compact number formatting for coordinates."""
    s = f'{v:.1f}'
    return s[:-2] if s.endswith('.0') else s


class Plate:
    """One SVG plate: glyph outlines are defined once and placed with <use>."""

    def __init__(self, w, h, theme, title, desc, animate=True):
        self.w, self.h, self.t = w, h, THEMES[theme]
        self.crop = None                 # (x0, y0, x1, y1): the part of the plate an SVG shows
        self.box = [math.inf, math.inf, -math.inf, -math.inf]
        self.head = None                 # (numeral, title, right): a running head set as its own image
        self.tracking = True
        self.theme = theme
        self.title, self.desc = title, desc
        self.animate = animate
        self.body = []
        self.glyph_ids = {}
        self.defs = []

    # ── low level ──
    def add(self, s):
        self.body.append(s)

    def grow(self, x0, y0, x1, y1):
        """Content bounds, for cropping. Rotated work is drawn untracked and
        grows the bounds by its rotated extent instead."""
        if not self.tracking:
            return
        b = self.box
        b[0], b[1], b[2], b[3] = min(b[0], x0, x1), min(b[1], y0, y1), max(b[2], x0, x1), max(b[3], y0, y1)

    def anim(self, cls, delay):
        if not self.animate or cls != 'd':
            return ''   # only lines are inked; type and fills are there from the first frame
        return f' class="{cls}" style="animation-delay:{delay:.2f}s"'

    def pencil(self, cls, fill):
        """Whether a drawn element also gets its static pencil twin."""
        return self.animate and cls == 'd' and fill == 'none'

    @contextmanager
    def group(self, cls=None, delay=0.0, attrs=''):
        self.add(f'<g{self.anim(cls, delay)}{(" " + attrs) if attrs else ""}>')
        yield
        self.add('</g>')

    def gid(self, fk, name):
        key = (fk, name)
        if key not in self.glyph_ids:
            self.glyph_ids[key] = f'g{len(self.glyph_ids)}'
        return self.glyph_ids[key]

    # ── type ──
    def text(self, x, y, s, size, fk='rm', feats='', ls=0.0, fill=None, anchor='start', cls=None, delay=0.0):
        """Set one run on the baseline y; returns its width."""
        if not s:
            return 0.0
        f = font(fk)
        gl = shape(fk, s, feats)
        sc = size * f.scale / f.upm
        width = (sum(g[1] for g in gl) + ls * f.upm * max(0, len(gl) - 1)) * sc
        x0 = x - width if anchor == 'end' else x - width / 2 if anchor == 'middle' else x
        uses, pen = [], 0.0
        for name, ax, dx, dy in gl:
            if font(fk).outline(name):
                ydy = f' y="{-dy}"' if dy else ''
                uses.append(f'<use xlink:href="#{self.gid(fk, name)}" x="{round(pen + dx)}"{ydy}/>')
            pen += ax + ls * f.upm
        fill = fill or self.t['ink']
        self.grow(x0, y - size * 0.72, x0 + width, y + size * 0.28)
        self.add(f'<g{self.anim(cls, delay)}><g transform="translate({n(x0)} {n(y)}) scale({sc:.5f} {-sc:.5f})" '
                 f'fill="{fill}">{"".join(uses)}</g></g>')
        return width

    def rich(self, x, y, pieces, size, fill=None, cls=None, delay=0.0, anchor='start'):
        """Set a line made of (text, fk, feats) pieces; returns its width."""
        w = sum(measure(pc[0], size, pc[1], pc[2]) for pc in pieces)
        x0 = x - w if anchor == 'end' else x - w / 2 if anchor == 'middle' else x
        with self.group(cls, delay):
            for pc in pieces:
                x0 += self.text(x0, y, pc[0], size, pc[1], pc[2], fill=pc[3] if len(pc) > 3 else fill)
        return w

    # ── lines ──
    def path(self, d, w=THIN, color=None, fill='none', dash=None, cls=None, delay=0.0, cap='butt', extra=''):
        color = color or self.t['ink']
        dash_a = f' stroke-dasharray="{dash}"' if dash else ''
        pl = ' pathLength="1"' if (cls == 'd' and self.animate) else ''
        stroke = f' stroke="{color}" stroke-width="{w}"' if w else ''
        if w and self.pencil(cls, fill):
            self.add(f'<path d="{d}" fill="none" stroke="{self.t["pencil"]}" stroke-width="{min(w, 1.0)}"'
                     f'{dash_a} opacity=".75"/>')
        self.add(f'<path d="{d}" fill="{fill}"{stroke}{dash_a} stroke-linecap="{cap}"'
                 f' stroke-linejoin="round"{pl}{self.anim(cls, delay)}{extra}/>')

    def line(self, x1, y1, x2, y2, w=THIN, **kw):
        self.grow(x1, y1, x2, y2)
        self.path(f'M{n(x1)} {n(y1)}L{n(x2)} {n(y2)}', w, **kw)

    def poly(self, pts, w=THIN, close=False, **kw):
        for x, y in pts:
            self.grow(x, y, x, y)
        d = 'M' + 'L'.join(f'{n(x)} {n(y)}' for x, y in pts) + ('Z' if close else '')
        self.path(d, w, **kw)

    def circle(self, cx, cy, r, w=THIN, color=None, fill='none', dash=None, cls=None, delay=0.0):
        self.grow(cx - r, cy - r, cx + r, cy + r)
        color = color or self.t['ink']
        dash_a = f' stroke-dasharray="{dash}"' if dash else ''
        pl = ' pathLength="1"' if (cls == 'd' and self.animate) else ''
        if self.pencil(cls, fill):
            self.add(f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" fill="none" stroke="{self.t["pencil"]}" '
                     f'stroke-width="{min(w, 1.0)}"{dash_a} opacity=".75"/>')
        self.add(f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" fill="{fill}" stroke="{color}" '
                 f'stroke-width="{w}"{dash_a}{pl}{self.anim(cls, delay)}/>')

    def arrow(self, x, y, dx, dy, length=12.0, half=2.1, color=None, cls=None, delay=0.0):
        """Filled arrowhead with its tip at (x, y), pointing along (dx, dy)."""
        L = math.hypot(dx, dy)
        ux, uy = dx / L, dy / L
        bx, by = x - ux * length, y - uy * length
        pts = [(x, y), (bx - uy * half, by + ux * half), (bx + uy * half, by - ux * half)]
        self.poly(pts, 0, close=True, fill=color or self.t['ink'], cls=cls, delay=delay)

    # ── output ──
    def svg(self):
        glyphs = ''.join(f'<path id="{i}" d="{font(fk).outline(g)}"/>' for (fk, g), i in self.glyph_ids.items())
        style = f'<style>{CSS}</style>' if self.animate else ''
        x0, y0, x1, y1 = self.crop or (0, 0, self.w, self.h)
        w, h = round(x1 - x0), round(y1 - y0)
        return (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
                f'width="{w}" height="{h}" viewBox="{n(x0)} {n(y0)} {w} {h}" role="img" aria-labelledby="t d">'
                f'<title id="t">{esc(self.title)}</title><desc id="d">{esc(self.desc)}</desc>'
                f'{style}<defs>{"".join(self.defs)}{glyphs}</defs>'
                f'{"".join(self.body)}</svg>')


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


# ─── Composition helpers ────────────────────────────────────────────────────

def oxford_rule(p, x1, x2, y, cls=None, delay=0.0, color=None):
    """The thick-thin rule of title pages."""
    p.line(x1, y, x2, y, 3.2, color=color, cls=cls, delay=delay)
    p.line(x1, y + 6, x2, y + 6, 0.9, color=color, cls=cls, delay=delay + 0.15)


def running_head(p, y, left, centre, right, x1, x2, delay=0.0):
    sz = 21
    p.text(x1, y, left, sz, 'rm8', 'smcp,c2sc,onum', ls=0.14, cls='f', delay=delay)
    p.text((x1 + x2) / 2, y, centre, sz, 'rm8', 'smcp,c2sc', ls=0.2, anchor='middle', cls='f', delay=delay)
    p.text(x2, y, right, sz, 'it8', 'onum', anchor='end', cls='f', delay=delay, fill=p.t['ink2'])
    p.line(x1, y + 14, x2, y + 14, FINE, cls='d', delay=delay)


MARKUP = re.compile(r'(_[^_]+_|\^[^^]+\^|`[^`]+`|~[^~]+~)')


def tie(text):
    """Typographic ties: no line starts with an em dash, no standard number
    leaves its body, no initial stands alone."""
    text = text.replace(' —', '\u00a0—')
    return re.sub(r'(\^iso\^|ISO) (\d)', '\\1\u00a0\\2', text)


def parse(text, base='rm', feats='onum,pnum'):
    """Tiny markup: _italic_, ^small caps^, `code` (PT Mono), ~roman~."""
    text = tie(text)
    ital = 'it8' if base.endswith('8') else 'it'
    roman = 'rm8' if base.endswith('8') else 'rm'
    out = []
    for part in MARKUP.split(text):
        if not part:
            continue
        if part[0] == '_':
            out.append((part[1:-1], ital, feats))
        elif part[0] == '^':
            out.append((part[1:-1], base, 'smcp,c2sc,' + feats))
        elif part[0] == '`':
            out.append((part[1:-1], 'code', ''))
        elif part[0] == '~':
            out.append((part[1:-1], roman, feats))
        else:
            out.append((part, base, feats))
    return out


def words_of(pieces):
    """Split styled pieces into words; a word may span several pieces."""
    words, cur = [], []
    for t, fk, ft in pieces:
        chunks = t.split(' ')
        for i, c in enumerate(chunks):
            if i > 0 and cur:
                words.append(cur)
                cur = []
            if c:
                cur.append((c, fk, ft))
    if cur:
        words.append(cur)
    return words


def break_lines(widths, space, measure_w, justify):
    """Total-fit line breaking (Knuth–Plass without hyphenation).

    Ragged: minimise the squared slack of every line but the last.
    Justified: minimise demerits of the stretched/shrunk inter-word spaces."""
    nw = len(widths)
    best = [math.inf] * (nw + 1)
    prev = [0] * (nw + 1)
    best[0] = 0.0
    for j in range(1, nw + 1):
        total = 0.0
        for i in range(j - 1, -1, -1):
            total += widths[i] + (space if i < j - 1 else 0)
            gaps = j - 1 - i
            last = j == nw
            slack = measure_w - total
            if slack < 0 and not (justify and gaps and -slack <= gaps * space * 0.3):
                if i < j - 1:
                    break
                cost = 1e9  # a single over-long word: allow, but avoid
            elif justify and not last:
                if gaps == 0:
                    cost = 1e6
                else:
                    ratio = slack / (gaps * space * (0.55 if slack > 0 else 0.3))
                    cost = (10 + 100 * abs(ratio) ** 3) ** 2
            elif last:
                # keep a widow word off the last line
                cost = 4e4 if (gaps == 0 and nw > 2 and total < measure_w * 0.25) else 0
            else:
                cost = slack ** 2
            if best[i] + cost < best[j]:
                best[j], prev[j] = best[i] + cost, i
    lines, j = [], nw
    while j > 0:
        lines.append((prev[j], j))
        j = prev[j]
    return lines[::-1]


def paragraph(p, x, y, measure_w, text, size, leading, base='rm', feats='onum,pnum', justify=False,
              align='left', fill=None, cls='f', delay=0.0, stagger=0.06, first_indent=0.0):
    """Set a paragraph; returns the baseline after the last line."""
    pieces = parse(text, base, feats)
    words = words_of(pieces)
    widths = [sum(measure(t, size, fk, ft) for t, fk, ft in wd) for wd in words]
    space = measure(' ', size, base) or size * 0.25
    lines = break_lines(widths, space, measure_w, justify)
    for li, (i, j) in enumerate(lines):
        natural = sum(widths[i:j]) + space * (j - i - 1)
        last = li == len(lines) - 1
        gap = space
        if justify and not last and j - i > 1:
            gap = space + (measure_w - natural) / (j - i - 1)
            natural = measure_w
        lx = x
        if align == 'center':
            lx = x + (measure_w - natural) / 2
        elif align == 'right':
            lx = x + measure_w - natural
        if li == 0:
            lx += first_indent
        with p.group(cls, delay + li * stagger):
            cx = lx
            for k in range(i, j):
                for t, fk, ft in words[k]:
                    cx += p.text(cx, y, t, size, fk, ft, fill=fill)
                cx += gap
        y += leading
    return y - leading


def fleuron(p, x, y, size=34, ch='❦', color=None, cls='f', delay=0.0):
    p.text(x, y, ch, size, 'rm', fill=color or p.t['accent'], anchor='middle', cls=cls, delay=delay)


def diameter(p, x, y, size, color=None):
    """The drawing sign for a diameter (ISO 3098: a circle crossed at 75°)."""
    r = size * 0.27
    cx, cy = x + r + size * 0.04, y - size * 0.33
    p.circle(cx, cy, r, w=size * 0.055, color=color)
    a = math.radians(75)
    L = r * 1.35
    p.line(cx - math.cos(a) * L, cy + math.sin(a) * L, cx + math.cos(a) * L, cy - math.sin(a) * L,
           w=size * 0.055, color=color, cap='round')
    return 2 * r + size * 0.12


def label_width(s, size, fk='rm8'):
    parts = s.split('⌀')
    return sum(measure(t, size, fk, 'lnum,tnum') for t in parts) + (len(parts) - 1) * size * 0.66


def label(p, x, y, s, size=22, anchor='middle', color=None, fk='rm8', cls=None, delay=0.0):
    """A drawing label in lining figures; every ⌀ becomes the drawing sign."""
    w = label_width(s, size, fk)
    x0 = x - w if anchor == 'end' else x - w / 2 if anchor == 'middle' else x
    with p.group(cls, delay):
        for i, t in enumerate(s.split('⌀')):
            if i:
                x0 += diameter(p, x0, y, size, color)
            x0 += p.text(x0, y, t, size, fk, 'lnum,tnum', fill=color)
    return w


# ─── Technical drawing ──────────────────────────────────────────────────────

class View:
    """An orthographic view: model (a, b) → plate (x, y), y pointing down."""

    def __init__(self, ox, oy, k, mapping):
        self.ox, self.oy, self.k, self.m = ox, oy, k, mapping

    def __call__(self, a, b):
        u, v = self.m(a, b)
        return self.ox + self.k * u, self.oy - self.k * v


def _spans(rot_rings, v):
    """Even-odd spans of the rotated rings along the scan line v."""
    xs = []
    for ring in rot_rings:
        for (pu, pv), (qu, qv) in zip(ring, ring[1:] + ring[:1]):
            if (pv <= v < qv) or (qv <= v < pv):
                xs.append(pu + (v - pv) / (qv - pv) * (qu - pu))
    xs.sort()
    return list(zip(xs[::2], xs[1::2]))


def _minus(spans, cuts):
    for c0, c1 in cuts:
        out = []
        for a, b in spans:
            if c1 <= a or c0 >= b:
                out.append((a, b))
                continue
            if c0 > a:
                out.append((a, c0))
            if c1 < b:
                out.append((c1, b))
        spans = out
    return spans


def hatch(p, rings, spacing=6.5, angle=45, w=FINE, color=None, cls='d', delay=0.0, step=0.018, exclude=()):
    """Hatching: parallel lines inside the rings (even-odd), minus every
    region in `exclude`, phase-locked to the plate so every region of one part
    shares one pattern."""
    a = math.radians(angle)
    ca, sa = math.cos(a), math.sin(a)
    rotate = lambda ring: [(x * ca - y * sa, x * sa + y * ca) for x, y in ring]
    rot, rot_ex = [rotate(r) for r in rings], [rotate(r) for r in exclude]
    vs = [v for ring in rot for _, v in ring]
    v = math.ceil(min(vs) / spacing) * spacing
    k = 0
    while v < max(vs):
        spans = _spans(rot, v)
        for ring in rot_ex:
            spans = _minus(spans, _spans([ring], v))
        for u1, u2 in spans:
            if u2 - u1 < 0.6:
                continue
            p.line(u1 * ca + v * sa, -u1 * sa + v * ca, u2 * ca + v * sa, -u2 * sa + v * ca, w, color=color,
                   cls=cls, delay=delay + k * step)
        k += 1
        v += spacing


def inside(pt, poly):
    x, y = pt
    c = False
    for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
        if (y1 > y) != (y2 > y) and x < x1 + (y - y1) / (y2 - y1) * (x2 - x1):
            c = not c
    return c


def convex_hull(points):
    pts = sorted(set((round(x, 3), round(y, 3)) for x, y in points))
    cross = lambda o, a, b: (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lower, upper = [], []
    for q in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], q) <= 0:
            lower.pop()
        lower.append(q)
    for q in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], q) <= 0:
            upper.pop()
        upper.append(q)
    return lower[:-1] + upper[:-1]


def visible_runs(pts, hiders):
    """A densely sampled polyline, cut where it passes behind any of the hiders."""
    runs, cur = [], []
    for q in pts:
        if any(inside(q, h) for h in hiders):
            if len(cur) > 1:
                runs.append(cur)
            cur = []
        else:
            cur.append(q)
    if len(cur) > 1:
        runs.append(cur)
    return runs


def dim_linear(p, a, b, offset, text, horizontal=True, size=22, delay=0.0, ext_gap=4, ext_over=6):
    """A linear dimension between plate points a and b, its line `offset` away
    (negative = above / left). Narrow lines, closed arrowheads, text on top."""
    (ax, ay), (bx, by) = a, b
    if horizontal:
        yd = min(ay, by) + offset if offset < 0 else max(ay, by) + offset
        s = 1 if offset > 0 else -1
        p.line(ax, ay + s * ext_gap, ax, yd + s * ext_over, FINE, cls='f', delay=delay)
        p.line(bx, by + s * ext_gap, bx, yd + s * ext_over, FINE, cls='f', delay=delay)
        p.line(ax, yd, bx, yd, FINE, cls='d', delay=delay + 0.1)
        p.arrow(ax, yd, ax - bx, 0, cls='f', delay=delay + 0.3)
        p.arrow(bx, yd, bx - ax, 0, cls='f', delay=delay + 0.3)
        label(p, (ax + bx) / 2, yd - 7, text, size, cls='f', delay=delay + 0.35)
    else:
        xd = min(ax, bx) + offset if offset < 0 else max(ax, bx) + offset
        s = 1 if offset > 0 else -1
        p.line(ax + s * ext_gap, ay, xd + s * ext_over, ay, FINE, cls='f', delay=delay)
        p.line(bx + s * ext_gap, by, xd + s * ext_over, by, FINE, cls='f', delay=delay)
        p.line(xd, ay, xd, by, FINE, cls='d', delay=delay + 0.1)
        p.arrow(xd, ay, 0, ay - by, cls='f', delay=delay + 0.3)
        p.arrow(xd, by, 0, by - ay, cls='f', delay=delay + 0.3)
        cx, cy = xd - 7, (ay + by) / 2
        p.add(f'<g transform="rotate(-90 {n(cx)} {n(cy)})">')
        label(p, cx, cy, text, size, cls='f', delay=delay + 0.35)
        p.add('</g>')


def leader(p, tip, knee, text, size=22, right=True, delay=0.0):
    """A leader: arrow on the feature, a knee, a shoulder carrying the text."""
    (tx, ty), (kx, ky) = tip, knee
    tw = label_width(text, size)
    ex = kx + (tw + 10) * (1 if right else -1)
    p.line(tx, ty, kx, ky, FINE, cls='d', delay=delay)
    p.line(kx, ky, ex, ky, FINE, cls='d', delay=delay + 0.2)
    p.arrow(tx, ty, tx - kx, ty - ky, cls='f', delay=delay + 0.3)
    label(p, kx + 5 if right else ex + 5, ky - 7, text, size, anchor='start', cls='f', delay=delay + 0.35)


def projection_symbol(p, cx, cy, h, method='first', w=THICK, color=None, cls='d', delay=0.0):
    """ISO 5456-2 projection symbol, h = diameter of the large circle.

    The truncated cone is drawn small end left, large end right; its view from
    the small end (two circles) sits right of it in first-angle projection and
    left of it in third-angle projection."""
    D, d, L, gap = h, h * 0.5, h * 0.95, h * 0.42
    total = L + gap + D
    x0 = cx - total / 2
    if method == 'first':
        tx, ccx = x0, x0 + L + gap + D / 2
    else:
        ccx, tx = x0 + D / 2, x0 + D + gap
    p.poly([(tx, cy - d / 2), (tx + L, cy - D / 2), (tx + L, cy + D / 2), (tx, cy + d / 2)], w,
           close=True, color=color, cls=cls, delay=delay)
    p.circle(ccx, cy, D / 2, w, color=color, cls=cls, delay=delay + 0.1)
    p.circle(ccx, cy, d / 2, w, color=color, cls=cls, delay=delay + 0.2)
    over = h * 0.16
    p.line(x0 - over, cy, x0 + total + over, cy, FINE, color=color, dash='9 2.5 1.5 2.5', cls='f', delay=delay + 0.3)
    p.line(ccx, cy - D / 2 - over, ccx, cy + D / 2 + over, FINE, color=color, dash='9 2.5 1.5 2.5', cls='f',
           delay=delay + 0.3)


# ─── The part: the flanged bushing of @classcad/renderer's gallery ──────────
# Flange ⌀60 × 8 with a flat 24 from the axis at the front (−Y); hub ⌀30 to
# z 34; bore ⌀16 through; a ⌀8 port along +X at z 22; four ⌀6 bolt holes on
# ⌀44 at 45°. (packages/renderer/docs/gallery.mjs builds the same part.)

R_FL, T_FL, FLAT, R_HUB, H, R_BORE, R_PORT, Z_PORT, R_BOLT, PCD = 30, 8, 24, 15, 34, 8, 4, 22, 3, 22
BOLT = [(s1 * PCD / math.sqrt(2), s2 * PCD / math.sqrt(2)) for s1, s2 in ((1, 1), (-1, 1), (-1, -1), (1, -1))]


def port_curve(r_surface, steps=16):
    """Where the port meets a coaxial cylinder of radius r, seen from the front."""
    pts = []
    for i in range(steps + 1):
        phi = math.pi * i / steps
        y, z = R_PORT * math.sin(phi), Z_PORT + R_PORT * math.cos(phi)
        pts.append((math.sqrt(r_surface ** 2 - y ** 2), z))
    return pts


def draw_bushing(p, fx, fy, k, lx, tx, ty, t0=0.2):
    """Section A–A (front), view from the left and plan, in first-angle
    projection: plan below the section, view from the left to its right."""
    F = View(fx, fy, k, lambda x, z: (x, z))           # section A–A, looking +Y
    L = View(lx, fy, k, lambda y, z: (-y, z))          # from the left (camera −X)
    T = View(tx, ty, k, lambda x, y: (x, y))           # plan, looking −Z
    acc = p.t['accent']

    # centre lines first — the draughtsman's construction
    with p.group('f', t0):
        p.line(*F(0, -5), *F(0, H + 5), FINE, dash=CHAIN)
        p.line(*L(0, -5), *L(0, H + 5), FINE, dash=CHAIN)
        p.line(*T(-R_FL - 6, 0), *T(R_FL + 6, 0), FINE, dash=CHAIN)
        p.line(*T(0, -R_FL - 6), *T(0, R_FL + 6), FINE, dash=CHAIN)
        p.line(*F(4, Z_PORT), *F(R_HUB + 5, Z_PORT), FINE, dash=CHAIN)
        cx, cy = T(0, 0)
        p.circle(cx, cy, PCD * k, FINE, dash=CHAIN)
        for bx, by in BOLT:
            ux, uy = bx / PCD, by / PCD
            p.line(*T(bx - ux * 5, by - uy * 5), *T(bx + ux * 5, by + uy * 5), FINE, dash='6 2 1.5 2')

    # section A–A: the cut, hatched
    left = [(-R_FL, 0), (-R_BORE, 0), (-R_BORE, H), (-R_HUB, H), (-R_HUB, T_FL), (-R_FL, T_FL)]
    right_lo = [(R_BORE, 0), (R_FL, 0), (R_FL, T_FL), (R_HUB, T_FL), (R_HUB, Z_PORT - R_PORT), (R_BORE, Z_PORT - R_PORT)]
    right_hi = [(R_BORE, Z_PORT + R_PORT), (R_HUB, Z_PORT + R_PORT), (R_HUB, H), (R_BORE, H)]
    t = t0 + 0.3
    for ring in (left, right_lo, right_hi):
        p.poly([F(*q) for q in ring], THICK, close=True, cls='d', delay=t)
        t += 0.25
    hatch(p, [[F(*q) for q in r] for r in (left, right_lo, right_hi)], cls='d', delay=t0 + 1.0)
    # beyond the cut: the rims of the half bore, the port where it pierces bore and hub
    p.line(*F(-R_BORE, H), *F(R_BORE, H), THICK, cls='d', delay=t)
    p.line(*F(-R_BORE, 0), *F(R_BORE, 0), THICK, cls='d', delay=t)
    for r in (R_BORE, R_HUB):
        p.poly([F(*q) for q in port_curve(r)], THICK, cls='d', delay=t + 0.2)

    # view from the left: flange (flat at the front shows on the right), hub
    t = t0 + 0.9
    p.poly([L(-FLAT, 0), L(R_FL, 0), L(R_FL, T_FL), L(-FLAT, T_FL)], THICK, close=True, cls='d', delay=t)
    p.poly([L(-R_HUB, T_FL), L(-R_HUB, H), L(R_HUB, H), L(R_HUB, T_FL)], THICK, cls='d', delay=t + 0.2)
    with p.group('f', t + 0.6):
        for yy in (-R_BORE, R_BORE):
            p.line(*L(yy, 0), *L(yy, H), THIN, dash=DASHED)
        for yy in sorted({round(by + s * R_BOLT, 3) for _, by in BOLT for s in (-1, 1)}):
            p.line(*L(yy, 0), *L(yy, T_FL), THIN, dash=DASHED)
        cx, cy = L(0, Z_PORT)
        p.circle(cx, cy, R_PORT * k, THIN, dash='5 3')

    # plan: flange with its flat, hub, bore, bolt holes; the port hidden below
    t = t0 + 1.4
    xf = math.sqrt(R_FL ** 2 - FLAT ** 2)
    x1, y1 = T(xf, -FLAT)
    x2, y2 = T(-xf, -FLAT)
    p.path(f'M{n(x1)} {n(y1)}A{n(R_FL * k)} {n(R_FL * k)} 0 1 0 {n(x2)} {n(y2)}Z', THICK, cls='d', delay=t)
    cx, cy = T(0, 0)
    p.circle(cx, cy, R_HUB * k, THICK, cls='d', delay=t + 0.2)
    p.circle(cx, cy, R_BORE * k, THICK, cls='d', delay=t + 0.3)
    for i, (bx, by) in enumerate(BOLT):
        p.circle(*T(bx, by), R_BOLT * k, THICK, cls='d', delay=t + 0.4 + i * 0.08)
    with p.group('f', t + 0.7):
        for yy in (-R_PORT, R_PORT):
            xa, xb = math.sqrt(R_BORE ** 2 - yy ** 2), math.sqrt(R_HUB ** 2 - yy ** 2)
            p.line(*T(xa, yy), *T(xb, yy), THIN, dash=DASHED)

    # cutting plane A–A in the plan, arrows looking +Y (up on the plan)
    t = t0 + 2.0
    for s in (-1, 1):
        xa, ya = T(s * (R_FL + 3), 0)
        xb, yb = T(s * (R_FL + 10), 0)
        p.line(xa, ya, xb, yb, THICK, color=acc, cls='d', delay=t)
        p.line(xb, yb, xb, yb - 22, FINE, color=acc, cls='d', delay=t + 0.1)
        p.arrow(xb, yb - 24, 0, -1, color=acc, cls='f', delay=t + 0.3)
        p.text(xb, yb - 44, 'A', 24, 'rm', anchor='middle', fill=acc, cls='f', delay=t + 0.3)
    fx0, fy0 = F(0, H)
    p.rich(fx0, fy0 - 106, [('A–A', 'rm', 'lnum')], 26, fill=acc, cls='f', delay=t + 0.2, anchor='middle')

    # dimensions
    t = t0 + 2.4
    dim_linear(p, F(-R_BORE, H), F(R_BORE, H), -22, '⌀16', delay=t)
    dim_linear(p, F(-R_HUB, H), F(R_HUB, H), -56, '⌀30', delay=t + 0.1)
    dim_linear(p, F(-R_FL, 0), F(R_FL, 0), 30, '⌀60', delay=t + 0.2)
    dim_linear(p, F(-R_FL, T_FL), F(-R_FL, 0), -20, '8', horizontal=False, delay=t + 0.3)
    dim_linear(p, F(-R_HUB, H), F(-R_FL, 0), -48, '34', horizontal=False, delay=t + 0.4)
    px, py = F(R_HUB, Z_PORT + R_PORT)
    leader(p, (px - 2, py + 1), (px + 26, py - 30), '⌀8', delay=t + 0.5)
    bx, by = BOLT[0]
    hx, hy = T(bx + R_BOLT * 0.72, by + R_BOLT * 0.72)
    leader(p, (hx, hy), (hx + 44, hy - 58), '4× ⌀6 on ⌀44', delay=t + 0.6)
    dim_linear(p, T(R_FL, 0), T(xf, -FLAT), 26, '24', horizontal=False, delay=t + 0.7)
    return F, L, T


# ─── Plate I: frontispiece and title page ───────────────────────────────────

def plate_frontispiece(theme):
    W, H_ = 1600, 1120
    p = Plate(W, H_, theme, 'classcad-ai — The Art of Modelling with Agents', animate=True, desc=
              'Frontispiece: an engineering drawing of a flanged bushing — section A–A, the view from the left '
              'and the plan in first-angle projection, dimensioned, with a title block. Title page: classcad-ai, '
              'or, the Art of Modelling with Agents: wherein a machine is taught to write parametric CAD models '
              'as programs, to draw what it has made, and to prove the work in numbers and in pixels. In five '
              'parts. MMXXVI.')
    t = p.t

    # ── verso: the drawing sheet ──
    X0, Y0, X1, Y1 = 58, 70, 742, 1004        # trimmed sheet
    B = 16                                    # zone strip
    p.poly([(X0, Y0), (X1, Y0), (X1, Y1), (X0, Y1)], FINE, close=True, color=t['ink2'], cls='d', delay=0.0)
    p.poly([(X0 + B, Y0 + B), (X1 - B, Y0 + B), (X1 - B, Y1 - B), (X0 + B, Y1 - B)], THICK, close=True,
           cls='d', delay=0.1)
    cols, rows = 4, 5
    with p.group('f', 0.5):
        for i in range(cols):
            xa = X0 + B + (X1 - X0 - 2 * B) * i / cols
            xm = xa + (X1 - X0 - 2 * B) / cols / 2
            if i:
                p.line(xa, Y0, xa, Y0 + B, FINE)
                p.line(xa, Y1 - B, xa, Y1, FINE)
            for yy in (Y0 + B - 4, Y1 - 3.5):
                p.text(xm, yy, str(i + 1), 13, 'rm8', 'onum', anchor='middle', fill=t['ink2'])
        for i in range(rows):
            ya = Y0 + B + (Y1 - Y0 - 2 * B) * i / rows
            ym = ya + (Y1 - Y0 - 2 * B) / rows / 2
            if i:
                p.line(X0, ya, X0 + B, ya, FINE)
                p.line(X1 - B, ya, X1, ya, FINE)
            for xx in (X0 + B / 2, X1 - B / 2):
                p.text(xx, ym + 4.5, 'ABCDE'[i], 13, 'rm8', 'smcp,c2sc', anchor='middle', fill=t['ink2'])
        # centring marks
        for x, y, dx, dy in ((W / 4 - 2, Y0, 0, 1), ((X0 + X1) / 2, Y1, 0, -1), (X0, (Y0 + Y1) / 2, 1, 0),
                             (X1, (Y0 + Y1) / 2, -1, 0)):
            p.line(x, y, x + dx * (B + 8), y + dy * (B + 8), THICK)

    k = 4.3
    draw_bushing(p, fx=290, fy=392, k=k, lx=606, tx=290, ty=650)

    # title block (ISO 7200 fields, trimmed to what a README can own)
    bx0, by0, bx1, by1 = 392, 870, X1 - B, Y1 - B
    with p.group('f', 3.6):
        p.poly([(bx0, by0), (bx1, by0), (bx1, by1), (bx0, by1)], THIN, close=True)
        mid = by0 + 62
        p.line(bx0, mid, bx1, mid, FINE)
        p.line(bx1 - 96, by0, bx1 - 96, mid, FINE)
        cells = [bx0, bx0 + 82, bx0 + 176, bx0 + 276, bx1]
        for c in cells[1:-1]:
            p.line(c, mid, c, by1, FINE)
        p.text(bx0 + 10, by0 + 18, 'awv informatik ag', 12, 'rm8', 'smcp,c2sc', ls=0.12, fill=t['ink2'])
        p.text(bx0 + 10, by0 + 48, 'Flanged bushing', 27, 'rm')
        heads = ['created by', 'date', 'doc. no.', 'sheet']
        vals = [('AWV', 'rm8', 'c2sc'), ('28·9·2026', 'rm8', 'lnum'), ('CCAI–001', 'rm8', 'lnum'), ('I of I', 'rm8', 'smcp,c2sc')]
        for c0, c1, hd, (v, fk, ft) in zip(cells, cells[1:], heads, vals):
            p.text(c0 + 7, mid + 15, hd, 11, 'rm8', 'smcp,c2sc', ls=0.1, fill=t['ink2'])
            p.text(c0 + 7, by1 - 11, v, 17, fk, ft)
    projection_symbol(p, bx1 - 48, by0 + 27, 21, 'first', w=1.5, cls='d', delay=3.7)
    p.text(bx1 - 48, by0 + 55, 'iso e', 11, 'rm8', 'smcp,c2sc', ls=0.15, anchor='middle', fill=t['ink2'],
           cls='f', delay=3.8)


    # ── recto: the title page ──
    cx = 1200
    d0 = 0.35
    p.text(cx, 146, 'classcad·ai', 44, 'rm', 'smcp,c2sc', ls=0.24, anchor='middle', cls='u', delay=d0)
    oxford_rule(p, cx - 250, cx + 250, 176, cls='d', delay=d0 + 0.2)
    p.text(cx, 240, 'or,', 30, 'it', anchor='middle', cls='u', delay=d0 + 0.5, fill=t['ink2'])
    p.text(cx, 300, 'the art of', 30, 'rm', 'smcp,c2sc', ls=0.3, anchor='middle', cls='u', delay=d0 + 0.6)
    p.text(cx, 410, 'Modelling', 118, 'rm', 'onum', anchor='middle', cls='u', delay=d0 + 0.75)
    p.text(cx, 518, 'with Agents', 104, 'it', 'onum', anchor='middle', cls='u', delay=d0 + 0.95)
    p.line(cx - 40, 570, cx + 40, 570, 1.2, color=t['accent'], cls='d', delay=d0 + 1.2)
    sub = [[('Wherein a machine is taught', 'it', '')],
           [('to write parametric ', 'it', ''), ('cad', 'it', 'smcp'), (' models as programs,', 'it', '')],
           [('to draw what it has made, and to prove', 'it', '')],
           [('the work in numbers and in pixels.', 'it', '')]]
    for i, line in enumerate(sub):
        p.rich(cx, 624 + i * 40, line, 29, anchor='middle', cls='u', delay=d0 + 1.3 + i * 0.1)
    fleuron(p, cx, 804, 40, delay=d0 + 1.8)
    p.text(cx, 862, 'in five parts', 19, 'rm8', 'smcp,c2sc', ls=0.3, anchor='middle', cls='u', delay=d0 + 1.9,
           fill=t['ink2'])
    dot = ('  ·  ', 'rm', '')
    p.rich(cx, 898, [('The Skill', 'rm', ''), dot, ('The Script', 'rm', ''), dot, ('The Renderer', 'rm', '')], 26,
           anchor='middle', cls='u', delay=d0 + 2.0)
    p.rich(cx, 932, [('The ', 'rm', ''), ('mcp', 'rm', 'smcp'), (' Server', 'rm', ''), dot, ('The In-App Agent', 'rm', '')], 26, anchor='middle',
           cls='u', delay=d0 + 2.1)
    p.line(cx - 250, 972, cx + 250, 972, FINE, cls='d', delay=d0 + 2.3)
    p.text(cx, 1001, 'mmxxvi', 20, 'rm8', 'smcp,c2sc', ls=0.3, anchor='middle')
    return p


# ─── Furniture of the inner plates ──────────────────────────────────────────

MEASURE = (84, 1516)   # every plate and head is cropped to this measure, so the
                       # README column edge is the edge of every figure and head


def plate_frame(p, numeral, title, right):
    """Package plates: the running head is set as a separate image above the
    plate, with the package's link between the two in the README."""
    p.head = (numeral, title, right)


def plate_head(numeral, title, right, theme):
    h = Plate(1600, 48, theme, f'Plate {numeral.upper()} — {title}', f'Plate {numeral.upper()}: {title}, {right}',
              animate=False)
    running_head(h, 24, f'plate {numeral}.', title, right, *MEASURE)
    h.crop = (MEASURE[0], 0, MEASURE[1], 46)
    return h


def lead(p, x, y, epithet, text, width=500, delay=0.2, size=26, leading=37):
    p.text(x, y, epithet, 62, 'it', 'onum', cls='u', delay=delay)
    p.line(x + 3, y + 30, x + 66, y + 30, 1.3, color=p.t['accent'], cls='d', delay=delay + 0.25)
    return paragraph(p, x, y + 82, width, text, size, leading, delay=delay + 0.35)


def leaders(p, x1, x2, y, step=12, color=None, delay=0.0):
    """Dot leaders on a plate-wide grid, so the dots of every row line up."""
    a = math.ceil((x1 + 9) / step) * step
    b = x2 - 9
    if b > a:
        p.path(f'M{n(a)} {n(y - 4)}L{n(b)} {n(y - 4)}', 2.3, color=color or p.t['ink2'], dash=f'0 {step}',
               cap='round', cls='f', delay=delay)


def heading(p, x, y, text, width, delay=0.0):
    p.text(x, y, text, 17, 'rm8', 'smcp,c2sc', ls=0.22, cls='f', delay=delay, fill=p.t['ink2'])
    p.line(x, y + 11, x + width, y + 11, FINE, cls='d', delay=delay)


def brace_shape(u1, u2, depth, wmax):
    """An engraved brace across u1…u2, its point at v = 0 and its arms at
    v = depth, as a polygon of (v, u) points: a filled stroke that swells on
    the straights and dies away at the ends and at the point, as a burin cuts it."""
    um, d = (u1 + u2) / 2, depth
    r = min(d * 0.9, (u2 - u1) / 5)
    vs = d * 0.5

    def quad(a, b, c, k=14):
        return [((1 - w) ** 2 * a[0] + 2 * (1 - w) * w * b[0] + w * w * c[0],
                 (1 - w) ** 2 * a[1] + 2 * (1 - w) * w * b[1] + w * w * c[1]) for w in (i / k for i in range(k + 1))]

    def seg(a, b, k=10):
        return [(a[0] + (b[0] - a[0]) * i / k, a[1] + (b[1] - a[1]) * i / k) for i in range(1, k)]

    pts = quad((d, u1), (vs, u1), (vs, u1 + r))
    pts += seg((vs, u1 + r), (vs, um - r))
    pts += quad((vs, um - r), (vs, um), (0, um))
    pts += quad((0, um), (vs, um), (vs, um + r))[1:]
    pts += seg((vs, um + r), (vs, u2 - r))
    pts += quad((vs, u2 - r), (vs, u2), (d, u2))
    acc = [0.0]
    for a, b in zip(pts, pts[1:]):
        acc.append(acc[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    left, right = [], []
    for i, (pv, pu) in enumerate(pts):
        w = wmax * abs(math.sin(math.pi * ((2 * acc[i] / acc[-1]) % 1.0))) ** 0.8 + 0.5
        a, b = pts[max(i - 1, 0)], pts[min(i + 1, len(pts) - 1)]
        tv, tu = b[0] - a[0], b[1] - a[1]
        tl = math.hypot(tv, tu) or 1
        nv, nu = -tu / tl, tv / tl
        left.append((pv + nv * w / 2, pu + nu * w / 2))
        right.append((pv - nv * w / 2, pu - nu * w / 2))
    return left + right[::-1]


def overbrace(p, x1, x2, y, depth=24, wmax=3.4, color=None):
    """A brace spanning x1…x2, its point up at (middle, y), its arms reaching down."""
    p.poly([(u, y + v) for v, u in brace_shape(x1, x2, depth, wmax)], 0, close=True, fill=color or p.t['ink'])

# ─── Plate II: the figurative system ────────────────────────────────────────

TREE = [
    ('knowledge', [('The Skill', '@classcad/skill', 'every method of the ^api^, verified, and its recipes'),
                   ('Discovery', '@classcad/skill/discovery', 'search, describe, and the docs tool')]),
    ('execution', [('The Script', '@classcad/script', 'one way to execute: a program, `run_script`'),
                   ('The Engine', 'classcad-cli · wasm', 'ClassCAD itself, on a worker or in the page')]),
    ('proof', [('The Renderer', '@classcad/renderer', 'views, drawings, sections and diffs'),
               ('The Numbers', 'the engine', 'mass properties and geometry probes')]),
    ('hosts', [('The MCP Server', 'classcad-mcp', 'Claude Code, Codex, OpenCode, Cursor, VS Code'),
               ('The In-App Agent', '@buerli.io/ai', 'a chat panel in buerli apps')]),
]


def item_name(p, x, y, name, size, anchor='start'):
    """'The MCP Server' with the acronym in small caps."""
    pieces = []
    for part in re.split(r'(MCP)', name):
        if part == 'MCP':
            pieces.append(('mcp', 'rm', 'smcp'))
        elif part:
            pieces.append((part, 'rm', 'onum'))
    return p.rich(x, y, pieces, size, anchor=anchor)


def plate_systema(theme):
    """The repository as a figurative system, read from the top: the root, a
    brace over its four branches, a brace over each branch's entries."""
    p = Plate(1600, 900, theme, 'classcad-ai — a figurative system of the repository',
              'The repository as a figurative system: classcad·ai branches into knowledge (the skill, discovery), '
              'execution (the script, the engine), proof (the renderer, the numbers) and hosts (the MCP server, '
              'the in-app agent).')
    t = p.t
    cols, cw = len(TREE), 340
    gutter = (MEASURE[1] - MEASURE[0] - cols * cw) / (cols - 1)
    xs = [MEASURE[0] + i * (cw + gutter) for i in range(cols)]
    mids = [x + cw / 2 for x in xs]
    cx = (MEASURE[0] + MEASURE[1]) / 2
    y = 120
    p.text(cx, y, 'classcad·ai', 34, 'rm', 'smcp,c2sc', ls=0.3, anchor='middle')
    overbrace(p, mids[0], mids[-1], y + 24, depth=38, wmax=4.4)
    y_cat = y + 24 + 38 + 44
    for (cat, items), x, mid in zip(TREE, xs, mids):
        p.text(mid, y_cat, cat, 21, 'rm', 'smcp,c2sc', ls=0.24, anchor='middle')
        overbrace(p, x + 34, x + cw - 34, y_cat + 16, depth=22, wmax=2.8)
        iy = y_cat + 16 + 22 + 42
        for name, pkg, desc in items:
            item_name(p, mid, iy, name, 26, anchor='middle')
            p.text(mid, iy + 26, pkg, 18, 'it8', 'lnum', anchor='middle', fill=t['ink2'])
            last = paragraph(p, x + 8, iy + 54, cw - 16, desc, 19, 25, base='it8', align='center', fill=t['ink2'])
            iy = last + 62
    return p

# ─── Plate III: the skill ───────────────────────────────────────────────────

def domain_counts():
    reg = json.load(open(os.path.join(ROOT, 'packages/skill/method-registry.json')))
    keys = reg.get('methods', reg)
    keys = keys.keys() if isinstance(keys, dict) else [k.get('method') or k.get('name') for k in keys]
    return collections.Counter(k.split('.')[1] for k in keys).most_common()


RECIPES = ['Constrained sketching', 'Verification', 'Parametric parts', 'Assembly parameters',
           'Pattern, then subtract', 'Direct modelling']


def plate_skill(theme):
    W, H_ = 1600, 660
    counts = domain_counts()
    total = sum(c for _, c in counts)
    p = Plate(W, H_, theme, 'Plate III — The Skill: @classcad/skill',
              f'The ClassCAD API, {total} methods, each documented and verified against a live engine, by domain '
              f'as a table of contents: {", ".join(f"{d} {c}" for d, c in counts)}. The six recipes: '
              f'{", ".join(RECIPES).lower()}. One BM25 search serves it all, with CAD synonyms.')
    t = p.t
    plate_frame(p, 'iii', 'the skill', '@classcad/skill')
    lead(p, 84, 214, 'The Knowledge',
         f'The ClassCAD ^api^, whole: {total} methods, each documented and verified against a live engine, and '
         'the recipes that combine them into parts and assemblies. One search serves it all — ^bm^25-ranked, '
         '`camelCase` split, plurals folded, and fluent in ^cad^: a hole is a bore, a round a fillet.', width=500)
    x1, x2 = 700, 1086
    heading(p, x1, 180, 'methods, by domain', x2 - x1, delay=0.6)
    y = 228
    for i, (dom, c) in enumerate(counts):
        dw = p.text(x1, y, dom, 21, 'rm', 'smcp,c2sc', ls=0.12, cls='f', delay=0.7 + i * 0.07)
        cw = measure(str(c), 24, 'rm', 'onum,tnum')
        leaders(p, x1 + dw, x2 - cw, y, delay=0.75 + i * 0.07)
        p.text(x2, y, str(c), 24, 'rm', 'onum,tnum', anchor='end', cls='f', delay=0.75 + i * 0.07)
        y += 40
    p.line(x2 - 70, y - 20, x2, y - 20, FINE, cls='d', delay=1.3)
    iw = p.text(x1, y + 10, 'In all', 23, 'it', 'onum', cls='f', delay=1.35)
    tw = measure(str(total), 26, 'rm', 'onum,tnum')
    leaders(p, x1 + iw, x2 - tw, y + 10, delay=1.4)
    p.text(x2, y + 10, str(total), 26, 'rm', 'onum,tnum', anchor='end', fill=t['accent'], cls='f', delay=1.4)

    r1 = 1170
    heading(p, r1, 180, 'recipes', 1516 - r1, delay=0.9)
    for i, name in enumerate(RECIPES):
        ry = 228 + i * 48
        p.text(r1, ry, f'§ {i + 1}', 22, 'rm', 'onum', fill=t['accent'], cls='f', delay=1.0 + i * 0.08)
        p.text(r1 + 52, ry, name, 25, 'it', 'onum', cls='f', delay=1.0 + i * 0.08)
    return p


# ─── Plate IV: the script ───────────────────────────────────────────────────

TOKEN = re.compile(r"(\s+|'[^']*'|\d+|[A-Za-z_$][\w$]*|.)")
KEYWORDS = {'const', 'await', 'return', 'let', 'async', 'function'}


def code_pieces(src, t):
    """JavaScript in PT Mono: keywords in the accent, punctuation muted."""
    out = []
    for m in TOKEN.finditer(src):
        tk = m.group(0)
        if tk in KEYWORDS:
            color = t['accent']
        elif tk.isspace() or tk[0] == "'" or tk.isdigit() or re.match(r'[A-Za-z_$]', tk):
            color = t['ink']
        else:
            color = t['ink2']
        if out and out[-1][3] == color:
            out[-1] = (out[-1][0] + tk, 'mono', '', color)
        else:
            out.append((tk, 'mono', '', color))
    return out


SCRIPT = [   # runs as shown: returns { part: 4, volume: 40000 }
    "const { result: part } =",
    "  await api.v1.part.create({ name: 'Plate' })",
    "await api.v1.part.box({",
    "  id: part, length: 80, width: 50, height: 10 })",
    "const { result: { volume } } = await api.v1",
    "  .part.calculateMassProperties({ id: part })",
    "return { part, volume }",
]


def plate_script(theme):
    W, H_ = 1600, 700
    p = Plate(W, H_, theme, 'Plate IV — The Script: @classcad/script',
              'A script: const { result: part } = await api.v1.part.create({ name: \'Plate\' }); '
              'await api.v1.part.box({ id: part, length: 80, width: 50, height: 10 }); '
              'const { result: { volume } } = await api.v1.part.calculateMassProperties({ id: part }); '
              'return { part, volume }. It returns { part: 4, volume: 40000 }.')
    t = p.t
    plate_frame(p, 'iv', 'the script', '@classcad/script')
    lead(p, 84, 214, 'The Medium',
         'An agent never dictates one call per turn. It writes a program — variables, loops, geometry filtered '
         'with plain arithmetic — against `api.v1`, `api.tree()` and `api.graphic()`, and runs it through '
         '`run_script`: the same in the browser, in the ^mcp^ and in Node.', width=500)
    x0, y = 744, 214
    heading(p, 700, 176, 'a script', 816, delay=0.6)
    for i, src in enumerate(SCRIPT):
        p.text(x0 - 16, y, str(i + 1), 17, 'mono', '', anchor='end', fill=t['ink2'])
        p.rich(x0, y, code_pieces(src, t), 23)
        y += 37
    p.line(700, y - 10, 1516, y - 10, FINE, cls='d', delay=0.9)
    y += 36
    hand = p.text(700, y, '☞', 30, 'rm', fill=t['accent'])
    rw = p.text(700 + hand + 14, y, 'returns', 19, 'rm8', 'smcp,c2sc', ls=0.18, fill=t['ink2'])
    p.rich(700 + hand + rw + 30, y, code_pieces('{ part: 4, volume: 40000 }', t), 23)
    return p


# ─── Plate V: the renderer ──────────────────────────────────────────────────

def mini_elevation(p, cx, cy, k, flange, port=False, delay=0.0):
    """A small outline of the bushing seen from the side: flange [a, b], hub, optional port."""
    a, b = flange
    pts = [(a, 0), (b, 0), (b, T_FL), (R_HUB, T_FL), (R_HUB, H), (-R_HUB, H), (-R_HUB, T_FL), (a, T_FL)]
    p.poly([(cx + k * u, cy - k * (v - H / 2)) for u, v in pts], 1.5, close=True, cls='d', delay=delay)
    if port:
        p.circle(cx, cy - k * (Z_PORT - H / 2), R_PORT * k, 1.5, cls='d', delay=delay + 0.1)


def mini_plan(p, cx, cy, k, flat_down, hub=True, delay=0.0):
    xf = math.sqrt(R_FL ** 2 - FLAT ** 2)
    s = 1 if flat_down else -1
    x1, y1 = cx + k * xf, cy + s * k * FLAT
    x2, y2 = cx - k * xf, cy + s * k * FLAT
    sweep = 0 if flat_down else 1
    p.path(f'M{n(x1)} {n(y1)}A{n(R_FL * k)} {n(R_FL * k)} 0 1 {sweep} {n(x2)} {n(y2)}Z', 1.5, cls='d', delay=delay)
    if hub:
        p.circle(cx, cy, R_HUB * k, 1.5, cls='d', delay=delay + 0.05)
    p.circle(cx, cy, R_BORE * k, 1.5, cls='d', delay=delay + 0.1)
    for bx, by in BOLT:
        p.circle(cx + k * bx, cy - k * by, R_BOLT * k, 1.2, cls='d', delay=delay + 0.15)


def plate_renderer(theme):
    W, H_ = 1600, 680
    p = Plate(W, H_, theme, 'Plate V — The Renderer: @classcad/renderer',
              'The six views of the flanged bushing, unfolded in first-angle projection: the view from below above '
              'the front view, from the right to its left, from the left to its right, from behind at the far '
              'right, from above below it. Beside them the two ISO 5456-2 projection symbols, first-angle (ISO E) '
              'and third-angle (ISO A).')
    t = p.t
    plate_frame(p, 'v', 'the renderer', '@classcad/renderer')
    lead(p, 84, 214, 'The Eyes',
         'Images of the live model, the same every time — no ^gpu^, no camera state. Named views and turntable '
         'cameras; technical drawings in either projection, hidden edges dashed; sections capped and hatched; '
         'highlights, probe markers and pixel diffs.', width=500)
    c, ox, oy = 128, 690, 162
    cells = {  # (col, row): (label, draw)
        (1, 0): 'from below', (0, 1): 'from the right', (1, 1): 'front', (2, 1): 'from the left',
        (3, 1): 'from behind', (1, 2): 'from above'}
    k = 1.45
    d = 0.6
    for (col, row), name in cells.items():
        x, y = ox + col * c, oy + row * c
        p.poly([(x, y), (x + c, y), (x + c, y + c), (x, y + c)], FINE, close=True, color=t['ink2'], cls='d', delay=d)
        p.text(x + 8, y + 20, name, 15, 'it8', 'onum', fill=t['ink2'], cls='f', delay=d + 0.2)
        cx, cy = x + c / 2, y + c / 2 + 10
        if name == 'front' or name == 'from behind':
            mini_elevation(p, cx, cy, k, (-R_FL, R_FL), delay=d + 0.3)
        elif name == 'from the left':
            mini_elevation(p, cx, cy, k, (-R_FL, FLAT), delay=d + 0.3)
        elif name == 'from the right':
            mini_elevation(p, cx, cy, k, (-FLAT, R_FL), port=True, delay=d + 0.3)
        elif name == 'from above':
            mini_plan(p, cx, cy, k, flat_down=True, delay=d + 0.3)
        else:
            mini_plan(p, cx, cy, k, flat_down=False, hub=False, delay=d + 0.3)
        d += 0.12
    # the fold lines of the unfolded box are the shared edges: accent them
    front = (ox + c, oy + c)
    p.poly([front, (front[0] + c, front[1]), (front[0] + c, front[1] + c), (front[0], front[1] + c)], THIN,
           close=True, color=t['accent'], cls='d', delay=1.4)

    sx = 1330
    heading(p, sx - 40, 176, 'the two methods', 226, delay=1.2)
    projection_symbol(p, sx + 60, 262, 52, 'first', w=2.0, delay=1.4)
    p.text(sx + 60, 340, 'First-angle', 25, 'it', 'onum', anchor='middle', cls='f', delay=1.6)
    p.rich(sx + 60, 368, [('iso e', 'rm8', 'smcp,c2sc'), ('  ·  Europe', 'it8', '')], 18, anchor='middle',
           fill=t['ink2'], cls='f', delay=1.6)
    projection_symbol(p, sx + 60, 450, 52, 'third', w=2.0, delay=1.7)
    p.text(sx + 60, 528, 'Third-angle', 25, 'it', 'onum', anchor='middle', cls='f', delay=1.9)
    p.rich(sx + 60, 556, [('iso a', 'rm8', 'smcp,c2sc'), ('  ·  the Americas', 'it8', '')], 18, anchor='middle',
           fill=t['ink2'], cls='f', delay=1.9)
    return p




# ─── Plate VI: the envoy — the MCP server and the in-app assistant ───────────

def iso_view(cx, cy, s):
    """The renderer's iso: camera at the front-right-top corner (+X, −Y, +Z)."""
    r2, r6 = math.sqrt(2), math.sqrt(6)
    return lambda x, y, z: (cx + s * (x + y) / r2, cy + s * (x - y - 2 * z) / r6)


def arc_pts(P, r, z, a0, a1, k=90, ox=0.0, oy=0.0):
    return [P(ox + r * math.cos(a), oy + r * math.sin(a), z) for a in (a0 + (a1 - a0) * i / k for i in range(k + 1))]


def engrave_bushing(p, cx, cy, s, t0=0.6, shade=True, weight=1.0):
    """The flanged bushing in iso, engraved: hidden-line drawing, hatching that
    shades each face by its angle to a light from the front left. Small copies
    (shade=False) keep the outlines only, drawn lighter by `weight`."""
    THICK, THIN = globals()['THICK'] * weight, globals()['THIN'] * weight
    P = iso_view(cx, cy, s)
    tau = 2 * math.pi
    xf = math.sqrt(R_FL ** 2 - FLAT ** 2)
    a_r, a_l = math.atan2(-FLAT, xf), math.atan2(-FLAT, -xf) + tau       # the flat's ends on the rim
    light = (-0.55, -0.75, 0.37)
    dark = lambda a: 1 - max(0.0, math.cos(a) * light[0] + math.sin(a) * light[1])

    hub = convex_hull(arc_pts(P, R_HUB, H, 0, tau) + arc_pts(P, R_HUB, T_FL, 0, tau))
    top_rim = arc_pts(P, R_FL, T_FL, a_r, a_l, 140)                       # rim of the flange's top, flat excluded
    holes = [arc_pts(P, R_BOLT, T_FL, 0, tau, 40, bx, by) for bx, by in BOLT]
    seen_holes = [h for h in holes if not any(inside(q, hub) for q in h)]
    port = [P(math.sqrt(R_HUB ** 2 - (R_PORT * math.sin(f)) ** 2), R_PORT * math.sin(f), Z_PORT + R_PORT * math.cos(f))
            for f in (i * tau / 48 for i in range(48))]
    hub_top, bore = arc_pts(P, R_HUB, H, 0, tau), arc_pts(P, R_BORE, H, 0, tau)
    flat = [P(xf, -FLAT, 0), P(xf, -FLAT, T_FL), P(-xf, -FLAT, T_FL), P(-xf, -FLAT, 0)]

    if shade:
        shade_bushing(p, P, top_rim, seen_holes, hub, hub_top, bore, port, flat, dark, t0)
    draw_bushing_outlines(p, P, top_rim, seen_holes, hub, hub_top, bore, port, xf, a_r, a_l, t0, THICK, THIN)


def shade_bushing(p, P, top_rim, seen_holes, hub, hub_top, bore, port, flat, dark, t0):
    hatch(p, [top_rim] + seen_holes, spacing=8.5, angle=-30, exclude=[hub], delay=t0, step=0.006)
    hatch(p, [hub_top, bore], spacing=9, angle=-30, delay=t0, step=0.006)
    hatch(p, [flat], spacing=6, angle=-30, delay=t0, step=0.006)
    for ring in [bore, port] + seen_holes:
        hatch(p, [ring], spacing=2.4, angle=60, delay=t0 + 0.3, step=0.004)
    k = 0
    for deg in range(-133, 45, 5):                                          # the hub's side, generator lines
        a = math.radians(deg)
        k += 1
        if dark(a) < (k % 3) / 3 * 0.9:
            continue
        x, y = R_HUB * math.cos(a), R_HUB * math.sin(a)
        (x0, y0), (x1, y1) = P(x, y, T_FL), P(x, y, H)
        runs = visible_runs([(x0, y0 + (y1 - y0) * i / 40) for i in range(41)], [port])
        for run in runs:
            p.line(*run[0], *run[-1], FINE, cls='d', delay=t0 + 0.2 + k * 0.01)
    k = 0
    for deg in range(-51, 45, 5):                                           # the flange's side
        a = math.radians(deg)
        k += 1
        if dark(a) < (k % 3) / 3 * 0.9:
            continue
        x, y = R_FL * math.cos(a), R_FL * math.sin(a)
        p.line(*P(x, y, 0), *P(x, y, T_FL), FINE, cls='d', delay=t0 + 0.2 + k * 0.01)


def draw_bushing_outlines(p, P, top_rim, seen_holes, hub, hub_top, bore, port, xf, a_r, a_l, t0, THICK, THIN):
    t = t0 + 0.6
    for run in visible_runs(top_rim + [P(-xf, -FLAT, T_FL), P(xf, -FLAT, T_FL)], [hub]):
        p.poly(run, THICK, cls='d', delay=t)
    p.poly(arc_pts(P, R_FL, 0, a_r, math.radians(45), 40), THICK, cls='d', delay=t)
    p.poly(arc_pts(P, R_FL, 0, math.radians(225), a_l, 12), THICK, cls='d', delay=t)
    p.line(*P(xf, -FLAT, 0), *P(-xf, -FLAT, 0), THICK, cls='d', delay=t)
    for a in (math.radians(45), math.radians(225)):
        p.line(*P(R_FL * math.cos(a), R_FL * math.sin(a), 0), *P(R_FL * math.cos(a), R_FL * math.sin(a), T_FL),
               THICK, cls='d', delay=t)
    for x in (xf, -xf):
        p.line(*P(x, -FLAT, 0), *P(x, -FLAT, T_FL), THIN, cls='d', delay=t)
    for h in seen_holes:
        p.poly(h, THIN, close=True, cls='d', delay=t + 0.2)
    # outlines: hub
    t += 0.3
    p.poly(hub_top, THICK, close=True, cls='d', delay=t)
    p.poly(bore, THICK, close=True, cls='d', delay=t + 0.1)
    p.poly(arc_pts(P, R_HUB, T_FL, math.radians(-135), math.radians(45), 60), THIN, cls='d', delay=t)
    for a in (math.radians(45), math.radians(-135)):
        p.line(*P(R_HUB * math.cos(a), R_HUB * math.sin(a), T_FL), *P(R_HUB * math.cos(a), R_HUB * math.sin(a), H),
               THICK, cls='d', delay=t)
    p.poly(port, THIN, close=True, cls='d', delay=t + 0.2)


PROMPT = ['“Make a flanged bushing: a 60 mm flange', 'with a flat, a 30 mm hub bored through,',
          'four bolt holes and a port in its side.”']


def scroll(p, x0, x1, y0, h, lines, size=22, delay=0.0):
    """A banderole carrying `lines`: its tails and folds lie beside the band, so
    nothing needs hiding behind it on a transparent plate."""
    drop = 22
    tail_l = [(x0, y0 + drop), (x0 - 50, y0 + drop), (x0 - 32, y0 + drop + h / 2), (x0 - 50, y0 + drop + h),
              (x0, y0 + drop + h)]
    tail_r = [(x1, y0 + drop), (x1 + 50, y0 + drop), (x1 + 32, y0 + drop + h / 2), (x1 + 50, y0 + drop + h),
              (x1, y0 + drop + h)]
    fold_l = [(x0, y0 + h), (x0 + 16, y0 + h), (x0, y0 + drop + h)]
    fold_r = [(x1, y0 + h), (x1 - 16, y0 + h), (x1, y0 + drop + h)]
    for tl, fd in ((tail_l, fold_l), (tail_r, fold_r)):
        p.poly(tl, THIN, close=True, cls='d', delay=delay)
        hatch(p, [tl], spacing=4.2, angle=-35, cls='d', delay=delay + 0.1, step=0.01)
        p.poly(fd, THIN, close=True, cls='d', delay=delay + 0.2)
        hatch(p, [fd], spacing=2.4, angle=-35, cls='d', delay=delay + 0.2, step=0.01)
    band = (f'M{x0} {y0}C{x0 + 140} {y0 - 14} {x1 - 140} {y0 + 14} {x1} {y0}'
            f'L{x1} {y0 + h}C{x1 - 140} {y0 + h + 14} {x0 + 140} {y0 + h - 14} {x0} {y0 + h}Z')
    p.path(band, THIN, cls='d', delay=delay + 0.2)
    top = y0 + (h - 36 * (len(lines) - 1)) / 2 + 8
    for i, ln in enumerate(lines):
        p.text((x0 + x1) / 2, top + i * 36, ln, size, 'it', 'onum', anchor='middle')


def rounded(x0, y0, x1, y1, r):
    return (f'M{n(x0 + r)} {n(y0)}H{n(x1 - r)}Q{n(x1)} {n(y0)} {n(x1)} {n(y0 + r)}V{n(y1 - r)}'
            f'Q{n(x1)} {n(y1)} {n(x1 - r)} {n(y1)}H{n(x0 + r)}Q{n(x0)} {n(y1)} {n(x0)} {n(y1 - r)}'
            f'V{n(y0 + r)}Q{n(x0)} {n(y0)} {n(x0 + r)} {n(y0)}Z')


def app_window(p, x0, y0, x1, y1, delay=0.0):
    """A buerli app, engraved small: its window and the part in it."""
    p.grow(x0, y0, x1, y1)
    p.path(rounded(x0, y0, x1, y1, 10), THIN, cls='d', delay=delay)
    p.line(x0, y0 + 26, x1, y0 + 26, FINE, cls='d', delay=delay + 0.1)
    for i in range(3):
        p.circle(x0 + 18 + i * 14, y0 + 13, 3.8, FINE)
    engrave_bushing(p, (x0 + x1) / 2, (y0 + 26 + y1) / 2 + 20, 2.3, t0=delay + 0.2, shade=False, weight=0.6)


def dialogue(p, x0, x1, y0, delay=0.0):
    """The in-app assistant at work: a request, and the agent's answer."""
    t = p.t

    def bubble(lines, right, color):
        nonlocal y
        size, lead_ = 19, 26
        w = max(measure(ln, size, 'it8', 'onum') for ln in lines) + 32
        bx0, bx1 = (x1 - w, x1) if right else (x0, x0 + w)
        bh = 18 + lead_ * len(lines)
        p.path(rounded(bx0, y, bx1, y + bh, 9), THIN, color=color, cls='d', delay=delay)
        for i, ln in enumerate(lines):
            p.text(bx0 + 16, y + 30 + i * lead_, ln, size, 'it8', 'onum')
        y += bh + 16
        return bx0, bx1

    y = y0
    bubble(['Make a flanged bushing.'], True, t['accent'])
    answer = bubble(['Done: a 60 mm flange with a flat,', 'a 30 mm hub, bolt holes and a port.'], False, t['ink'])
    return answer, y

def plate_envoy(theme):
    """Who makes the part, and where: the MCP server, for any agent host, joins
    any buerli app or works on its own; the assistant works inside the app."""
    W, H_ = 1600, 960
    p = Plate(W, H_, theme, 'Plate VI — The Envoy: the MCP server and the in-app assistant',
              'Two envoys make the part. The MCP server takes requests from any agent host — Claude Code, Codex, '
              'OpenCode, Claude Desktop, VS Code, Cursor — through one daemon per machine; it works on its own, on a '
              'worker or its own WASM, and a pointing hand leads to the part it makes, engraved in iso; or it joins '
              'any buerli app, by invite or over the bridge. The assistant lives inside the app: asked to make a '
              'flanged bushing, it answers, and the part appears in the app\'s window.')
    t = p.t
    plate_frame(p, 'vi', 'the envoy', '@awv-informatik/classcad-mcp · @buerli.io/ai')
    p.text(84, 214, 'The Envoy', 62, 'it', 'onum')
    p.line(87, 244, 150, 244, 1.3, color=t['accent'], cls='d', delay=0.2)
    paragraph(p, 84, 300, 1040, 'Two envoys make the part: the ^mcp^ server, which serves any agent host and joins '
              'any buerli app — or works on its own — and the assistant, which lives inside the app.', 26, 37)

    # any MCP host, into the daemon
    heading(p, 84, 408, 'any mcp host', 300)
    hosts = ['Claude Code', 'Codex', 'OpenCode', 'Claude Desktop', 'VS Code', 'Cursor']
    hx, dx, step, top = 330, 560, 34, 452
    dy = top + step * (len(hosts) - 1) / 2
    for i, h in enumerate(hosts):
        y = top + i * step
        p.text(hx - 16, y + 7, h, 22, 'rm', 'onum', anchor='end')
        p.circle(hx, y, 3.6, THIN, fill=t['ink'])
        p.path(f'M{hx + 4} {y}C{hx + 100} {y} {dx - 100} {dy} {dx - 34} {dy}', THIN, cls='d', delay=0.4 + i * 0.06)
    p.arrow(dx - 28, dy, 1, 0)
    p.circle(dx, dy, 26, THICK, cls='d', delay=0.8)
    p.circle(dx, dy, 19, FINE, cls='d', delay=0.9)
    p.text(dx, dy + 7, 'd', 22, 'it', anchor='middle', fill=t['accent'])
    p.text(dx, dy - 60, 'the mcp server', 18, 'rm', 'smcp,c2sc', ls=0.2, anchor='middle')
    p.text(dx, dy - 39, 'one daemon per machine', 16, 'it8', 'onum', anchor='middle', fill=t['ink2'])

    # on its own: the daemon makes the part itself
    mx = 1372
    p.line(dx + 28, dy, mx - 150, dy, THIN, cls='d', delay=1.0)
    p.text(mx - 128, dy + 13, '☞', 38, 'rm', anchor='middle', fill=t['accent'])
    p.rich((dx + 28 + mx - 150) / 2, dy - 12, [('on its own — a worker, or its own ', 'it8', 'onum'),
                                                ('wasm', 'rm8', 'smcp,c2sc')], 18, fill=t['ink2'], anchor='middle')
    engrave_bushing(p, mx, dy + 30, 3.2, t0=1.2)

    # or it joins any buerli app
    wx0, wy0, wx1, wy1 = 930, 660, 1290, 870
    app_window(p, wx0, wy0, wx1, wy1, delay=0.8)
    jy = wy0 + 44
    p.path(f'M{dx + 18} {dy + 19}C{dx + 80} {dy + 150} {wx0 - 200} {jy} {wx0 - 12} {jy}', THIN, cls='d', delay=1.1)
    p.arrow(wx0 - 4, jy, 1, 0)
    p.text(wx0 - 24, jy + 30, 'joins any buerli app —', 18, 'it8', 'onum', anchor='end', fill=t['ink2'])
    p.text(wx0 - 24, jy + 52, 'by invite, or over the bridge', 18, 'it8', 'onum', anchor='end', fill=t['ink2'])

    # the assistant, inside the app
    heading(p, 84, 700, 'the in-app assistant', 400)
    (_, bx1), _ = dialogue(p, 84, 484, 730, delay=0.7)
    ay = 812
    p.path(f'M{bx1 + 12} {ay}L{wx0 - 12} {ay}', THIN, cls='d', delay=1.3)
    p.arrow(wx0 - 4, ay, 1, 0)
    return p

PLATES = {
    'frontispiece': plate_frontispiece,
    'systema': plate_systema,
    'skill': plate_skill,
    'script': plate_script,
    'renderer': plate_renderer,
    'envoy': plate_envoy,
}


def write(p, name):
    path = os.path.join(HERE, name)
    with open(path, 'w') as fh:
        fh.write(p.svg())
    print(f'{os.path.relpath(path, ROOT)}  {os.path.getsize(path) // 1024} KB')


def main():
    import sys
    only = sys.argv[1:]
    for name, make in PLATES.items():
        if only and name not in only:
            continue
        for theme in THEMES:
            p = make(theme)
            bx0, by0, bx1, by1 = p.box
            if name == 'frontispiece':
                p.crop = (bx0 - 2, by0 - 2, bx1 + 2, by1 + 4)
            elif name == 'systema':
                p.crop = (MEASURE[0], by0 - 110, MEASURE[1], by1 + 56)
            else:
                if bx0 < MEASURE[0] - 1 or bx1 > MEASURE[1] + 1:
                    raise SystemExit(f'{name}: content {bx0:.0f}–{bx1:.0f} leaves the measure {MEASURE}')
                # air above the plate (below its link line) and a longer tail, which
                # sets the rhythm between plates without relying on markdown margins
                p.crop = (MEASURE[0], by0 - 36, MEASURE[1], by1 + 56)
            write(p, f'{name}.{theme}.svg')
            if p.head:
                write(plate_head(*p.head, theme), f'{name}.head.{theme}.svg')

if __name__ == '__main__':
    main()
