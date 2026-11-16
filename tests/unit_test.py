#!/usr/bin/env python3
"""
PCSO Lotto Hub — unit tests.

The site's own logic (assets/js/lotto-core.js) is executed in QuickJS and compared
with independent Python implementations written from the definitions, so each
check is a real second opinion rather than a mirror of the JavaScript.

Run:
    python3 tests/unit_test.py
Needs:
    pip install quickjs
"""
import itertools
import json
import math
import os
import random
import sys
from collections import Counter

import quickjs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORE = os.path.join(ROOT, "assets", "js", "lotto-core.js")
DATA = os.path.join(ROOT, "data", "pcso_draws.json")

GAMES = {"658": 58, "655": 55, "649": 49, "645": 45, "642": 42}

# the two daily digit games: three draws a day at 2:00 PM, 5:00 PM, 9:00 PM PHT
DIGITS = {
    "3d": {"name": "3D Lotto (Swertres)", "digits": 3, "lo": 0, "hi": 9,
           "pad": False, "prize": 4500.0, "rambolito": {750.0, 1500.0}},
    "2d": {"name": "2D Lotto (EZ2)", "digits": 2, "lo": 1, "hi": 31,
           "pad": True, "prize": 4000.0, "rambolito": {2000.0}},
}
DRAW_TIMES = ["14:00", "17:00", "21:00"]
DIGIT_LATEST = {
    "3d": {"d": "2026-11-16", "t": "21:00", "n": ["7", "9", "8"], "j": 4500.0, "w": 216},
    "2d": {"d": "2026-11-16", "t": "21:00", "n": ["23", "06"], "j": 4000.0, "w": 236},
}
SCHEDULE = {"658": {"Tue", "Fri", "Sun"}, "655": {"Mon", "Wed", "Sat"},
            "649": {"Tue", "Thu", "Sun"}, "645": {"Mon", "Wed", "Fri"},
            "642": {"Tue", "Thu", "Sat"}}
LATEST = {
    "658": {"d": "2026-11-15", "n": [14, 15, 18, 26, 33, 46], "j": 537913610.81},
    "655": {"d": "2026-11-16", "n": [9, 11, 26, 32, 43, 52], "j": 373622097.49},
    "649": {"d": "2026-11-15", "n": [2, 15, 16, 18, 27, 49], "j": 109180461.29},
    "645": {"d": "2026-11-16", "n": [13, 22, 26, 41, 43, 45], "j": 22331155.54},
    "642": {"d": "2026-11-14", "n": [4, 18, 22, 28, 31, 38], "j": 19597809.62},
}

ctx = quickjs.Context()
ctx.eval(open(CORE, encoding="utf-8").read())
payload = json.load(open(DATA, encoding="utf-8"))
ctx.eval("var DATA = " + json.dumps(payload) + ";")

passed = 0
failed = []


def check(name, cond, detail=""):
    global passed
    if cond:
        passed += 1
    else:
        failed.append(name + (" — " + str(detail) if detail else ""))


def js(expr):
    return json.loads(ctx.eval("JSON.stringify(" + expr + ")"))


def round2(x):
    return math.floor(abs(x) * 100 + 0.5) / 100 * (1 if x >= 0 else -1)


# ------------------------------------------------------------------ payout tax
def ref_tax(gross):
    """TRAIN Law: <=10,000 exempt; above it, 20% final tax on the whole gross."""
    g = round2(max(0.0, float(gross)))
    tax = 0.0 if g <= 10000 else round2(g * 0.20)
    return {"gross": g, "tax": tax, "net": round2(g - tax)}


BOUNDARY = [0, 0.01, 1, 19.99, 20, 99.99, 100, 5000, 9999.99, 10000, 10000.01,
            10000.02, 10001, 20000, 50000, 60000, 60000.01, 299999.99, 300000,
            300000.01, 1000000, 537913610.81, 365508104.29, 9999999999.99]
random.seed(20261116)
CASES = BOUNDARY + [round(random.uniform(0, 20_000_000_000), 2) for _ in range(400)]

for amount in CASES:
    got = js("PCSOCore.calcTax(%s)" % json.dumps(amount))
    exp = ref_tax(amount)
    ok = (abs(got["gross"] - exp["gross"]) < 0.005 and abs(got["tax"] - exp["tax"]) < 0.005
          and abs(got["net"] - exp["net"]) < 0.005)
    check("calcTax(%s)" % amount, ok, "got tax=%s net=%s exp tax=%s net=%s"
          % (got["tax"], got["net"], exp["tax"], exp["net"]))

# the two sides of the ₱10,000 cliff
t = js("PCSOCore.calcTax(10000)")
check("₱10,000 is tax-free", t["tax"] == 0 and t["net"] == 10000 and t["taxable"] is False, t)
t = js("PCSOCore.calcTax(10000.01)")
check("₱10,000.01 is taxed on the whole prize",
      abs(t["tax"] - 2000.00) < 0.005 and abs(t["net"] - 8000.01) < 0.005, t)
check("₱10,000.01 is flagged taxable", t["taxable"] is True)
t = js("PCSOCore.calcTax(537913610.81)")
check("6/58 latest jackpot tax", abs(t["tax"] - 107582722.16) < 0.005, t["tax"])
check("6/58 latest jackpot net", abs(t["net"] - 430330888.65) < 0.005, t["net"])
check("6/58 latest jackpot rate", abs(t["effectiveRate"] - 0.2) < 1e-9)
t = js("PCSOCore.calcTax(100000000)")
check("₱100M -> ₱20M tax / ₱80M net",
      abs(t["tax"] - 20000000) < 0.005 and abs(t["net"] - 80000000) < 0.005, t)
check("negative input is clamped", js("PCSOCore.calcTax(-5)")["gross"] == 0)
check("calcTax keeps cents", abs(js("PCSOCore.calcTax(1234.56)")["net"] - 1234.56) < 0.005)

