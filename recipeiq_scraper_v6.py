"""
RecipeIQ — Multi-Source Scraper v6
====================================
Extends v5 with Spend With Pennies as a third source.

SOURCE SELECTION RATIONALE:
    AllRecipes         — Primary anchor. Largest unbiased review pool,
                         home cook audience, no celebrity/sponsor influence.
    Food.com           — Formerly RecipeZaar. Large user-submitted recipe database,
                         genuine home cook reviews, no celebrity/sponsor bias.
                         NOTE: Food.com ratings trend high (4.5-5.0 range).
                         Wilson Score handles this naturally.
    Spend With Pennies — High-volume home cook blog (Holly Nilsson). Uses standard
                         WordPress Recipe Maker JSON-LD with ratingValue + ratingCount.
                         Strong review counts on popular recipes (1000-3000+ votes).
                         Clean recipe URLs, no Cloudflare blocking.

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
    Set TEST_MODE = True  → skips AllRecipes, runs 2 Food.com pages + 1 SWP category
    Set TEST_MODE = False → full run of all three sources (~90-120 min)

TIPS_ONLY MODE:
    Set TIPS_ONLY = True  → loads existing recipes_data.json, visits each
                            recipe URL to extract reviews, generates tips,
                            saves back. No re-scraping of search pages.
    Set TIPS_ONLY = False → normal full scrape (tips generated inline)

SETUP (one time):
    pip install playwright beautifulsoup4 anthropic
    python -m playwright install chromium

    Set your Anthropic API key:
    Windows:   set ANTHROPIC_API_KEY=sk-ant-...
    Mac/Linux: export ANTHROPIC_API_KEY=sk-ant-...

USAGE:
    python recipeiq_scraper_v6.py

OUTPUT:
    recipes_data.json  (drop-in replacement for v5 output, with crowd_tips)

EXPECTED YIELD (full run):
    AllRecipes:         ~300 recipes
    Food.com:           ~200 recipes
    Spend With Pennies: ~100 recipes
    Total:              ~550 recipes (after dedup by title)
"""

import json
import math
import os
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

try:
    import anthropic
except ImportError:
    print("Run: pip install anthropic")
    exit(1)


# ============================================================
# CONFIGURATION
# ============================================================

MIN_REVIEWS    = 50        # Uniform across all sources
MAX_PER_SEARCH = 10        # Max recipe links to follow per search term
MIN_DELAY      = 1         # Seconds between page loads (min) — was 2
MAX_DELAY      = 2         # Seconds between page loads (max) — was 4
HEADLESS       = True      # True = faster, False = visible (use if getting blocked)
OUTPUT_FILE    = "recipes_data.json"

# Set TEST_MODE = True to run 1 term per source (~10 min) to verify sites work
# Set TEST_MODE = False for a full run (~60-90 min)
TEST_MODE      = False

# Set TIPS_ONLY = True to backfill crowd_tips on existing JSON without re-scraping
TIPS_ONLY      = False

# Minimum visible review texts needed before calling Claude API
MIN_REVIEWS_FOR_TIPS = 3


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

# In TEST_MODE: skip AllRecipes, use just 2 Food.com category pages + 1 SWP page
ALLRECIPES_TERMS = [] if TEST_MODE else ALLRECIPES_TERMS_FULL
FOODCOM_URLS     = ["https://www.food.com/recipe/all/top-rated?pn=1",
                    "https://www.food.com/recipe/all/top-rated?pn=2"] if TEST_MODE else FOODCOM_URLS_FULL


# ============================================================
# SPEND WITH PENNIES — category pages
# ============================================================

