# PCSO Lotto Hub

A static, mobile-first site for Philippine PCSO lotto results, number statistics and the 20% TRAIN
Law prize tax — written in **Tagalog by default, English on demand** (`?lang=en` or the
`[Tagalog | English]` switch in the header) and built on **real PCSO draw records** for the five
6-number jackpot games and the two daily digit games:

| Game | Numbers | Draw schedule | Odds (top prize) | Draws stored |
|---|---|---|---|---|
| Ultra Lotto 6/58 | 1–58 | Tue · Fri · Sun, 9:00 PM PHT | 1 in 40,475,358 | 446 |
| Grand Lotto 6/55 | 1–55 | Mon · Wed · Sat, 9:00 PM PHT | 1 in 28,989,675 | 447 |
| Super Lotto 6/49 | 1–49 | Tue · Thu · Sun, 9:00 PM PHT | 1 in 13,983,816 | 446 |
| Mega Lotto 6/45 | 1–45 | Mon · Wed · Fri, 9:00 PM PHT | 1 in 8,145,060 | 447 |
| Lotto 6/42 | 1–42 | Tue · Thu · Sat, 9:00 PM PHT | 1 in 5,245,786 | 444 |
| 3D Lotto (Swertres) | three digits, 0–9 | **every day, 2:00 PM · 5:00 PM · 9:00 PM PHT** | 1 in 1,000 (₱4,500 per ₱10) | 3,120 |
| 2D Lotto (EZ2) | two numbers, 01–31 | **every day, 2:00 PM · 5:00 PM · 9:00 PM PHT** | 1 in 961 (₱4,000 per ₱10) | 3,120 |

Coverage: **January 2, 2024 → November 16, 2026** — 2,230 six-number draws plus 1,040 days × 3 draws
for each digit game (8,470 draws in total). Refreshed automatically by GitHub Actions (see §4).

**Live:** https://lotto-tools.github.io/pcso-lotto-hub/ (GitHub Pages, `main` / root).

No frameworks, no build step, no server: plain HTML, CSS and JavaScript, so the whole folder can be
dropped on GitHub Pages, Cloudflare Pages, Netlify or any static host as-is.

---

## 1. What is in the folder

```
pcso-lotto-site/
├── index.html              Results · Statistics · Generator · Tax calculator (tabbed single page)
├── guide.html              PCSO claiming guide (brackets, documents, tax, 1% commission, FAQ)
├── privacy.html            Privacy policy (cookies, Google AdSense disclosure, rights)
├── terms.html              Terms of use (no affiliation with PCSO, no ticket sales, responsible play)
├── robots.txt              Crawl rules + sitemap pointer
├── sitemap.xml             4 URLs, live domain lotto-tools.github.io/pcso-lotto-hub
├── README.md               This file
├── assets/
│   ├── css/style.css       All styling, one file, responsive from 320 px up
│   ├── js/i18n.js          Language layer: Tagalog source text, English strings, [Tagalog | English] switch
│   ├── js/lotto-core.js    Pure logic: tax, claim brackets, statistics, generators, checks (no DOM)
│   ├── js/daily.js         UI for the daily digit games (3D Lotto · 2D Lotto)
│   ├── js/app.js           UI wiring and rendering of the five 6-number games
│   └── img/
│       ├── logo.png        192×192 brand badge (header .brand-mark)
│       ├── favicon.ico     16/32/48 tab icon
│       ├── favicon-16.png · favicon-32.png · favicon-48.png
│       ├── apple-touch-icon.png  180×180 iOS home screen
│       ├── icon-192.png · icon-512.png  web manifest icons
│       ├── favicon.svg     same mark for browsers that prefer SVG
│       └── og-cover.png    1200×630 social card
├── site.webmanifest        PWA manifest (name, icons, theme colour)
├── data/
│   ├── pcso_draws.json     The database (JSON)
│   └── pcso_draws.js       Same database as window.PCSO_DATA, so index.html also works from file://
├── tests/unit_test.py      Unit tests: every calculation, plus language-key coverage
├── .github/workflows/
│   └── update.yml          Daily GitHub Action: fetch new draws, validate, commit, push
└── tools/
    ├── update_draws.py     Fetch + validate + rebuild data/pcso_draws.{json,js}
    └── browser_check.py    Headless Chromium check: console errors, overflow, features, screenshots
```