# ------------------------------------------------------------- claim brackets
CASES = {0: "none", 19.99: "none", 20: "outlet", 100: "outlet", 10000: "outlet",
         10000.01: "branch", 50000: "branch", 300000: "branch",
         300000.01: "main", 537913610.81: "main"}
for amount, tier in CASES.items():
    check("claimTier(%s) = %s" % (amount, tier),
          js("PCSOCore.claimTier(%s)" % json.dumps(amount))["key"] == tier,
          js("PCSOCore.claimTier(%s)" % json.dumps(amount))["key"])
main = js("PCSOCore.claimTier(537913610.81)")
check("main office mentions Mandaluyong", "Mandaluyong" in main["where"], main["where"])
check("main office asks for two IDs", any("Two valid" in d for d in main["docs"]), main["docs"])
outlet = js("PCSOCore.claimTier(5000)")
check("outlet tier mentions an outlet", "outlet" in outlet["where"])
branch = js("PCSOCore.claimTier(150000)")
check("branch tier mentions a branch", "branch" in branch["where"])

# -------------------------------------------------------------------- odds
odds = {"658": 40475358, "655": 28989675, "649": 13983816, "645": 8145060, "642": 5245786}
for gid, expected in odds.items():
    got = js("PCSOCore.odds(%d)" % GAMES[gid])
    check("odds %s = 1 in %s" % (gid, expected), got == expected, got)
    check("combinations C(%d,6)" % GAMES[gid], math.comb(GAMES[gid], 6) == expected)
check("combinations edge C(6,6)=1", js("PCSOCore.combinations(6,6)") == 1)
check("combinations edge C(5,6)=0", js("PCSOCore.combinations(5,6)") == 0)

# ------------------------------------------------------------ data integrity
draws = payload["draws"]
meta = payload["meta"]
check("seven games stored", sorted(draws.keys()) == sorted(list(GAMES.keys()) + list(DIGITS.keys())),
      list(draws.keys()))
check("meta games match", sorted(meta["games"].keys()) == sorted(list(GAMES.keys()) + list(DIGITS.keys())),
      sorted(meta["games"].keys()))
check("source is PCSO", "PCSO" in meta["source"], meta["source"])
check("coverage starts 2024-01-02", min(d["d"] for g in draws.values() for d in g) == "2024-01-02")
check("coverage ends 2026-11-16", max(d["d"] for g in draws.values() for d in g) == "2026-11-16")

for gid, mx in GAMES.items():
    rows = draws[gid]
    check("%s draw count" % gid, len(rows) >= 440 and len(rows) == meta["games"][gid]["count"],
          len(rows))
    check("%s dates unique" % gid, len({r["d"] for r in rows}) == len(rows))
    check("%s dates ascending" % gid, all(rows[i]["d"] < rows[i + 1]["d"] for i in range(len(rows) - 1)))
    check("%s six unique numbers in 1..%d" % (gid, mx),
          all(len(r["n"]) == 6 and len(set(r["n"])) == 6 and all(1 <= n <= mx for n in r["n"])
              for r in rows))
    check("%s numbers sorted" % gid, all(r["n"] == sorted(r["n"]) for r in rows))
    check("%s on scheduled nights" % gid,
          all(r["d"] and __import__("datetime").date.fromisoformat(r["d"]).strftime("%a")
              in SCHEDULE[gid] for r in rows))
    check("%s jackpots positive" % gid, all(r["j"] > 0 for r in rows))
    check("%s winner counts valid" % gid, all(isinstance(r["w"], int) and r["w"] >= 0 for r in rows))
    newest = rows[-1]
    check("%s latest date %s" % (gid, LATEST[gid]["d"]), newest["d"] == LATEST[gid]["d"], newest["d"])
    check("%s latest numbers" % gid, newest["n"] == LATEST[gid]["n"], newest["n"])
    check("%s latest jackpot" % gid, abs(newest["j"] - LATEST[gid]["j"]) < 0.005, newest["j"])
    check("%s latest in meta" % gid, meta["games"][gid]["latest"]["d"] == newest["d"])

# ------------------------------------------------------------------ statistics
def ref_analyze(subset, mx):
    n = len(subset)
    freq = [0] * (mx + 1)
    last = [-1] * (mx + 1)
    odd = [0] * 7
    low = [0] * 7
    sums = []
    pairs = Counter()
    lowmax = mx // 2
    for i, row in enumerate(subset):
        for v in row["n"]:
            freq[v] += 1
            last[v] = i
        sums.append(sum(row["n"]))
        odd[sum(1 for v in row["n"] if v % 2)] += 1
        low[sum(1 for v in row["n"] if v <= lowmax)] += 1
        for a, b in itertools.combinations(row["n"], 2):
            pairs[(a, b)] += 1
    gap = [0] + [n if last[v] == -1 else n - 1 - last[v] for v in range(1, mx + 1)]
    order = [{"n": v, "c": freq[v], "g": gap[v]} for v in range(1, mx + 1)]
    hot = sorted(order, key=lambda x: (-x["c"], x["n"]))[:6]
    cold = sorted(order, key=lambda x: (x["c"], x["n"]))[:6]
    overdue = sorted(order, key=lambda x: (-x["g"], x["n"]))[:10]
    pair_list = sorted(pairs.items(), key=lambda kv: (-kv[1], kv[0][0]))[:10]
    return {"freq": freq, "gap": gap, "odd": odd, "low": low, "sums": sums,
            "hot": [(x["n"], x["c"]) for x in hot], "cold": [(x["n"], x["c"]) for x in cold],
            "overdue": [(x["n"], x["g"]) for x in overdue],
            "pairs": [([a, b], c) for (a, b), c in pair_list], "lowmax": lowmax}


