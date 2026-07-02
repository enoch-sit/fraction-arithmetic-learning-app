/* FractionApp38_v2.js — PROTOTYPE (measurement / "幾杯" model for fraction division)
   Built from CRITIQUE_FractionApp38_Division.md.
   Idea: 被除數 ÷ 除數 = 「被除數裡面可以裝出幾杯（每杯 = 除數）？」
   - The child lays the divisor-cup along the dividend themselves (tap or drag).
   - Number line + labels stay visible the whole time.
   - The last, not-full cup is shown AND read as the fractional part of the answer.
   - No forced common-denominator ritual, no 模具 jargon, tap-first + touch-safe. */

document.addEventListener('contextmenu', e => e.preventDefault());
document.onkeydown = function (e) {
    if (e.keyCode === 123) return false;
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) return false;
    if (e.ctrlKey && (e.keyCode === 67 || e.keyCode === 85 || e.keyCode === 83)) return false;
};

/* ===== state ===== */
let currentWordProblemTemplate = null;
let currentSpeed = 1.0;
let s1 = 1, s2 = 1;                            // 擴分/約分 scale factors (dividend, divisor)
let bar1Visible = false, bar2Visible = false; // dividend, divisor
let cupsPlaced = 0;
let divDone = false;

const wordProblemTemplates = [
    "有 [FRAC1] 公升的果汁，每杯裝 [FRAC2] 公升，可以裝出幾杯？",
    "一條 [FRAC1] 公尺的緞帶，每 [FRAC2] 公尺剪一段，可以剪成幾段？",
    "有 [FRAC1] 公斤的麵粉，每包裝 [FRAC2] 公斤，可以裝成幾包？",
    "有 [FRAC1] 塊蛋糕，每人吃 [FRAC2] 塊，可以分給幾個人？"
];

/* ===== helpers ===== */
function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function lcm(a, b) { return (a * b) / gcd(a, b); }

function getFracHtml(n, d, color = "inherit") {
    return `<div class="inline-frac" style="color:${color};"><span>${n}</span><div class="line"></div><span>${d}</span></div>`;
}
function getDisplayHtml(w, n, d, color) {
    if (w > 0) return `<div style="display:inline-flex; align-items:center;"><span style="color:${color}; font-size:1.8rem; font-weight:bold; margin-right:4px; line-height:1;">${w}</span>${getFracHtml(n, d, color)}</div>`;
    return getFracHtml(n, d, color);
}
function reducedFrac(n, d, color) { let g = gcd(n, d) || 1; return getFracHtml(n / g, d / g, color); }

function getSafeValues() {
    let w1 = parseInt(document.getElementById('w1').value) || 0;
    let d1 = parseInt(document.getElementById('d1').value) || 1;
    let n1 = parseInt(document.getElementById('n1').value) || 0;
    let w2 = parseInt(document.getElementById('w2').value) || 0;
    let d2 = parseInt(document.getElementById('d2').value) || 1;
    let n2 = parseInt(document.getElementById('n2').value) || 0;
    if (w1 < 0) w1 = 0; if (w2 < 0) w2 = 0;
    if (d1 < 1) d1 = 1; if (d1 > 100) d1 = 100;
    if (d2 < 1) d2 = 1; if (d2 > 100) d2 = 100;
    if (n1 < 0) n1 = 0; if (n2 < 0) n2 = 0;
    if (w1 === 0 && n1 === 0) n1 = 1;
    if (w2 === 0 && n2 === 0) n2 = 1;
    return { w1, n1, d1, w2, n2, d2, total_n1: w1 * d1 + n1, total_n2: w2 * d2 + n2 };
}
function enforceInputLimits() { const s = getSafeValues(); document.getElementById('d1').value = s.d1; document.getElementById('d2').value = s.d2; }

function updateMaxWholes() {
    const v = getSafeValues();
    let a = v.total_n1 / v.d1, b = v.total_n2 / v.d2;
    document.documentElement.style.setProperty('--max-wholes', Math.max(1, Math.ceil(a), Math.ceil(b)));
}
function getMaxW() { return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1; }

/* ===== quantities (measurement model) =====
   The child makes both grids the same size with 擴分/約分 (s1, s2).
   Measuring only starts once d1*s1 === d2*s2 (the cells are the same size),
   so every cup boundary lands on a grid line the child created themselves. */
