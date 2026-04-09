# RecipeIQ 🍽️

**Never cook a bad recipe again.**

RecipeIQ uses the [Wilson Score Lower Bound](https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval#Wilson_score_interval) algorithm — the same method Reddit uses for post ranking — to score recipes by statistical confidence.

A recipe with 50,000 reviews at 4.7★ scores higher than one with 10 reviews at 5.0★ because confidence requires volume.

## Stack

- React 18
- Deployed on Vercel
- Domain: recipeiq.co

## Running locally

```bash
npm install
npm start
```

## Deploy

Push to GitHub → Vercel auto-deploys on every commit.
