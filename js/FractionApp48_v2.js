/* FractionApp48_v2.js — PROTOTYPE (two-bar align-and-compare subtraction)
   Built from DESIGN_FractionApp48_Subtraction_Prototype.md.
   Goals: two bars kept; no trash can; child counts out the subtrahend one piece
   at a time; numbers stay live; remainder IS the answer; tap-first + touch-safe. */

// Disable right-click / shortcuts (kept from original)
document.addEventListener('contextmenu', e => e.preventDefault());
document.onkeydown = function (e) {
    if (e.keyCode === 123) return false;
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) return false;
    if (e.ctrlKey && (e.keyCode === 67 || e.keyCode === 85 || e.keyCode === 83)) return false;
};

/* ===== state ===== */
let currentWordProblemTemplate = null;
let s1 = 1, s2 = 1;
let bar1Visible = false, bar2Visible = false;
let currentSpeed = 1.0;
let removedCount = 0;        // red pieces dragged into the tray so far
let subtractionDone = false; // clean answer reached (equal denominators)
let unequalNoticed = false;  // reached the chunk while denominators differ (no value shown)
let lastProblemType = 'takeaway'; // 'takeaway' | 'compare'

const wordProblemTemplates = [
    { t: "小明原本有 [FRAC1] 塊披薩，吃掉了 [FRAC2] 塊。請問還剩下多少塊披薩？", type: 'takeaway' },
    { t: "媽媽買了 [FRAC1] 公斤的蘋果，送給鄰居 [FRAC2] 公斤。請問還剩下多少公斤？", type: 'takeaway' },
    { t: "水桶裡原有 [FRAC1] 公升的水，倒出了 [FRAC2] 公升。請問現在還剩下多少公升？", type: 'takeaway' },
    { t: "紅彩帶長 [FRAC1] 公尺，藍彩帶長 [FRAC2] 公尺。請問紅彩帶比藍彩帶長多少公尺？", type: 'compare' },
    { t: "紅繩有 [FRAC1] 公尺，藍繩有 [FRAC2] 公尺。請問兩條繩子相差多少公尺？", type: 'compare' }
];

/* ===== small helpers (reused from original) ===== */
function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function lcm(a, b) { return (a * b) / gcd(a, b); }

function getFracHtml(n, d, color = "inherit") {
    return `<div class="inline-frac" style="color:${color};"><span>${n}</span><div class="line"></div><span>${d}</span></div>`;
}
function getDisplayHtml(w, n, d, color) {
    if (w > 0) return `<div style="display:inline-flex; align-items:center;"><span style="color:${color}; font-size:1.8rem; font-weight:bold; margin-right:4px; line-height:1;">${w}</span>${getFracHtml(n, d, color)}</div>`;
    return getFracHtml(n, d, color);
}

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

function enforceInputLimits() {
    const safe = getSafeValues();
    document.getElementById('d1').value = safe.d1;
    document.getElementById('d2').value = safe.d2;
}

function updateMaxWholes() {
    const v = getSafeValues();
    let w1 = Math.max(1, Math.ceil(v.total_n1 / v.d1));
    let w2 = Math.max(1, Math.ceil(v.total_n2 / v.d2));
    document.documentElement.style.setProperty('--max-wholes', Math.max(w1, w2));
}
function getMaxW() { return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1; }

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
function toggleNumberLine() { rerenderCurrentPhase(); }

/* ===== number line builder (shared by both phases) ===== */
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
    const nlWrap = document.getElementById(nlId);
    if (!nlWrap) return;
    const showNL = document.getElementById('show-nl-cb').checked;
    nlWrap.classList.add('continuous');
    if (showNL) { nlWrap.innerHTML = numberLineHtml(currentD, getMaxW()); nlWrap.style.display = 'flex'; }
    else { nlWrap.innerHTML = ''; nlWrap.style.display = 'none'; }
}

/* ===== EQUALIZE PHASE: fill + animated grid (kept from original) ===== */
function applyGridAnimation(gridContainer, d, s, old_s, action) {
    let animMs = (0.6 / currentSpeed) * 1000, half = animMs / 2;
    gridContainer.innerHTML = '';
    let html = '<div class="grid-overlay">';
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
        html += '</div>'; gridContainer.innerHTML = html;
        setTimeout(() => gridContainer.querySelectorAll('.removed-line').forEach(l => l.style.height = '0%'), 50);
        setTimeout(() => gridContainer.querySelectorAll('.retained-line').forEach(l => l.style.left = l.getAttribute('data-target-left')), 50 + half);
    } else if (action === 'expand') {
        for (let k = 0; k < d; k++) for (let j = 1; j < s; j++) html += `<div class="abs-thin-line expand-anim-line" style="left:${((k * s + j) / (d * s)) * 100}%; height:0%; background:var(--orange); transition:height ${animMs}ms cubic-bezier(0.4,0,0.2,1), background-color ${animMs}ms;"></div>`;
        html += '</div>'; gridContainer.innerHTML = html;
        setTimeout(() => gridContainer.querySelectorAll('.expand-anim-line').forEach(l => { l.style.height = '100%'; setTimeout(() => l.style.background = 'var(--dark)', animMs); }), 50);
    } else {
        for (let k = 0; k < d; k++) for (let j = 1; j < s; j++) html += `<div class="abs-thin-line" style="left:${((k * s + j) / (d * s)) * 100}%;"></div>`;
        html += '</div>'; gridContainer.innerHTML = html;
    }
}