## 2. Features

**Results**
- Five-game switcher with the latest jackpot on each pill.
- Latest draw: date, winning numbers, jackpot, jackpot winners, and the net amount after the 20% tax.
- Jackpot trend for the last 30 draws (gold bar = the draw a jackpot was won and reset).
- Search any past draw by date; if the game did not draw that day, the closest earlier draw is shown
  with an explicit note.
- Draw history table: last 20 / 50 / 100 / all stored draws, with the net-after-tax column.
- Draw videos: a **“Watch Draw (YouTube)”** link on the latest result, on the by-date result and on
  every history row opens a YouTube search for that game and that draw date. The official
  [PCSO GOV channel](https://www.youtube.com/@PCSOGOVPHOfficial/streams) is linked from the header
  nav, the hero card and the source note. PCSO keeps no fixed per-draw video address, so the links
  search rather than point at one video.

**Language**
- The page opens in **Tagalog (Filipino)** — the natural language of the players the site is for —
  with an English version behind `?lang=en` and the `[Tagalog | English]` switch at the top right of
  the header on every page.
- The switch remembers the choice in `localStorage`, updates `?lang=` in the address bar when the URL
  already carries it, and re-renders the whole page (hero, game pills, latest result, history table,
  statistics, generator, tax calculator, claiming tiers, check messages, guide, privacy and terms) in
  the chosen language. Dates, weekday names and month names follow the language too (Lin · Lun · Mar …
  / Nob 15, 2026).
- Official game names (`Ultra Lotto 6/58` …), numbers and the peso sign stay as they are; ordinary
  loanwords Filipinos use (lotto, jackpot, draw, kombinasyon, buwis) are kept in Tagalog copy.
- The Tagalog text lives in the HTML (so the page is complete and indexable without JavaScript);
  `assets/js/i18n.js` holds the English strings for every `data-i18n` element plus both languages for
  everything the UI renders at run time.

**Statistics** (last 20 / 50 / 100 / all stored draws, always inside the selected game's number pool)
- Frequency heatmap for 1–58, 1–55, 1–49, 1–45 or 1–42 (grid renders to the game's maximum).
- Hot numbers, cold numbers, most overdue numbers (draws since last appearance).
- Odd/even distribution, low/high split (low = 1 … ⌊max/2⌋), sum distribution in equal bands.
- Most common pairs, plus draws analyzed, expected hits per number and average sum.

**3D Lotto (Swertres) and 2D Lotto (EZ2)** — the two daily digit games
- Their own pills at the right of the game bar (`3D` / `2D`, with `2PM · 5PM · 9PM`), opening a
  dedicated results / statistics / picker set; the five 6-number games and their panels are untouched.
- Latest draw with the digits in the order drawn, the slot (2:00 PM, 5:00 PM or 9:00 PM), the winners
  and the fixed Standard prize — ₱4,500 per ₱10 on 3D, ₱4,000 on 2D — with the net after tax.
- **Today's three draws** as three cards, newest first, each with its own YouTube link.
- Prize table per game: Standard (exact order), and Rambolito — 3D pays ₱750 (three different digits)
  or ₱1,500 (one pair), 2D pays ₱2,000 (any order); a draw where every digit is the same has no
  Rambolito play.
- Date lookup: all three draws of any date since January 2, 2024, each linking a YouTube search
  `PCSO 3D Lotto Swertres {date} {2PM|5PM|9PM}` / `PCSO 2D Lotto EZ2 {date} {slot}`.
- History table (last 20 / 50 / 100 / all) with date, slot, weekday, digits, prize, winners and a
  per-draw video link.
- Statistics: frequency heatmap over 0–9 or 01–31, hot / cold / overdue numbers, a position-by-position
  table (three positions on 3D, two on 2D) and the shape of the winning combination (all different,
  one pair, all the same).
- A simple picker: tap numbers to keep or drop, choose the shape, generate five combinations, and see
  for each one how often it would have hit straight (Standard) or on any order (Rambolito).

**Smart generator**
- Include up to 5 fixed numbers, exclude any number, odd/even split (any, 1:5 … 5:1), optional
  "no consecutive numbers" filter — all inside the selected game's range.
- Generates 5 unique combinations and checks every one against all stored draws of that game,
  showing how many 6-, 5-, 4- and 3-number matches exist, with the matching draws and dates.
- Impossible filter combinations return a plain-language explanation instead of a wrong result.

**Prize & tax calculator (TRAIN Law, RA 10963)**
- ₱10,000 or less: no tax. Above ₱10,000: **20% final withholding tax on the gross prize**.
- Shows gross, tax, net payout and effective deduction; quick buttons load each game's current jackpot.
- Claim routing by amount: ₱20–₱10,000 any authorized outlet or branch; ₱10,001–₱300,000 branch or
  Main Office; over ₱300,000 PCSO Main Office (Sun Plaza, Shaw Blvd. cor. Princeton St., Mandaluyong)
  with two valid government IDs, the one-year deadline and an intact, readable ticket.

## 3. Where the draw data comes from

- **Source of record:** Philippine Charity Sweepstakes Office — *Search Lotto Result by Date*,
  <https://www.pcso.gov.ph/SearchLottoResult.aspx>.
- **Transport:** the open [Lotto Tayo dataset](https://github.com/kimken147/pcso-results-data)
  (`data/results/6-58.json`, `6-55.json`, `6-49.json`, `6-45.json`, `6-42.json` for the six-number
  games, `swertres.json` and `ez2.json` for the digit games), which republishes the PCSO result rows
  after every draw. Licence CC BY 4.0 — attribution "Lotto Tayo (lottotayo.ph)" is in the source note
  on `index.html` and on the guide page.
- **Nothing is generated.** Every row is a PCSO draw with its date, draw time, winning numbers, prize
  and winner count. No fill-ins, no estimates.

Data shape (`data/pcso_draws.json`):

```jsonc
{
  "meta": { "source": "…", "collectedAt": "2026-11-16", "games": { "658": {…}, "3d": {…}, "2d": {…} } },
  "draws": {
    "658": [ { "d": "2026-11-15", "n": [14,15,18,26,33,46], "j": 537913610.81, "w": 0 } ],
    "3d":  [ { "d": "2026-11-16", "t": "21:00", "n": ["7","9","8"], "j": 4500.0, "w": 216 } ],
    "2d":  [ { "d": "2026-11-16", "t": "21:00", "n": ["23","06"],  "j": 4000.0, "w": 236 } ]
  }
}
```

Six-number rows carry date, six ascending numbers, jackpot and jackpot winners. Digit rows carry date,
draw time (`14:00` / `17:00` / `21:00`), the digits **in the order drawn** (`0`–`9` on 3D, `01`–`31`
zero-padded on 2D), the fixed Standard prize and the number of winners.

Spot checks made when the database was built (numbers and jackpots matched exactly):

| Draw | Numbers | Jackpot | Cross-checked against |
|---|---|---|---|
| Ultra 6/58, 2026-11-15 | 14-15-18-26-33-46 | ₱537,913,610.81 | PCSO, GMA News, Inquirer |
| Ultra 6/58, 2025-03-14 | 02-09-14-29-31-44 | ₱153,317,306.00 | GMA News, Lottomatik |
| Grand 6/55, 2026-11-14 | 04-28-30-31-41-44 | ₱365,508,104.29 | PCSO, GMA News, Philstar |
| Mega 6/45, 2025-03-14 | 01-16-22-31-33-34 | ₱10,076,090.80 | Lottomatik |
| Lotto 6/42, 2026-11-14 | 04-18-22-28-31-38 | ₱19,597,809.62 | PCSO, Philstar, Philnews |

The refresh script also checks that every stored draw date falls on that game's scheduled nights
(6/58 Tue·Fri·Sun, 6/55 Mon·Wed·Sat, 6/49 Tue·Thu·Sun, 6/45 Mon·Wed·Fri, 6/42 Tue·Thu·Sat), that each
draw has six unique numbers inside the pool, and that there is one draw per date.

## 4. Refreshing the results

### Automatic (GitHub Actions — no Pickle usage)

`.github/workflows/update.yml` runs `tools/update_draws.py` on GitHub's own servers:

| | |
|---|---|
| Schedule | `40 6`, `40 9`, `30 13`, `30 15` (UTC) = **14:40, 17:40, 21:30 and 23:30 PHT** — after the 2:00 PM, 5:00 PM and 9:00 PM draws |
| Manual run | Actions → *Update PCSO draw results* → **Run workflow** (`workflow_dispatch`) |
| On change | commits `data/` with `github-actions[bot]` and pushes to `main` → Pages redeploys |
| On no change | writes nothing, so there is no diff and no empty commit |

The script refuses to write when the mirror is behind the stored data (a mirror outage would
otherwise roll the published results back) and stops with an explanation instead; `--allow-rewind`
overrides that by hand. A failed fetch, a bad row, a weekday that does not match a six-number game's
schedule, a digit outside 0–9 / 01–31, a draw time outside 2:00 PM / 5:00 PM / 9:00 PM, a date without
its three draws or a digit prize that is not the fixed amount fails the workflow run, so a broken
refresh is visible in the Actions tab rather than silently published.

### By hand

```bash
python3 tools/update_draws.py            # fetch latest from the mirror, validate, rewrite data files
python3 tools/update_draws.py --offline  # rebuild from tools/raw/*.json without network
```

It rewrites `data/pcso_draws.json` and `data/pcso_draws.js` and prints one line per game plus any
warnings (unexpected weekday, duplicate date or slot, a date missing one of its three digit draws, a
digit prize that is not the fixed amount). Commit the two data files.

Every count, date and label on `index.html` is rendered from the data at load time, so nothing else
needs editing after a refresh. `<lastmod>` in `sitemap.xml` is the only hand-maintained date; the
prose deliberately avoids naming an exact draw count so it cannot drift behind the data.

If you would rather read PCSO directly, replace the URL in `tools/update_draws.py` — `normalise()`
only needs `date`, `numbers` (6 items) and `jackpot`, `winners` per draw. Note that pcso.gov.ph
refuses non-browser requests (`403 Access Denied` from its CDN), which is why the mirror is the
default transport.

## 5. Preview and deploy

Local preview (a plain file also works, but a server is closer to production):

```bash
python3 -m http.server 8000
# open http://127.0.0.1:8000/
```

**GitHub Pages** — this site is deployed at https://lotto-tools.github.io/pcso-lotto-hub/ from
`lotto-tools/pcso-lotto-hub` (`main` / root, `Deploy from a branch`). All links are relative, so a
project page (`https://user.github.io/repo/`) works without changes; the absolute URLs
(`canonical`, `og:url`, sitemap, `robots.txt`) already point at that Pages URL — update them if the
repository or user name changes (see §6).

**Cloudflare Pages** — create a project, connect the repository, framework preset "None", build
command empty, output directory `/` (or the folder that holds `index.html`). No build step.

## 6. Placeholders and the deployed domain

The domain is set to the live GitHub Pages URL (`https://lotto-tools.github.io/pcso-lotto-hub`) in
every absolute reference. The contact address is still the placeholder
`contact@pcsolottohub.example`, kept deliberately so no personal mailbox is published; replace it
when a site mailbox exists:

```bash
# contact address: contact@pcsolottohub.example  →  your real mailbox
grep -rl "contact@pcsolottohub.example" . --exclude-dir=.git
# if the user or repository name changes, re-point the domain too
grep -rl "lotto-tools.github.io/pcso-lotto-hub" . --exclude-dir=.git
```

Files that contain them:

| File | What to change |
|---|---|
| `index.html` | `canonical`, `og:url`, `og:image`, JSON-LD `url`/`publisher.url` |
| `guide.html` | `canonical`, `og:url`, `og:image` |
| `privacy.html` | `canonical`, `og:url`, contact address |
| `terms.html` | `canonical`, `og:url`, contact address |
| `sitemap.xml` | all four `<loc>` values, `lastmod` on each refresh |
| `robots.txt` | `Sitemap:` line |

Also:
- Keep the footer and the source note intact: they state that the site is independent and that PCSO's
  record prevails, which is what keeps the site honest and out of trouble.
- If you add AdSense, place the AdSense script before `</head>` and insert ad units where they do not
  push the content down on mobile. No ad slot is pre-wired, so the pages validate as they are.
- Create `ads.txt` at the site root with your AdSense publisher line:
  `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`.

## 7. Testing

```bash
python3 tests/unit_test.py       # logic: tax, brackets, statistics, generator, history check, data
python3 tools/browser_check.py   # headless Chromium: console errors, overflow, UI behaviour
```

`tests/unit_test.py` runs `assets/js/lotto-core.js` in QuickJS and compares it with an independent
Python reimplementation, so the site's own maths is checked against a second implementation rather
than against itself. It needs `pip install quickjs`.

`tools/browser_check.py` needs `pip install playwright && playwright install chromium`; it fails on
any console error, failed request or horizontal overflow at 1440, 768, 390 and 320 px, and writes
`pcso-site-desktop.png` and `pcso-site-mobile.png` to `../downloads/` (override with `SCREENSHOT_DIR`).
It also checks the YouTube draw links: the exact search URL built from each game, draw date and
2PM/5PM/9PM slot, the official channel URL, one link per history row, that the link follows the
selected game, and that every link opens in a new tab with `rel="noopener noreferrer"`.

It covers the daily digit games too: the two extra game pills, the 3D and 2D panels, the three slot
cards of the day, the prize tables (Standard + Rambolito tiers and odds), the per-draw YouTube search
URLs, the date lookup, the 10-cell / 31-cell heatmaps, the position tables, the shape distribution,
the picker and its straight/Rambolito history check, and that switching back restores the six-number
views — at 1440, 768, 390 and 320 px (198 checks, 0 failed).

Screenshots, written to `../downloads/` (`SCREENSHOT_DIR` overrides): `pcso-site-desktop.png`,
`pcso-site-mobile.png`, `pcso-3d-lotto.png`, `pcso-2d-lotto.png` and the two `-panel.png` viewport
shots. The full-page captures are taken at 1× because a page this tall exceeds Chromium's capture
limit at 2×.

## 8. Compliance notes

- The site publishes information. It does **not** sell tickets, accept bets, hold stakes or pay prizes,
  and it says so in the footer, the terms and the guide.
- "PCSO", game names and results are used descriptively. It is stated in the footer, the terms, the
  privacy policy and the guide that the site is not affiliated with or endorsed by PCSO.
- Every page carries an 18+ responsible-play note; the statistics page states plainly that past
  frequencies do not change the odds, and the generator says the same.
- Tax content is labelled as arithmetic and information, not tax advice, and points to PCSO for the
  final computation.

## 9. Licence and attribution

- Site code and text: yours to publish as you like.
- Draw data: © Philippine Charity Sweepstakes Office, reproduced from its published results;
  machine-readable rows via Lotto Tayo (lottotayo.ph) under CC BY 4.0 — keep the attribution.
