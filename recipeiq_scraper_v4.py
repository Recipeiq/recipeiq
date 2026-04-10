"""
RecipeIQ — Multi-Source Scraper v4
====================================
Scrapes AllRecipes + Food.com in a single run.
Both sites use JSON-LD structured data with ratings and review counts.
Images are captured from each recipe page.

SOURCE SELECTION RATIONALE:
    AllRecipes — Primary anchor. Largest unbiased review pool,
                 home cook audience, no celebrity/sponsor influence.
    Food.com   — Formerly RecipeZaar. Large user-submitted recipe database,
                 genuine home cook reviews, no celebrity/sponsor bias.
                 NOTE: Food.com ratings trend high (4.5-5.0 range).
                 Wilson Score handles this naturally — recipes with
                 inflated ratings but low review counts rank lower.

EXCLUDED SOURCES (and why):
    Food Network   — celebrity fandom inflates ratings, sponsor bias
    King Arthur    — blocks scrapers via Cloudflare (403)
    Serious Eats   — blocks scrapers via Cloudflare (403)
    Food52         — search results JS-rendered, links not in DOM
    Simply Recipes — no aggregateRating in JSON-LD
    Taste of Home  — no Recipe JSON-LD at all
    Epicurious     — no Recipe JSON-LD at all

INTEGRITY NOTE:
    All sources ranked purely by Wilson Score confidence algorithm.
    The algorithm is source-blind — ranking is determined only by
    rating and review count, not source.
    MIN_REVIEWS = 50 applied uniformly across all sources.

TEST MODE:
    Set TEST_MODE = True  → skips AllRecipes, runs 1 term each for
                            Food.com only (~5 min to validate)
    Set TEST_MODE = False → full run of both sources (~60-90 min)

SETUP (one time):
    pip install playwright beautifulsoup4
    python -m playwright install chromium

USAGE:
    python recipeiq_scraper_v4.py

OUTPUT:
    recipes_data.json  (drop-in replacement for v3 output)

EXPECTED YIELD (full run):
    AllRecipes: ~300 recipes
    Food.com:   ~200 recipes
    Total:      ~450 recipes (after dedup by title)
"""

import json
import math
import re
import time
import random
from datetime import datetime

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Run: pip install playwright && python -m playwright install chromium")
    exit(1)

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Run: pip install beautifulsoup4")
    exit(1)


# ============================================================
# CONFIGURATION
# ============================================================

MIN_REVIEWS    = 50        # Uniform across all sources
MAX_PER_SEARCH = 10        # Max recipe links to follow per search term
MIN_DELAY      = 2         # Seconds between page loads (min)
MAX_DELAY      = 4         # Seconds between page loads (max)
HEADLESS       = True     # False = visible browser (better for avoiding blocks)
OUTPUT_FILE    = "recipes_data.json"

# Set TEST_MODE = True to run 1 term per source (~10 min) to verify sites work
# Set TEST_MODE = False for a full run (~60-90 min)
TEST_MODE      = False


# ============================================================
# SEARCH TERMS PER SOURCE
# ============================================================

ALLRECIPES_TERMS_FULL = [
    "best chicken recipes", "best beef recipes", "best pork recipes",
    "best shrimp recipes", "best salmon recipes",
    "easy dinner recipes", "quick weeknight meals",
    "best breakfast recipes", "best lunch recipes", "best appetizers",
    "best soup recipes", "best pasta recipes", "best casserole recipes",
    "best salad recipes", "best sandwich recipes",
    "best cookie recipes", "best cake recipes", "best bread recipes",
    "best muffin recipes", "best pie recipes",
    "best slow cooker recipes", "best grilled recipes",
    "best air fryer recipes", "best instant pot recipes",
    "best indian recipes", "best mexican recipes", "best italian recipes",
    "best chinese recipes", "best thai recipes",
    "best comfort food recipes", "best mac and cheese",
    "best chili recipes", "best stew recipes", "best burger recipes",
    "beef wellington", "rack of lamb", "coq au vin", "beef bourguignon",
    "lobster bisque", "eggs benedict", "beef tenderloin",
]


