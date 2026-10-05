# Makes the small copies the pages serve from the big originals in public/ (Pillow). Rerun after replacing an original.
# headshot: AVIF + WebP at 320 and 560 wide (components/Photo.astro). Marks: 224 wide for the 22-30px logo, 256 wide alpha for the CSS mask.
from PIL import Image

def photo(path):
    src = Image.open(f'public/{path}').convert('RGB')
    base = path.rsplit('.', 1)[0]
    for w in (320, 560):
        im = src.resize((w, round(src.height * w / src.width)), Image.LANCZOS)
        im.save(f'public/{base}-{w}.avif', quality=55)
        im.save(f'public/{base}-{w}.webp', quality=78, method=6)

def mark(path, w, colors, alpha_only=False):
    im = Image.open(f'public/{path}').convert('RGBA')
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    if alpha_only:  # a mask only needs the shape
        a = im.getchannel('A'); im = Image.new('RGBA', im.size, (0, 0, 0, 0)); im.putalpha(a)
    base = path.rsplit('.', 1)[0].removesuffix('-512')
    im.quantize(colors=colors, method=Image.Quantize.FASTOCTREE).save(f'public/{base}-{w}.png', optimize=True)

photo('headshot.jpg')
mark('brand/wren-mark.png', 224, 32)
mark('brand/wren-mark-white.png', 224, 32)
mark('brand/wren-mark.png', 256, 16, alpha_only=True)