function dividendVal() { const v = getSafeValues(); return v.total_n1 / v.d1; }   // a (wholes)
function divisorVal() { const v = getSafeValues(); return v.total_n2 / v.d2; }    // b = one cup (wholes)
function cd() { const v = getSafeValues(); return v.d1 * s1; }                     // common denominator (cells per whole)
function denomsEqual() { const v = getSafeValues(); return v.d1 * s1 === v.d2 * s2; }
function aCells() { const v = getSafeValues(); return v.total_n1 * s1; }           // dividend length, in cells
function bCells() { const v = getSafeValues(); return v.total_n2 * s2; }           // one cup, in cells
function fullCups() { return Math.floor(aCells() / bCells()); }
function leftoverCells() { return aCells() % bCells(); }
function totalCups() { return fullCups() + (leftoverCells() > 0 ? 1 : 0); }

/* ===== header controls ===== */
function toggleWholeNumber() {
    const show = document.getElementById('show-whole-cb').checked;
    document.getElementById('w1').style.display = show ? 'inline-block' : 'none';
    document.getElementById('w2').style.display = show ? 'inline-block' : 'none';
    if (!show) { document.getElementById('w1').value = ''; document.getElementById('w2').value = ''; document.getElementById('ans-w').value = ''; }
    updateUI();
}
function updateSpeed() {
    currentSpeed = parseFloat(document.getElementById('speed-slider').value);
    document.getElementById('speed-val').innerText = currentSpeed.toFixed(1);
    document.documentElement.style.setProperty('--anim-time', (0.6 / currentSpeed) + 's');
}
function toggleNumberLine() { if (bar1Visible) renderDividend(); if (bar2Visible) renderDivisor(); }

/* ===== number line (shared builder) ===== */
function numberLineHtml(currentD, maxW) {
    let html = '';
    for (let i = 0; i < maxW; i++) {
        let labels = '';
        for (let k = 0; k < currentD; k++) {
            let valHtml = (k === 0)
                ? `<span style="font-weight:bold; font-size:1.1rem; color:var(--dark);">${i}</span>`
                : `<div class="inline-frac" style="font-size:0.8em; color:var(--dark);"><span>${k}</span><div class="line"></div><span>${currentD}</span></div>`;
            if (k > 0 && i > 0) valHtml = `<div style="display:flex; align-items:center;"><span style="font-weight:bold; font-size:1.0rem; margin-right:2px; color:var(--dark);">${i}</span>${valHtml}</div>`;
            labels += `<div style="position:absolute; left:${(k / currentD) * 100}%; top:0; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; z-index:5;"><div style="width:2px; height:6px; background:var(--dark); margin-bottom:2px;"></div>${valHtml}</div>`;
        }
        if (i === maxW - 1) labels += `<div style="position:absolute; left:100%; top:0; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; z-index:5;"><div style="width:2px; height:6px; background:var(--dark); margin-bottom:2px;"></div><span style="font-weight:bold; font-size:1.1rem; color:var(--dark);">${i + 1}</span></div>`;
        html += `<div class="nl-unit">${labels}</div>`;
    }
    return html;
}
function renderNumberLine(nlId, currentD) {
    const nl = document.getElementById(nlId);
    if (!nl) return;
    const show = document.getElementById('show-nl-cb').checked;
    nl.classList.add('continuous');
    if (show) { nl.innerHTML = numberLineHtml(currentD, getMaxW()); nl.style.display = 'flex'; }
    else { nl.innerHTML = ''; nl.style.display = 'none'; }
}

function gridLinesHtml(d) {
    let h = '';
    for (let k = 1; k < d; k++) h += `<div class="abs-thin-line" style="left:${(k / d) * 100}%;"></div>`;
    return h;
}