for gid, mx in GAMES.items():
    rows = draws[gid]
    for rng in (20, 50, 100, 0):
        a = js("PCSOCore.analyze(DATA.draws['%s'], %d, %d)" % (gid, mx, rng))
        subset = rows if rng == 0 else rows[-rng:]
        ref = ref_analyze(subset, mx)
        label = "%s range %s" % (gid, rng or "all")
        check(label + " size", a["size"] == len(subset) and a["max"] == mx)
        check(label + " freq", [a["freq"][v] for v in range(1, mx + 1)] == ref["freq"][1:],
              [(v, a["freq"][v], ref["freq"][v]) for v in range(1, mx + 1)
               if a["freq"][v] != ref["freq"][v]][:5])
        check(label + " gap", [a["gap"][v] for v in range(1, mx + 1)] == ref["gap"][1:],
              [(v, a["gap"][v], ref["gap"][v]) for v in range(1, mx + 1)
               if a["gap"][v] != ref["gap"][v]][:5])
        check(label + " odd distribution", a["oddDist"] == ref["odd"], a["oddDist"])
        check(label + " low/high distribution", a["lowDist"] == ref["low"], a["lowDist"])
        check(label + " lowMax", a["lowMax"] == ref["lowmax"], a["lowMax"])
        check(label + " sums", a["sums"] == ref["sums"])
        check(label + " hot", [(x["n"], x["count"]) for x in a["hot"]] == ref["hot"],
              [(x["n"], x["count"]) for x in a["hot"]])
        check(label + " cold", [(x["n"], x["count"]) for x in a["cold"]] == ref["cold"])
        check(label + " overdue", [(x["n"], x["gap"]) for x in a["overdue"]] == ref["overdue"],
              [(x["n"], x["gap"]) for x in a["overdue"]])
        check(label + " pairs", [([p["pair"][0], p["pair"][1]], p["count"]) for p in a["pairs"]]
              == ref["pairs"], a["pairs"][:3])
        check(label + " expected hits", abs(a["expected"] - 6 * len(subset) / mx) < 1e-9)
        check(label + " avg sum", abs(a["avgSum"] - sum(ref["sums"]) / len(subset)) < 1e-6)
        check(label + " bucket total", sum(b["count"] for b in a["sumBuckets"]) == len(subset),
              sum(b["count"] for b in a["sumBuckets"]))
        check(label + " buckets cover every sum",
              all(b["lo"] <= s <= b["hi"] for s in ref["sums"] for b in a["sumBuckets"]
                  if b["lo"] <= s <= b["hi"]) and
              all(any(b["lo"] <= s <= b["hi"] for b in a["sumBuckets"]) for s in ref["sums"]))

empty = js("PCSOCore.analyze([], 58, 20)")
check("empty analysis is safe", empty["size"] == 0 and sum(empty["freq"]) == 0
      and empty["hot"] == [] and empty["sumBuckets"] == [])

check("sumFormula 6/58", js("PCSOCore.sumFormula(58)") == {"min": 21, "max": 333, "avg": 177})
check("sumFormula 6/42", js("PCSOCore.sumFormula(42)") == {"min": 21, "max": 237, "avg": 129})

# ------------------------------------------------------------------ generator
def violates(games, opts, mx):
    fixed = set(opts.get("fixed", []))
    excluded = set(opts.get("excluded", []))
    ratio = opts.get("oddEven", "any")
    seen = set()
    for g in games:
        if len(g) != 6 or len(set(g)) != 6:
            return "length/duplicate " + str(g)
        if any(n < 1 or n > mx for n in g):
            return "range " + str(g)
        if not fixed.issubset(set(g)):
            return "fixed missing " + str(g)
        if excluded & set(g):
            return "excluded present " + str(g)
        if ratio != "any":
            want = int(ratio.split(":")[0])
            if sum(1 for n in g if n % 2 == 1) != want:
                return "odd/even " + str(g)
        if opts.get("noConsecutive"):
            s = sorted(g)
            if any(s[i + 1] - s[i] == 1 for i in range(5)):
                return "consecutive " + str(g)
        key = tuple(sorted(g))
        if key in seen:
            return "duplicate combination " + str(g)
        seen.add(key)
    return None


CONFIGS = [
    {"oddEven": "any"},
    {"oddEven": "3:3"},
    {"oddEven": "1:5", "noConsecutive": True},
    {"oddEven": "5:1", "noConsecutive": True},
    {"oddEven": "2:4"},
    {"oddEven": "4:2", "noConsecutive": True},
    {"fixed": [3, 7, 58], "oddEven": "any"},
    {"fixed": [2, 4, 6], "oddEven": "3:3"},
    {"fixed": [1, 3, 5, 7, 9], "noConsecutive": True},
    {"excluded": list(range(1, 40)), "oddEven": "any"},
    {"fixed": [10, 20], "excluded": [1, 2, 3, 4, 5, 6, 7, 8, 9], "oddEven": "2:4"},
]
for gid in ("658", "642"):
    mx = GAMES[gid]
    for ci, cfg in enumerate(CONFIGS):
        # numbers above the pool are pushed out of the config for the 6/42 game
        c = json.loads(json.dumps(cfg))
        c["fixed"] = [n for n in c.get("fixed", []) if n <= mx]
        c["excluded"] = [n for n in c.get("excluded", []) if n <= mx]
        # keep enough numbers in the pool for a 6-number ticket inside the smaller game
        if len(c["excluded"]) > mx - 8:
            c["excluded"] = c["excluded"][:mx - 8]
        c["max"] = mx
        c["count"] = 5
        for run in range(12):
            res = js("PCSOCore.generate(%s)" % json.dumps(c))
            if res["error"]:
                check("generate %s cfg%d run%d" % (gid, ci, run), False, res["error"])
                continue
            check("generate %s cfg%d run%d count" % (gid, ci, run), len(res["games"]) == 5,
                  len(res["games"]))
            problem = violates(res["games"], c, mx)
            check("generate %s cfg%d run%d constraints" % (gid, ci, run), problem is None, problem)

