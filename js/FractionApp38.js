// Disable right-click
document.addEventListener('contextmenu', event => event.preventDefault());

// Disable keyboard shortcuts
document.onkeydown = function(e) {
    if (e.keyCode === 123) return false;
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) return false;
    if (e.ctrlKey && (e.keyCode === 67 || e.keyCode === 85 || e.keyCode === 83)) return false;
};


/* ===== next inline <script> block ===== */

let currentWordProblemTemplate = null; 
let s1 = 1; 
let s2 = 1; 
let bar1Visible = false;
let bar2Visible = false;
let currentSpeed = 1.0; 
let isCommonDenomReady = false; 
let blueMoldBusy = false; // true while a chunk is visiting #divisor-mold in handleDropChunk
let divisionDropQueue = []; // chunks dropped while blueMoldBusy, processed one at a time
let divisionAnimationStarted = false; // guard: each expand schedules checkCommonDenom; only start division once

const wordProblemTemplates = [
    "有 [FRAC1] 公升果汁，每杯 [FRAC2] 公升，可以倒幾杯？",
    "有 [FRAC1] 公尺緞帶，每段 [FRAC2] 公尺，可以剪幾段？",
    "有 [FRAC1] 公斤飼料，每天吃 [FRAC2] 公斤，可以吃幾天？",
    "有 [FRAC1] 塊披薩，每人 [FRAC2] 塊，可以分給幾人？",
    "有 [FRAC1] 加侖水，每次舀 [FRAC2] 加侖，可以舀幾次？"
];

function toggleWholeNumber() {
    const showWhole = document.getElementById('show-whole-cb').checked;
    
    document.getElementById('w1').style.display = showWhole ? 'inline-block' : 'none';
    document.getElementById('w2').style.display = showWhole ? 'inline-block' : 'none';
    
    if (!showWhole) {
        document.getElementById('w1').value = '';
        document.getElementById('w2').value = '';
        document.getElementById('ans-w').value = '';
    }
    updateUI();
}

function updateSpeed() {
    currentSpeed = parseFloat(document.getElementById('speed-slider').value);
    document.getElementById('speed-val').innerText = currentSpeed.toFixed(1);
    let duration = 0.6 / currentSpeed;
    document.documentElement.style.setProperty('--anim-time', duration + 's');
}

function toggleNumberLine() {
    if (bar1Visible) renderBar(1, 'none');
    if (bar2Visible) renderBar(2, 'none');
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

    return { 
        w1, n1, d1, 
        w2, n2, d2, 
        total_n1: w1 * d1 + n1, 
        total_n2: w2 * d2 + n2 
    };
}

function enforceInputLimits() {
    const safe = getSafeValues();
    document.getElementById('d1').value = safe.d1;
    document.getElementById('d2').value = safe.d2;
}

function updateMaxWholes() {
    const vals = getSafeValues();
    let wholes1 = Math.max(1, Math.ceil(vals.total_n1 / vals.d1));
    let wholes2 = Math.max(1, Math.ceil(vals.total_n2 / vals.d2));
    let maxW = Math.max(wholes1, wholes2);
    
    document.documentElement.style.setProperty('--max-wholes', maxW);
}

function getFracHtml(n, d, color = "inherit") {
    return `<div class="inline-frac" style="color: ${color};"><span>${n}</span><div class="line"></div><span>${d}</span></div>`;
}

function getDisplayHtml(w, n, d, color) {
    if (w > 0) {
        return `<div style="display:inline-flex; align-items:center;">
                    <span style="color:${color}; font-size:1.8rem; font-weight:bold; margin-right:4px; line-height:1;">${w}</span>
                    ${getFracHtml(n, d, color)}
                </div>`;
    }
    return getFracHtml(n, d, color);
}

function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function lcm(a, b) { return (a * b) / gcd(a, b); }

function onFrac1Click() {
    let row = document.getElementById('bar1-row');
    row.style.display = 'flex';
    s1 = 1;
    renderBar(1, 'none');
    row.classList.remove('fade-in-slow');
    void row.offsetWidth;
    row.classList.add('fade-in-slow');
    bar1Visible = true;
    checkCommonDenom();
}

function onFrac2Click() {
    let row = document.getElementById('bar2-row');
    row.style.display = 'flex';
    s2 = 1;
    renderBar(2, 'none');
    row.classList.remove('fade-in-slow');
    void row.offsetWidth;
    row.classList.add('fade-in-slow');
    bar2Visible = true;
    checkCommonDenom();
}

