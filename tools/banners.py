"""
The social banners: the Wren lockup in cream on rust, matching the profile
pictures. One file per platform size, the lockup inside each one's safe area
(YouTube crops hardest: only the middle 1546x423 shows everywhere). Run from
the repo root: python3 tools/banners.py (Pillow).
"""
from PIL import Image
RUST = (168, 59, 18)                     # --acc on the site
CREAM = (250, 247, 242)                  # --paper
SIZES = {                                # name: (width, height, lockup width)
    "x": (1500, 500, 620),
    "linkedin": (1584, 396, 560),
    "youtube": (2560, 1440, 900),
}
lockup = Image.open("public/brand/wren-lockup-white.png").convert("RGBA")
alpha = lockup.getchannel("A")
for name, (w, h, lw) in SIZES.items():
    img = Image.new("RGB", (w, h), RUST)
    lh = round(lw * lockup.height / lockup.width)
    a = alpha.resize((lw, lh), Image.LANCZOS)
    img.paste(Image.new("RGB", (lw, lh), CREAM), ((w - lw) // 2, (h - lh) // 2), a)
    img.save(f"public/brand/wren-banner-{name}.png")
    print(name, w, h)
