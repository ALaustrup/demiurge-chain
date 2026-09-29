#!/usr/bin/env python3
"""Generate the QOR Launcher icon set.

The mark is an *aperture*: a broken ring with a hard diagonal seam cutting
through its lower right. Read one way it is a lens opening onto the Pleroma;
read another it is the letter Q. It is deliberately geometric and asymmetric so
it stays recognisable at 16 pixels, where a literal glyph would turn to mud.

Drawn at 8x and downsampled with Lanczos, which gives cleaner edges than any
antialiasing the draw calls do themselves.

Run:  python scripts/make_icons.py
"""

from __future__ import annotations

import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "src-tauri", "icons")

# The Architect palette, from apps/hub/tailwind.config.ts.
CARBON = (11, 12, 16, 255)        # --bg-primary  #0B0C10
EMBER = (255, 106, 0, 255)        # --accent-primary #FF6A00
EMBER_BRIGHT = (255, 140, 51, 255)
BLOOD = (139, 0, 0, 255)          # --accent-secondary #8B0000

SUPERSAMPLE = 8


def lerp(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def draw_mark(size: int) -> Image.Image:
    """Render the aperture at `size` pixels square."""
    s = size * SUPERSAMPLE
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Ground: a squircle-ish rounded square, not a circle, so the icon reads as
    # an application tile rather than a token.
    pad = s * 0.045
    d.rounded_rectangle(
        [pad, pad, s - pad, s - pad],
        radius=s * 0.22,
        fill=CARBON,
    )

    # A faint inner bevel, which keeps the tile from looking flat on dark docks.
    d.rounded_rectangle(
        [pad, pad, s - pad, s - pad],
        radius=s * 0.22,
        outline=(40, 44, 54, 255),
        width=max(1, int(s * 0.006)),
    )

    cx = cy = s / 2
    outer = s * 0.30
    ring_w = s * 0.085

    # The ring, drawn as a stack of arcs so the stroke can carry a gradient from
    # blood red at the base to ember at the crown. A single arc call cannot.
    steps = 90
    start, end = -210, 22  # leaves the seam open at the lower right
    for i in range(steps):
        t0 = i / steps
        t1 = (i + 1) / steps
        a0 = start + (end - start) * t0
        a1 = start + (end - start) * t1 + 0.6  # overlap hides seams between segments

        # Hottest at the top of the arc, cooling toward both ends.
        heat = 1.0 - abs(t0 - 0.52) / 0.62
        heat = max(0.0, min(1.0, heat))
        colour = lerp(BLOOD, EMBER_BRIGHT, heat ** 0.7)

        d.arc(
            [cx - outer, cy - outer, cx + outer, cy + outer],
            start=a0,
            end=a1,
            fill=colour,
            width=int(ring_w),
        )

    # The seam: a hard diagonal bar crossing where the ring breaks. This is the
    # stroke that makes it a Q and gives the mark its asymmetry.
    bar_w = ring_w * 0.95
    # Straddles the ring edge so the tail reads as emerging from the gap
    # rather than floating beside it.
    r0 = outer * 0.70
    r1 = outer * 1.36
    import math

    ang = math.radians(28)  # down and to the right
    x0 = cx + r0 * math.cos(ang)
    y0 = cy + r0 * math.sin(ang)
    x1 = cx + r1 * math.cos(ang)
    y1 = cy + r1 * math.sin(ang)
    d.line([x0, y0, x1, y1], fill=EMBER, width=int(bar_w))

    # The core: a small bright point at the centre of the aperture. At tiny
    # sizes this is often all that survives, and it still reads as an eye.
    core = s * 0.045
    d.ellipse([cx - core, cy - core, cx + core, cy + core], fill=EMBER_BRIGHT)

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    os.makedirs(OUT, exist_ok=True)

    # Tauri's expected set, plus the Windows Store tiles the MSI bundler wants.
    png_sizes = {
        "32x32.png": 32,
        "128x128.png": 128,
        "128x128@2x.png": 256,
        "icon.png": 512,
        "Square30x30Logo.png": 30,
        "Square44x44Logo.png": 44,
        "Square71x71Logo.png": 71,
        "Square89x89Logo.png": 89,
        "Square107x107Logo.png": 107,
        "Square142x142Logo.png": 142,
        "Square150x150Logo.png": 150,
        "Square284x284Logo.png": 284,
        "Square310x310Logo.png": 310,
        "StoreLogo.png": 50,
    }

    for name, size in png_sizes.items():
        draw_mark(size).save(os.path.join(OUT, name))

    # A multi-resolution .ico so Windows picks the right one per context.
    ico_sizes = [16, 24, 32, 48, 64, 128, 256]
    layers = [draw_mark(n) for n in ico_sizes]
    layers[-1].save(
        os.path.join(OUT, "icon.ico"),
        format="ICO",
        sizes=[(n, n) for n in ico_sizes],
        append_images=layers[:-1],
    )

    # A scalable copy for the web surfaces that want one.
    draw_mark(1024).save(os.path.join(OUT, "icon@1024.png"))

    print(f"wrote {len(png_sizes) + 2} icon files to {os.path.normpath(OUT)}")


if __name__ == "__main__":
    main()