function applyTool(num, action) {
    let changed = false;
    let old_s = num === 1 ? s1 : s2;

    if (num === 1) {
        if (action === 'expand') { s1++; changed = true; }
        else if (action === 'simplify' && s1 > 1) { s1--; changed = true; }
    } else {
        if (action === 'expand') { s2++; changed = true; }
        else if (action === 'simplify' && s2 > 1) { s2--; changed = true; }
    }

    if (changed) {
        renderBar(num, action, old_s);
        setTimeout(checkCommonDenom, 1250 / currentSpeed);
    }
}

function applyGridAnimation(gridContainer, d, s, old_s, action) {
    let animTimeMs = (0.6 / currentSpeed) * 1000;
    let halfAnimMs = animTimeMs / 2;

    gridContainer.innerHTML = '';
    let html = '<div class="grid-overlay">';

    for (let k = 1; k < d; k++) {
        html += `<div class="abs-thick-line" style="left: ${(k/d)*100}%;"></div>`;
    }

    if (action === 'simplify') {
        for (let k = 0; k < d; k++) {
            let remove_j = Math.floor(old_s / 2);
            for (let j = 1; j < old_s; j++) {
                let oldLeftPct = ((k * old_s + j) / (d * old_s)) * 100;
                let lineId = `line_${Math.random().toString(36).substr(2, 5)}`;
                
                if (j === remove_j) {
                    html += `<div id="${lineId}" class="abs-thin-line removed-line" style="left: ${oldLeftPct}%; top: 0; height: 100%; transition: height ${halfAnimMs}ms ease-in;"></div>`;
                } else {
                    let new_j = j < remove_j ? j : j - 1;
                    let newLeftPct = ((k * s + new_j) / (d * s)) * 100;
                    html += `<div id="${lineId}" class="abs-thin-line retained-line" style="left: ${oldLeftPct}%; top: 0; height: 100%; transition: left ${halfAnimMs}ms ease-out;" data-target-left="${newLeftPct}%"></div>`;
                }
            }
        }
        html += '</div>';
        gridContainer.innerHTML = html;

        setTimeout(() => { gridContainer.querySelectorAll('.removed-line').forEach(l => l.style.height = '0%'); }, 50);
        setTimeout(() => { gridContainer.querySelectorAll('.retained-line').forEach(l => l.style.left = l.getAttribute('data-target-left')); }, 50 + halfAnimMs);

    } else if (action === 'expand') {
        for (let k = 0; k < d; k++) {
            for (let j = 1; j < s; j++) {
                let leftPct = ((k * s + j) / (d * s)) * 100;
                html += `<div class="abs-thin-line expand-anim-line" style="left: ${leftPct}%; height: 0%; top: 0; background: var(--orange); transition: height ${animTimeMs}ms cubic-bezier(0.4, 0, 0.2, 1), background-color ${animTimeMs}ms;"></div>`;
            }
        }
        html += '</div>';
        gridContainer.innerHTML = html;

        setTimeout(() => {
            gridContainer.querySelectorAll('.expand-anim-line').forEach(l => {
                l.style.height = '100%';
                setTimeout(() => l.style.background = 'var(--dark)', animTimeMs);
            });
        }, 50);

    } else {
        // Static grid lines for the bar's sub-units (visible alongside drag chunks and number line).
        for (let k = 0; k < d; k++) {
            for (let j = 1; j < s; j++) {
                let leftPct = ((k * s + j) / (d * s)) * 100;
                html += `<div class="abs-thin-line" style="left: ${leftPct}%;"></div>`;
            }
        }
        html += '</div>';
        gridContainer.innerHTML = html;
    }
}

