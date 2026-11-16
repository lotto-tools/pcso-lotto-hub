/* =============================================================
   PCSO Lotto Hub — core logic (no DOM, unit-testable)
   Everything here works on the real PCSO draw records in
   data/pcso_draws.js. No draw data is ever invented.
   ============================================================= */
(function (root) {
  "use strict";

  /* ---------- game catalogue ---------- */
  var GAMES = [
    { id: "658", name: "Ultra Lotto 6/58", short: "6/58", max: 58,
      days: ["Tue", "Fri", "Sun"], dayLabel: "Tuesday · Friday · Sunday", floor: 49500000 },
    { id: "655", name: "Grand Lotto 6/55", short: "6/55", max: 55,
      days: ["Mon", "Wed", "Sat"], dayLabel: "Monday · Wednesday · Saturday", floor: 15800000 },
    { id: "649", name: "Super Lotto 6/49", short: "6/49", max: 49,
      days: ["Tue", "Thu", "Sun"], dayLabel: "Tuesday · Thursday · Sunday", floor: 15800000 },
    { id: "645", name: "Mega Lotto 6/45", short: "6/45", max: 45,
      days: ["Mon", "Wed", "Fri"], dayLabel: "Monday · Wednesday · Friday", floor: 8900000 },
    { id: "642", name: "Lotto 6/42", short: "6/42", max: 42,
      days: ["Tue", "Thu", "Sat"], dayLabel: "Tuesday · Thursday · Saturday", floor: 5900000 }
  ];

  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  /* Tagalog (Filipino) names, used when the page is shown in Tagalog */
  var DOW_TL = ["Lin", "Lun", "Mar", "Miy", "Huw", "Biy", "Sab"];
  var DOW_LONG_TL = ["Linggo", "Lunes", "Martes", "Miyerkules", "Huwebes", "Biyernes", "Sabado"];
  var MONTHS_TL = ["Ene", "Peb", "Mar", "Abr", "May", "Hun", "Hul", "Ago", "Set", "Okt", "Nob", "Dis"];
  var DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var PRIZE_FLOOR = 20;       // smallest claimable amount on a PCSO ticket
  var TAX_THRESHOLD = 10000;  // TRAIN Law: at or below this is tax-free
  var TAX_RATE = 0.20;        // 20% final withholding tax above the threshold
  var BRANCH_CEILING = 300000;

  function getGame(id) {
    for (var i = 0; i < GAMES.length; i++) if (GAMES[i].id === id) return GAMES[i];
    return GAMES[0];
  }

  /* ---------- basic maths ---------- */
  function combinations(n, k) {
    if (k < 0 || k > n) return 0;
    var r = 1, i;
    for (i = 1; i <= k; i++) r = r * (n - k + i) / i;
    return Math.round(r);
  }

  function odds(max) { return combinations(max, 6); }

  function round2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }

  /* ---------- TRAIN Law prize tax (RA 10963, Sec. 24(B)(1)) ----------
     Prizes of PHP 10,000 or less are exempt.
     Prizes above PHP 10,000 carry a 20% final withholding tax on the
     GROSS amount (not merely the excess).                          */
  function calcTax(gross) {
    var g = Number(gross);
    if (!isFinite(g) || g < 0) g = 0;
    g = round2(g);
    var taxable = g > TAX_THRESHOLD;
    var tax = taxable ? round2(g * TAX_RATE) : 0;
    var net = round2(g - tax);
    return {
      gross: g,
      taxable: taxable,
      threshold: TAX_THRESHOLD,
      rate: taxable ? TAX_RATE : 0,
      tax: tax,
      net: net,
      effectiveRate: g > 0 ? tax / g : 0
    };
  }

  /* ---------- where a prize is claimed ---------- */
  var TIER_TEXT = {
    none: {
      en: { label: "Not a claimable amount",
            where: "A PCSO ticket pays from ₱20 up. There is nothing to claim below ₱20.",
            docs: [] },
      tl: { label: "Hindi makukuhang halaga",
            where: "Ang ticket ng PCSO ay nagbabayad mula ₱20 pataas. Walang makukuha kapag mas mababa sa ₱20.",
            docs: [] }
    },
    outlet: {
      en: { label: "₱20 – ₱10,000",
            where: "Any authorized PCSO lotto outlet, or a PCSO branch office.",
            pay: "Cash at the outlet, subject to the outlet's cash on hand.",
            docs: ["Original winning ticket, signed at the back",
                   "One valid ID is normally enough at an outlet"] },
      tl: { label: "₱20 – ₱10,000",
            where: "Kahit anong awtorisadong lotto outlet ng PCSO, o sangay ng PCSO.",
            pay: "Cash sa outlet, depende sa cash on hand ng outlet.",
            docs: ["Orihinal na nanalong ticket, may pirma sa likod",
                   "Karaniwang isang valid ID lang ang kailangan sa outlet"] }
    },
    branch: {
      en: { label: "₱10,001 – ₱300,000",
            where: "A PCSO branch office near you, or the PCSO Main Office.",
            pay: "Cash for prizes up to ₱60,000 gross; a check above that.",
            docs: ["Original winning ticket, signed at the back",
                   "Two valid government-issued IDs",
                   "Winner's Profile Form (filled out on site)"] },
      tl: { label: "₱10,001 – ₱300,000",
            where: "Sangay ng PCSO na malapit sa iyo, o ang PCSO Main Office.",
            pay: "Cash hanggang ₱60,000 gross; tseke kapag lampas doon.",
            docs: ["Orihinal na nanalong ticket, may pirma sa likod",
                   "Dalawang valid na government ID",
                   "Winner's Profile Form (pinupunan sa lugar)"] }
    },
    main: {
      en: { label: "Over ₱300,000 (includes the jackpot)",
            where: "PCSO Main Office only — Sun Plaza, Shaw Blvd. cor. Princeton St., Mandaluyong City.",
            pay: "By check in the winner's name (validated in person).",
            docs: ["Original winning ticket with an intact, readable barcode",
                   "Two valid government-issued IDs",
                   "Winner's Profile Form (filled out on site)",
                   "Nothing pays out if the ticket is torn, wet, defaced or altered"] },
      tl: { label: "Higit sa ₱300,000 (kasama ang jackpot)",
            where: "Sa PCSO Main Office lang — Sun Plaza, Shaw Blvd. cor. Princeton St., Mandaluyong City.",
            pay: "Tseke sa pangalan ng nanalo (pinatutunayan nang personal).",
            docs: ["Orihinal na nanalong ticket na buo at nababasa ang barcode",
                   "Dalawang valid na government ID",
                   "Winner's Profile Form (pinupunan sa lugar)",
                   "Walang ibabayad kung ang ticket ay punit, basa, may gasgas o binago"] }
    }
  };

  function claimTier(amount, lang) {
    var a = Number(amount);
    var pick = lang === "tl" ? "tl" : "en";
    var key;
    if (!isFinite(a) || a < PRIZE_FLOOR) key = "none";
    else if (a <= TAX_THRESHOLD) key = "outlet";
    else if (a <= BRANCH_CEILING) key = "branch";
    else key = "main";
    var t = TIER_TEXT[key][pick];
    return { key: key, label: t.label, where: t.where, pay: t.pay, docs: t.docs.slice() };
  }

  /* ---------- date helpers (UTC-safe) ---------- */
  function parseISO(iso) {
    var p = String(iso).split("-");
    return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  }
  function isoOf(d) {
    var m = d.getUTCMonth() + 1, day = d.getUTCDate();
    return d.getUTCFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }
  function weekday(iso, lang) { return (lang === "tl" ? DOW_TL : DOW)[parseISO(iso).getUTCDay()]; }
  function formatDate(iso, lang) {
    var d = parseISO(iso), months = lang === "tl" ? MONTHS_TL : MONTHS;
    return months[d.getUTCMonth()] + " " + d.getUTCDate() + ", " + d.getUTCFullYear();
  }
  function formatDateShort(iso, lang) {
    var d = parseISO(iso), months = lang === "tl" ? MONTHS_TL : MONTHS;
    return months[d.getUTCMonth()] + " " + d.getUTCDate();
  }
  /* "Tuesday · Friday · Sunday" in the page language, from the game's draw days */
  function dayLabel(game, lang) {
    if (!game || !game.days) return "";
    var names = lang === "tl" ? DOW_LONG_TL : DOW_LONG;
    return game.days.map(function (d) { return names[DOW.indexOf(d)]; }).join(" · ");
  }
  function todayManila() {
    try {
      var parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit"
      }).format(new Date());
      return parts; // en-CA gives YYYY-MM-DD
    } catch (e) {
      return isoOf(new Date());
    }
  }
  /* Next draw for a game: next scheduled weekday whose 9:00 PM PHT draw
     has not started yet. */
  function nextDraw(game, nowISO, lang) {
    var today = nowISO || todayManila();
    var base = parseISO(today);
    var stamp = new Date();
    var afterNine = stamp.getUTCHours() >= 13; // 21:00 PHT == 13:00 UTC
    var shortNames = lang === "tl" ? DOW_TL : DOW;
    for (var i = 0; i < 8; i++) {
      var d = new Date(base.getTime() + i * 86400000);
      var name = DOW[d.getUTCDay()];
      if (game.days.indexOf(name) === -1) continue;
      if (i === 0 && afterNine) continue;
      return { iso: isoOf(d),
               label: shortNames[d.getUTCDay()] + ", " + formatDate(isoOf(d), lang) + " · 9:00 PM PHT" };
    }
    return { iso: today, label: lang === "tl" ? "Tingnan ang iskedyul ng PCSO" : "Check the PCSO schedule" };
  }

  /* ---------- number / money formatting ---------- */
  function formatNumber(n) {
    var s = String(Math.round(Number(n) || 0)), out = "";
    var neg = s.charAt(0) === "-";
    if (neg) s = s.slice(1);
    for (var i = 0; i < s.length; i++) {
      if (i && (s.length - i) % 3 === 0) out += ",";
      out += s.charAt(i);
    }
    return (neg ? "-" : "") + out;
  }
  function formatPeso(n, withCentavos) {
    var v = Number(n) || 0;
    var fixed = (withCentavos === false ? Math.round(v) : round2(v)).toFixed(withCentavos === false ? 0 : 2);
    var parts = fixed.split(".");
    return "₱" + formatNumber(parts[0]) + (parts.length > 1 ? "." + parts[1] : "");
  }
  function shortPeso(n) {
    var v = Math.abs(Number(n) || 0);
    if (v >= 1e9) return "₱" + (v / 1e9).toFixed(2) + "B";
    if (v >= 1e6) return "₱" + (v / 1e6).toFixed(1) + "M";
    if (v >= 1e3) return "₱" + (v / 1e3).toFixed(0) + "K";
    return "₱" + formatNumber(v);
  }
  function ballBand(n, max) {
    var step = Math.ceil(max / 5);
    var b = Math.floor((n - 1) / step) + 1;
    return Math.max(1, Math.min(5, b));
  }
  function sumFormula(max) {
    var lo = 1 + 2 + 3 + 4 + 5 + 6;
    var hi = (max - 5) + (max - 4) + (max - 3) + (max - 2) + (max - 1) + max;
    return { min: lo, max: hi, avg: (lo + hi) / 2 };
  }

  /* ---------- statistics ---------- */
  function emptyAnalysis(max) {
    var freq = [], gap = [], n;
    for (n = 0; n <= max; n++) { freq.push(0); gap.push(0); }
    return {
      size: 0, max: max, freq: freq, gap: gap, hot: [], cold: [], overdue: [],
      oddDist: [0, 0, 0, 0, 0, 0, 0], lowDist: [0, 0, 0, 0, 0, 0, 0],
      sums: [], sumBuckets: [], avgSum: 0, minSum: 0, maxSum: 0,
      pairs: [], expected: 0, lowMax: Math.floor(max / 2), from: null, to: null
    };
  }

  function analyze(draws, max, range) {
    max = max || 58;
    if (!draws || !draws.length) return emptyAnalysis(max);
    var size = range && range > 0 ? Math.min(range, draws.length) : draws.length;
    var subset = draws.slice(draws.length - size);
    var res = emptyAnalysis(max);
    res.size = size;
    res.max = max;
    res.from = subset[0].d;
    res.to = subset[subset.length - 1].d;
    res.lowMax = Math.floor(max / 2);
    res.expected = (6 * size) / max;

    var lastSeen = [], n;
    for (n = 0; n <= max; n++) lastSeen.push(-1);

    var sumBuckets = {};
    var pairCount = {};
    var i, j, k, nums, key;
    for (i = 0; i < size; i++) {
      nums = subset[i].n;
      var sum = 0, odd = 0, low = 0;
      for (k = 0; k < nums.length; k++) {
        var v = nums[k];
        res.freq[v] += 1;
        lastSeen[v] = i;
        sum += v;
        if (v % 2 === 1) odd++;
        if (v <= res.lowMax) low++;
      }
      res.sums.push(sum);
      res.oddDist[odd] += 1;
      res.lowDist[low] += 1;
      for (j = 0; j < nums.length; j++) {
        for (k = j + 1; k < nums.length; k++) {
          key = nums[j] + "-" + nums[k];
          pairCount[key] = (pairCount[key] || 0) + 1;
        }
      }
    }

    for (n = 1; n <= max; n++) {
      res.gap[n] = lastSeen[n] === -1 ? size : size - 1 - lastSeen[n];
    }

    var all = [];
    for (n = 1; n <= max; n++) all.push({ n: n, count: res.freq[n], gap: res.gap[n] });
    var byHot = all.slice().sort(function (a, b) { return b.count - a.count || a.n - b.n; });
    var byCold = all.slice().sort(function (a, b) { return a.count - b.count || a.n - b.n; });
    var byGap = all.slice().sort(function (a, b) { return b.gap - a.gap || a.n - b.n; });
    res.hot = byHot.slice(0, 6);
    res.cold = byCold.slice(0, 6);
    res.overdue = byGap.slice(0, 10);

    /* sum distribution: ten equal buckets across the possible range */
    var f = sumFormula(max);
    var width = Math.max(5, Math.round((f.max - f.min) / 10 / 5) * 5);
    for (var lo = f.min; lo <= f.max; lo += width) {
      sumBuckets[lo] = { lo: lo, hi: Math.min(lo + width - 1, f.max), count: 0 };
    }
    var bucketKeys = Object.keys(sumBuckets).map(Number).sort(function (a, b) { return a - b; });
    for (i = 0; i < res.sums.length; i++) {
      var s = res.sums[i];
      for (j = bucketKeys.length - 1; j >= 0; j--) {
        if (s >= bucketKeys[j]) { sumBuckets[bucketKeys[j]].count++; break; }
      }
    }
    res.sumBuckets = bucketKeys.map(function (kk) { return sumBuckets[kk]; });
    res.avgSum = size ? res.sums.reduce(function (a, b) { return a + b; }, 0) / size : 0;
    res.minSum = size ? Math.min.apply(null, res.sums) : 0;
    res.maxSum = size ? Math.max.apply(null, res.sums) : 0;

    var pairList = Object.keys(pairCount).map(function (p) {
      var parts = p.split("-");
      return { pair: [Number(parts[0]), Number(parts[1])], count: pairCount[p] };
    });
    pairList.sort(function (a, b) { return b.count - a.count || a.pair[0] - b.pair[0]; });
    res.pairs = pairList.slice(0, 10);
    return res;
  }

  /* ---------- combination generator ----------
     Errors carry an i18n key (errorKey/errorVars) next to the English
     message, so the page can render them in the language it is showing. */
  function genError(msg, key, vars) {
    return { error: msg, errorKey: key, errorVars: vars || null, games: [] };
  }

  function validateFilters(opts) {
    var max = opts.max || 58;
    var fixed = (opts.fixed || []).map(Number);
    var excluded = (opts.excluded || []).map(Number);
    var i;
    for (i = 0; i < fixed.length; i++) {
      if (!(fixed[i] >= 1 && fixed[i] <= max))
        return genError("Fixed number " + fixed[i] + " is outside 1–" + max + ".",
                        "d.errFixedOut", { n: fixed[i], max: max });
    }
    for (i = 0; i < excluded.length; i++) {
      if (!(excluded[i] >= 1 && excluded[i] <= max))
        return genError("Excluded number " + excluded[i] + " is outside 1–" + max + ".",
                        "d.errExcludedOut", { n: excluded[i], max: max });
    }
    if (fixed.length > 5)
      return genError("Include at most 5 fixed numbers — a ticket needs one free pick.",
                      "d.errMaxFixedCore");
    for (i = 0; i < fixed.length; i++) if (excluded.indexOf(fixed[i]) !== -1) {
      return genError("Number " + fixed[i] + " is both included and excluded.",
                      "d.errBoth", { n: fixed[i] });
    }
    return null;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function meetsOddEven(nums, ratio) {
    if (!ratio || ratio === "any") return true;
    var p = ratio.split(":");
    var wantOdd = Number(p[0]);
    var odd = 0;
    for (var i = 0; i < nums.length; i++) if (nums[i] % 2 === 1) odd++;
    return odd === wantOdd;
  }

  function hasConsecutive(nums) {
    var s = nums.slice().sort(function (a, b) { return a - b; });
    for (var i = 1; i < s.length; i++) if (s[i] - s[i - 1] === 1) return true;
    return false;
  }

  function generate(opts) {
    opts = opts || {};
    var max = opts.max || 58;
    var count = opts.count || 5;
    var err = validateFilters(opts);
    if (err) return err;

    var fixed = (opts.fixed || []).map(Number);
    var excluded = (opts.excluded || []).map(Number);
    var ratio = opts.oddEven || "any";
    var noConsec = !!opts.noConsecutive;

    if (ratio !== "any") {
      var wantOdd = Number(ratio.split(":")[0]);
      var oddFixed = fixed.filter(function (x) { return x % 2 === 1; }).length;
      var evenFixed = fixed.length - oddFixed;
      if (oddFixed > wantOdd || evenFixed > 6 - wantOdd) {
        return genError("Your fixed numbers already break the " + ratio.replace(":", ":") +
                        " odd/even split. Change the fixed numbers or the ratio.",
                        "d.errRatioFixed", { ratio: ratio });
      }
    }

    var pool = [];
    for (var n = 1; n <= max; n++) {
      if (excluded.indexOf(n) === -1 && fixed.indexOf(n) === -1) pool.push(n);
    }
    if (pool.length < 6 - fixed.length) {
      return genError("Only " + pool.length + " numbers are left after your filters — a ticket needs " +
                      (6 - fixed.length) + " more.",
                      "d.errPoolShort", { n: pool.length, need: 6 - fixed.length });
    }

    var need = 6 - fixed.length;
    var games = [], seen = {}, attempts = 0, limit = 60000;
    while (games.length < count && attempts < limit) {
      attempts++;
      var pick = fixed.slice();
      var bag = shuffle(pool.slice());
      for (var i = 0; i < need && i < bag.length; i++) pick.push(bag[i]);
      pick.sort(function (a, b) { return a - b; });
      if (!meetsOddEven(pick, ratio)) continue;
      if (noConsec && hasConsecutive(pick)) continue;
      var key = pick.join(",");
      if (seen[key]) continue;
      seen[key] = 1;
      games.push(pick);
    }
    if (!games.length) {
      return genError("No combination fits all of those filters. Loosen one of them (odd/even or consecutive).",
                      "d.errNoCombo");
    }
    return { error: null, games: games, partial: games.length < count, requested: count };
  }

  /* ---------- history checker ---------- */
  function checkHistory(combo, draws) {
    var target = {};
    var i;
    for (i = 0; i < combo.length; i++) target[combo[i]] = 1;
    var counts = { 6: 0, 5: 0, 4: 0, 3: 0 }, hits = [];
    for (i = draws.length - 1; i >= 0; i--) {
      var draw = draws[i], matched = [], k;
      for (k = 0; k < draw.n.length; k++) if (target[draw.n[k]]) matched.push(draw.n[k]);
      var m = matched.length;
      if (m >= 3) {
        counts[m] += 1;
        hits.push({ d: draw.d, n: draw.n.slice(), match: m, matched: matched });
      }
    }
    hits.sort(function (a, b) {
      return b.match - a.match || (a.d < b.d ? 1 : a.d > b.d ? -1 : 0);
    });
    return { combo: combo.slice(), counts: counts, hits: hits, total: hits.length };
  }

  /* ---------- results helpers ---------- */
  function findByDate(draws, iso) {
    for (var i = 0; i < draws.length; i++) {
      if (draws[i].d === iso) return { draw: draws[i], exact: true, direction: "exact" };
    }
    /* nearest earlier draw, else the earliest stored one */
    var before = null, after = null;
    for (var j = 0; j < draws.length; j++) {
      if (draws[j].d < iso) before = draws[j];
      else if (!after) after = draws[j];
    }
    if (before) return { draw: before, exact: false, direction: "before" };
    if (after) return { draw: after, exact: false, direction: "after" };
    return { draw: null, exact: false, direction: "none" };
  }

  function jackpotTrend(draws, limit) {
    var size = Math.min(limit || 30, draws.length);
    return draws.slice(draws.length - size).map(function (d) {
      return { d: d.d, j: d.j, w: d.w };
    });
  }

  function longWeekday(iso, lang) {
    var names = lang === "tl" ? DOW_LONG_TL : DOW_LONG;
    return names[parseISO(iso).getUTCDay()];
  }

  var api = {
    GAMES: GAMES,
    PRIZE_FLOOR: PRIZE_FLOOR,
    TAX_THRESHOLD: TAX_THRESHOLD,
    TAX_RATE: TAX_RATE,
    BRANCH_CEILING: BRANCH_CEILING,
    getGame: getGame,
    combinations: combinations,
    odds: odds,
    calcTax: calcTax,
    claimTier: claimTier,
    analyze: analyze,
    generate: generate,
    checkHistory: checkHistory,
    findByDate: findByDate,
    jackpotTrend: jackpotTrend,
    nextDraw: nextDraw,
    todayManila: todayManila,
    weekday: weekday,
    longWeekday: longWeekday,
    dayLabel: dayLabel,
    formatDate: formatDate,
    formatDateShort: formatDateShort,
    formatNumber: formatNumber,
    formatPeso: formatPeso,
    shortPeso: shortPeso,
    ballBand: ballBand,
    sumFormula: sumFormula,
    hasConsecutive: hasConsecutive,
    meetsOddEven: meetsOddEven,
    round2: round2
  };

  root.PCSOCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