rejects = [
    ("six fixed numbers", {"max": 58, "fixed": [1, 2, 3, 4, 5, 6], "count": 5}),
    ("excluded leaves too few", {"max": 58, "excluded": list(range(1, 55)), "count": 5}),
    ("same number in and out", {"max": 58, "fixed": [7], "excluded": [7], "count": 5}),
    ("out of pool", {"max": 42, "fixed": [50], "count": 5}),
    ("impossible odd/even with fixed", {"max": 58, "fixed": [2, 4, 6, 8, 10], "oddEven": "5:1",
                                        "count": 5}),
]
for name, cfg in rejects:
    res = js("PCSOCore.generate(%s)" % json.dumps(cfg))
    check("generate rejects: " + name, bool(res["error"]) and res["games"] == [], res)

res = js("PCSOCore.generate({max:42, fixed:[42], count:5})")
check("generate keeps the top number of the pool",
      all(42 in g for g in res["games"]) and all(max(g) <= 42 for g in res["games"]), res["games"])

# -------------------------------------------------------------- history check
for gid, mx in GAMES.items():
    rows = draws[gid]
    newest = rows[-1]
    h = js("PCSOCore.checkHistory(%s, DATA.draws['%s'])" % (json.dumps(newest["n"]), gid))
    check("history %s: a real draw matches 6" % gid, h["counts"]["6"] >= 1, h["counts"])
    top = h["hits"][0]
    check("history %s: best hit is a 6/6 of that date" % gid,
          top["match"] == 6 and top["d"] == newest["d"], top)
    five = newest["n"][:5]
    h5 = js("PCSOCore.checkHistory(%s, DATA.draws['%s'])" % (json.dumps(five), gid))
    check("history %s: five of six numbers" % gid, h5["counts"]["6"] == 0 and h5["counts"]["5"] >= 1,
          h5["counts"])
    three = newest["n"][:3]
    h3 = js("PCSOCore.checkHistory(%s, DATA.draws['%s'])" % (json.dumps(three), gid))
    check("history %s: three numbers" % gid, h3["counts"]["3"] >= 1 and h3["counts"]["4"] == 0,
          h3["counts"])
    none = js("PCSOCore.checkHistory([], DATA.draws['%s'])" % gid)
    check("history %s: empty ticket" % gid, none["total"] == 0 and none["counts"]["6"] == 0)

# --------------------------------------------------------- independent recount
for gid in ("658", "655", "649", "645", "642"):
    rows = draws[gid]
    combo = rows[-1]["n"]
    exp = Counter()
    for row in rows:
        m = len(set(combo) & set(row["n"]))
        if m >= 3:
            exp[m] += 1
    got = js("PCSOCore.checkHistory(%s, DATA.draws['%s'])" % (json.dumps(combo), gid))["counts"]
    check("history recount %s" % gid,
          all(got[str(k)] == exp[k] for k in (3, 4, 5, 6)), "%s vs %s" % (got, dict(exp)))

# --------------------------------------------------------------- date lookup
for gid in GAMES:
    rows = draws[gid]
    hit = js("PCSOCore.findByDate(DATA.draws['%s'], '%s')" % (gid, rows[-5]["d"]))
    check("findByDate exact %s" % gid, hit["exact"] is True and hit["draw"]["d"] == rows[-5]["d"])
    # a Sunday cannot be a 6/55 draw
    miss = js("PCSOCore.findByDate(DATA.draws['%s'], '2026-11-15')" % gid)
    check("findByDate %s 2026-11-15" % gid,
          (miss["exact"] is True) == (gid in ("658", "649")) or miss["draw"] is None,
          miss.get("draw"))
    early = js("PCSOCore.findByDate(DATA.draws['%s'], '2001-01-01')" % gid)
    check("findByDate before coverage %s" % gid,
          early["direction"] == "after" and early["draw"]["d"] == rows[0]["d"], early["direction"])

# ----------------------------------------------------------------- formatting
check("formatPeso jackpot", js("PCSOCore.formatPeso(537913610.81)") == "₱537,913,610.81",
      js("PCSOCore.formatPeso(537913610.81)"))
check("formatPeso cents kept", js("PCSOCore.formatPeso(1234.5)") == "₱1,234.50")
check("formatPeso zero", js("PCSOCore.formatPeso(0)") == "₱0.00")
check("formatNumber", js("PCSOCore.formatNumber(40475358)") == "40,475,358")
check("shortPeso millions", js("PCSOCore.shortPeso(365508104.29)") == "₱365.5M",
      js("PCSOCore.shortPeso(365508104.29)"))
check("shortPeso billions", js("PCSOCore.shortPeso(1200000000)") == "₱1.20B")
check("shortPeso thousands", js("PCSOCore.shortPeso(18324659)") == "₱18.3M")
check("weekday", js("PCSOCore.weekday('2026-11-15')") == "Sun")
check("longWeekday", js("PCSOCore.longWeekday('2026-11-15')") == "Sunday")
check("formatDate", js("PCSOCore.formatDate('2026-11-15')") == "Nov 15, 2026")
check("formatDateShort", js("PCSOCore.formatDateShort('2024-01-02')") == "Jan 2")
check("ballBand top of 6/58", js("PCSOCore.ballBand(58,58)") == 5)
check("ballBand first", js("PCSOCore.ballBand(1,58)") == 1)
check("ballBand in range", all(1 <= js("PCSOCore.ballBand(%d,42)" % n) <= 5 for n in range(1, 43)))
check("nextDraw returns a scheduled night",
      js("PCSOCore.nextDraw(PCSOCore.getGame('655'))")["label"].split(",")[0]
      in ("Mon", "Wed", "Sat"),
      js("PCSOCore.nextDraw(PCSOCore.getGame('655'))"))
check("nextDraw 6/58", js("PCSOCore.nextDraw(PCSOCore.getGame('658'))")["label"].split(",")[0]
      in ("Tue", "Fri", "Sun"))

