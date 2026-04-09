import { useState, useEffect, useRef, useCallback } from "react";

const DEMO_RECIPES = [
  { id: 1, title: "Marry Me Chicken", source: "AllRecipes", rating: 4.9, reviews: 12847, category: "Dinner", time: "45 min", confidence: 99.7, description: "Creamy sun-dried tomato chicken that's earned its legendary status", url: "" },
  { id: 2, title: "Birria Tacos", source: "AllRecipes", rating: 4.8, reviews: 8932, category: "Dinner", time: "3 hrs", confidence: 99.4, description: "Slow-braised beef in a rich chile consommé with melted cheese", url: "" },
  { id: 3, title: "Banana Bread", source: "AllRecipes", rating: 4.7, reviews: 34201, category: "Baking", time: "1 hr", confidence: 99.9, description: "The most-reviewed banana bread on the internet for a reason", url: "" },
  { id: 4, title: "Beef Wellington", source: "AllRecipes", rating: 4.6, reviews: 2103, category: "Dinner", time: "2.5 hrs", confidence: 97.8, description: "Restaurant-quality beef wrapped in mushroom duxelles and puff pastry", url: "" },
  { id: 5, title: "Chocolate Chip Cookies", source: "AllRecipes", rating: 4.9, reviews: 21456, category: "Baking", time: "30 min", confidence: 99.9, description: "The iconic recipe with browned butter and sea salt", url: "" },
  { id: 6, title: "Chicken Tikka Masala", source: "AllRecipes", rating: 4.7, reviews: 9876, category: "Dinner", time: "1 hr", confidence: 99.5, description: "Restaurant-style tikka masala with perfectly spiced tomato cream sauce", url: "" },
  { id: 7, title: "French Onion Soup", source: "AllRecipes", rating: 4.8, reviews: 5643, category: "Soup", time: "1.5 hrs", confidence: 99.1, description: "Deep caramelized onions under a blanket of melted Gruyère", url: "" },
  { id: 8, title: "Cinnamon Rolls", source: "AllRecipes", rating: 4.8, reviews: 15789, category: "Baking", time: "2.5 hrs", confidence: 99.8, description: "Pillowy soft rolls with cream cheese frosting — better than Cinnabon", url: "" },
  { id: 9, title: "Pad Thai", source: "AllRecipes", rating: 4.5, reviews: 3201, category: "Dinner", time: "40 min", confidence: 98.2, description: "Authentic balance of tamarind, fish sauce, and palm sugar with rice noodles", url: "" },
  { id: 10, title: "Smash Burgers", source: "AllRecipes", rating: 4.9, reviews: 7654, category: "Dinner", time: "20 min", confidence: 99.5, description: "Crispy-edged thin patties with maximum Maillard reaction flavor", url: "" },
  { id: 11, title: "Sourdough Bread", source: "AllRecipes", rating: 4.6, reviews: 4521, category: "Baking", time: "24 hrs", confidence: 98.8, description: "Open-crumb artisan loaf with tangy depth and crispy crust", url: "" },
  { id: 12, title: "Chicken Parmesan", source: "AllRecipes", rating: 4.8, reviews: 18932, category: "Dinner", time: "50 min", confidence: 99.8, description: "Crispy breaded cutlets smothered in marinara and melted mozzarella", url: "" },
  { id: 13, title: "Lemon Bars", source: "AllRecipes", rating: 4.7, reviews: 6234, category: "Baking", time: "1 hr", confidence: 99.2, description: "Buttery shortbread base with bright, custardy lemon filling", url: "" },
  { id: 14, title: "Pulled Pork", source: "AllRecipes", rating: 4.7, reviews: 11203, category: "BBQ", time: "8 hrs", confidence: 99.6, description: "Low and slow smoked pork shoulder that falls apart on contact", url: "" },
  { id: 15, title: "Tom Kha Gai", source: "AllRecipes", rating: 4.5, reviews: 1876, category: "Soup", time: "35 min", confidence: 96.9, description: "Thai coconut galangal soup with lemongrass and kaffir lime", url: "" },
  { id: 16, title: "Shakshuka", source: "AllRecipes", rating: 4.8, reviews: 8901, category: "Breakfast", time: "30 min", confidence: 99.4, description: "Eggs poached in spiced tomato sauce with crusty bread for dipping", url: "" },
  { id: 17, title: "Mac and Cheese", source: "AllRecipes", rating: 4.7, reviews: 22345, category: "Dinner", time: "45 min", confidence: 99.9, description: "Ultra-creamy baked mac with a sharp cheddar and Gruyère blend", url: "" },
  { id: 18, title: "Blueberry Muffins", source: "AllRecipes", rating: 4.6, reviews: 9123, category: "Baking", time: "35 min", confidence: 99.4, description: "Bakery-style muffins with crunchy sugar tops and bursting berries", url: "" },
  { id: 19, title: "Carnitas", source: "AllRecipes", rating: 4.8, reviews: 6789, category: "Dinner", time: "3.5 hrs", confidence: 99.3, description: "Crispy-tender braised pork with citrus and warm spices", url: "" },
  { id: 20, title: "Chocolate Lava Cake", source: "AllRecipes", rating: 4.7, reviews: 4567, category: "Baking", time: "25 min", confidence: 98.9, description: "Molten-centered individual cakes that look impossible but aren't", url: "" },
];