function renderBar(num, action = 'none', old_s = 1) {
    const vals = getSafeValues();
    const showNL = document.getElementById('show-nl-cb').checked;

    let total_n = num === 1 ? vals.total_n1 : vals.total_n2;
    let d = num === 1 ? vals.d1 : vals.d2;
    let w = num === 1 ? vals.w1 : vals.w2;
    let n = num === 1 ? vals.n1 : vals.n2;
    let s = num === 1 ? s1 : s2;
    let color = num === 1 ? 'var(--red)' : 'var(--blue)';

    let maxW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1;

    let label = document.getElementById(`label${num}`);
    let wrap = document.getElementById(`bar${num}-wrap`);
    let nlWrap = document.getElementById(`bar${num}-nl`);

    if(label) {
        label.style.transition = 'opacity 0.5s';
        label.style.opacity = '1';
        label.innerHTML = getDisplayHtml(w, n * s, d * s, color);
    }

    if(wrap) {
        wrap.classList.add('continuous');

        if (action === 'none') {
            wrap.innerHTML = '';
            for (let i = 0; i < maxW; i++) {
                let unit = document.createElement('div');
                unit.className = 'bar-unit';
                unit.innerHTML = `<div class="bar-fill"></div><div class="bar-grid"></div>`;
                wrap.appendChild(unit);
            }
        }

        let units = wrap.querySelectorAll('.bar-unit');
        units.forEach((unit, idx) => {
            let fill = unit.querySelector('.bar-fill');
            let grid = unit.querySelector('.bar-grid');

            let filled_parts = (total_n * s) - (idx * d * s);
            let clamped = Math.max(0, Math.min(d * s, filled_parts));
            let pct = (clamped / (d * s)) * 100;
            
            if (fill) {
                fill.style.width = `${pct}%`;
                fill.style.backgroundColor = color;
            }

            if (grid) applyGridAnimation(grid, d, s, old_s, action);
        });
    }

    if(nlWrap) {
        if (showNL) {
            nlWrap.style.display = 'flex';
            nlWrap.classList.add('continuous');
            nlWrap.innerHTML = '';
            for (let i = 0; i < maxW; i++) {
                let nlUnit = document.createElement('div');
                nlUnit.className = 'nl-unit';
                let labelsHtml = '';
                let currentD = d * s;
                for (let k = 0; k < currentD; k++) {
                    let leftPct = (k / currentD) * 100;
                    let valHtml = '';
                    if (k === 0) {
                        valHtml = `<span style="font-weight:bold; font-size:1.1rem; color:var(--dark);">${i}</span>`;
                    } else {
                        let fracPart = `<div class="inline-frac" style="font-size:0.85em; color:var(--dark);"><span>${k}</span><div class="line"></div><span>${currentD}</span></div>`;
                        if (i > 0) {
                            valHtml = `<div style="display: flex; align-items: center; justify-content: center;"><span style="font-weight:bold; font-size:1.05rem; margin-right:2px; color:var(--dark);">${i}</span>${fracPart}</div>`;
                        } else {
                            valHtml = fracPart;
                        }
                    }
                    labelsHtml += `<div style="position: absolute; left: ${leftPct}%; top: 0px; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; flex-direction: column; z-index: 5;">
                        <div style="width: 2px; height: 6px; background: var(--dark); margin-bottom: 2px;"></div>
                        ${valHtml}
                    </div>`;
                }
                if (i === maxW - 1) {
                    labelsHtml += `<div style="position: absolute; left: 100%; top: 0px; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; flex-direction: column; z-index: 5;">
                        <div style="width: 2px; height: 6px; background: var(--dark); margin-bottom: 2px;"></div>
                        <span style="font-weight:bold; font-size:1.1rem; color:var(--dark);">${i + 1}</span>
                    </div>`;
                }
                nlUnit.innerHTML = labelsHtml;
                nlWrap.appendChild(nlUnit);
            }
        } else {
            nlWrap.style.display = 'none';
            nlWrap.innerHTML = '';
        }
    }

    if (action !== 'none') {
        let animTimeMs = (0.6 / currentSpeed) * 1000;
        setTimeout(() => {
            let current_s = num === 1 ? s1 : s2;
            if (current_s === s) renderBar(num, 'none'); 
        }, 50 + animTimeMs);
    }
}

// 核心動畫控制：觸發條件為成功通分母
function checkCommonDenom() {
    if (!bar1Visible || !bar2Visible) return;
    const vals = getSafeValues();
    let cd1 = vals.d1 * s1;
    let cd2 = vals.d2 * s2;

    isCommonDenomReady = (cd1 === cd2 && cd1 > 0);

    document.getElementById('bottom-answer-zone').style.opacity = '0';
    setTimeout(() => { document.getElementById('bottom-answer-zone').style.display = 'none'; }, 300);

    if (isCommonDenomReady) {
        // 通分成功：隱藏擴約分按鈕
        document.querySelectorAll('.tool-btn').forEach(btn => btn.style.display = 'none');
        // 鎖定數線開關，避免量測階段切換時重建長條圖而清除拖拉色塊與模具
        document.getElementById('show-nl-cb').disabled = true;

        document.getElementById('drag-instruction').innerHTML = `💡 分母相同了，開始做除法`;
        
        // 啟動除法動畫序列（通分成功後先暫停，讓學生閱讀）
        // 每次擴分都會延遲呼叫 checkCommonDenom；快速連點時只啟動一次，避免多層 drag-overlay 疊成「三條紅色長條」
        if (!divisionAnimationStarted) {
            divisionAnimationStarted = true;
            setTimeout(() => startDivisionAnimation(cd1), 1800 / currentSpeed);
        }
    } else {
        divisionAnimationStarted = false;
        // 尚未通分：恢復顯示工具
        document.querySelectorAll('.tool-btn').forEach(btn => btn.style.display = 'flex');
        document.getElementById('show-nl-cb').disabled = false;
        if(document.getElementById('show-nl-cb').checked) {
            let nl1 = document.getElementById('bar1-nl'); if(nl1) nl1.style.display = 'flex';
            let nl2 = document.getElementById('bar2-nl'); if(nl2) nl2.style.display = 'flex';
        }
        document.getElementById('drag-instruction').innerHTML = `💡 用「擴分／約分」讓兩邊分母相同`;
        document.getElementById('bar3-row').style.display = 'none';
    }
}