/* ===== 擴分 / 約分 grid animation (thick = original cells, thin = subdivisions) ===== */
function applyGridAnimation(gridOverlay, d, s, old_s, action) {
    let animMs = (0.6 / currentSpeed) * 1000, half = animMs / 2;
    let html = '';
    for (let k = 1; k < d; k++) html += `<div class="abs-thick-line" style="left:${(k / d) * 100}%;"></div>`;
    if (action === 'simplify') {
        for (let k = 0; k < d; k++) {
            let removeJ = Math.floor(old_s / 2);
            for (let j = 1; j < old_s; j++) {
                let oldLeft = ((k * old_s + j) / (d * old_s)) * 100;
                if (j === removeJ) html += `<div class="abs-thin-line removed-line" style="left:${oldLeft}%; height:100%; transition:height ${half}ms ease-in;"></div>`;
                else { let nj = j < removeJ ? j : j - 1; let nl = ((k * s + nj) / (d * s)) * 100; html += `<div class="abs-thin-line retained-line" style="left:${oldLeft}%; height:100%; transition:left ${half}ms ease-out;" data-target-left="${nl}%"></div>`; }
            }
        }
        gridOverlay.innerHTML = html;
        setTimeout(() => gridOverlay.querySelectorAll('.removed-line').forEach(l => l.style.height = '0%'), 50);
        setTimeout(() => gridOverlay.querySelectorAll('.retained-line').forEach(l => l.style.left = l.getAttribute('data-target-left')), 50 + half);
    } else if (action === 'expand') {
        for (let k = 0; k < d; k++) for (let j = 1; j < s; j++) html += `<div class="abs-thin-line expand-anim-line" style="left:${((k * s + j) / (d * s)) * 100}%; height:0%; background:var(--orange); transition:height ${animMs}ms cubic-bezier(0.4,0,0.2,1), background-color ${animMs}ms;"></div>`;
        gridOverlay.innerHTML = html;
        setTimeout(() => gridOverlay.querySelectorAll('.expand-anim-line').forEach(l => { l.style.height = '100%'; setTimeout(() => l.style.background = 'var(--dark)', animMs); }), 50);
    } else {
        for (let k = 0; k < d; k++) for (let j = 1; j < s; j++) html += `<div class="abs-thin-line" style="left:${((k * s + j) / (d * s)) * 100}%;"></div>`;
        gridOverlay.innerHTML = html;
    }
}

/* ===== apply 擴分 (expand) / 約分 (simplify) to a bar ===== */
function applyTool(num, action) {
    if (divDone) return;
    let changed = false, old = num === 1 ? s1 : s2;
    if (num === 1) { if (action === 'expand') { s1++; changed = true; } else if (action === 'simplify' && s1 > 1) { s1--; changed = true; } }
    else { if (action === 'expand') { s2++; changed = true; } else if (action === 'simplify' && s2 > 1) { s2--; changed = true; } }
    if (!changed) return;
    cupsPlaced = 0; divDone = false;
    hideAnswer();
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('pulse'));
    if (num === 1) renderDividend(action, old); else renderDivisor(action, old);
    setTimeout(() => {
        if (bar1Visible) renderDividend('none');
        if (bar2Visible) renderDivisor('none');
        updateStage();
    }, 50 + (0.6 / currentSpeed) * 1000 + 30);
}

/* ===== reveal bars ===== */
function onFrac1Click() {
    let row = document.getElementById('bar1-row');
    row.style.display = 'flex';
    bar1Visible = true; s1 = 1; cupsPlaced = 0; divDone = false;
    hideAnswer();
    renderDividend();
    row.classList.remove('fade-in-slow'); void row.offsetWidth; row.classList.add('fade-in-slow');
    let c = document.getElementById('frac1-group'); if (c) c.classList.add('revealed');
    updateStage();
}
function onFrac2Click() {
    let row = document.getElementById('bar2-row');
    row.style.display = 'flex';
    bar2Visible = true; s2 = 1; cupsPlaced = 0; divDone = false;
    hideAnswer();
    renderDivisor();
    if (bar1Visible) renderDividend();
    row.classList.remove('fade-in-slow'); void row.offsetWidth; row.classList.add('fade-in-slow');
    let c = document.getElementById('frac2-group'); if (c) c.classList.add('revealed');
    updateStage();
}

/* ===== render dividend (red) + cups overlay ===== */
function renderDividend(action = 'none', old_s = 1) {
    const v = getSafeValues(), maxW = getMaxW();
    const D = v.d1 * s1, TN = v.total_n1 * s1;
    const wrap = document.getElementById('bar1-wrap');
    wrap.classList.add('continuous');
    if (action === 'none') {
        wrap.innerHTML = '';
        for (let i = 0; i < maxW; i++) { let u = document.createElement('div'); u.className = 'bar-unit'; u.innerHTML = `<div class="bar-fill"></div><div class="grid-overlay"></div>`; wrap.appendChild(u); }
    }
    wrap.querySelectorAll('.bar-unit').forEach((unit, i) => {
        let fill = unit.querySelector('.bar-fill'), grid = unit.querySelector('.grid-overlay');
        let pct = (Math.max(0, Math.min(D, TN - (i * D))) / D) * 100;
        if (fill) { fill.style.width = `${pct}%`; fill.style.background = 'var(--red)'; }
        if (grid) applyGridAnimation(grid, v.d1, s1, old_s, action);
    });
    renderCups();
    renderNumberLine('bar1-nl', D);
    let lbl = document.getElementById('label1');
    lbl.style.opacity = '1';
    lbl.innerHTML = `<div class="bar-tag red-tag">被除數（紅）</div>` + getDisplayHtml(v.w1, v.n1 * s1, v.d1 * s1, 'var(--red)');
}

