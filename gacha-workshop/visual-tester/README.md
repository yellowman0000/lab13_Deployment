# Gacha visual tester (p5.js)

**Dr. Pisit Praiwattana, your mentor in 2026**

A static page that sends real requests to the ITCS258 gacha API and draws each
one travelling **page → entry → app → database** and back, coloured by its HTTP
status. Click the App or Database node, the coins, the exchange arrow or the gacha
machine; every action also has a normal button for keyboard users.

หน้า static ที่ส่งคำขอจริงไปยัง gacha API แล้ววาดเส้นทาง หน้าเว็บ → ทางเข้า → แอป
→ ฐานข้อมูล พร้อมสถานะ HTTP คลิกแผนภาพหรือปุ่มก็ได้

## Run it

| Option | Command | Page origin |
| --- | --- | --- |
| Built into the app | open `http://localhost:8085/visual/` | same as the API (no CORS) |
| With npm | `npm start` | `http://localhost:5500` |
| Without npm | `python3 -m http.server 5500` or `node serve.js` | `http://localhost:5500` |
| Vercel | Root Directory `workshop/gacha/visual-tester`, preset **Other**, no build | `https://….vercel.app` |

For any origin other than the API's own, set the backend's `CORS_ORIGINS` to the
exact page origin (scheme + host + port, no path) and restart/redeploy the backend.
Opening `index.html` by double-click gives origin `null`; use a server instead.

## Choose the backend

1. `?api=https://YOUR-APP.onrender.com` in the page URL (share link)
2. the last URL used in this browser
3. same origin when served by the app at `/visual/`
4. `defaultApi` in `config.js` — edit this before deploying to Vercel

## What the diagram tells you

| You see | Meaning |
| --- | --- |
| Blue / amber packet going out | GET / POST in flight |
| Pulsing ring, “waking up?” | no answer yet; a free Render service may be starting (≈1 min) |
| Green / amber / red packet returning | 2xx / 4xx (e.g. 409 not enough gems) / 5xx |
| Red ✕ at the page | server reached, browser blocked the response: **CORS** |
| Red ✕ before the entry | **UNREACHABLE** or **mixed content** (HTTPS page → HTTP API) |
| Red database node after Health | app up, database check failed (503) |

p5.js 2.3.4 loads from jsDelivr with an integrity hash. Without it, the buttons,
log and JSON evidence still work.