// 完整的除法動畫序列
function startDivisionAnimation(cd) {
    const vals = getSafeValues();
    let P1 = vals.total_n1 * s1; // 被除數總份數
    let P2 = vals.total_n2 * s2; // 除數總份數

    // 第一步：合併間隙與隱藏標籤
    let wrap1 = document.getElementById('bar1-wrap');
    let wrap2 = document.getElementById('bar2-wrap');
    wrap1.classList.add('continuous');
    wrap2.classList.add('continuous');

    let lbl1 = document.getElementById('label1');
    let lbl2 = document.getElementById('label2');
    lbl1.style.transition = 'opacity 0.5s';
    lbl2.style.transition = 'opacity 0.5s';
    lbl1.style.opacity = "0";
    lbl2.style.opacity = "0";

    setTimeout(() => {
        // 第二步：平滑處理除數空位 (轉為封閉模具)
        buildDivisorMold(wrap2, P2, cd);

        setTimeout(() => {
            // 第三步：手動拖拉裝滿模具（留足時間閱讀「除數容器」說明）
            setupManualDragAndFill(P1, P2, cd);
        }, 4800 / currentSpeed);
    }, 1800 / currentSpeed);
}

// 第二步：建立封閉的除數模具
function buildDivisorMold(wrap, P2, cd) {
    let maxW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1;
    let singleUnitPct = 100 / maxW;
    let totalPct = (P2 / cd) * singleUnitPct;

    let moldHtml = `<div id="divisor-mold" style="position:relative; width:${totalPct}%; height:50px; border:3px dashed var(--blue); background:rgba(52, 152, 219, 0.25); opacity:1; box-sizing:border-box; border-radius:4px; display:flex; transition: 0.3s box-shadow;">`;
    // P2 divider lines mark the divisor's sub-units inside the empty mold; a fully
    // opaque flyer (z-index 9999) covers these while it visits the mold.
    for(let i = 1; i < P2; i++) {
        moldHtml += `<div style="position:absolute; top:0; left:${(i/P2)*100}%; width:1px; height:100%; background:var(--dark);"></div>`;
    }
    moldHtml += `</div>`;
    wrap.innerHTML = moldHtml;

    // 閉合處理的微光閃動提示
    let mold = document.getElementById('divisor-mold');
    setTimeout(() => mold.style.boxShadow = "0 0 15px 5px rgba(52, 152, 219, 0.6)", 100);
    setTimeout(() => mold.style.boxShadow = "none", 600);

    setTimeout(() => {
        document.getElementById('drag-instruction').innerHTML = `💡 藍色長條是一個容器`;
    }, 300 / currentSpeed);
}

