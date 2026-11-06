# One Gacha API — Lab 12 to Lab 13

**Dr. Pisit Praiwattana, your mentor in 2026**

One Express/Node 24 API with PostgreSQL 18. Recharge **virtual coins**, exchange
100 coins for 1 gem, then spend 10 gems for one random result. No payment provider,
real money or valuable prize is connected. This deliberately small teaching API
has no authentication: a student ID identifies the practice wallet, not its owner.

หนึ่ง API สำหรับฝึกตั้งแต่ Lab 12 ถึง Lab 13: เติม coin จำลอง แลก 100 coin เป็น
1 gem แล้วใช้ 10 gem สุ่มหนึ่งครั้ง ไม่มีเงินจริงหรือรางวัลที่มีมูลค่า ระบบใช้
รหัสนักศึกษาแยกกระเป๋าฝึก แต่ยังไม่มีระบบยืนยันตัวตน

## Lab 12: one local stack

Run in this folder with Docker Desktop using Linux containers, or Docker Engine
and its Compose plugin. Node/PostgreSQL do not need to be installed on the host.

```powershell
# Windows PowerShell
Copy-Item .env.example .env
notepad .env
```

```bash
# macOS / Linux
cp .env.example .env
# Edit STUDENT_ID in .env using your editor.
```

Keep your student ID/project name unchanged throughout a persistence experiment.

```text
docker compose config --quiet
docker compose up -d --build --wait
docker compose ps
docker compose logs --tail 30 app db
```

Open **http://localhost:8085/test**. Plain `docker compose` automatically reads
`compose.yml` plus the small `compose.override.yml` that publishes the local app
port. The app reaches `db:5432` privately; the DB has no published host port.

เปิด `/test` แล้วกด Health → Wallet → Recharge 1000 → Exchange 1000 → Draw once
→ Saved history ใช้รหัสตนเอง และบันทึก ID ผลสุ่มกับเวลาที่สร้างจริง

## Folder map

```text
gacha/
├── compose.yml                 # shared app + DB + named volume
├── compose.override.yml        # automatic localhost port for Lab 12
├── compose.local.yml           # explicit local overlay for Lab 13
├── compose.staging.yml         # alternative localhost:8086 overlay
├── compose.production.yml      # restart policy, no public app/DB ports
├── compose.proxy.yml           # Nginx Proxy Manager + its persistent volumes
├── .env.example                # safe configuration template
├── .env                        # your actual values; ignored by Git/build
├── Dockerfile                  # application image recipe
├── app.js / domain.js / server.js
├── db/init.sql                 # read-only initialization bind mount
├── public/test.html            # bilingual API tester
├── visual-tester/              # p5.js playable request diagram (/visual/, npm, Vercel)
├── render.yaml                 # optional Render Blueprint (web service + Postgres)
├── test/domain.test.js         # deterministic probability/validation checks
└── test/http.test.js           # CORS and /visual/ route checks (no DB needed)
```

The named `pgdata` volume mounts at `/var/lib/postgresql`, the target for this
PostgreSQL 18 image. Initialization scripts mounted under
`/docker-entrypoint-initdb.d/` run for an empty data directory. This app also
idempotently creates its base tables at startup, enabling a fresh Railway DB
without a local bind mount. Neither mechanism migrates an already existing schema.
For intentional existing schema changes, write/review a migration.

## API contract

| Method | Route | Input / result |
| --- | --- | --- |
| GET | `/health` | Actual `SELECT 1`; HTTP 200 connected or 503 unavailable |
| GET | `/api/catalog` | Fixed rules and the five SSR outcomes |
| GET | `/api/accounts/:studentId` | Create an empty wallet if absent, then read it |
| POST | `/api/recharge` | `{"student_id":"6688123","coins":1000}`; add virtual coins |
| POST | `/api/exchange` | Same fields; coins must be a multiple of 100 |
| POST | `/api/draw` | `{"student_id":"6688123"}`; spend 10 gems, return stored draw |
| GET | `/api/accounts/:studentId/history` | Latest 50 transactions and draws |
| GET | `/test` | Bilingual button-driven HTTP request tester |