# ------------------------------------------------- daily digit games: data
def dnum(gid, v):
    """A drawn value as the database stores it: "7" on 3D, "07" on 2D."""
    return ("%02d" % v) if DIGITS[gid]["pad"] else str(v)


for gid, cfg in DIGITS.items():
    rows = draws[gid]
    label = gid
    check(label + " draw count", len(rows) == 3120 and len(rows) == meta["games"][gid]["count"],
          len(rows))
    check(label + " three draws a day",
          all(sum(1 for r in rows if r["d"] == day) == 3 for day in {r["d"] for r in rows}),
          len({r["d"] for r in rows}))
    check(label + " 1040 draw days", len({r["d"] for r in rows}) == 1040)
    check(label + " draw times are 2PM / 5PM / 9PM",
          all(r["t"] in DRAW_TIMES for r in rows) and
          {r["t"] for r in rows} == set(DRAW_TIMES), sorted({r["t"] for r in rows}))
    check(label + " one row per date and time",
          len({(r["d"], r["t"]) for r in rows}) == len(rows))
    check(label + " rows sorted by date then time",
          all((rows[i]["d"], rows[i]["t"]) < (rows[i + 1]["d"], rows[i + 1]["t"])
              for i in range(len(rows) - 1)))
    check(label + " rows carry the winning digits",
          all(len(r["n"]) == cfg["digits"] for r in rows))
    check(label + " every value inside its range",
          all(cfg["lo"] <= int(n) <= cfg["hi"] for r in rows for n in r["n"]))
    if cfg["pad"]:
        check(label + " values are two digits wide",
              all(len(n) == 2 for r in rows for n in r["n"]),
              [n for r in rows for n in r["n"] if len(n) != 2][:5])
    else:
        check(label + " values are single digits",
              all(len(n) == 1 for r in rows for n in r["n"]))
    check(label + " fixed prize per ₱10",
          all(abs(r["j"] - cfg["prize"]) < 0.005 for r in rows))
    check(label + " winner counts valid",
          all(isinstance(r["w"], int) and r["w"] >= 0 for r in rows))
    newest = rows[-1]
    check(label + " latest draw", newest["d"] == DIGIT_LATEST[gid]["d"]
          and newest["t"] == DIGIT_LATEST[gid]["t"], (newest["d"], newest["t"]))
    check(label + " latest digits", newest["n"] == DIGIT_LATEST[gid]["n"], newest["n"])
    check(label + " latest winners", newest["w"] == DIGIT_LATEST[gid]["w"], newest["w"])
    check(label + " meta latest matches", meta["games"][gid]["latest"] == newest)
    check(label + " meta coverage", meta["games"][gid]["from"] == rows[0]["d"]
          and meta["games"][gid]["to"] == rows[-1]["d"])
    check(label + " meta knows its draw times", meta["games"][gid]["times"] == DRAW_TIMES)
    check(label + " meta is a digit game", meta["games"][gid]["kind"] == "digits")
    check(label + " meta prize", abs(meta["games"][gid]["prize"] - cfg["prize"]) < 0.005)

for gid in GAMES:
    check("six-number %s is still one draw per date" % gid,
          len({r["d"] for r in draws[gid]}) == len(draws[gid]))
    check("six-number %s rows have no draw time" % gid,
          all("t" not in r for r in draws[gid]))

# the catalogue the page draws from agrees with the database
cat = {g["id"]: g for g in js("PCSOCore.DIGIT_GAMES")}
check("catalogue has 3D and 2D", sorted(cat.keys()) == ["2d", "3d"], sorted(cat.keys()))
for gid, cfg in DIGITS.items():
    c = cat[gid]
    check("catalogue %s digits" % gid, c["digits"] == cfg["digits"])
    check("catalogue %s range" % gid, c["minValue"] == cfg["lo"] and c["maxValue"] == cfg["hi"])
    check("catalogue %s prize" % gid, abs(c["prize"] - cfg["prize"]) < 0.005)
    check("catalogue %s three draw times" % gid, c["times"] == DRAW_TIMES and c["perDay"] == 3)
    check("catalogue %s is looked up by id" % gid,
          js("PCSOCore.getDigitGame('%s').id" % gid) == gid)
check("a six-number game is not a digit game", js("PCSOCore.getDigitGame('658')") is None)
check("an unknown id is not a digit game", js("PCSOCore.getDigitGame('xyz')") is None)

# ------------------------------------------------- daily digit games: prizes
def ref_digit_shape(nums):
    distinct = len(set(nums))
    if distinct == 1:
        return "allSame"
    return "allDiff" if distinct == len(nums) else "onePair"


PRIZE_CASES = [
    ("3d", ["7", "9", "8"], 4500, 750, "allDiff"),
    ("3d", ["5", "9", "5"], 4500, 1500, "onePair"),
    ("3d", ["5", "5", "5"], 4500, None, "allSame"),
    ("3d", ["0", "0", "1"], 4500, 1500, "onePair"),
    ("2d", ["23", "06"], 4000, 2000, "allDiff"),
    ("2d", ["07", "07"], 4000, None, "allSame"),
    ("2d", ["31", "01"], 4000, 2000, "allDiff"),
]
for gid, nums, std, rb, shape in PRIZE_CASES:
    got = js("PCSOCore.digitPrize('%s', %s)" % (gid, json.dumps(nums)))
    check("digitPrize %s %s" % (gid, nums), got["standard"] == std and got["rambolito"] == rb
          and got["shape"] == shape, got)

for gid, nums, std, rb, shape in PRIZE_CASES:
    check("ref shape %s" % nums, ref_digit_shape(nums) == shape, ref_digit_shape(nums))

check("3D odds", js("PCSOCore.digitOdds('3d')") ==
      {"standard": 1000, "rambolitoDifferent": 167, "rambolitoPair": 333},
      js("PCSOCore.digitOdds('3d')"))
check("2D odds", js("PCSOCore.digitOdds('2d')") ==
      {"standard": 961, "rambolitoDifferent": 481, "rambolitoPair": None},
      js("PCSOCore.digitOdds('2d')"))