// 第三步：設定手動拖拉裝滿模具 (每次一整份)
function setupManualDragAndFill(P1, P2, cd) {
    if (P2 === 0) return; // 防止除以零

    blueMoldBusy = false;
    divisionDropQueue = [];

    let row3 = document.getElementById('bar3-row');
    row3.style.display = 'flex';
    let wrap3 = document.getElementById('bar3-wrap');
    wrap3.style.outline = 'none';
    wrap3.style.flexDirection = 'column';
    wrap3.style.alignItems = 'flex-start';
    wrap3.style.gap = '10px';
    wrap3.innerHTML = '';
    wrap3.setAttribute('data-filled', '0');
    wrap3.setAttribute('data-anims-finished', '0');

    let wrap2 = document.getElementById('bar2-wrap');
    wrap2.classList.add('droppable-area'); // 將除數長條圖設為接收區

    document.getElementById('label3').innerHTML = `除法結果`;
    document.getElementById('label3').style.opacity = '1';

    let wrap1 = document.getElementById('bar1-wrap');
    let maxW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-wholes')) || 1;
    
    // CORRECT math: numMolds chunks, only ONE has size=P2 (the "long" bar). Not 3 long bars.
    let numMolds = Math.ceil(P1 / P2);
    let moldWidthPct = (P2 / (cd * maxW)) * 100;

    // 預先產生下方的結果存放模具
    let molds = [];
    for(let i = 0; i < numMolds; i++) {
        let mold = document.createElement('div');
        mold.style.width = moldWidthPct + '%';
        mold.style.height = '50px';
        mold.style.border = '3px solid var(--blue)';
        mold.style.borderRadius = '4px';
        mold.style.boxSizing = 'border-box';
        mold.style.position = 'relative';
        mold.style.display = 'flex';
        mold.style.backgroundColor = 'rgba(52, 152, 219, 0.05)';
        
        // P2 divider lines mark the empty mold's sub-units; result fills use z-index 6
        // (above this z-index 5) so a completed fill fully covers them.
        for(let k = 1; k < P2; k++) {
            let line = document.createElement('div');
            line.style.position = 'absolute';
            line.style.top = '0';
            line.style.left = (k/P2)*100 + '%';
            line.style.width = '1px';
            line.style.height = '100%';
            line.style.backgroundColor = 'var(--dark)';
            line.style.zIndex = '5';
            mold.appendChild(line);
        }

        wrap3.appendChild(mold);
        molds.push(mold);
    }

    // 隱藏被除數底下的紅色填色（由拖拉色塊取代）；保留格線與數線
    wrap1.querySelectorAll('.bar-fill').forEach(f => { f.style.display = 'none'; });

    // Defensive: remove stale overlay if division setup was triggered more than once
    let staleOverlay = document.getElementById('drag-overlay');
    if (staleOverlay) staleOverlay.remove();

    // Drag chunks sit above the (hidden) bar-fill; bar-grid and number lines stay visible.
    let overlay = document.createElement('div');
    overlay.id = 'drag-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.zIndex = '10';
    wrap1.style.position = 'relative';
    wrap1.appendChild(overlay);

    // One chunk per mold: i=0 → size=P2 (long bar); last i → size=P1%P2 if remainder (short bar).
    // data-mold-index ties each chunk to its OWN result mold, regardless of drop order.
    for (let i = 0; i < numMolds; i++) {
        let size = (i === numMolds - 1 && P1 % P2 !== 0) ? (P1 % P2) : P2;
        let startPiece = i * P2;
        
        let chunkLeftPct = (startPiece / (cd * maxW)) * 100;
        let chunkWidthPct = (size / (cd * maxW)) * 100;

        let chunk = document.createElement('div');
        chunk.className = 'drag-block';
        chunk.id = 'div-chunk-' + i;
        chunk.style.position = 'absolute';
        chunk.style.top = '0';
        chunk.style.left = chunkLeftPct + '%';
        chunk.style.width = chunkWidthPct + '%';
        chunk.style.height = '100%';
        chunk.style.backgroundColor = 'var(--red)';
        chunk.style.opacity = '1';
        chunk.style.border = '2px solid white';
        chunk.style.borderRadius = '4px';
        chunk.style.boxSizing = 'border-box';
        chunk.style.cursor = 'grab';
        chunk.draggable = true;
        chunk.setAttribute('data-size', size);
        chunk.setAttribute('data-mold-index', i);

        chunk.ondragstart = (e) => {
            e.dataTransfer.setData('text/plain', chunk.id);
            setTimeout(() => { chunk.style.visibility = 'hidden'; }, 0);
        };
        chunk.ondragend = (e) => {
            if (chunk.getAttribute('data-measured') === '1') return;
            // 若未成功放入容器，恢復顯示
            chunk.style.visibility = 'visible';
            chunk.style.opacity = '1';
        };
        // 支援點擊直接送出量測
        chunk.onclick = () => {
            handleDropChunk(chunk.id, molds, P1, P2, cd);
        };

        overlay.appendChild(chunk);
    }

    document.getElementById('drag-instruction').innerHTML = `💡 把紅色一份一份拖進藍色容器`;

    // 將拖放接收事件移至 wrap2 (除數圖形)
    wrap2.ondragover = (e) => {
        e.preventDefault();
        wrap2.style.boxShadow = '0 0 15px 5px rgba(52, 152, 219, 0.5)';
    };
    wrap2.ondragleave = (e) => {
        wrap2.style.boxShadow = 'none';
    };
    wrap2.ondrop = (e) => {
        e.preventDefault();
        wrap2.style.boxShadow = 'none';
        let id = e.dataTransfer.getData('text/plain');
        handleDropChunk(id, molds, P1, P2, cd);
    };
}

