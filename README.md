# PCSO Lotto Hub

A static, mobile-first English site for Philippine PCSO lotto results, number statistics and the
20% TRAIN Law prize tax — built on **real PCSO draw records** for the five 6-number jackpot games:

| Game | Numbers | Draw nights | ODDS (6 of 6) | Draws stored |
|---|---|---|---|---|
| Ultra Lotto 6/58 | 1–58 | Tue · Fri · Sun, 9:00 PM PHT | 1 in 40,475,358 | 446 |
| Grand Lotto 6/55 | 1–55 | Mon · Wed · Sat, 9:00 PM PHT | 1 in 28,989,675 | 446 |
| Super Lotto 6/49 | 1–49 | Tue · Thu · Sun, 9:00 PM PHT | 1 in 13,983,816 | 446 |
| Mega Lotto 6/45 | 1–45 | Mon · Wed · Fri, 9:00 PM PHT | 1 in 8,145,060 | 446 |
| Lotto 6/42 | 1–42 | Tue · Thu · Sat, 9:00 PM PHT | 1 in 5,245,786 | 444 |

Coverage: **January 2, 2024 → November 15, 2026**, 2,228 draws, refreshed November 16, 2026.

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
├── sitemap.xml             4 URLs, placeholder domain
├── README.md               This file
├── assets/
│   ├── css/style.css       All styling, one file, responsive from 320 px up
│   ├── js/lotto-core.js    Pure logic: tax, claim brackets, statistics, generator, checks (no DOM)
│   ├── js/app.js           UI wiring and rendering
│   └── img/
│       ├── favicon.svg
│       └── og-cover.png    1200×630 social card
├── data/
│   ├── pcso_draws.json     The database (JSON)
│   └── pcso_draws.js       Same database as window.PCSO_DATA, so index.html also works from file://
├── tests/unit_test.py      Unit tests for every calculation, run against the JS core with QuickJS
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

**Statistics** (last 20 / 50 / 100 / all stored draws, always inside the selected game's number pool)
- Frequency heatmap for 1–58, 1–55, 1–49, 1–45 or 1–42 (grid renders to the game's maximum).
- Hot numbers, cold numbers, most overdue numbers (draws since last appearance).
- Odd/even distribution, low/high split (low = 1 … ⌊max/2⌋), sum distribution in equal bands.
- Most common pairs, plus draws analyzed, expected hits per number and average sum.

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
  (`data/results/6-58.json`, `6-55.json`, `6-49.json`, `6-45.json`, `6-42.json`), which republishes the
  PCSO result rows after every draw. Licence CC BY 4.0 — attribution "Lotto Tayo (lottotayo.ph)" is in
  the source note on `index.html` and on the guide page.
- **Nothing is generated.** Every row is a PCSO draw with its date, six winning numbers, jackpot and
  jackpot-winner count. No fill-ins, no estimates.

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

```bash
python3 tools/update_draws.py            # fetch latest from the mirror, validate, rewrite data files
python3 tools/update_draws.py --offline  # rebuild from tools/raw/*.json without network
```

It rewrites `data/pcso_draws.json` and `data/pcso_draws.js` and prints one line per game plus any
warnings (unexpected weekday, duplicate date). Commit the two data files.

Every count and date on `index.html` is rendered from the data at load time, so nothing else needs
editing after a refresh. The exceptions are the static figures written into `guide.html` ("2,228 draws
… January 2, 2024 to November 15, 2026"), the meta/OG descriptions in `index.html` and `guide.html`,
and `<lastmod>` in `sitemap.xml` — update those four by hand when you publish a refresh.

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

**GitHub Pages** — push the folder contents to a repository, then Settings → Pages → Deploy from a
branch → `main` / root. All links are relative, so a project page
(`https://user.github.io/repo/`) works without changes, but update `canonical`, `og:url`, the
sitemap and `robots.txt` to the real URL (see §6).

**Cloudflare Pages** — create a project, connect the repository, framework preset "None", build
command empty, output directory `/` (or the folder that holds `index.html`). No build step.

## 6. Before going live: replace the placeholders

The domain and contact address are placeholders and must be replaced everywhere:

```bash
# 1. domain: pcsolottohub.example  →  your real domain (no trailing slash)
grep -rl "pcsolottohub.example" . --exclude-dir=.git
# 2. contact address: contact@pcsolottohub.example  →  your real mailbox
grep -rl "contact@pcsolottohub.example" . --exclude-dir=.git
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