const EMOJI_MAP = [
  [/chicken|poultry/i, "🍗"], [/taco|burrito|enchilada|tortilla/i, "🌮"],
  [/bread|loaf|baguette|sourdough/i, "🍞"], [/steak|beef|wellington/i, "🥩"],
  [/cookie/i, "🍪"], [/curry|tikka|masala|korma/i, "🍛"],
  [/soup|stew|chili|chowder/i, "🍲"], [/roll|cinnamon|bun/i, "🧁"],
  [/noodle|pad thai|ramen|pho|lo mein/i, "🍜"], [/burger|hamburger/i, "🍔"],
  [/pizza/i, "🍕"], [/pasta|spaghetti|lasagna|penne|fettuccine|mac.*cheese/i, "🧀"],
  [/cake|cupcake|brownie/i, "🍫"], [/pie|tart/i, "🥧"],
  [/salad|slaw/i, "🥗"], [/egg|omelet|frittata|shakshuka|quiche/i, "🍳"],
  [/pork|carnitas|pulled/i, "🐷"], [/shrimp|prawn|seafood|fish|salmon|lobster|crab/i, "🦐"],
  [/rice|fried rice|risotto|paella/i, "🍚"], [/pancake|waffle|french toast/i, "🥞"],
  [/muffin|scone/i, "🫐"], [/lemon/i, "🍋"], [/chocolate/i, "🍫"],
  [/coconut/i, "🥥"], [/bbq|grill|barbecue|smoke/i, "🔥"],
  [/breakfast|brunch/i, "🍳"], [/sandwich|sub|wrap/i, "🥪"],
  [/banana/i, "🍌"], [/apple/i, "🍎"],
];

function getEmoji(title) {
  for (const [pattern, emoji] of EMOJI_MAP) {
    if (pattern.test(title)) return emoji;
  }
  return "🍽️";
}

