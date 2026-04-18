import { useState, useRef, useCallback, useEffect } from "react";

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
  for (const [pattern, emoji] of EMOJI_MAP) { if (pattern.test(title)) return emoji; }
  return "🍽️";
}

/*
  BADGE SYSTEM — Recipe's "Tomato"
  🔥 = Proven (99%+) — "on fire", crowd-certified hit
  ✅ = Strong (97-99%) — reliable, battle-tested
  🍳 = Solid (95-97%) — promising, cooking along
  🤞 = Risky (<95%) — fingers crossed, not enough data
*/
function getTier(confidence) {
  if (confidence >= 99) return {
    label: "Proven", badge: "🔥", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0",
    badgeBg: "#dcfce7", verdict: "Crowd-proven", shadow: "0 2px 12px rgba(22,163,106,0.12)"
  };
  if (confidence >= 97) return {
    label: "Strong", badge: "✅", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0",
    badgeBg: "#dcfce7", verdict: "Highly reliable", shadow: "0 2px 12px rgba(21,128,61,0.1)"
  };
  if (confidence >= 95) return {
    label: "Solid", badge: "🍳", color: "#a16207", bg: "#fefce8", border: "#fef08a",
    badgeBg: "#fef9c3", verdict: "Promising", shadow: "0 2px 12px rgba(161,98,7,0.08)"
  };
  return {
    label: "Risky", badge: "🤞", color: "#c2410c", bg: "#fff7ed", border: "#fed7aa",
    badgeBg: "#ffedd5", verdict: "Needs more data", shadow: "0 2px 12px rgba(194,65,12,0.08)"
  };
}