# Food.com category URLs sorted by rating — surfaces well-reviewed classics
# much better than search which returns new/obscure recipes
FOODCOM_URLS_FULL = [
    # Top-rated pages 1-10 — sorted by reviews, best source of popular classics
    "https://www.food.com/recipe/all/top-rated?pn=1",
    "https://www.food.com/recipe/all/top-rated?pn=2",
    "https://www.food.com/recipe/all/top-rated?pn=3",
    "https://www.food.com/recipe/all/top-rated?pn=4",
    "https://www.food.com/recipe/all/top-rated?pn=5",
    "https://www.food.com/recipe/all/top-rated?pn=6",
    "https://www.food.com/recipe/all/top-rated?pn=7",
    "https://www.food.com/recipe/all/top-rated?pn=8",
    "https://www.food.com/recipe/all/top-rated?pn=9",
    "https://www.food.com/recipe/all/top-rated?pn=10",
    # Category pages for cuisine/meal type coverage
    "https://www.food.com/ideas/quick-easy-chicken-dinners-6013",
    "https://www.food.com/ideas/quick-easy-ground-beef-dinners-6011",
    "https://www.food.com/ideas/best-soup-recipes-6176",
    "https://www.food.com/ideas/quick-easy-pasta-dishes-6078",
    "https://www.food.com/ideas/best-homemade-bread-6912",
    "https://www.food.com/ideas/cookie-recipes-7152",
    "https://www.food.com/ideas/top-casseroles-6016",
    "https://www.food.com/ideas/winning-chili-recipes-6283",
    "https://www.food.com/ideas/top-dessert-recipes-6930",
    "https://www.food.com/ideas/top-appetizer-recipes-7009",
    "https://www.food.com/ideas/best-salmon-recipes-6370",
    "https://www.food.com/ideas/best-baked-pork-chops-6369",
    "https://www.food.com/ideas/top-shrimp-recipes-6566",
    "https://www.food.com/ideas/indian-food-recipes-at-home-6821",
    "https://www.food.com/ideas/mexican-food-at-home-6830",
    "https://www.food.com/ideas/italian-food-recipes-at-home-6828",
    "https://www.food.com/ideas/chinese-food-at-home-6807",
    "https://www.food.com/ideas/thai-food-recipes-at-home-6820",
    "https://www.food.com/ideas/comfort-food-6505",
    "https://www.food.com/ideas/best-air-fryer-recipes-6847",
    "https://www.food.com/ideas/best-instant-pot-recipes-6928",
    "https://www.food.com/ideas/comfort-food-6505/slow-cooker-6508",
]

# In TEST_MODE: skip AllRecipes, use just 2 Food.com category pages
ALLRECIPES_TERMS = [] if TEST_MODE else ALLRECIPES_TERMS_FULL
FOODCOM_URLS     = ["https://www.food.com/recipe/all/top-rated?pn=1",
                    "https://www.food.com/recipe/all/top-rated?pn=2"] if TEST_MODE else FOODCOM_URLS_FULL


# ============================================================
# HELPERS
# ============================================================

def wilson_score(rating, n, z=1.96):
    if n == 0:
        return 0
    p = rating / 5.0
    denom = 1 + z * z / n
    center = p + z * z / (2 * n)
    spread = z * math.sqrt((p * (1 - p) + z * z / (4 * n)) / n)
    lower = (center - spread) / denom
    return round(min(99.9, max(0, lower * 100)), 1)


def human_delay():
    time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))


def parse_duration(d):
    if not d:
        return "N/A"
    hours = re.search(r"(\d+)H", d)
    mins  = re.search(r"(\d+)M", d)
    parts = []
    if hours:
        h = int(hours.group(1))
        parts.append(f"{h} hr{'s' if h > 1 else ''}")
    if mins:
        parts.append(f"{int(mins.group(1))} min")
    return " ".join(parts) if parts else "N/A"


def extract_image(recipe_data):
    """Pull image URL from JSON-LD image field (string, list, or ImageObject)."""
    img = recipe_data.get("image", "")
    if isinstance(img, list):
        img = img[0] if img else ""
    if isinstance(img, dict):
        img = img.get("url", "")
    # Make sure it's an absolute URL
    if img and img.startswith("http"):
        return img
    return ""


def extract_json_ld_recipe(soup):
    """Find and return the Recipe JSON-LD block from a BeautifulSoup page."""
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            ld = json.loads(script.string)
            candidates = []
            if isinstance(ld, list):
                candidates = ld
            elif isinstance(ld, dict):
                candidates = ld.get("@graph", [ld])

            for item in candidates:
                if not isinstance(item, dict):
                    continue
                t = item.get("@type", "")
                if t == "Recipe" or (isinstance(t, list) and "Recipe" in t):
                    return item
        except (json.JSONDecodeError, TypeError):
            continue
    return None