# SWP base category URLs — scraper will paginate each up to SWP_MAX_PAGES deep
SWP_BASE_CATEGORIES = [
    "https://www.spendwithpennies.com/category/recipes/main-dishes/",
    "https://www.spendwithpennies.com/category/recipes/main-dishes/chicken-main-dishes/",
    "https://www.spendwithpennies.com/category/recipes/main-dishes/beef-main-dishes/",
    "https://www.spendwithpennies.com/category/recipes/main-dishes/beef-main-dishes/ground-beef/",
    "https://www.spendwithpennies.com/category/recipes/main-dishes/pork/",
    "https://www.spendwithpennies.com/category/recipes/main-dishes/pasta/",
    "https://www.spendwithpennies.com/category/recipes/main-dishes/casseroles/",
    "https://www.spendwithpennies.com/category/recipes/main-dishes/seafood/",
    "https://www.spendwithpennies.com/category/recipes/soups-and-stews/",
    "https://www.spendwithpennies.com/category/recipes/side-dishes/",
    "https://www.spendwithpennies.com/category/recipes/appetizers/",
    "https://www.spendwithpennies.com/category/recipes/slow-cooker/",
    "https://www.spendwithpennies.com/category/recipes/air-fryer/",
    "https://www.spendwithpennies.com/category/recipes/breakfast-recipes/",
    "https://www.spendwithpennies.com/category/recipes/baking-and-breads/",
    "https://www.spendwithpennies.com/category/recipes/dessert-recipes/",
]

# How many pages deep to paginate per category (page 1, 2, 3...)
SWP_MAX_PAGES = 3

def build_swp_urls(base_categories, max_pages):
    urls = []
    for base in base_categories:
        for p in range(1, max_pages + 1):
            if p == 1:
                urls.append(base)
            else:
                # WordPress pagination: base_url/page/N/
                urls.append(base.rstrip('/') + f'/page/{p}/')
    return urls

SWP_URLS_FULL = build_swp_urls(SWP_BASE_CATEGORIES, SWP_MAX_PAGES)
SWP_URLS = ["https://www.spendwithpennies.com/category/recipes/main-dishes/"] if TEST_MODE else SWP_URLS_FULL


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
        "crowd_tips":  [],
        "scraped_at":  datetime.now().isoformat(),
    }


# ============================================================
# CROWD INTELLIGENT TWEAKS
# ============================================================

def extract_review_texts(page):
    """
    Extract visible review text from the current recipe page.
    Prioritizes JSON-LD review array (most reliable), then falls
    back to broad HTML scraping across many possible class names.
    Returns a list of review strings.
    """
    reviews = []
    try:
        # Scroll to trigger review section lazy-load
        for _ in range(5):
            page.evaluate("window.scrollBy(0, window.innerHeight)")
            time.sleep(0.8)

        soup = BeautifulSoup(page.content(), "html.parser")

        # STRATEGY 1: JSON-LD review array (most reliable, works on both sites)
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                ld = json.loads(script.string)
                candidates = ld if isinstance(ld, list) else [ld]
                for item in candidates:
                    if not isinstance(item, dict):
                        continue
                    t = item.get("@type", "")
                    if t == "Recipe" or (isinstance(t, list) and "Recipe" in t):
                        for rv in item.get("review", [])[:15]:
                            body = rv.get("reviewBody", "")
                            if body and len(body) > 30:
                                reviews.append(body)
                        break
            except Exception:
                continue

        if reviews:
            return reviews

        # STRATEGY 2: itemprop="reviewBody" (semantic HTML)
        for el in soup.find_all(attrs={"itemprop": "reviewBody"})[:15]:
            text = el.get_text(separator=" ", strip=True)
            if len(text) > 30:
                reviews.append(text)

        if reviews:
            return reviews

        # STRATEGY 3: Broad class name sweep — covers AllRecipes + Food.com variations
        patterns = [
            re.compile(r"review", re.I),
            re.compile(r"comment", re.I),
            re.compile(r"feedback", re.I),
            re.compile(r"user.text", re.I),
            re.compile(r"rating.text", re.I),
        ]
        seen = set()
        for pattern in patterns:
            for el in soup.find_all(attrs={"class": pattern})[:30]:
                text = el.get_text(separator=" ", strip=True)
                # Must be substantial, not a heading or label
                if len(text) > 60 and text not in seen:
                    seen.add(text)
                    reviews.append(text)
            if len(reviews) >= 5:
                break

    except Exception:
        pass

    return reviews[:15]