Writes return **201**, invalid inputs **400**, insufficient balance **409**,
unavailable database **503**. Amounts must be integer numbers, not strings;
recharge/exchange limits are 1–100000 coins per request. Wallet coin/gem balances
are limited to 1000000. Student IDs use 1–30 letters/digits/underscore/hyphen.

Wallet operations run in a transaction with a row lock. Concurrent draw requests
cannot both spend the same 10 gems. The wallet update, transaction record and draw
record commit together. SQL uses parameterized values.

## Why 2% SSR means 0.4% per legendary result

The server uses `crypto.randomInt(100)` and selects SSR only for values 0 or 1.
It then uses `crypto.randomInt(5)` to choose one of **Aurora Dragon, Chrono Phoenix,
Celestial Tiger, Nebula Knight, Ocean Empress**. Each SSR result therefore has
`0.02 × 1/5 = 0.004` (0.4%) probability per draw. The other 98% selects from the
five common results. Draws are independent; there is no pity counter and no
guarantee of SSR in 50 or 100 attempts. The API never accepts a client-supplied roll.

โอกาส SSR 2% ต่อครั้ง ไม่ได้หมายความว่าสุ่ม 50 ครั้งแล้วต้องได้ SSR
SSR ทั้งห้าผลมีโอกาสเท่ากัน ตัวละ 0.4% ของการสุ่มทั้งหมด

## Command-line exercise

```powershell
$base = 'http://localhost:8085'
$id = '6688123'
Invoke-RestMethod "$base/health"
Invoke-RestMethod -Method Post -Uri "$base/api/recharge" -ContentType 'application/json' -Body (@{student_id=$id;coins=1000}|ConvertTo-Json)
Invoke-RestMethod -Method Post -Uri "$base/api/exchange" -ContentType 'application/json' -Body (@{student_id=$id;coins=1000}|ConvertTo-Json)
$proof = Invoke-RestMethod -Method Post -Uri "$base/api/draw" -ContentType 'application/json' -Body (@{student_id=$id}|ConvertTo-Json)
$proof | ConvertTo-Json -Depth 5
Invoke-RestMethod "$base/api/accounts/$id/history" | ConvertTo-Json -Depth 5
```

```bash
curl -i http://localhost:8085/health
curl -i -X POST http://localhost:8085/api/recharge -H 'Content-Type: application/json' -d '{"student_id":"6688123","coins":1000}'
curl -i -X POST http://localhost:8085/api/exchange -H 'Content-Type: application/json' -d '{"student_id":"6688123","coins":1000}'
curl -i -X POST http://localhost:8085/api/draw -H 'Content-Type: application/json' -d '{"student_id":"6688123"}'
curl -i http://localhost:8085/api/accounts/6688123/history
```

### Inspect PostgreSQL independently

```text
docker compose exec db psql -U gacha -d gacha
```

Inside `psql`:

```sql
\conninfo
\dt
SELECT student_id, coins, gems FROM wallets;
SELECT id, student_id, result_name, rarity, created_at FROM draws ORDER BY id;
SELECT COUNT(*) FROM draws;
-- Separate SQL practice row: do not change your original proof draw.
INSERT INTO wallets(student_id) VALUES ('sql-practice-6688123') ON CONFLICT DO NOTHING;
SELECT student_id, coins, gems FROM wallets WHERE student_id='sql-practice-6688123';
\q
```

### Prove persistence without generating a new result

Capture the original draw ID, result and creation time, plus the DB container ID
and volume name. Use the same project identity throughout.

```text
docker compose ps -q db
docker inspect --format "{{json .Mounts}}" $(docker compose ps -q db)
docker compose restart
docker compose up -d --wait
```

Read **Saved history** and SQL again. Then:

