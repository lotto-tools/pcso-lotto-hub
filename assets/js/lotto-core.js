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

  /* ---------- daily digit games (3D Swertres · 2D EZ2) ----------
     Both games draw three times a day (2:00 PM, 5:00 PM, 9:00 PM PHT) and pay
     a fixed prize per ₱10 play. The order of the drawn digits is kept exactly
     as drawn: a Standard ticket pays only in that order, and Rambolito — the
     any-order play — is a separate bet with its own, smaller prize. */
  var DIGIT_TIMES = ["14:00", "17:00", "21:00"];
  var DIGIT_TIME_LABELS = ["2:00 PM", "5:00 PM", "9:00 PM"];
  var DIGIT_TIME_SHORT = { "14:00": "2PM", "17:00": "5PM", "21:00": "9PM" };

  var DIGIT_GAMES = [
    { id: "3d", name: "3D Lotto (Swertres)", short: "3D", kind: "digits",
      yt: "3D Lotto Swertres",
      digits: 3, maxValue: 9, minValue: 0, pad: false, perDay: 3,
      times: DIGIT_TIMES.slice(), timeLabels: DIGIT_TIME_LABELS.slice(),
      prize: 4500, rambolito: { different: 750, pair: 1500 }, combos: 1000 },
    { id: "2d", name: "2D Lotto (EZ2)", short: "2D", kind: "digits",
      yt: "2D Lotto EZ2",
      digits: 2, maxValue: 31, minValue: 1, pad: true, perDay: 3,
      times: DIGIT_TIMES.slice(), timeLabels: DIGIT_TIME_LABELS.slice(),
      prize: 4000, rambolito: { different: 2000 }, combos: 961 }
  ];

  function getDigitGame(id) {
    for (var i = 0; i < DIGIT_GAMES.length; i++) if (DIGIT_GAMES[i].id === id) return DIGIT_GAMES[i];
    return null;
  }

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

  /* ---------- digit helpers ---------- */
  function padDigit(v, game) {
    var s = String(Math.abs(Math.round(Number(v) || 0)));
    return game && game.pad ? (s.length < 2 ? "0" + s : s) : s;
  }
  /* the winning digits as written on a ticket: "798" or "23 06" */
  function digitCode(nums) {
    var out = [];
    for (var i = 0; i < nums.length; i++) out.push(String(nums[i]));
    return out.join(" ");
  }
  function digitSum(nums) {
    var s = 0;
    for (var i = 0; i < nums.length; i++) s += Number(nums[i]);
    return s;
  }
  function digitShape(nums) {
    var seen = {}, i, key, distinct = 0;
    for (i = 0; i < nums.length; i++) {
      key = String(nums[i]);
      if (!seen[key]) { seen[key] = 1; distinct++; }
    }
    if (distinct === 1) return "allSame";
    if (distinct === nums.length) return "allDiff";
    return "onePair";
  }
  function sameMultiset(a, b) {
    if (a.length !== b.length) return false;
    var x = a.map(String).sort(), y = b.map(String).sort();
    for (var i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
    return true;
  }
  /* Prize for a winning ticket. Standard pays the top prize; Rambolito, the
     any-order play, pays less and is not offered when every digit is the same
     (there is only one arrangement to cover). */
  function digitPrize(game, nums) {
    var g = typeof game === "string" ? getDigitGame(game) : game;
    var shape = digitShape(nums.length ? nums : [0]);
    var rb = null;
    if (g && g.rambolito) {
      if (shape === "allDiff" && g.rambolito.different) rb = g.rambolito.different;
      else if (shape === "onePair" && g.rambolito.pair) rb = g.rambolito.pair;
    }
    return { standard: g ? g.prize : 0, rambolito: rb, shape: shape };
  }
  /* Straight odds are the number of possible combinations. An any-order
     (Rambolito) ticket covers 6 arrangements when three digits all differ and
     3 when two digits repeat; on EZ2 a pair of different numbers covers 2. */
  function digitOdds(game) {
    var g = typeof game === "string" ? getDigitGame(game) : game;
    var out = { standard: 0, rambolitoDifferent: null, rambolitoPair: null };
    if (!g) return out;
    out.standard = Math.pow(g.maxValue - g.minValue + 1, g.digits);
    if (g.rambolito) {
      var perm = 1, i;
      for (i = 2; i <= g.digits; i++) perm *= i;
      if (g.rambolito.different) out.rambolitoDifferent = Math.round(out.standard / perm);
      if (g.rambolito.pair) out.rambolitoPair = Math.round(out.standard / g.digits);
    }
    return out;
  }
  function slotLabel(t) {
    for (var i = 0; i < DIGIT_TIMES.length; i++) if (DIGIT_TIMES[i] === t) return DIGIT_TIME_LABELS[i];
    return t;
  }
  function slotShort(t) { return DIGIT_TIME_SHORT[t] || t; }

  function manilaNow() {
    try {
      var f = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23"
      });
      var parts = {};
      f.formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
      return { iso: parts.year + "-" + parts.month + "-" + parts.day,
               hhmm: parts.hour + ":" + parts.minute };
    } catch (e) {
      var d = new Date();
      return { iso: isoOf(d), hhmm: "12:00" };
    }
  }
  /* The next of the three daily draws that has not started yet. */
  function nextDailyDraw(game, lang, now) {
    now = now || manilaNow();
    var base = parseISO(now.iso);
    var g = typeof game === "string" ? getDigitGame(game) : game;
    var times = (g && g.times) || DIGIT_TIMES;
    for (var i = 0; i < times.length; i++) {
      if (times[i] > now.hhmm) {
        return { iso: now.iso, time: times[i],
                 label: slotLabel(times[i]) + " PHT · " + formatDate(now.iso, lang) };
      }
    }
    var tomorrow = new Date(base.getTime() + 86400000);
    return { iso: isoOf(tomorrow), time: times[0],
             label: slotLabel(times[0]) + " PHT · " + formatDate(isoOf(tomorrow), lang) };
  }

  /* ---------- digit statistics ---------- */
  function analyzeDigits(draws, game, range) {
    var g = typeof game === "string" ? getDigitGame(game) : game;
    if (!g) g = DIGIT_GAMES[0];
    var lo = g.minValue, hi = g.maxValue;
    var size = range && range > 0 ? Math.min(range, (draws || []).length) : (draws || []).length;
    var res = {
      game: g.id, size: size, lo: lo, hi: hi, digits: g.digits,
      freq: [], gap: [], posFreq: [], posGap: [],
      hot: [], cold: [], overdue: [], expected: 0,
      shapes: { allSame: 0, onePair: 0, allDiff: 0 },
      sums: [], avgSum: 0, minSum: 0, maxSum: 0,
      from: null, to: null, latest: null
    };
    var v, p;
    for (v = lo; v <= hi; v++) { res.freq.push(0); res.gap.push(0); }
    for (p = 0; p < g.digits; p++) {
      var f = [], gap = [];
      for (v = lo; v <= hi; v++) { f.push(0); gap.push(0); }
      res.posFreq.push(f);
      res.posGap.push(gap);
    }
    if (!size) return res;

    var subset = draws.slice(draws.length - size);
    res.from = subset[0].d;
    res.to = subset[subset.length - 1].d;
    res.latest = subset[subset.length - 1];
    res.expected = (g.digits * size) / (hi - lo + 1);

    var lastSeen = [], posLast = [], i, k;
    for (v = lo; v <= hi; v++) lastSeen[v] = -1;
    for (p = 0; p < g.digits; p++) {
      posLast.push([]);
      for (v = lo; v <= hi; v++) posLast[p][v] = -1;
    }

    for (i = 0; i < size; i++) {
      var nums = subset[i].n;
      for (k = 0; k < nums.length && k < g.digits; k++) {
        var val = Number(nums[k]);
        res.freq[val - lo] += 1;
        res.posFreq[k][val - lo] += 1;
        lastSeen[val] = i;
        posLast[k][val] = i;
      }
      res.shapes[digitShape(nums)] += 1;
      res.sums.push(digitSum(nums));
    }

    for (v = lo; v <= hi; v++) {
      res.gap[v - lo] = lastSeen[v] === -1 ? size : size - 1 - lastSeen[v];
      for (p = 0; p < g.digits; p++) {
        res.posGap[p][v - lo] = posLast[p][v] === -1 ? size : size - 1 - posLast[p][v];
      }
    }

    var all = [];
    for (v = lo; v <= hi; v++) all.push({ n: v, count: res.freq[v - lo], gap: res.gap[v - lo] });
    res.hot = all.slice().sort(function (a, b) { return b.count - a.count || a.n - b.n; }).slice(0, 5);
    res.cold = all.slice().sort(function (a, b) { return a.count - b.count || a.n - b.n; }).slice(0, 5);
    res.overdue = all.slice().sort(function (a, b) { return b.gap - a.gap || a.n - b.n; }).slice(0, 5);

    res.avgSum = res.sums.reduce(function (a, b) { return a + b; }, 0) / size;
    res.minSum = Math.min.apply(null, res.sums);
    res.maxSum = Math.max.apply(null, res.sums);
    return res;
  }

  /* ---------- digit combination picker ----------
     Positions may be fixed, values may be excluded, and the shape of the
     combination can be narrowed (all different digits, one pair, all the same). */
  function digitError(msg, key, vars) {
    return { error: msg, errorKey: key, errorVars: vars || null, games: [] };
  }

  function generateDigits(opts) {
    opts = opts || {};
    var g = typeof opts.game === "string" ? getDigitGame(opts.game) : (opts.game || DIGIT_GAMES[0]);
    if (!g) g = DIGIT_GAMES[0];
    var count = opts.count || 5;
    var lo = g.minValue, hi = g.maxValue;
    var excluded = (opts.excluded || []).map(Number);
    var fixed = (opts.fixed || []).map(function (x) { return x == null ? null : Number(x); });
    var shape = opts.shape || "any";
    var i, v;

    for (i = 0; i < excluded.length; i++) {
      if (!(excluded[i] >= lo && excluded[i] <= hi))
        return digitError("Number " + excluded[i] + " is outside " + lo + "–" + hi + ".",
                          "d.dErrExcludedOut", { n: excluded[i], min: lo, max: hi });
    }
    for (i = 0; i < fixed.length; i++) {
      if (fixed[i] === null) continue;
      if (!(fixed[i] >= lo && fixed[i] <= hi))
        return digitError("Fixed number " + fixed[i] + " is outside " + lo + "–" + hi + ".",
                          "d.dErrFixedOut", { n: fixed[i], min: lo, max: hi });
      if (excluded.indexOf(fixed[i]) !== -1)
        return digitError("Number " + fixed[i] + " is both fixed and excluded.",
                          "d.dErrBoth", { n: fixed[i] });
    }

    var allowed = [];
    for (v = lo; v <= hi; v++) if (excluded.indexOf(v) === -1) allowed.push(v);
    var needed = 0;
    for (i = 0; i < g.digits; i++) if (i >= fixed.length || fixed[i] === null) needed++;
    if (!allowed.length && needed)
      return digitError("Every number is excluded — leave at least one in the pool.",
                        "d.dErrPoolEmpty", { min: lo, max: hi });

    /* a shape the fixed positions already contradict can never be met */
    var fixedVals = fixed.slice(0, g.digits).filter(function (x) { return x !== null; });
    if (fixedVals.length === g.digits && shape !== "any") {
      var fixedShape = digitShape(fixedVals);
      var okFixed = (shape === fixedShape) || (shape === "different" && fixedShape === "allDiff")
        || (shape === "pair" && fixedShape === "onePair");
      if (!okFixed)
        return digitError("The fixed digits do not fit the chosen shape.", "d.dErrShapeFixed");
    }

    function fits(nums) {
      var s = digitShape(nums);
      if (shape === "any") return true;
      if (shape === "allDiff") return s === "allDiff";
      if (shape === "onePair") return s === "onePair";
      if (shape === "allSame") return s === "allSame";
      return true;
    }

    var games = [], seen = {}, attempts = 0, limit = 20000;
    while (games.length < count && attempts < limit) {
      attempts++;
      var pick = [];
      for (i = 0; i < g.digits; i++) {
        if (i < fixed.length && fixed[i] !== null) pick.push(fixed[i]);
        else pick.push(allowed[Math.floor(Math.random() * allowed.length)]);
      }
      if (!fits(pick)) continue;
      var key = pick.join("-");
      if (seen[key]) continue;
      seen[key] = 1;
      games.push(pick.map(function (x) { return padDigit(x, g); }));
    }
    if (!games.length) {
      return digitError("No combination fits those filters — loosen the shape or the excluded numbers.",
                        "d.dErrNoCombo");
    }
    return { error: null, games: games, partial: games.length < count, requested: count };
  }

  /* How a candidate combination would have done in the stored draws:
     an exact (straight) match, and the any-order Rambolito match. */
  function checkDigitHistory(combo, draws, game) {
    var g = typeof game === "string" ? getDigitGame(game) : game;
    if (!g) g = DIGIT_GAMES[0];
    var target = combo.map(String);
    var straight = [], rambolito = [], i;
    var prize = digitPrize(g, target);
    for (i = (draws || []).length - 1; i >= 0; i--) {
      var row = draws[i], nums = row.n.map(String);
      if (nums.length !== target.length) continue;
      var same = true, k;
      for (k = 0; k < target.length; k++) if (nums[k] !== target[k]) { same = false; break; }
      if (same) straight.push({ d: row.d, t: row.t, n: nums.slice(), w: row.w });
      else if (prize.rambolito && sameMultiset(nums, target))
        rambolito.push({ d: row.d, t: row.t, n: nums.slice(), w: row.w });
    }
    return {
      combo: target, straight: straight, rambolito: rambolito,
      straightCount: straight.length, rambolitoCount: rambolito.length,
      rambolitoPrize: prize.rambolito, standardPrize: prize.standard,
      total: straight.length + rambolito.length
    };
  }

  /* The three draws of one date, or of the closest earlier draw date. */
  function findDailyDate(draws, iso) {
    var byDate = {}, dates = [], i;
    for (i = 0; i < (draws || []).length; i++) {
      var d = draws[i].d;
      if (!byDate[d]) { byDate[d] = []; dates.push(d); }
      byDate[d].push(draws[i]);
    }
    if (byDate[iso]) return { date: iso, rows: byDate[iso], exact: true };
    var before = null;
    for (i = 0; i < dates.length; i++) if (dates[i] < iso) before = dates[i];
    if (before) return { date: before, rows: byDate[before], exact: false, direction: "before" };
    return { date: dates.length ? dates[0] : null, rows: dates.length ? byDate[dates[0]] : [],
             exact: false, direction: "after" };
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
    DIGIT_GAMES: DIGIT_GAMES,
    getDigitGame: getDigitGame,
    digitCode: digitCode,
    digitSum: digitSum,
    digitShape: digitShape,
    digitPrize: digitPrize,
    digitOdds: digitOdds,
    padDigit: padDigit,
    slotLabel: slotLabel,
    slotShort: slotShort,
    manilaNow: manilaNow,
    nextDailyDraw: nextDailyDraw,
    analyzeDigits: analyzeDigits,
    generateDigits: generateDigits,
    checkDigitHistory: checkDigitHistory,
    findDailyDate: findDailyDate,
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