def generate_crowd_tips(recipe_name, reviews, client):
    """
    Call Claude API with review texts, return list of up to 3 actionable tips.
    Returns [] on failure or insufficient data.
    """
    if len(reviews) < MIN_REVIEWS_FOR_TIPS:
        return []

    review_block = "\n\n".join(
        [f"Review {i+1}: {r}" for i, r in enumerate(reviews[:15])]
    )

    system_prompt = (
        "You are a culinary assistant analyzing real user reviews for a recipe ranking site.\n"
        "Your job is to extract the 3 most actionable crowd-sourced tips from the reviews below.\n\n"
        "Rules:\n"
        "- Focus on modifications, substitutions, technique adjustments, or warnings\n"
        "- Ignore generic praise like 'delicious' or 'family loved it'\n"
        "- Each tip must be specific and actionable\n"
        "- Write each tip in 10 words or less\n"
        "- If fewer than 2 actionable tips exist, return what you find — don't invent tips\n"
        '- Respond only in JSON: {"tips": ["tip1", "tip2", "tip3"]}'
    )

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            system=system_prompt,
            messages=[{"role": "user", "content": f"Recipe: {recipe_name}\n\nReviews:\n{review_block}"}]
        )
        raw = re.sub(r"```json|```", "", message.content[0].text).strip()
        parsed = json.loads(raw)
        tips = parsed.get("tips", [])
        if isinstance(tips, list) and all(isinstance(t, str) for t in tips):
            return tips[:3]
    except Exception as e:
        print(f"      ⚠ Tips API error: {e}")
    return []


# ============================================================
# TIPS-ONLY MODE
# ============================================================

def run_tips_only(client):
    """Load existing JSON, visit each recipe URL, generate missing crowd_tips."""
    if not os.path.exists(OUTPUT_FILE):
        print(f"❌ {OUTPUT_FILE} not found. Run full scrape first.")
        return

    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    recipes = data.get("recipes", data) if isinstance(data, dict) else data
    missing = [r for r in recipes if not r.get("crowd_tips")]
    print(f"📋 {len(recipes)} total recipes — {len(missing)} missing crowd_tips\n")

    if not missing:
        print("✅ All recipes already have crowd_tips. Nothing to do.")
        return

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

        for i, recipe in enumerate(missing):
            print(f"[{i+1}/{len(missing)}] {recipe['title'][:52]}")
            try:
                page.goto(recipe["url"], wait_until="domcontentloaded", timeout=30000)
                human_delay()
                review_texts = extract_review_texts(page)
                if len(review_texts) >= MIN_REVIEWS_FOR_TIPS:
                    tips = generate_crowd_tips(recipe["title"], review_texts, client)
                    recipe["crowd_tips"] = tips
                    print(f"   ✅ {tips}")
                else:
                    recipe["crowd_tips"] = []
                    print(f"   ⚪ Only {len(review_texts)} reviews visible — skipped")
            except Exception as e:
                print(f"   ❌ {e}")
                recipe["crowd_tips"] = []
            human_delay()

        browser.close()

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    filled = sum(1 for r in recipes if r.get("crowd_tips"))
    print(f"\n✅ Done. {filled}/{len(recipes)} recipes now have crowd_tips.")
    print(f"   Saved to {OUTPUT_FILE}")


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