function renderBar(num, action = 'none', old_s = 1) {
    const v = getSafeValues();
    let total_n = num === 1 ? v.total_n1 : v.total_n2;
    let d = num === 1 ? v.d1 : v.d2;
    let w = num === 1 ? v.w1 : v.w2;
    let n = num === 1 ? v.n1 : v.n2;
    let s = num === 1 ? s1 : s2;
    let color = num === 1 ? 'var(--red)' : 'var(--blue)';
    let maxW = getMaxW();

    let label = document.getElementById(`label${num}`);
    let wrap = document.getElementById(`bar${num}-wrap`);
    if (label) { label.style.opacity = '1'; label.innerHTML = getDisplayHtml(w, n * s, d * s, color); }

    if (wrap) {
        wrap.classList.add('continuous');
        wrap.onclick = null;
        if (action === 'none') {
            wrap.innerHTML = '';
            for (let i = 0; i < maxW; i++) { let u = document.createElement('div'); u.className = 'bar-unit'; u.innerHTML = `<div class="bar-fill"></div><div class="bar-grid"></div>`; wrap.appendChild(u); }
        }
        wrap.querySelectorAll('.bar-unit').forEach((unit, idx) => {
            let fill = unit.querySelector('.bar-fill'), grid = unit.querySelector('.bar-grid');
            let pct = (Math.max(0, Math.min(d * s, (total_n * s) - (idx * d * s))) / (d * s)) * 100;
            if (fill) { fill.style.width = `${pct}%`; fill.style.backgroundColor = color; }
            if (grid) applyGridAnimation(grid, d, s, old_s, action);
        });
    }
    renderNumberLine(`bar${num}-nl`, d * s);

    if (action !== 'none') setTimeout(() => { if ((num === 1 ? s1 : s2) === s) renderBar(num, 'none'); }, 50 + (0.6 / currentSpeed) * 1000);
}

/* ===== reveal bars ===== */
function onFracClick(num) {
    let row = document.getElementById(`bar${num}-row`);
    row.style.display = 'flex';
    if (num === 1) { s1 = 1; bar1Visible = true; } else { s2 = 1; bar2Visible = true; }
    removedCount = 0; subtractionDone = false; unequalNoticed = false;
    hideAnswer();
    renderBar(num, 'none');
    row.classList.remove('fade-in-slow'); void row.offsetWidth; row.classList.add('fade-in-slow');
    let card = document.getElementById(`frac${num}-group`); if (card) card.classList.add('revealed');
    checkCommonDenom();
}

function applyTool(num, action) {
    if (subtractionDone) return;
    let changed = false, old = num === 1 ? s1 : s2;
    if (num === 1) { if (action === 'expand') { s1++; changed = true; } else if (action === 'simplify' && s1 > 1) { s1--; changed = true; } }
    else { if (action === 'expand') { s2++; changed = true; } else if (action === 'simplify' && s2 > 1) { s2--; changed = true; } }
    if (!changed) return;
    removedCount = 0; unequalNoticed = false;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('pulse'));
    if (bar1Visible && bar2Visible) {
        renderBar(num, action, old);                 // play the split/merge animation on that bar
        setTimeout(checkCommonDenom, 650 / currentSpeed); // then re-render the subtraction phase
    } else {
        renderBar(num, action, old);
    }
}

/* ===== target chip ===== */
function updateTargetChip(cd1, cd2) {
    const chip = document.getElementById('target-chip');
    if (!chip) return;
    if (!bar1Visible || !bar2Visible) { chip.style.display = 'none'; return; }
    chip.style.display = 'inline-flex';
    if (cd1 === cd2) {
        chip.className = 'target-chip ok';
        chip.innerHTML = `✅ 格子一樣大`;
    } else {
        chip.className = 'target-chip warn';
        chip.innerHTML = `🎯 格子不一樣大`;
    }
}