check("3D standard odds are 10^3", 1000 == 10 ** DIGITS["3d"]["digits"])
check("2D standard odds are 31*31", 961 == 31 * 31)

check("slot labels", js("PCSOCore.slotLabel('14:00')") == "2:00 PM"
      and js("PCSOCore.slotLabel('17:00')") == "5:00 PM"
      and js("PCSOCore.slotLabel('21:00')") == "9:00 PM")
check("slot short labels", js("PCSOCore.slotShort('14:00')") == "2PM"
      and js("PCSOCore.slotShort('21:00')") == "9PM")
check("digit padding follows the game",
      js("PCSOCore.padDigit(5, PCSOCore.getDigitGame('2d'))") == "05"
      and js("PCSOCore.padDigit(5, PCSOCore.getDigitGame('3d'))") == "5")

# ------------------------------------------------- daily digit games: stats
def ref_analyze_digits(subset, cfg):
    lo, hi, digits = cfg["lo"], cfg["hi"], cfg["digits"]
    freq = {v: 0 for v in range(lo, hi + 1)}
    last = {v: -1 for v in range(lo, hi + 1)}
    pos = [{v: 0 for v in range(lo, hi + 1)} for _ in range(digits)]
    shapes = Counter()
    sums = []
    for i, row in enumerate(subset):
        vals = [int(n) for n in row["n"]]
        for k, v in enumerate(vals):
            freq[v] += 1
            pos[k][v] += 1
            last[v] = i
        shapes[ref_digit_shape(vals)] += 1
        sums.append(sum(vals))
    n = len(subset)
    gap = {v: (n if last[v] == -1 else n - 1 - last[v]) for v in range(lo, hi + 1)}
    hot = sorted(freq.items(), key=lambda kv: (-kv[1], kv[0]))[:5]
    cold = sorted(freq.items(), key=lambda kv: (kv[1], kv[0]))[:5]
    overdue = sorted(gap.items(), key=lambda kv: (-kv[1], kv[0]))[:5]
    return {"freq": freq, "gap": gap, "pos": pos, "shapes": shapes, "sums": sums,
            "hot": hot, "cold": cold, "overdue": overdue}


for gid, cfg in DIGITS.items():
    rows = draws[gid]
    for rng in (20, 50, 100, 0):
        a = js("PCSOCore.analyzeDigits(DATA.draws['%s'], '%s', %d)" % (gid, gid, rng))
        subset = rows if rng == 0 else rows[-rng:]
        ref = ref_analyze_digits(subset, cfg)
        label = "%s digits range %s" % (gid, rng or "all")
        check(label + " size", a["size"] == len(subset), a["size"])
        check(label + " range", a["lo"] == cfg["lo"] and a["hi"] == cfg["hi"], (a["lo"], a["hi"]))
        check(label + " coverage", a["from"] == subset[0]["d"] and a["to"] == subset[-1]["d"])
        check(label + " freq",
              [a["freq"][i] for i in range(cfg["hi"] - cfg["lo"] + 1)]
              == [ref["freq"][v] for v in range(cfg["lo"], cfg["hi"] + 1)],
              (a["freq"], ref["freq"]))
        check(label + " gap",
              [a["gap"][i] for i in range(cfg["hi"] - cfg["lo"] + 1)]
              == [ref["gap"][v] for v in range(cfg["lo"], cfg["hi"] + 1)],
              (a["gap"], ref["gap"]))
        check(label + " appearances add up", sum(a["freq"]) == cfg["digits"] * len(subset),
              sum(a["freq"]))
        for p in range(cfg["digits"]):
            check(label + " position %d" % p,
                  [a["posFreq"][p][i] for i in range(cfg["hi"] - cfg["lo"] + 1)]
                  == [ref["pos"][p][v] for v in range(cfg["lo"], cfg["hi"] + 1)],
                  (a["posFreq"][p], ref["pos"][p]))
        check(label + " shapes",
              all(a["shapes"][k] == ref["shapes"][k]
                  for k in ("allSame", "onePair", "allDiff"))
              and sum(a["shapes"].values()) == len(subset), a["shapes"])
        check(label + " expected hits",
              abs(a["expected"] - cfg["digits"] * len(subset) / (cfg["hi"] - cfg["lo"] + 1)) < 1e-9)
        check(label + " hot", [(x["n"], x["count"]) for x in a["hot"]] == ref["hot"])
        check(label + " cold", [(x["n"], x["count"]) for x in a["cold"]] == ref["cold"])
        check(label + " overdue", [(x["n"], x["gap"]) for x in a["overdue"]] == ref["overdue"])
        check(label + " sums", a["sums"] == ref["sums"])
        check(label + " avg sum",
              abs(a["avgSum"] - sum(ref["sums"]) / len(subset)) < 1e-9)

empty_d = js("PCSOCore.analyzeDigits([], '3d', 50)")
check("empty digit analysis is safe", empty_d["size"] == 0 and sum(empty_d["freq"]) == 0
      and empty_d["hot"] == [] and empty_d["overdue"] == [] and empty_d["digits"] == 3)

# --------------------------------------------- daily digit games: generator
def digit_violates(games, opts, cfg):
    excluded = set(opts.get("excluded", []))
    fixed = opts.get("fixed") or []
    shape = opts.get("shape", "any")
    seen = set()
    for g in games:
        if len(g) != cfg["digits"]:
            return "length " + str(g)
        if any(int(n) < cfg["lo"] or int(n) > cfg["hi"] for n in g):
            return "range " + str(g)
        if excluded & {int(n) for n in g}:
            return "excluded present " + str(g)
        if fixed and any(x is not None and digit_pad(cfg, x) != g[i] for i, x in enumerate(fixed)):
            return "fixed missing " + str(g)
        if shape != "any" and ref_digit_shape([int(n) for n in g]) != shape:
            return "shape " + str(g)
        key = tuple(g)
        if key in seen:
            return "duplicate " + str(g)
        seen.add(key)
    return None


