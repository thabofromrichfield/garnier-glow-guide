# Glow Guide — Garnier face-care discovery concept

An unofficial, mobile-friendly skincare discovery experience built around Garnier South Africa face-care product families. It combines a browser-local face-landmark framing demo with a self-guided skin-preference questionnaire and links to Garnier's official South African product pages.

## What works

- Live camera permission flow and real-time facial landmark overlay, powered by MediaPipe Tasks Vision in the browser.
- Camera video is not uploaded or saved by this app; the camera stops on page exit or when the user turns it off.
- The scan confirms face framing only. It does not assess skin quality, detect conditions, identify skin tone, or provide medical advice.
- Routine suggestions are based on the visitor's own selected interests and answers, not an AI diagnosis.
- Product links lead to Garnier South Africa's official product/category pages. Prices are not hard-coded; users are directed to current retailer listings because pricing/stock can vary.
- Accessible responsive UI, camera-free quiz path, care and patch-test reminders.

## Run locally

```sh
docker compose up --build -d
```

Visit `http://localhost:8080`. For camera access from another device, serve over HTTPS; browsers block camera access on ordinary non-local HTTP origins. The routine quiz remains available without camera access.

## Deploy with Dokploy

Create a new Dokploy Application from this GitHub repository, set the production branch to `main`, choose Dockerfile as the build type (or Compose if preferred), and enable automatic deployments for pushes to `main`. No environment variables are required. Configure a domain and HTTPS before sharing the camera feature publicly.

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