function rerenderCurrentPhase() {
    if (bar1Visible && bar2Visible) { renderRedTappable(); renderBlueReference(); renderTakeawayTray(); }
    else { if (bar1Visible) renderBar(1, 'none'); if (bar2Visible) renderBar(2, 'none'); }
}

/* Subtraction is ALWAYS available once both bars are shown — no button.
   Numbers (labels / number lines / answer) only appear when denominators match. */
function checkCommonDenom() {
    if (!bar1Visible || !bar2Visible) {
        document.getElementById('drag-instruction').innerHTML = `💡 先點一下上面的分數，把它變成長條圖`;
        document.getElementById('target-chip').style.display = 'none';
        document.getElementById('counter-chip').style.display = 'none';
        let r = document.getElementById('bar3-row'); if (r) r.style.display = 'none';
        return;
    }
    const v = getSafeValues();
    let cd1 = v.d1 * s1, cd2 = v.d2 * s2;
    removedCount = Math.min(removedCount, pieceTarget());
    ensureTrayRow();
    document.getElementById('bar3-row').style.display = 'flex';
    renderRedTappable();
    renderBlueReference();
    renderTakeawayTray();
    updateCounter();
    updateTargetChip(cd1, cd2);

    if (cd1 === cd2) {
        document.getElementById('drag-instruction').innerHTML = `💡 把紅色一份一份<b>拖</b>到藍色長條或「拿走區」上（拖回紅色長條可還原）`;
    } else {
        document.getElementById('drag-instruction').innerHTML = `💡 把紅色<b>拖</b>到藍色長條或「拿走區」拿拿看（格子一樣大才會出現答案）`;
    }
}

function ensureTrayRow() {
    if (document.getElementById('bar3-row')) return;
    let area = document.getElementById('anim-area');
    let row = document.createElement('div');
    row.id = 'bar3-row';
    row.className = 'bar-row tray-row';
    row.innerHTML = `<div id="label3" class="bar-label"></div>`
        + `<div class="bars-column"><div id="bar3-wrap" class="bar-wrap-container"></div></div>`
        + `<div class="tool-col"></div>`;
    area.appendChild(row);
}

function markJustSplit() {
    document.querySelectorAll('#bar1-wrap .piece-cell, #bar2-wrap .piece-cell').forEach(c => {
        c.classList.remove('just-split'); void c.offsetWidth; c.classList.add('just-split');
        setTimeout(() => c.classList.remove('just-split'), 900);
    });
}

/* ===== subtraction-phase quantities ===== */
function redCd() { const v = getSafeValues(); return v.d1 * s1; }      // red's current denominator
function blueCd() { const v = getSafeValues(); return v.d2 * s2; }     // blue's current denominator
function redPieces() { const v = getSafeValues(); return v.total_n1 * s1; }   // red pieces (at redCd)
function bluePieces() { const v = getSafeValues(); return v.total_n2 * s2; }  // blue pieces (at blueCd)
function equalDenom() { return redCd() === blueCd(); }
function subVal() { const v = getSafeValues(); return v.total_n2 / v.d2; }     // subtrahend, in wholes
function redPieceVal() { return 1 / redCd(); }                                // one red piece, in wholes
// how many red pieces are needed to take away the subtrahend
function pieceTarget() {
    if (equalDenom()) return bluePieces();
    return Math.max(0, Math.ceil(subVal() / redPieceVal() - 1e-9));
}

function renderRedTappable() {
    const cd = redCd(), P1 = redPieces(), maxW = getMaxW();
    const target = pieceTarget();
    const remaining = P1 - removedCount;
    const wrap = document.getElementById('bar1-wrap');
    wrap.classList.add('continuous');
    wrap.onclick = null;
    wrap.innerHTML = '';
    for (let i = 0; i < maxW; i++) {
        let unit = document.createElement('div');
        unit.className = 'bar-unit cell-unit';
        for (let k = 0; k < cd; k++) {
            let idx = i * cd + k;
            let cell = document.createElement('div');
            cell.className = 'piece-cell';
            if (idx < remaining) {
                cell.classList.add('remaining', 'red');
                if (subtractionDone && idx < P1 - bluePieces()) cell.classList.add('answer-glow');
            } else if (idx < P1) {
                cell.classList.add('gone');   // piece has been moved down into the tray
            } else {
                cell.classList.add('empty');
            }
            // active = rightmost remaining red → draggable / tappable
            if (!subtractionDone && removedCount < target && idx === remaining - 1) {
                cell.classList.add('active', 'grabbable');
                attachPieceInteraction(cell);
            }
            unit.appendChild(cell);
        }
        wrap.appendChild(unit);
    }
    renderNumberLine('bar1-nl', cd);
    let lbl = document.getElementById('label1');
    lbl.style.opacity = '1';
    lbl.innerHTML = `<div class="bar-tag red-tag">${subtractionDone ? '剩下' : '被減數（紅）'}</div>` + getDisplayHtml(Math.floor(remaining / cd), remaining % cd, cd, 'var(--red)');
}