function renderCups() {
    const wrap = document.getElementById('bar1-wrap');
    let old = wrap.querySelector('.cups-overlay'); if (old) old.remove();
    if (!bar2Visible || !denomsEqual()) return;

    const G = cd(), aC = aCells(), bC = bCells(), full = fullCups(), left = leftoverCells(), total = totalCups();
    const maxW = getMaxW();
    let ov = document.createElement('div');
    ov.className = 'cups-overlay';

    for (let i = 0; i < total; i++) {
        const isPartial = (i === full && left > 0);
        const startCells = i * bC;
        const widthCells = isPartial ? left : bC;
        let cup = document.createElement('div');
        cup.className = 'cup';
        cup.style.left = ((startCells / G) / maxW) * 100 + '%';
        cup.style.width = ((widthCells / G) / maxW) * 100 + '%';
        if (isPartial) cup.classList.add('partial');

        if (i < cupsPlaced) {
            cup.classList.add('measured');
            let badge = document.createElement('div');
            badge.className = 'cup-badge';
            if (isPartial) { badge.classList.add('frac-badge'); badge.innerHTML = reducedFrac(left, bC, 'var(--dark)'); }
            else { badge.classList.add('one-badge'); badge.innerHTML = '1'; }
            cup.appendChild(badge);
        } else if (i === cupsPlaced && !divDone) {
            cup.classList.add('next');
            cup.innerHTML = isPartial
                ? `<div class="cup-hint">👆<br><span>放最後不滿 1 的一份</span></div>`
                : `<div class="cup-hint">👆<br><span>放下一個 1</span></div>`;
            cup.onclick = () => placeCup(null);
        } else {
            cup.classList.add('pending');
        }
        ov.appendChild(cup);
    }
    wrap.appendChild(ov);
}

/* ===== render divisor (blue) = one cup = the new unit "1" =====
   The bar is TRIMMED to its own length (one cup) by clipping a full-width inner
   bar, so the blue "1" is drawn at exactly the same length as one cup on the
   dividend (same per-unit pixel size, just no empty trailing frame). */
function renderDivisor(action = 'none', old_s = 1) {
    const v = getSafeValues(), maxW = getMaxW();
    const D = v.d2 * s2;                 // cells per whole
    const val = v.total_n2 / v.d2;       // divisor length in wholes (= one cup); stable across 擴分/約分
    const wrap = document.getElementById('bar2-wrap');
    wrap.classList.add('clip-cup');
    wrap.classList.remove('continuous');
    const wPct = (val / maxW * 100) + '%';
    wrap.style.width = wPct; wrap.style.maxWidth = wPct;   // trim outer box to one-cup length

    let inner = wrap.querySelector('.bar-inner');
    if (action === 'none' || !inner) {
        wrap.innerHTML = '';
        inner = document.createElement('div');
        inner.className = 'bar-wrap-container continuous bar-inner';
        for (let i = 0; i < maxW; i++) { let u = document.createElement('div'); u.className = 'bar-unit'; u.innerHTML = `<div class="bar-fill"></div><div class="grid-overlay"></div>`; inner.appendChild(u); }
        wrap.appendChild(inner);
    }
    inner.style.width = (maxW / val * 100) + '%';  // inner spans full column width → units stay same px as dividend
    inner.querySelectorAll('.bar-unit').forEach((unit, i) => {
        let fill = unit.querySelector('.bar-fill'), grid = unit.querySelector('.grid-overlay');
        let pct = (Math.max(0, Math.min(D, (v.total_n2 * s2) - (i * D))) / D) * 100;
        if (fill) { fill.style.width = `${pct}%`; fill.style.background = 'var(--blue)'; }
        if (grid) applyGridAnimation(grid, v.d2, s2, old_s, action);
    });

    // brand the whole (trimmed) bar as the new unit "1" — this is what the child drags
    let oneOv = wrap.querySelector('.unit-one-overlay'); if (oneOv) oneOv.remove();
    oneOv = document.createElement('div');
    oneOv.className = 'unit-one-overlay';
    oneOv.innerHTML = '<span>1</span>';
    wrap.appendChild(oneOv);

    renderDivisorNumberLine(D, val, maxW);
    let lbl = document.getElementById('label2');
    lbl.style.opacity = '1';
    lbl.innerHTML = `<div class="bar-tag blue-tag">一杯 ＝ <b>1</b>（除數）</div>` + getDisplayHtml(v.w2, v.n2 * s2, v.d2 * s2, 'var(--blue)');
    attachDivisorDrag();
}