```text
docker compose down
docker compose up -d --wait
docker compose ps -q db
docker inspect --format "{{json .Mounts}}" $(docker compose ps -q db)
```

The DB container ID changes after down/up; the named volume and original draw
remain. Use only history/SQL reads during this proof; do not recharge/draw again
to replace missing evidence. Ordinary `down` retains the named volume. `down -v`
deletes it and is only a deliberate reset for disposable practice data.

## Lab 13: choose one environment at a time

Use the same working folder, `.env`, student ID and project identity for the core
workshop. Stop the current configuration, choose the next overlay, then repeat the
same experiment. Preview staging with `config`; there is no requirement to run
three projects. The local-to-NPM transition on this Docker host reuses the named
database volume because its project identity remains unchanged.

```bash
# Use the .env already prepared in Lab 12.
docker compose --env-file .env -f compose.yml -f compose.local.yml config --quiet
docker compose --env-file .env -f compose.yml -f compose.local.yml up -d --build --wait
docker compose --env-file .env -f compose.yml -f compose.local.yml down
```

Preview staging by replacing `compose.local.yml` with `compose.staging.yml`
(host port 8086). For the production-shaped classroom configuration, select
`compose.production.yml`; the app has no published host port. Separate environment
secret files and `-p` project identities are optional later practice for genuinely
separate deployments. Such identities select different volumes; they do not copy
the existing data. Moving to the Ubuntu VM or Railway also needs deliberate data
creation/migration because those are different Docker hosts/storage systems.

**Use base + one selected environment overlay.** Do not chain the local overlay
before production: Compose merges port lists, so a local published port may remain.
An explicit `-f` command does not automatically include `compose.override.yml`.
Relative bind paths and build context resolve from the first Compose file's folder.

### Local NPM routing, then Ubuntu VM

For the proxy exercise use the production-shaped overlay (same code, no direct
app port) with the NPM helper:

```text
docker compose --env-file .env -f compose.yml -f compose.production.yml -f compose.proxy.yml up -d --build
```

App and NPM share the project's default network. **NPM's localhost is NPM itself**;
set the proxy destination to **`app:3000`**, not `localhost:3000`. In NPM create a
Proxy Host for your chosen local hostname, Scheme `http`, Forward Host `app`,
Forward Port `3000`. For its custom location `/backend/`, use the same forward
settings and the location's advanced field:

```nginx
rewrite ^/backend/(.*)$ /$1 break;
```

Then **`http://your-local-hostname/backend/test`** reaches the app's `/test`.
The tester derives its request prefix from its URL, so its buttons call
`/backend/api/...` through the same proxy. Do not paste another `location` block or
duplicate `proxy_pass` inside NPM's custom-location advanced field. NPM generates it.
Use `/backend/test` with the slash between backend and test; `/backend` alone can
be redirected to `/backend/` when configuring a standalone Nginx deployment.

For a plain Nginx container on that same network, the equivalent location is:

```nginx
location /backend/ {
    proxy_pass http://app:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

The trailing slash on `proxy_pass` replaces the `/backend/` prefix with `/`.
On Ubuntu, access the loopback-only NPM admin UI with an SSH tunnel rather than
publishing port 81 publicly: `ssh -L 8181:127.0.0.1:81 user@VM_IP`, then open
`http://localhost:8181`. Port 80/443 conflicts mean another web server already owns
those ports. Use the separate classroom VM; do not replace the teaching server.

NPM is a convenient **classroom GUI**, not the recommended production choice for
this course. Prefer reviewed Nginx configuration or a managed platform with
appropriate operations. Its GUI does not provide application authentication,
authorization, abuse controls, backups or a security review.

## Railway mapping

Set the Railway service root to `/workshop/gacha` when deploying this repository,
use its Dockerfile, add PostgreSQL, and supply the private `DATABASE_URL` reference
to the app. Railway's `PORT` is read at runtime and the app binds `0.0.0.0`.
Do not send a local `db` hostname or local volume directory as a cloud endpoint.
No PostgreSQL `ssl.rejectUnauthorized=false` workaround is used.