def build_recipe(recipe_data, url, source_name):
    """Convert a JSON-LD recipe dict into the RecipeIQ format."""
    agg = recipe_data.get("aggregateRating", {})
    if isinstance(agg, str):
        return None

    # Try multiple field names sites use for rating and review count
    rating  = float(agg.get("ratingValue") or agg.get("bestRating") or 0)
    reviews = int(float(
        agg.get("ratingCount") or
        agg.get("reviewCount") or
        agg.get("userInteractionCount") or 0
    ))

    if rating == 0 or reviews == 0:
        return None

    title = recipe_data.get("name", "").strip()
    title = title.replace("&#39;", "'").replace("&amp;", "&").replace("&quot;", '"')
    if not title:
        return None

    # Filter out joke/troll recipes — real recipes have at least 2 ingredients
    ingredients = recipe_data.get("recipeIngredient", [])
    if len(ingredients) < 2:
        return None

    desc = re.sub(r"<[^>]+>", "", recipe_data.get("description", "")).strip()
    if len(desc) > 200:
        desc = desc[:197] + "..."

    category = recipe_data.get("recipeCategory", "")
    if isinstance(category, list):
        category = category[0] if category else ""
    category = category.strip() or "Dinner"

    return {
        "title":       title,
        "source":      source_name,
        "url":         url,
        "image":       extract_image(recipe_data),
        "rating":      round(rating, 1),
        "reviews":     reviews,
        "category":    category,
        "time":        parse_duration(recipe_data.get("totalTime", "")),
        "description": desc,
        "confidence":  wilson_score(rating, reviews),
        "ingredients": ingredients,
        "scraped_at":  datetime.now().isoformat(),
    }


# ============================================================
# SOURCE-SPECIFIC LINK EXTRACTORS
# ============================================================

def get_allrecipes_links(page):
    return page.evaluate("""
        () => {
            const links = new Set();
            document.querySelectorAll('a[href]').forEach(a => {
                const href = a.href || '';
                if (href.match(/allrecipes\\.com\\/recipe\\/\\d+/)) {
                    links.add(href.split('?')[0].split('#')[0].replace(/\\/$/, '') + '/');
                }
            });
            return Array.from(links);
        }
    """)


def get_foodcom_links(page):
    return page.evaluate("""
        () => {
            const links = new Set();
            document.querySelectorAll('a[href]').forEach(a => {
                const href = a.href || '';
                // Food.com recipe URLs: /recipe/recipe-name-12345
                if (href.match(/food\\.com\\/recipe\\/[a-z0-9-]+-\\d+/)) {
                    links.add(href.split('?')[0].split('#')[0]);
                }
            });
            return Array.from(links);
        }
    """)




# ============================================================
# GENERIC SCRAPE FUNCTION (works for all sources)
# ============================================================

def scrape_recipe_page(page, url, source_name):
    """Navigate to a recipe page and extract structured data.
    Uses networkidle for JS-heavy sites, with a fallback to domcontentloaded."""
    try:
        # Try networkidle first — waits for JS to finish rendering
        try:
            page.goto(url, wait_until="networkidle", timeout=20000)
        except Exception:
            # Fallback: some pages never fully idle, just wait for DOM + extra time
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
            time.sleep(3)

        human_delay()
        soup = BeautifulSoup(page.content(), "html.parser")
        recipe_data = extract_json_ld_recipe(soup)

        # If JSON-LD not found, try waiting a bit more and re-parsing
        # (handles sites that inject structured data slightly after DOM load)
        if not recipe_data:
            time.sleep(3)
            soup = BeautifulSoup(page.content(), "html.parser")
            recipe_data = extract_json_ld_recipe(soup)

        if not recipe_data:
            return None
        return build_recipe(recipe_data, url, source_name)
    except Exception:
        return None


# ============================================================
# PER-SOURCE SCRAPE RUNNERS
# ============================================================

def scrape_allrecipes(page, seen_urls, all_recipes):
    print("\n" + "=" * 60)
    print("  SOURCE 1: AllRecipes")
    print("=" * 60)

    try:
        page.goto("https://www.allrecipes.com/", wait_until="domcontentloaded", timeout=30000)
        human_delay()
        print("  ✅ AllRecipes homepage loaded")
    except Exception:
        print("  ⚠ Homepage slow, continuing anyway")

    for idx, term in enumerate(ALLRECIPES_TERMS):
        search_url = f"https://www.allrecipes.com/search?q={term.replace(' ', '+')}"
        print(f"\n  [{idx+1}/{len(ALLRECIPES_TERMS)}] 🔍 \"{term}\"")

        try:
            page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
            time.sleep(2)
            for _ in range(4):
                page.evaluate("window.scrollBy(0, window.innerHeight)")
                time.sleep(0.8)

            links = get_allrecipes_links(page)
            new_links = [l for l in links if l not in seen_urls][:MAX_PER_SEARCH]
            print(f"  Found {len(links)} links ({len(new_links)} new)")

            for link in new_links:
                seen_urls.add(link)
                recipe = scrape_recipe_page(page, link, "AllRecipes")
                if recipe and recipe["reviews"] >= MIN_REVIEWS:
                    all_recipes.append(recipe)
                    print(f"  ✅ {recipe['title'][:40]:40s} | {recipe['rating']}★ | {recipe['reviews']:>6,} reviews | {recipe['confidence']}%")
                elif recipe:
                    print(f"  ⏭  {recipe['title'][:40]:40s} | {recipe['reviews']} reviews (below threshold)")
                else:
                    print(f"  ❌ Failed")

        except Exception as e:
            print(f"  ⚠ Search error: {e}")

        human_delay()


