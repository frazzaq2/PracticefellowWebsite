# PracticeFellow Main Site

Marketing website + client dashboard for **PracticeFellow**, the all-in-one medical EHR (live at https://www.practicefellow.com).

## What's inside

| Page | Purpose |
|---|---|
| `index.html` | Marketing homepage — hero, features grid, product tour, AI roadmap, testimonials, FAQ |
| `features.html` | Feature deep-dive per module |
| `pricing.html` | Starter / Growth / Agency plans |
| `contact.html` | Demo-request + contact form (lead capture) |
| `dashboard.html` | **Client dashboard** — leads, form submissions, payments, settings |

Static site — no build step. Works on any static host (GitHub Pages, Netlify, Vercel, S3).

## Run locally

```bash
cd practicefellow-main-site
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Repo → **Settings → Pages** → Deploy from branch → `main` / root.
3. Your site is live at `https://<user>.github.io/practicefellow-main-site/`.

## Lead capture

The contact form (`contact.html`):
- Always saves a local copy to `localStorage` (visible in the dashboard under **Leads** / **Form submissions**).
- If you set `LEAD_ENDPOINT` in `assets/js/main.js`, it also POSTs the lead as JSON to your backend.

```js
var LEAD_ENDPOINT = "https://api.yourdomain.com/leads";
```

Suggested backend: a tiny endpoint that inserts into your CRM/database and notifies you (email/Slack).

## Stripe payments (dashboard)

The **Payments** tab in `dashboard.html` is ready for Stripe:

1. **Publishable key** — paste `pk_test_…` / `pk_live_…` in the dashboard to enable the checkout UI.
2. **Server** — create a small backend (Node/Python) with the Stripe SDK:
   - `POST /create-checkout-session` → creates a Checkout Session for a plan (subscription or one-time onboarding fee), returns the session URL.
   - Webhook `checkout.session.completed` → verify with your **webhook secret**, then record the payment (insert into your DB / POST to your own API that the dashboard reads).
3. **Dashboard feed** — point the payments table at your API instead of `localStorage` (see `PAY_KEY` in `assets/js/dashboard.js`) once the backend exists.

Test mode first: use `pk_test_…` + Stripe CLI (`stripe listen --forward-to localhost:4242/webhook`) before going live.

## Customization

- Brand colors / type: `assets/css/main.css` (`:root` variables).
- Site JS (nav, tour tabs, FAQ, forms): `assets/js/main.js`.
- Dashboard logic: `assets/js/dashboard.js`, styles in `assets/css/dashboard.css`.

## Roadmap ideas

- [ ] Connect `LEAD_ENDPOINT` to a real backend + CRM
- [ ] Stripe Checkout + customer portal for self-serve plan upgrades
- [ ] Blog / changelog section
- [ ] i18n (Spanish) for patient-facing pages