def scrape_recipe_page(page, url, source_name, client=None):
    """Navigate to a recipe page and extract structured data + crowd tips."""
    try:
        try:
            page.goto(url, wait_until="networkidle", timeout=8000)
        except Exception:
            page.goto(url, wait_until="domcontentloaded", timeout=15000)
            time.sleep(1)

        human_delay()
        soup = BeautifulSoup(page.content(), "html.parser")
        recipe_data = extract_json_ld_recipe(soup)

        if not recipe_data:
            time.sleep(2)
            soup = BeautifulSoup(page.content(), "html.parser")
            recipe_data = extract_json_ld_recipe(soup)

        if not recipe_data:
            return None

        recipe = build_recipe(recipe_data, url, source_name)
        if not recipe:
            return None

        # Generate crowd tips if client provided
        if client:
            review_texts = extract_review_texts(page)
            if len(review_texts) >= MIN_REVIEWS_FOR_TIPS:
                recipe["crowd_tips"] = generate_crowd_tips(recipe["title"], review_texts, client)

        return recipe
    except Exception:
        return None


# ============================================================
# PER-SOURCE SCRAPE RUNNERS
# ============================================================

def scrape_allrecipes(page, seen_urls, all_recipes, client):
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
                recipe = scrape_recipe_page(page, link, "AllRecipes", client)
                if recipe and recipe["reviews"] >= MIN_REVIEWS:
                    all_recipes.append(recipe)
                    tips_label = f"💡 {len(recipe['crowd_tips'])} tips" if recipe.get("crowd_tips") else "⚪ no tips"
                    print(f"  ✅ {recipe['title'][:38]:38s} | {recipe['rating']}★ | {recipe['reviews']:>6,} reviews | {recipe['confidence']}% | {tips_label}")
                elif recipe:
                    print(f"  ⏭  {recipe['title'][:40]:40s} | {recipe['reviews']} reviews (below threshold)")
                else:
                    print(f"  ❌ Failed")

        except Exception as e:
            print(f"  ⚠ Search error: {e}")

        human_delay()


def scrape_foodcom(page, seen_urls, all_recipes, client):
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
                recipe = scrape_recipe_page(page, link, "Food.com", client)
                if recipe and recipe["reviews"] >= MIN_REVIEWS:
                    all_recipes.append(recipe)
                    tips_label = f"💡 {len(recipe['crowd_tips'])} tips" if recipe.get("crowd_tips") else "⚪ no tips"
                    print(f"  ✅ {recipe['title'][:38]:38s} | {recipe['rating']}★ | {recipe['reviews']:>6,} reviews | {recipe['confidence']}% | {tips_label}")
                elif recipe:
                    print(f"  ⏭  {recipe['title'][:40]:40s} | {recipe['reviews']} reviews (below threshold)")
                else:
                    print(f"  ❌ Failed")

        except Exception as e:
            print(f"  ⚠ Error: {e}")

        human_delay()


def get_swp_links(page):
    return page.evaluate("""
        () => {
            const links = new Set();
            // Pages that look like recipes but aren't
            const blocklist = ['about', 'cookbook', 'saved-recipes', 'meal-planner',
                               'privacy', 'contact', 'disclosure', 'policy', 'shop',
                               'bundle', 'subscribe', 'newsletter', 'resources'];
            document.querySelectorAll('a[href]').forEach(a => {
                const href = a.href || '';
                const slug = href.replace(/https?:\\/\\/www\\.spendwithpennies\\.com\\//, '').replace(/\\/$/, '');
                if (href.match(/spendwithpennies\\.com\\/[a-z0-9][a-z0-9-]+\\/?$/) &&
                    !href.match(/\\/category\\//) &&
                    !href.match(/\\/author\\//) &&
                    !href.match(/\\/tag\\//) &&
                    !href.match(/\\/page\\//) &&
                    !href.match(/\\/recipe-index/) &&
                    !href.endsWith('spendwithpennies.com/') &&
                    !blocklist.some(b => slug.includes(b))) {
                    links.add(href.split('?')[0].replace(/\\/$/, '') + '/');
                }
            });
            return Array.from(links);
        }
    """)