function renderBlueReference() {
    const cd = blueCd(), P2 = bluePieces(), maxW = getMaxW();
    const wrap = document.getElementById('bar2-wrap');
    wrap.classList.add('continuous');
    wrap.onclick = null;
    wrap.innerHTML = '';
    for (let i = 0; i < maxW; i++) {
        let unit = document.createElement('div');
        unit.className = 'bar-unit cell-unit';
        for (let k = 0; k < cd; k++) {
            let idx = i * cd + k;
            let cell = document.createElement('div');
            cell.className = 'piece-cell';
            cell.classList.add(idx < P2 ? 'blue-ghost' : 'empty');
            unit.appendChild(cell);
        }
        wrap.appendChild(unit);
    }
    // overlay: red pieces the child has laid onto the transparent blue bar
    const rPV = redPieceVal(), wholePct = 100 / maxW, target = pieceTarget();
    let ov = document.createElement('div');
    ov.className = 'blue-red-overlay';
    for (let i = 0; i < removedCount; i++) {
        let p = document.createElement('div');
        p.className = 'ov-red';
        p.style.left = (i * rPV * wholePct) + '%';
        p.style.width = (rPV * wholePct) + '%';
        if (i === removedCount - 1 && !isFlying) { p.classList.add('grabbable'); attachPlacedInteraction(p); }
        ov.appendChild(p);
    }
    if (!subtractionDone && !unequalNoticed && removedCount < target) {
        let ns = document.createElement('div'); ns.className = 'ov-next';
        ns.style.left = (removedCount * rPV * wholePct) + '%';
        ns.style.width = (rPV * wholePct) + '%';
        ov.appendChild(ns);
    }
    wrap.appendChild(ov);
    renderNumberLine('bar2-nl', cd);
    let lbl = document.getElementById('label2');
    lbl.style.opacity = '1';
    lbl.innerHTML = `<div class="bar-tag blue-tag">減數（藍）放紅色</div>` + getDisplayHtml(Math.floor(P2 / cd), P2 % cd, cd, 'var(--blue)');
}

/* Bottom "take-away tray": a transparent chunk = the subtrahend (what must be removed).
   Dragging red pieces fills it. When equal-sized, the red pieces tile the chunk exactly;
   when unequal, they don't line up — and no numbers are shown. */
function renderTakeawayTray() {
    const wrap = document.getElementById('bar3-wrap');
    if (!wrap) return;
    const eq = equalDenom(), maxW = getMaxW();
    const sV = subVal(), rPV = redPieceVal(), bcd = blueCd();
    const wholePct = 100 / maxW;
    const target = pieceTarget();

    wrap.classList.remove('continuous');
    wrap.innerHTML = '';
    let bar = document.createElement('div');
    bar.className = 'tray-bar';

    for (let kk = 1; kk < maxW; kk++) {
        let wl = document.createElement('div'); wl.className = 'tray-whole-line'; wl.style.left = (kk * wholePct) + '%'; bar.appendChild(wl);
    }
    // transparent target chunk = the subtrahend (blue's amount), with blue's divisions
    let ghost = document.createElement('div');
    ghost.className = 'tray-ghost';
    ghost.style.width = (sV * wholePct) + '%';
    let blueDiv = Math.round(sV * bcd);
    for (let j = 1; j < blueDiv; j++) { let gl = document.createElement('div'); gl.className = 'tray-ghost-line'; gl.style.left = (j / blueDiv) * 100 + '%'; ghost.appendChild(gl); }
    bar.appendChild(ghost);
    // red pieces dragged in (each one red piece wide), left → right
    for (let i = 0; i < removedCount; i++) {
        let p = document.createElement('div'); p.className = 'tray-red';
        p.style.left = (i * rPV * wholePct) + '%';
        p.style.width = (rPV * wholePct) + '%';
        if (i === removedCount - 1 && !isFlying) { p.classList.add('grabbable'); attachPlacedInteraction(p); }
        bar.appendChild(p);
    }
    // where the next red piece will land
    if (!subtractionDone && !unequalNoticed && removedCount < target) {
        let ns = document.createElement('div'); ns.className = 'tray-next';
        ns.style.left = (removedCount * rPV * wholePct) + '%';
        ns.style.width = (rPV * wholePct) + '%';
        bar.appendChild(ns);
    }
    wrap.appendChild(bar);

    let lbl = document.getElementById('label3');
    if (lbl) {
        lbl.style.opacity = '1';
        if (eq) {
            const cd = redCd();
            lbl.innerHTML = `<div class="bar-tag dark-tag">拿走區</div>` + getDisplayHtml(Math.floor(removedCount / cd), removedCount % cd, cd, 'var(--red)');
        } else {
            lbl.innerHTML = `<div class="bar-tag dark-tag">拿走區</div>`;
        }
    }
}