def digit_pad(cfg, v):
    return ("%02d" % int(v)) if cfg["pad"] else str(int(v))


DIGIT_CONFIGS = [
    {"shape": "any"},
    {"shape": "allDiff"},
    {"shape": "onePair"},
    {"shape": "allSame"},
    {"excluded": [0, 1, 2]},
    {"excluded": list(range(28, 32))},
    {"shape": "allDiff", "excluded": [7, 9]},
]
for gid, cfg in DIGITS.items():
    for ci, base in enumerate(DIGIT_CONFIGS):
        if base.get("shape") == "onePair" and cfg["digits"] < 3:
            continue
        opts = dict(base)
        opts["excluded"] = [v for v in opts.get("excluded", [])
                            if cfg["lo"] <= v <= cfg["hi"]]
        if len(opts["excluded"]) > (cfg["hi"] - cfg["lo"]):
            opts["excluded"] = opts["excluded"][:cfg["hi"] - cfg["lo"]]
        opts["game"] = gid
        opts["count"] = 5
        for run in range(8):
            res = js("PCSOCore.generateDigits(%s)" % json.dumps(opts))
            if res["error"]:
                check("generateDigits %s cfg%d run%d" % (gid, ci, run), False, res["error"])
                continue
            check("generateDigits %s cfg%d run%d count" % (gid, ci, run),
                  len(res["games"]) == 5, len(res["games"]))
            problem = digit_violates(res["games"], opts, cfg)
            check("generateDigits %s cfg%d run%d constraints" % (gid, ci, run), problem is None, problem)

for gid, cfg in DIGITS.items():
    lo, hi = cfg["lo"], cfg["hi"]
    cases = [
        ("every number excluded", {"game": gid, "excluded": list(range(lo, hi + 1)), "count": 5}),
        ("excluded outside the pool", {"game": gid, "excluded": [hi + 1], "count": 5}),
        ("fixed outside the pool", {"game": gid, "fixed": [hi + 5], "count": 5}),
        ("fixed and excluded", {"game": gid, "fixed": [lo, None, None][:cfg["digits"]],
                                "excluded": [lo], "count": 5}),
    ]
    if cfg["digits"] == 3:
        cases.append(("fixed digits break the shape",
                      {"game": gid, "fixed": [1, 1, 1], "shape": "allDiff", "count": 5}))
        cases.append(("fixed pair fit the shape",
                      {"game": gid, "fixed": [1, 1, 2], "shape": "onePair", "count": 5}))
    for name, opts in cases:
        res = js("PCSOCore.generateDigits(%s)" % json.dumps(opts))
        if name == "fixed pair fit the shape":
            check("generateDigits: " + name,
                  not res["error"] and len(res["games"]) >= 1
                  and all(g == ["1", "1", "2"] for g in res["games"]), res)
        else:
            check("generateDigits rejects: " + name, bool(res["error"]) and res["games"] == [], res)

out = js("PCSOCore.generateDigits({game:'3d', fixed:[5,5,5], shape:'allSame', count:5})")
check("generateDigits honours a fully fixed combination",
      not out["error"] and all(g == ["5", "5", "5"] for g in out["games"]), out)

# --------------------------------------- daily digit games: history check
for gid, cfg in DIGITS.items():
    rows = draws[gid]
    newest = rows[-1]
    h = js("PCSOCore.checkDigitHistory(%s, DATA.draws['%s'], '%s')"
           % (json.dumps(newest["n"]), gid, gid))
    check("%s: the latest draw matches itself" % gid, h["straightCount"] >= 1, h["straightCount"])
    check("%s: the straight hit is that date" % gid,
          h["straight"][0]["d"] == newest["d"] and h["straight"][0]["t"] == newest["t"],
          h["straight"][:1])
    combo = [int(n) for n in newest["n"]]
    exp_straight = sum(1 for r in rows if [int(n) for n in r["n"]] == combo)
    same = sum(1 for r in rows if sorted(int(n) for n in r["n"]) == sorted(combo))
    exp_ramb = 0 if ref_digit_shape(combo) == "allSame" else same - exp_straight
    check("%s: straight recount" % gid, h["straightCount"] == exp_straight,
          (h["straightCount"], exp_straight))
    check("%s: rambolito recount" % gid, h["rambolitoCount"] == exp_ramb,
          (h["rambolitoCount"], exp_ramb))
    check("%s: total matches" % gid, h["total"] == h["straightCount"] + h["rambolitoCount"])
    check("%s: prize shown for the combo" % gid,
          h["standardPrize"] == cfg["prize"] and h["rambolitoPrize"] in
          (None, 750, 1500, 2000))

same3 = js("PCSOCore.checkDigitHistory(['5','5','5'], DATA.draws['3d'], '3d')")
check("3D all-same digits have no Rambolito prize",
      same3["rambolitoPrize"] is None and same3["rambolitoCount"] == 0, same3["rambolitoCount"])
exp555 = sum(1 for r in draws["3d"] if r["n"] == ["5", "5", "5"])
check("3D 555 straight hits are counted", same3["straightCount"] == exp555, same3["straightCount"])

pair2 = js("PCSOCore.checkDigitHistory(['07','07'], DATA.draws['2d'], '2d')")
check("2D a pair of equal numbers has no Rambolito",
      pair2["rambolitoCount"] == 0 and pair2["rambolitoPrize"] is None)

none_h = js("PCSOCore.checkDigitHistory([], DATA.draws['3d'], '3d')")
check("digit history of an empty ticket is safe", none_h["total"] == 0)