/* ── Confidence Badge — the "tomato" replacement ── */
function ConfidenceBadge({ confidence, size = "md" }) {
  const tier = getTier(confidence);
  const sizes = {
    sm: { box: 40, emoji: 18, font: 11 },
    md: { box: 52, emoji: 22, font: 13 },
    lg: { box: 72, emoji: 30, font: 16 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div style={{
      width: s.box, height: s.box, borderRadius: 14,
      background: tier.badgeBg, border: `2px solid ${tier.border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <span style={{ fontSize: s.emoji, lineHeight: 1 }}>{tier.badge}</span>
    </div>
  );
}

/* ── Animated Counter ── */
function AnimatedNumber({ value, suffix = "", duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const numVal = parseFloat(value);
        const tick = (now) => {
          const t = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          setDisplay(ease * numVal);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);
  const formatted = Number.isInteger(parseFloat(value))
    ? Math.round(display).toLocaleString()
    : display.toFixed(1);
  return <span ref={ref}>{formatted}{suffix}</span>;
}

/* ── Modal ── */
function RecipeModal({ recipe, onClose }) {
  if (!recipe) return null;
  const tier = getTier(recipe.confidence);
  const emoji = getEmoji(recipe.title);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "modalIn 0.2s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: 0, maxWidth: 520, width: "100%", maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: "0 24px 64px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "#f1f5f9", border: "none", borderRadius: 50, width: 36, height: 36, color: "#64748b", fontSize: 18, cursor: "pointer", zIndex: 2 }}>×</button>

        {/* Score header */}
        <div style={{ background: tier.bg, borderBottom: `1px solid ${tier.border}`, padding: "24px 28px", display: "flex", alignItems: "center", gap: 18, borderRadius: "24px 24px 0 0" }}>
          <ConfidenceBadge confidence={recipe.confidence} size="lg" />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: tier.color, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>{tier.verdict}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", fontFamily: "'Bricolage Grotesque'", letterSpacing: -0.5 }}>{recipe.confidence.toFixed(1)}%</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>confidence score</div>
          </div>
        </div>

        <div style={{ padding: "24px 28px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 40 }}>{emoji}</span>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1.25, fontFamily: "'Bricolage Grotesque'" }}>{recipe.title}</h2>
              <p style={{ fontSize: 14, color: "#64748b", marginTop: 4, fontFamily: "'DM Sans'" }}>{recipe.description}</p>
            </div>
          </div>

          {/* Dual score bar */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
            <div style={{ background: "#fefce8", padding: "14px 16px", textAlign: "center", borderRadius: 12, border: "1px solid #fef08a" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>⭐</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: "#a16207", fontFamily: "'Bricolage Grotesque'" }}>{recipe.rating}</span>
              </div>
              <div style={{ fontSize: 11, color: "#a16207", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>Star Rating</div>
            </div>
            <div style={{ background: "#f0fdf4", padding: "14px 16px", textAlign: "center", borderRadius: 12, border: "1px solid #bbf7d0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>👥</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", fontFamily: "'Bricolage Grotesque'" }}>{recipe.reviews.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>Reviews</div>
            </div>
          </div>

          {recipe.time && recipe.time !== "N/A" && (
            <div style={{ fontSize: 14, color: "#64748b", marginBottom: 16, display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans'" }}>⏱ {recipe.time} cook time</div>
          )}

          {/* ── CROWD INTELLIGENT TWEAKS ── */}
          {recipe.crowd_tips && recipe.crowd_tips.length > 0 && (
            <div style={{ marginBottom: 24, background: "linear-gradient(135deg, #f0fdf4 0%, #fefce8 100%)", border: "1.5px solid #bbf7d0", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px 10px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #d1fae5" }}>
                <span style={{ fontSize: 18 }}>🧠</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "'DM Sans'" }}>Crowd Intelligent Tweaks</div>
                  <div style={{ fontSize: 11, color: "#86efac", fontWeight: 500, fontFamily: "'DM Sans'" }}>Distilled from {recipe.reviews.toLocaleString()} real reviews</div>
                </div>
              </div>
              <div style={{ padding: "10px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                {recipe.crowd_tips.map((tip, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#fff", borderRadius: 10, padding: "10px 14px", border: "1px solid #d1fae5", boxShadow: "0 1px 3px rgba(22,163,74,0.06)" }}>
                    <span style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}>💡</span>
                    <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 500, lineHeight: 1.45, fontFamily: "'DM Sans'" }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'DM Sans'" }}>Ingredients</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {recipe.ingredients.map((ing, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#475569", padding: "7px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", fontFamily: "'DM Sans'" }}>{ing}</div>
                ))}
              </div>
            </div>
          )}

          {recipe.url ? (
            <a href={recipe.url} target="_blank" rel="noopener noreferrer"
              style={{ display: "block", textAlign: "center", background: "#16a34a", borderRadius: 14, padding: "14px 24px", color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none", fontFamily: "'DM Sans'" }}>
              View Full Recipe →
            </a>
          ) : (
            <div style={{ textAlign: "center", background: "#f8fafc", borderRadius: 14, padding: "14px 24px", color: "#94a3b8", fontSize: 14, border: "1px solid #e2e8f0", fontFamily: "'DM Sans'" }}>
              Full recipe link available with live data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   RECIPE CARD — Light theme, badge-based
   ═══════════════════════════════════════════════ */
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
        background: "#fff",
        border: `1.5px solid ${hovered ? tier.border : "#e2e8f0"}`,
        borderRadius: 20, cursor: "pointer", transition: "all 0.25s cubic-bezier(.2,.8,.2,1)",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? tier.shadow : "0 1px 3px rgba(0,0,0,0.04)",
        animation: `cardIn 0.4s ease ${Math.min(index * 0.05, 0.6)}s both`,
        overflow: "hidden",
      }}
    >
      {/* Top: emoji + title */}
      <div style={{ padding: "20px 20px 14px", display: "flex", alignItems: "flex-start", gap: 14 }}>
        <span style={{ fontSize: 36, lineHeight: 1, flexShrink: 0 }}>{emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a", lineHeight: 1.25, letterSpacing: -0.2, fontFamily: "'Bricolage Grotesque'" }}>{recipe.title}</h3>
          <p style={{ margin: "5px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontFamily: "'DM Sans'" }}>
            {recipe.description}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div style={{ padding: "0 20px 14px", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {recipe.category && <span style={{ background: "#f1f5f9", borderRadius: 6, padding: "3px 9px", fontSize: 11, color: "#64748b", fontWeight: 500, fontFamily: "'DM Sans'" }}>{recipe.category}</span>}
        {recipe.time && recipe.time !== "N/A" && <span style={{ background: "#f1f5f9", borderRadius: 6, padding: "3px 9px", fontSize: 11, color: "#64748b", fontFamily: "'DM Sans'" }}>⏱ {recipe.time}</span>}
      </div>

      {/* Score bar */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        borderTop: "1px solid #f1f5f9",
        background: "#fafbfc",
      }}>
        {/* Stars */}
        <div style={{ padding: "14px 16px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <span style={{ color: "#f59e0b", fontSize: 14 }}>⭐</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#a16207", fontFamily: "'Bricolage Grotesque'", letterSpacing: -0.5 }}>{recipe.rating}</span>
          </div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, fontFamily: "'DM Sans'" }}>
            {recipe.reviews.toLocaleString()} reviews
          </div>
        </div>

        <div style={{ width: 1, height: 36, background: "#e2e8f0" }} />

        {/* Confidence with badge */}
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <ConfidenceBadge confidence={recipe.confidence} size="sm" />
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: tier.color, fontFamily: "'Bricolage Grotesque'", letterSpacing: -0.5, lineHeight: 1 }}>{recipe.confidence.toFixed(1)}%</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, fontFamily: "'DM Sans'" }}>{tier.label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Proof Comparison ── */
function ProofComparison() {
  const [active, setActive] = useState(1);
  const items = [
    { stars: "5.0★", reviews: "8 reviews", conf: 72.1, tier: getTier(72), verdict: "Lucky streak?", emoji: "🎰", desc: "Could be the chef's mom and 7 friends" },
    { stars: "4.7★", reviews: "2,400 reviews", conf: 98.3, tier: getTier(98.3), verdict: "Battle-tested", emoji: "🛡️", desc: "Survived 2,400 real kitchens" },
    { stars: "4.8★", reviews: "18,000 reviews", conf: 99.8, tier: getTier(99.8), verdict: "Bulletproof", emoji: "🏆", desc: "Statistically impossible to fail" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
      {items.map((item, i) => (
        <div key={i} onMouseEnter={() => setActive(i)}
          style={{
            background: active === i ? "#fff" : "#fafbfc",
            border: active === i ? `2px solid ${item.tier.border}` : "2px solid #e2e8f0",
            padding: "28px 20px", textAlign: "center", transition: "all 0.25s ease",
            cursor: "pointer", borderRadius: 20,
            boxShadow: active === i ? item.tier.shadow : "none",
          }}>
          <div style={{ fontSize: 36, marginBottom: 14, transition: "transform 0.3s ease", transform: active === i ? "scale(1.1)" : "scale(1)" }}>{item.emoji}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 2, fontFamily: "'Bricolage Grotesque'" }}>{item.stars}</div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16, fontFamily: "'DM Sans'" }}>{item.reviews}</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <ConfidenceBadge confidence={item.conf} size="md" />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: item.tier.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontFamily: "'DM Sans'" }}>{item.verdict}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, fontFamily: "'DM Sans'" }}>{item.desc}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN APP — LIGHT THEME
   ═══════════════════════════════════════════════ */
export default function RecipeConfidenceEngine() {
  const [recipes, setRecipes] = useState(DEMO_RECIPES);
  const [dataSource, setDataSource] = useState("demo");
  const [search, setSearch] = useState("");
  const [minReviews, setMinReviews] = useState(50);
  const [minRating, setMinRating] = useState(4.0);
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
      if (!Array.isArray(recipeList) || recipeList.length === 0) { setLoadError("No valid recipes found."); return false; }
      setRecipes(recipeList);
      setDataSource(`${sourceName} (${recipeList.length} recipes)`);
      setLoadError(""); setShowUpload(false); setMinReviews(100); setPasteText("");
      return true;
    } catch { setLoadError("Invalid JSON format."); return false; }
  }, []);

  // Auto-fetch bundled JSON on mount; falls back to DEMO_RECIPES silently if missing
  useEffect(() => {
    fetch("/recipes_data.json")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => loadRecipeData(data, "recipes_data.json"))
      .catch(() => {});
  }, [loadRecipeData]);

  // Secret D key shortcut to open load data modal
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "d" && !e.ctrlKey && !e.metaKey && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
        setShowUpload(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

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
        if (!r.title.toLowerCase().includes(q) && !(r.description || "").toLowerCase().includes(q) && !(r.ingredients || []).some(i => i.toLowerCase().includes(q))) return false;
      }
      if (r.reviews < minReviews || r.rating < minRating) return false;
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
    <div style={{ minHeight: "100vh", background: "#0f172a", fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8fafb; }
        @keyframes cardIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes floatUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        input[type="range"] { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; background: #e2e8f0; border-radius: 2px; outline: none; cursor: pointer; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #16a34a; border-radius: 50%; cursor: pointer; border: 2.5px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #f1f5f9; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        a { text-decoration: none; }
        .trust-ticker { display: flex; animation: tickerScroll 28s linear infinite; width: max-content; }
        .trust-ticker:hover { animation-play-state: paused; }
      `}</style>

      {/* NAV */}
      <nav style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
  <img src="/recipeiq-logo-icon.png" alt="RecipeIQ" style={{ height: 52, width: "auto" }} />
</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <a href="#proof" style={{ fontSize: 13, color: "#64748b", fontWeight: 500, padding: "8px 12px", borderRadius: 8 }}>How it works</a>
            
            <a href="#recipes" style={{ background: "#16a34a", borderRadius: 10, padding: "9px 18px", fontSize: 13, color: "#fff", fontWeight: 700, letterSpacing: 0.2 }}>Browse recipes</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
    <div style={{ background: "linear-gradient(180deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)", borderBottom: "1px solid #e2e8f0", padding: "88px 28px 72px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Subtle background pattern */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.0, backgroundImage: "radial-gradient(circle at 1px 1px, #16a34a 1px, transparent 0)", backgroundSize: "32px 32px", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 24, padding: "6px 16px", marginBottom: 32, animation: "floatUp 0.5s ease both" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "inline-block", animation: "pulse 2s ease infinite" }} />
            <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600, letterSpacing: 0.3 }}>376,000+ reviews analyzed · Wilson-score ranked</span>
          </div>

          <h1 style={{ fontSize: "clamp(40px, 6vw, 68px)", fontWeight: 800, color: "#ffffff", lineHeight: 1.08, letterSpacing: -2, fontFamily: "'Bricolage Grotesque'", animation: "floatUp 0.5s ease 0.08s both", maxWidth: 780, margin: "0 auto 20px" }}>
            The <span style={{ color: "#16a34a" }}>Rotten Tomatoes</span><br/>for recipes.
          </h1>

          <p style={{ fontSize: "clamp(20px, 3vw, 26px)", color: "#e2e8f0", fontWeight: 700, letterSpacing: -0.5, fontFamily: "'Bricolage Grotesque'", marginBottom: 18, animation: "floatUp 0.5s ease 0.12s both" }}>
            Every recipe is a bet. Know the odds.
          </p>

          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "#94a3b8", maxWidth: 520, margin: "0 auto 14px", lineHeight: 1.7, animation: "floatUp 0.5s ease 0.16s both" }}>
            We analyze thousands of real reviews to calculate the probability a recipe actually works. Not stars. Science.
          </p>

          <p style={{ fontSize: 15, color: "#94a3b8", marginBottom: 44, animation: "floatUp 0.5s ease 0.2s both" }}>
            A 5-star recipe with 10 reviews? <span style={{ color: "#a16207", fontWeight: 700 }}>83% confidence.</span><br/>
            A 4.8-star recipe with 10,000 reviews? <span style={{ color: "#16a34a", fontWeight: 700 }}>99.5% confidence.</span>
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 56, animation: "floatUp 0.5s ease 0.24s both", flexWrap: "wrap" }}>
            <a href="#recipes" style={{ background: "#16a34a", borderRadius: 14, padding: "15px 30px", fontSize: 16, color: "#fff", fontWeight: 700, boxShadow: "0 4px 16px rgba(22,163,106,0.25)" }}>
              Find proven recipes →
            </a>
            <a href="#proof" style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "15px 26px", fontSize: 16, color: "#475569", fontWeight: 600 }}>
              See how it works
            </a>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 52, flexWrap: "wrap", animation: "floatUp 0.5s ease 0.28s both" }}>
            {[
              { value: recipes.length, suffix: "+", label: "recipes ranked" },
              { value: Math.round(totalReviews / 1000), suffix: "k+", label: "reviews analyzed" },
              { value: topConfidence > 0 ? topConfidence : null, suffix: "%", label: "top confidence" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 34, fontWeight: 900, color: "#ffffff", letterSpacing: -1, fontFamily: "'Bricolage Grotesque'", minWidth: 80 }}>
                  {s.value !== null
                    ? <AnimatedNumber key={s.value} value={s.value} suffix={s.suffix} />
                    : <span style={{ opacity: 0.3 }}>—</span>
                  }
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TRUST TICKER */}
      <div style={{ borderBottom: "1px solid #e2e8f0", padding: "12px 0", overflow: "hidden", background: "#fafbfc" }}>
        <div className="trust-ticker">
          {[...Array(2)].map((_, d) => (
            <div key={d} style={{ display: "flex", gap: 40, paddingRight: 40 }}>
              {["Wilson Score algorithm", "Reddit-grade ranking", "Real home cook data", "Not paid reviews", "Not influencer picks", "Pure statistics", "Zero guesswork"].map((t, i) => (
                <span key={i} style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: 1.5, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                  {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* THE PROOF */}
      <div style={{ background: "#fff" }}>
<div id="proof" style={{ padding: "72px 48px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>The math doesn't lie</div>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, color: "#0f172a", marginBottom: 12, letterSpacing: -1, fontFamily: "'Bricolage Grotesque'" }}>
            Same stars. Wildly different reliability.
          </h2>
          <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
            Star ratings are broken. A recipe's real quality is hidden in the relationship between its rating <em>and</em> how many people tested it.
          </p>
        </div>
        <ProofComparison />
      </div>
    </div>

      {/* UPLOAD */}
      {showUpload && (
        <div style={{ borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", padding: "24px", background: "#fff" }}>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p style={{ fontSize: 14, color: "#64748b" }}>Load <strong style={{ color: "#0f172a" }}>recipes_data.json</strong> from the scraper</p>
              <button onClick={() => setShowUpload(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>×</button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} style={{ display: "none" }} />
              <button onClick={() => fileInputRef.current?.click()}
                style={{ flex: 1, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "10px 16px", color: "#16a34a", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Choose JSON file
              </button>
              <button onClick={() => { setRecipes(DEMO_RECIPES); setDataSource("demo"); setShowUpload(false); setMinReviews(50); setPasteText(""); setLoadError(""); }}
                style={{ background: "#f1f5f9", border: "none", borderRadius: 10, padding: "10px 16px", color: "#475569", fontSize: 13, cursor: "pointer" }}>
                Reset to demo
              </button>
            </div>
            <textarea value={pasteText} onChange={e => setPasteText(e.target.value)}
              placeholder="Or paste JSON directly..."
              style={{ width: "100%", height: 80, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, color: "#0f172a", fontSize: 13, resize: "vertical", outline: "none" }}
            />
            {pasteText.trim() && (
              <button onClick={() => loadRecipeData(pasteText.trim(), "Pasted data")}
                style={{ marginTop: 8, background: "#16a34a", border: "none", borderRadius: 10, padding: "10px 16px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%" }}>
                Load data
              </button>
            )}
            {loadError && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{loadError}</p>}
            {dataSource !== "demo" && <p style={{ color: "#16a34a", fontSize: 12, marginTop: 8 }}>✓ Loaded: {dataSource}</p>}
          </div>
        </div>
      )}

      {/* RECIPES */}
      <div style={{ background: "#f0fdf4" }}>
      <div id="recipes" style={{ maxWidth: 1200, margin: "0 auto", padding: "44px 48px" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Browse recipes</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: -0.5, fontFamily: "'Bricolage Grotesque'" }}>Ranked by crowd confidence</h2>
        </div>

        {/* FILTERS */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", padding: 22, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#94a3b8" }}>🔍</span>
            <input type="text" placeholder="Search recipes, ingredients, cuisines..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "13px 16px 13px 44px", color: "#0f172a", fontSize: 15, outline: "none" }}
            />
          </div>
          <div style={{ display: "flex", overflowX: "auto", gap: 6, marginBottom: 16, paddingBottom: 4, WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <style>{`.cat-scroll::-webkit-scrollbar { display: none; }`}</style>
            {categories.map(c => (
              <button key={c} onClick={() => setSelectedCategory(c)}
                style={{
                  background: selectedCategory === c ? "#16a34a" : "#f1f5f9",
                  border: "none", borderRadius: 20, padding: "7px 16px",
                  color: selectedCategory === c ? "#fff" : "#64748b",
                  fontSize: 13, fontWeight: selectedCategory === c ? 700 : 500, cursor: "pointer",
                  transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
                }}>{c}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 20, alignItems: "end" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Min reviews</span>
                <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 800 }}>{minReviews.toLocaleString()}+</span>
              </div>
              <input type="range" min={50} max={10000} step={50} value={minReviews} onChange={e => setMinReviews(Number(e.target.value))} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Min rating</span>
                <span style={{ fontSize: 13, color: "#a16207", fontWeight: 800 }}>{minRating}★</span>
              </div>
              <input type="range" min={3} max={5} step={0.1} value={minRating} onChange={e => setMinRating(Number(e.target.value))} />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", color: "#475569", fontSize: 13, cursor: "pointer", outline: "none", height: 40 }}>
              <option value="confidence">Sort: Confidence</option>
              <option value="reviews">Sort: Most Reviewed</option>
              <option value="rating">Sort: Highest Rated</option>
            </select>
          </div>
        </div>

        {/* RESULTS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <p style={{ fontSize: 14, color: "#64748b" }}>
            <strong style={{ color: "#0f172a", fontWeight: 800 }}>{filtered.length}</strong> recipes found
            {dataSource === "demo" && <span style={{ marginLeft: 10, background: "#fefce8", color: "#a16207", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10, border: "1px solid #fef08a" }}>Demo data</span>}
          </p>
          <p style={{ fontSize: 13, color: "#cbd5e1" }}>{(totalReviews / 1000).toFixed(0)}k reviews analyzed</p>
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 18, fontWeight: 500 }}>
          376,000+ real reviews · Wilson-score ranked · Zero influencer picks
        </p>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)", borderRadius: 20, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontSize: 20, color: "#0f172a", marginBottom: 8, fontFamily: "'Bricolage Grotesque'", fontWeight: 800 }}>No recipes match those filters</h3>
            <p style={{ fontSize: 14, color: "#94a3b8" }}>Try lowering the minimum reviews or rating.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
            {filtered.map((recipe, i) => (
              <RecipeCard key={recipe.id || i} recipe={recipe} index={i} onSelect={setSelectedRecipe} />
            ))}
          </div>
        )}

        {/* FOOTER */}
        <div style={{ marginTop: 72, paddingTop: 36, borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 10 }}>
            <img src="/recipeiq-logo-icon.png" alt="RecipeIQ" style={{ height: 40, width: "auto" }} />
          </div>
          <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 4, fontWeight: 500 }}>Every recipe is a bet. Know the odds.</p>
          <p style={{ fontSize: 12, color: "#cbd5e1" }}>Confidence scores powered by Wilson Score Lower Bound · Data from AllRecipes & Food.com</p>
        </div>
      </div>
      </div>
      </div>
      </div>

      <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
    </div>
  );
}
