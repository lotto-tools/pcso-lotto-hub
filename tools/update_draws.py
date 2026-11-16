#!/usr/bin/env python3
"""
Refresh the local PCSO draw database.

Source of record: Philippine Charity Sweepstakes Office (PCSO) official draw
results, pcso.gov.ph (Search Lotto Result by Date). The public mirror used here
re-publishes the PCSO result table as JSON:

    https://github.com/kimken147/pcso-results-data
    (dataset "Lotto Tayo" / lottotayo.ph, CC BY 4.0)

The mirror is only a transport: every row is a PCSO draw (game, draw date,
winning numbers, jackpot, jackpot winners). Nothing on this site is generated,
simulated or estimated.

Usage:
    python3 tools/update_draws.py              # fetch, validate, rebuild data files
    python3 tools/update_draws.py --offline    # rebuild from tools/raw/*.json cache
    python3 tools/update_draws.py --allow-rewind
                                               # accept a mirror that is behind the
                                               # stored data (never used by the
                                               # scheduled GitHub Action)

Run by .github/workflows/update.yml once a day after the evening draw. When the
mirror has nothing new the script leaves the data files untouched, so the
workflow commits nothing.

Outputs:
    data/pcso_draws.json   full database (JSON)
    data/pcso_draws.js     same database as window.PCSO_DATA (lets index.html run
                           straight from the file system, no server needed)

Data shape
    {
      "meta": { source, mirror, collectedAt, games: { "658": {...}, ... } },
      "draws": { "658": [ {"d":"2026-11-15","n":[14,15,18,26,33,46],"j":537913610.81,"w":0}, ... ] }
    }
    "d" draw date (YYYY-MM-DD) | "n" six winning numbers, ascending
    "j" jackpot in PHP          | "w" number of jackpot winners
"""
import json
import os
import sys
import urllib.request
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RAW = os.path.join(HERE, "raw")

MIRROR = "https://raw.githubusercontent.com/kimken147/pcso-results-data/main/data/results/{}.json"
SOURCE = "PCSO Official Draw Results (pcso.gov.ph)"
ATTRIB = "Lotto Tayo dataset (lottotayo.ph), CC BY 4.0"

