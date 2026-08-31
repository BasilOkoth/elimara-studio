# Elimara Studio

Premium online storefront for Elimara Studio limited-edition computational art.

## Current works
- Nebula I — Emergence
- Nebula II — Convergence

## Features
- Responsive premium gallery storefront
- Artwork detail views
- Edition numbering and provenance
- Cart
- Collector checkout request form
- M-PESA / card / bank placeholders
- Commission enquiries
- Room mockups
- Certificate information

## Important before accepting live payments
The current checkout is a demo/order-request interface. It does **not** process money.

Before switching to live payments, connect:
1. Elimara Technologies Limited M-PESA Paybill/API credentials
2. A card payment processor, if required
3. Official company bank details
4. Working studio email address
5. WhatsApp Business number
6. Shipping/delivery policy
7. Terms, returns/refunds and privacy information

## Deploy on Render

### Option A — easiest
1. Create a GitHub repository, e.g. `elimara-studio`.
2. Upload all files in this package to the repository root.
3. In Render choose **New → Static Site**.
4. Connect the GitHub repository.
5. Select your deployment branch, normally `main`.
6. Build Command: `echo "No build required"`
7. Publish Directory: `.`
8. Deploy.

Render will give the site an `onrender.com` URL.

### Option B — Render Blueprint
The included `render.yaml` can also be used by Render as a Blueprint.

## Suggested future domain
- studio.elimara.co.ke
- or elimara.co.ke/studio

## Files
- `index.html` — storefront
- `styles.css` — visual design
- `app.js` — cart, details and demo checkout
- `assets/` — artwork and room mockups
- `render.yaml` — Render deployment configuration

## Updating prices
The product data is currently in `app.js`.

## Current demonstration prices
- Nebula I — Emergence: KES 28,000
- Nebula II — Convergence: KES 28,000

Review these before public launch.