// 若藍色容器正被佔用，將此次投遞排入佇列，待容器淨空後自動處理
function processDropQueue() {
    if (blueMoldBusy || divisionDropQueue.length === 0) return;
    let next = divisionDropQueue.shift();
    handleDropChunk(next.chunkId, next.molds, next.P1, next.P2, next.cd);
}

// Post-drop flight animation. Only one chunk may visit #divisor-mold at a time
// (blueMoldBusy + divisionDropQueue below); extra drops wait their turn instead of stacking.
function handleDropChunk(chunkId, molds, P1, P2, cd) {
    let chunk = document.getElementById(chunkId);
    if (!chunk || chunk.getAttribute('data-measured') === '1') return;

    if (blueMoldBusy) {
        if (chunk.getAttribute('data-queued') !== '1') {
            chunk.setAttribute('data-queued', '1');
            chunk.style.visibility = 'hidden';
            divisionDropQueue.push({ chunkId, molds, P1, P2, cd });
        }
        return;
    }
    chunk.removeAttribute('data-queued');
    blueMoldBusy = true;

    let wrap3 = document.getElementById('bar3-wrap');
    let filledCount = parseInt(wrap3.getAttribute('data-filled')) || 0;
    let totalChunks = Math.ceil(P1 / P2);

    let size = parseInt(chunk.getAttribute('data-size'));

    // 依 data-mold-index（而非投遞順序）選定目標模具，確保結果列順序與被除數上的色塊順序一致
    let moldIndex = parseInt(chunk.getAttribute('data-mold-index'), 10);
    let targetMold = molds[moldIndex];
    if (!targetMold) { blueMoldBusy = false; return; }

    // 先量測位置，再將同一個 drag-block 元素改為 fixed 飛行（不建立複本）
    let startRect = chunk.getBoundingClientRect();
    let containerEl = document.getElementById('divisor-mold') || document.getElementById('bar2-wrap');
    let containerRect = containerEl.getBoundingClientRect();
    let resultRect = targetMold.getBoundingClientRect();

    chunk.setAttribute('data-measured', '1');
    chunk.draggable = false;
    chunk.onclick = null;
    chunk.ondragstart = null;
    chunk.ondragend = null;

    // 預先佔用位置
    filledCount++;
    wrap3.setAttribute('data-filled', filledCount);

    // -- 兩段式飛行：同一元素先飛入藍色容器，停留後再垂直落入結果模具 --
    let flightSec = 1 / currentSpeed;
    let pauseSec = 0.4 / currentSpeed;
    let animWidth = (size / P2) * resultRect.width;
    let transition = `top ${flightSec}s ease-in-out, left ${flightSec}s ease-in-out, width ${flightSec}s ease-in-out, height ${flightSec}s ease-in-out`;

    chunk.style.visibility = 'visible';
    chunk.style.opacity = '1';
    chunk.style.position = 'fixed';
    chunk.style.top = startRect.top + 'px';
    chunk.style.left = startRect.left + 'px';
    chunk.style.width = startRect.width + 'px';
    chunk.style.height = startRect.height + 'px';
    chunk.style.margin = '0';
    chunk.style.cursor = 'default';
    chunk.style.zIndex = '9999';
    chunk.style.transition = transition;
    document.body.appendChild(chunk);

    void chunk.offsetWidth;

    // 第一段：飛入藍色除數容器（z-index 9999 完全遮蓋模具內的隔線）
    chunk.style.top = containerRect.top + 'px';
    chunk.style.left = containerRect.left + 'px';
    chunk.style.width = animWidth + 'px';
    chunk.style.height = containerRect.height + 'px';

    // 第二段：停留後，垂直落入下方結果模具
    setTimeout(() => {
        chunk.style.top = resultRect.top + 'px';
        chunk.style.left = resultRect.left + 'px';
        chunk.style.width = animWidth + 'px';
        chunk.style.height = resultRect.height + 'px';
    }, (flightSec + pauseSec) * 1000);

    // 動畫結束後的處理（完成後才釋放藍色容器並處理佇列，避免多塊紅色重疊）
    setTimeout(() => {
        chunk.remove();
        // 在結果區模具中生成顏色填充（z-index 6，蓋過模具內 z-index 5 的隔線）
        let fill = document.createElement('div');
        fill.style.position = 'absolute';
        fill.style.top = '0';
        fill.style.left = '0';
        fill.style.width = (size / P2) * 100 + '%';
        fill.style.height = '100%';
        fill.style.backgroundColor = 'var(--red)';
        fill.style.opacity = '1';
        fill.style.zIndex = '6';
        fill.style.borderRight = '1px solid rgba(255,255,255,0.4)';
        targetMold.appendChild(fill);

        blueMoldBusy = false;
        processDropQueue();

        // 記錄有幾個動畫已完成
        let animsFinished = parseInt(wrap3.getAttribute('data-anims-finished')) || 0;
        animsFinished++;
        wrap3.setAttribute('data-anims-finished', animsFinished);

        // 如果全部拼圖都放完且動畫結束，清除上方拖拉層並顯示答案區
        if (animsFinished === totalChunks) {
            let overlay = document.getElementById('drag-overlay');
            if (overlay) overlay.remove();
            wrap3.style.outline = 'none';
            wrap3.style.backgroundColor = 'transparent';
            showAnswerZone(P1, P2, cd);
        }
    }, (flightSec * 2 + pauseSec) * 1000);
}

