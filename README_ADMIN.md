# Elimara Studio Admin v1 — Upgrade

This package upgrades the existing Elimara Studio static site with a private Supabase-backed CMS.

## What you get

- `/admin/` private login
- Add/edit/publish/unpublish artworks
- Collection management
- Price, edition size, editions allocated, availability, dimensions, medium, catalogue code
- Main artwork upload to Supabase Storage
- Multiple room mockup uploads
- Public content editor
- Dynamic artwork pages (`artwork.html?slug=...`)
- Published dashboard works automatically appear on the homepage
- Published works automatically appear in the wall visualizer
- Threshold I — Verdant, Threshold II — Violet and Threshold III — Aureum seeded as **drafts**
- Existing Nebula cards remain static as a resilient fallback

## 1. Upload these files to GitHub

Copy the package into the root of your existing `elimara-studio` repository, preserving folders.

Do **not** delete your existing `assets/css/styles.css`, `assets/js/app.js`, `assets/js/config.js`, or existing Nebula images/pages.

The upgrade adds/replaces:
- `index.html`
- `commissions.html`
- `artwork.html`
- `admin/index.html`
- `assets/css/admin.css`
- `assets/js/admin.js`
- `assets/js/public-catalog.js`
- `assets/js/artwork-page.js`
- `assets/js/supabase-config.js`
- three Threshold images
- `supabase/setup.sql`

## 2. Create the Supabase database

Open Supabase → SQL Editor → New query.

Paste the entire contents of `supabase/setup.sql` and run it once.

It creates:
- `studio_admins`
- `collections`
- `artworks`
- `artwork_mockups`
- `site_content`
- public `studio-media` Storage bucket
- Row Level Security policies
- Nebula starter records
- three Threshold draft records

## 3. Create the admin login

In Supabase → Authentication → Users, create a user:

`info@shulehub.org`

Choose a strong private password.

The SQL allowlist permits this email to edit Studio content.

## 4. Connect the website

In Supabase → Project Settings / API, copy:
- Project URL
- anon/public key

Edit:

`assets/js/supabase-config.js`

Example:

```js
window.ELIMARA_SUPABASE_CONFIG = {
  url: "https://YOURPROJECT.supabase.co",
  anonKey: "YOUR_PUBLIC_ANON_KEY",
  bucket: "studio-media"
};
```

The anon key is intended for browser use when Row Level Security is configured. **Never put the service_role key here.**

## 5. Deploy and log in

After Render deploys the commit, open:

`https://elimara-studio.onrender.com/admin/`

Sign in.

Go to Artworks. You will find:
- Threshold I — Verdant
- Threshold II — Violet
- Threshold III — Aureum

They start as drafts so you can confirm dimensions, copy, mockups and pricing before ticking **Published**.

## Routine use after setup

For each new work:
1. Admin → New artwork
2. Select/create collection
3. Add title, story, price, edition, dimensions and code
4. Upload main art
5. Upload one or more mockups
6. Choose homepage + wall preview
7. Tick Published
8. Save

No routine GitHub editing is required after that.