/* number line under the divisor, trimmed to one-cup length (same tick style as the shared component) */
function renderDivisorNumberLine(currentD, val, maxW) {
    const nl = document.getElementById('bar2-nl');
    if (!nl) return;
    const show = document.getElementById('show-nl-cb').checked;
    nl.classList.remove('continuous');
    if (!show) { nl.innerHTML = ''; nl.style.display = 'none'; return; }
    nl.classList.add('clip-cup-nl');
    nl.style.display = 'block';
    const wPct = (val / maxW * 100) + '%';
    nl.style.width = wPct; nl.style.maxWidth = wPct;
    let inner = document.createElement('div');
    inner.className = 'nl-wrap-container continuous';
    inner.style.width = (maxW / val * 100) + '%';
    inner.innerHTML = numberLineHtml(currentD, maxW);
    nl.innerHTML = '';
    nl.appendChild(inner);
}

/* ===== place a cup (tap, or drop of the dragged divisor) ===== */
function placeCup(fromRect) {
    if (divDone || !bar1Visible || !bar2Visible || !denomsEqual()) return;
    if (cupsPlaced >= totalCups()) return;
    // optional fly animation from a dropped clone
    if (fromRect) {
        let nextCup = document.querySelector('#bar1-wrap .cup.next');
        if (nextCup) {
            let tRect = nextCup.getBoundingClientRect();
            let clone = document.createElement('div');
            clone.className = 'fly-cup';
            clone.innerHTML = '<span class="fly-one">1</span>';
            clone.style.cssText = `position:fixed; left:${fromRect.left}px; top:${fromRect.top}px; width:${fromRect.width}px; height:${fromRect.height}px; z-index:9999;`;
            document.body.appendChild(clone);
            let dur = 0.45 / currentSpeed;
            clone.style.transition = `left ${dur}s ease, top ${dur}s ease, width ${dur}s ease, height ${dur}s ease`;
            void clone.offsetWidth;
            clone.style.left = tRect.left + 'px'; clone.style.top = tRect.top + 'px';
            clone.style.width = tRect.width + 'px'; clone.style.height = tRect.height + 'px';
            setTimeout(() => clone.remove(), dur * 1000 + 40);
        }
    }
    cupsPlaced++;
    renderCups();
    pulseLastCup();
    updateCounter();
    if (cupsPlaced >= totalCups()) { divDone = true; setTimeout(revealAnswer, 350 / currentSpeed); }
}

function pulseLastCup() {
    let cups = document.querySelectorAll('#bar1-wrap .cup.measured');
    let last = cups[cups.length - 1];
    if (last) { last.classList.add('just-placed'); setTimeout(() => last.classList.remove('just-placed'), 600); }
}

/* ===== drag the divisor onto the dividend ===== */
let divDrag = null;
function attachDivisorDrag() {
    const wrap = document.getElementById('bar2-wrap');
    wrap.style.touchAction = 'none';
    wrap.onpointerdown = (e) => {
        if (divDone || !bar1Visible || !denomsEqual()) return;
        e.preventDefault();
        let rect = wrap.getBoundingClientRect();
        divDrag = { startX: e.clientX, startY: e.clientY, moved: false, rect, clone: null };
        try { wrap.setPointerCapture(e.pointerId); } catch (_) { }
        wrap.onpointermove = onDivMove;
        wrap.onpointerup = onDivUp;
        wrap.onpointercancel = onDivUp;
    };
}
function onDivMove(e) {
    if (!divDrag) return;
    if (!divDrag.moved && Math.hypot(e.clientX - divDrag.startX, e.clientY - divDrag.startY) > 6) {
        divDrag.moved = true;
        let c = document.createElement('div');
        c.className = 'fly-cup';
        c.innerHTML = '<span class="fly-one">1</span>';
        c.style.cssText = `position:fixed; width:${divDrag.rect.width}px; height:${divDrag.rect.height}px; z-index:9999;`;
        document.body.appendChild(c);
        divDrag.clone = c;
    }
    if (divDrag.moved && divDrag.clone) {
        divDrag.clone.style.left = (e.clientX - divDrag.rect.width / 2) + 'px';
        divDrag.clone.style.top = (e.clientY - divDrag.rect.height / 2) + 'px';
        highlightDividend(isOverDividend(e.clientX, e.clientY));
    }
}
function onDivUp(e) {
    if (!divDrag) return;
    let d = divDrag; divDrag = null;
    let wrap = e.currentTarget;
    wrap.onpointermove = null; wrap.onpointerup = null; wrap.onpointercancel = null;
    highlightDividend(false);
    if (d.clone) d.clone.remove();
    if (d.moved && isOverDividend(e.clientX, e.clientY)) placeCup(d.rect);
}
function isOverDividend(x, y) {
    let w = document.getElementById('bar1-wrap'); if (!w) return false;
    let r = w.getBoundingClientRect();
    return x >= r.left - 10 && x <= r.right + 10 && y >= r.top - 20 && y <= r.bottom + 20;
}
function highlightDividend(on) { let w = document.getElementById('bar1-wrap'); if (w) w.classList.toggle('measure-hot', !!on); }

