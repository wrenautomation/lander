"""
The animated profile picture: the Wren mark, its circuit dots lighting in
rust one after another, then 2.6 s still. Frame 0 is the plain mark, which
is all Gmail's inbox list shows; an opened mail plays the rest. Run from
the repo root: python3 tools/pfp-gif.py (Pillow). Uploaded per inbox by
autobrowse (`profile-photo`, or the domain plan's photoUrl).
"""
import math
from PIL import Image, ImageDraw, ImageChops
SRC = "public/brand/wren-pfp-source.png"
RUST = (168, 59, 18)
NODES = [(255, 959), (546, 1197), (983, 1128), (1177, 1013), (1239, 857), (1122, 806)]
OUT, STEP, REST = 400, 50, 2600          # px, ms a frame, ms of stillness
base = Image.open(SRC).convert("RGB")
S = base.size[0]
dark = base.convert("L").point(lambda v: 255 if v < 128 else 0)

def frame(t):  # t in seconds since the pulse began
    img = base.copy().convert("RGBA")
    for i, (x, y) in enumerate(NODES):
        d = t - i * 0.14
        glow = math.exp(-((d - 0.18) / 0.13) ** 2) if d > -0.2 else 0.0
        if glow < 0.02:
            continue
        circ = Image.new("L", (S, S), 0)
        ImageDraw.Draw(circ).ellipse((x - 40, y - 40, x + 40, y + 40), fill=int(255 * glow))
        mask = ImageChops.multiply(circ, dark)
        img.paste(Image.new("RGBA", (S, S), RUST + (255,)), (0, 0), mask)
        # a faint ring, growing as the light passes
        ring = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        r = 38 + 34 * min(1, max(0, d / 0.45))
        ImageDraw.Draw(ring).ellipse((x - r, y - r, x + r, y + r), outline=RUST + (int(70 * glow),), width=6)
        img = Image.alpha_composite(img, ring)
    return img.convert("RGB").resize((OUT, OUT), Image.LANCZOS)

pulse = 0.14 * (len(NODES) - 1) + 0.6
n = int(pulse * 1000 / STEP)
frames = [frame(-1)] + [frame(k * STEP / 1000) for k in range(1, n + 1)]
durs = [REST] + [STEP] * n
pal = [f.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE) for f in frames]
pal[0].save("public/brand/wren-pfp-animated.gif", save_all=True, append_images=pal[1:], duration=durs, loop=0, disposal=1, optimize=True)
print(n + 1, "frames", sum(durs), "ms")
