"""
RecipeIQ — Site Compatibility Tester
=====================================
Run this BEFORE adding a new site to the scraper.
Tests whether a site is scrapeable and has the data we need.

USAGE:
    python test_recipe_site.py

It will test Food.com, Taste of Home, and Epicurious and report:
  ✅ Works  — site loads, has JSON-LD, has ratings → safe to add
  ⚠ Partial — site loads but missing ratings/reviews → skip
  ❌ Blocked — site won't load → skip

Takes about 5 minutes total.
"""

import json, re, time
from bs4 import BeautifulSoup

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Run: pip install playwright && python -m playwright install chromium")
    exit(1)

# ============================================================
# SITES TO TEST
# Each entry: (name, search_url, sample_recipe_url, link_pattern_regex)
# ============================================================
SITES = [
    (
        "Food.com",
        "https://www.food.com/search/chicken",
        "https://www.food.com/recipe/juicy-roast-chicken-26110",
        r"food\.com/recipe/[a-z0-9-]+-\d+",
    ),
    (
        "Taste of Home",
        "https://www.tasteofhome.com/search/results/?q=chicken",
        "https://www.tasteofhome.com/recipes/contest-winning-roast-chicken/",
        r"tasteofhome\.com/recipes/[a-z0-9-]+/",
    ),
    (
        "Epicurious",
        "https://www.epicurious.com/search/chicken",
        "https://www.epicurious.com/recipes/food/views/perfect-roast-chicken",
        r"epicurious\.com/recipes/food/views/[a-z0-9-]+",
    ),
]


def extract_recipe_json_ld(html):
    soup = BeautifulSoup(html, "html.parser")
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string)
            items = data if isinstance(data, list) else data.get("@graph", [data])
            for item in items:
                if isinstance(item, dict) and item.get("@type") == "Recipe":
                    return item
        except:
            continue
    return None


def test_site(page, name, search_url, recipe_url, link_pattern):
    print(f"\n{'='*55}")
    print(f"  Testing: {name}")
    print(f"{'='*55}")
    results = {"loads": False, "links_found": 0, "json_ld": False, "has_rating": False, "has_reviews": False, "image": False}

    # --- Test 1: Search page loads and finds recipe links ---
    print(f"  1. Loading search page...")
    try:
        page.goto(search_url, wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        html = page.content()
        if len(html) > 1000:
            results["loads"] = True
            links = re.findall(link_pattern, html)
            results["links_found"] = len(set(links))
            print(f"     ✅ Loaded ({len(html):,} chars), {results['links_found']} recipe links found")
            for l in list(set(links))[:3]:
                print(f"        {l}")
        else:
            print(f"     ❌ Page empty or blocked (html={len(html)} chars)")
    except Exception as e:
        print(f"     ❌ Error: {e}")

    # --- Test 2: Recipe page JSON-LD ---
    print(f"  2. Loading recipe page...")
    try:
        page.goto(recipe_url, wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        html = page.content()
        if len(html) > 1000:
            print(f"     ✅ Loaded ({len(html):,} chars)")
            recipe = extract_recipe_json_ld(html)
            if recipe:
                results["json_ld"] = True
                agg = recipe.get("aggregateRating", {})
                rating  = agg.get("ratingValue")
                reviews = agg.get("ratingCount") or agg.get("reviewCount")
                image   = recipe.get("image", "")
                results["has_rating"]  = bool(rating)
                results["has_reviews"] = bool(reviews)
                results["image"]       = bool(image)
                print(f"     ✅ JSON-LD Recipe found!")
                print(f"        rating={rating}, reviews={reviews}, image={'yes' if image else 'no'}")
            else:
                print(f"     ⚠ Page loaded but no Recipe JSON-LD found")
                # Show what JSON-LD types ARE present
                soup = BeautifulSoup(html, "html.parser")
                for s in soup.find_all("script", type="application/ld+json")[:3]:
                    try:
                        d = json.loads(s.string)
                        t = d.get("@type") if isinstance(d, dict) else [x.get("@type") for x in d if isinstance(x, dict)]
                        print(f"        Found @type: {t}")
                    except: pass
        else:
            print(f"     ❌ Page empty or blocked")
    except Exception as e:
        print(f"     ❌ Error: {e}")

    # --- Verdict ---
    print(f"\n  VERDICT for {name}:")
    if results["loads"] and results["json_ld"] and results["has_rating"] and results["has_reviews"]:
        print(f"  ✅ WORKS — safe to add to scraper")
        print(f"     Links on search page: {results['links_found']}")
        print(f"     Has ratings: {results['has_rating']}, Has review count: {results['has_reviews']}, Has images: {results['image']}")
    elif results["loads"] and results["json_ld"]:
        print(f"  ⚠ PARTIAL — loads and has JSON-LD but missing rating or review count")
        print(f"     Has ratings: {results['has_rating']}, Has review count: {results['has_reviews']}")
    elif results["loads"]:
        print(f"  ⚠ PARTIAL — loads but no Recipe JSON-LD found (may use different schema)")
    else:
        print(f"  ❌ BLOCKED — site won't load, skip this source")

    return results


def main():
    print("🔍 RecipeIQ Site Compatibility Tester")
    print("   Testing: Food.com, Taste of Home, Epicurious")
    print("   This will take ~5 minutes. A browser window will open.\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,  # Visible browser avoids most bot detection
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
        )
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            locale="en-US",
        )
        context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            window.chrome = { runtime: {} };
        """)
        page = context.new_page()

        all_results = {}
        for name, search_url, recipe_url, link_pattern in SITES:
            all_results[name] = test_site(page, name, search_url, recipe_url, link_pattern)
            time.sleep(2)

        browser.close()

    # Final summary
    print(f"\n{'='*55}")
    print("  FINAL SUMMARY")
    print(f"{'='*55}")
    for name, r in all_results.items():
        if r["loads"] and r["json_ld"] and r["has_rating"] and r["has_reviews"]:
            print(f"  ✅ {name} — ADD TO SCRAPER")
        elif r["loads"]:
            print(f"  ⚠ {name} — PARTIAL (loads but missing data)")
        else:
            print(f"  ❌ {name} — BLOCKED (skip)")

    print("\nDone! Share the results and we'll build the scraper for the sites that work.")


if __name__ == "__main__":
    main()