function getTier(confidence) {
  if (confidence >= 99) return { label: "Proven", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
  if (confidence >= 97) return { label: "Strong", color: "#15803d", bg: "#f0fdf4", border: "#86efac" };
  if (confidence >= 95) return { label: "Solid", color: "#b45309", bg: "#fffbeb", border: "#fde68a" };
  return { label: "Good", color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" };
}

function RecipeModal({ recipe, onClose }) {
  if (!recipe) return null;
  const tier = getTier(recipe.confidence);
  const emoji = getEmoji(recipe.title);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 500, width: "100%", maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "#f1f5f9", border: "none", borderRadius: 50, width: 32, height: 32, color: "#64748b", fontSize: 18, cursor: "pointer" }}>×</button>
        <div style={{ fontSize: 44, marginBottom: 10 }}>{emoji}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: tier.bg, border: `1px solid ${tier.border}`, borderRadius: 20, padding: "3px 10px", marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: tier.color, display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: tier.color }}>{tier.label} Recipe</span>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 6, lineHeight: 1.3, paddingRight: 40 }}>{recipe.title}</h2>
        <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 20 }}>{recipe.description}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Rating", value: `${recipe.rating}★` },
            { label: "Reviews", value: recipe.reviews >= 1000 ? `${(recipe.reviews / 1000).toFixed(0)}k` : recipe.reviews },
            { label: "Confidence", value: `${recipe.confidence.toFixed(1)}%` },
          ].map(s => (
            <div key={s.label} style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{s.value}</div>
            </div>
          ))}
        </div>
        {recipe.time && recipe.time !== "N/A" && (
          <div style={{ fontSize: 14, color: "#475569", marginBottom: 16 }}>⏱ {recipe.time} cook time</div>
        )}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Ingredients</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {recipe.ingredients.map((ing, i) => (
                <div key={i} style={{ fontSize: 13, color: "#475569", padding: "6px 10px", background: "#f8fafc", borderRadius: 6 }}>{ing}</div>
              ))}
            </div>
          </div>
        )}
        {recipe.url ? (
          <a href={recipe.url} target="_blank" rel="noopener noreferrer"
            style={{ display: "block", textAlign: "center", background: "#16a34a", borderRadius: 12, padding: "13px 20px", color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
            View Full Recipe →
          </a>
        ) : (
          <div style={{ textAlign: "center", background: "#f1f5f9", borderRadius: 12, padding: "13px 20px", color: "#94a3b8", fontSize: 14 }}>
            Full recipe link available with live data
          </div>
        )}
      </div>
    </div>
  );
}

