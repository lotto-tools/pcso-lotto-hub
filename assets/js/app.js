/* =============================================================
   PCSO Lotto Hub — UI
   Renders everything from window.PCSO_DATA (real PCSO draws)
   and window.PCSOCore. Text comes from window.PCSO_I18N, so the
   page draws in Tagalog by default and in English on demand.
   ============================================================= */
(function () {
  "use strict";

  var DATA = window.PCSO_DATA;
  var Core = window.PCSOCore;
  var I18N = window.PCSO_I18N;
  if (!DATA || !Core) return;

  var META = DATA.meta;
  var DRAWS = DATA.draws;

  var state = {
    game: "658",
    tab: "results",
    range: 50,
    paint: "fixed",
    fixed: [],
    excluded: [],
    combos: null,
    dateQuery: ""
  };

  /* ---------- language helpers ---------- */
  function lang() { return I18N ? I18N.getLang() : "en"; }
  function t(key, vars) { return I18N ? I18N.t(key, vars) : key; }

  /* ---------- tiny helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function ball(num, max, size) {
    var b = el("span", "ball t" + Core.ballBand(num, max) + (size ? " ball--" + size : ""),
               String(num).padStart(2, "0"));
    b.setAttribute("aria-label", t("d.numAria", { n: num }));
    return b;
  }
  function balls(nums, max, size) {
    var row = el("div", "balls-row");
    for (var i = 0; i < nums.length; i++) row.appendChild(ball(nums[i], max, size));
    return row;
  }
  function peso(n) { return Core.formatPeso(n, true); }
  function pct(x) { return (x * 100).toFixed(1) + "%"; }
  function date(iso) { return Core.formatDate(iso, lang()); }
  function dateShort(iso) { return Core.formatDateShort(iso, lang()); }
  function wd(iso) { return Core.weekday(iso, lang()); }
  function longWd(iso) { return Core.longWeekday(iso, lang()); }

  /* ---------- YouTube draw videos ----------
     PCSO streams every draw live on its official channel and keeps the
     recordings there, so there is no fixed video address per draw. Each link
     opens a YouTube search for that game and that draw date. */
  var YT_CHANNEL = "https://www.youtube.com/@PCSOGOVPHOfficial/streams";

  function ytDrawUrl(g, iso) {
    var q = "PCSO " + g.name + " " + iso + " lotto draw";
    return "https://www.youtube.com/results?search_query=" +
      encodeURIComponent(q).replace(/%20/g, "+");
  }

  function ytLink(href, text, cls, label) {
    var a = el("a", cls, text);
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    if (label) a.setAttribute("aria-label", label);
    return a;
  }

  function ytDrawLink(g, iso, cls) {
    return ytLink(ytDrawUrl(g, iso), t("d.watchDraw"), cls || "btn btn--sm btn--ghost",
      t("d.watchAria", { game: g.name, date: date(iso) }));
  }

  function ytChannelLink(cls) {
    return ytLink(YT_CHANNEL, t("d.channel"), cls || "btn btn--sm btn--ghost",
      t("d.channelAria"));
  }

  function game() { return Core.getGame(state.game); }
  function gameMeta() { return META.games[state.game]; }
  function draws() { return DRAWS[state.game]; }
  function latest() { var d = draws(); return d[d.length - 1]; }
  /* the two digit games (3D Lotto, 2D Lotto) live in their own panels and are
     drawn by assets/js/daily.js; state.game carries which one is open */
  function digitGame() { return Core.getDigitGame(state.game); }
  function isDaily() { return !!digitGame(); }

  function winnersText(n) {
    if (n === 0) return t("d.winnersZero");
    if (n === 1) return t("d.winnersOne");
    return t("d.winnersMany", { n: n });
  }

  /* ---------- game bar ---------- */
  function renderGameBar() {
    var bar = $("gameBar");
    bar.innerHTML = "";
    Core.GAMES.forEach(function (g) {
      var meta = META.games[g.id];
      var b = el("button", "game-pill" + (g.id === state.game ? " is-active" : ""));
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", g.id === state.game ? "true" : "false");
      b.dataset.game = g.id;
      b.appendChild(el("b", null, g.short));
      b.appendChild(el("span", null, Core.shortPeso(meta.latest.j)));
      b.title = t("d.gamePillTitle", { game: g.name, j: peso(meta.latest.j) });
      b.addEventListener("click", function () { selectGame(g.id); });
      bar.appendChild(b);
    });
    if (Core.DIGIT_GAMES && Core.DIGIT_GAMES.length) {
      bar.appendChild(el("span", "gamebar-sep", "3×/day"));
      Core.DIGIT_GAMES.forEach(function (g) {
        var meta = META.games[g.id];
        if (!meta) return;
        var b = el("button", "game-pill game-pill--daily" +
          (g.id === state.game ? " is-active" : ""));
        b.type = "button";
        b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", g.id === state.game ? "true" : "false");
        b.dataset.game = g.id;
        b.appendChild(el("b", null, g.short));
        b.appendChild(el("span", null, g.times.map(function (x) {
          return Core.slotShort(x);
        }).join(" · ")));
        b.title = t("d.dailyPillTitle", {
          game: g.name, n: g.perDay, times: g.timeLabels.join(", ")
        });
        b.addEventListener("click", function () { selectDaily(g.id); });
        bar.appendChild(b);
      });
    }
  }

  /* ---------- hero ---------- */
  function renderHero() {
    var g = game(), d = latest(), m = gameMeta();
    if ($("heroPrizeLabel")) $("heroPrizeLabel").textContent = t("d.heroPrizeLabel");
    if ($("heroNetLabel")) $("heroNetLabel").textContent = t("d.heroNetLabel");
    $("heroGameName").textContent = g.name;
    $("heroDrawDate").textContent = t("d.heroLatest", { wd: wd(d.d), date: date(d.d) });
    var ballsBox = $("heroBalls");
    ballsBox.innerHTML = "";
    ballsBox.appendChild(balls(d.n, g.max, "sm"));
    $("heroJackpot").textContent = peso(d.j);
    $("heroNet").textContent = peso(Core.calcTax(d.j).net);
    $("heroWinners").textContent = winnersText(d.w);
    $("heroNextDraw").textContent = t("d.nextDraw", { label: Core.nextDraw(g, null, lang()).label });
    $("heroCount").textContent = t("d.drawsStored", { n: m.count });
    $("dataUpdated").textContent = date(META.collectedAt);
  }

  /* ---------- results ---------- */
  function renderLatest() {
    var g = game(), d = latest(), m = gameMeta();
    $("latestGame").textContent = t("d.latestTitle", { game: g.name });
    $("latestDate").textContent = longWd(d.d) + ", " + date(d.d) + " · 9:00 PM PHT";
    $("latestDrawNo").textContent = t("d.drawsStored", { n: m.count });
    var box = $("latestBalls");
    box.innerHTML = "";
    box.appendChild(balls(d.n, g.max, "lg"));
    $("latestJackpot").textContent = peso(d.j);
    var net = Core.calcTax(d.j);
    $("latestNet").innerHTML = peso(net.net) +
      "<small>" + t("d.netSmall", { tax: peso(net.tax) }) + "</small>";
    $("latestWinners").innerHTML = d.w + "<small>" +
      (d.w === 0 ? t("d.matchNone") : d.w === 1 ? t("d.matchOne") : t("d.matchMany", { n: d.w })) +
      "</small>";
    $("latestSchedule").innerHTML = Core.dayLabel(g, lang()) + "<small>9:00 PM PHT</small>";

    var vbox = $("latestVideoLinks");
    vbox.innerHTML = "";
    vbox.appendChild(ytDrawLink(g, d.d, "btn btn--sm btn--primary"));
    vbox.appendChild(ytChannelLink());

    var list = draws();
    var prior = list[list.length - 2];
    var box2 = $("priorDraw");
    box2.innerHTML = "";
    if (prior) {
      box2.appendChild(document.createTextNode(
        t("d.prevDraw", {
          date: date(prior.d),
          nums: prior.n.map(function (n) { return String(n).padStart(2, "0"); }).join(" · "),
          jackpot: peso(prior.j)
        })));
      var b = el("button", "btn btn--sm btn--ghost", t("d.showAll"));
      b.type = "button";
      b.dataset.tabLink = "results";
      b.addEventListener("click", function () {
        $("historyCount").value = "0";
        renderHistory();
      });
      box2.appendChild(b);
    }
  }

  function renderHistory() {
    var g = game(), list = draws();
    var n = Number($("historyCount").value);
    var rows = n > 0 ? list.slice(list.length - n) : list;
    $("historyRangeLabel").textContent = t(n > 0 ? "d.historyLast" : "d.historyAll", {
      n: rows.length, from: date(rows[0].d), to: date(rows[rows.length - 1].d)
    });
    var body = $("historyBody");
    body.innerHTML = "";
    for (var i = rows.length - 1; i >= 0; i--) {
      var d = rows[i];
      var tr = el("tr", i === rows.length - 1 ? "is-high" : "");
      var tdDate = el("td", null, date(d.d));
      var tdDay = el("td", null, wd(d.d));
      var tdNums = el("td");
      var row = el("div", "balls-row");
      for (var k = 0; k < d.n.length; k++) row.appendChild(ball(d.n[k], g.max, "xs"));
      tdNums.appendChild(row);
      var tdJ = el("td", "num", peso(d.j));
      var tdW = el("td", "num", String(d.w));
      var tdNet = el("td", "num", peso(Core.calcTax(d.j).net));
      var tdVid = el("td", "video-cell");
      tdVid.appendChild(ytDrawLink(g, d.d, "video-link"));
      tr.appendChild(tdDate); tr.appendChild(tdDay); tr.appendChild(tdNums);
      tr.appendChild(tdJ); tr.appendChild(tdW); tr.appendChild(tdNet);
      tr.appendChild(tdVid);
      body.appendChild(tr);
    }
  }

  function renderTrend() {
    var pts = Core.jackpotTrend(draws(), 30);
    var box = $("trendChart");
    box.innerHTML = "";
    if (!pts.length) return;
    var max = Math.max.apply(null, pts.map(function (p) { return p.j; }));
    var min = Math.min.apply(null, pts.map(function (p) { return p.j; }));
    var wrap = el("div");
    wrap.style.display = "flex";
    wrap.style.alignItems = "flex-end";
    wrap.style.gap = "3px";
    wrap.style.height = "132px";
    wrap.style.padding = "6px 0";
    pts.forEach(function (p) {
      var h = max === min ? 60 : 12 + 88 * (p.j - min) / (max - min);
      var b = el("div");
      b.style.flex = "1 1 auto";
      b.style.minWidth = "3px";
      b.style.height = h + "%";
      b.style.borderRadius = "3px 3px 0 0";
      b.style.background = p.w > 0
        ? "linear-gradient(180deg,#f2b200,#ffd97a)"
        : "linear-gradient(180deg,#4a7dff,#9cbaff)";
      var title = t("d.trendBar", { date: date(p.d), jackpot: peso(p.j) });
      if (p.w > 0) title += t(p.w === 1 ? "d.trendWonOne" : "d.trendWonMany", { n: p.w });
      b.title = title;
      b.setAttribute("aria-label", title);
      wrap.appendChild(b);
    });
    box.appendChild(wrap);
    var foot = el("p", "table-note", t("d.trendFoot", {
      min: Core.shortPeso(min), max: Core.shortPeso(max), latest: peso(pts[pts.length - 1].j)
    }));
    box.appendChild(foot);
  }

  function renderDateResult(iso) {
    var g = game(), list = draws(), box = $("dateResult");
    box.innerHTML = "";
    state.dateQuery = iso || "";
    if (!iso) {
      box.appendChild(el("p", "table-note", t("d.pickDate")));
      return;
    }
    var found = Core.findByDate(list, iso);
    if (!found.draw) {
      box.appendChild(el("p", "table-note", t("d.noDraw")));
      return;
    }
    var d = found.draw;
    var card = el("div");
    card.style.border = "1px solid var(--line)";
    card.style.borderRadius = "14px";
    card.style.padding = "13px 14px";
    card.style.background = "#fbfcff";
    var head = el("div");
    head.style.display = "flex";
    head.style.justifyContent = "space-between";
    head.style.gap = "10px";
    head.style.alignItems = "baseline";
    head.appendChild(el("strong", null, longWd(d.d) + ", " + date(d.d)));
    head.appendChild(el("span", "badge" + (found.exact ? " badge--green" : " badge--gold"),
      found.exact ? t("d.exactDraw") : t("d.noDrawDay")));
    card.appendChild(head);
    var row = balls(d.n, g.max, "sm");
    row.style.margin = "10px 0";
    card.appendChild(row);
    var net = Core.calcTax(d.j);
    var why = "";
    if (!found.exact) {
      why = found.direction === "after"
        ? t("d.whyAfter", { date: date(iso) })
        : t("d.whyBefore", { game: g.short, date: date(iso) });
    }
    var cardKey = d.w === 0 ? "d.dateCardZero" : d.w === 1 ? "d.dateCardOne" : "d.dateCard";
    card.appendChild(el("p", "table-note", t(cardKey, {
      jackpot: peso(d.j), w: d.w, net: peso(net.net), why: why
    })));
    var vid = el("div", "video-row");
    vid.appendChild(ytDrawLink(g, d.d));
    vid.appendChild(ytChannelLink());
    card.appendChild(vid);
    box.appendChild(card);
  }

  /* ---------- statistics ---------- */
  function renderStats() {
    var g = game();
    var a = Core.analyze(draws(), g.max, state.range);
    $("statsTitle").textContent = t("d.statsTitle", { game: g.name });
    $("statsRangeLabel").textContent = t(state.range ? "d.statsRangeLast" : "d.statsRangeAll", {
      n: a.size, from: date(a.from), to: date(a.to)
    });
    $("statsSize").textContent = String(a.size);
    $("statsExpected").textContent = a.expected.toFixed(2);
    $("statsAvgSum").textContent = Math.round(a.avgSum);
    var top = a.overdue[0];
    $("statsOverdueTop").innerHTML = String(top.n) + "<small>" +
      t("d.overdueSmall", { n: top.gap }) + "</small>";

    /* heatmap */
    var heat = $("heatmap");
    heat.innerHTML = "";
    heat.style.setProperty("--cols", g.max > 49 ? "10" : "9");
    var counts = [];
    for (var n = 1; n <= g.max; n++) counts.push(a.freq[n]);
    var lo = Math.min.apply(null, counts), hi = Math.max.apply(null, counts);
    for (var num = 1; num <= g.max; num++) {
      var c = a.freq[num];
      var tt = hi === lo ? .35 : (c - lo) / (hi - lo);
      var cell = el("div", "hm");
      cell.style.background = "hsl(222 78% " + (96 - 46 * tt).toFixed(1) + "%)";
      cell.style.color = tt > .55 ? "#fff" : "#0f172a";
      cell.title = t("d.heatCell", { n: num, c: c, size: a.size });
      cell.appendChild(el("b", null, String(num)));
      cell.appendChild(el("span", null, String(c)));
      heat.appendChild(cell);
    }
    var legend = $("heatLegend");
    legend.innerHTML = "";
    [t("d.legendFewest"), t("d.legendAverage", { x: a.expected.toFixed(1) }), t("d.legendMost")]
      .forEach(function (label, i) {
        var chip = el("span", "chip", label);
        chip.style.background = "hsl(222 78% " + [96, 73, 50][i] + "%)";
        chip.style.color = i === 2 ? "#fff" : "var(--ink-2)";
        chip.style.border = "0";
        legend.appendChild(chip);
      });

    renderChips($("hotChips"), a.hot, "hot");
    renderChips($("coldChips"), a.cold, "cold");
    renderChips($("overdueChips"), a.overdue.slice(0, 6), "overdue");

    /* odd / even */
    var oddBox = $("oddChart");
    oddBox.innerHTML = "";
    for (var o = 6; o >= 0; o--) {
      oddBox.appendChild(ratioRow(t("d.oddRow", { o: o, e: 6 - o }), a.oddDist[o], a.size,
        o === 3 ? "" : "warm"));
    }
    /* low / high */
    $("lowHighDesc").textContent = t("d.lowHighDesc", {
      lowMax: a.lowMax, lowMax1: a.lowMax + 1, max: g.max
    });
    var lowBox = $("lowChart");
    lowBox.innerHTML = "";
    for (var l = 6; l >= 0; l--) {
      lowBox.appendChild(ratioRow(t("d.lowRow", { l: l, h: 6 - l }), a.lowDist[l], a.size, ""));
    }

    /* sums */
    var sumBox = $("sumChart");
    sumBox.innerHTML = "";
    var maxBucket = Math.max.apply(null, a.sumBuckets.map(function (b) { return b.count; }));
    a.sumBuckets.forEach(function (b) {
      sumBox.appendChild(countRow(b.lo + "–" + b.hi, b.count, maxBucket, a.size));
    });
    var f = Core.sumFormula(g.max);
    $("sumDesc").textContent = t("d.sumDesc", {
      min: f.min, max: f.max, avg: a.avgSum.toFixed(1), minSum: a.minSum, maxSum: a.maxSum
    });

    /* pairs */
    var pairBox = $("pairList");
    pairBox.innerHTML = "";
    if (!a.pairs.length) pairBox.appendChild(el("p", "table-note", t("d.notEnough")));
    a.pairs.forEach(function (p) {
      var row = el("div", "pair-row");
      row.appendChild(el("span", "p", String(p.pair[0]).padStart(2, "0") + " · " +
        String(p.pair[1]).padStart(2, "0")));
      row.appendChild(el("span", "c", p.count + "×"));
      pairBox.appendChild(row);
    });
  }

  function ratioRow(label, count, total, tone) {
    var row = el("div", "ratio-row");
    row.appendChild(el("span", "label", label));
    var bar = el("div", "bar");
    var i = el("i", tone === "warm" ? "warm" : "");
    i.style.width = total ? (100 * count / total).toFixed(2) + "%" : "0%";
    bar.appendChild(i);
    row.appendChild(bar);
    var val = el("span", "val");
    val.appendChild(el("b", null, String(count)));
    val.appendChild(document.createTextNode(" · " + (total ? pct(count / total) : "0%")));
    row.appendChild(val);
    return row;
  }

  function countRow(label, count, maxCount, total) {
    var row = el("div", "ratio-row");
    row.appendChild(el("span", "label", label));
    var bar = el("div", "bar");
    var i = el("i");
    i.style.width = maxCount ? (100 * count / maxCount).toFixed(2) + "%" : "0%";
    bar.appendChild(i);
    row.appendChild(bar);
    var val = el("span", "val");
    val.appendChild(el("b", null, String(count)));
    val.appendChild(document.createTextNode(" · " + (total ? pct(count / total) : "0%")));
    row.appendChild(val);
    return row;
  }

  function renderChips(box, items, cls) {
    box.innerHTML = "";
    var isCount = cls === "hot" || cls === "cold";
    items.forEach(function (it) {
      var chip = el("span", "chip " + cls);
      chip.appendChild(el("b", null, String(it.n)));
      if (isCount) {
        chip.appendChild(document.createTextNode(" ×" + it.count));
        chip.title = t("d.chipHot", { n: it.n, c: it.count });
      } else {
        chip.appendChild(document.createTextNode(
          it.gap === 1 ? t("d.chipOverdueTextOne") : t("d.chipOverdueText", { g: it.gap })));
        chip.title = t("d.chipOverdue", { n: it.n, g: it.gap });
      }
      box.appendChild(chip);
    });
  }

  /* ---------- generator ---------- */
  function renderNumGrid() {
    var g = game(), grid = $("numGrid");
    grid.innerHTML = "";
    grid.style.setProperty("--cols", g.max > 49 ? "10" : "9");
    for (var n = 1; n <= g.max; n++) {
      var b = el("button", "num-btn", String(n));
      b.type = "button";
      b.dataset.num = n;
      b.addEventListener("click", onNumClick);
      grid.appendChild(b);
    }
    paintNumGrid();
    $("genTitle").textContent = t("d.genTitle", { game: g.name });
    $("genOdds").textContent = t("d.oddsNote", { odds: Core.formatNumber(Core.odds(g.max)) });
  }

  function paintNumGrid() {
    var btns = $("numGrid").querySelectorAll(".num-btn");
    for (var i = 0; i < btns.length; i++) {
      var n = Number(btns[i].dataset.num);
      btns[i].classList.toggle("is-fixed", state.fixed.indexOf(n) !== -1);
      btns[i].classList.toggle("is-excluded", state.excluded.indexOf(n) !== -1);
      btns[i].setAttribute("aria-pressed",
        state.fixed.indexOf(n) !== -1 || state.excluded.indexOf(n) !== -1 ? "true" : "false");
    }
    var sortNum = function (a, b) { return a - b; };
    $("pickSummary").textContent = t("d.pickSummary", {
      fixed: state.fixed.length ? state.fixed.slice().sort(sortNum).join(", ") : t("d.none"),
      excluded: state.excluded.length ? state.excluded.slice().sort(sortNum).join(", ") : t("d.none")
    });
  }

  function onNumClick(e) {
    var n = Number(e.currentTarget.dataset.num);
    var inFixed = state.fixed.indexOf(n), inExcl = state.excluded.indexOf(n);
    if (state.paint === "fixed") {
      if (inFixed !== -1) state.fixed.splice(inFixed, 1);
      else {
        if (state.fixed.length >= 5) { showGenStatus(t("d.errMaxFixed"), true); return; }
        if (inExcl !== -1) state.excluded.splice(inExcl, 1);
        state.fixed.push(n);
      }
    } else {
      if (inExcl !== -1) state.excluded.splice(inExcl, 1);
      else {
        if (inFixed !== -1) state.fixed.splice(inFixed, 1);
        state.excluded.push(n);
      }
    }
    showGenStatus("");
    paintNumGrid();
  }

  function showGenStatus(msg, isErr) {
    var box = $("genStatus");
    if (!msg) { box.style.display = "none"; box.textContent = ""; return; }
    box.style.display = "flex";
    box.className = "notice" + (isErr ? " notice--warn" : "");
    box.textContent = msg;
  }

  function renderGenerator() {
    var g = game();
    var res = Core.generate({
      max: g.max,
      fixed: state.fixed,
      excluded: state.excluded,
      oddEven: $("oddEven").value,
      noConsecutive: $("noConsec").checked,
      count: 5
    });
    if (res.error) {
      state.combos = null;
      var msg = res.errorKey ? t(res.errorKey, res.errorVars) : res.error;
      showGenStatus(msg, true);
      var box = $("gameList");
      box.innerHTML = "";
      box.appendChild(el("div", "empty", msg));
      return;
    }
    state.combos = res.games;
    state.comboNote = res.partial ? t("d.genPartial", { n: res.games.length }) : "";
    showGenStatus(state.comboNote, res.partial);
    renderCombos();
  }

  function renderCombos() {
    var g = game();
    var box = $("gameList");
    box.innerHTML = "";
    if (!state.combos) {
      var empty = el("div", "empty");
      empty.appendChild(el("strong", null, t("d.emptyTitle")));
      empty.appendChild(document.createTextNode(t("d.emptyDesc")));
      box.appendChild(empty);
      return;
    }
    var list = draws();
    state.combos.forEach(function (combo, idx) {
      var card = el("div", "game");
      var top = el("div", "game-top");
      top.appendChild(el("span", "game-no", "#" + (idx + 1)));
      top.appendChild(balls(combo, g.max, "sm"));
      var btn = el("button", "btn btn--sm", t("d.details"));
      btn.type = "button";
      top.appendChild(btn);
      card.appendChild(top);

      var hist = Core.checkHistory(combo, list);
      var line = el("div", "match-line");
      line.appendChild(el("span", null, t("d.checkedAgainst", { n: list.length })));
      [6, 5, 4, 3].forEach(function (m) {
        var chip = el("span", "m" + (hist.counts[m] ? " hit" : ""),
          t("d.matchChip", { m: m }) + " " + hist.counts[m]);
        line.appendChild(chip);
      });
      card.appendChild(line);

      var detail = el("div", "hit-list");
      detail.style.display = "none";
      if (!hist.hits.length) {
        detail.appendChild(el("div", "hit", t("d.noHits")));
      }
      hist.hits.slice(0, 25).forEach(function (h) {
        var row = el("div", "hit");
        row.appendChild(el("span", "r", t("d.hitMatch", { m: h.match })));
        row.appendChild(el("span", "d", date(h.d)));
        var rowBalls = el("span", "balls-row");
        h.matched.forEach(function (m) { rowBalls.appendChild(ball(m, g.max, "xs")); });
        row.appendChild(rowBalls);
        row.appendChild(el("span", "p", h.n.map(function (n) {
          return String(n).padStart(2, "0");
        }).join(" ")));
        detail.appendChild(row);
      });
      if (hist.hits.length > 25) {
        detail.appendChild(el("div", "hit", t("d.showingBest", { n: hist.hits.length })));
      }
      card.appendChild(detail);
      btn.addEventListener("click", function () {
        var open = detail.style.display === "none";
        detail.style.display = open ? "grid" : "none";
        btn.textContent = open ? t("d.hide") : t("d.details");
      });
      box.appendChild(card);
    });
  }

  /* ---------- calculator ---------- */
  function parseAmount(v) {
    var clean = String(v).replace(/[^0-9.]/g, "");
    var parts = clean.split(".");
    if (parts.length > 2) clean = parts[0] + "." + parts.slice(1).join("");
    var n = parseFloat(clean);
    return isFinite(n) ? n : 0;
  }

  function renderCalc() {
    var gross = parseAmount($("amountInput").value);
    var tx = Core.calcTax(gross);
    $("calcNet").textContent = peso(tx.net);
    $("calcGross").textContent = peso(tx.gross);
    $("calcTax").textContent = peso(tx.tax);
    $("calcNetRow").textContent = peso(tx.net);
    $("calcRate").textContent = tx.gross > 0 ? pct(tx.effectiveRate) : "0.00%";
    $("calcSub").textContent = tx.gross > 0
      ? t(tx.taxable ? "d.calcSubTaxed" : "d.calcSubFree", { gross: peso(tx.gross) })
      : t("d.calcSubEmpty");

    var tier = Core.claimTier(tx.gross, lang());
    $("claimTier").textContent = tier.label;
    $("claimWhere").textContent = tier.where;
    $("claimPay").textContent = tier.pay || "";
    var ul = $("claimDocs");
    ul.innerHTML = "";
    tier.docs.forEach(function (d) { ul.appendChild(el("li", null, d)); });
    var rows = $("tierTable").querySelectorAll("tbody tr");
    for (var i = 0; i < rows.length; i++) {
      rows[i].classList.toggle("is-active", rows[i].dataset.tier === tier.key);
    }
  }

  function renderQuickJackpots() {
    var box = $("quickJackpots");
    box.innerHTML = "";
    Core.GAMES.forEach(function (g) {
      var meta = META.games[g.id];
      var b = el("button", "quick");
      b.type = "button";
      b.appendChild(document.createTextNode(g.short + " "));
      b.appendChild(el("b", null, Core.shortPeso(meta.latest.j)));
      b.dataset.amount = meta.latest.j;
      b.title = t("d.quickTitle", {
        game: g.name, j: peso(meta.latest.j), date: date(meta.latest.d)
      });
      b.addEventListener("click", function () {
        $("amountInput").value = String(meta.latest.j);
        renderCalc();
      });
      box.appendChild(b);
    });
  }

  /* ---------- tables / static ---------- */
  function renderOddsTable() {
    var body = $("oddsBody");
    body.innerHTML = "";
    Core.GAMES.forEach(function (g) {
      var m = META.games[g.id];
      var tr = el("tr");
      tr.appendChild(el("td", null, g.name));
      tr.appendChild(el("td", "num", "1 – " + g.max));
      tr.appendChild(el("td", null, Core.dayLabel(g, lang())));
      tr.appendChild(el("td", null, "9:00 PM PHT"));
      tr.appendChild(el("td", "num", t("d.oddsCell", { odds: Core.formatNumber(Core.odds(g.max)) })));
      tr.appendChild(el("td", "num", t("d.storedCell", {
        n: m.count, from: dateShort(m.from), to: dateShort(m.to)
      })));
      body.appendChild(tr);
    });
    var all = Core.GAMES.reduce(function (sum, g) {
      return sum + META.games[g.id].count;
    }, 0);
    if ($("totalDraws")) $("totalDraws").textContent = Core.formatNumber(all);
    if ($("badgeDraws")) $("badgeDraws").textContent = t("d.badgeDraws", { n: Core.formatNumber(all) });
    var firsts = Core.GAMES.map(function (g) { return META.games[g.id].from; }).sort();
    var lasts = Core.GAMES.map(function (g) { return META.games[g.id].to; }).sort();
    var from = firsts[0], to = lasts[lasts.length - 1];
    if ($("dataFrom")) $("dataFrom").textContent = date(from);
    if ($("dataTo")) $("dataTo").textContent = date(to);
    if ($("badgeCoverage")) {
      $("badgeCoverage").textContent = dateShort(from) + ", " + from.slice(0, 4) + " – " +
        dateShort(to) + ", " + to.slice(0, 4);
    }
    if ($("dataUpdated")) $("dataUpdated").textContent = date(META.collectedAt);
  }

  /* ---------- tabs ----------
     The five 6-number games and the two digit games share the same tab bar.
     Which panel a tab opens depends on the game that is selected. */
  var TABS = { results: "panel-results", stats: "panel-stats", generator: "panel-generator", calc: "panel-calc" };
  var DAILY_TABS = { results: "panel-daily-results", stats: "panel-daily-stats",
                     generator: "panel-daily-generator", calc: "panel-calc" };

  function panelFor(tab) { return (isDaily() ? DAILY_TABS : TABS)[tab]; }

  function paintTabs() {
    var ids = [], seen = {};
    [TABS, DAILY_TABS].forEach(function (map) {
      Object.keys(map).forEach(function (k) {
        if (!seen[map[k]]) { seen[map[k]] = 1; ids.push(map[k]); }
      });
    });
    var target = panelFor(state.tab);
    ids.forEach(function (id) {
      var panel = $(id);
      if (panel) panel.hidden = id !== target;
    });
    var tabs = $("tabBar").querySelectorAll(".tab");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle("is-active", tabs[i].dataset.tab === state.tab);
      tabs[i].setAttribute("aria-selected", tabs[i].dataset.tab === state.tab ? "true" : "false");
    }
    var navs = document.querySelectorAll(".site-nav a");
    for (var j = 0; j < navs.length; j++) {
      navs[j].classList.toggle("is-active", navs[j].dataset.tabLink === state.tab);
    }
  }

  function selectTab(name, scroll) {
    if (!TABS[name]) return;
    state.tab = name;
    paintTabs();
    if (isDaily()) {
      if (window.PCSODaily) window.PCSODaily.renderTab(name);
    } else {
      if (name === "stats") renderStats();
    }
    if (name === "calc") renderCalc();
    if (scroll) {
      var bar = document.querySelector(".tabbar");
      if (!bar) return;
      var header = document.querySelector(".site-header");
      var games = document.querySelector(".gamebar");
      var offset = (header ? header.offsetHeight : 0) + (games ? games.offsetHeight : 0) + 8;
      var top = bar.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  }

  /* ---------- game selection ---------- */
  function selectGame(id) {
    if (Core.getDigitGame(id)) { selectDaily(id); return; }
    state.game = id;
    state.fixed = [];
    state.excluded = [];
    state.combos = null;
    var dateInput = $("dateInput");
    dateInput.min = gameMeta().from;
    dateInput.max = gameMeta().to;
    renderGameBar();
    renderHero();
    renderLatest();
    renderHistory();
    renderTrend();
    $("dateResult").innerHTML = "";
    state.dateQuery = "";
    if (state.tab === "stats") renderStats();
    renderNumGrid();
    renderCombos();
    showGenStatus("");
  }

  /* ---------- daily digit games ---------- */
  function selectDaily(id) {
    var g = Core.getDigitGame(id);
    if (!g) return;
    state.game = id;
    state.fixed = [];
    state.excluded = [];
    state.combos = null;
    renderGameBar();
    paintTabs();
    if (window.PCSODaily) window.PCSODaily.selectGame(id);
  }

  /* ---------- events ---------- */
  function bind() {
    $("tabBar").addEventListener("click", function (e) {
      var tb = e.target.closest(".tab");
      if (tb) selectTab(tb.dataset.tab, true);
    });
    document.addEventListener("click", function (e) {
      var link = e.target.closest("[data-tab-link]");
      if (!link) return;
      e.preventDefault();
      selectTab(link.dataset.tabLink, true);
    });
    $("historyCount").addEventListener("change", renderHistory);
    $("dateForm").addEventListener("submit", function (e) {
      e.preventDefault();
      renderDateResult($("dateInput").value);
    });
    $("btnDateReset").addEventListener("click", function () {
      $("dateInput").value = latest().d;
      renderDateResult(latest().d);
    });
    $("rangeSeg").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-range]");
      if (!b) return;
      state.range = Number(b.dataset.range);
      var btns = $("rangeSeg").querySelectorAll("button");
      for (var i = 0; i < btns.length; i++) btns[i].classList.toggle("is-active", btns[i] === b);
      renderStats();
    });
    $("paintMode").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-mode]");
      if (!b) return;
      state.paint = b.dataset.mode;
      var btns = $("paintMode").querySelectorAll("button");
      for (var i = 0; i < btns.length; i++) btns[i].classList.toggle("is-active", btns[i] === b);
    });
    $("btnGenerate").addEventListener("click", renderGenerator);
    $("btnClear").addEventListener("click", function () {
      state.fixed = [];
      state.excluded = [];
      $("oddEven").value = "any";
      $("noConsec").checked = false;
      paintNumGrid();
      showGenStatus("");
    });
    $("amountInput").addEventListener("input", renderCalc);
    document.addEventListener("click", function (e) {
      var q = e.target.closest(".quick");
      if (!q) return;
      $("amountInput").value = String(q.dataset.amount);
      renderCalc();
    });
  }

  /* ---------- full render (also used when the language changes) ---------- */
  function renderAll() {
    renderGameBar();
    renderHero();
    renderLatest();
    renderHistory();
    renderTrend();
    renderStats();
    renderNumGrid();
    renderCombos();
    renderQuickJackpots();
    renderOddsTable();
    renderCalc();
    renderDateResult(state.dateQuery || $("dateInput").value);
    paintTabs();
    showGenStatus(state.comboNote, !!state.comboNote);
    if (window.PCSODaily) window.PCSODaily.renderAll();
  }

  /* ---------- boot ---------- */
  function boot() {
    renderGameBar();
    renderHero();
    renderLatest();
    renderHistory();
    renderTrend();
    renderStats();
    renderNumGrid();
    renderQuickJackpots();
    renderOddsTable();
    renderCalc();
    renderCombos();
    bind();
    $("dateInput").value = latest().d;
    renderDateResult(latest().d);
    var hash = (location.hash || "").replace("#", "");
    if (hash) {
      var map = { results: "results", statistics: "stats", stats: "stats", generator: "generator", tax: "calc", calc: "calc" };
      if (map[hash]) selectTab(map[hash]);
    }
    paintTabs();
    if (window.PCSODaily) window.PCSODaily.boot();
  }

  window.PCSOApp = { renderAll: renderAll, boot: boot, state: state,
                     selectDaily: selectDaily, selectTab: selectTab };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