function updateCounter() {
    const chip = document.getElementById('counter-chip');
    if (!equalDenom()) { chip.style.display = 'none'; return; }   // keep it simple: only count when sizes match
    chip.style.display = 'inline-flex';
    let left = bluePieces() - removedCount;
    if (left > 0) { chip.className = 'counter-chip'; chip.innerHTML = `還要拿走 <b>${left}</b> 份`; }
    else { chip.className = 'counter-chip ok'; chip.innerHTML = `✅ 拿走完成`; }
}

function hideNL(id) { let nl = document.getElementById(id); if (nl) { nl.innerHTML = ''; nl.style.display = 'none'; } }

/* ===== drag a red piece down into the tray (pointer events = touch-safe) ===== */
let isFlying = false;
let pieceDrag = null;

function attachPieceInteraction(cell) {
    cell.style.touchAction = 'none';
    cell.onpointerdown = (e) => {
        if (isFlying) return;
        e.preventDefault();
        let rect = cell.getBoundingClientRect();
        pieceDrag = { startX: e.clientX, startY: e.clientY, moved: false, rect, clone: null };
        try { cell.setPointerCapture(e.pointerId); } catch (_) { }
        cell.onpointermove = onPiecePointerMove;
        cell.onpointerup = onPiecePointerUp;
        cell.onpointercancel = onPiecePointerUp;
    };
}

function makeFlyClone(rect) {
    let c = document.createElement('div');
    c.className = 'fly-piece';
    c.style.position = 'fixed';
    c.style.left = rect.left + 'px'; c.style.top = rect.top + 'px';
    c.style.width = rect.width + 'px'; c.style.height = rect.height + 'px';
    c.style.zIndex = '9999';
    document.body.appendChild(c);
    return c;
}

function onPiecePointerMove(e) {
    if (!pieceDrag) return;
    let dx = e.clientX - pieceDrag.startX, dy = e.clientY - pieceDrag.startY;
    if (!pieceDrag.moved && Math.hypot(dx, dy) > 6) { pieceDrag.moved = true; pieceDrag.clone = makeFlyClone(pieceDrag.rect); }
    if (pieceDrag.moved && pieceDrag.clone) {
        pieceDrag.clone.style.left = (e.clientX - pieceDrag.rect.width / 2) + 'px';
        pieceDrag.clone.style.top = (e.clientY - pieceDrag.rect.height / 2) + 'px';
        highlightTray(true, e.clientX, e.clientY);
    }
}

function onPiecePointerUp(e) {
    if (!pieceDrag) return;
    let d = pieceDrag; pieceDrag = null;
    let cell = e.currentTarget;
    cell.onpointermove = null; cell.onpointerup = null; cell.onpointercancel = null;
    highlightTray(false);
    let zone = dropZoneAt(e.clientX, e.clientY);
    if (!d.moved) { sendToSlot(d.rect, null, 'tray'); }                                  // tap → send into next slot
    else if (zone) { sendToSlot(d.rect, d.clone, zone === 'bar2-wrap' ? 'blue' : 'tray'); } // dropped on a zone
    else if (d.clone) {                                               // cancelled → fly back
        d.clone.style.transition = 'left .25s ease, top .25s ease';
        d.clone.style.left = d.rect.left + 'px'; d.clone.style.top = d.rect.top + 'px';
        setTimeout(() => d.clone && d.clone.remove(), 280);
    }
}

function isOverTray(x, y) { return dropZoneAt(x, y) !== null; }
// which drop zone (if any) the pointer is over: the take-away tray or the transparent blue bar
function dropZoneAt(x, y) {
    for (const id of ['bar3-wrap', 'bar2-wrap']) {
        let wrap = document.getElementById(id);
        if (!wrap) continue;
        let r = wrap.getBoundingClientRect();
        if (x >= r.left - 10 && x <= r.right + 10 && y >= r.top - 10 && y <= r.bottom + 20) return id;
    }
    return null;
}
function highlightTray(on, x, y) {
    let zone = on ? dropZoneAt(x, y) : null;
    let tray = document.getElementById('bar3-wrap'); if (tray) tray.classList.toggle('tray-hot', zone === 'bar3-wrap');
    let blue = document.getElementById('bar2-wrap'); if (blue) blue.classList.toggle('drop-hot', zone === 'bar2-wrap');
}
function isOverRedBar(x, y) {
    let wrap = document.getElementById('bar1-wrap');
    if (!wrap) return false;
    let r = wrap.getBoundingClientRect();
    return x >= r.left - 10 && x <= r.right + 10 && y >= r.top - 10 && y <= r.bottom + 20;
}

