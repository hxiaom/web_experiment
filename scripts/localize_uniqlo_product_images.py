#!/usr/bin/env python3

import json
from pathlib import Path
from urllib.parse import urlparse

import requests

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS_PATH = ROOT / "src" / "data" / "products.json"
PUBLIC_DIR = ROOT / "public" / "uniqlo-products"
HEADERS = {"User-Agent": "Mozilla/5.0"}


def build_local_image_path(product_id: str, image_url: str | None) -> str | None:
    if not image_url:
        return None
    suffix = Path(urlparse(image_url).path).suffix or ".jpg"
    return f"/uniqlo-products/{product_id}{suffix}"


def main() -> None:
    items = json.loads(PRODUCTS_PATH.read_text())
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

    updated = 0
    downloaded = 0
    skipped = 0

    session = requests.Session()
    session.headers.update(HEADERS)

    for item in items:
        image_url = item.get("image_url")
        local_image = build_local_image_path(item["id"], image_url)
        if local_image and item.get("local_image") != local_image:
            item["local_image"] = local_image
            updated += 1

        if not image_url or not local_image:
            skipped += 1
            continue

        target = ROOT / "public" / local_image.lstrip("/")
        if target.exists() and target.stat().st_size > 0:
            skipped += 1
            continue

        response = session.get(image_url, timeout=30)
        response.raise_for_status()
        target.write_bytes(response.content)
        downloaded += 1

    PRODUCTS_PATH.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n")
    print(
        f"Updated metadata for {updated} products, downloaded {downloaded} images, skipped {skipped}; output dir: {PUBLIC_DIR}"
    )


if __name__ == "__main__":
    main()
