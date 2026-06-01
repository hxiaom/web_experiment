#!/usr/bin/env python3

import json
import re
from collections import OrderedDict
from pathlib import Path
from urllib.parse import urlparse

import requests

SEARCH_URL = "https://d.uniqlo.cn/p/hmall-sc-service/search/searchWithCategoryCodeAndConditions/zh_CN"
HEADERS = {"User-Agent": "Mozilla/5.0", "Content-Type": "application/json"}
ROOT_CATEGORIES = [
    ("3mcasoter", "男装休闲外套"),
    ("3wscasuotr", "女装休闲外套"),
]
ALL_CATEGORY = ("all-casual-outerwear", "全部休闲外套")

LEAF_CATEGORY_MAP = OrderedDict(
    [
        ("4310011315", ("casual-jackets", "休闲茄克")),
        ("4310011138", ("hooded-jackets", "连帽外套")),
        ("4310011218", ("blazers", "西装外套")),
        ("4310010823", ("uv-protection", "防晒外套")),
        ("4310011587", ("windproof-outerwear", "防风夹克")),
        ("4310010863", ("shirt-jackets", "衬衫式茄克")),
        ("4310011132", ("collaboration-series", "合作系列")),
        ("4310010864", ("knit-outerwear", "针织外套")),
        ("4310011311", ("blocktech-series", "BLOCKTECH系列")),
        ("4310011198", ("unisex", "男女同款")),
        ("4210011663", ("casual-jackets", "休闲茄克")),
        ("4210011534", ("hooded-jackets", "连帽外套")),
        ("4210011795", ("uv-protection", "防晒外套")),
        ("4210011800", ("blazers", "西装外套")),
        ("4210011796", ("shirt-jackets", "衬衫式茄克")),
        ("4210011995", ("unisex", "男女同款")),
    ]
)

SIZE_ORDER = {size: idx for idx, size in enumerate(["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"])}


def build_local_image_path(product_code: str, image_url: str | None) -> str | None:
    if not image_url:
        return None
    suffix = Path(urlparse(image_url).path).suffix or ".jpg"
    return f"/uniqlo-products/{product_code}{suffix}"