function sendToSlot(fromRect, existingClone, targetZone = 'tray') {
    const target = pieceTarget();
    if (isFlying || subtractionDone || unequalNoticed || removedCount >= target) { if (existingClone) existingClone.remove(); return; }
    isFlying = true;
    let slot = targetZone === 'blue'
        ? document.querySelector('#bar2-wrap .ov-next')
        : document.querySelector('#bar3-wrap .tray-next');
    if (!slot) slot = document.querySelector('#bar3-wrap .tray-next') || document.querySelector('#bar2-wrap .ov-next');
    if (!slot) { isFlying = false; if (existingClone) existingClone.remove(); return; }
    let tRect = slot.getBoundingClientRect();
    let clone = existingClone || makeFlyClone(fromRect);
    let dur = 0.5 / currentSpeed;
    clone.style.transition = `left ${dur}s ease, top ${dur}s ease, width ${dur}s ease, height ${dur}s ease`;
    void clone.offsetWidth;
    clone.style.left = tRect.left + 'px'; clone.style.top = tRect.top + 'px';
    clone.style.width = tRect.width + 'px'; clone.style.height = tRect.height + 'px';
    setTimeout(() => {
        if (clone) clone.remove();
        removedCount++;
        isFlying = false;
        renderRedTappable(); renderBlueReference(); renderTakeawayTray(); updateCounter();
        if (removedCount >= target) {
            if (equalDenom()) {
                subtractionDone = true;
                setTimeout(() => { renderRedTappable(); renderBlueReference(); renderTakeawayTray(); revealAnswer(); }, 250 / currentSpeed);
            } else {
                showUnequalNotice();
            }
        }
    }, dur * 1000 + 30);
}

/* ===== reverse: drag a laid red piece back off (blue bar or tray) ===== */
let backDrag = null;
function attachPlacedInteraction(el) {
    el.style.touchAction = 'none';
    el.onpointerdown = (e) => {
        if (isFlying) return;
        e.preventDefault(); e.stopPropagation();
        let rect = el.getBoundingClientRect();
        backDrag = { startX: e.clientX, startY: e.clientY, moved: false, rect, clone: null };
        try { el.setPointerCapture(e.pointerId); } catch (_) { }
        el.onpointermove = onBackPointerMove;
        el.onpointerup = onBackPointerUp;
        el.onpointercancel = onBackPointerUp;
    };
}
function onBackPointerMove(e) {
    if (!backDrag) return;
    let dx = e.clientX - backDrag.startX, dy = e.clientY - backDrag.startY;
    if (!backDrag.moved && Math.hypot(dx, dy) > 6) { backDrag.moved = true; backDrag.clone = makeFlyClone(backDrag.rect); }
    if (backDrag.moved && backDrag.clone) {
        backDrag.clone.style.left = (e.clientX - backDrag.rect.width / 2) + 'px';
        backDrag.clone.style.top = (e.clientY - backDrag.rect.height / 2) + 'px';
        let b1 = document.getElementById('bar1-wrap'); if (b1) b1.classList.toggle('back-hot', isOverRedBar(e.clientX, e.clientY));
    }
}
function onBackPointerUp(e) {
    if (!backDrag) return;
    let d = backDrag; backDrag = null;
    let el = e.currentTarget;
    el.onpointermove = null; el.onpointerup = null; el.onpointercancel = null;
    let b1 = document.getElementById('bar1-wrap'); if (b1) b1.classList.remove('back-hot');
    if (!d.moved) { takeBackSlot(d.rect, null); }                          // tap → take one back
    else if (!dropZoneAt(e.clientX, e.clientY)) { takeBackSlot(d.rect, d.clone); } // dragged off the zones → take back
    else if (d.clone) {                                                    // released back on a zone → snap home
        d.clone.style.transition = 'left .25s ease, top .25s ease';
        d.clone.style.left = d.rect.left + 'px'; d.clone.style.top = d.rect.top + 'px';
        setTimeout(() => d.clone && d.clone.remove(), 280);
    }
}
function takeBackSlot(fromRect, existingClone) {
    if (isFlying || removedCount <= 0) { if (existingClone) existingClone.remove(); return; }
    if (!fromRect) {
        let el = document.querySelector('#bar2-wrap .ov-red.grabbable, #bar3-wrap .tray-red.grabbable');
        fromRect = el ? el.getBoundingClientRect() : { left: 0, top: 0, width: 10, height: 10 };
    }
    isFlying = true;
    let goneCell = document.querySelector('#bar1-wrap .piece-cell.gone');
    let clone = existingClone || makeFlyClone(fromRect);
    let dur = 0.5 / currentSpeed;
    let tRect = goneCell ? goneCell.getBoundingClientRect() : fromRect;
    clone.style.transition = `left ${dur}s ease, top ${dur}s ease, width ${dur}s ease, height ${dur}s ease`;
    void clone.offsetWidth;
    clone.style.left = tRect.left + 'px'; clone.style.top = tRect.top + 'px';
    clone.style.width = tRect.width + 'px'; clone.style.height = tRect.height + 'px';
    setTimeout(() => {
        if (clone) clone.remove();
        removedCount = Math.max(0, removedCount - 1);
        subtractionDone = false; unequalNoticed = false;
        hideAnswer();
        isFlying = false;
        checkCommonDenom();
    }, dur * 1000 + 30);
}

