import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// DEMO DATA — used when no JSON file is loaded
// ============================================================
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

// ============================================================
// EMOJI MAPPING — auto-assigns icons based on recipe title
// ============================================================
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
  [/smoothie|shake|drink/i, "🥤"], [/ice cream|gelato|sorbet/i, "🍨"],
  [/banana/i, "🍌"], [/apple/i, "🍎"], [/corn/i, "🌽"],
];

function getEmoji(title) {
  for (const [pattern, emoji] of EMOJI_MAP) {
    if (pattern.test(title)) return emoji;
  }
  return "🍽️";
}

// ============================================================
// COMPONENTS
// ============================================================
function ConfidenceMeter({ value }) {
  const color = value >= 99 ? "#22c55e" : value >= 97 ? "#84cc16" : value >= 95 ? "#eab308" : "#f97316";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 60, height: 6, background: "#1a1a2e", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color, fontWeight: 700 }}>{value.toFixed(1)}%</span>
    </div>
  );
}

function StarDisplay({ rating }) {
  const full = Math.floor(rating);
  const partial = rating - full;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {[...Array(5)].map((_, i) => (
        <span key={i} style={{ fontSize: 14, color: i < full ? "#f59e0b" : i === full && partial > 0 ? "#f59e0b" : "#2a2a4a", opacity: i < full ? 1 : i === full && partial > 0 ? partial : 0.3 }}>★</span>
      ))}
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>{rating}</span>
    </div>
  );
}

