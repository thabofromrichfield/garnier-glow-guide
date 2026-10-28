# Glow Guide — Garnier face-care discovery concept

An unofficial, mobile-friendly skincare discovery experience built around Garnier South Africa face-care product families. It combines a browser-local face-landmark framing demo with a self-guided skin-preference questionnaire and links to Garnier's official South African product pages.

## What works

- Live camera permission flow and real-time facial landmark overlay, powered by MediaPipe Tasks Vision in the browser.
- Camera video is not uploaded or saved by this app; the camera stops on page exit or when the user turns it off.
- The scan confirms face framing only. It does not assess skin quality, detect conditions, identify skin tone, or provide medical advice.
- Routine suggestions are based on the visitor's own selected interests and answers, not an AI diagnosis.
- Product links lead to Garnier South Africa's official product/category pages. Prices are not hard-coded; users are directed to current retailer listings because pricing/stock can vary.
- Accessible responsive UI, camera-free quiz path, care and patch-test reminders.
- Optional Supabase accounts for profile names, private scan-date and saved-routine history, and community routine submissions.
- Still-photo and live scans are processed only in the browser. Photos are transient previews cleared when the camera is turned off or the page is closed; no photo, landmark coordinates, or skin answers are uploaded or stored in the account.
- Community routines are private/pending until reviewed and approved; public visitors can read approved posts only.

## Run locally

```sh
docker compose up --build -d
```

Visit `http://localhost:8080`. For camera access from another device, serve over HTTPS; browsers block camera access on ordinary non-local HTTP origins. The routine quiz remains available without camera access.

## Accounts and community routines

The account UI needs a Supabase project. Create a project, then run the migration in `supabase/migrations/20261028000000_profiles_and_routines.sql` using the Supabase SQL Editor (or link the project and run `supabase db push`). The migration creates Auth-linked profiles, scan and routine history, and moderated community posts with row-level security. It stores no face photo, face geometry, embedding, or skin questionnaire answers.

Copy the project's Project URL and public anon/publishable key into `supabase-config.js` as `SUPABASE_URL` and `SUPABASE_ANON_KEY`. These are browser-visible public settings; never use the service-role key in frontend code. In Supabase Authentication > URL Configuration, set the production Site URL to the deployed site and allow the exact site URL as a redirect URL. Configure email confirmation and production SMTP before enabling public signups.

New community posts have `status = 'pending'`. Review them in the Supabase table editor; set `status = 'approved'` to publish or `status = 'rejected'` to keep them private. The browser client cannot approve posts.

Run checks with `node --test tests/*.test.mjs` and `supabase test db --local supabase/tests/database.test.sql`.

## Deploy with Dokploy

Create a Dokploy Application from this GitHub repository, set the production branch to `main`, choose Dockerfile as the build type (or Compose if preferred), and enable automatic deployments for pushes to `main`. Configure a domain and valid HTTPS before sharing camera access. Accounts remain unavailable until a Supabase project is configured as described above.

## Product references and pricing

Product families and featured product titles were checked against Garnier South Africa's official site on 2026-10-28. The site does not provide one reliable retail price for each item in this prototype; there are intentionally no invented prices.

- [Garnier South Africa — skincare products](https://africa.garnier.com/en-za/shop-all-garnier-products/skin-care)
- [Garnier South Africa — Micellar](https://africa.garnier.com/en-za/shop-all-garnier-products/micellar)
- [Garnier South Africa — Pure Active](https://africa.garnier.com/en-za/shop-all-garnier-products/pure-active)
- [Garnier South Africa — Super UV](https://africa.garnier.com/en-za/shop-all-garnier-products/superuv)
- [Garnier Even & Bright 3.5% Vitamin C Day Booster Serum](https://africa.garnier.com/en-za/about-our-brands/skinactive/even-and-bright/even-and-bright-booster-serum)
- [Garnier Even & Bright Vitamin C Brightening Night Serum](https://africa.garnier.com/en-za/about-our-brands/skinactive/even-and-bright/even-and-bright-vitamin-c-night-serum)
- [Garnier South Africa — skin-care needs](https://africa.garnier.com/en-za/skin-care-needs)

## Trademark and health disclaimer

This is an independent concept/demo and is not affiliated with, endorsed by, or an official Garnier or L'Oréal product. Garnier and product names are trademarks of their respective owners. Product availability and formulations may change; always read the current packaging and retailer listing. This experience is not a medical device and does not diagnose, treat, or prevent any condition.