function RecipeCard({ recipe, index, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const tier = getTier(recipe.confidence);
  const emoji = getEmoji(recipe.title);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(recipe)}
      style={{
        background: "#fff", border: `1.5px solid ${hovered ? tier.border : "#e2e8f0"}`,
        borderRadius: 16, padding: 20, cursor: "pointer", transition: "all 0.2s ease",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
        animation: `fadeUp 0.4s ease ${Math.min(index * 0.04, 0.6)}s both`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <span style={{ fontSize: 32 }}>{emoji}</span>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: tier.bg, border: `1px solid ${tier.border}`, borderRadius: 20, padding: "3px 10px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: tier.color, display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: tier.color }}>{tier.label}</span>
        </div>
      </div>
      <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{recipe.title}</h3>
      <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748b", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {recipe.description}
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {recipe.category && <span style={{ background: "#f1f5f9", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#64748b", fontWeight: 500 }}>{recipe.category}</span>}
        {recipe.time && recipe.time !== "N/A" && <span style={{ background: "#f1f5f9", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#64748b" }}>⏱ {recipe.time}</span>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
        <div>
          <div style={{ fontSize: 13, color: "#f59e0b" }}>{"★".repeat(Math.round(recipe.rating))}{"☆".repeat(5 - Math.round(recipe.rating))}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{recipe.reviews.toLocaleString()} reviews</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>Confidence</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: tier.color }}>{recipe.confidence.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}

export default function RecipeConfidenceEngine() {
  const [recipes, setRecipes] = useState(DEMO_RECIPES);
  const [dataSource, setDataSource] = useState("demo");
  const [search, setSearch] = useState("");
  const [minReviews, setMinReviews] = useState(500);
  const [minRating, setMinRating] = useState(4.5);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("confidence");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [pasteText, setPasteText] = useState("");
  const fileInputRef = useRef(null);

  const loadRecipeData = useCallback((data, sourceName) => {
    try {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      const recipeList = parsed.recipes || parsed;
      if (!Array.isArray(recipeList) || recipeList.length === 0) {
        setLoadError("No valid recipes found in the data.");
        return false;
      }
      setRecipes(recipeList);
      setDataSource(`${sourceName} (${recipeList.length} recipes)`);
      setLoadError("");
      setShowUpload(false);
      setMinReviews(100);
      setPasteText("");
      return true;
    } catch {
      setLoadError("Invalid JSON format.");
      return false;
    }
  }, []);

  // Auto-fetch bundled JSON on mount; falls back to DEMO_RECIPES silently if missing
  useEffect(() => {
    fetch("/recipes_data.json")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => loadRecipeData(data, "recipes_data.json"))
      .catch(() => {
        // File not found or parse error — keep DEMO_RECIPES as-is
      });
  }, [loadRecipeData]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => loadRecipeData(evt.target.result, file.name);
    reader.readAsText(file);
  }, [loadRecipeData]);

  const categories = ["All", ...new Set(recipes.map(r => r.category).filter(Boolean).sort())];

  const filtered = recipes
    .filter(r => {
      if (search) {
        const q = search.toLowerCase();
        if (!r.title.toLowerCase().includes(q) &&
            !(r.description || "").toLowerCase().includes(q) &&
            !(r.ingredients || []).some(i => i.toLowerCase().includes(q))) return false;
      }
      if (r.reviews < minReviews) return false;
      if (r.rating < minRating) return false;
      if (selectedCategory !== "All" && r.category !== selectedCategory) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "confidence") return b.confidence - a.confidence;
      if (sortBy === "reviews") return b.reviews - a.reviews;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });

  const topConfidence = filtered.length ? Math.max(...filtered.map(r => r.confidence)) : 0;
  const totalReviews = filtered.reduce((s, r) => s + r.reviews, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8fafc; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        input[type="range"] { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; background: #e2e8f0; border-radius: 2px; outline: none; cursor: pointer; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #16a34a; border-radius: 50%; cursor: pointer; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #f1f5f9; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        a { text-decoration: none; }
      `}</style>

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>🍽️</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: -0.5 }}>RecipeIQ</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="#how-it-works" style={{ fontSize: 14, color: "#64748b", fontWeight: 500, padding: "6px 10px", textDecoration: "none" }}>
              How it works
            </a>
            <a href="#recipes" style={{ background: "#16a34a", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, color: "#fff", cursor: "pointer", fontWeight: 600, textDecoration: "none" }}>
              Find recipes ↓
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)", padding: "80px 24px 72px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "5px 14px", marginBottom: 24 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "pulse 2s ease infinite" }} />
          <span style={{ fontSize: 12, color: "#86efac", fontWeight: 500, letterSpacing: 0.5 }}>Statistically ranked recipes</span>
        </div>
        <h1 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 20, letterSpacing: -1 }}>
          Stop guessing which recipes<br />
          <span style={{ color: "#4ade80" }}>will actually work.</span>
        </h1>
        <p style={{ fontSize: "clamp(15px, 2vw, 19px)", color: "#94a3b8", maxWidth: 560, margin: "0 auto 12px", lineHeight: 1.7 }}>
          We score every recipe by its real probability of success — using thousands of home cook reviews and real statistics. Not just star ratings.
        </p>
        <p style={{ fontSize: 14, color: "#475569", marginBottom: 48 }}>No more wasted grocery runs. No more dinner disasters.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap" }}>
          {[
            { value: recipes.length + "+", label: "Recipes ranked" },
            { value: (totalReviews / 1000).toFixed(0) + "k+", label: "Reviews analyzed" },
            { value: topConfidence.toFixed(1) + "%", label: "Top confidence score" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: -1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS — always visible */}
      <div id="how-it-works" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "56px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>Why star ratings alone mislead you</h2>
            <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.7, maxWidth: 580, margin: "0 auto" }}>
              A 5★ recipe with 6 reviews could just be the chef's friends. A 4.7★ recipe with 18,000 reviews is proven by thousands of real home cooks.
              RecipeIQ uses the <strong style={{ color: "#0f172a" }}>Wilson Score</strong> — the same math Reddit uses to rank posts — to surface recipes with genuine track records.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {[
              { emoji: "🎲", title: "5★ · 6 reviews", score: "~72% confidence", note: "Could just be lucky", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
              { emoji: "📈", title: "4.7★ · 500 reviews", score: "~98% confidence", note: "Strong track record", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
              { emoji: "🏆", title: "4.8★ · 18,000 reviews", score: "~99.8% confidence", note: "Statistically bulletproof", color: "#15803d", bg: "#f0fdf4", border: "#86efac" },
            ].map(s => (
              <div key={s.title} style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{s.emoji}</div>
                <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8, fontWeight: 600 }}>{s.title}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginBottom: 6 }}>{s.score}</div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* UPLOAD PANEL — hidden by default, accessible via state */}
      {showUpload && (
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "24px" }}>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: "#64748b" }}>Load <strong>recipes_data.json</strong> from the scraper:</p>
              <button onClick={() => setShowUpload(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} style={{ display: "none" }} />
              <button onClick={() => fileInputRef.current?.click()}
                style={{ flex: 1, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 16px", color: "#16a34a", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Choose JSON file
              </button>
              <button onClick={() => { setRecipes(DEMO_RECIPES); setDataSource("demo"); setShowUpload(false); setMinReviews(500); setPasteText(""); setLoadError(""); }}
                style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "10px 16px", color: "#475569", fontSize: 13, cursor: "pointer" }}>
                Reset to demo
              </button>
            </div>
            <textarea value={pasteText} onChange={e => setPasteText(e.target.value)}
              placeholder="Or paste JSON directly..."
              style={{ width: "100%", height: 80, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, color: "#0f172a", fontSize: 13, resize: "vertical", outline: "none" }}
            />
            {pasteText.trim() && (
              <button onClick={() => loadRecipeData(pasteText.trim(), "Pasted data")}
                style={{ marginTop: 8, background: "#16a34a", border: "none", borderRadius: 8, padding: "10px 16px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%" }}>
                Load data
              </button>
            )}
            {loadError && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{loadError}</p>}
            {dataSource !== "demo" && <p style={{ color: "#16a34a", fontSize: 12, marginTop: 8 }}>✓ Loaded: {dataSource}</p>}
          </div>
        </div>
      )}

      {/* MAIN */}
      <div id="recipes" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* FILTERS */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 20, marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#94a3b8" }}>🔍</span>
            <input type="text" placeholder="Search recipes, ingredients, cuisines..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px 12px 42px", color: "#0f172a", fontSize: 15, outline: "none" }}
            />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {categories.map(c => (
              <button key={c} onClick={() => setSelectedCategory(c)}
                style={{
                  background: selectedCategory === c ? "#0f172a" : "#f1f5f9",
                  border: "none", borderRadius: 20, padding: "6px 14px",
                  color: selectedCategory === c ? "#fff" : "#475569",
                  fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                }}>{c}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 16, alignItems: "end" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Minimum reviews</span>
                <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 700 }}>{minReviews.toLocaleString()}+</span>
              </div>
              <input type="range" min={50} max={10000} step={50} value={minReviews} onChange={e => setMinReviews(Number(e.target.value))} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Minimum rating</span>
                <span style={{ fontSize: 13, color: "#f59e0b", fontWeight: 700 }}>{minRating}★</span>
              </div>
              <input type="range" min={3} max={5} step={0.1} value={minRating} onChange={e => setMinRating(Number(e.target.value))} />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", color: "#475569", fontSize: 13, cursor: "pointer", outline: "none", height: 38 }}>
              <option value="confidence">Sort: Confidence</option>
              <option value="reviews">Sort: Most Reviewed</option>
              <option value="rating">Sort: Highest Rated</option>
            </select>
          </div>
        </div>

        {/* RESULTS BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: "#64748b" }}>
            <strong style={{ color: "#0f172a" }}>{filtered.length}</strong> recipes found
            {dataSource === "demo" && <span style={{ marginLeft: 8, background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10 }}>Demo data</span>}
          </p>
          <p style={{ fontSize: 13, color: "#94a3b8" }}>{(totalReviews / 1000).toFixed(0)}k reviews analyzed</p>
        </div>

        {/* GRID */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontSize: 18, color: "#0f172a", marginBottom: 8 }}>No recipes match your filters</h3>
            <p style={{ fontSize: 14, color: "#64748b" }}>Try lowering the minimum reviews or rating threshold.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filtered.map((recipe, i) => (
              <RecipeCard key={recipe.id || i} recipe={recipe} index={i} onSelect={setSelectedRecipe} />
            ))}
          </div>
        )}

        {/* FOOTER */}
        <div style={{ marginTop: 60, paddingTop: 32, borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
          <p style={{ fontSize: 22, marginBottom: 8 }}>🍽️</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>RecipeIQ</p>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>Statistically-ranked recipes you can trust.</p>
          <p style={{ fontSize: 12, color: "#cbd5e1" }}>Confidence scores powered by Wilson Score algorithm · Data sourced from AllRecipes</p>
        </div>
      </div>

      <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
    </div>
  );
}
