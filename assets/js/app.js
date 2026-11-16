/* =============================================================
   PCSO Lotto Hub — UI
   Renders everything from window.PCSO_DATA (real PCSO draws)
   and window.PCSOCore.
   ============================================================= */
(function () {
  "use strict";

  var DATA = window.PCSO_DATA;
  var Core = window.PCSOCore;
  if (!DATA || !Core) return;

  var META = DATA.meta;
  var DRAWS = DATA.draws;

  var state = {
    game: "658",
    tab: "results",
    range: 50,
    paint: "fixed",
    fixed: [],
    excluded: []
  };

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
    b.setAttribute("aria-label", "Number " + num);
    return b;
  }
  function balls(nums, max, size) {
    var row = el("div", "balls-row");
    for (var i = 0; i < nums.length; i++) row.appendChild(ball(nums[i], max, size));
    return row;
  }
  function peso(n) { return Core.formatPeso(n, true); }
  function pct(x) { return (x * 100).toFixed(1) + "%"; }

  function game() { return Core.getGame(state.game); }
  function gameMeta() { return META.games[state.game]; }
  function draws() { return DRAWS[state.game]; }
  function latest() { var d = draws(); return d[d.length - 1]; }

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
      b.title = g.name + " — jackpot " + peso(meta.latest.j);
      b.addEventListener("click", function () { selectGame(g.id); });
      bar.appendChild(b);
    });
  }

  /* ---------- hero ---------- */
  function renderHero() {
    var g = game(), d = latest(), m = gameMeta();
    $("heroGameName").textContent = g.name;
    $("heroDrawDate").textContent = "Latest draw · " + Core.weekday(d.d) + ", " +
      Core.formatDate(d.d) + " · 9:00 PM PHT";
    var ballsBox = $("heroBalls");
    ballsBox.innerHTML = "";
    ballsBox.appendChild(balls(d.n, g.max, "sm"));
    $("heroJackpot").textContent = peso(d.j);
    $("heroNet").textContent = peso(Core.calcTax(d.j).net);
    $("heroWinners").textContent = d.w === 0 ? "0 winners" : d.w + (d.w === 1 ? " winner" : " winners");
    $("heroNextDraw").textContent = "Next draw: " + Core.nextDraw(g).label;
    $("heroCount").textContent = m.count + " draws stored";
    $("dataUpdated").textContent = Core.formatDate(META.collectedAt);
  }

  /* ---------- results ---------- */
  function renderLatest() {
    var g = game(), d = latest(), m = gameMeta();
    $("latestGame").textContent = g.name + " — latest result";
    $("latestDate").textContent = Core.longWeekday(d.d) + ", " + Core.formatDate(d.d) + " · 9:00 PM PHT";
    $("latestDrawNo").textContent = m.count + " draws stored";
    var box = $("latestBalls");
    box.innerHTML = "";
    box.appendChild(balls(d.n, g.max, "lg"));
    $("latestJackpot").textContent = peso(d.j);
    var net = Core.calcTax(d.j);
    $("latestNet").innerHTML = peso(net.net) + "<small>after 20% final tax (" + peso(net.tax) + ")</small>";
    $("latestWinners").innerHTML = d.w + "<small>" +
      (d.w === 0 ? "nobody matched 6 of 6" : d.w === 1 ? "one ticket matched 6 of 6" : d.w + " tickets matched 6 of 6") + "</small>";
    $("latestSchedule").innerHTML = g.dayLabel + "<small>9:00 PM PHT</small>";

    var list = draws();
    var prior = list[list.length - 2];
    var box2 = $("priorDraw");
    box2.innerHTML = "";
    if (prior) {
      box2.appendChild(document.createTextNode(
        "Previous draw (" + Core.formatDate(prior.d) + "): " + prior.n.map(function (n) {
          return String(n).padStart(2, "0");
        }).join(" · ") + " — jackpot " + peso(prior.j) + ". "));
      var b = el("button", "btn btn--sm btn--ghost", "Show all draws");
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
    $("historyRangeLabel").textContent = (n > 0 ? "Last " + rows.length : "All " + rows.length) +
      " stored draws · " + Core.formatDate(rows[0].d) + " – " +
      Core.formatDate(rows[rows.length - 1].d);
    var body = $("historyBody");
    body.innerHTML = "";
    for (var i = rows.length - 1; i >= 0; i--) {
      var d = rows[i];
      var tr = el("tr", i === rows.length - 1 ? "is-high" : "");
      var tdDate = el("td", null, Core.formatDate(d.d));
      var tdDay = el("td", null, Core.weekday(d.d));
      var tdNums = el("td");
      var row = el("div", "balls-row");
      for (var k = 0; k < d.n.length; k++) row.appendChild(ball(d.n[k], g.max, "xs"));
      tdNums.appendChild(row);
      var tdJ = el("td", "num", peso(d.j));
      var tdW = el("td", "num", String(d.w));
      var tdNet = el("td", "num", peso(Core.calcTax(d.j).net));
      tr.appendChild(tdDate); tr.appendChild(tdDay); tr.appendChild(tdNums);
      tr.appendChild(tdJ); tr.appendChild(tdW); tr.appendChild(tdNet);
      body.appendChild(tr);
    }
  }

  function renderTrend() {
    var g = game();
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
      b.title = Core.formatDate(p.d) + " · " + peso(p.j) + (p.w > 0 ? " · " + p.w + " jackpot winner" + (p.w === 1 ? "" : "s") : "");
      b.setAttribute("aria-label", b.title);
      wrap.appendChild(b);
    });
    box.appendChild(wrap);
    var foot = el("p", "table-note", "30 draws · lowest " + Core.shortPeso(min) +
      " · highest " + Core.shortPeso(max) + " · latest " + peso(pts[pts.length - 1].j) +
      ". Gold bars mark draws a jackpot was won and the prize reset.");
    box.appendChild(foot);
  }

  function renderDateResult(iso) {
    var g = game(), list = draws(), box = $("dateResult");
    box.innerHTML = "";
    if (!iso) { box.appendChild(el("p", "table-note", "Pick a date to see that draw.")); return; }
    var found = Core.findByDate(list, iso);
    if (!found.draw) { box.appendChild(el("p", "table-note", "No stored draw found.")); return; }
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
    head.appendChild(el("strong", null, Core.weekday(d.d) + ", " + Core.formatDate(d.d)));
    head.appendChild(el("span", "badge" + (found.exact ? " badge--green" : " badge--gold"),
      found.exact ? "Exact draw date" : "No draw that day"));
    card.appendChild(head);
    var row = balls(d.n, g.max, "sm");
    row.style.margin = "10px 0";
    card.appendChild(row);
    var net = Core.calcTax(d.j);
    var why = "";
    if (!found.exact) {
      why = found.direction === "after"
        ? " — the earliest draw in our database, shown because " + Core.formatDate(iso) +
          " is before our coverage starts."
        : " — the closest earlier draw, shown because " + g.short + " does not draw on " +
          Core.formatDate(iso) + ".";
    }
    card.appendChild(el("p", "table-note", "Jackpot " + peso(d.j) + " · " + d.w +
      " jackpot winner" + (d.w === 1 ? "" : "s") + " · net after 20% tax " + peso(net.net) + why));
    box.appendChild(card);
  }

  /* ---------- statistics ---------- */
  function renderStats() {
    var g = game();
    var a = Core.analyze(draws(), g.max, state.range);
    $("statsTitle").textContent = g.name + " — number statistics";
    $("statsRangeLabel").textContent = (state.range ? "Last " + a.size : "All " + a.size) +
      " draws · " + Core.formatDate(a.from) + " – " + Core.formatDate(a.to);
    $("statsSize").textContent = String(a.size);
    $("statsExpected").textContent = a.expected.toFixed(2);
    $("statsAvgSum").textContent = Math.round(a.avgSum);
    var top = a.overdue[0];
    $("statsOverdueTop").innerHTML = String(top.n) + "<small>" + top.gap + " draws since it appeared</small>";

    /* heatmap */
    var heat = $("heatmap");
    heat.innerHTML = "";
    heat.style.setProperty("--cols", g.max > 49 ? "10" : "9");
    var counts = [];
    for (var n = 1; n <= g.max; n++) counts.push(a.freq[n]);
    var lo = Math.min.apply(null, counts), hi = Math.max.apply(null, counts);
    for (var num = 1; num <= g.max; num++) {
      var c = a.freq[num];
      var t = hi === lo ? .35 : (c - lo) / (hi - lo);
      var cell = el("div", "hm");
      cell.style.background = "hsl(222 78% " + (96 - 46 * t).toFixed(1) + "%)";
      cell.style.color = t > .55 ? "#fff" : "#0f172a";
      cell.title = "Number " + num + ": " + c + " appearances in " + a.size + " draws";
      cell.appendChild(el("b", null, String(num)));
      cell.appendChild(el("span", null, String(c)));
      heat.appendChild(cell);
    }
    var legend = $("heatLegend");
    legend.innerHTML = "";
    ["Fewest", "Average " + a.expected.toFixed(1), "Most"].forEach(function (label, i) {
      var chip = el("span", "chip", label);
      chip.style.background = "hsl(222 78% " + [96, 73, 50][i] + "%)";
      chip.style.color = i === 2 ? "#fff" : "var(--ink-2)";
      chip.style.border = "0";
      legend.appendChild(chip);
    });

    renderChips($("hotChips"), a.hot, "hot", "×");
    renderChips($("coldChips"), a.cold, "cold", "×");
    renderChips($("overdueChips"), a.overdue.slice(0, 6), "overdue", " draws ago");

    /* odd / even */
    var oddBox = $("oddChart");
    oddBox.innerHTML = "";
    for (var o = 6; o >= 0; o--) {
      oddBox.appendChild(ratioRow(o + " odd · " + (6 - o) + " even", a.oddDist[o], a.size, o === 3 ? "" : "warm"));
    }
    /* low / high */
    $("lowHighDesc").textContent = "Low = 1 to " + a.lowMax + ", high = " + (a.lowMax + 1) +
      " to " + g.max + ". Each row is how many low numbers a winning draw carried.";
    var lowBox = $("lowChart");
    lowBox.innerHTML = "";
    for (var l = 6; l >= 0; l--) {
      lowBox.appendChild(ratioRow(l + " low · " + (6 - l) + " high", a.lowDist[l], a.size, ""));
    }

    /* sums */
    var sumBox = $("sumChart");
    sumBox.innerHTML = "";
    var maxBucket = Math.max.apply(null, a.sumBuckets.map(function (b) { return b.count; }));
    a.sumBuckets.forEach(function (b) {
      sumBox.appendChild(countRow(b.lo + "–" + b.hi, b.count, maxBucket, a.size));
    });
    var f = Core.sumFormula(g.max);
    $("sumDesc").textContent = "Total of the six winning numbers. Possible range " + f.min +
      "–" + f.max + "; average in this range " + a.avgSum.toFixed(1) + " (observed " +
      a.minSum + "–" + a.maxSum + ").";

    /* pairs */
    var pairBox = $("pairList");
    pairBox.innerHTML = "";
    if (!a.pairs.length) pairBox.appendChild(el("p", "table-note", "Not enough draws."));
    a.pairs.forEach(function (p) {
      var row = el("div", "pair-row");
      row.appendChild(el("span", "p", String(p.pair[0]).padStart(2, "0") + " · " + String(p.pair[1]).padStart(2, "0")));
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

  function renderChips(box, items, cls, suffix) {
    box.innerHTML = "";
    items.forEach(function (it) {
      var chip = el("span", "chip " + cls);
      var b = el("b", null, String(it.n));
      chip.appendChild(b);
      chip.appendChild(document.createTextNode(it.count !== undefined && suffix === "×"
        ? " ×" + it.count : " " + it.gap + suffix));
      if (suffix === "×") chip.title = "Number " + it.n + " appeared " + it.count + " times";
      else chip.title = "Number " + it.n + " last appeared " + it.gap + " draws ago";
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
    $("genTitle").textContent = g.name + " — smart picker";
    $("genOdds").textContent = "A single ticket has 1 chance in " +
      Core.formatNumber(Core.odds(g.max)) + " of matching all six numbers, whatever filters you use.";
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
    $("pickSummary").textContent = "Included: " +
      (state.fixed.length ? state.fixed.slice().sort(function (a, b) { return a - b; }).join(", ") : "none") +
      " · Excluded: " +
      (state.excluded.length ? state.excluded.slice().sort(function (a, b) { return a - b; }).join(", ") : "none");
  }

  function onNumClick(e) {
    var n = Number(e.currentTarget.dataset.num);
    var inFixed = state.fixed.indexOf(n), inExcl = state.excluded.indexOf(n);
    if (state.paint === "fixed") {
      if (inFixed !== -1) state.fixed.splice(inFixed, 1);
      else {
        if (state.fixed.length >= 5) { showGenStatus("You can include up to five fixed numbers — remove one first.", true); return; }
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
    var box = $("gameList");
    box.innerHTML = "";
    var res = Core.generate({
      max: g.max,
      fixed: state.fixed,
      excluded: state.excluded,
      oddEven: $("oddEven").value,
      noConsecutive: $("noConsec").checked,
      count: 5
    });
    if (res.error) {
      showGenStatus(res.error, true);
      box.appendChild(el("div", "empty", res.error));
      return;
    }
    showGenStatus(res.partial
      ? "Only " + res.games.length + " of 5 combinations fit those filters — loosen one filter to get five."
      : "", res.partial);
    var list = draws();
    res.games.forEach(function (combo, idx) {
      var card = el("div", "game");
      var top = el("div", "game-top");
      top.appendChild(el("span", "game-no", "#" + (idx + 1)));
      top.appendChild(balls(combo, g.max, "sm"));
      var btn = el("button", "btn btn--sm", "Details");
      btn.type = "button";
      top.appendChild(btn);
      card.appendChild(top);

      var hist = Core.checkHistory(combo, list);
      var line = el("div", "match-line");
      line.appendChild(el("span", null, "Checked against " + list.length + " draws:"));
      [6, 5, 4, 3].forEach(function (m) {
        var chip = el("span", "m" + (hist.counts[m] ? " hit" : ""), m + "-match " + hist.counts[m]);
        line.appendChild(chip);
      });
      card.appendChild(line);

      var detail = el("div", "hit-list");
      detail.style.display = "none";
      if (!hist.hits.length) {
        detail.appendChild(el("div", "hit", "No stored draw shared three or more of these numbers."));
      }
      hist.hits.slice(0, 25).forEach(function (h) {
        var row = el("div", "hit");
        row.appendChild(el("span", "r", h.match + "/6 match"));
        row.appendChild(el("span", "d", Core.formatDate(h.d)));
        var rowBalls = el("span", "balls-row");
        h.matched.forEach(function (m) { rowBalls.appendChild(ball(m, g.max, "xs")); });
        row.appendChild(rowBalls);
        row.appendChild(el("span", "p", h.n.map(function (n) {
          return String(n).padStart(2, "0");
        }).join(" ")));
        detail.appendChild(row);
      });
      if (hist.hits.length > 25) {
        detail.appendChild(el("div", "hit", "Showing the 25 best matches of " + hist.hits.length + "."));
      }
      card.appendChild(detail);
      btn.addEventListener("click", function () {
        detail.style.display = detail.style.display === "none" ? "grid" : "none";
        btn.textContent = detail.style.display === "none" ? "Details" : "Hide";
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
    var t = Core.calcTax(gross);
    $("calcNet").textContent = peso(t.net);
    $("calcGross").textContent = peso(t.gross);
    $("calcTax").textContent = peso(t.tax);
    $("calcNetRow").textContent = peso(t.net);
    $("calcRate").textContent = t.gross > 0 ? pct(t.effectiveRate) : "0.00%";
    $("calcSub").textContent = t.gross > 0
      ? "from a " + peso(t.gross) + " prize · " + (t.taxable ? "20% final tax withheld" : "no tax — at or under ₱10,000")
      : "Enter a prize amount to see the payout";

    var tier = Core.claimTier(t.gross);
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
      b.title = g.name + " jackpot " + peso(meta.latest.j) + " (" + Core.formatDate(meta.latest.d) + ")";
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
      tr.appendChild(el("td", null, g.dayLabel));
      tr.appendChild(el("td", null, "9:00 PM PHT"));
      tr.appendChild(el("td", "num", "1 in " + Core.formatNumber(Core.odds(g.max))));
      tr.appendChild(el("td", "num", m.count + " (" + Core.formatDateShort(m.from) + " – " +
        Core.formatDateShort(m.to) + ")"));
      body.appendChild(tr);
    });
    var all = Core.GAMES.reduce(function (sum, g) {
      return sum + META.games[g.id].count;
    }, 0);
    $("totalDraws").textContent = Core.formatNumber(all);
    if ($("badgeDraws")) $("badgeDraws").textContent = Core.formatNumber(all) + " draws";
    var firsts = Core.GAMES.map(function (g) { return META.games[g.id].from; }).sort();
    var lasts = Core.GAMES.map(function (g) { return META.games[g.id].to; }).sort();
    $("dataFrom").textContent = Core.formatDate(firsts[0]);
    $("dataTo").textContent = Core.formatDate(lasts[lasts.length - 1]);
    if ($("badgeCoverage")) {
      $("badgeCoverage").textContent = Core.formatDateShort(firsts[0]) + ", " +
        firsts[0].slice(0, 4) + " – " + Core.formatDateShort(lasts[lasts.length - 1]) + ", " +
        lasts[lasts.length - 1].slice(0, 4);
    }
    $("dataUpdated").textContent = Core.formatDate(META.collectedAt);
  }

  /* ---------- tabs ---------- */
  var TABS = { results: "panel-results", stats: "panel-stats", generator: "panel-generator", calc: "panel-calc" };

  function selectTab(name, scroll) {
    if (!TABS[name]) return;
    state.tab = name;
    Object.keys(TABS).forEach(function (k) {
      var panel = $(TABS[k]);
      if (panel) panel.hidden = k !== name;
    });
    var tabs = $("tabBar").querySelectorAll(".tab");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle("is-active", tabs[i].dataset.tab === name);
      tabs[i].setAttribute("aria-selected", tabs[i].dataset.tab === name ? "true" : "false");
    }
    var navs = document.querySelectorAll(".site-nav a");
    for (var j = 0; j < navs.length; j++) {
      navs[j].classList.toggle("is-active", navs[j].dataset.tabLink === name);
    }
    if (name === "stats") renderStats();
    if (name === "calculator" || name === "calc") renderCalc();
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
    state.game = id;
    state.fixed = [];
    state.excluded = [];
    var g = game();
    var dateInput = $("dateInput");
    dateInput.min = gameMeta().from;
    dateInput.max = gameMeta().to;
    renderGameBar();
    renderHero();
    renderLatest();
    renderHistory();
    renderTrend();
    $("dateResult").innerHTML = "";
    if (state.tab === "stats") renderStats();
    renderNumGrid();
    $("gameList").innerHTML = "";
    $("gameList").appendChild((function () {
      var d = el("div", "empty");
      d.appendChild(el("strong", null, "No combinations yet"));
      d.appendChild(document.createTextNode("Choose your filters, then press “Generate 5 combinations”."));
      return d;
    })());
    showGenStatus("");
    var odds = $("genOdds");
    if (odds) odds.textContent = "A single ticket has 1 chance in " + Core.formatNumber(Core.odds(g.max)) +
      " of matching all six numbers, whatever filters you use.";
  }

  /* ---------- events ---------- */
  function bind() {
    $("tabBar").addEventListener("click", function (e) {
      var t = e.target.closest(".tab");
      if (t) selectTab(t.dataset.tab, true);
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
    bind();
    $("dateInput").value = latest().d;
    renderDateResult(latest().d);
    var hash = (location.hash || "").replace("#", "");
    if (hash) {
      var map = { results: "results", statistics: "stats", stats: "stats", generator: "generator", tax: "calc", calc: "calc" };
      if (map[hash]) selectTab(map[hash]);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
