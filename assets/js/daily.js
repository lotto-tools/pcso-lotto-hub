/* =============================================================
   PCSO Lotto Hub — daily digit games (3D Lotto / Swertres · 2D Lotto / EZ2)
   Renders the second family of games: three draws a day (2:00 PM, 5:00 PM,
   9:00 PM PHT) with a fixed prize per ₱10 play. Everything is drawn from
   window.PCSO_DATA (real PCSO draws) through window.PCSOCore; every string
   comes from window.PCSO_I18N, so the section follows the page language.
   ============================================================= */
(function () {
  "use strict";

  var DATA = window.PCSO_DATA;
  var Core = window.PCSOCore;
  var I18N = window.PCSO_I18N;
  if (!DATA || !Core || !Core.DIGIT_GAMES) return;

  var META = DATA.meta;
  var DRAWS = DATA.draws;

  /* ---------- language ---------- */
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
  function peso(n) { return Core.formatPeso(n, true); }
  function date(iso) { return Core.formatDate(iso, lang()); }
  function dateShort(iso) { return Core.formatDateShort(iso, lang()); }
  function longWd(iso) { return Core.longWeekday(iso, lang()); }
  function num(n) { return Core.formatNumber(n); }

  var YT_CHANNEL = "https://www.youtube.com/@PCSOGOVPHOfficial/streams";

  /* ---------- state, one bucket per game ---------- */
  var STATE = {};
  function st(id) {
    if (!STATE[id]) {
      STATE[id] = { range: 50, include: [], excluded: [], shape: "any",
                    paint: "fixed", combos: null, note: "", dateQuery: "" };
    }
    return STATE[id];
  }
  function activeId() {
    var a = window.PCSOApp && window.PCSOApp.state ? window.PCSOApp.state.game : null;
    return Core.getDigitGame(a) ? a : null;
  }
  function game() { return Core.getDigitGame(activeId()) || Core.DIGIT_GAMES[0]; }
  function meta() { return META.games[game().id]; }
  function draws() { return DRAWS[game().id] || []; }
  function latest() { var d = draws(); return d[d.length - 1]; }
  function isDaily() { return !!Core.getDigitGame(activeId()); }

  /* ---------- drawing the digits ---------- */
  function tiles(nums, size) {
    var row = el("div", "digits-row");
    for (var i = 0; i < nums.length; i++) {
      var tile = el("span", "digit-tile" + (size ? " digit-tile--" + size : ""), String(nums[i]));
      tile.setAttribute("aria-label", t("d.numAria", { n: nums[i] }));
      row.appendChild(tile);
    }
    return row;
  }

  /* ---------- YouTube: PCSO 3D Lotto {date} {2PM|5PM|9PM} ---------- */
  function ytQuery(g, iso, slot) {
    return "PCSO " + (g.yt || g.name) + " " + iso + " " + Core.slotShort(slot);
  }
  function ytUrl(g, iso, slot) {
    return "https://www.youtube.com/results?search_query=" +
      encodeURIComponent(ytQuery(g, iso, slot)).replace(/%20/g, "+");
  }
  function ytLink(g, iso, slot, cls, label) {
    var a = el("a", cls, label || t("d.watchDraw"));
    a.href = ytUrl(g, iso, slot);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label",
      t("d.dailyWatchAria", { game: g.name, date: date(iso), slot: Core.slotLabel(slot) }));
    return a;
  }
  function channelLink(cls) {
    var a = el("a", cls || "btn btn--sm btn--ghost", t("d.channel"));
    a.href = YT_CHANNEL;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", t("d.channelAria"));
    return a;
  }

  function winnersText(n) {
    return n === 1 ? t("d.dailyWinnersOne", { n: n }) : t("d.dailyWinnersMany", { n: n });
  }

  /* =========================================================
     HERO — the same card as the six-number games, in digits
     ========================================================= */
  function renderHero() {
    var g = game(), m = meta(), d = latest();
    if (!$("heroGameName") || !d) return;
    $("heroGameName").textContent = g.name;
    $("heroDrawDate").textContent = t("d.dailyLatest", {
      slot: Core.slotLabel(d.t), wd: Core.weekday(d.d, lang()), date: date(d.d)
    });
    var box = $("heroBalls");
    box.innerHTML = "";
    box.appendChild(tiles(d.n, "sm"));
    if ($("heroPrizeLabel")) $("heroPrizeLabel").textContent = t("d.dailyHeroPrize");
    if ($("heroNetLabel")) $("heroNetLabel").textContent = t("d.dailyHeroNet");
    $("heroJackpot").textContent = peso(d.j);
    $("heroNet").textContent = peso(Core.calcTax(d.j).net);
    $("heroWinners").textContent = winnersText(d.w);
    var next = Core.nextDailyDraw(g, lang());
    $("heroNextDraw").textContent = t("d.dailyNext", { label: next.label });
    $("heroCount").textContent = t("d.dailyStored", { n: num(m.count), days: num(m.days) });
    if ($("dataUpdated")) $("dataUpdated").textContent = date(META.collectedAt);
  }

  /* =========================================================
     RESULTS
     ========================================================= */
  function renderLatest() {
    var g = game(), m = meta(), d = latest();
    if (!d) return;
    $("dailyLatestTitle").textContent = t("d.dailyTitleLatest", { game: g.name });
    $("dailyLatestDate").textContent = Core.slotLabel(d.t) + " · " +
      longWd(d.d) + ", " + date(d.d);
    $("dailyStored").textContent = t("d.dailyStored", { n: num(m.count), days: num(m.days) });

    var box = $("dailyLatestDigits");
    box.innerHTML = "";
    box.appendChild(tiles(d.n, "lg"));

    $("dailyPrize").textContent = peso(d.j);
    $("dailyWinners").innerHTML = num(d.w) + "<small>" +
      t("d.dailySlotWinnersSmall", { slot: Core.slotLabel(d.t) }) + "</small>";
    $("dailyNet").innerHTML = peso(Core.calcTax(d.j).net) + "<small>" +
      t("d.dailyTaxFree") + "</small>";
    $("dailyNext").textContent = Core.nextDailyDraw(g, lang()).label;

    var vbox = $("dailyVideoLinks");
    vbox.innerHTML = "";
    vbox.appendChild(ytLink(g, d.d, d.t, "btn btn--sm btn--primary"));
    vbox.appendChild(channelLink());
  }

  function renderToday() {
    var g = game(), m = meta(), list = draws(), box = $("dailyToday");
    if (!box) return;
    box.innerHTML = "";
    var today = Core.manilaNow().iso;
    var todayRows = {}, anyToday = false;
    for (var i = 0; i < list.length; i++) {
      if (list[i].d === today) { todayRows[list[i].t] = list[i]; anyToday = true; }
    }
    /* before the 2:00 PM draw of a new day there is nothing for today yet, so
       the newest day that does have results is shown, with a note saying so */
    var shown = anyToday ? today : (latest() ? latest().d : today);
    var rows = {};
    for (i = 0; i < list.length; i++) {
      if (list[i].d === shown) rows[list[i].t] = list[i];
    }
    $("dailyTodayDate").textContent = longWd(shown) + ", " + date(shown);

    var slots = g.times.slice().reverse();
    slots.forEach(function (slot) {
      var card = el("div", "slot-card");
      var head = el("div", "slot-head");
      head.appendChild(el("b", null, Core.slotLabel(slot)));
      if (rows[slot]) {
        var w = rows[slot].w;
        head.appendChild(el("span", "badge badge--green", w === 1
          ? t("d.winnersOne") : t("d.winnersMany", { n: num(w) })));
      } else {
        head.appendChild(el("span", "badge", t("d.dailySlotNoDraw")));
      }
      card.appendChild(head);
      if (rows[slot]) {
        card.appendChild(tiles(rows[slot].n, "sm"));
        card.appendChild(el("p", "table-note",
          peso(rows[slot].j) + " · " + t("d.dailyPer10")));
        var vid = el("div", "video-row");
        vid.appendChild(ytLink(g, rows[slot].d, slot, "video-link"));
        card.appendChild(vid);
      } else {
        var dash = el("div", "digits-row");
        for (var k = 0; k < g.digits; k++) dash.appendChild(el("span", "digit-tile digit-tile--sm", "—"));
        card.appendChild(dash);
      }
      box.appendChild(card);
    });

    var note = $("dailyTodayNote");
    note.textContent = anyToday ? ""
      : t("d.dailyEmptyToday", { date: date(latest() ? latest().d : shown) });
  }

  function renderPrize() {
    var g = game(), body = $("dailyPrizeBody");
    if (!body) return;
    body.innerHTML = "";
    var odds = Core.digitOdds(g);
    function row(label, odd, prize) {
      var tr = el("tr");
      tr.appendChild(el("td", null, label));
      tr.appendChild(el("td", "num", odd ? t("d.dailyOdds", { n: num(odd) }) : "—"));
      tr.appendChild(el("td", "num", prize ? peso(prize) : "—"));
      body.appendChild(tr);
    }
    row(t("d.dailyPrizeStd"), odds.standard, g.prize);
    if (g.rambolito && g.rambolito.different)
      row(g.digits === 3 ? t("d.dailyPrizeRamDiff") : t("d.dailyPrizeRamAny"),
          odds.rambolitoDifferent, g.rambolito.different);
    if (g.rambolito && g.rambolito.pair)
      row(t("d.dailyPrizeRamPair"), odds.rambolitoPair, g.rambolito.pair);
    $("dailyPrizeNote").textContent = t("d.dailyPer10") + " · " + t("d.dailyTaxFree");
  }

  function renderHistory() {
    var g = game(), list = draws();
    var n = Number($("dailyHistoryCount").value);
    var rows = n > 0 ? list.slice(list.length - n) : list;
    if (!rows.length) return;
    $("dailyHistoryLabel").textContent = t(n > 0 ? "d.historyLast" : "d.historyAll", {
      n: num(rows.length), from: date(rows[0].d), to: date(rows[rows.length - 1].d)
    });
    var body = $("dailyHistoryBody");
    body.innerHTML = "";
    for (var i = rows.length - 1; i >= 0; i--) {
      var d = rows[i];
      var tr = el("tr", i === rows.length - 1 ? "is-high" : "");
      tr.appendChild(el("td", null, date(d.d)));
      tr.appendChild(el("td", null, Core.slotLabel(d.t)));
      tr.appendChild(el("td", null, Core.weekday(d.d, lang())));
      var tdNums = el("td");
      var row = el("div", "digits-row");
      for (var k = 0; k < d.n.length; k++)
        row.appendChild(el("span", "digit-tile digit-tile--xs", String(d.n[k])));
      tdNums.appendChild(row);
      tr.appendChild(tdNums);
      tr.appendChild(el("td", "num", peso(d.j)));
      tr.appendChild(el("td", "num", num(d.w)));
      var tdVid = el("td", "video-cell");
      tdVid.appendChild(ytLink(g, d.d, d.t, "video-link"));
      tr.appendChild(tdVid);
      body.appendChild(tr);
    }
  }

  function renderDateResult(iso) {
    var g = game(), box = $("dailyDateResult");
    if (!box) return;
    box.innerHTML = "";
    if (!iso) {
      box.appendChild(el("p", "table-note", t("d.pickDate")));
      return;
    }
    var found = Core.findDailyDate(draws(), iso);
    if (!found.rows.length) {
      box.appendChild(el("p", "table-note", t("d.noDraw")));
      return;
    }
    var card = el("div", "slot-card");
    var head = el("div", "slot-head");
    head.appendChild(el("strong", null, longWd(found.date) + ", " + date(found.date)));
    head.appendChild(el("span", "badge" + (found.exact ? " badge--green" : " badge--gold"),
      found.exact ? t("d.exactDraw") : t("d.noDrawDay")));
    card.appendChild(head);
    found.rows.forEach(function (d) {
      var line = el("div", "slot-line");
      line.appendChild(el("span", "slot-time", Core.slotLabel(d.t)));
      line.appendChild(tiles(d.n, "xs"));
      line.appendChild(el("span", "slot-meta", t("d.winnersMany", { n: num(d.w) })));
      var v = el("span", "slot-video");
      v.appendChild(ytLink(g, d.d, d.t, "video-link"));
      line.appendChild(v);
      card.appendChild(line);
    });
    if (!found.exact) {
      var why = found.direction === "after"
        ? t("d.whyAfter", { date: date(iso) })
        : t("d.whyBefore", { game: g.short, date: date(iso) });
      card.appendChild(el("p", "table-note", why));
    }
    box.appendChild(card);
  }

  /* =========================================================
     STATISTICS
     ========================================================= */
  function ratioRow(label, count, total, tone) {
    var row = el("div", "ratio-row");
    row.appendChild(el("span", "label", label));
    var bar = el("div", "bar");
    var i = el("i", tone === "warm" ? "warm" : "");
    i.style.width = total ? (100 * count / total).toFixed(2) + "%" : "0%";
    bar.appendChild(i);
    row.appendChild(bar);
    var val = el("span", "val");
    val.appendChild(el("b", null, num(count)));
    val.appendChild(document.createTextNode(" · " +
      (total ? (100 * count / total).toFixed(1) + "%" : "0%")));
    row.appendChild(val);
    return row;
  }

  function chip(box, label, count, cls, title) {
    var c = el("span", "chip " + cls);
    c.appendChild(el("b", null, String(label)));
    c.appendChild(document.createTextNode(" ×" + num(count)));
    if (title) c.title = title;
    box.appendChild(c);
  }

  function renderStats() {
    var g = game(), s = st(game().id);
    var a = Core.analyzeDigits(draws(), g, s.range);
    $("dailyStatsTitle").textContent = t("d.dailyTitleStats", { game: g.name });
    $("dailyStatsRange").textContent = a.size
      ? t(s.range ? "d.statsRangeLast" : "d.statsRangeAll",
          { n: num(a.size), from: date(a.from), to: date(a.to) })
      : t("d.notEnough");
    $("dailyStatsSize").textContent = num(a.size);
    $("dailyStatsExpected").textContent = a.expected.toFixed(1);
    var hot = a.hot[0], over = a.overdue[0];
    $("dailyStatsHot").innerHTML = String(hot ? hot.n : "—") + "<small>" +
      t("d.dailyHotTopSmall") + "</small>";
    $("dailyStatsOverdue").innerHTML = String(over ? over.n : "—") + "<small>" +
      t("d.overdueSmall", { n: over ? over.gap : 0 }) + "</small>";

    /* heatmap over the numbers this game can draw */
    var heat = $("dailyHeatmap");
    heat.innerHTML = "";
    var count = a.hi - a.lo + 1;
    heat.style.setProperty("--cols", count > 20 ? "10" : String(Math.min(10, count)));
    var lo = Infinity, hi = -Infinity;
    for (var v = a.lo; v <= a.hi; v++) {
      lo = Math.min(lo, a.freq[v - a.lo]);
      hi = Math.max(hi, a.freq[v - a.lo]);
    }
    if (!isFinite(lo)) { lo = hi = 0; }
    for (v = a.lo; v <= a.hi; v++) {
      var c = a.freq[v - a.lo];
      var tt = hi === lo ? .35 : (c - lo) / (hi - lo);
      var cell = el("div", "hm");
      cell.style.background = "hsl(222 78% " + (96 - 46 * tt).toFixed(1) + "%)";
      cell.style.color = tt > .55 ? "#fff" : "#0f172a";
      cell.title = t("d.heatCell", { n: Core.padDigit(v, g), c: num(c), size: num(a.size) });
      cell.appendChild(el("b", null, Core.padDigit(v, g)));
      cell.appendChild(el("span", null, num(c)));
      heat.appendChild(cell);
    }
    var legend = $("dailyHeatLegend");
    legend.innerHTML = "";
    [t("d.legendFewest"), t("d.legendAverage", { x: a.expected.toFixed(1) }), t("d.legendMost")]
      .forEach(function (label, i) {
        var c = el("span", "chip", label);
        c.style.background = "hsl(222 78% " + [96, 73, 50][i] + "%)";
        c.style.color = i === 2 ? "#fff" : "var(--ink-2)";
        c.style.border = "0";
        legend.appendChild(c);
      });

    var hotBox = $("dailyHotChips"), coldBox = $("dailyColdChips"), overBox = $("dailyOverdueChips");
    hotBox.innerHTML = ""; coldBox.innerHTML = ""; overBox.innerHTML = "";
    a.hot.forEach(function (x) {
      chip(hotBox, Core.padDigit(x.n, g), x.count, "hot",
        t("d.chipHot", { n: Core.padDigit(x.n, g), c: num(x.count) }));
    });
    a.cold.forEach(function (x) {
      chip(coldBox, Core.padDigit(x.n, g), x.count, "cold",
        t("d.chipHot", { n: Core.padDigit(x.n, g), c: num(x.count) }));
    });
    a.overdue.forEach(function (x) {
      chip(overBox, Core.padDigit(x.n, g), x.gap, "overdue",
        t("d.chipOverdue", { n: Core.padDigit(x.n, g), g: num(x.gap) }));
    });
    if (!overBox.children.length)
      overBox.appendChild(el("span", "table-note", t("d.notEnough")));

    /* position by position */
    var head = $("dailyPosHead"), body = $("dailyPosBody");
    head.innerHTML = ""; body.innerHTML = "";
    var htr = el("tr");
    htr.appendChild(el("th", null, ""));
    for (v = a.lo; v <= a.hi; v++) htr.appendChild(el("th", "num", Core.padDigit(v, g)));
    head.appendChild(htr);
    for (var p = 0; p < g.digits; p++) {
      var tr = el("tr");
      tr.appendChild(el("th", null, t("d.dailyPos", { i: p + 1 })));
      for (v = a.lo; v <= a.hi; v++) tr.appendChild(el("td", "num", num(a.posFreq[p][v - a.lo])));
      body.appendChild(tr);
    }

    /* shape distribution */
    var shapeBox = $("dailyShapeChart");
    shapeBox.innerHTML = "";
    var shapes = [];
    if (g.digits === 3) {
      shapes.push([t("d.dailyShapeAllDiff3"), a.shapes.allDiff]);
      shapes.push([t("d.dailyShapeOnePair"), a.shapes.onePair]);
      shapes.push([t("d.dailyShapeAllSame3"), a.shapes.allSame]);
    } else {
      shapes.push([t("d.dailyShapeDiff2"), a.shapes.allDiff]);
      shapes.push([t("d.dailyShapeSame2"), a.shapes.allSame]);
    }
    shapes.forEach(function (row) {
      shapeBox.appendChild(ratioRow(row[0], row[1], a.size, ""));
    });
  }

  /* =========================================================
     COMBINATION PICKER
     ========================================================= */
  function pool(s, g) {
    var out = [], v;
    for (v = g.minValue; v <= g.maxValue; v++) {
      if (s.include.length && s.include.indexOf(v) === -1) continue;
      if (s.excluded.indexOf(v) !== -1) continue;
      out.push(v);
    }
    return out;
  }

  function renderShapeSelect() {
    var g = game(), s = st(game().id), sel = $("dailyShape");
    sel.innerHTML = "";
    var opts = [[ "any", t("d.dailyShapeAny") ]];
    if (g.digits === 3) {
      opts.push(["allDiff", t("d.dailyShapeAllDiff3")]);
      opts.push(["onePair", t("d.dailyShapeOnePair")]);
      opts.push(["allSame", t("d.dailyShapeAllSame3")]);
    } else {
      opts.push(["allDiff", t("d.dailyShapeDiff2")]);
      opts.push(["allSame", t("d.dailyShapeSame2")]);
    }
    opts.forEach(function (o) {
      var b = el("option", null, o[1]);
      b.value = o[0];
      sel.appendChild(b);
    });
    sel.value = s.shape;
  }

  function renderNumGrid() {
    var g = game(), s = st(game().id), grid = $("dailyNumGrid");
    grid.innerHTML = "";
    var count = g.maxValue - g.minValue + 1;
    grid.className = "num-grid num-grid--digits";
    grid.style.setProperty("--cols", count > 20 ? "8" : "10");
    for (var v = g.minValue; v <= g.maxValue; v++) {
      var b = el("button", "num-btn", Core.padDigit(v, g));
      b.type = "button";
      b.dataset.num = v;
      grid.appendChild(b);
    }
    paintNumGrid();
    $("dailyGenTitle").textContent = t("d.dailyTitleGen", { game: g.name });
    var odds = Core.digitOdds(g);
    $("dailyOddsLine").textContent = t("d.dailyOdds", { n: num(odds.standard) }) + " · " +
      t("d.dailyOddsNote");
  }

  function paintNumGrid() {
    var g = game(), s = st(game().id);
    var btns = $("dailyNumGrid").querySelectorAll(".num-btn");
    for (var i = 0; i < btns.length; i++) {
      var v = Number(btns[i].dataset.num);
      var inPlay = pool(s, g).indexOf(v) !== -1;
      btns[i].classList.toggle("is-fixed", s.include.indexOf(v) !== -1);
      btns[i].classList.toggle("is-excluded", s.excluded.indexOf(v) !== -1 ||
        (s.include.length > 0 && s.include.indexOf(v) === -1));
      btns[i].setAttribute("aria-pressed", inPlay ? "false" : "true");
    }
    var p = pool(s, g);
    $("dailyPickSummary").textContent = t("d.dailyPool", {
      list: p.length === g.maxValue - g.minValue + 1 ? t("d.dailyAllNumbers")
        : p.map(function (x) { return Core.padDigit(x, g); }).join(", ")
    }) + " · " + t("d.dailyExcludedList", {
      list: s.excluded.length
        ? s.excluded.slice().sort(function (a, b) { return a - b; })
            .map(function (x) { return Core.padDigit(x, g); }).join(", ")
        : t("d.none")
    });
  }

  function onNumClick(e) {
    var g = game(), s = st(game().id);
    var v = Number(e.currentTarget.dataset.num);
    if (s.paint === "fixed") {
      var at = s.include.indexOf(v);
      if (at !== -1) s.include.splice(at, 1);
      else s.include.push(v);
    } else {
      var ex = s.excluded.indexOf(v);
      if (ex !== -1) s.excluded.splice(ex, 1);
      else s.excluded.push(v);
    }
    showStatus("");
    paintNumGrid();
  }

  function showStatus(msg, isErr) {
    var box = $("dailyGenStatus");
    if (!box) return;
    if (!msg) { box.style.display = "none"; box.textContent = ""; return; }
    box.style.display = "flex";
    box.className = "notice" + (isErr ? " notice--warn" : "");
    box.textContent = msg;
  }

  function renderGenerator() {
    var g = game(), s = st(game().id);
    var excluded = [];
    for (var v = g.minValue; v <= g.maxValue; v++) if (pool(s, g).indexOf(v) === -1) excluded.push(v);
    var res = Core.generateDigits({ game: g, excluded: excluded, shape: s.shape, count: 5 });
    if (res.error) {
      s.combos = null;
      var msg = res.errorKey ? t(res.errorKey, res.errorVars) : res.error;
      showStatus(msg, true);
      var box = $("dailyGameList");
      box.innerHTML = "";
      box.appendChild(el("div", "empty", msg));
      return;
    }
    s.combos = res.games;
    s.note = res.partial ? t("d.genPartial", { n: res.games.length }) : "";
    showStatus(s.note, res.partial);
    renderCombos();
  }

  function renderCombos() {
    var g = game(), s = st(game().id);
    var box = $("dailyGameList");
    box.innerHTML = "";
    if (!s.combos) {
      var empty = el("div", "empty");
      empty.appendChild(el("strong", null, t("d.dailyEmptyTitle")));
      empty.appendChild(document.createTextNode(t("d.dailyEmptyDesc")));
      box.appendChild(empty);
      return;
    }
    var list = draws();
    s.combos.forEach(function (combo, idx) {
      var card = el("div", "game");
      var top = el("div", "game-top");
      top.appendChild(el("span", "game-no", "#" + (idx + 1)));
      top.appendChild(tiles(combo, "sm"));
      var btn = el("button", "btn btn--sm", t("d.details"));
      btn.type = "button";
      top.appendChild(btn);
      card.appendChild(top);

      var hist = Core.checkDigitHistory(combo, list, g);
      var line = el("div", "match-line");
      line.appendChild(el("span", null, t("d.checkedAgainst", { n: num(list.length) })));
      var chipA = el("span", "m" + (hist.straightCount ? " hit" : ""),
        t("d.dailyStraightChip", { m: hist.straightCount }));
      line.appendChild(chipA);
      if (hist.rambolitoPrize) {
        var chipB = el("span", "m" + (hist.rambolitoCount ? " hit" : ""),
          t("d.dailyRambolitoChip", { m: hist.rambolitoCount }));
        line.appendChild(chipB);
      }
      card.appendChild(line);

      var detail = el("div", "hit-list");
      detail.style.display = "none";
      if (!hist.total) detail.appendChild(el("div", "hit", t("d.dailyNoHistory")));
      hist.straight.forEach(function (h) {
        detail.appendChild(hitRow(t("d.dailyHitStraight"), h));
      });
      hist.rambolito.forEach(function (h) {
        detail.appendChild(hitRow(t("d.dailyHitRambolito"), h));
      });
      card.appendChild(detail);
      btn.addEventListener("click", function () {
        var open = detail.style.display === "none";
        detail.style.display = open ? "grid" : "none";
        btn.textContent = open ? t("d.hide") : t("d.details");
      });
      box.appendChild(card);
    });
  }

  function hitRow(label, h) {
    var row = el("div", "hit");
    row.appendChild(el("span", "r", label));
    row.appendChild(el("span", "d", dateShort(h.d) + " · " + Core.slotLabel(h.t)));
    var tilesRow = el("span", "digits-row");
    for (var i = 0; i < h.n.length; i++)
      tilesRow.appendChild(el("span", "digit-tile digit-tile--xs", String(h.n[i])));
    row.appendChild(tilesRow);
    row.appendChild(el("span", "p", t("d.winnersMany", { n: num(h.w) })));
    return row;
  }

  /* =========================================================
     OVERVIEW (always visible, under the five jackpot games)
     ========================================================= */
  function renderOverview() {
    var body = $("dailyOverviewBody");
    if (!body) return;
    body.innerHTML = "";
    Core.DIGIT_GAMES.forEach(function (g) {
      var m = META.games[g.id];
      if (!m) return;
      var tr = el("tr");
      tr.appendChild(el("td", null, g.name));
      tr.appendChild(el("td", "num", g.digits === 3 ? t("d.dailyRange3") : t("d.dailyRange2")));
      tr.appendChild(el("td", null, g.timeLabels.join(" · ")));
      tr.appendChild(el("td", "num", peso(g.prize)));
      tr.appendChild(el("td", "num", t("d.storedCell", {
        n: num(m.count), from: dateShort(m.from), to: dateShort(m.to)
      })));
      var td = el("td");
      var b = el("button", "btn btn--sm", t("daily.open"));
      b.type = "button";
      b.dataset.dailyLink = g.id;
      td.appendChild(b);
      tr.appendChild(td);
      body.appendChild(tr);
    });
    /* the header of the second column names the numbers, keep it in the page language */
  }

  /* =========================================================
     WIRING
     ========================================================= */
  function selectGame(id, opts) {
    var g = Core.getDigitGame(id);
    if (!g) return;
    var input = $("dailyDateInput");
    var m = META.games[id];
    if (input) {
      input.min = m.from;
      input.max = m.to;
      input.value = latest() ? latest().d : m.to;
    }
    renderAll();
    if (!opts || opts.resetDate !== false) renderDateResult(latest() ? latest().d : null);
  }

  function renderTab(name) {
    if (name === "stats") renderStats();
    else if (name === "generator") { renderShapeSelect(); renderNumGrid(); renderCombos(); }
  }

  function renderAll() {
    renderOverview();
    if (!isDaily()) return;
    renderHero();
    renderLatest();
    renderToday();
    renderPrize();
    renderHistory();
    renderShapeSelect();
    renderNumGrid();
    renderCombos();
    renderStats();
    renderDateResult(latest() ? latest().d : null);
  }

  function bind() {
    if (bind.done) return;
    bind.done = true;

    var form = $("dailyDateForm");
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      renderDateResult($("dailyDateInput").value);
    });
    if ($("dailyBtnLatest")) $("dailyBtnLatest").addEventListener("click", function () {
      var d = latest();
      if (!d) return;
      $("dailyDateInput").value = d.d;
      renderDateResult(d.d);
    });
    if ($("dailyHistoryCount")) $("dailyHistoryCount").addEventListener("change", renderHistory);
    if ($("dailyRangeSeg")) $("dailyRangeSeg").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-range]");
      if (!b) return;
      st(game().id).range = Number(b.dataset.range);
      var btns = $("dailyRangeSeg").querySelectorAll("button");
      for (var i = 0; i < btns.length; i++) btns[i].classList.toggle("is-active", btns[i] === b);
      renderStats();
    });
    if ($("dailyPaintMode")) $("dailyPaintMode").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-mode]");
      if (!b) return;
      st(game().id).paint = b.dataset.mode;
      var btns = $("dailyPaintMode").querySelectorAll("button");
      for (var i = 0; i < btns.length; i++) btns[i].classList.toggle("is-active", btns[i] === b);
    });
    if ($("dailyNumGrid")) $("dailyNumGrid").addEventListener("click", function (e) {
      var b = e.target.closest(".num-btn");
      if (b) onNumClick({ currentTarget: b });
    });
    if ($("dailyShape")) $("dailyShape").addEventListener("change", function () {
      st(game().id).shape = $("dailyShape").value;
    });
    if ($("dailyBtnGenerate")) $("dailyBtnGenerate").addEventListener("click", renderGenerator);
    if ($("dailyBtnClear")) $("dailyBtnClear").addEventListener("click", function () {
      var s = st(game().id);
      s.include = [];
      s.excluded = [];
      s.shape = "any";
      s.combos = null;
      $("dailyShape").value = "any";
      paintNumGrid();
      showStatus("");
      renderCombos();
    });
    document.addEventListener("click", function (e) {
      var link = e.target.closest("[data-daily-link]");
      if (!link) return;
      e.preventDefault();
      if (window.PCSOApp && window.PCSOApp.selectDaily) window.PCSOApp.selectDaily(link.dataset.dailyLink);
    });
  }

  window.PCSODaily = {
    isDaily: isDaily,
    game: game,
    selectGame: selectGame,
    renderAll: renderAll,
    renderTab: renderTab,
    renderHero: renderHero,
    renderOverview: renderOverview,
    boot: function () { bind(); renderAll(); }
  };
})();
