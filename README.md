# Elimara Studio — Premium Storefront

A static, Render-ready art-commerce storefront for Elimara Studio.

## What's new in this version

- Premium responsive visual redesign
- Dedicated artwork pages:
  - `nebula-i-emergence.html`
  - `nebula-ii-convergence.html`
- Dedicated `commissions.html` sales funnel
- Interactive browser-based wall preview
- Residential, premium-scale and corporate/hospitality commission positioning
- Commission enquiry form
- Collector-list form
- Provenance / sample certificate presentation
- Individual SEO metadata for artwork pages
- `sitemap.xml`
- `robots.txt`
- JSON-LD structured data for the studio and artworks
- WebP artwork/mockup previews for faster loading
- No fake sold-count claims
- Render blueprint retained

## Repository structure

```text
index.html
commissions.html
nebula-i-emergence.html
nebula-ii-convergence.html
404.html
render.yaml
robots.txt
sitemap.xml
README.md
.gitignore

assets/
  css/
    styles.css
  js/
    config.js
    app.js
  data/
    works.json
  images/
    nebula-emergence.png
    nebula-emergence.webp
    nebula-convergence.png
    nebula-convergence.webp
    mockup-living-room.png
    mockup-living-room.webp
    mockup-office.png
    mockup-office.webp
    mockup-hallway.png
    mockup-hallway.webp
    mockup-study.png
    mockup-study.webp
```

## IMPORTANT — configure contact before marketing

Open:

`assets/js/config.js`

Add at least one real contact channel:

```js
email: "YOUR_EMAIL",
whatsappNumber: "2547XXXXXXXX",
```

Use digits only for WhatsApp and include the country code.

You can also add:
- Instagram URL
- LinkedIn URL
- collector form endpoint

Until contact details are added, enquiry buttons show an honest setup message rather than pretending a lead has been submitted.

## Collector form

The collector-list form is visually complete but requires a real endpoint before it can save leads. You can later connect Formspree or another service by adding its endpoint to:

`collectorFormEndpoint`

in `assets/js/config.js`.

## Payments

This package intentionally does not charge cards or M-PESA yet.

The "Reserve an edition" flow is designed to route a structured request to WhatsApp or email after you add contact details.

When Elimara's official payment credentials are ready, this can later be upgraded to:
- M-PESA STK Push
- bank payment instructions
- card payment
- confirmed edition allocation
- automated certificate number assignment

## Render

Use:
- Build command: `echo "No build required"`
- Publish directory: `.`

Render should redeploy automatically whenever the connected `main` branch changes.

## Search indexing

After deployment:
1. Confirm `/sitemap.xml` loads.
2. Add the Render URL to Google Search Console.
3. Submit:
   `https://elimara-studio.onrender.com/sitemap.xml`
4. Request indexing for:
   - homepage
   - commissions page
   - both artwork pages

When you later buy a domain, update `baseUrl` in `assets/js/config.js`, canonical URLs in the HTML pages, and the URLs in `sitemap.xml`.