function showAnswerZone(P1, P2, cd) {
    const vals = getSafeValues();
    document.getElementById('bottom-answer-zone').style.display = 'flex';
    setTimeout(() => { document.getElementById('bottom-answer-zone').style.opacity = '1'; }, 50);

    document.getElementById('bot-frac1').innerHTML = getDisplayHtml(vals.w1, vals.n1 * s1, vals.d1 * s1, 'var(--red)');
    document.getElementById('bot-frac2').innerHTML = getDisplayHtml(vals.w2, vals.n2 * s2, vals.d2 * s2, 'var(--blue)');

    const exactN = vals.total_n1 * vals.d2;
    const exactD = vals.total_n2 * vals.d1;

    let hint = "";
    if (exactN >= exactD) {
        document.getElementById('ans-w').style.display = 'inline-block';
        hint = "（可填帶分數）";
    } else {
        document.getElementById('ans-w').style.display = 'none';
        document.getElementById('ans-w').value = '';
    }

    // 確保移除不必要的提示字句
    document.getElementById('bot-public-unit').style.display = 'none';
    document.getElementById('drag-instruction').innerHTML = `💡 數完了，請填寫下方答案${hint}`;
}

function updateUI() {
    enforceInputLimits();
    updateMaxWholes(); 
    const vals = getSafeValues();
    
    s1 = 1; s2 = 1;
    bar1Visible = false; bar2Visible = false;
    isCommonDenomReady = false;
    divisionAnimationStarted = false;

    document.getElementById('show-nl-cb').disabled = false;

    let wpEl = document.getElementById('word-problem');
    if (currentWordProblemTemplate) {
        let frac1Html = `<b>${getDisplayHtml(vals.w1, vals.n1, vals.d1, 'var(--red)')}</b>`;
        let frac2Html = `<b>${getDisplayHtml(vals.w2, vals.n2, vals.d2, 'var(--blue)')}</b>`;
        wpEl.innerHTML = currentWordProblemTemplate.replace(/\[FRAC1\]/g, frac1Html).replace(/\[FRAC2\]/g, frac2Html);
        wpEl.style.display = 'block';
    } else {
        wpEl.style.display = 'none';
    }
    
    document.getElementById('ans-w').value = ''; 
    document.getElementById('ans-w').style.display = 'none'; 
    document.getElementById('ans-num').value = ''; 
    document.getElementById('ans-den').value = '';
    document.getElementById('feedback').style.opacity = '0';
    document.getElementById('bottom-answer-zone').style.display = 'none';
    document.getElementById('bottom-answer-zone').style.opacity = '0';
    
    const animArea = document.getElementById('anim-area');
    animArea.innerHTML = `
        <div id="bar1-row" style="display:none; position:relative; width:100%; min-height:80px; align-items:center; justify-content:space-between;">
            <div id="label1" style="width:15%; text-align:center;"></div>
            <div class="bars-column">
                <div id="bar1-wrap" class="bar-wrap-container"></div>
                <div id="bar1-nl" class="nl-wrap-container" style="display:none;"></div>
            </div>
            <div style="width:15%; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
                <button class="tool-btn" onclick="applyTool(1, 'expand')">➕ 擴分</button>
                <button class="tool-btn" onclick="applyTool(1, 'simplify')">➖ 約分</button>
            </div>
        </div>
        <div id="bar2-row" style="display:none; position:relative; width:100%; min-height:80px; align-items:center; justify-content:space-between;">
            <div id="label2" style="width:15%; text-align:center;"></div>
            <div class="bars-column">
                <div id="bar2-wrap" class="bar-wrap-container"></div>
                <div id="bar2-nl" class="nl-wrap-container" style="display:none;"></div>
            </div>
            <div style="width:15%; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
                <button class="tool-btn" onclick="applyTool(2, 'expand')">➕ 擴分</button>
                <button class="tool-btn" onclick="applyTool(2, 'simplify')">➖ 約分</button>
            </div>
        </div>
        
        <div id="bar3-row" style="display:none; position:relative; width:100%; min-height:80px; align-items:center; justify-content:space-between; margin-top: 10px; padding-top: 15px; border-top: 2px dashed #ccc;">
            <div id="label3" style="width:15%; text-align:center; font-weight:bold; color:var(--dark); font-size:1.1rem; display:flex; flex-direction:column; align-items:center;"></div>
            <div class="bars-column">
                <div id="bar3-wrap" class="bar-wrap-container" style="min-height: 50px; border-radius: 4px; transition: 0.3s; flex-direction: row; align-items: center;"></div>
            </div>
            <div style="width:15%;"></div>
        </div>
    `;
    
    renderBar(1, 'none');
    renderBar(2, 'none');
    document.getElementById('drag-instruction').innerHTML = `💡 點上方的分數，顯示長條圖`;
}