/* ===== stage / counter ===== */
function updateStage() {
    const instr = document.getElementById('drag-instruction');
    if (!bar1Visible || !bar2Visible) {
        instr.innerHTML = `💡 先點一下上面的分數，把它變成長條圖`;
        document.getElementById('counter-chip').style.display = 'none';
        updateTargetChip();
        return;
    }
    updateTargetChip();
    if (!denomsEqual()) {
        instr.innerHTML = `💡 兩條的格子要先<b>一樣大</b>！用右邊的 <b>➕擴分</b> / <b>➖約分</b> 把格子調成一樣大`;
        document.getElementById('counter-chip').style.display = 'none';
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.add('pulse'));
        return;
    }
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('pulse'));
    instr.innerHTML = `💡 格子一樣大了！把藍色的「<b>1</b>」（一杯＝除數）<b>拖</b>到紅色上，數數看裡面有幾個「1」`;
    renderCups();
    updateCounter();
}

function updateTargetChip() {
    const chip = document.getElementById('target-chip');
    if (!chip) return;
    if (!bar1Visible || !bar2Visible) { chip.style.display = 'none'; return; }
    const v = getSafeValues();
    chip.style.display = 'inline-flex';
    if (denomsEqual()) { chip.className = 'target-chip ok'; chip.innerHTML = `✅ 格子一樣大（都是 ${v.d1 * s1} 等分）`; }
    else { chip.className = 'target-chip warn'; chip.innerHTML = `🎯 紅 ${v.d1 * s1} 等分 · 藍 ${v.d2 * s2} 等分，調成一樣大`; }
}

function updateCounter() {
    const chip = document.getElementById('counter-chip');
    if (!bar1Visible || !bar2Visible || !denomsEqual()) { chip.style.display = 'none'; return; }
    chip.style.display = 'inline-flex';
    const full = fullCups(), left = leftoverCells(), bC = bCells();
    if (cupsPlaced === 0) { chip.className = 'counter-chip'; chip.innerHTML = `把藍色的「1」一杯一杯拖過來 👉 每一杯都是一個 <b>1</b>`; return; }
    let placedFull = Math.min(cupsPlaced, full);
    let partialShown = cupsPlaced > full && left > 0;
    let fcol = partialShown ? '#fff' : 'var(--dark)';
    let parts = [];
    for (let i = 0; i < placedFull; i++) parts.push('<b>1</b>');
    if (partialShown) parts.push(reducedFrac(left, bC, fcol));
    let expr = parts.join(' ＋ ');
    if (partialShown) {
        chip.className = 'counter-chip ok';
        chip.innerHTML = `${expr} &nbsp;（${placedFull} 個 1，再加不滿 1 的一份）`;
    } else {
        chip.className = 'counter-chip';
        chip.innerHTML = `${expr} &nbsp;（已放下 <b>${placedFull}</b> 個 1）`;
    }
}

