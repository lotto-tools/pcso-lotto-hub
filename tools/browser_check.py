#!/usr/bin/env python3
"""
Headless browser check for PCSO Lotto Hub.

Serves the folder on 127.0.0.1, drives the page with Chromium and fails on any
console error, failed asset request or horizontal overflow. Also writes the two
screenshots the hand-off asks for:

    downloads/pcso-site-desktop.png
    downloads/pcso-site-mobile.png

Run:
    python3 tools/browser_check.py
Needs:
    pip install playwright && playwright install chromium
"""
import http.server
import os
import socketserver
import threading
import time

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKSPACE = os.path.dirname(ROOT)
SHOTS = os.environ.get("SCREENSHOT_DIR") or os.path.join(WORKSPACE, "downloads")
PORT = 8145
os.makedirs(SHOTS, exist_ok=True)

results = []


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, *a):
        pass


def log(name, ok, detail=""):
    results.append((name, ok))
    print(("PASS " if ok else "FAIL ") + name + ((" — " + str(detail)) if detail else ""))


def watch(page, errors, failed):
    page.on("console", lambda m: errors.append(m.type + ": " + m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    page.on("response", lambda r: failed.append("%s %s" % (r.status, r.url))
            if r.status >= 400 else None)


def overflow(page, width):
    return page.evaluate("document.documentElement.scrollWidth") - width


def shot(page, path, full=True):
    """Save a screenshot, but never let a capture problem stop the checks."""
    try:
        page.screenshot(path=path, full_page=full)
        print("SHOT " + path)
        return True
    except Exception as exc:  # noqa: BLE001 - a picture must not hide the result
        print("SHOT SKIPPED " + path + " — " + str(exc).split("\n")[0])
        return False


def full_shot(browser, base, width, height, path, mobile=False, lang="tl"):
    """A full-page picture at 1x: the tall page at 2x can exceed the capture limit."""
    ctx = browser.new_context(viewport={"width": width, "height": height},
                              is_mobile=mobile, has_touch=mobile,
                              locale="en-PH", timezone_id="Asia/Manila")
    pg = ctx.new_page()
    pg.goto(base + "/index.html" + ("?lang=" + lang if lang else ""), wait_until="networkidle")
    pg.wait_for_timeout(400)
    pg.add_style_tag(content="html{scroll-behavior:auto !important}"
                     " .site-header,.gamebar{position:static !important}")
    pg.evaluate("window.scrollTo(0, 0)")
    pg.wait_for_timeout(300)
    ok = shot(pg, path, True)
    ctx.close()
    return ok


def main():
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), Handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    time.sleep(0.4)
    base = "http://127.0.0.1:%d" % PORT

    with sync_playwright() as p:
        browser = p.chromium.launch()

        # ---------------- desktop ----------------
        errors, failed = [], []
        ctx = browser.new_context(viewport={"width": 1440, "height": 1000}, device_scale_factor=2,
                                  locale="en-PH", timezone_id="Asia/Manila")
        page = ctx.new_page()
        watch(page, errors, failed)
        page.goto(base + "/index.html?lang=en", wait_until="networkidle")
        page.wait_for_timeout(500)
        log("desktop: no console errors", not errors, errors[:3])
        log("desktop: no failed requests", not failed, failed[:3])
        log("desktop 1440: no horizontal overflow", overflow(page, 1440) <= 1, overflow(page, 1440))

        text = page.inner_text("body")
        log("desktop: latest 6/58 numbers shown", "14" in text and "46" in text)
        log("desktop: jackpot shown", page.inner_text("#latestJackpot") == "₱537,913,610.81",
            page.inner_text("#latestJackpot"))
        log("desktop: net after tax shown", page.inner_text("#heroNet") == "₱430,330,888.65",
            page.inner_text("#heroNet"))
        log("desktop: game pills", page.eval_on_selector_all("#gameBar .game-pill", "e => e.length") == 7,
            page.eval_on_selector_all("#gameBar .game-pill", "e => e.length"))
        log("desktop: the two daily games sit in their own group",
            page.eval_on_selector_all("#gameBar .game-pill--daily", "e => e.length") == 2 and
            page.eval_on_selector_all("#gameBar .gamebar-sep", "e => e.length") == 1)
        log("desktop: daily pills name their three draw times",
            all("2PM · 5PM · 9PM" in t for t in
                page.eval_on_selector_all("#gameBar .game-pill--daily", "e => e.map(x => x.innerText)")),
            page.eval_on_selector_all("#gameBar .game-pill--daily", "e => e.map(x => x.innerText)"))
        log("desktop: history rows", page.eval_on_selector_all("#historyBody tr", "e => e.length") == 20,
            page.eval_on_selector_all("#historyBody tr", "e => e.length"))
        log("desktop: trend bars", page.eval_on_selector_all("#trendChart div div", "e => e.length") >= 29)

        # ---- YouTube draw-video links ----
        YT = "https://www.youtube.com/@PCSOGOVPHOfficial/streams"
        latest_links = page.eval_on_selector_all(
            "#latestVideoLinks a",
            "els => els.map(e => ({href: e.href, target: e.target, rel: e.rel, text: e.textContent}))")
        log("youtube: latest draw has 2 video links", len(latest_links) == 2, latest_links)
        log("youtube: latest draw search link",
            latest_links and latest_links[0]["href"] ==
            "https://www.youtube.com/results?search_query=PCSO+Ultra+Lotto+6%2F58+2026-11-15+lotto+draw",
            latest_links[0]["href"] if latest_links else None)
        log("youtube: latest draw link label",
            latest_links and "Watch Draw (YouTube)" in latest_links[0]["text"],
            latest_links[0]["text"] if latest_links else None)
        log("youtube: latest official channel link",
            latest_links and latest_links[1]["href"] == YT, latest_links[1]["href"] if latest_links else None)
        log("youtube: latest links open in a new tab",
            bool(latest_links) and all(l["target"] == "_blank" and "noopener" in l["rel"]
                                       for l in latest_links), latest_links)
        log("youtube: header nav channel link",
            page.get_attribute(".site-nav a[href$='@PCSOGOVPHOfficial/streams']", "href") == YT)
        log("youtube: hero channel link",
            page.get_attribute(".hero-video a", "href") == YT)
        log("youtube: source box channel link",
            page.get_attribute(".source-box a[href$='@PCSOGOVPHOfficial/streams']", "href") == YT)

        hist_links = page.eval_on_selector_all(
            "#historyBody a.video-link",
            "els => els.map(e => ({href: e.href, target: e.target, rel: e.rel}))")
        log("youtube: every history row has a video link", len(hist_links) == 20, len(hist_links))
        log("youtube: newest history row searches its own date",
            bool(hist_links) and
            "search_query=PCSO+Ultra+Lotto+6%2F58+2026-11-15+lotto+draw" in hist_links[0]["href"],
            hist_links[0]["href"] if hist_links else None)
        log("youtube: history links open in a new tab",
            bool(hist_links) and all(l["target"] == "_blank" and "noopener" in l["rel"]
                                     for l in hist_links), hist_links[:2])
        log("youtube: history dates vary per row",
            len({l["href"] for l in hist_links}) == 20, len({l["href"] for l in hist_links}))

        # switching game rebuilds both the latest card link and the history rows
        page.click("#gameBar .game-pill[data-game='642']")
        page.wait_for_timeout(300)
        log("youtube: 6/42 latest draw link",
            page.get_attribute("#latestVideoLinks a", "href") ==
            "https://www.youtube.com/results?search_query=PCSO+Lotto+6%2F42+2026-11-14+lotto+draw",
            page.get_attribute("#latestVideoLinks a", "href"))
        log("youtube: 6/42 history first link",
            "PCSO+Lotto+6%2F42+2026-11-14" in page.get_attribute("#historyBody a.video-link", "href"),
            page.get_attribute("#historyBody a.video-link", "href"))
        page.click("#gameBar .game-pill[data-game='658']")
        page.wait_for_timeout(300)

        # date search on a real mid-history draw
        page.fill("#dateInput", "2025-03-14")
        page.click("#dateForm button[type=submit]")
        page.wait_for_timeout(300)
        date_text = page.inner_text("#dateResult")
        log("desktop: date search finds 2025-03-14", "Mar 14, 2025" in date_text and "Exact" in date_text,
            date_text[:120])
        log("desktop: date search numbers", "02" in date_text and "44" in date_text)
        log("youtube: date search result has a video link",
            page.eval_on_selector_all("#dateResult .video-row a", "e => e.length") == 2,
            page.eval_on_selector_all("#dateResult .video-row a", "e => e.length"))
        log("youtube: date search link uses that draw date",
            "2025-03-14" in page.get_attribute("#dateResult .video-row a", "href"),
            page.get_attribute("#dateResult .video-row a", "href"))

        # ---------------- statistics ----------------
        page.click("#tabBar .tab[data-tab=stats]")
        page.wait_for_timeout(400)
        log("stats: heatmap has 58 cells", page.eval_on_selector_all("#heatmap .hm", "e => e.length") == 58,
            page.eval_on_selector_all("#heatmap .hm", "e => e.length"))
        log("stats: default range is last 50", "Last 50" in page.inner_text("#statsRangeLabel"),
            page.inner_text("#statsRangeLabel"))
        page.click("#rangeSeg button[data-range='0']")
        page.wait_for_timeout(400)
        log("stats: all stored range", "All 446" in page.inner_text("#statsRangeLabel"),
            page.inner_text("#statsRangeLabel"))
        log("stats: hot chips", page.eval_on_selector_all("#hotChips .chip", "e => e.length") == 6)
        log("stats: sum buckets", page.eval_on_selector_all("#sumChart .ratio-row", "e => e.length") >= 8)
        log("stats: pairs listed", page.eval_on_selector_all("#pairList .pair-row", "e => e.length") == 10)
        log("stats desktop: no overflow", overflow(page, 1440) <= 1)

        # ---------------- generator ----------------
        page.click("#tabBar .tab[data-tab=generator]")
        page.wait_for_timeout(300)
        log("generator: number board 58", page.eval_on_selector_all("#numGrid .num-btn", "e => e.length") == 58)
        page.click("#numGrid .num-btn[data-num='14']")
        page.click("#numGrid .num-btn[data-num='15']")
        page.select_option("#oddEven", "3:3")
        page.click("#btnGenerate")
        page.wait_for_timeout(600)
        combos = page.eval_on_selector_all("#gameList .game", "e => e.length")
        log("generator: five combinations", combos == 5, combos)
        first = page.inner_text("#gameList .game")
        log("generator: fixed numbers kept", first.count("14") >= 1 and first.count("15") >= 1, first[:80])
        log("generator: history check line", "6-match" in first and "3-match" in first, first[:120])
        page.click("#gameList .game .btn")
        page.wait_for_timeout(250)
        log("generator: details open", page.eval_on_selector_all("#gameList .game .hit-list",
                                                                "e => e[0].style.display") == "grid",
            page.eval_on_selector_all("#gameList .game .hit-list", "e => e[0].style.display"))
        log("generator desktop: no overflow", overflow(page, 1440) <= 1)

        # ---------------- calculator ----------------
        page.click("#tabBar .tab[data-tab=calc]")
        page.wait_for_timeout(300)
        log("calc: default net", page.inner_text("#calcNet") == "₱430,330,888.65",
            page.inner_text("#calcNet"))
        log("calc: default tax", page.inner_text("#calcTax") == "₱107,582,722.16",
            page.inner_text("#calcTax"))
        page.fill("#amountInput", "10000")
        page.wait_for_timeout(200)
        log("calc: ₱10,000 is tax free", page.inner_text("#calcTax") == "₱0.00",
            page.inner_text("#calcTax"))
        log("calc: ₱10,000 tier is outlet", "outlet" in page.inner_text("#claimWhere").lower(),
            page.inner_text("#claimWhere"))
        page.fill("#amountInput", "10000.01")
        page.wait_for_timeout(200)
        log("calc: ₱10,000.01 pays ₱2,000.00", page.inner_text("#calcTax") == "₱2,000.00",
            page.inner_text("#calcTax"))
        log("calc: ₱10,000.01 tier is branch", "branch" in page.inner_text("#claimWhere").lower(),
            page.inner_text("#claimWhere"))
        page.fill("#amountInput", "300000.01")
        page.wait_for_timeout(200)
        log("calc: over ₱300,000 goes to the Main Office",
            "Main Office" in page.inner_text("#claimWhere"), page.inner_text("#claimWhere"))
        page.click("#quickJackpots .quick:nth-child(1)")
        page.wait_for_timeout(200)
        log("calc: jackpot quick button", page.inner_text("#calcNet") == "₱430,330,888.65",
            page.inner_text("#calcNet"))
        log("calc desktop: no overflow", overflow(page, 1440) <= 1)
        log("desktop: still no console errors", not errors, errors[:3])

        # ---------------- daily digit games: 3D Lotto ----------------
        page.click("#gameBar .game-pill[data-game='3d']")
        page.wait_for_timeout(400)
        page.click("#tabBar .tab[data-tab=results]")
        page.wait_for_timeout(300)
        log("3D: the pill is selected",
            page.get_attribute("#gameBar .game-pill[data-game='3d']", "aria-selected") == "true")
        log("3D: hero names the game", page.inner_text("#heroGameName") == "3D Lotto (Swertres)",
            page.inner_text("#heroGameName"))
        log("3D: hero shows the drawn digits in order",
            page.eval_on_selector_all("#heroBalls .digit-tile", "e => e.map(x => x.textContent)")
            == ["7", "9", "8"],
            page.eval_on_selector_all("#heroBalls .digit-tile", "e => e.map(x => x.textContent)"))
        log("3D: hero shows the ₱4,500 standard prize",
            page.inner_text("#heroJackpot") == "₱4,500.00", page.inner_text("#heroJackpot"))
        log("3D: hero shows the slot and date",
            "9:00 PM" in page.inner_text("#heroDrawDate") and
            "Nov 16, 2026" in page.inner_text("#heroDrawDate"), page.inner_text("#heroDrawDate"))
        log("3D: hero counts the stored draws", "3,120 draws" in page.inner_text("#heroCount"),
            page.inner_text("#heroCount"))
        log("3D: latest card names the game", page.inner_text("#dailyLatestTitle") ==
            "3D Lotto (Swertres) — latest result", page.inner_text("#dailyLatestTitle"))
        log("3D: latest card shows Monday 9:00 PM",
            page.inner_text("#dailyLatestDate") == "9:00 PM · Monday, Nov 16, 2026",
            page.inner_text("#dailyLatestDate"))
        log("3D: latest digits are tiles",
            page.eval_on_selector_all("#dailyLatestDigits .digit-tile", "e => e.map(x => x.textContent)")
            == ["7", "9", "8"])
        log("3D: winners of the latest draw", page.inner_text("#dailyWinners").startswith("216"),
            page.inner_text("#dailyWinners"))
        log("3D: prize is under the tax threshold", "no tax" in page.inner_text("#dailyNet"),
            page.inner_text("#dailyNet"))

        slots = page.eval_on_selector_all(
            "#dailyToday .slot-card",
            "els => els.map(e => ({slot: e.querySelector('.slot-head b').textContent.trim(),"
            " badge: e.querySelector('.slot-head .badge').textContent.trim(),"
            " nums: Array.from(e.querySelectorAll('.digit-tile')).map(x => x.textContent)}))")
        log("3D: three draw slots today", len(slots) == 3, len(slots))
        log("3D: slots are 9PM, 5PM and 2PM",
            [s["slot"] for s in slots] == ["9:00 PM", "5:00 PM", "2:00 PM"],
            [s["slot"] for s in slots])
        log("3D: slot digits", [s["nums"] for s in slots] ==
            [["7", "9", "8"], ["4", "8", "2"], ["5", "9", "5"]],
            [s["nums"] for s in slots])
        log("3D: slot winners", [s["badge"] for s in slots] ==
            ["216 winners", "146 winners", "174 winners"],
            [s["badge"] for s in slots])

        prize_rows = page.eval_on_selector_all("#dailyPrizeBody tr",
                                               "e => e.map(r => r.innerText.replace(/\\t/g, ' | '))")
        log("3D: the prize table lists Standard and both Rambolito tiers",
            len(prize_rows) == 3 and "₱4,500.00" in prize_rows[0] and "1 in 1,000" in prize_rows[0]
            and "₱750.00" in prize_rows[1] and "1 in 167" in prize_rows[1]
            and "₱1,500.00" in prize_rows[2] and "1 in 333" in prize_rows[2], prize_rows)
        log("3D: Rambolito is explained as the any-order play",
            "Rambolito 6" in prize_rows[1] and "Rambolito 3" in prize_rows[2], prize_rows)

        log("3D: history shows the last 50 draws",
            page.eval_on_selector_all("#dailyHistoryBody tr", "e => e.length") == 50,
            page.eval_on_selector_all("#dailyHistoryBody tr", "e => e.length"))
        first_hist = page.inner_text("#dailyHistoryBody tr")
        log("3D: newest history row is today's 9PM draw",
            "Nov 16, 2026" in first_hist and "9:00 PM" in first_hist and "216" in first_hist,
            first_hist.replace("\n", " ")[:90])
        log("3D: history rows carry the digits",
            page.eval_on_selector_all("#dailyHistoryBody tr:first-child .digit-tile",
                                      "e => e.map(x => x.textContent)") == ["7", "9", "8"])
        log("3D: history label", "Last 50 stored draws" in page.inner_text("#dailyHistoryLabel"),
            page.inner_text("#dailyHistoryLabel"))

        YT3D = ("https://www.youtube.com/results?search_query="
                "PCSO+3D+Lotto+Swertres+2026-11-16+9PM")
        log("3D: the latest draw links to a 9PM YouTube search",
            page.get_attribute("#dailyVideoLinks a", "href") == YT3D,
            page.get_attribute("#dailyVideoLinks a", "href"))
        log("3D: the draw link label",
            "Watch Draw (YouTube)" in page.inner_text("#dailyVideoLinks a"),
            page.inner_text("#dailyVideoLinks a"))
        log("3D: history rows link their own draw time",
            page.eval_on_selector_all(
                "#dailyHistoryBody a.video-link",
                "els => els.every(a => a.target === '_blank'"
                " && a.rel.indexOf('noopener') >= 0"
                " && /PCSO\\+3D\\+Lotto\\+Swertres\\+\\d{4}-\\d{2}-\\d{2}\\+[259]PM$/.test(a.href))"))
        log("3D: history links differ per draw",
            len(set(page.eval_on_selector_all("#dailyHistoryBody a.video-link",
                                              "e => e.map(a => a.href)"))) == 50,
            len(set(page.eval_on_selector_all("#dailyHistoryBody a.video-link",
                                              "e => e.map(a => a.href)"))))

        page.fill("#dailyDateInput", "2025-03-14")
        page.click("#dailyDateForm button[type=submit]")
        page.wait_for_timeout(300)
        date_text = page.inner_text("#dailyDateResult")
        log("3D: date lookup finds all three draws of 2025-03-14",
            "Mar 14, 2025" in date_text and "Exact draw date" in date_text
            and date_text.count(":00 PM") == 3, date_text.replace("\n", " ")[:120])
        log("3D: date lookup links carry that date",
            page.eval_on_selector_all("#dailyDateResult a.video-link", "e => e.length") == 3
            and all("2025-03-14" in h for h in
                    page.eval_on_selector_all("#dailyDateResult a.video-link", "e => e.map(a => a.href)")))

        # ---------------- daily digit games: statistics ----------------
        page.click("#tabBar .tab[data-tab=stats]")
        page.wait_for_timeout(500)
        log("3D stats: heatmap has 10 cells",
            page.eval_on_selector_all("#dailyHeatmap .hm", "e => e.length") == 10,
            page.eval_on_selector_all("#dailyHeatmap .hm", "e => e.length"))
        log("3D stats: heatmap starts at 0",
            page.eval_on_selector_all("#dailyHeatmap .hm", "e => e[0].innerText.split('\\n')[0]") == "0")
        log("3D stats: title", page.inner_text("#dailyStatsTitle") ==
            "3D Lotto (Swertres) — number statistics", page.inner_text("#dailyStatsTitle"))
        log("3D stats: default range is last 50", "Last 50 draws" in page.inner_text("#dailyStatsRange"),
            page.inner_text("#dailyStatsRange"))
        log("3D stats: three position rows",
            page.eval_on_selector_all("#dailyPosBody tr", "e => e.length") == 3,
            page.eval_on_selector_all("#dailyPosBody tr", "e => e.length"))
        log("3D stats: position table covers 0-9",
            page.eval_on_selector_all("#dailyPosHead th", "e => e.length") == 11,
            page.eval_on_selector_all("#dailyPosHead th", "e => e.length"))
        log("3D stats: shape rows",
            page.eval_on_selector_all("#dailyShapeChart .ratio-row", "e => e.length") == 3,
            page.eval_on_selector_all("#dailyShapeChart .ratio-row", "e => e.length"))
        log("3D stats: shapes are named",
            "Three different digits" in page.inner_text("#dailyShapeChart") and
            "One pair" in page.inner_text("#dailyShapeChart") and
            "All three digits the same" in page.inner_text("#dailyShapeChart"),
            page.inner_text("#dailyShapeChart").replace("\n", " ")[:120])
        log("3D stats: hot chips", page.eval_on_selector_all("#dailyHotChips .chip", "e => e.length") == 5)
        page.click("#dailyRangeSeg button[data-range='0']")
        page.wait_for_timeout(400)
        log("3D stats: all stored range",
            "All 3,120 draws" in page.inner_text("#dailyStatsRange"),
            page.inner_text("#dailyStatsRange"))
        log("3D stats desktop: no overflow", overflow(page, 1440) <= 1)

        # ---------------- daily digit games: picker ----------------
        page.click("#tabBar .tab[data-tab=generator]")
        page.wait_for_timeout(400)
        log("3D picker: ten number buttons",
            page.eval_on_selector_all("#dailyNumGrid .num-btn", "e => e.length") == 10,
            page.eval_on_selector_all("#dailyNumGrid .num-btn", "e => e.length"))
        log("3D picker: title", page.inner_text("#dailyGenTitle") ==
            "3D Lotto (Swertres) — combination picker", page.inner_text("#dailyGenTitle"))
        log("3D picker: shape choices include Rambolito shapes",
            page.eval_on_selector_all("#dailyShape option", "e => e.map(o => o.textContent)")
            == ["Any shape", "Three different digits", "One pair", "All three digits the same"],
            page.eval_on_selector_all("#dailyShape option", "e => e.map(o => o.textContent)"))
        page.click("#dailyNumGrid .num-btn[data-num='4']")
        page.wait_for_timeout(200)
        log("3D picker: an included number narrows the pool",
            "Numbers in play: 4" in page.inner_text("#dailyPickSummary"),
            page.inner_text("#dailyPickSummary"))
        page.click("#dailyBtnClear")
        page.select_option("#dailyShape", "allDiff")
        page.click("#dailyBtnGenerate")
        page.wait_for_timeout(500)
        log("3D picker: five combinations",
            page.eval_on_selector_all("#dailyGameList .game", "e => e.length") == 5,
            page.eval_on_selector_all("#dailyGameList .game", "e => e.length"))
        combos = page.eval_on_selector_all(
            "#dailyGameList .game",
            "els => els.map(e => Array.from(e.querySelectorAll('.game-top .digit-tile'))"
            ".map(x => x.textContent))")
        log("3D picker: every combination has three different digits",
            all(len(set(c)) == 3 for c in combos) and all(len(c) == 3 for c in combos), combos)
        first_combo = page.inner_text("#dailyGameList .game")
        log("3D picker: the history check line",
            "straight hits" in first_combo and "Rambolito" in first_combo, first_combo[:120])
        page.click("#dailyGameList .game .btn")
        page.wait_for_timeout(300)
        log("3D picker: details open",
            page.eval_on_selector_all("#dailyGameList .game .hit-list", "e => e[0].style.display")
            == "grid")
        log("3D picker: hits name the draw time",
            ":00 PM" in page.inner_text("#dailyGameList .game .hit-list")
            or "No stored draw" in page.inner_text("#dailyGameList .game .hit-list"),
            page.inner_text("#dailyGameList .game .hit-list")[:90].replace("\n", " "))
        log("3D picker desktop: no overflow", overflow(page, 1440) <= 1)

        # ---------------- daily digit games: 2D EZ2 ----------------
        page.click("#gameBar .game-pill[data-game='2d']")
        page.wait_for_timeout(400)
        page.click("#tabBar .tab[data-tab=results]")
        page.wait_for_timeout(300)
        log("2D: hero names the game", page.inner_text("#heroGameName") == "2D Lotto (EZ2)",
            page.inner_text("#heroGameName"))
        log("2D: the ₱4,000 standard prize", page.inner_text("#heroJackpot") == "₱4,000.00",
            page.inner_text("#heroJackpot"))
        log("2D: digits keep their leading zero",
            page.eval_on_selector_all("#heroBalls .digit-tile", "e => e.map(x => x.textContent)")
            == ["23", "06"],
            page.eval_on_selector_all("#heroBalls .digit-tile", "e => e.map(x => x.textContent)"))
        log("2D: latest winners", page.inner_text("#dailyWinners").startswith("236"),
            page.inner_text("#dailyWinners"))
        rows2 = page.eval_on_selector_all("#dailyPrizeBody tr",
                                          "e => e.map(r => r.innerText.replace(/\\t/g, ' | '))")
        log("2D: prize table has Standard and Rambolito",
            len(rows2) == 2 and "₱4,000.00" in rows2[0] and "1 in 961" in rows2[0]
            and "₱2,000.00" in rows2[1] and "1 in 481" in rows2[1], rows2)
        log("2D: history shows two numbers per draw",
            page.eval_on_selector_all("#dailyHistoryBody tr:first-child .digit-tile",
                                      "e => e.map(x => x.textContent)") == ["23", "06"])
        log("2D: the draw link searches EZ2",
            page.get_attribute("#dailyVideoLinks a", "href") ==
            "https://www.youtube.com/results?search_query=PCSO+2D+Lotto+EZ2+2026-11-16+9PM",
            page.get_attribute("#dailyVideoLinks a", "href"))
        page.click("#tabBar .tab[data-tab=stats]")
        page.wait_for_timeout(500)
        log("2D stats: heatmap has 31 cells",
            page.eval_on_selector_all("#dailyHeatmap .hm", "e => e.length") == 31,
            page.eval_on_selector_all("#dailyHeatmap .hm", "e => e.length"))
        log("2D stats: two position rows",
            page.eval_on_selector_all("#dailyPosBody tr", "e => e.length") == 2)
        log("2D stats: two shape rows",
            page.eval_on_selector_all("#dailyShapeChart .ratio-row", "e => e.length") == 2)
        log("2D stats desktop: no overflow", overflow(page, 1440) <= 1)
        page.click("#tabBar .tab[data-tab=generator]")
        page.wait_for_timeout(400)
        log("2D picker: 31 number buttons",
            page.eval_on_selector_all("#dailyNumGrid .num-btn", "e => e.length") == 31,
            page.eval_on_selector_all("#dailyNumGrid .num-btn", "e => e.length"))
        page.click("#dailyBtnGenerate")
        page.wait_for_timeout(500)
        log("2D picker: five combinations in 01-31",
            page.eval_on_selector_all("#dailyGameList .game", "e => e.length") == 5 and
            len(page.eval_on_selector_all("#dailyGameList .game-top .digit-tile",
                                          "e => e.map(x => x.textContent)")) == 10,
            page.eval_on_selector_all("#dailyGameList .game", "e => e.length"))
        log("2D picker desktop: no overflow", overflow(page, 1440) <= 1)
        log("daily: no console errors", not errors, errors[:3])

        page.click("#gameBar .game-pill[data-game='658']")
        page.wait_for_timeout(400)
        page.click("#tabBar .tab[data-tab=results]")
        page.wait_for_timeout(300)
        log("back to 6/58: hero restored", page.inner_text("#heroGameName") == "Ultra Lotto 6/58",
            page.inner_text("#heroGameName"))
        log("back to 6/58: the results panel is back",
            not page.evaluate("document.getElementById('panel-results').hidden"))
        log("back to 6/58: history rows",
            page.eval_on_selector_all("#historyBody tr", "e => e.length") == 20)

        # desktop screenshots: the results panel at 2x, the whole page at 1x
        page.click("#tabBar .tab[data-tab=results]")
        page.wait_for_timeout(400)
        page.click(".lang-switch [data-lang=tl]")
        page.wait_for_timeout(300)
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(250)
        page.add_style_tag(content="html{scroll-behavior:auto !important}"
                           " .site-header,.gamebar{position:static !important}")
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(500)
        shot(page, os.path.join(SHOTS, "pcso-site-desktop-panel.png"), full=False)
        ctx.close()
        full_shot(browser, base, 1440, 1000, os.path.join(SHOTS, "pcso-site-desktop.png"))

        # 3D Lotto and 2D Lotto panels as their own pictures
        for gid, name in (("3d", "pcso-3d-lotto.png"), ("2d", "pcso-2d-lotto.png")):
            c3 = browser.new_context(viewport={"width": 1280, "height": 1000},
                                     locale="en-PH", timezone_id="Asia/Manila")
            p3 = c3.new_page()
            p3.goto(base + "/index.html?lang=en", wait_until="networkidle")
            p3.wait_for_timeout(400)
            p3.click("#gameBar .game-pill[data-game='%s']" % gid)
            p3.wait_for_timeout(500)
            shot(p3, os.path.join(SHOTS, name), full=True)
            c3.close()

        # ---------------- tablet ----------------
        tctx = browser.new_context(viewport={"width": 768, "height": 1024}, device_scale_factor=2)
        tp = tctx.new_page()
        terr = []
        watch(tp, terr, [])
        tp.goto(base + "/index.html", wait_until="networkidle")
        tp.wait_for_timeout(400)
        log("tablet 768: no overflow", overflow(tp, 768) <= 1, overflow(tp, 768))
        log("tablet 768: no console errors", not terr, terr[:3])
        tctx.close()

        # ---------------- mobile ----------------
        merr = []
        mctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=3,
                                   is_mobile=True, has_touch=True, locale="en-PH")
        m = mctx.new_page()
        watch(m, merr, [])
        m.goto(base + "/index.html", wait_until="networkidle")
        m.wait_for_timeout(500)
        log("mobile 390: no console errors", not merr, merr[:3])
        log("mobile 390: no overflow", overflow(m, 390) <= 1, overflow(m, 390))
        log("mobile: jackpot shown", m.inner_text("#heroJackpot") == "₱537,913,610.81")
        log("mobile: latest draw video link visible",
            m.is_visible("#latestVideoLinks a") and
            "Panoorin ang draw" in m.inner_text("#latestVideoLinks a"),
            m.inner_text("#latestVideoLinks a") if m.is_visible("#latestVideoLinks a") else None)
        log("mobile: hero channel link visible", m.is_visible(".hero-video a"))
        log("mobile: guide link in the tab bar", m.is_visible("#tabBar a.tab--guide"),
            m.inner_text("#tabBar a.tab--guide") if m.is_visible("#tabBar a.tab--guide") else None)
        log("mobile: header shows brand and the language switch",
            m.is_visible(".brand") and m.is_visible(".lang-switch")
            and not m.is_visible(".site-nav a"))

        # switch game on mobile: 6/42 must re-render to a 42-number board
        m.click("#gameBar .game-pill[data-game='642']")
        m.wait_for_timeout(400)
        log("mobile: 6/42 jackpot after switch",
            m.inner_text("#heroJackpot") == "₱19,597,809.62", m.inner_text("#heroJackpot"))
        m.click("#tabBar .tab[data-tab=stats]")
        m.wait_for_timeout(900)
        panel_top = m.evaluate("document.getElementById('panel-stats').getBoundingClientRect().top")
        # the tab bar now carries a fifth, full-width guide link on phones
        log("mobile: tab switch brings the panel into view", panel_top < 300, panel_top)
        log("mobile: 6/42 heatmap has 42 cells",
            m.eval_on_selector_all("#heatmap .hm", "e => e.length") == 42,
            m.eval_on_selector_all("#heatmap .hm", "e => e.length"))
        log("mobile stats: no overflow", overflow(m, 390) <= 1, overflow(m, 390))
        m.click("#tabBar .tab[data-tab=generator]")
        m.wait_for_timeout(300)
        log("mobile: 6/42 number board is 42",
            m.eval_on_selector_all("#numGrid .num-btn", "e => e.length") == 42,
            m.eval_on_selector_all("#numGrid .num-btn", "e => e.length"))
        m.click("#btnGenerate")
        m.wait_for_timeout(500)
        log("mobile: generator works on 6/42",
            m.eval_on_selector_all("#gameList .game", "e => e.length") == 5)
        log("mobile generator: no overflow", overflow(m, 390) <= 1, overflow(m, 390))
        m.click("#tabBar .tab[data-tab=calc]")
        m.wait_for_timeout(300)
        m.fill("#amountInput", "365508104.29")
        m.wait_for_timeout(250)
        log("mobile: calc 6/55 jackpot net", m.inner_text("#calcNet") == "₱292,406,483.43",
            m.inner_text("#calcNet"))
        log("mobile calc: no overflow", overflow(m, 390) <= 1, overflow(m, 390))

        # ---------------- daily digit games on a phone ----------------
        m.click("#gameBar .game-pill[data-game='3d']")
        m.wait_for_timeout(500)
        m.click("#tabBar .tab[data-tab=results]")
        m.wait_for_timeout(300)
        log("mobile: the daily pill switches the panel",
            not m.evaluate("document.getElementById('panel-daily-results').hidden"))
        log("mobile: three slot cards", m.eval_on_selector_all("#dailyToday .slot-card", "e => e.length") == 3)
        log("mobile 3D: no overflow", overflow(m, 390) <= 1, overflow(m, 390))
        m.click("#tabBar .tab[data-tab=stats]")
        m.wait_for_timeout(600)
        log("mobile 3D stats: ten heat cells",
            m.eval_on_selector_all("#dailyHeatmap .hm", "e => e.length") == 10)
        log("mobile 3D stats: no overflow", overflow(m, 390) <= 1, overflow(m, 390))
        m.click("#tabBar .tab[data-tab=generator]")
        m.wait_for_timeout(400)
        log("mobile 3D picker: the board is a ten-button grid",
            m.eval_on_selector_all("#dailyNumGrid .num-btn", "e => e.length") == 10)
        m.click("#dailyBtnGenerate")
        m.wait_for_timeout(500)
        log("mobile 3D picker: combinations appear",
            m.eval_on_selector_all("#dailyGameList .game", "e => e.length") == 5)
        log("mobile 3D picker: no overflow", overflow(m, 390) <= 1, overflow(m, 390))
        m.click("#gameBar .game-pill[data-game='2d']")
        m.wait_for_timeout(500)
        log("mobile 2D: no overflow", overflow(m, 390) <= 1, overflow(m, 390))
        m.click("#tabBar .tab[data-tab=stats]")
        m.wait_for_timeout(600)
        log("mobile 2D stats: 31 heat cells",
            m.eval_on_selector_all("#dailyHeatmap .hm", "e => e.length") == 31)
        log("mobile 2D stats: no overflow", overflow(m, 390) <= 1, overflow(m, 390))

        # back to 6/58 results and take the mobile screenshot
        m.click("#gameBar .game-pill[data-game='658']")
        m.click("#tabBar .tab[data-tab=results]")
        m.wait_for_timeout(400)
        m.evaluate("window.scrollTo(0, 0)")
        m.wait_for_timeout(300)
        m.add_style_tag(content="html{scroll-behavior:auto !important}"
                        " .site-header,.gamebar{position:static !important}")
        m.evaluate("window.scrollTo(0, 0)")
        m.wait_for_timeout(500)
        shot(m, os.path.join(SHOTS, "pcso-site-mobile-panel.png"), full=False)
        mctx.close()
        full_shot(browser, base, 390, 844, os.path.join(SHOTS, "pcso-site-mobile.png"), mobile=True)

        # smallest phone
        sctx = browser.new_context(viewport={"width": 320, "height": 640}, is_mobile=True, has_touch=True)
        sp = sctx.new_page()
        serr = []
        watch(sp, serr, [])
        sp.goto(base + "/index.html", wait_until="networkidle")
        sp.wait_for_timeout(400)
        log("320px: no overflow", overflow(sp, 320) <= 1, overflow(sp, 320))
        log("320px: no console errors", not serr, serr[:2])
        sctx.close()

        # ---------------- language: Tagalog default + [Tagalog | English] ----------------
        langctx = browser.new_context(viewport={"width": 1440, "height": 1000})
        lp = langctx.new_page()
        lerr = []
        watch(lp, lerr, [])
        lp.goto(base + "/index.html", wait_until="networkidle")
        lp.wait_for_timeout(400)
        log("lang: html lang is tl by default", lp.evaluate("document.documentElement.lang") == "tl",
            lp.evaluate("document.documentElement.lang"))
        log("lang: default h1 is Tagalog", "Resulta ng PCSO lotto" in lp.inner_text("h1"),
            lp.inner_text("h1")[:80])
        log("lang: default nav is Tagalog", lp.inner_text(".site-nav a").startswith("Resulta"),
            lp.inner_text(".site-nav a")[:60])
        log("lang: default tabs are Tagalog", "Pinakabagong Resulta" in lp.inner_text("#tabBar"))
        log("lang: weekday in Tagalog", "Lin," in lp.inner_text("#heroDrawDate"),
            lp.inner_text("#heroDrawDate"))
        log("lang: Tagalog month", "Nob" in lp.inner_text("#latestDate"), lp.inner_text("#latestDate"))
        log("lang: switcher visible", lp.is_visible(".lang-switch"))
        log("lang: Tagalog is the active pill",
            lp.get_attribute(".lang-switch [data-lang=tl]", "aria-pressed") == "true")
        log("lang: switcher sits at the header's right edge",
            lp.evaluate("(() => {"
                        " var s = document.querySelector('.lang-switch').getBoundingClientRect();"
                        " var h = document.querySelector('.site-header .header-inner').getBoundingClientRect();"
                        " var nav = document.querySelector('.site-nav').getBoundingClientRect();"
                        " return s.top < 80 && Math.abs(h.right - s.right) < 24 && s.left > nav.left; })()"))
        log("lang: draw button in Tagalog", "Panoorin ang draw" in lp.inner_text("#latestVideoLinks"),
            lp.inner_text("#latestVideoLinks")[:60])
        log("lang: Tagalog stats labels", "Mga draw na sinuri" in lp.inner_text("#panel-stats"))

        # the daily digit section follows the same switch
        lp.click("#gameBar .game-pill[data-game='3d']")
        lp.wait_for_timeout(400)
        log("lang: 3D section in Tagalog", "pinakabagong resulta" in lp.inner_text("#dailyLatestTitle"),
            lp.inner_text("#dailyLatestTitle"))
        log("lang: Tagalog slot card", "Tatlong draw ngayon" in lp.inner_text("#panel-daily-results"))
        log("lang: Tagalog prize rows", "eksaktong ayos" in lp.inner_text("#dailyPrizeBody"),
            lp.inner_text("#dailyPrizeBody")[:80].replace("\n", " "))
        log("lang: Tagalog daily picker button",
            "Gumawa ng 5 kombinasyon" in lp.inner_text("#dailyBtnGenerate"))
        lp.click("#gameBar .game-pill[data-game='658']")
        lp.wait_for_timeout(300)
        log("lang: no console errors in Tagalog", not lerr, lerr[:2])

        lp.click(".lang-switch [data-lang=en]")
        lp.wait_for_timeout(350)
        log("lang: English after the click", "Philippine PCSO lotto results" in lp.inner_text("h1"),
            lp.inner_text("h1")[:80])
        log("lang: English nav", lp.inner_text(".site-nav a").startswith("Results"),
            lp.inner_text(".site-nav a")[:40])
        log("lang: English weekday", "Sun," in lp.inner_text("#heroDrawDate"), lp.inner_text("#heroDrawDate"))
        lp.click("#gameBar .game-pill[data-game='3d']")
        lp.wait_for_timeout(400)
        log("lang: daily section in English",
            "latest result" in lp.inner_text("#dailyLatestTitle") and
            "Today\u2019s three draws" in lp.inner_text("#panel-daily-results"),
            lp.inner_text("#dailyLatestTitle"))
        log("lang: English prize rows", "exact order" in lp.inner_text("#dailyPrizeBody"),
            lp.inner_text("#dailyPrizeBody")[:80].replace("\n", " "))
        lp.click("#gameBar .game-pill[data-game='658']")
        lp.wait_for_timeout(300)
        log("lang: English history header", "Draw date" in lp.inner_text("#historyBody").replace("\n", " ")
            or lp.inner_text("table.data th") == "Draw date", lp.inner_text("table.data th"))
        log("lang: document title in English", "PCSO Lotto Results" in lp.title(), lp.title())
        log("lang: English is the active pill",
            lp.get_attribute(".lang-switch [data-lang=en]", "aria-pressed") == "true")
        log("lang: choice saved in localStorage",
            lp.evaluate("localStorage.getItem('pcso-lang')") == "en")
        lp.reload(wait_until="networkidle")
        lp.wait_for_timeout(300)
        log("lang: stays English after a reload", "Philippine PCSO lotto results" in lp.inner_text("h1"))
        lp.click(".lang-switch [data-lang=tl]")
        lp.wait_for_timeout(350)
        log("lang: back to Tagalog", "Resulta ng PCSO lotto" in lp.inner_text("h1"))
        log("lang: Tagalog restored everywhere",
            lp.inner_text(".site-nav a") == "Resulta" and
            "Panoorin ang draw" in lp.inner_text("#latestVideoLinks"),
            lp.inner_text(".site-nav a"))
        log("lang: no console errors after switching", not lerr, lerr[:2])

        # calculator in Tagalog
        lp.click("#tabBar .tab[data-tab=calc]")
        lp.wait_for_timeout(350)
        log("lang: Tagalog tier table", "Saan kukunin" in lp.inner_text("#tierTable"))
        log("lang: Tagalog claiming office",
            "Main Office" in lp.inner_text("#claimWhere"), lp.inner_text("#claimWhere")[:80])
        log("lang: Tagalog tax labels", "Netong matatanggap" in lp.inner_text("#panel-calc"))

        # generator error message in the page language
        lp.click("#tabBar .tab[data-tab=generator]")
        lp.wait_for_timeout(300)
        log("lang: Tagalog generate button", "Gumawa ng 5 kombinasyon" in lp.inner_text("#btnGenerate"),
            lp.inner_text("#btnGenerate"))
        langctx.close()

        # explicit ?lang= on a fresh context each time
        for q, expect in (("?lang=tl", "Resulta ng PCSO lotto"),
                          ("?lang=en", "Philippine PCSO lotto results")):
            p2 = browser.new_page(viewport={"width": 1280, "height": 900})
            p2.goto(base + "/index.html" + q, wait_until="networkidle")
            p2.wait_for_timeout(300)
            log("lang: %s opens in that language" % q, expect in p2.inner_text("h1"))
            p2.close()

        # the content pages carry the same switcher
        gp = browser.new_page(viewport={"width": 1280, "height": 900})
        gp.goto(base + "/guide.html", wait_until="networkidle")
        gp.wait_for_timeout(300)
        log("lang: guide opens in Tagalog", "Paano i-claim ang premyo" in gp.inner_text("h1"),
            gp.inner_text("h1"))
        gp.click(".lang-switch [data-lang=en]")
        gp.wait_for_timeout(250)
        log("lang: guide switches to English", "How to claim a PCSO lotto prize" in gp.inner_text("h1"),
            gp.inner_text("h1"))
        log("lang: guide title in English", "PCSO Prize Claiming Guide" in gp.title(), gp.title())
        gp.close()
        pp = browser.new_page(viewport={"width": 1280, "height": 900})
        pp.goto(base + "/privacy.html", wait_until="networkidle")
        pp.wait_for_timeout(250)
        log("lang: privacy opens in Tagalog", "Patakaran sa privacy" in pp.inner_text("h1"),
            pp.inner_text("h1"))
        pp.close()
        tp2 = browser.new_page(viewport={"width": 1280, "height": 900})
        tp2.goto(base + "/terms.html?lang=en", wait_until="networkidle")
        tp2.wait_for_timeout(250)
        log("lang: terms in English with ?lang=en", tp2.inner_text("h1") == "Terms of use",
            tp2.inner_text("h1"))
        tp2.close()

        # ---------------- content pages ----------------
        for name in ("guide.html", "privacy.html", "terms.html"):
            for width in (1440, 390):
                err, bad = [], []
                pg = browser.new_page(viewport={"width": width, "height": 900})
                watch(pg, err, bad)
                pg.goto("%s/%s" % (base, name), wait_until="networkidle")
                pg.wait_for_timeout(250)
                log("%s @%d: clean" % (name, width),
                    not err and not bad and overflow(pg, width) <= 1,
                    (err + bad)[:2] or overflow(pg, width))
                pg.close()

        # sitemap / robots reachable
        api = browser.new_page()
        for path in ("/robots.txt", "/sitemap.xml", "/data/pcso_draws.json"):
            resp = api.goto(base + path)
            log("%s serves 200" % path, resp.status == 200, resp.status)
        api.close()

        browser.close()

    httpd.shutdown()
    fails = [r for r in results if not r[1]]
    print("\n%d checks · %d failed" % (len(results), len(fails)))
    print("screenshots:", SHOTS)
    return 1 if fails else 0


if __name__ == "__main__":
    raise SystemExit(main())