GAMES = {
    "658": {"name": "Ultra Lotto 6/58", "max": 58, "days": ["Tue", "Fri", "Sun"],
            "startJackpot": 49500000.0},
    "655": {"name": "Grand Lotto 6/55", "max": 55, "days": ["Mon", "Wed", "Sat"],
            "startJackpot": 15800000.0},
    "649": {"name": "Super Lotto 6/49", "max": 49, "days": ["Tue", "Thu", "Sun"],
            "startJackpot": 15800000.0},
    "645": {"name": "Mega Lotto 6/45", "max": 45, "days": ["Mon", "Wed", "Fri"],
            "startJackpot": 8900000.0},
    "642": {"name": "Lotto 6/42", "max": 42, "days": ["Tue", "Thu", "Sat"],
            "startJackpot": 5900000.0},
}
FILES = {"658": "6-58", "655": "6-55", "649": "6-49", "645": "6-45", "642": "6-42"}
WEEKDAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def fetch(key, offline):
    os.makedirs(RAW, exist_ok=True)
    path = os.path.join(RAW, FILES[key] + ".json")
    if offline:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    req = urllib.request.Request(
        MIRROR.format(FILES[key]),
        headers={"User-Agent": "pcsolottohub-data-refresh/1.0 (+contact@pcsolottohub.example)"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = resp.read().decode("utf-8")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(body)
    return json.loads(body)


def normalise(key, payload):
    mx = GAMES[key]["max"]
    out = {}
    duplicates = []
    for row in payload["draws"]:
        d = row["date"]
        if len(d) != 10:
            continue
        nums = sorted(int(n) for n in row["numbers"])
        if len(nums) != 6 or len(set(nums)) != 6 or nums[0] < 1 or nums[-1] > mx:
            raise SystemExit("Bad numbers %s %s: %s" % (key, d, row["numbers"]))
        if d in out:
            duplicates.append(d)
            continue
        j = row.get("jackpot")
        out[d] = {
            "d": d,
            "n": nums,
            "j": round(float(j), 2) if j not in (None, "") else 0.0,
            "w": int(row.get("winners") or 0),
        }
    draws = [out[d] for d in sorted(out)]
    weekdays = sorted({WEEKDAY[date.fromisoformat(x["d"]).weekday()] for x in draws})
    off_schedule = [x["d"] for x in draws
                    if WEEKDAY[date.fromisoformat(x["d"]).weekday()] not in GAMES[key]["days"]]
    return draws, weekdays, off_schedule, duplicates


def main():
    offline = "--offline" in sys.argv
    draws_all, meta_games, warnings = {}, {}, []

    for key in GAMES:
        draws, weekdays, off_schedule, dups = normalise(key, fetch(key, offline))
        if not draws:
            raise SystemExit("No draws for " + key)
        if off_schedule:
            warnings.append("%s: %d draws on an unexpected weekday (first %s)"
                            % (key, len(off_schedule), off_schedule[:3]))
        if dups:
            warnings.append("%s: %d duplicate dates skipped" % (key, len(dups)))
        draws_all[key] = draws
        g = GAMES[key]
        meta_games[key] = {
            "name": g["name"],
            "max": g["max"],
            "days": g["days"],
            "drawTime": "9:00 PM PHT",
            "startJackpot": g["startJackpot"],
            "count": len(draws),
            "from": draws[0]["d"],
            "to": draws[-1]["d"],
            "latest": draws[-1],
            "weekdays": weekdays,
            "jackpotWonLast": sum(1 for x in draws if x["w"] > 0),
        }
        print("%s  %-18s %4d draws  %s -> %s  latest %s  jackpot %s  winners %d"
              % (key, g["name"], len(draws), draws[0]["d"], draws[-1]["d"],
                 "-".join("%02d" % n for n in draws[-1]["n"]),
                 "{:,.2f}".format(draws[-1]["j"]), draws[-1]["w"]))
        if draws[-1]["j"] % 1 == 0 and draws[-1]["j"] < 10_000_000:
            warnings.append("%s: latest jackpot looks like a reset value" % key)

    payload = {
        "meta": {
            "source": SOURCE,
            "sourceUrl": "https://www.pcso.gov.ph/SearchLottoResult.aspx",
            "mirror": "https://github.com/kimken147/pcso-results-data",
            "attribution": ATTRIB,
            "collectedAt": date.today().isoformat(),
            "games": meta_games,
        },
        "draws": draws_all,
    }

    out_json = os.path.join(ROOT, "data", "pcso_draws.json")
    previous = None
    if os.path.exists(out_json):
        try:
            with open(out_json, encoding="utf-8") as fh:
                previous = json.load(fh)
        except (ValueError, OSError) as exc:
            print("warning: could not read the existing database (%s)" % exc)

    if previous and previous.get("draws"):
        old_latest = max(d["d"] for rows in previous["draws"].values() for d in rows)
        new_latest = max(d["d"] for rows in draws_all.values() for d in rows)
        old_count = sum(len(rows) for rows in previous["draws"].values())
        new_count = sum(len(rows) for rows in draws_all.values())
        if (new_latest < old_latest or new_count < old_count) and "--allow-rewind" not in sys.argv:
            # Never let an outage or a stale mirror roll the published data back.
            raise SystemExit(
                "Refusing to write: the mirror is behind the stored data "
                "(%d draws to %s, stored %d draws to %s). "
                "Re-run with --allow-rewind only if that is really intended."
                % (new_count, new_latest, old_count, old_latest))
        if previous.get("draws") == draws_all:
            print("\nNo new draws: the stored database already matches the PCSO mirror.")
            print("Nothing written.")
            return 0
        if previous.get("meta", {}).get("collectedAt"):
            payload["meta"]["collectedAt"] = date.today().isoformat()

    os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
    js = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(ROOT, "data", "pcso_draws.json"), "w", encoding="utf-8") as fh:
        fh.write(js)
    with open(os.path.join(ROOT, "data", "pcso_draws.js"), "w", encoding="utf-8") as fh:
        fh.write("/* PCSO draw database - generated by tools/update_draws.py "
                 "- source: %s */\n" % SOURCE)
        fh.write("window.PCSO_DATA=" + js + ";\n")

    print("\nWrote data/pcso_draws.json and data/pcso_draws.js (%d games, %d draws)"
          % (len(draws_all), sum(len(v) for v in draws_all.values())))
    for w in warnings:
        print("  warning:", w)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