/* Unequal denominators: the take-away still happens, we just don't show the answer.
   One short nudge to make the grids match — nothing more. */
function showUnequalNotice() {
    unequalNoticed = true;
    renderRedTappable(); renderTakeawayTray();
    hideAnswer();
    document.getElementById('drag-instruction').innerHTML = `💡 格子一樣大才看得到答案，試試「擴分 / 約分」`;
}

/* ===== answer (only shown when denominators are equal) ===== */
function revealAnswer() {
    const v = getSafeValues(), cd = redCd();
    document.getElementById('drag-instruction').innerHTML = `💡 紅色剩下的就是答案！把它填進下面的格子`;
    document.getElementById('counter-chip').className = 'counter-chip ok';
    document.getElementById('counter-chip').innerHTML = `✅ 剩下的紅色 = 答案`;

    const zone = document.getElementById('bottom-answer-zone');
    zone.style.display = 'flex'; setTimeout(() => zone.style.opacity = '1', 50);
    document.getElementById('bot-frac1').innerHTML = getDisplayHtml(v.w1, v.n1 * (cd / v.d1), cd, 'var(--red)');
    document.getElementById('bot-frac2').innerHTML = getDisplayHtml(v.w2, v.n2 * (cd / v.d2), cd, 'var(--blue)');
    document.getElementById('bot-public-unit').innerHTML = `💡 現在每一格都是 <b style="display:inline-flex; align-items:center; vertical-align:middle;">${getFracHtml(1, cd, 'var(--dark)')}</b>`;

    // tag wording from problem type
    let tag = lastProblemType === 'compare' ? '相差' : '剩下';
    document.getElementById('result-word').innerText = tag;

    const exactN = (v.total_n1 * v.d2) - (v.total_n2 * v.d1);
    if (exactN >= (v.d1 * v.d2)) { document.getElementById('ans-w').style.display = 'inline-block'; }
    else { document.getElementById('ans-w').style.display = 'none'; document.getElementById('ans-w').value = ''; }
}

function hideAnswer() {
    const zone = document.getElementById('bottom-answer-zone');
    zone.style.opacity = '0';
    setTimeout(() => { zone.style.display = 'none'; }, 200);
}

