"""Remove white background from logo PNG and save transparent variants."""
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "logo-mark.png"
OUT_NAMES = ("logo-mark.png", "favicon.png", "apple-touch-icon.png")

WHITE_THRESHOLD = 235
SOFT_EDGE = 18


def remove_white_background(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    pixels = img.load()
    width, height = img.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            brightness = max(r, g, b)
            whiteness = min(r, g, b)

            if brightness >= WHITE_THRESHOLD and whiteness >= WHITE_THRESHOLD - 20:
                pixels[x, y] = (r, g, b, 0)
                continue

            if brightness >= WHITE_THRESHOLD - SOFT_EDGE:
                fade = (brightness - (WHITE_THRESHOLD - SOFT_EDGE)) / SOFT_EDGE
                fade = max(0.0, min(1.0, fade))
                if whiteness > 200:
                    new_a = int(a * (1.0 - fade))
                    pixels[x, y] = (r, g, b, new_a)

    return img


def enhance_logo(img: Image.Image) -> Image.Image:
    img = ImageEnhance.Color(img).enhance(1.18)
    img = ImageEnhance.Contrast(img).enhance(1.08)
    img = ImageEnhance.Brightness(img).enhance(1.06)
    return img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=90, threshold=2))


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing source image: {SRC}")

    processed = enhance_logo(remove_white_background(Image.open(SRC)))

    for name in OUT_NAMES:
        out = ROOT / name
        processed.save(out, format="PNG", optimize=True)
        print(f"Wrote {out.name}")


if __name__ == "__main__":
    main()
