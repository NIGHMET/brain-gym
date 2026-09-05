# 生成 PWA 图标：珊瑚橙渐变 + 白色"脑"字
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIZE = 1024
TOP, BOT = (255, 138, 92), (255, 107, 107)  # #ff8a5c -> #ff6b6b


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
d.rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=int(SIZE * 0.22), fill=lerp(TOP, BOT, 0))
for y in range(SIZE):
    d.line([(0, y), (SIZE, y)], fill=lerp(TOP, BOT, y / SIZE) + (255,))

font = None
for name in ['msyhbd.ttc', 'msyh.ttc', 'simhei.ttf', 'arialbd.ttf']:
    p = os.path.join(r'C:\Windows\Fonts', name)
    if os.path.exists(p):
        try:
            font = ImageFont.truetype(p, int(SIZE * 0.52))
            break
        except OSError:
            continue
d.text((SIZE / 2, SIZE * 0.44), '脑', font=font, fill=(255, 255, 255, 255), anchor='mm')
d.text((SIZE / 2, SIZE * 0.78), '力', font=font, fill=(255, 255, 255, 235), anchor='mm')

for size, fname in [(512, 'icon-512.png'), (192, 'icon-192.png'), (180, 'apple-touch-icon.png')]:
    img.resize((size, size), Image.LANCZOS).save(os.path.join(ROOT, 'icons', fname))
    print('saved', fname)