function RecipeCard({ recipe, index, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const tierColor = recipe.confidence >= 99 ? "#22c55e" : recipe.confidence >= 97 ? "#84cc16" : recipe.confidence >= 95 ? "#eab308" : "#f97316";
  const tierLabel = recipe.confidence >= 99 ? "PROVEN" : recipe.confidence >= 97 ? "STRONG" : recipe.confidence >= 95 ? "SOLID" : "EMERGING";
  const emoji = getEmoji(recipe.title);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(recipe)}
      style={{
        background: hovered ? "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)" : "#0d0d1f",
        border: `1px solid ${hovered ? tierColor + "44" : "#1a1a3a"}`,
        borderRadius: 16, padding: 20, cursor: "pointer",
        transition: "all 0.3s ease",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? `0 8px 32px ${tierColor}15` : "none",
        animation: `fadeSlideIn 0.4s ease ${Math.min(index * 0.04, 1)}s both`,
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 12, right: 12, background: tierColor + "18", border: `1px solid ${tierColor}33`, borderRadius: 6, padding: "3px 8px" }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: tierColor, letterSpacing: 1.5 }}>{tierLabel}</span>
      </div>

      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 52, height: 52, background: "#1a1a3a", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
          {emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#e2e8f0", fontFamily: "'Bricolage Grotesque', sans-serif", lineHeight: 1.3 }}>{recipe.title}</h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {recipe.description || "Crowd-vetted recipe with high confidence scoring"}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14, alignItems: "center" }}>
        <span style={{ background: "#1a1a3a", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>{recipe.source}</span>
        {recipe.time && recipe.time !== "N/A" && (
          <span style={{ background: "#1a1a3a", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>{recipe.time}</span>
        )}
        <span style={{ background: "#1a1a3a", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>{recipe.category || "Recipe"}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 14, borderTop: "1px solid #1a1a3a" }}>
        <div>
          <StarDisplay rating={recipe.rating} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#64748b", marginTop: 2, display: "block" }}>
            {recipe.reviews.toLocaleString()} reviews
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>CONFIDENCE</div>
          <ConfidenceMeter value={recipe.confidence} />
        </div>
      </div>
    </div>
  );
}

function RecipeModal({ recipe, onClose }) {
  if (!recipe) return null;
  const tierColor = recipe.confidence >= 99 ? "#22c55e" : recipe.confidence >= 97 ? "#84cc16" : recipe.confidence >= 95 ? "#eab308" : "#f97316";
  const emoji = getEmoji(recipe.title);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeSlideIn 0.2s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0d0d1f", border: "1px solid #1a1a3a", borderRadius: 20, padding: 28, maxWidth: 520, width: "100%", maxHeight: "85vh", overflowY: "auto", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "#1a1a3a", border: "none", borderRadius: 8, width: 32, height: 32, color: "#94a3b8", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>

        <div style={{ fontSize: 48, marginBottom: 12 }}>{emoji}</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: 8, paddingRight: 40 }}>{recipe.title}</h2>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6, marginBottom: 20 }}>{recipe.description || "A crowd-vetted recipe with high confidence scoring."}</p>

        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ background: "#080816", borderRadius: 10, padding: "10px 16px", flex: 1, minWidth: 90, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>RATING</div>
            <StarDisplay rating={recipe.rating} />
          </div>
          <div style={{ background: "#080816", borderRadius: 10, padding: "10px 16px", flex: 1, minWidth: 90, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>REVIEWS</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", fontFamily: "'JetBrains Mono', monospace" }}>{recipe.reviews.toLocaleString()}</div>
          </div>
          <div style={{ background: "#080816", borderRadius: 10, padding: "10px 16px", flex: 1, minWidth: 90, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>CONFIDENCE</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: tierColor, fontFamily: "'JetBrains Mono', monospace" }}>{recipe.confidence.toFixed(1)}%</div>
          </div>
        </div>

        {recipe.time && recipe.time !== "N/A" && (
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>
            <span style={{ color: "#64748b" }}>Cook time:</span> {recipe.time}
          </div>
        )}

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 12, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, marginBottom: 10 }}>INGREDIENTS ({recipe.ingredients.length})</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {recipe.ingredients.map((ing, i) => (
                <div key={i} style={{ fontSize: 13, color: "#cbd5e1", padding: "6px 10px", background: "#080816", borderRadius: 6, borderLeft: `2px solid ${tierColor}33` }}>
                  {ing}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          {recipe.url ? (
            <a
              href={recipe.url} target="_blank" rel="noopener noreferrer"
              style={{
                flex: 1, display: "block", textAlign: "center", background: tierColor + "18",
                border: `1px solid ${tierColor}44`, borderRadius: 10, padding: "12px 20px",
                color: tierColor, fontSize: 14, fontWeight: 600, textDecoration: "none",
                fontFamily: "'Bricolage Grotesque', sans-serif",
              }}
            >
              View Full Recipe →
            </a>
          ) : (
            <div style={{ flex: 1, textAlign: "center", background: "#1a1a3a", borderRadius: 10, padding: "12px 20px", color: "#64748b", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
              Link available with scraped data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, sub }) {
  return (
    <div style={{ background: "#0d0d1f", border: "1px solid #1a1a3a", borderRadius: 12, padding: "16px 20px", flex: "1 1 140px", minWidth: 140 }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 28, fontWeight: 700, color: "#e2e8f0", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#22c55e", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function RecipeConfidenceEngine() {
  const [recipes, setRecipes] = useState(DEMO_RECIPES);
  const [dataSource, setDataSource] = useState("demo");
  const [search, setSearch] = useState("");
  const [minReviews, setMinReviews] = useState(500);
  const [minRating, setMinRating] = useState(4.5);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSource, setSelectedSource] = useState("All");
  const [sortBy, setSortBy] = useState("confidence");
  const [showExplainer, setShowExplainer] = useState(false);
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
        setLoadError("No valid recipes array found in the data.");
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
      setLoadError("Invalid JSON. Make sure it's the output from the scraper.");
      return false;
    }
  }, []);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => loadRecipeData(evt.target.result, file.name);
    reader.readAsText(file);
  }, [loadRecipeData]);

  const categories = ["All", ...new Set(recipes.map(r => r.category).filter(Boolean).sort())];
  const sources = ["All", ...new Set(recipes.map(r => r.source).filter(Boolean).sort())];

  const filtered = recipes
    .filter(r => {
      if (search) {
        const q = search.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchDesc = (r.description || "").toLowerCase().includes(q);
        const matchIngredients = (r.ingredients || []).some(ing => ing.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchIngredients) return false;
      }
      if (r.reviews < minReviews) return false;
      if (r.rating < minRating) return false;
      if (selectedCategory !== "All" && r.category !== selectedCategory) return false;
      if (selectedSource !== "All" && r.source !== selectedSource) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "confidence") return b.confidence - a.confidence;
      if (sortBy === "reviews") return b.reviews - a.reviews;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });

  const avgConfidence = filtered.length ? (filtered.reduce((s, r) => s + r.confidence, 0) / filtered.length) : 0;
  const totalReviews = filtered.reduce((s, r) => s + r.reviews, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#080816", color: "#e2e8f0", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type="range"] { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; background: #1a1a3a; border-radius: 2px; outline: none; cursor: pointer; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: #22c55e; border-radius: 50%; cursor: pointer; border: 2px solid #080816; }
        input[type="range"]::-moz-range-thumb { width: 16px; height: 16px; background: #22c55e; border-radius: 50%; cursor: pointer; border: 2px solid #080816; }
        ::selection { background: #22c55e33; color: #22c55e; }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #080816; } ::-webkit-scrollbar-thumb { background: #1a1a3a; border-radius: 3px; }
        textarea:focus, input:focus { border-color: #22c55e44 !important; }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>

        {/* HEADER */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, background: "#22c55e", borderRadius: "50%", animation: "pulse 2s ease infinite" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#22c55e", letterSpacing: 2, textTransform: "uppercase" }}>Recipe Confidence Engine</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1, color: "#f8fafc", marginBottom: 8 }}>
            Never cook a bad recipe<br />
            <span style={{ color: "#22c55e" }}>again.</span>
          </h1>
          <p style={{ fontSize: 15, color: "#64748b", maxWidth: 520, lineHeight: 1.5 }}>
            Statistical confidence scoring powered by the Wilson Score algorithm. Higher reviews + higher ratings = higher probability the recipe delivers.
          </p>

          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => setShowExplainer(!showExplainer)}
              style={{ background: "none", border: "1px solid #1a1a3a", borderRadius: 8, padding: "6px 14px", color: "#94a3b8", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer" }}>
              {showExplainer ? "Hide" : "How"} confidence works →
            </button>
            <button onClick={() => setShowUpload(!showUpload)}
              style={{ background: showUpload ? "#22c55e18" : "none", border: `1px solid ${showUpload ? "#22c55e44" : "#1a1a3a"}`, borderRadius: 8, padding: "6px 14px", color: showUpload ? "#22c55e" : "#94a3b8", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer" }}>
              📂 Load scraped data
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: dataSource === "demo" ? "#f59e0b" : "#22c55e" }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#64748b" }}>
                {dataSource === "demo" ? "Demo data (20 recipes)" : dataSource}
              </span>
            </div>
          </div>

          {/* EXPLAINER */}
          {showExplainer && (
            <div style={{ marginTop: 12, background: "#0d0d1f", border: "1px solid #1a1a3a", borderRadius: 12, padding: 20, animation: "fadeSlideIn 0.3s ease" }}>
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, fontFamily: "'JetBrains Mono', monospace" }}>
                We use a <span style={{ color: "#22c55e" }}>Wilson Score Lower Bound</span> — the same algorithm Reddit uses for ranking. It answers: "Given the rating and number of reviews, what's the <em>worst-case</em> probability this recipe is good?"
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                <div style={{ background: "#080816", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>5★ with 10 reviews</div>
                  <div style={{ fontSize: 18, color: "#eab308", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>~83% confidence</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Small sample — could be fluky</div>
                </div>
                <div style={{ background: "#080816", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>4.8★ with 10,000 reviews</div>
                  <div style={{ fontSize: 18, color: "#22c55e", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>~99.5% confidence</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Statistically bulletproof</div>
                </div>
              </div>
            </div>
          )}

          {/* UPLOAD PANEL */}
          {showUpload && (
            <div style={{ marginTop: 12, background: "#0d0d1f", border: "1px solid #1a1a3a", borderRadius: 12, padding: 20, animation: "fadeSlideIn 0.3s ease" }}>
              <p style={{ fontSize: 12, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", marginBottom: 12 }}>
                Load <span style={{ color: "#22c55e" }}>recipes_data.json</span> from the AllRecipes scraper:
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} style={{ display: "none" }} />
                <button onClick={() => fileInputRef.current?.click()}
                  style={{ flex: 1, background: "#22c55e18", border: "1px solid #22c55e44", borderRadius: 8, padding: "10px 16px", color: "#22c55e", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer" }}>
                  Choose JSON file
                </button>
                <button onClick={() => { setRecipes(DEMO_RECIPES); setDataSource("demo"); setShowUpload(false); setMinReviews(500); setPasteText(""); setLoadError(""); }}
                  style={{ background: "#1a1a3a", border: "1px solid #1a1a3a", borderRadius: 8, padding: "10px 16px", color: "#94a3b8", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer" }}>
                  Reset to demo
                </button>
              </div>
              <p style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>Or paste JSON directly:</p>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder='Paste contents of recipes_data.json here...'
                style={{ width: "100%", height: 80, background: "#080816", border: "1px solid #1a1a3a", borderRadius: 8, padding: 10, color: "#e2e8f0", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", resize: "vertical", outline: "none" }}
              />
              {pasteText.trim() && (
                <button onClick={() => loadRecipeData(pasteText.trim(), "Pasted data")}
                  style={{ marginTop: 8, background: "#22c55e18", border: "1px solid #22c55e44", borderRadius: 8, padding: "8px 16px", color: "#22c55e", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", width: "100%" }}>
                  Load pasted data
                </button>
              )}
              {loadError && <p style={{ color: "#ef4444", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", marginTop: 8 }}>{loadError}</p>}
            </div>
          )}
        </div>

        {/* STATS */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <StatBox label="Recipes Found" value={filtered.length} />
          <StatBox label="Avg Confidence" value={avgConfidence ? avgConfidence.toFixed(1) + "%" : "—"} sub={avgConfidence >= 98 ? "● Extremely High" : avgConfidence >= 95 ? "● High" : ""} />
          <StatBox label="Total Reviews" value={totalReviews >= 1000 ? (totalReviews / 1000).toFixed(0) + "K" : totalReviews.toLocaleString()} sub="crowd-validated" />
        </div>

        {/* FILTERS */}
        <div style={{ background: "#0d0d1f", border: "1px solid #1a1a3a", borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 16 }}>⌕</span>
            <input type="text" placeholder="Search recipes, ingredients..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", background: "#080816", border: "1px solid #1a1a3a", borderRadius: 10, padding: "12px 14px 12px 40px", color: "#e2e8f0", fontSize: 14, fontFamily: "'Bricolage Grotesque', sans-serif", outline: "none" }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>MIN REVIEWS</span>
                <span style={{ fontSize: 13, color: "#22c55e", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{minReviews.toLocaleString()}+</span>
              </div>
              <input type="range" min={50} max={10000} step={50} value={minReviews} onChange={e => setMinReviews(Number(e.target.value))} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>MIN RATING</span>
                <span style={{ fontSize: 13, color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{minRating}★+</span>
              </div>
              <input type="range" min={3} max={5} step={0.1} value={minRating} onChange={e => setMinRating(Number(e.target.value))} />
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.map(c => (
              <button key={c} onClick={() => setSelectedCategory(c)}
                style={{
                  background: selectedCategory === c ? "#22c55e18" : "transparent",
                  border: `1px solid ${selectedCategory === c ? "#22c55e44" : "#1a1a3a"}`,
                  borderRadius: 8, padding: "5px 12px",
                  color: selectedCategory === c ? "#22c55e" : "#64748b",
                  fontSize: 12, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", transition: "all 0.2s",
                }}>{c}</button>
            ))}
            <div style={{ width: 1, background: "#1a1a3a", margin: "0 4px" }} />
            {sources.length > 2 && (
              <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)}
                style={{ background: "#080816", border: "1px solid #1a1a3a", borderRadius: 8, padding: "5px 10px", color: "#94a3b8", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", outline: "none" }}>
                {sources.map(s => <option key={s} value={s}>{s === "All" ? "All Sources" : s}</option>)}
              </select>
            )}
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ background: "#080816", border: "1px solid #1a1a3a", borderRadius: 8, padding: "5px 10px", color: "#94a3b8", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", outline: "none" }}>
              <option value="confidence">Sort: Confidence</option>
              <option value="reviews">Sort: Most Reviewed</option>
              <option value="rating">Sort: Highest Rated</option>
            </select>
          </div>
        </div>

        {/* RECIPE GRID */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: 15 }}>No recipes match your filters. Try lowering the thresholds.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 12 }}>
            {filtered.map((recipe, i) => (
              <RecipeCard key={recipe.id || i} recipe={recipe} index={i} onSelect={setSelectedRecipe} />
            ))}
          </div>
        )}

        {/* FOOTER */}
        <div style={{ marginTop: 40, padding: 24, background: "#0d0d1f", border: "1px solid #1a1a3a", borderRadius: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", marginBottom: 12 }}>Pipeline: From scraper to live app</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { step: "1", text: "Run: python allrecipes_scraper.py", color: "#22c55e" },
              { step: "2", text: "Outputs recipes_data.json with hundreds of vetted recipes + ingredients + links", color: "#3b82f6" },
              { step: "3", text: "Click \"Load scraped data\" above → upload or paste the JSON", color: "#a855f7" },
              { step: "4", text: "Click any recipe → see ingredients + link to original source", color: "#f59e0b" },
              { step: "5", text: "Deploy to Netlify for a public URL (same as your other apps)", color: "#ef4444" },
            ].map(s => (
              <div key={s.step} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: s.color + "18", border: `1px solid ${s.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{s.step}</div>
                <span style={{ fontSize: 13, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL */}
      <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
    </div>
  );
}