function randomChallenge() {
    let d1 = Math.floor(Math.random() * 5) + 3; 
    let d2 = Math.floor(Math.random() * 5) + 3; 
    while(d2 === d1) { d2 = Math.floor(Math.random() * 5) + 3; }
    
    let n1 = Math.floor(Math.random() * (d1 * 2)) + 1; 
    let n2 = Math.floor(Math.random() * d2) + 1; 
    
    let w1 = '';
    let w2 = '';

    const showWhole = document.getElementById('show-whole-cb').checked;
    if (showWhole && Math.random() > 0.5 && n1 >= d1) {
        w1 = Math.floor(n1 / d1);
        n1 = n1 % d1;
        if (n1 === 0) n1 = 1; 
    }

    document.getElementById('w1').value = w1; 
    document.getElementById('n1').value = n1; 
    document.getElementById('d1').value = d1;
    document.getElementById('w2').value = w2; 
    document.getElementById('n2').value = n2; 
    document.getElementById('d2').value = d2;
    
    currentWordProblemTemplate = wordProblemTemplates[Math.floor(Math.random() * wordProblemTemplates.length)];
    updateUI();
}

function autoCheck() {
    const vals = getSafeValues();
    const ansWStr = document.getElementById('ans-w').value;
    const ansNStr = document.getElementById('ans-num').value;
    const ansDStr = document.getElementById('ans-den').value;

    const ansW = parseInt(ansWStr) || 0;
    let ansN = parseInt(ansNStr);
    let ansD = parseInt(ansDStr);

    if (ansNStr === "" && ansDStr === "") {
        ansN = 0;
        ansD = 1;
    }

    const fb = document.getElementById('feedback');

    if (!isNaN(ansN) && !isNaN(ansD) && ansD !== 0) {
        const userTotalN = ansW * ansD + ansN;
        const userVal = userTotalN / ansD;

        // 除法的解答邏輯
        const exactN = vals.total_n1 * vals.d2;
        const exactD = vals.total_n2 * vals.d1;
        const exactVal = exactN / exactD;

        const divisor = gcd(exactN, exactD);
        const simpleImproperN = exactN / divisor;
        const simpleD = exactD / divisor;

        const simpleW = Math.floor(simpleImproperN / simpleD);
        const simpleMixedN = simpleImproperN % simpleD;

        let currentD = vals.d1 * s1;
        let LcmD = lcm(vals.d1, vals.d2);

        if (Math.abs(userVal - exactVal) < 0.0001) {
            let msg = "";
            let isSimplest = false;

            if (ansW === 0 && ansN === simpleImproperN && ansD === simpleD) isSimplest = true;
            if (ansW === simpleW && ansN === simpleMixedN && ansD === simpleD) isSimplest = true;
            if (ansN === 0 && ansW === simpleW && simpleMixedN === 0) isSimplest = true;

            if (isSimplest) {
                msg = '🎉 完全正確！';
            } else {
                msg = '🌟 數值對了，可以再約分或寫成帶分數';
            }
            
            if (currentD !== LcmD) {
                msg += '<br><span style="color:var(--orange); font-size:1rem; font-weight:normal;">（提示：通分時分母不是最小公倍數）</span>';
            }

            fb.style.opacity = '1'; fb.style.color = 'var(--success)'; 
            fb.innerHTML = msg;
        } else { 
            fb.style.opacity = '1'; fb.style.color = 'var(--red)'; 
            fb.innerText = '👀 答案不對，再數一次裝了幾個容器'; 
        }
    } else { fb.style.opacity = '0'; }
}

window.onload = () => {
    updateSpeed(); 
    toggleWholeNumber(); 
    updateUI();
};