/* ===== answer ===== */
function revealAnswer() {
    const v = getSafeValues();
    const full = fullCups(), left = leftoverCells(), bC = bCells();
    const instr = document.getElementById('drag-instruction');

    let ones = Array(full).fill('<b>1</b>').join(' ＋ ');
    let expr = ones + (left > 0 ? ((full > 0 ? ' ＋ ' : '') + reducedFrac(left, bC, 'var(--red)')) : '');
    let summary = `💡 每一個「1」就是一杯。你量出了 ${expr} ＝ `;
    if (left === 0) summary += `<b>${full}</b> 杯（剛剛好！）`;
    else if (full === 0) summary += `不到 1 杯，只有 ${reducedFrac(left, bC, 'var(--red)')} 杯`;
    else summary += `<b>${full}</b> 又 ${reducedFrac(left, bC, 'var(--red)')} 杯`;
    summary += `。把答案填進下面吧！`;
    instr.innerHTML = summary;

    const zone = document.getElementById('bottom-answer-zone');
    zone.style.display = 'flex'; setTimeout(() => zone.style.opacity = '1', 50);
    document.getElementById('bot-frac1').innerHTML = getDisplayHtml(v.w1, v.n1, v.d1, 'var(--red)');
    document.getElementById('bot-frac2').innerHTML = getDisplayHtml(v.w2, v.n2, v.d2, 'var(--blue)');

    const exactN = v.total_n1 * v.d2, exactD = v.total_n2 * v.d1;
    if (exactN >= exactD) document.getElementById('ans-w').style.display = 'inline-block';
    else { document.getElementById('ans-w').style.display = 'none'; document.getElementById('ans-w').value = ''; }
}

function hideAnswer() {
    const zone = document.getElementById('bottom-answer-zone');
    zone.style.opacity = '0';
    setTimeout(() => { zone.style.display = 'none'; }, 200);
}

