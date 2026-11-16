/* =============================================================
   PCSO Lotto Hub — language layer
   Default language: Tagalog (fil). English opens with ?lang=en.
   The page source itself is written in Tagalog; this file carries the
   English text for every element marked data-i18n / data-i18n-html and
   the strings the UI renders at run time (both languages).
   ============================================================= */
(function (root) {
  "use strict";

  var STORE_KEY = "pcso-lang";
  var LANGS = ["tl", "en"];
  var DEFAULT_LANG = "tl";

  /* ---------- static page text: English ---------- */
  var EN = {
    "meta.title": "PCSO Lotto Results, 3D Swertres & 2D EZ2, Number Statistics & 20% Prize Tax Calculator | PCSO Lotto Hub",
    "meta.desc": "Official PCSO lotto results for Ultra Lotto 6/58, Grand Lotto 6/55, Super Lotto 6/49, Mega Lotto 6/45, Lotto 6/42, 3D Lotto (Swertres) and 2D Lotto (EZ2) — three draws a day at 2PM, 5PM and 9PM — plus real number frequency, hot and cold number, overdue number statistics, a combination picker and a TRAIN Law 20% prize tax calculator in Philippine pesos.",
    "meta.ogTitle": "PCSO Lotto Results, 3D & 2D, Statistics & 20% Prize Tax Calculator",
    "meta.ogDesc": "Five PCSO jackpot games plus 3D (Swertres) and 2D (EZ2) three times a day, every real draw since January 2024, number statistics and a TRAIN Law prize tax calculator.",

    "nav.brandSub": "Results · Statistics · Tax",
    "nav.results": "Results",
    "nav.stats": "Statistics",
    "nav.gen": "Generator",
    "nav.tax": "Tax Calculator",
    "nav.guide": "Claiming Guide",
    "nav.videos": "Draw Videos",

    "hero.updated": "PCSO data updated",
    "hero.h1": "Philippine PCSO lotto results, 3D and 2D, number statistics and the 20% prize tax — in one place",
    "hero.sub": "Five jackpot games plus 3D Lotto (Swertres) and 2D Lotto (EZ2), which draw three times every day: every draw since January 2024 taken from the PCSO result records, with the real frequency, overdue and sum statistics behind them, a filter-based number generator, and a TRAIN Law tax and claiming calculator in pesos.",
    "hero.noAccount": "No account needed",
    "hero.jackpot": "Jackpot (before tax)",
    "hero.net": "After 20% TRAIN tax",
    "hero.watch": "Watch the draw on PCSO’s official YouTube channel",

    "tab.results": "Latest Results",
    "tab.stats": "Number Statistics",
    "tab.gen": "Smart Generator",
    "tab.calc": "Prize & Tax Calculator",
    "tab.guide": "Claiming Guide",

    "res.jackpot": "Jackpot",
    "res.net": "Estimated net payout",
    "res.netSmall": "after 20% final tax",
    "res.winners": "Jackpot winners",
    "res.winnersSmall": "nobody matched 6 of 6",
    "res.schedule": "Draw schedule",
    "res.findTitle": "Find a past draw by date",
    "res.findDesc": "Pick any date from January 2, 2024 to the latest draw. If the game did not draw that day, the closest earlier draw is shown.",
    "res.dateLabel": "Draw date",
    "res.showDraw": "Show draw",
    "res.latestBtn": "Latest",
    "res.trendTitle": "Jackpot trend",
    "res.trendDesc": "Last 30 draws of the selected game. A jackpot resets to the game's minimum once it is won.",
    "res.historyTitle": "Draw history",
    "res.rows": "Rows",
    "res.opt20": "Last 20 draws",
    "res.opt50": "Last 50 draws",
    "res.opt100": "Last 100 draws",
    "res.optAll": "All stored draws",
    "res.note1": "Winning numbers are shown in ascending order; PCSO pays them in any order. “Net after tax” is our arithmetic: the jackpot minus the 20% final tax under the TRAIN Law, for a single winner.",
    "res.note2": "“Watch Draw” opens a YouTube search for that game and draw date, because PCSO streams every draw live and keeps the recordings on its official channel rather than publishing one fixed address per draw.",

    "th.date": "Draw date",
    "th.day": "Day",
    "th.nums": "Winning numbers",
    "th.jackpot": "Jackpot (PHP)",
    "th.winners": "Winners",
    "th.net": "Net after tax",
    "th.video": "Draw video",
    "th.game": "Game",
    "th.numbers": "Numbers",
    "th.nights": "Draw nights",
    "th.time": "Draw time",
    "th.odds": "Odds of 6 of 6",
    "th.oddsShort": "Odds",
    "th.stored": "Draws stored",
    "th.prize": "Prize",
    "th.tax": "Tax",
    "th.claimAt": "Claim at",

    "src.body": "<b>Where this data comes from.</b> Every draw on this page is a PCSO draw result published by the Philippine Charity Sweepstakes Office (pcso.gov.ph, “Search Lotto Result by Date”), mirrored as machine-readable records by the <a href=\"https://github.com/kimken147/pcso-results-data\" rel=\"nofollow noopener\" target=\"_blank\">Lotto Tayo dataset (CC BY 4.0)</a>. This site stores <span id=\"totalDraws\">2,228</span> draws for the five 6-number games, from <span id=\"dataFrom\">January 2, 2024</span> to <span id=\"dataTo\">November 15, 2026</span>. Nothing here is simulated or estimated — numbers, dates, jackpots and winner counts are as published. PCSO's own record prevails if anything disagrees. Draw videos are streamed live and kept on the <a href=\"https://www.youtube.com/@PCSOGOVPHOfficial/streams\" rel=\"noopener noreferrer\" target=\"_blank\">official PCSO YouTube channel (PCSO GOV)</a>.",

    "stats.r20": "Last 20",
    "stats.r50": "Last 50",
    "stats.r100": "Last 100",
    "stats.rAll": "All stored",
    "stats.size": "Draws analyzed",
    "stats.expected": "Expected hits per number",
    "stats.avgSum": "Average winning sum",
    "stats.overdueTop": "Most overdue",
    "stats.overdueSmall": "draws since it appeared",
    "stats.heat": "Frequency heatmap",
    "stats.heatDesc": "How many times each number came out in the selected range. Deeper blue means it appeared more often than the average for this range.",
    "stats.hot": "Hot numbers",
    "stats.hotDesc": "Most drawn in this range.",
    "stats.cold": "Cold numbers",
    "stats.coldDesc": "Least drawn in this range.",
    "stats.overdueTitle": "Most overdue",
    "stats.overdueDesc": "Draws since the number last appeared.",
    "stats.oddTitle": "Odd / even split",
    "stats.oddDesc": "How many odd numbers each winning draw carried.",
    "stats.lowTitle": "Low / high split",
    "stats.sumTitle": "Sum distribution",
    "stats.pairTitle": "Most common pairs",
    "stats.pairDesc": "Number pairs that came out together most often in this range.",
    "stats.warn": "<b>What statistics can and cannot do.</b> Every draw is an independent event. Frequencies, gaps and sums describe what already happened in the PCSO records; they do not change the odds of the next draw, which stay fixed at 1 in 40,475,358 for Ultra Lotto 6/58. Use this page to explore the data, not as a prediction.",

    "gen.desc": "Tap numbers to include or exclude them, set an odd/even split, then build five combinations inside the 1–58 range. Every combination is checked against all stored draws.",
    "gen.board": "Number board",
    "gen.include": "Include",
    "gen.exclude": "Exclude",
    "gen.oddEven": "Odd : even split",
    "gen.oddEvenHint": "Applies to the whole 6-number ticket",
    "gen.any": "Any split",
    "gen.noConsec": "Remove combinations with consecutive numbers",
    "gen.generate": "Generate 5 combinations",
    "gen.clear": "Clear filters",
    "gen.listTitle": "Your combinations",
    "gen.listDesc": "Each pick is compared with every stored draw of this game: how many times it would have matched 6, 5, 4 and 3 numbers.",
    "gen.emptyTitle": "No combinations yet",
    "gen.emptyDesc": "Choose your filters, then press “Generate 5 combinations”.",
    "gen.howTitle": "How to read the history check",
    "gen.howDesc": "“6-match” means the combination is exactly a past winning draw. A 3-, 4- or 5-match line shows how often a ticket with three, four or five of those numbers would have shared a lower prize. It is a reference, not a forecast.",

    "calc.title": "Prize & tax calculator",
    "calc.desc": "Enter any PCSO prize amount. Prizes of ₱10,000 or less are tax-free; anything above ₱10,000 carries the 20% final withholding tax under the TRAIN Law (RA 10963).",
    "calc.amountLabel": "Prize amount in pesos",
    "calc.useJackpot": "Use a current jackpot",
    "calc.useJackpotSub": "Latest draws in this database",
    "calc.common": "Common amounts",
    "calc.commonSub": "Tax and claiming brackets",
    "calc.taxNone": "None",
    "calc.atOutlet": "Any authorized lotto outlet or PCSO branch",
    "calc.atBranch": "PCSO branch office or Main Office",
    "calc.over300k": "Over ₱300,000",
    "calc.atMain": "PCSO Main Office, Mandaluyong City",
    "calc.li1": "<b>Only the 20% tax comes off your prize.</b> The 1% commission on a jackpot goes to the authorized outlet that sold the ticket and is paid by PCSO, not deducted from the winner.",
    "calc.li2": "<b>Claim within one year</b> of the draw date. A prize not claimed in that time is forfeited to PCSO's charity fund.",
    "calc.li3": "<b>Buy only from authorized PCSO outlets</b> — a ticket from an unauthorised seller is not a valid PCSO ticket and cannot be claimed.",
    "calc.heroLabel": "Estimated amount you take home",
    "calc.gross": "Prize (gross)",
    "calc.taxRow": "20% final withholding tax",
    "calc.netRow": "Net payout",
    "calc.rateRow": "Effective deduction",
    "calc.note": "The 20% is computed on the whole prize, not only the part above ₱10,000. Tax is withheld by PCSO when the prize is paid; there is nothing to pay in advance.",
    "calc.faqTitle": "Tax and claiming quick answers",
    "calc.q1": "How much tax is taken from a PCSO jackpot?",
    "calc.a1": "Twenty percent (20%) final withholding tax on the gross prize if the prize is more than ₱10,000. A ₱100,000,000 jackpot pays ₱20,000,000 in tax and ₱80,000,000 in cash. Prizes of ₱10,000 or less are exempt under the TRAIN Law (Republic Act No. 10963).",
    "calc.q2": "Is the 20% taken from the excess over ₱10,000 or from the whole prize?",
    "calc.a2": "From the whole prize. Once a prize exceeds ₱10,000, the 20% applies to the full amount, so a ₱10,001 prize pays ₱2,000.20 in tax and ₱8,000.80 in cash. A ₱10,000 prize pays no tax at all — that one-peso difference is the cliff in this calculator.",
    "calc.q3": "Where do I claim, and how long do I have?",
    "calc.a3": "Up to ₱10,000: any authorized lotto outlet or PCSO branch. ₱10,001 to ₱300,000: a PCSO branch office or the Main Office. Above ₱300,000, including every jackpot: the PCSO Main Office at Sun Plaza, Shaw Boulevard corner Princeton Street, Mandaluyong City, in person. The ticket must be claimed within one year of the draw date, or the prize is forfeited to PCSO's charity fund.",
    "calc.q4": "Does the calculator include the 1% agent commission?",
    "calc.a4": "No. The 1% commission on a jackpot goes to the authorized PCSO agent that sold the winning ticket, paid by PCSO — it is not deducted from the winner's prize. The only deduction from your prize is the 20% final tax.",
    "calc.faqNote": "This calculator is an information tool, not tax or legal advice. PCSO withholds the tax at payout and its computation is final; confirm current requirements with PCSO before claiming.",

    "over.title": "The five PCSO jackpot games",
    "over.sub": "Ticket odds, draw nights and pool size for every game in this database.",
    "over.note": "Odds are the number of possible 6-number combinations in each pool: 58 choose 6, 55 choose 6, and so on. Draw nights are the PCSO schedule the stored draw dates follow.",

    "what.title": "What this site does",
    "what.sub": "Four tools built on the same set of PCSO draw records.",
    "what.c1t": "Results you can search",
    "what.c1d": "The latest result for each game, the jackpot and the net amount after tax, a jackpot trend line, and any past draw by date — back to January 2, 2024.",
    "what.c1b": "Open results",
    "what.c2t": "Statistics that show their work",
    "what.c2d": "Frequency heatmap, hot and cold numbers, the most overdue numbers, odd/even and low/high splits, sum distribution and the pairs that appear together most — for the last 20, 50, 100 or all draws.",
    "what.c2b": "Open statistics",
    "what.c3t": "A picker and a tax calculator",
    "what.c3d": "Include up to five fixed numbers, exclude numbers, set an odd/even split and drop consecutive numbers to build five combinations, each checked against every stored draw. Then see exactly what a prize is worth after the 20% tax, and where to claim it.",
    "what.c3b": "Open calculator",

    "daily.prize": "Prize (Standard, per ₱10 play)",
    "daily.afterTax": "Net after tax",
    "daily.next": "Next draw",
    "daily.todayTitle": "Today’s three draws",
    "daily.todayDesc": "2:00 PM · 5:00 PM · 9:00 PM PHT, every day — the newest draw first.",
    "daily.findTitle": "Find the draws on a date",
    "daily.findDesc": "Pick any date from January 2, 2024 to today. All three draws of that date appear; if the game did not draw that day, the closest earlier date is shown.",
    "daily.prizeTitle": "What a winning ticket pays",
    "daily.winners": "Winners",
    "daily.winnersSmall": "on the 9:00 PM draw",
    "daily.taxFreeSmall": "At or under ₱10,000 — no tax",
    "daily.play": "Play",
    "daily.slot": "Draw time",
    "daily.prizeCol": "Prize (Standard)",
    "daily.hotTopSmall": "appearances in this range",
    "daily.thPrize10": "Prize per ₱10",
    "daily.open": "Open",
    "daily.overNote": "Every draw since January 2, 2024, including the 2PM, 5PM and 9PM results, digit statistics and a simple combination picker. The Standard prize is ₱4,500 on 3D and ₱4,000 on 2D per ₱10 play; Rambolito, the any-order play, pays ₱750 or ₱1,500 on 3D and ₱2,000 on 2D.",
    "daily.prizeDesc": "Fixed prizes per ₱10 play. Standard pays only when your digits come out in the exact order drawn; Rambolito pays when they come out in any order.",
    "daily.histTitle": "Draw history",
    "daily.note1": "Digits are shown in the order drawn, because a Standard 3D or 2D ticket pays only in that order. A ₱10 Standard win pays ₱4,500 on 3D Lotto and ₱4,000 on 2D Lotto — both under the ₱10,000 tax-free threshold.",
    "daily.note2": "“Watch Draw” opens a YouTube search for that game, date and 2PM, 5PM or 9PM draw, because PCSO streams every draw live and keeps the recordings on its official channel.",
    "daily.heat": "Frequency heatmap",
    "daily.heatDesc": "How many times each number came out in the selected range. Deeper blue means it appeared more often than the average for this range.",
    "daily.expected": "Expected appearances per number",
    "daily.hotTop": "Most drawn",
    "daily.posTitle": "Position by position",
    "daily.posDesc": "How often each number came out in each position of the draw: three positions on 3D Lotto, two on 2D Lotto.",
    "daily.shapeTitle": "Shape of the winning combination",
    "daily.shapeDesc": "Whether the digits came out all different, carrying one pair, or all the same.",
    "daily.warn": "<b>What statistics can and cannot do.</b> Every draw is an independent event. Frequencies, gaps and positions describe what already happened in the PCSO records; they do not change the odds of the next draw, which stay 1 in 1,000 on 3D Lotto and 1 in 961 on 2D Lotto. Use this page to explore the data, not as a prediction.",
    "daily.genDesc": "Tap numbers to keep them in play or take them out, choose the shape you want, then build five combinations and see how each would have done in every stored draw.",
    "daily.pad": "Number board",
    "daily.shape": "Shape of the combination",
    "daily.genBtn": "Generate 5 combinations",
    "daily.genClear": "Clear filters",
    "daily.listTitle": "Your combinations",
    "daily.listDesc": "Each pick is compared with every stored draw of this game: an exact (straight) match, and an any-order Rambolito match.",
    "daily.genEmptyTitle": "No combinations yet",
    "daily.genEmptyDesc": "Choose your filters, then press “Generate 5 combinations”.",
    "daily.howTitle": "How to read the history check",
    "daily.howDesc": "A straight hit is the same digits in the same order — the Standard prize. A Rambolito hit is the same digits in another order, which pays the smaller any-order prize. Both are a reference, not a forecast.",
    "daily.overTitle": "The two daily digit games",
    "daily.overDesc": "3D Lotto (Swertres) and 2D Lotto (EZ2) draw three times every day with a fixed prize per ₱10 play.",
    "daily.view3d": "Open 3D Lotto",
    "daily.view2d": "Open 2D Lotto",

    "foot.home": "Home",
    "foot.guide": "Claiming Guide",
    "foot.privacy": "Privacy",
    "foot.terms": "Terms",
    "foot.contact": "Contact",
    "foot.note": "<b>Independent information site.</b> PCSO Lotto Hub is not affiliated with, endorsed by, or connected to the Philippine Charity Sweepstakes Office. Results, jackpots and winner counts are drawn from PCSO's published draw records and are shown for information only; PCSO's own record is final. We do not sell tickets and we do not accept bets.<br><span class=\"responsible\">18+</span> Lotto is a game of chance. Play only what you can afford to lose. If gambling stops being fun, stop — and talk to someone you trust.",

    /* ---------- guide.html ---------- */
    "guideMeta.title": "PCSO Prize Claiming Guide 2026 — Where to Claim, 20% Tax, 1% Agent Commission",
    "guideMeta.desc": "How to claim a PCSO lotto prize in 2026: the ₱10,000 / ₱300,000 claiming brackets, the PCSO Main Office in Mandaluyong, two valid IDs, the one-year deadline, the 20% TRAIN Law tax on prizes over ₱10,000, and the 1% agent commission.",
    "guideMeta.ogTitle": "PCSO Prize Claiming Guide 2026 — Place, Tax, Deadline",
    "guideMeta.ogDesc": "Claiming brackets, documents, the 20% tax and the one-year deadline for PCSO lotto prizes.",
    "guide.eyebrow": "PCSO claiming guide",
    "guide.h1": "How to claim a PCSO lotto prize in 2026",
    "guide.lede": "Where to go with a winning ticket, which IDs to bring, exactly what the 20% tax takes out of a jackpot, the one-year deadline, and what the 1% agent commission is — written from PCSO's own claiming rules and the TRAIN Law.",
    "guide.tocLabel": "On this page",
    "guide.toc1": "Claiming brackets",
    "guide.toc2": "Step by step",
    "guide.toc3": "Documents",
    "guide.toc4": "Tax on prizes",
    "guide.toc5": "1% agent commission",
    "guide.toc6": "One-year deadline",
    "guide.toc7": "Draw schedule",
    "guide.toc8": "Scam warning",
    "guide.toc9": "FAQ",
    "guide.s1h": "1. Where to claim, by prize amount",
    "guide.s1p1": "A PCSO lotto ticket is a bearer instrument: the person holding the signed original ticket is the one paid. Which office pays depends only on how much the prize is worth.",
    "guide.thPrize": "Prize amount",
    "guide.thWhere": "Where to claim",
    "guide.thHow": "How it is paid",
    "guide.thTax": "Tax",
    "guide.s1r1a": "Any authorized PCSO lotto outlet, or a PCSO branch office",
    "guide.s1r1b": "Cash, subject to the outlet's cash on hand",
    "guide.s1r1c": "None",
    "guide.s1r2a": "A PCSO branch office near you, or the PCSO Main Office",
    "guide.s1r2b": "Cash up to ₱60,000 gross; check above that",
    "guide.s1r2c": "20% final tax",
    "guide.s1r3a": "Over ₱300,000, including every jackpot",
    "guide.s1r3b": "PCSO Main Office only — Sun Plaza, Shaw Blvd. cor. Princeton St., Mandaluyong City",
    "guide.s1r3c": "Check in the winner's name, validated in person",
    "guide.s1r3d": "20% final tax",
    "guide.s1p2": "A prize of ₱20 is the smallest amount a ticket pays. If the amount printed on your ticket is below ₱10,000 and the outlet where you bought it has the cash, that is the fastest route: the clerk validates the barcode and pays on the spot. Larger prizes move up the chain because the ticket has to be verified against the draw record.",
    "guide.s1p3": "For a jackpot, call the PCSO Main Office before travelling. Processing a jackpot is not a same-hour transaction, and the office will tell you its current requirements and hours.",
    "guide.s2h": "2. Claiming step by step",
    "guide.s2l1": "<strong>Check the draw yourself.</strong> Compare your numbers with the result for that exact draw date and game on our <a href=\"index.html#results\">results page</a>, then re-check against PCSO's published result. Only PCSO validation is final.",
    "guide.s2l2": "<strong>Sign the back of the ticket and write your name on it.</strong> Do this now, whether or not the ticket won — PCSO pays the person whose signature is on the ticket.",
    "guide.s2l3": "<strong>Keep the ticket flat, dry and readable.</strong> Do not fold the barcode, laminate it with heat, or let it get wet. A ticket the terminal cannot read may be refused.",
    "guide.s2l4": "<strong>Choose the right office</strong> from the bracket table above.",
    "guide.s2l5": "<strong>Bring your documents</strong> — the original ticket and two valid government IDs for anything above ₱10,000. Bring a pen; there is a form to fill in.",
    "guide.s2l6": "<strong>Validation.</strong> Staff scan the ticket and match it to the draw record. You may be asked a few questions about the purchase.",
    "guide.s2l7": "<strong>Payment after tax.</strong> PCSO deducts the 20% final tax and pays the rest in cash or by check, depending on the amount.",
    "guide.s2l8": "<strong>Keep the receipt</strong> and any acknowledgement PCSO gives you, and photograph the ticket's front and back before handing it over.",
    "guide.s3h": "3. What to bring",
    "guide.s3l1": "<strong>The original winning ticket</strong>, signed at the back. Photocopies and photos are not accepted in place of the ticket.",
    "guide.s3l2": "<strong>Two valid government-issued IDs</strong> for prizes above ₱10,000, both with your photo and signature — a passport, driver's licence, UMID, PhilSys national ID, postal ID, PRC licence, SSS or GSIS ID. The signature on your IDs is matched against the one on the ticket.",
    "guide.s3l3": "<strong>A Winner's Profile Form</strong>, available at PCSO branches and the Main Office and filled in on site.",
    "guide.s3l4": "<strong>A special power of attorney</strong> if someone else must claim for you, plus that person's own valid ID. PCSO does not release a prize to a representative without one.",
    "guide.s3p": "For an outlet-level claim of ₱10,000 or less, the signed ticket and one valid ID are normally enough.",
    "guide.s4h": "4. The 20% tax on prizes",
    "guide.s4p1": "Under Section 24(B)(1) of the Tax Code as amended by the TRAIN Law (Republic Act No. 10963, in force since 1 January 2018), winnings from PCSO lotto of <strong>₱10,000 or less are exempt</strong>, while prizes <strong>above ₱10,000 carry a 20% final tax</strong>.",
    "guide.s4p2": "The 20% applies to the <strong>whole prize</strong>, not only to the part above ₱10,000. The difference is a cliff:",
    "guide.s4th1": "Gross prize",
    "guide.s4th2": "Tax",
    "guide.s4th3": "You receive",
    "guide.s4p3": "The tax is withheld by PCSO when the prize is paid. You never pay it in advance, and anyone who asks you to send a “tax deposit” or a “release fee” before a payout is running a scam. Our <a href=\"index.html#tax\">tax and prize calculator</a> does this arithmetic for any amount, including the latest jackpots.",
    "guide.s5h": "5. What the 1% agent commission is",
    "guide.s5p1": "When a jackpot ticket is sold, PCSO pays a <strong>1% commission to the authorized lotto agent</strong> — the outlet that sold the winning combination. It comes out of PCSO's side of the pool, not out of the winner's prize. A winner is never charged it and it does not change the 20% tax figure.",
    "guide.s5p2": "It is one of the reasons PCSO advises players to buy only from authorized outlets: an unauthorized seller's ticket is not a valid PCSO ticket and cannot be claimed at all.",
    "guide.s6h": "6. The one-year deadline",
    "guide.s6p1": "A winning ticket is valid for <strong>one year from the date of the draw</strong>. This is in PCSO's charter, as amended by Batas Pambansa Blg. 42: a prize not claimed within one year is considered forfeited and forms part of the charity fund. The rule applies to every prize, from ₱20 to a nine-figure jackpot, and there is no extension for a ticket found late.",
    "guide.s6p2": "Work out the deadline the day you check your numbers, and go early rather than in the last week — a weekend, a holiday or a missing document at the last minute can cost you the prize.",
    "guide.s7h": "7. PCSO draw schedule",
    "guide.s7th1": "Game",
    "guide.s7th2": "Numbers",
    "guide.s7th3": "Draw nights",
    "guide.s7th4": "Time",
    "guide.s7p": "Results are drawn in the evening and published by PCSO shortly afterwards. Our pages follow the same nights; every stored draw date in our database falls on its game's scheduled nights, which is one of the checks we run when the data is refreshed.",
    "guide.n658": "Tue · Fri · Sun",
    "guide.n655": "Mon · Wed · Sat",
    "guide.n649": "Tue · Thu · Sun",
    "guide.n645": "Mon · Wed · Fri",
    "guide.n642": "Tue · Thu · Sat",
    "guide.nDaily": "Every day",
    "guide.s7th3Daily": "Draw days",
    "guide.s8h": "8. How prize scams work, and how to refuse one",
    "guide.s8p": "<strong>PCSO does not contact winners.</strong> There is no text, call, email or social media message telling you that you have won. You find out by checking the numbers yourself and presenting the ticket. Anything that begins with someone telling you you won is fraud.",
    "guide.s8l1": "Refuse any request for an up-front “processing fee”, “tax payment” or “release fee”. Tax is deducted from the prize, never collected from you.",
    "guide.s8l2": "Never send a photo of your ticket, your bank details or a one-time code to a person or page that claims it will “verify” a win.",
    "guide.s8l3": "Do not let a middleman “handle” a claim for a share of the prize. Go to PCSO yourself, or with a lawyer you chose.",
    "guide.s8l4": "Buy only from authorized PCSO outlets. No website, including this one, can sell you a PCSO ticket.",
    "guide.s9h": "9. Where our data comes from",
    "guide.s9p1": "Every result, jackpot and winner count on this site is taken from PCSO's published draw records (pcso.gov.ph, “Search Lotto Result by Date”), mirrored as machine-readable records by the Lotto Tayo dataset under CC BY 4.0. We store every draw of the five 6-number games from January 2, 2024 to the latest published draw, and we validate each refresh: six numbers per draw, inside the game's pool, one draw per date, on the game's scheduled nights. PCSO's own record prevails if anything disagrees.",
    "guide.s9p2": "We do not sell tickets, run draws, hold player accounts or accept bets. We cannot check a ticket for you and we have no access to PCSO's validation system.",
    "guide.s10h": "10. Frequently asked questions",
    "guide.f1q": "How much tax will be taken from my prize?",
    "guide.f1a": "Nothing up to ₱10,000. Above ₱10,000, 20% of the gross prize under the TRAIN Law. A ₱1,000,000 prize pays ₱200,000 in tax and ₱800,000 to you.",
    "guide.f2q": "Is the 20% taken from the amount above ₱10,000 only?",
    "guide.f2a": "No. Once the prize exceeds ₱10,000 the 20% is computed on the whole amount. A ₱10,000 prize is paid in full; a ₱10,000.01 prize pays ₱2,000.00 in tax.",
    "guide.f3q": "Where exactly is the PCSO Main Office?",
    "guide.f3a": "Sun Plaza, Shaw Boulevard corner Princeton Street, Mandaluyong City. Jackpot claims are processed there in person and paid by check in the winner's name.",
    "guide.f4q": "How long do I have to claim?",
    "guide.f4a": "One year from the draw date. Unclaimed prizes are forfeited to PCSO's charity fund, with no extension.",
    "guide.f5q": "What if my ticket is torn, wet or unreadable?",
    "guide.f5a": "The barcode has to scan. A mutilated or unreadable ticket may be refused, so keep it flat, dry and out of direct heat from the moment you buy it.",
    "guide.f6q": "Can someone else claim for me?",
    "guide.f6a": "Only with a special power of attorney and their own valid ID, presented at the PCSO office. The safest course is to claim in person with the ticket signed in your name.",
    "guide.f7q": "Is the jackpot paid in installments?",
    "guide.f7a": "No. PCSO pays a jackpot as a lump sum, by check, after the 20% tax is withheld.",
    "guide.f8q": "What is the 1% agent commission?",
    "guide.f8a": "A commission PCSO pays the outlet that sold the winning jackpot ticket. It is not deducted from the winner's prize.",
    "guide.f9q": "Can I buy a PCSO ticket through this website?",
    "guide.f9a": "No. We publish results and statistics only. Tickets are sold at authorized PCSO outlets; PCSO's own online channel, where it is available, is the only official way to play without visiting an outlet.",
    "guide.f10q": "Do hot or overdue numbers improve my chances?",
    "guide.f10a": "No. Each draw is independent and every combination has the same probability — 1 in 40,475,358 for Ultra Lotto 6/58. Statistics describe past draws, not the next one. Our <a href=\"index.html#statistics\">statistics page</a> is there to explore the data, not to predict it.",
    "guide.f11q": "Who runs this site?",
    "guide.f11a": "PCSO Lotto Hub is an independent information site. It is not affiliated with, endorsed by or connected to the Philippine Charity Sweepstakes Office, and it does not sell tickets or accept bets. See our <a href=\"terms.html\">terms</a> and <a href=\"privacy.html\">privacy policy</a>.",
    "guide.note": "Rules, brackets and office requirements are set by PCSO and can change. This page reflects PCSO's published claiming rules and the TRAIN Law as they stood on November 16, 2026, and is information rather than legal or tax advice. Confirm the current requirements with PCSO before claiming a real prize.",

    /* ---------- privacy.html ---------- */
    "privMeta.title": "Privacy Policy | PCSO Lotto Hub",
    "privMeta.desc": "How PCSO Lotto Hub handles information: no accounts, no collected ticket numbers, only server logs and third-party advertising cookies.",
    "priv.eyebrow": "Privacy policy",
    "priv.lede": "This site is a set of static pages about PCSO lotto results and prize rules. It has no accounts, no forms that ask for personal details, and no ticket checking. This page explains the small amount of data that still exists when a site like this is used.",
    "priv.h1": "Privacy policy",
    "priv.updated": "<strong>Last updated: November 16, 2026.</strong> This policy applies to lotto-tools.github.io/pcso-lotto-hub (the “site”). References to “we” and “us” mean the operator of this site.",
    "priv.h2a": "What we do not collect",
    "priv.p1": "We do not ask for, or store, your name, address, phone number, email address, ticket numbers, ID documents or payment details. The number board and the tax calculator run inside your browser: the values you type are not sent to us and are not saved anywhere.",
    "priv.p2": "We do not have a mailing list, we do not require registration, and we do not sell tickets or accept bets, so we never need a player account.",
    "priv.h2b": "Information that is collected automatically",
    "priv.p3": "Like almost every website, our hosting provider records technical information when a page is requested — typically the IP address, the type of device and browser, the page requested, the time, and a referring address. This is used to serve the pages, keep the service secure and understand in aggregate how the site is used. Server logs are kept for a limited period and are not used to identify individual visitors.",
    "priv.p4": "We use no first-party advertising or tracking cookies of our own.",
    "priv.h2c": "Cookies and advertising",
    "priv.p5": "If advertising is shown on this site, it is supplied by Google AdSense and its partners. Google and other third-party vendors use cookies to serve ads based on your prior visits to this and other websites.",
    "priv.l1": "Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the internet.",
    "priv.l2": "You may opt out of personalised advertising by visiting <a href=\"https://www.google.com/settings/ads\" rel=\"nofollow noopener\" target=\"_blank\">Google Ads Settings</a>.",
    "priv.l3": "You can also opt out of a third-party vendor's use of cookies for personalised advertising at <a href=\"https://www.aboutads.info/choices/\" rel=\"nofollow noopener\" target=\"_blank\">aboutads.info</a> or, in the EU/UK, <a href=\"https://www.youronlinechoices.com/\" rel=\"nofollow noopener\" target=\"_blank\">youronlinechoices.com</a>.",
    "priv.l4": "Google's practices are described in the <a href=\"https://policies.google.com/technologies/partner-sites\" rel=\"nofollow noopener\" target=\"_blank\">Google Privacy &amp; Terms</a> page.",
    "priv.p6": "Cookies set by third parties are controlled by those parties, not by us. Where consent is required by law, an advertising consent message is shown before non-essential cookies are set, and you can change or withdraw that choice at any time.",
    "priv.h2d": "Analytics",
    "priv.p7": "If we use a privacy-respecting analytics tool, it records aggregated page views and referrers without building a profile of you. Any analytics settings are limited to what is needed to know which pages are useful.",
    "priv.h2e": "Links to other sites",
    "priv.p8": "Some pages link to PCSO's website or to the open dataset we use. Those sites have their own privacy policies and we are not responsible for their content or their handling of your data.",
    "priv.h2f": "Children",
    "priv.p9": "This site is written for adults and is not directed at children. We do not knowingly collect information from anyone under 18, and lotto play is restricted to adults by PCSO.",
    "priv.h2g": "Your rights",
    "priv.p10": "Depending on where you live, you may have the right to ask what personal data is held about you, to have it corrected or deleted, to object to processing, or to complain to a data protection authority. Because we hold no account data, most requests concern server logs or advertising cookies set by third parties; where that is the case we will explain who holds the data and how to reach them. Write to the address below and we will answer within a reasonable period.",
    "priv.p11": "Under the Philippine Data Privacy Act of 2012 (RA 10173) you may also contact the National Privacy Commission. Under the GDPR and similar laws you may contact your local supervisory authority.",
    "priv.h2h": "Security and retention",
    "priv.p12": "The site is served over HTTPS. Data necessarily held for security and aggregate statistics is kept only as long as it serves that purpose, then deleted or anonymised.",
    "priv.h2i": "Changes to this policy",
    "priv.p13": "If this policy changes, the date at the top of the page changes with it. Material changes will be visible on this page.",
    "priv.h2j": "Contact",
    "priv.p14": "Questions about this policy: <a href=\"mailto:contact@pcsolottohub.example\">contact@pcsolottohub.example</a>.",

    /* ---------- terms.html ---------- */
    "termsMeta.title": "Terms of Use | PCSO Lotto Hub",
    "termsMeta.desc": "Terms of use for PCSO Lotto Hub: an independent information site about Philippine PCSO lotto results, statistics and prize rules. No ticket sales, no gambling services, no affiliation with PCSO.",
    "terms.eyebrow": "Terms",
    "terms.h1": "Terms of use",
    "terms.lede": "What this site is, what it is not, and the limits on what you can rely on it for.",
    "terms.updated": "<strong>Last updated: November 16, 2026.</strong> By using lotto-tools.github.io/pcso-lotto-hub (the \u201csite\u201d) you agree to these terms. If you do not agree, please do not use the site.",
    "terms.s1h": "1. What the site is",
    "terms.s1p": "The site publishes information about Philippine Charity Sweepstakes Office (PCSO) lotto games: past draw results, number statistics derived from those results, a combination generator, and calculators for prize tax and claiming brackets. It is an independent information service.",
    "terms.s2h": "2. What the site is not",
    "terms.s2l1": "We are <strong>not affiliated with, endorsed by, sponsored by or connected to PCSO</strong> or any government body. \u201cPCSO\u201d, game names and draw results are used descriptively, to refer to PCSO's own games and published records.",
    "terms.s2l2": "We <strong>do not sell lottery tickets, accept bets, hold stakes, run draws, or pay prizes</strong>. We cannot validate a ticket, reserve numbers or transfer money. No page here is a place to gamble.",
    "terms.s2l3": "The site is <strong>not a financial, tax, legal or gambling-advisory service</strong>. The tax calculator applies a published rate to the amount you type; it is arithmetic, not advice, and PCSO's own computation at payout is final.",
    "terms.s3h": "3. Accuracy and source of the data",
    "terms.s3p1": "Draw results, jackpots and winner counts are taken from PCSO's published draw records, as mirrored in the open Lotto Tayo dataset (CC BY 4.0). We check each refresh for internal consistency \u2014 six numbers per draw, inside the game's pool, one draw per date, on the game's scheduled nights \u2014 and we state the coverage of our database on the pages that use it.",
    "terms.s3p2": "Even so, the site is provided \u201cas is\u201d. Data can be delayed, mis-transcribed upstream, or changed by PCSO. <strong>PCSO's official record prevails over anything shown here.</strong> Always confirm a win on PCSO's own publication or at a PCSO office before acting, and never rely on this site alone to decide whether a ticket won or how much it is worth.",
    "terms.s4h": "4. Statistics and generated combinations",
    "terms.s4p": "Every lottery draw is an independent random event. Frequencies, \u201chot\u201d and \u201ccold\u201d numbers, overdue numbers, sums and pairs describe past draws only. They do not predict, and cannot improve, the chance of winning: those odds are fixed by the number of possible combinations (1 in 40,475,358 for Ultra Lotto 6/58, for example). The generator produces random combinations inside your chosen filters and is offered for entertainment and study.",
    "terms.s5h": "5. Responsible play",
    "terms.s5p": "The site is intended for adults (18+). Lotto is a game of chance, and spending on it is spending, not investing. Play only what you can afford to lose, never borrow to play, and do not chase losses. If gambling is affecting your money, work, sleep or relationships, stop and talk to someone you trust, or contact a support service in your country. We do not encourage anyone to play.",
    "terms.s6h": "6. Intellectual property",
    "terms.s6p": "The site's design, text and code are ours. Draw data belongs to PCSO and is reproduced from its published records; the machine-readable dataset is credited to Lotto Tayo under CC BY 4.0. You may quote short extracts with a link to the site. You may not copy the site wholesale, resell it, or present its data or text as your own.",
    "terms.s7h": "7. Third-party links and advertising",
    "terms.s7p": "The site links to external websites and may display advertising served by third parties. We do not control and are not responsible for third-party content, products or privacy practices, and a link or an ad is not an endorsement. See the <a href=\"privacy.html\">privacy policy</a> for how advertising cookies work and how to opt out.",
    "terms.s8h": "8. Limitation of liability",
    "terms.s8p": "To the fullest extent permitted by law, we are not liable for any loss arising from use of the site or from reliance on its content \u2014 including a missed claim deadline, an incorrect expectation about a prize, a tax figure, or a decision made on the basis of statistics. Your use of the site and your play are your own responsibility.",
    "terms.s9h": "9. Changes",
    "terms.s9p": "We may change, suspend or withdraw any part of the site, and may update these terms. The date at the top of the page shows the current version; continued use after a change means you accept it.",
    "terms.s10h": "10. Contact",
    "terms.s10p": "Questions about these terms: <a href=\"mailto:contact@pcsolottohub.example\">contact@pcsolottohub.example</a>."
  };

  /* ---------- run-time strings: both languages ---------- */
  var DYN = {
    "d.heroLatest": { tl: "Pinakabagong draw · {wd}, {date} · 9:00 PM PHT", en: "Latest draw · {wd}, {date} · 9:00 PM PHT" },
    "d.winnersZero": { tl: "0 ang nanalo", en: "0 winners" },
    "d.winnersOne": { tl: "1 ang nanalo", en: "1 winner" },
    "d.winnersMany": { tl: "{n} ang nanalo", en: "{n} winners" },
    "d.nextDraw": { tl: "Susunod na draw: {label}", en: "Next draw: {label}" },
    "d.drawsStored": { tl: "{n} na draw ang naitala", en: "{n} draws stored" },
    "d.latestTitle": { tl: "{game} — pinakabagong resulta", en: "{game} — latest result" },
    "d.netSmall": { tl: "pagkatapos ng 20% final tax ({tax})", en: "after 20% final tax ({tax})" },
    "d.matchNone": { tl: "walang tumama sa 6 sa 6", en: "nobody matched 6 of 6" },
    "d.matchOne": { tl: "isang ticket ang tumama sa 6 sa 6", en: "one ticket matched 6 of 6" },
    "d.matchMany": { tl: "{n} ticket ang tumama sa 6 sa 6", en: "{n} tickets matched 6 of 6" },
    "d.prevDraw": { tl: "Nakaraang draw ({date}): {nums} — jackpot {jackpot}. ", en: "Previous draw ({date}): {nums} — jackpot {jackpot}. " },
    "d.showAll": { tl: "Ipakita lahat ng draw", en: "Show all draws" },
    "d.historyAll": { tl: "Lahat ng {n} naitalang draw · {from} – {to}", en: "All {n} stored draws · {from} – {to}" },
    "d.historyLast": { tl: "Huling {n} draw · {from} – {to}", en: "Last {n} stored draws · {from} – {to}" },
    "d.watchDraw": { tl: "▶ Panoorin ang draw (YouTube)", en: "▶ Watch Draw (YouTube)" },
    "d.channel": { tl: "Opisyal na channel ng PCSO ↗", en: "PCSO official channel ↗" },
    "d.watchAria": { tl: "Panoorin ang {game} draw ng {date} sa YouTube", en: "Watch the {game} draw of {date} on YouTube" },
    "d.channelAria": { tl: "Buksan ang opisyal na YouTube channel ng PCSO", en: "Open the official PCSO YouTube channel" },
    "d.trendBar": { tl: "{date} · {jackpot}", en: "{date} · {jackpot}" },
    "d.trendWonOne": { tl: " · 1 ang nanalo ng jackpot", en: " · 1 jackpot winner" },
    "d.trendWonMany": { tl: " · {n} ang nanalo ng jackpot", en: " · {n} jackpot winners" },
    "d.trendFoot": { tl: "30 draw · pinakamababa {min} · pinakamataas {max} · pinakabago {latest}. Ang gintong bar ay draw kung saan may nanalo ng jackpot at nag-reset ang premyo.", en: "30 draws · lowest {min} · highest {max} · latest {latest}. Gold bars mark draws a jackpot was won and the prize reset." },
    "d.pickDate": { tl: "Pumili ng petsa para makita ang draw na iyon.", en: "Pick a date to see that draw." },
    "d.noDraw": { tl: "Walang nahanap na draw.", en: "No stored draw found." },
    "d.exactDraw": { tl: "Eksaktong petsa ng draw", en: "Exact draw date" },
    "d.noDrawDay": { tl: "Walang draw sa araw na iyon", en: "No draw that day" },
    "d.whyAfter": { tl: " — ito ang pinakamaagang draw sa aming database, ipinakita dahil ang {date} ay bago pa magsimula ang coverage.", en: " — the earliest draw in our database, shown because {date} is before our coverage starts." },
    "d.whyBefore": { tl: " — ito ang pinakamalapit na naunang draw, ipinakita dahil walang draw ang {game} tuwing {date}.", en: " — the closest earlier draw, shown because {game} does not draw on {date}." },
    "d.dateCard": { tl: "Jackpot {jackpot} · {w} ang nanalo ng jackpot · neto pagkatapos ng 20% buwis {net}{why}", en: "Jackpot {jackpot} · {w} jackpot winner(s) · net after 20% tax {net}{why}" },
    "d.dateCardOne": { tl: "Jackpot {jackpot} · 1 ang nanalo ng jackpot · neto pagkatapos ng 20% buwis {net}{why}", en: "Jackpot {jackpot} · 1 jackpot winner · net after 20% tax {net}{why}" },
    "d.dateCardZero": { tl: "Jackpot {jackpot} · walang nanalo ng jackpot · neto pagkatapos ng 20% buwis {net}{why}", en: "Jackpot {jackpot} · 0 jackpot winners · net after 20% tax {net}{why}" },
    "d.genTitle": { tl: "{game} — smart na pili", en: "{game} — smart picker" },
    "d.statsTitle": { tl: "{game} — estadistika ng numero", en: "{game} — number statistics" },
    "d.statsRangeAll": { tl: "Lahat ng {n} draw · {from} – {to}", en: "All {n} draws · {from} – {to}" },
    "d.statsRangeLast": { tl: "Huling {n} draw · {from} – {to}", en: "Last {n} draws · {from} – {to}" },
    "d.overdueSmall": { tl: "{n} draw mula nang huling lumabas", en: "{n} draws since it appeared" },
    "d.heatCell": { tl: "Numero {n}: {c} beses lumabas sa {size} draw", en: "Number {n}: {c} appearances in {size} draws" },
    "d.legendFewest": { tl: "Pinakamadalang", en: "Fewest" },
    "d.legendAverage": { tl: "Karaniwan {x}", en: "Average {x}" },
    "d.legendMost": { tl: "Pinakamadalas", en: "Most" },
    "d.chipHot": { tl: "Numero {n} ay lumabas {c} beses", en: "Number {n} appeared {c} times" },
    "d.chipOverdue": { tl: "Numero {n} huling lumabas {g} draw na ang nakalipas", en: "Number {n} last appeared {g} draws ago" },
    "d.chipOverdueText": { tl: " {g} draw na", en: " {g} draws ago" },
    "d.chipOverdueTextOne": { tl: " 1 draw na", en: " 1 draw ago" },
    "d.oddRow": { tl: "{o} odd · {e} even", en: "{o} odd · {e} even" },
    "d.lowRow": { tl: "{l} low · {h} high", en: "{l} low · {h} high" },
    "d.lowHighDesc": { tl: "Low = 1 hanggang {lowMax}, high = {lowMax1} hanggang {max}. Ang bawat row ay bilang ng low na numero sa isang nanalong draw.", en: "Low = 1 to {lowMax}, high = {lowMax1} to {max}. Each row is how many low numbers a winning draw carried." },
    "d.sumDesc": { tl: "Kabuuan ng anim na panalong numero. Posibleng saklaw {min}–{max}; karaniwan sa saklaw na ito {avg} (naobserbahan {minSum}–{maxSum}).", en: "Total of the six winning numbers. Possible range {min}–{max}; average in this range {avg} (observed {minSum}–{maxSum})." },
    "d.notEnough": { tl: "Kulang pa ang mga draw.", en: "Not enough draws." },
    "d.oddsNote": { tl: "Ang isang ticket ay may 1 pagkakataon sa {odds} na tumama sa lahat ng anim na numero, kahit anong filter ang gamitin.", en: "A single ticket has 1 chance in {odds} of matching all six numbers, whatever filters you use." },
    "d.none": { tl: "wala", en: "none" },
    "d.pickSummary": { tl: "Kasama: {fixed} · Hindi kasama: {excluded}", en: "Included: {fixed} · Excluded: {excluded}" },
    "d.errMaxFixed": { tl: "Hanggang limang takdang numero lang — mag-alis muna ng isa.", en: "You can include up to five fixed numbers — remove one first." },
    "d.genPartial": { tl: "{n} lang sa 5 kombinasyon ang kasya sa mga filter — luwagan ang isa.", en: "Only {n} of 5 combinations fit those filters — loosen one filter to get five." },
    "d.details": { tl: "Detalye", en: "Details" },
    "d.hide": { tl: "Itago", en: "Hide" },
    "d.checkedAgainst": { tl: "Hinambing sa {n} draw:", en: "Checked against {n} draws:" },
    "d.matchChip": { tl: "{m} tama", en: "{m}-match" },
    "d.noHits": { tl: "Walang naitalang draw na may tatlo o higit pang numero mula rito.", en: "No stored draw shared three or more of these numbers." },
    "d.showingBest": { tl: "Ipinapakita ang 25 pinakamalapit sa {n}.", en: "Showing the 25 best matches of {n}." },
    "d.hitMatch": { tl: "{m}/6 tama", en: "{m}/6 match" },
    "d.emptyTitle": { tl: "Wala pang kombinasyon", en: "No combinations yet" },
    "d.emptyDesc": { tl: "Piliin ang mga filter, tapos pindutin ang “Gumawa ng 5 kombinasyon”.", en: "Choose your filters, then press “Generate 5 combinations”." },
    "d.calcSubTaxed": { tl: "mula sa premyong {gross} · 20% final tax ang ibinawas", en: "from a {gross} prize · 20% final tax withheld" },
    "d.calcSubFree": { tl: "mula sa premyong {gross} · walang buwis — ₱10,000 pababa", en: "from a {gross} prize · no tax — at or under ₱10,000" },
    "d.calcSubEmpty": { tl: "Ilagay ang halaga ng premyo para makita ang matatanggap", en: "Enter a prize amount to see the payout" },
    "d.gamePillTitle": { tl: "{game} — jackpot {j}", en: "{game} — jackpot {j}" },
    "d.quickTitle": { tl: "{game} na jackpot {j} ({date})", en: "{game} jackpot {j} ({date})" },
    "d.oddsCell": { tl: "1 sa {odds}", en: "1 in {odds}" },
    "d.storedCell": { tl: "{n} ({from} – {to})", en: "{n} ({from} – {to})" },
    "d.badgeDraws": { tl: "{n} draw", en: "{n} draws" },
    "d.numAria": { tl: "Numero {n}", en: "Number {n}" },
    "d.errFixedOut": { tl: "Ang takdang numerong {n} ay wala sa 1–{max}.", en: "Fixed number {n} is outside 1–{max}." },
    "d.errExcludedOut": { tl: "Ang inalis na numerong {n} ay wala sa 1–{max}.", en: "Excluded number {n} is outside 1–{max}." },
    "d.errMaxFixedCore": { tl: "Hanggang 5 takdang numero lang — kailangan ng ticket ng isang malayang pili.", en: "Include at most 5 fixed numbers — a ticket needs one free pick." },
    "d.errBoth": { tl: "Ang numerong {n} ay kasama at hindi kasama.", en: "Number {n} is both included and excluded." },
    "d.errRatioFixed": { tl: "Ang takdang numero mo ay labag na sa {ratio} odd/even na hati. Baguhin ang takdang numero o ang hati.", en: "Your fixed numbers already break the {ratio} odd/even split. Change the fixed numbers or the ratio." },
    "d.errPoolShort": { tl: "{n} numero na lang ang natira pagkatapos ng filter — kailangan pa ng {need} para sa ticket.", en: "Only {n} numbers are left after your filters — a ticket needs {need} more." },
    "d.errNoCombo": { tl: "Walang kombinasyong kasya sa lahat ng filter na iyon. Luwagan ang isa (odd/even o magkakasunod).", en: "No combination fits all of those filters. Loosen one of them (odd/even or consecutive)." },

    /* ---------- daily digit games (3D Lotto · 2D Lotto) ---------- */
    "d.dailyPillTitle": { tl: "{game} — {n} draw kada araw: {times}", en: "{game} — {n} draws every day: {times}" },
    "d.dailyTitleLatest": { tl: "{game} — pinakabagong resulta", en: "{game} — latest result" },
    "d.dailySlotWinnersSmall": { tl: "sa {slot} na draw", en: "on the {slot} draw" },
    "d.dailyShapeAny": { tl: "Kahit anong hugis", en: "Any shape" },
    "d.dailyHeroPrize": { tl: "Premyo (Standard, kada ₱10)", en: "Prize (Standard, per ₱10)" },
    "d.dailyHeroNet": { tl: "Neto pagkatapos ng 20% buwis", en: "Net after 20% tax" },
    "d.heroPrizeLabel": { tl: "Jackpot (bago ang buwis)", en: "Jackpot (before tax)" },
    "d.heroNetLabel": { tl: "Pagkatapos ng 20% TRAIN tax", en: "After 20% TRAIN tax" },
    "d.dailyEmptyTitle": { tl: "Wala pang kombinasyon", en: "No combinations yet" },
    "d.dailyHotTopSmall": { tl: "beses lumabas sa saklaw", en: "appearances in this range" },
    "d.dailyEmptyDesc": { tl: "Piliin ang mga filter, tapos pindutin ang “Gumawa ng 5 kombinasyon”.", en: "Choose your filters, then press “Generate 5 combinations”." },
    "d.dailyOddsNote": { tl: "isang ticket, kahit anong filter", en: "one ticket, whatever filters you use" },
    "d.dailyRange3": { tl: "0 – 9 (tatlong digit)", en: "0 – 9 (three digits)" },
    "d.dailyRange2": { tl: "01 – 31 (dalawang numero)", en: "01 – 31 (two numbers)" },
    "d.dailyLatest": { tl: "{slot} · {wd}, {date} — pinakabagong draw", en: "{slot} · {wd}, {date} — latest draw" },
    "d.dailyStored": { tl: "{n} draw · {days} araw", en: "{n} draws · {days} days" },
    "d.dailyNext": { tl: "Susunod: {label}", en: "Next: {label}" },
    "d.dailyTaxFree": { tl: "₱10,000 pababa, kaya walang buwis", en: "At or under ₱10,000 — no tax" },
    "d.dailyWinnersOne": { tl: "{n} ang nanalo sa draw na ito", en: "{n} winner on this draw" },
    "d.dailyWinnersMany": { tl: "{n} ang nanalo sa draw na ito", en: "{n} winners on this draw" },
    "d.dailyPrizeStd": { tl: "Standard — eksaktong ayos", en: "Standard — exact order" },
    "d.dailyPrizeRamDiff": { tl: "Rambolito 6 — tatlong magkaibang digit", en: "Rambolito 6 — three different digits" },
    "d.dailyPrizeRamPair": { tl: "Rambolito 3 — may pares", en: "Rambolito 3 — one pair" },
    "d.dailyPrizeRamAny": { tl: "Rambolito — kahit anong ayos", en: "Rambolito — any order" },
    "d.dailyPrizeNone": { tl: "Hindi available kapag pareho lahat ang digit", en: "Not available when every digit is the same" },
    "d.dailyPer10": { tl: "kada ₱10 na taya", en: "per ₱10 play" },
    "d.dailyOdds": { tl: "1 sa {n}", en: "1 in {n}" },
    "d.dailyTodayTitle": { tl: "{wd}, {date}", en: "{wd}, {date}" },
    "d.dailySlotNoDraw": { tl: "Wala pang resulta", en: "No result yet" },
    "d.dailySlotLine": { tl: "{nums} · {w} ang nanalo", en: "{nums} · {w} winners" },
    "d.dailyPos": { tl: "Ika-{i}", en: "No. {i}" },
    "d.dailyShapeAllDiff3": { tl: "Tatlong magkaibang digit", en: "Three different digits" },
    "d.dailyShapeOnePair": { tl: "May pares", en: "One pair" },
    "d.dailyShapeAllSame3": { tl: "Pareho lahat ng digit", en: "All three digits the same" },
    "d.dailyShapeDiff2": { tl: "Magkaibang numero", en: "Two different numbers" },
    "d.dailyShapeSame2": { tl: "Parehong numero", en: "Both numbers the same" },
    "d.dailyPool": { tl: "Pinapayagang numero: {list}", en: "Numbers in play: {list}" },
    "d.dailyExcludedList": { tl: "Hindi kasama: {list}", en: "Excluded: {list}" },
    "d.dailyAllNumbers": { tl: "lahat", en: "all" },
    "d.dailyStraightChip": { tl: "{m} eksaktong tamaan", en: "{m} straight hits" },
    "d.dailyRambolitoChip": { tl: "{m} Rambolito", en: "{m} Rambolito" },
    "d.dailyNoHistory": { tl: "Wala pang draw na tumama rito, eksakto man o Rambolito.", en: "No stored draw has matched this one, straight or on any order." },
    "d.dailyHitStraight": { tl: "Eksakto", en: "Straight" },
    "d.dailyHitRambolito": { tl: "Rambolito", en: "Rambolito" },
    "d.dailyEmptyToday": { tl: "Wala pang draw ngayong araw — ang pinakabago ay {date}.", en: "No draw yet today — the newest is {date}." },
    "d.dailyWatchAria": { tl: "Panoorin ang {game} draw ng {date}, {slot}, sa YouTube", en: "Watch the {game} draw of {date}, {slot}, on YouTube" },
    "d.dailyTitleStats": { tl: "{game} — estadistika ng numero", en: "{game} — number statistics" },
    "d.dailyTitleGen": { tl: "{game} — simpleng tagapili", en: "{game} — combination picker" },
    "d.dErrExcludedOut": { tl: "Ang inalis na numerong {n} ay wala sa {min}–{max}.", en: "Excluded number {n} is outside {min}–{max}." },
    "d.dErrFixedOut": { tl: "Ang takdang numerong {n} ay wala sa {min}–{max}.", en: "Fixed number {n} is outside {min}–{max}." },
    "d.dErrBoth": { tl: "Ang numerong {n} ay takda at hindi kasama.", en: "Number {n} is both fixed and excluded." },
    "d.dErrPoolEmpty": { tl: "Naalis lahat ng numero — mag-iwan ng kahit isa.", en: "Every number is excluded — leave at least one in play." },
    "d.dErrShapeFixed": { tl: "Hindi tugma ang takdang digit sa piniling hugis.", en: "The fixed digits do not fit the chosen shape." },
    "d.dErrNoCombo": { tl: "Walang kombinasyong kasya sa filter — luwagan ang hugis o ang inalis na numero.", en: "No combination fits those filters — loosen the shape or the excluded numbers." }
  };

  /* ---------- language resolution ---------- */
  function readQuery() {
    try {
      var q = new URLSearchParams(root.location.search).get("lang");
      return q ? String(q).toLowerCase() : null;
    } catch (e) { return null; }
  }
  function readStore() {
    try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }
  function writeStore(v) { try { localStorage.setItem(STORE_KEY, v); } catch (e) {} }

  var queryLang = readQuery();
  var lang = LANGS.indexOf(queryLang) !== -1 ? queryLang
           : LANGS.indexOf(readStore()) !== -1 ? readStore()
           : DEFAULT_LANG;
  if (LANGS.indexOf(queryLang) !== -1) writeStore(queryLang);

  /* ---------- static text ---------- */
  var nodes = [];
  function collect() {
    nodes = [];
    var list = document.querySelectorAll("[data-i18n],[data-i18n-html]");
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      var htmlKey = el.getAttribute("data-i18n-html");
      var mode = htmlKey ? "html" : (el.getAttribute("data-i18n-attr") ? "attr" : "text");
      nodes.push({
        el: el,
        key: el.getAttribute("data-i18n") || htmlKey,
        mode: mode,
        attr: el.getAttribute("data-i18n-attr"),
        orig: mode === "attr" ? el.getAttribute(el.getAttribute("data-i18n-attr"))
              : mode === "html" ? el.innerHTML : el.textContent
      });
    }
  }

  function applyStatic() {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (lang === "en") {
        var v = EN[n.key];
        if (v == null) continue;
        if (n.mode === "attr") n.el.setAttribute(n.attr, v);
        else if (n.mode === "html") n.el.innerHTML = v;
        else n.el.textContent = v;
      } else {
        if (n.mode === "attr") n.el.setAttribute(n.attr, n.orig);
        else if (n.mode === "html") n.el.innerHTML = n.orig;
        else n.el.textContent = n.orig;
      }
    }
    if (document.documentElement) {
      document.documentElement.setAttribute("lang", lang === "tl" ? "tl" : "en");
      document.documentElement.setAttribute("data-lang", lang);
    }
  }

  /* ---------- run-time helpers ---------- */
  function fill(tpl, vars) {
    if (!tpl) return "";
    if (!vars) return tpl;
    return tpl.replace(/\{(\w+)\}/g, function (m, k) {
      return vars[k] === undefined || vars[k] === null ? m : String(vars[k]);
    });
  }

  function t(key, vars) {
    var row = DYN[key];
    if (row) return fill(row[lang] || row.en, vars);
    if (lang === "en") return fill(EN[key], vars) || key;
    return key;
  }

  /* ---------- switcher ---------- */
  function paintSwitch() {
    var btns = document.querySelectorAll(".lang-switch [data-lang]");
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute("data-lang") === lang;
      btns[i].setAttribute("aria-pressed", on ? "true" : "false");
      btns[i].classList.toggle("is-active", on);
    }
  }

  function syncUrl() {
    try {
      if (!root.history || !root.URL) return;
      var u = new URL(root.location.href);
      if (!u.searchParams.has("lang")) return;
      u.searchParams.set("lang", lang);
      root.history.replaceState(null, "", u.toString());
    } catch (e) {}
  }

  function setLang(next, opts) {
    if (LANGS.indexOf(next) === -1 || next === lang) {
      paintSwitch();
      return;
    }
    lang = next;
    writeStore(lang);
    applyStatic();
    paintSwitch();
    if (opts && opts.syncUrl !== false) syncUrl();
    if (!opts || opts.rerender !== false) {
      if (root.PCSOApp && root.PCSOApp.renderAll) root.PCSOApp.renderAll();
    }
  }

  function bind() {
    document.addEventListener("click", function (e) {
      var b = e.target && e.target.closest ? e.target.closest(".lang-switch [data-lang]") : null;
      if (!b) return;
      e.preventDefault();
      setLang(b.getAttribute("data-lang"));
    });
  }

  collect();
  applyStatic();
  paintSwitch();
  bind();

  root.PCSO_I18N = {
    lang: lang,
    getLang: function () { return lang; },
    t: t,
    setLang: setLang,
    applyStatic: applyStatic,
    languages: LANGS.slice(),
    has: function (key) { return !!(DYN[key] || EN[key]); },
    keys: function () { return Object.keys(EN); }
  };
})(typeof window !== "undefined" ? window : globalThis);