The app creates its missing base tables on startup; optionally run
`npm run db:init` explicitly using the service environment. Existing schema changes
still need migration work. Generate the app domain, then open `/test` and `/health`.
Local DB rows do not automatically migrate to the Railway database.

## Render, Vercel and the visual tester (optional)

`visual-tester/` is a static p5.js page that draws page → entry → app → database
and animates each real request with its HTTP status and time. It runs four ways:

| How | Page origin | Backend needs |
| --- | --- | --- |
| Built in: `http://localhost:8085/visual/` (or `/backend/visual/` via NPM) | same as API | nothing |
| `cd visual-tester && npm start` (no dependencies) | `http://localhost:5500` | `CORS_ORIGINS=http://localhost:5500` |
| `python3 -m http.server 5500` or `node serve.js` (no npm) | `http://localhost:5500` | same as above |
| Vercel, Root Directory `workshop/gacha/visual-tester`, preset Other | `https://….vercel.app` | that exact origin, HTTPS backend |

`CORS_ORIGINS` is opt-in and comma-separated; empty means same-origin pages only.
After changing `.env`, recreate the app container. Choose a backend in the page,
use `?api=https://YOUR-APP.onrender.com` as a share link, or edit `config.js`.

**Render backend:** create Render Postgres (same region as the app, version 18),
copy its **Internal Database URL**, then create a Docker Web Service from your repo
with Root Directory `workshop/gacha`, Health Check Path `/health`, `DATABASE_URL`
and `CORS_ORIGINS`. Render sets `PORT` (10000 by default); the app already reads it.
Free web services spin down after 15 idle minutes (first request ≈1 minute) and
free Render Postgres expires after 30 days. `render.yaml` declares the same setup
as a Blueprint once you understand the dashboard steps.

ใช้ visual tester ได้ทั้งที่ `/visual/` ของแอป, `npm start`, `python3 -m http.server`
หรือบน Vercel ถ้าหน้าเว็บกับ API ต่าง origin ต้องใส่ origin ของหน้าเว็บใน
`CORS_ORIGINS` ส่วน Render ใช้ Dockerfile เดิมกับ Internal Database URL

## API specification

Open `/api-spec` on the running app for the bilingual endpoint reference, request
and response examples, validation rules and status codes. Download `/openapi.json`
for Postman or another OpenAPI 3 client; set the imported server URL to your own
running app. Through the prefix-stripping proxy, these routes are
`/backend/api-spec` and `/backend/openapi.json`. The `/test` page is the interactive
button client. Documentation is also linked from both teaching labs.

ดู `/api-spec` สำหรับเอกสาร API สองภาษา และ `/openapi.json` สำหรับนำเข้า client
เมื่อผ่าน proxy ใช้ `/backend/api-spec` และ `/backend/openapi.json` ตามลำดับ

## Tests and production boundary

Run `npm ci` then `npm test` for deterministic rarity, input-validation, CORS and
`/visual/` route tests.
The API's transaction integration checks should exercise concurrent draws,
insufficient funds, SQL counts, restart/down-up persistence and DB outage recovery.

Before any public deployment with real users, add account authentication and
authorization, abuse/rate limits, idempotent payment-like writes, monitoring,
least-privilege database roles, reviewed migrations and tested backups. This demo
uses the image bootstrap role to make the beginner workflow small. It is not a
real payment, trading marketplace or production lottery system.

## References

- [Compose networking](https://docs.docker.com/compose/how-tos/networking/)
- [Compose file merging](https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/)
- [PostgreSQL image and initialization](https://hub.docker.com/_/postgres)
- [Nginx Proxy Manager setup](https://nginxproxymanager.com/setup/)
- [Nginx Proxy Manager advanced networking](https://nginxproxymanager.com/advanced-config/)
- [Nginx proxy_pass URI behavior](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass)
- [Railway Dockerfiles](https://docs.railway.com/guides/dockerfiles)