/* ===== build layout ===== */
function updateUI() {
    // keep result non-negative (auto-order), note when it happens
    const inp = getSafeValues();
    let swapped = false;
    if (inp.total_n1 / inp.d1 < inp.total_n2 / inp.d2) {
        document.getElementById('w1').value = inp.w2; document.getElementById('n1').value = inp.n2; document.getElementById('d1').value = inp.d2;
        document.getElementById('w2').value = inp.w1; document.getElementById('n2').value = inp.n1; document.getElementById('d2').value = inp.d1;
        swapped = true;
    }
    enforceInputLimits(); updateMaxWholes();
    const v = getSafeValues();
    s1 = 1; s2 = 1; bar1Visible = false; bar2Visible = false; removedCount = 0; subtractionDone = false; unequalNoticed = false;

    let wp = document.getElementById('word-problem');
    if (currentWordProblemTemplate) {
        wp.innerHTML = currentWordProblemTemplate.replace(/\[FRAC1\]/g, `<b>${getDisplayHtml(v.w1, v.n1, v.d1, 'var(--red)')}</b>`).replace(/\[FRAC2\]/g, `<b>${getDisplayHtml(v.w2, v.n2, v.d2, 'var(--blue)')}</b>`);
        wp.style.display = 'block';
    } else wp.style.display = 'none';

    document.getElementById('swap-note').style.display = swapped ? 'block' : 'none';

    ['ans-w', 'ans-num', 'ans-den'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('ans-w').style.display = 'none';
    document.getElementById('feedback').style.opacity = '0';
    hideAnswer();
    document.getElementById('target-chip').style.display = 'none';
    document.getElementById('counter-chip').style.display = 'none';
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('pulse', 'dimmed'));

    document.getElementById('anim-area').innerHTML = `
        <div id="bar1-row" class="bar-row" style="display:none;">
            <div id="label1" class="bar-label"></div>
            <div class="bars-column"><div id="bar1-wrap" class="bar-wrap-container"></div><div id="bar1-nl" class="nl-wrap-container" style="display:none;"></div></div>
            <div class="tool-col"><button class="tool-btn" onclick="applyTool(1,'expand')">➕ 擴分</button><button class="tool-btn" onclick="applyTool(1,'simplify')">➖ 約分</button></div>
        </div>
        <div id="bar2-row" class="bar-row" style="display:none;">
            <div id="label2" class="bar-label"></div>
            <div class="bars-column"><div id="bar2-wrap" class="bar-wrap-container"></div><div id="bar2-nl" class="nl-wrap-container" style="display:none;"></div></div>
            <div class="tool-col"><button class="tool-btn" onclick="applyTool(2,'expand')">➕ 擴分</button><button class="tool-btn" onclick="applyTool(2,'simplify')">➖ 約分</button></div>
        </div>`;

    document.getElementById('drag-instruction').innerHTML = `💡 先點一下上面的分數，把它變成長條圖`;
    resetIdleTimer();
}

function randomChallenge() {
    let d1 = Math.floor(Math.random() * 5) + 3, d2 = Math.floor(Math.random() * 5) + 3;
    while (d2 === d1) d2 = Math.floor(Math.random() * 5) + 3;
    let total1 = Math.floor(Math.random() * (d1 * 2)) + 2, total2 = Math.floor(Math.random() * (d2 * 2)) + 1;
    if (total1 / d1 < total2 / d2) { [total1, total2] = [total2, total1];[d1, d2] = [d2, d1]; }
    let w1 = '', n1 = total1, w2 = '', n2 = total2;
    if (document.getElementById('show-whole-cb').checked) {
        w1 = Math.floor(total1 / d1); n1 = total1 % d1; if (n1 === 0 && w1 > 0) { w1--; n1 = d1; }
        w2 = Math.floor(total2 / d2); n2 = total2 % d2; if (n2 === 0 && w2 > 0) { w2--; n2 = d2; }
        if (w1 === 0) w1 = ''; if (w2 === 0) w2 = '';
    }
    document.getElementById('w1').value = w1; document.getElementById('n1').value = n1; document.getElementById('d1').value = d1;
    document.getElementById('w2').value = w2; document.getElementById('n2').value = n2; document.getElementById('d2').value = d2;
    let pick = wordProblemTemplates[Math.floor(Math.random() * wordProblemTemplates.length)];
    currentWordProblemTemplate = pick.t; lastProblemType = pick.type;
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
        const exactN = (v.total_n1 * v.d2) - (v.total_n2 * v.d1), exactD = v.d1 * v.d2;
        const div = exactN === 0 ? 1 : gcd(Math.abs(exactN), exactD);
        const sImpN = exactN / div, sD = exactD / div, sW = Math.floor(sImpN / sD), sMN = sImpN % sD;
        if (Math.abs(userVal - (exactN / exactD)) < 0.0001) {
            let simplest = false;
            if (exactN === 0 && ansW === 0 && ansN === 0) simplest = true;
            else if (ansW === 0 && ansN === sImpN && ansD === sD) simplest = true;
            else if (ansW === sW && ansN === sMN && ansD === sD) simplest = true;
            else if (ansN === 0 && ansW === sW && sMN === 0) simplest = true;
            let msg = simplest ? '🎉 完全正確！而且已經是最簡單的樣子了！' : '🌟 數值答對了！試試看能不能再「約分」或寫成「帶分數」？';
            if (redCd() !== lcm(v.d1, v.d2) && exactN !== 0) msg += '<br><span style="color:var(--orange); font-size:1rem; font-weight:normal;">（小提示：用最小公倍數當分母，數字會更小更好算喔！）</span>';
            fb.style.opacity = '1'; fb.style.color = 'var(--success)'; fb.innerHTML = msg;
        } else { fb.style.opacity = '1'; fb.style.color = 'var(--red)'; fb.innerText = '👀 還不對喔，再看看紅色剩下幾格？'; }
    } else fb.style.opacity = '0';
}

/* ===== hint finger (tap-first, stage aware) ===== */
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
    else if (!subtractionDone && !unequalNoticed) target = document.querySelector('#bar1-wrap .piece-cell.active');
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