def fetch_products(category_code: str) -> tuple[list[dict], dict[str, str]]:
    page = 1
    items: list[dict] = []
    size_map: dict[str, str] = {}

    while True:
        payload = {
            "categoryCode": category_code,
            "pageInfo": {"page": page, "pageSize": 100, "withSideBar": "Y"},
            "priceRange": {"low": 0, "high": 0},
            "belongTo": "pc",
            "rank": "overall",
            "color": [],
            "size": [],
            "searchFlag": False,
            "categoryFilter": {},
            "exist": [],
            "identity": [],
            "storeCode": None,
        }
        response = requests.post(SEARCH_URL, headers=HEADERS, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()["resp"]

        for filter_item in data[0]:
            if filter_item.get("name") != "尺码":
                continue
            for group in filter_item.get("item", []):
                for size in group:
                    size_map[size["sizeCode"]] = size["sizeValue"]

        current_items = data[1] or []
        total = (data[2] or {}).get("productSum", len(current_items))
        items.extend(current_items)
        if len(items) >= total or not current_items:
            return items, size_map
        page += 1


def strip_color_code(color_text: str) -> str:
    cleaned = re.sub(r"^\s*\d+/\d+\s*", "", color_text).strip()
    return re.sub(r"^\s*/?\d+\s*", "", cleaned).strip()


def parse_gender_line(item: dict, root_code: str) -> str:
    sex = (item.get("sex") or "").strip()
    full_name = f"{item.get('productName4zhCN') or ''} {item.get('name4zhCN') or ''}"

    if "男女同款" in sex or "男女同款" in full_name or ("男装" in sex and "女装" in sex):
        return "UNISEX"
    if "女装" in sex:
        return "WOMEN"
    if "男装" in sex:
        return "MEN"
    return "WOMEN" if root_code == "3wscasuotr" else "MEN"


def main() -> None:
    products: dict[str, dict] = {}
    for root_code, root_title in ROOT_CATEGORIES:
        items, size_map = fetch_products(root_code)
        for item in items:
            product_code = item["productCode"]
            matched_categories = [
                LEAF_CATEGORY_MAP[cate["cateCode"]]
                for cate in item.get("cateSequence") or []
                if cate.get("cateCode") in LEAF_CATEGORY_MAP
            ]
            unique_categories: list[tuple[str, str]] = [ALL_CATEGORY]
            for category in matched_categories:
                if category not in unique_categories:
                    unique_categories.append(category)

            primary_slug = unique_categories[1][0] if len(unique_categories) > 1 else ALL_CATEGORY[0]
            record = products.setdefault(
                product_code,
                {
                    "id": product_code,
                    "name": item.get("name4zhCN") or item.get("name") or item.get("productName4zhCN"),
                    "category": primary_slug,
                    "categories": [],
                    "local_image": build_local_image_path(
                        product_code,
                        f"https://www.uniqlo.cn{item['mainPic']}" if item.get("mainPic") else None,
                    ),
                    "image_url": f"https://www.uniqlo.cn{item['mainPic']}" if item.get("mainPic") else None,
                    "gender_line": parse_gender_line(item, root_code),
                    "colors": [],
                    "sizes": [],
                    "price": int(round(float(item.get("minPrice") or item.get("maxPrice") or 0))),
                    "tags": [],
                    "description": "",
                    "_category_titles": [],
                    "_season": (item.get("season4zhCN") or item.get("season") or "").strip(),
                    "_identity": list(item.get("identity") or []),
                    "_root_titles": [],
                },
            )

            if record["category"] == ALL_CATEGORY[0] and primary_slug != ALL_CATEGORY[0]:
                record["category"] = primary_slug
            if record["gender_line"] == "MEN" and parse_gender_line(item, root_code) == "WOMEN":
                record["gender_line"] = "UNISEX"

            if root_title not in record["_root_titles"]:
                record["_root_titles"].append(root_title)

            for slug, title in unique_categories:
                if slug not in record["categories"]:
                    record["categories"].append(slug)
                if title not in record["_category_titles"]:
                    record["_category_titles"].append(title)

            for color in item.get("styleText4zhCN") or []:
                color_name = strip_color_code(color)
                if color_name and color_name not in record["colors"]:
                    record["colors"].append(color_name)

            for size_code in item.get("size") or []:
                size_value = size_map.get(size_code)
                if size_value and size_value not in record["sizes"]:
                    record["sizes"].append(size_value)

            for identity in item.get("identity") or []:
                if identity not in record["_identity"]:
                    record["_identity"].append(identity)

    category_order = {slug: idx for idx, slug in enumerate([ALL_CATEGORY[0], *[slug for slug, _ in LEAF_CATEGORY_MAP.values()]])}

    output: list[dict] = []
    for record in products.values():
        record["sizes"].sort(key=lambda size: SIZE_ORDER.get(size, 999))

        tags: list[str] = []
        if record["_season"]:
            tags.append(record["_season"])
        tags.extend(record["_category_titles"][1:] or record["_category_titles"])
        tags.extend(record["_root_titles"])
        if record["gender_line"] == "WOMEN":
            tags.append("女装")
        if record["gender_line"] == "UNISEX":
            tags.append("男女同款")
        if record["gender_line"] == "MEN":
            tags.append("男装")
        if "pickUp" in record["_identity"]:
            tags.append("支持门店自提")
        record["tags"] = list(dict.fromkeys(tags))[:6]

        color_text = "、".join(record["colors"][:4]) if record["colors"] else "以页面为准"
        size_text = "、".join(record["sizes"]) if record["sizes"] else "以页面为准"
        category_text = " / ".join(record["_category_titles"])
        season_text = record["_season"] or "当前页面在售"
        record["description"] = (
            f"基于优衣库中国站男装与女装“休闲外套”分类页公开商品信息整理。"
            f"适用性别：{record['gender_line']}；归属子类：{category_text}；价格：¥{record['price']}；颜色：{color_text}；"
            f"尺码：{size_text}；上市季节：{season_text}。"
        )

        del record["_category_titles"]
        del record["_season"]
        del record["_identity"]
        del record["_root_titles"]
        output.append(record)

    output.sort(key=lambda product: (category_order[product["category"]], product["price"], product["name"], product["id"]))

    target = Path(__file__).resolve().parents[1] / "src" / "data" / "products.json"
    target.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {len(output)} products to {target}")


if __name__ == "__main__":
    main()