def scrape_swp(page, seen_urls, all_recipes, client):
    print("\n" + "=" * 60)
    print("  SOURCE 3: Spend With Pennies")
    print("=" * 60)

    try:
        page.goto("https://www.spendwithpennies.com/", wait_until="domcontentloaded", timeout=30000)
        human_delay()
        print("  ✅ Spend With Pennies homepage loaded")
    except Exception:
        print("  ⚠ Homepage slow, continuing anyway")

    for idx, url in enumerate(SWP_URLS):
        label = url.split("spendwithpennies.com/")[-1][:50]
        print(f"\n  [{idx+1}/{len(SWP_URLS)}] 📂 {label}")

        try:
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
            time.sleep(2)
            # Scroll to load lazy-loaded recipe cards
            for _ in range(5):
                page.evaluate("window.scrollBy(0, window.innerHeight)")
                time.sleep(0.8)

            links = get_swp_links(page)
            new_links = [l for l in links if l not in seen_urls][:30]  # Higher cap — SWP has ~39 links/page
            print(f"  Found {len(links)} links ({len(new_links)} new)")

            for link in new_links:
                seen_urls.add(link)
                recipe = scrape_recipe_page(page, link, "Spend With Pennies", client)
                if recipe and recipe["reviews"] >= MIN_REVIEWS:
                    all_recipes.append(recipe)
                    tips_label = f"💡 {len(recipe['crowd_tips'])} tips" if recipe.get("crowd_tips") else "⚪ no tips"
                    print(f"  ✅ {recipe['title'][:38]:38s} | {recipe['rating']}★ | {recipe['reviews']:>6,} reviews | {recipe['confidence']}% | {tips_label}")
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
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY not set.")
        print("   Windows:   set ANTHROPIC_API_KEY=sk-ant-...")
        print("   Mac/Linux: export ANTHROPIC_API_KEY=sk-ant-...")
        exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    if TIPS_ONLY:
        print("🔁 TIPS-ONLY MODE — filling missing crowd_tips in existing JSON\n")
        run_tips_only(client)
        return

    mode_label = "TEST MODE (2 Food.com pages + 1 SWP category)" if TEST_MODE else "FULL RUN"
    print(f"🍳 RecipeIQ Multi-Source Scraper v6 — {mode_label}")
    print(f"   Sources: Spend With Pennies + AllRecipes + Food.com")
    print(f"   Min reviews threshold: {MIN_REVIEWS} (uniform across all sources)")
    print(f"   Max recipes per search: {MAX_PER_SEARCH}")
    print(f"   Min reviews for tips: {MIN_REVIEWS_FOR_TIPS}")
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

        scrape_swp(page, seen_urls, all_recipes, client)
        scrape_allrecipes(page, seen_urls, all_recipes, client)
        scrape_foodcom(page, seen_urls, all_recipes, client)

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

    tips_count = sum(1 for r in all_recipes if r.get("crowd_tips"))

    output = {
        "scraped_at":            datetime.now().isoformat(),
        "sources":               list(sources.keys()),
        "total_recipes":         len(all_recipes),
        "min_reviews_threshold": MIN_REVIEWS,
        "recipes":               all_recipes,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    # Summary
    print(f"\n{'=' * 60}")
    print(f"✅ SCRAPING COMPLETE")
    print(f"{'=' * 60}")
    print(f"   Total recipes saved:      {len(all_recipes)}")
    for src, count in sources.items():
        print(f"   {src}: {count} recipes")
    avg_conf     = sum(r["confidence"] for r in all_recipes) / len(all_recipes)
    images_found = sum(1 for r in all_recipes if r.get("image"))
    print(f"   Average confidence:       {avg_conf:.1f}%")
    print(f"   Recipes with images:      {images_found}/{len(all_recipes)}")
    print(f"   Recipes with crowd tips:  {tips_count}/{len(all_recipes)}")
    print(f"   Output: {OUTPUT_FILE}")
    print(f"\n   Copy {OUTPUT_FILE} → public/ and git push to deploy!")


if __name__ == "__main__":
    main()