def scrape_foodcom(page, seen_urls, all_recipes):
    print("\n" + "=" * 60)
    print("  SOURCE 2: Food.com")
    print("=" * 60)

    try:
        page.goto("https://www.food.com/", wait_until="domcontentloaded", timeout=30000)
        human_delay()
        print("  ✅ Food.com homepage loaded")
    except Exception:
        print("  ⚠ Homepage slow, continuing anyway")

    for idx, url in enumerate(FOODCOM_URLS):
        label = url.split("food.com/")[-1][:50]
        print(f"\n  [{idx+1}/{len(FOODCOM_URLS)}] 📂 {label}")

        try:
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
            time.sleep(2)
            for _ in range(4):
                page.evaluate("window.scrollBy(0, window.innerHeight)")
                time.sleep(0.8)

            links = get_foodcom_links(page)
            new_links = [l for l in links if l not in seen_urls][:MAX_PER_SEARCH]
            print(f"  Found {len(links)} links ({len(new_links)} new)")

            for link in new_links:
                seen_urls.add(link)
                recipe = scrape_recipe_page(page, link, "Food.com")
                if recipe and recipe["reviews"] >= MIN_REVIEWS:
                    all_recipes.append(recipe)
                    print(f"  ✅ {recipe['title'][:40]:40s} | {recipe['rating']}★ | {recipe['reviews']:>6,} reviews | {recipe['confidence']}%")
                elif recipe:
                    print(f"  ⏭  {recipe['title'][:40]:40s} | {recipe['reviews']} reviews (below threshold)")
                else:
                    print(f"  ❌ Failed")

        except Exception as e:
            print(f"  ⚠ Error: {e}")

        human_delay()


# ============================================================
# MAIN
# ============================================================

def main():
    mode_label = "TEST MODE (1 term per source)" if TEST_MODE else "FULL RUN"
    print(f"🍳 RecipeIQ Multi-Source Scraper v4 — {mode_label}")
    print(f"   Sources: AllRecipes + Food.com")
    print(f"   Min reviews threshold: {MIN_REVIEWS} (uniform across all sources)")
    print(f"   Max recipes per search: {MAX_PER_SEARCH}")
    print(f"   Browser: {'headless' if HEADLESS else 'visible'}")
    print(f"   Output: {OUTPUT_FILE}")
    print()

    all_recipes = []
    seen_urls   = set()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=HEADLESS,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
        )
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            locale="en-US",
            timezone_id="America/New_York",
        )
        context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            window.chrome = { runtime: {} };
        """)
        page = context.new_page()

        scrape_allrecipes(page, seen_urls, all_recipes)
        scrape_foodcom(page, seen_urls, all_recipes)

        browser.close()

    if not all_recipes:
        print("\n⚠ No recipes collected.")
        print("   Try setting HEADLESS = False to debug.")
        return

    # Deduplicate by title (keep highest review count)
    unique = {}
    for r in all_recipes:
        key = r["title"].lower().strip()
        if key not in unique or r["reviews"] > unique[key]["reviews"]:
            unique[key] = r
    all_recipes = list(unique.values())

    # Sort by confidence descending
    all_recipes.sort(key=lambda r: r["confidence"], reverse=True)
    for i, r in enumerate(all_recipes):
        r["id"] = i + 1

    # Source breakdown
    sources = {}
    for r in all_recipes:
        sources[r["source"]] = sources.get(r["source"], 0) + 1

    output = {
        "scraped_at":           datetime.now().isoformat(),
        "sources":              list(sources.keys()),
        "total_recipes":        len(all_recipes),
        "min_reviews_threshold": MIN_REVIEWS,
        "recipes":              all_recipes,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    # Summary
    print(f"\n{'=' * 60}")
    print(f"✅ SCRAPING COMPLETE")
    print(f"{'=' * 60}")
    print(f"   Total recipes saved: {len(all_recipes)}")
    for src, count in sources.items():
        print(f"   {src}: {count} recipes")
    avg_conf    = sum(r["confidence"] for r in all_recipes) / len(all_recipes)
    images_found = sum(1 for r in all_recipes if r.get("image"))
    print(f"   Average confidence:  {avg_conf:.1f}%")
    print(f"   Recipes with images: {images_found}/{len(all_recipes)}")
    print(f"   Output: {OUTPUT_FILE}")
    print(f"\n   Copy {OUTPUT_FILE} → public/ and git push to deploy!")


if __name__ == "__main__":
    main()