# ------------------------------------------------- daily digit games: dates
for gid in DIGITS:
    rows = draws[gid]
    hit = js("PCSOCore.findDailyDate(DATA.draws['%s'], '2025-03-14')" % gid)
    exp = [r for r in rows if r["d"] == "2025-03-14"]
    check("%s findDailyDate exact" % gid,
          hit["exact"] is True and [r["t"] for r in hit["rows"]] == [r["t"] for r in exp],
          hit.get("date"))
    check("%s findDailyDate returns three draws" % gid, len(hit["rows"]) == 3, len(hit["rows"]))
    early = js("PCSOCore.findDailyDate(DATA.draws['%s'], '2001-01-01')" % gid)
    check("%s findDailyDate before coverage" % gid,
          early["direction"] == "after" and early["date"] == rows[0]["d"], early.get("date"))
    late = js("PCSOCore.findDailyDate(DATA.draws['%s'], '2030-01-01')" % gid)
    check("%s findDailyDate after coverage returns the newest date" % gid,
          late["date"] == rows[-1]["d"] and late["exact"] is False, late.get("date"))

check("next daily draw at 13:59 is the 2PM slot",
      js("PCSOCore.nextDailyDraw('3d','en',{iso:'2026-11-16',hhmm:'13:59'})")["time"] == "14:00")
check("next daily draw at 18:00 is the 9PM slot",
      js("PCSOCore.nextDailyDraw('3d','en',{iso:'2026-11-16',hhmm:'18:00'})")["time"] == "21:00")
check("next daily draw after 9PM is tomorrow 2PM",
      js("PCSOCore.nextDailyDraw('3d','en',{iso:'2026-11-16',hhmm:'23:30'})")["iso"] == "2026-11-17")
check("next daily draw label names the slot",
      js("PCSOCore.nextDailyDraw('2d','tl',{iso:'2026-11-16',hhmm:'09:00'})")["label"].startswith("2:00 PM"))

# ------------------------------------------------------------ language layer
import re as _re

I18N = os.path.join(ROOT, "assets", "js", "i18n.js")
APP = os.path.join(ROOT, "assets", "js", "app.js")
DAILY = os.path.join(ROOT, "assets", "js", "daily.js")
PAGES = ["index.html", "guide.html", "privacy.html", "terms.html"]
i18n_src = open(I18N, encoding="utf-8").read()
app_src = open(APP, encoding="utf-8").read()
daily_src = open(DAILY, encoding="utf-8").read()

check("the daily-game UI is its own module", os.path.exists(DAILY))
index_src = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
check("index.html loads the daily-game module", 'assets/js/daily.js' in index_src)
check("the daily module loads after the language layer",
      index_src.index("assets/js/i18n.js") < index_src.index("assets/js/daily.js"))
for panel in ("panel-daily-results", "panel-daily-stats", "panel-daily-generator"):
    check("the page carries " + panel, 'id="%s"' % panel in index_src)
check("both digit games are in the overview", 'id="dailyOverviewBody"' in index_src)

check("Tagalog is the default language", '"tl"' in i18n_src
      and 'var DEFAULT_LANG = "tl"' in i18n_src)
check("English opens with ?lang=en",
      'URLSearchParams' in i18n_src and '.get("lang")' in i18n_src
      and "LANGS.indexOf(queryLang)" in i18n_src)
check("the choice is stored for the next visit", "localStorage.setItem(STORE_KEY" in i18n_src)

static_keys = set(_re.findall(r'^\s*"([A-Za-z0-9_.]+)":', i18n_src, _re.M))
used = {}
for page in PAGES:
    src = open(os.path.join(ROOT, page), encoding="utf-8").read()
    check("%s is served in Tagalog" % page, '<html lang="tl">' in src, src[:60])
    check("%s loads the language layer" % page, 'assets/js/i18n.js' in src)
    check("%s has the switcher" % page,
          'data-lang="tl"' in src and 'data-lang="en"' in src
          and 'class="lang-switch"' in src)
    for k in _re.findall(r'data-i18n(?:-html)?="([^"]+)"', src):
        used.setdefault(k, page)
    # no element may reference a key that does not exist in English
missing_keys = sorted(k for k in used if k not in static_keys)
check("every tagged string has an English version", not missing_keys, missing_keys[:8])
check("the four pages are fully tagged",
      all(len(_re.findall(r'data-i18n', open(os.path.join(ROOT, p), encoding="utf-8").read())) > 10
          for p in PAGES))

# run-time strings: both languages, same placeholders
dyn = {k: (tl, en) for k, tl, en in
       _re.findall(r'"(d\.[A-Za-z0-9_]+)":\s*\{\s*tl:\s*"(.*?)",\s*en:\s*"(.*?)"\s*\}', i18n_src)}
check("run-time strings carry both languages", len(dyn) >= 40, len(dyn))
app_keys = set(_re.findall(r't\("(d\.[A-Za-z0-9_]+)"', app_src))
app_keys |= set(_re.findall(r't\("(d\.[A-Za-z0-9_]+)"', daily_src))
check("every run-time key the UI asks for exists", app_keys <= set(dyn), sorted(app_keys - set(dyn)))
check("the daily section asks for its own run-time strings",
      len(set(_re.findall(r't\("(d\.daily[A-Za-z0-9_]*)"', daily_src))) >= 20,
      len(set(_re.findall(r't\("(d\.daily[A-Za-z0-9_]*)"', daily_src))))
for key, (tl, en) in dyn.items():
    ph = lambda x: sorted(_re.findall(r"\{(\w+)\}", x))
    check("placeholders match for " + key, ph(tl) == ph(en), (tl, en))
    check("no empty translation for " + key, bool(tl.strip()) and bool(en.strip()), key)

check("dates and weekdays follow the page language",
      "lang === \"tl\" ? DOW_TL" in open(CORE, encoding="utf-8").read())
check("claim brackets follow the page language",
      "TIER_TEXT" in open(CORE, encoding="utf-8").read())

# --------------------------------------------------------------------- report
print("passed %d / failed %d" % (passed, len(failed)))
if failed:
    print("\nfailures:")
    for f in failed[:40]:
        print(" -", f)
    sys.exit(1)
print("all unit tests passed")