/* ===== build layout ===== */
function updateUI() {
    enforceInputLimits(); updateMaxWholes();
    const v = getSafeValues();
    s1 = 1; s2 = 1; bar1Visible = false; bar2Visible = false; cupsPlaced = 0; divDone = false;

    let wp = document.getElementById('word-problem');
    if (currentWordProblemTemplate) {
        wp.innerHTML = currentWordProblemTemplate.replace(/\[FRAC1\]/g, `<b>${getDisplayHtml(v.w1, v.n1, v.d1, 'var(--red)')}</b>`).replace(/\[FRAC2\]/g, `<b>${getDisplayHtml(v.w2, v.n2, v.d2, 'var(--blue)')}</b>`);
        wp.style.display = 'block';
    } else wp.style.display = 'none';

    ['ans-w', 'ans-num', 'ans-den'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('ans-w').style.display = 'none';
    document.getElementById('feedback').style.opacity = '0';
    hideAnswer();
    document.getElementById('counter-chip').style.display = 'none';
    let tchip = document.getElementById('target-chip'); if (tchip) tchip.style.display = 'none';

    document.getElementById('anim-area').innerHTML = `
        <div id="bar1-row" class="bar-row" style="display:none;">
            <div id="label1" class="bar-label"></div>
            <div class="bars-column"><div id="bar1-wrap" class="bar-wrap-container"></div><div id="bar1-nl" class="nl-wrap-container" style="display:none;"></div></div>
            <div class="tool-col"><button class="tool-btn" onclick="applyTool(1,'expand')">➕ 擴分</button><button class="tool-btn" onclick="applyTool(1,'simplify')">➖ 約分</button></div>
        </div>
        <div id="bar2-row" class="bar-row tray-row" style="display:none;">
            <div id="label2" class="bar-label"></div>
            <div class="bars-column"><div id="bar2-wrap" class="bar-wrap-container grabbable"></div><div id="bar2-nl" class="nl-wrap-container" style="display:none;"></div></div>
            <div class="tool-col"><button class="tool-btn" onclick="applyTool(2,'expand')">➕ 擴分</button><button class="tool-btn" onclick="applyTool(2,'simplify')">➖ 約分</button></div>
        </div>`;

    document.getElementById('drag-instruction').innerHTML = `💡 先點一下上面的分數，把它變成長條圖`;
    resetIdleTimer();
}

function randomChallenge() {
    let d1 = Math.floor(Math.random() * 4) + 2, d2 = Math.floor(Math.random() * 4) + 2;
    while (d2 === d1) d2 = Math.floor(Math.random() * 4) + 2;
    let n1 = Math.floor(Math.random() * (d1 * 2)) + 1;
    let n2 = Math.floor(Math.random() * d2) + 1;
    let w1 = '', w2 = '';
    if (document.getElementById('show-whole-cb').checked && n1 >= d1 && Math.random() > 0.5) { w1 = Math.floor(n1 / d1); n1 = n1 % d1; if (n1 === 0) n1 = 1; if (w1 === 0) w1 = ''; }
    document.getElementById('w1').value = w1; document.getElementById('n1').value = n1; document.getElementById('d1').value = d1;
    document.getElementById('w2').value = w2; document.getElementById('n2').value = n2; document.getElementById('d2').value = d2;
    currentWordProblemTemplate = wordProblemTemplates[Math.floor(Math.random() * wordProblemTemplates.length)];
    updateUI();
}

function autoCheck() {
    const v = getSafeValues();
    const ansW = parseInt(document.getElementById('ans-w').value) || 0;
    let ansN = parseInt(document.getElementById('ans-num').value), ansD = parseInt(document.getElementById('ans-den').value);
    if (document.getElementById('ans-num').value === "" && document.getElementById('ans-den').value === "") { ansN = 0; ansD = 1; }
    const fb = document.getElementById('feedback');
    if (!isNaN(ansN) && !isNaN(ansD) && ansD !== 0) {
        const userVal = (ansW * ansD + ansN) / ansD;
        const exactN = v.total_n1 * v.d2, exactD = v.total_n2 * v.d1;
        const g = gcd(exactN, exactD) || 1;
        const sImpN = exactN / g, sD = exactD / g, sW = Math.floor(sImpN / sD), sMN = sImpN % sD;
        if (Math.abs(userVal - (exactN / exactD)) < 0.0001) {
            let simplest = false;
            if (ansW === 0 && ansN === sImpN && ansD === sD) simplest = true;
            if (ansW === sW && ansN === sMN && ansD === sD) simplest = true;
            if (ansN === 0 && ansW === sW && sMN === 0) simplest = true;
            fb.style.opacity = '1'; fb.style.color = 'var(--success)';
            fb.innerHTML = simplest ? '🎉 完全正確！這就是裝出的杯數！' : '🌟 數值答對了！試試看再「約分」或寫成「帶分數」喔！';
        } else { fb.style.opacity = '1'; fb.style.color = 'var(--red)'; fb.innerText = '👀 再數數看：裝滿了幾杯？最後一杯又裝了幾分滿？'; }
    } else fb.style.opacity = '0';
}

/* ===== hint finger ===== */
let hintAnimId = 0, idleTimer = null, isHintPlaying = false;
function interruptHint() { hintAnimId++; isHintPlaying = false; let f = document.getElementById('hint-finger'); if (f) { f.style.display = 'none'; f.style.opacity = '0'; } }
function resetIdleTimer() { interruptHint(); clearTimeout(idleTimer); idleTimer = setTimeout(playHintAnimation, 3500); }
['mousedown', 'touchstart', 'keydown'].forEach(ev => document.addEventListener(ev, resetIdleTimer));
document.addEventListener('mousemove', () => { if (isHintPlaying) interruptHint(); clearTimeout(idleTimer); idleTimer = setTimeout(playHintAnimation, 3500); });
function delay(ms, id) { return new Promise((res, rej) => setTimeout(() => id === hintAnimId ? res() : rej(new Error('x')), ms)); }

async function playHintAnimation() {
    if (isHintPlaying) return;
    let target = null;
    if (!bar1Visible) target = document.getElementById('frac1-group');
    else if (!bar2Visible) target = document.getElementById('frac2-group');
    else if (!denomsEqual()) target = document.querySelector('.tool-btn');
    else if (!divDone) target = document.querySelector('#bar1-wrap .cup.next');
    if (!target) return;
    isHintPlaying = true; let myId = hintAnimId;
    let f = document.getElementById('hint-finger');
    if (!f) { f = document.createElement('div'); f.id = 'hint-finger'; f.innerHTML = '👆'; document.body.appendChild(f); }
    try {
        let r = target.getBoundingClientRect();
        f.style.transition = 'none'; f.style.left = (r.left + r.width / 2 - 18) + 'px'; f.style.top = (r.top + r.height / 2 + 8) + 'px';
        f.style.transform = 'translateY(0) scale(1)'; f.style.opacity = '0'; f.style.display = 'block';
        await delay(40, myId); f.style.transition = 'opacity .3s'; f.style.opacity = '1'; await delay(350, myId);
        for (let i = 0; i < 2; i++) { f.style.transition = 'transform .2s'; f.style.transform = 'translateY(-14px) scale(.8)'; await delay(200, myId); f.style.transform = 'translateY(0) scale(1)'; await delay(250, myId); }
        f.style.transition = 'opacity .3s'; f.style.opacity = '0'; await delay(300, myId);
    } catch (e) { }
    f.style.display = 'none'; isHintPlaying = false;
}

window.onload = () => { updateSpeed(); toggleWholeNumber(); updateUI(); resetIdleTimer(); };
