    // Disable right-click
    document.addEventListener('contextmenu', event => event.preventDefault());

    // Disable keyboard shortcuts
    document.onkeydown = function(e) {
    if (e.keyCode === 123) return false;
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) return false;
    if (e.ctrlKey && (e.keyCode === 67 || e.keyCode === 85 || e.keyCode === 83)) return false;
};


/* ===== next inline <script> block ===== */

const LIMITS = { den_start: 100, expand_factor: 20 };
let currentOp = '*'; 
let showNumberLine = true;
let isSyncMode = true; // 預設為模式1
let drawProcessGeneration = 0;
let drawProcessAnimTimeout = null;
let drawProcessBgTimeouts = [];
let prevFdVal = 1;
let prevFnVal = 1;

let targetNum = null;  
let targetDen = null;  

function getAnimTiming(fnVal, fdVal) {
    let maxFactor = Math.max(fnVal, fdVal);
    let baseAnimDuration = 1.3;
    let baseBgTimeout = 1250;
    if (maxFactor > 3) {
        baseAnimDuration = 1.0;
        baseBgTimeout = 950;
    }
    const speedVal = parseFloat(document.getElementById('speed_slider').value);
    const animDurationSec = baseAnimDuration / speedVal;
    return {
        animDuration: animDurationSec + 's',
        animDurationMs: animDurationSec * 1000,
        bgTimeout: baseBgTimeout / speedVal
    };
}

function applyBarAnimDuration(animDuration) {
    document.documentElement.style.setProperty('--bar-anim-duration', animDuration);
}

function clearDrawProcessTimeouts() {
    if (drawProcessAnimTimeout) {
        clearTimeout(drawProcessAnimTimeout);
        drawProcessAnimTimeout = null;
    }
    drawProcessBgTimeouts.forEach(id => clearTimeout(id));
    drawProcessBgTimeouts = [];
}

function toggleSyncMode() {
    isSyncMode = !isSyncMode;
    const btn = document.getElementById('btn_toggle_sync');
    
    if (isSyncMode) {
        btn.innerText = '同步分子分母';
        btn.classList.add('btn-active-mode');
        
        // 切換回同步時，強制對齊數值
        let val = document.getElementById('fn').value;
        manualFactorChange('fn', val);
    } else {
        btn.innerText = '自由調整';
        btn.classList.remove('btn-active-mode');
        
        let fnVal = parseInt(document.getElementById('fn').value) || 1;
        let fdVal = parseInt(document.getElementById('fd').value) || 1;
        syncOpColor(currentOp, fnVal, fdVal);
        renderEverything(true);
    }
}

function generateRandomFraction() {
    let d = Math.floor(Math.random() * 11) + 2; 
    let n = Math.floor(Math.random() * d) + 1;  
    
    if (currentOp === '/') {
        let multiplier = Math.floor(Math.random() * 4) + 2; 
        
        if (d * multiplier > LIMITS.den_start) {
            multiplier = Math.floor(LIMITS.den_start / d);
            if (multiplier < 2) multiplier = 2; 
        }
        n = n * multiplier;
        d = d * multiplier;
        
        if (d > LIMITS.den_start) {
            d = LIMITS.den_start;
            n = Math.floor(d / 2);
        }
    }

    document.getElementById('n_start').value = n;
    document.getElementById('d_start').value = d;
    
    document.getElementById('fn').value = 1;
    document.getElementById('fd').value = 1;
    prevFdVal = 1;
    prevFnVal = 1;
    syncOpColor(currentOp, 1, 1);
    
    renderEverything(true);
}

function updateSpeedUI(val) {
    document.getElementById('speed_label').innerText = `動畫速度: ${Number(val).toFixed(1)} x`;
    const fnVal = parseInt(document.getElementById('fn').value) || 1;
    const fdVal = parseInt(document.getElementById('fd').value) || 1;
    applyBarAnimDuration(getAnimTiming(fnVal, fdVal).animDuration);
}

function toggleNumberLine() {
    showNumberLine = document.getElementById('cb_toggle_nl').checked;
    document.getElementById('number_line_wrapper').style.display = showNumberLine ? 'block' : 'none';
}

function swapFractions() {
    let n_t = document.getElementById('n_target').value;
    let d_t = document.getElementById('d_target').value;
    
    if (n_t === "?" || d_t === "?" || n_t === "" || d_t === "") {
        return;
    }
    
    let newN = parseInt(n_t);
    let newD = parseInt(d_t);
    let fnVal = parseInt(document.getElementById('fn').value) || 1;
    let fdVal = parseInt(document.getElementById('fd').value) || 1;
    
    document.getElementById('n_start').value = newN;
    document.getElementById('d_start').value = newD;
    
    currentOp = (currentOp === '*') ? '/' : '*';
    const symbol = (currentOp === '*') ? '×' : '÷';
    document.getElementById('on').innerText = symbol;
    document.getElementById('od').innerText = symbol;
    
    const btnMerge = document.getElementById('btn_merge');
    const btnSlice = document.getElementById('btn_slice');
    
    if (currentOp === '/') {
        btnMerge.disabled = true;
        btnSlice.disabled = false;
    } else {
        btnSlice.disabled = true;
        btnMerge.disabled = false;
    }
    
    document.getElementById('fn').value = fnVal;
    document.getElementById('fd').value = fdVal;
    
    syncOpColor(currentOp, fnVal, fdVal);
    renderEverything(true);
}

// 更新支援超出版面的數線繪製
function drawNumberLine(d_val, total_segments) {
    const container = document.getElementById('nl_ticks');
    if(!container) return;
    let html = '';
    for (let i = 0; i <= total_segments; i++) {
        let leftPos = (i / total_segments) * 100;
        let labelHtml = '';
        
        if (i === 0) {
            labelHtml = '0';
        } else if (i === d_val) {
            labelHtml = '1';
        } else if (i % d_val === 0) {
            labelHtml = (i / d_val).toString();
        } else {
            labelHtml = `
                <span class="nl-frac">
                    <span class="nl-num">${i}</span>
                    <span class="nl-line-frac"></span>
                    <span class="nl-den">${d_val}</span>
                </span>
            `;
        }
        
        html += `
            <div class="nl-tick-wrapper" style="left: ${leftPos}%;">
                <div class="nl-tick"></div>
                <div class="nl-label">${labelHtml}</div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function getNumberLineParams(n2, d2, op) {
    let maxGrid = d2;
    let ratio = n2 / d2;
    let scale = Math.max(1, ratio);
    let drawSegments = Math.max(maxGrid, Math.round(maxGrid * scale));
    return { maxGrid, drawSegments };
}

function renderQuestionBanner() {
    const banner = document.getElementById('question_banner');
    if (targetNum === null && targetDen === null) { banner.classList.remove('show'); return; }

    const n = parseInt(document.getElementById('n_start').value) || 0;
    const d = parseInt(document.getElementById('d_start').value) || 1;

    const tNumHtml = targetNum !== null ? targetNum : '<span class="q-blank">?</span>';
    const tDenHtml = targetDen !== null ? targetDen : '<span class="q-blank">?</span>';

    document.getElementById('q_equation').innerHTML = 
        '<span class="q-frac"><span class="q-num">' + n + '</span><span class="q-line"></span><span class="q-den">' + d + '</span></span>' +
        '<span>=</span>' +
        '<span class="q-frac"><span class="q-num">' + tNumHtml + '</span><span class="q-line"></span><span class="q-den">' + tDenHtml + '</span></span>';

    banner.classList.add('show');
}

function setMode(op) {
    currentOp = op;
    const symbol = (op === '*') ? '×' : '÷';
    document.getElementById('on').innerText = symbol;
    document.getElementById('od').innerText = symbol;
    
    document.getElementById('fn').value = 1;
    document.getElementById('fd').value = 1;
    prevFdVal = 1;
    prevFnVal = 1;
    
    const btnMerge = document.getElementById('btn_merge');
    const btnSlice = document.getElementById('btn_slice');
    
    if (op === '/') {
        btnMerge.disabled = true;
        btnSlice.disabled = false;
    } else {
        btnSlice.disabled = true;
        btnMerge.disabled = false;
    }
    
    syncOpColor(op, 1, 1);
    renderEverything(true);
}

function checkEmpty(el, defaultVal) {
    if (el.value === "" || isNaN(el.value)) {
        el.value = defaultVal;
        if(el.id === 'fn' || el.id === 'fd') manualFactorChange(el.id, defaultVal);
        else manualInputChange();
    }
}

function stepInput(id, delta) {
    let el = document.getElementById(id);
    let val = parseInt(el.value) || 0;
    val += delta;
    
    if (id === 'd_start' && val < 1) val = 1;
    if (id === 'n_start' && val < 0) val = 0;
    
    el.value = val;
    manualInputChange();
}

function manualInputChange() {
    let n = parseInt(document.getElementById('n_start').value);
    let d = parseInt(document.getElementById('d_start').value);
    
    if (isNaN(d) || isNaN(n)) return;

    if (d > LIMITS.den_start) d = LIMITS.den_start;
    if (d < 1) d = 1;
    if (n > d) n = d; 
    if (n < 0) n = 0;

    document.getElementById('n_start').value = n;
    document.getElementById('d_start').value = d;

    renderEverything(true);
}

function stepFactor(id, delta) {
    let val = parseInt(document.getElementById(id).value) || 1;
    val += delta;
    manualFactorChange(id, val);
}

function manualFactorChange(id, v) {
    if (v === "") return; 
    
    let val = parseInt(v) || 1;
    if(val < 1) val = 1;

    const maxLimit = currentOp === '*' ? LIMITS.expand_factor : LIMITS.den_start;
    if(val > maxLimit) val = maxLimit;

    document.getElementById(id).value = val;

    if (isSyncMode) {
        let otherId = id === 'fn' ? 'fd' : 'fn';
        document.getElementById(otherId).value = val;
    }

    let fnVal = parseInt(document.getElementById('fn').value) || 1;
    let fdVal = parseInt(document.getElementById('fd').value) || 1;

    syncOpColor(currentOp, fnVal, fdVal);
    renderEverything(true); 
}

function syncOpColor(op, fnVal, fdVal) {
    let isMismatch = !isSyncMode && (fnVal !== fdVal);
    
    let themeColor = 'var(--red)';
    let textColor = 'var(--red)';
    let baseColor = fnVal === 1 ? '#000' : (op === '*' ? 'var(--yellow)' : 'var(--success)');
    
    if (!isMismatch) {
        themeColor = baseColor;
        textColor = fnVal === 1 ? '#000' : themeColor;
    }

    document.querySelectorAll('.op-select').forEach(el => {
        el.style.borderColor = baseColor;
        el.style.color = fnVal === 1 ? '#000' : baseColor;
    });

    document.getElementById('wrap_fn').style.borderColor = isMismatch ? 'var(--red)' : baseColor;
    document.getElementById('wrap_fd').style.borderColor = isMismatch ? 'var(--red)' : (fdVal === 1 && !isMismatch ? '#000' : (op === '*' ? 'var(--yellow)' : 'var(--success)'));

    document.querySelectorAll('#wrap_fn input, #wrap_fn .step-btn, #wrap_fd input, #wrap_fd .step-btn').forEach(el => {
        el.style.color = textColor;
    });
    
    document.getElementById('group_fn').style.borderLeftColor = isMismatch ? 'var(--red)' : '#000';
    document.getElementById('group_fd').style.borderLeftColor = isMismatch ? 'var(--red)' : '#000';
}

function buildGridHtml(drawSegments, fdVal, op, anim) {
    let html = '<div class="grid-overlay">';
    for (let i = 1; i <= drawSegments; i++) {
        html += `<div class="segment"></div>`;
        if (i < drawSegments) {
            const isMainLine = (i % fdVal === 0 && op === '/') || (op === '*' && i % fdVal === 0);
            if (op === '*') {
                if (isMainLine || fdVal === 1) {
                    html += `<div class="divider-thick"></div>`;
                } else if (anim) {
                    html += `<div class="divider-anim-slot"><div class="anim-line anim-line-dashed" style="height:0%"></div></div>`;
                } else {
                    html += `<div class="divider-thin"><div class="anim-line" style="height:100%"></div></div>`;
                }
            } else {
                if (fdVal === 1) {
                    html += `<div class="divider-thick"></div>`;
                } else if (isMainLine) {
                    html += `<div class="divider-thick"></div>`;
                } else {
                    const hS = anim ? '100%' : '0%';
                    html += `<div class="divider-thin"><div class="anim-line" style="height:${hS}"></div></div>`;
                }
            }
        }
    }
    html += '</div>';
    return html;
}

// 同 FractionApp45 步驟 2：虛線由上往下生長（或向上收回）
function animateLineHeights(lines, toPct, durationMs, generation) {
    return new Promise(resolve => {
        const list = Array.from(lines);
        if (!list.length) { resolve(); return; }

        const startHeights = list.map(l => {
            const h = l.style.height;
            return h.endsWith('%') ? parseFloat(h) : (toPct === 0 ? 100 : 0);
        });
        const start = performance.now();

        function loop(now) {
            if (generation !== drawProcessGeneration) { resolve(); return; }
            const p = Math.min((now - start) / durationMs, 1);
            list.forEach((l, i) => {
                l.style.height = `${startHeights[i] + (toPct - startHeights[i]) * p}%`;
            });
            if (p < 1) requestAnimationFrame(loop);
            else resolve();
        }
        requestAnimationFrame(loop);
    });
}

// 合併格線：有倖存線則只滑動；僅一條細線時才上拉收回（不同時做兩者）
function applyMergeGridAnimation(g, drawSegments, old_s, s, generation, onComplete) {
    const speedVal = parseFloat(document.getElementById('speed_slider').value) || 1;
    const animTimeMs = (0.6 / speedVal) * 1000;

    const d = drawSegments / old_s;
    const remove_j = Math.floor(old_s / 2);
    const hasSlide = old_s > 2;

    let html = '<div class="grid-overlay simplify-anim-overlay">';
    for (let k = 1; k < d; k++) {
        html += `<div class="simplify-abs-thick" style="left: ${(k / d) * 100}%;"></div>`;
    }
    for (let k = 0; k < d; k++) {
        for (let j = 1; j < old_s; j++) {
            const oldLeftPct = ((k * old_s + j) / (d * old_s)) * 100;
            if (hasSlide) {
                if (j === remove_j) continue;
                const new_j = j < remove_j ? j : j - 1;
                const newLeftPct = ((k * s + new_j) / (d * s)) * 100;
                html += `<div class="simplify-retained-line" style="left: ${oldLeftPct}%; height: 100%; transition: left ${animTimeMs}ms ease-out;" data-target-left="${newLeftPct}%"></div>`;
            } else if (j === remove_j) {
                html += `<div class="simplify-removed-line" style="left: ${oldLeftPct}%; height: 100%; transition: height ${animTimeMs}ms ease-in;"></div>`;
            }
        }
    }
    html += '</div>';
    g.innerHTML = html;

    drawProcessAnimTimeout = setTimeout(() => {
        if (generation !== drawProcessGeneration) return;
        if (hasSlide) {
            g.querySelectorAll('.simplify-retained-line').forEach(l => {
                l.style.left = l.getAttribute('data-target-left');
            });
        } else {
            g.querySelectorAll('.simplify-removed-line').forEach(l => { l.style.height = '0%'; });
        }
    }, 50);

    drawProcessBgTimeouts.push(setTimeout(() => {
        if (generation !== drawProcessGeneration) return;
        onComplete();
    }, 50 + animTimeMs + 20));
}

function scheduleGridLineAnimation(g, op, anim, fdVal, timing, generation, n1, d1, n2, d2, fnVal) {
    if (!anim || fdVal === 1 || op === '/') return;

    drawProcessAnimTimeout = setTimeout(() => {
        if (generation !== drawProcessGeneration) return;
        const lines = g.querySelectorAll('.anim-line');
        const toPct = op === '*' ? 100 : 0;

        animateLineHeights(lines, toPct, timing.animDurationMs, generation).then(() => {
            if (generation !== drawProcessGeneration) return;
            lines.forEach(l => {
                const wrap = l.closest('.divider-anim-slot');
                if (wrap) wrap.className = 'divider-thin';
                l.classList.remove('anim-line-dashed');
                l.style.borderLeft = '';
                l.style.width = '';
                l.style.left = '';
                l.style.transform = '';
                l.style.background = 'var(--grid-dark)';
                l.style.height = '100%';
            });
        });
    }, 50);
}

function renderEverything(anim) {
    const n1 = parseInt(document.getElementById('n_start').value) || 2;
    const d1 = parseInt(document.getElementById('d_start').value) || 8;
    const elFn = document.getElementById('fn');
    const elFd = document.getElementById('fd');
    const fnVal = elFn && elFn.value !== "" ? parseInt(elFn.value) : 1;
    const fdVal = elFd && elFd.value !== "" ? parseInt(elFd.value) : 1;
    const savedPrevFd = prevFdVal;
    const savedPrevFn = prevFnVal;
    
    document.getElementById('ln').innerText = n1;
    document.getElementById('ld').innerText = d1;
    const errorEl = document.getElementById('error_msg');
    errorEl.innerText = "";

    let canCalculate = true;
    let isNumMismatch = !isSyncMode && (fnVal !== fdVal);

    if (currentOp === '/') {
        if(fnVal === 0 || fdVal === 0) { canCalculate = false; }
        else if(n1 % fnVal !== 0 || d1 % fdVal !== 0) {
            if (errorEl.innerText !== "") errorEl.innerText += "\n";
            errorEl.innerText += `⚠️ 錯誤：分子不能被 ${fnVal} 整除，或分母不能被 ${fdVal} 整除`;
            canCalculate = false;
        }
    }

    // 若分子分母乘除數目不同，僅顯示提示並改變 = 為 ≠，但依然計算顯示結果
    if (isNumMismatch) {
        if (errorEl.innerText !== "") errorEl.innerText += "\n";
        errorEl.innerText += "⚠️ 提示：分子和分母乘以或除以不同的數字，分數值已改變。";
    }
    
    let eqLeft = document.getElementById('eq_left');
    if (eqLeft) {
        if (isNumMismatch && canCalculate) {
            eqLeft.innerText = '≠';
            eqLeft.style.color = 'var(--red)';
        } else {
            eqLeft.innerText = '=';
            eqLeft.style.color = '#000';
        }
    }

    let n2 = canCalculate ? ((currentOp === '*') ? n1 * fnVal : n1 / fnVal) : "?";
    let d2 = canCalculate ? ((currentOp === '*') ? d1 * fdVal : d1 / fdVal) : "?";
    
    document.getElementById('n_target').value = n2;
    document.getElementById('d_target').value = d2;

    const bp = document.getElementById('bar_process');
    const gp = document.getElementById('grid_process');
    const nlContainer = document.querySelector('.number-line-container');
    const scaleWrapper = document.getElementById('scale_wrapper');

    if (canCalculate) {
        if (bp) bp.style.visibility = 'visible';
        if (gp) gp.style.visibility = 'visible';
        if (nlContainer) nlContainer.style.visibility = 'visible';
        if (scaleWrapper) scaleWrapper.style.filter = 'grayscale(0%)';
        
        const timing = getAnimTiming(fnVal, fdVal);

        drawProcess(n1, d1, n2, d2, fnVal, fdVal, currentOp, anim, timing, savedPrevFd, savedPrevFn, false);

        if (showNumberLine) {
            const nlParams = getNumberLineParams(n2, d2, currentOp);
            if (nlParams) drawNumberLine(nlParams.maxGrid, nlParams.drawSegments);
        }
    } else {
        // 如果無法計算 (約分除不盡)，才套用灰階濾鏡
        if (scaleWrapper) scaleWrapper.style.filter = 'grayscale(100%)';
    }

    prevFdVal = fdVal;
    prevFnVal = fnVal;
}

// 更新長條圖繪製機制，支援延伸畫面
function drawProcess(n1, d1, n2, d2, fnVal, fdVal, op, anim, timing, prevFd, prevFn, skipShrinkCheck) {
    const b = document.getElementById('bar_process');
    const g = document.getElementById('grid_process');
    const scaleWrapper = document.getElementById('scale_wrapper');
    if(!b || !g || !scaleWrapper) return;

    if (!skipShrinkCheck) {
        clearDrawProcessTimeouts();
    }
    const generation = ++drawProcessGeneration;

    let maxGrid = (op === '*') ? d2 : ((anim && fdVal !== 1) ? d1 : d2);
    let ratio = n2 / d2;
    let scale = Math.max(1, ratio);
    let drawSegments = Math.max(maxGrid, Math.round(maxGrid * scale));

    if (!timing) timing = getAnimTiming(fnVal, fdVal);
    applyBarAnimDuration(timing.animDuration);
    scaleWrapper.style.transition = `width ${timing.animDuration} ease`;
    b.style.transition = `width ${timing.animDuration} ease`;
    scaleWrapper.style.width = (scale * 100) + '%';
    b.style.width = ((ratio / scale) * 100) + '%';

    const mountGrid = (useAnim) => {
        g.innerHTML = buildGridHtml(drawSegments, fdVal, op, useAnim);
        scheduleGridLineAnimation(g, op, useAnim, fdVal, timing, generation, n1, d1, n2, d2, fnVal);
    };

    const isExpandDecrease = !skipShrinkCheck && anim && op === '*' && fdVal < prevFd && prevFd > 1;
    const isSimplifyStep = !skipShrinkCheck && anim && op === '/' && fdVal > prevFd;

    if (isExpandDecrease) {
        const prevD2 = d1 * prevFd;
        const prevDrawSegments = Math.max(prevD2, Math.round(prevD2 * Math.max(1, n2 / d2)));
        drawProcessAnimTimeout = setTimeout(() => {
            if (generation !== drawProcessGeneration) return;
            applyMergeGridAnimation(g, prevDrawSegments, prevFd, fdVal, generation, () => {
                if (generation !== drawProcessGeneration) return;
                mountGrid(false);
            });
        }, 50);
        return;
    }

    if (isSimplifyStep) {
        drawProcessAnimTimeout = setTimeout(() => {
            if (generation !== drawProcessGeneration) return;
            applyMergeGridAnimation(g, drawSegments, fdVal, prevFd, generation, () => {
                if (generation !== drawProcessGeneration) return;
                const finalMaxGrid = d2;
                const finalDrawSegments = Math.max(finalMaxGrid, Math.round(finalMaxGrid * (n2 / d2)));
                g.innerHTML = buildGridHtml(finalDrawSegments, fdVal, op, false);
            });
        }, 50);
        return;
    }

    mountGrid(anim);
}

window.onload = function() {
    try { if (window.self !== window.top) document.body.classList.add('embedded'); } catch(e) { document.body.classList.add('embedded'); }

    const urlParams = new URLSearchParams(window.location.search);
    const pNum = parseInt(urlParams.get('numerator'));
    const pDen = parseInt(urlParams.get('denominator'));
    const pMode = urlParams.get('mode'); 
    const pTargetNum = urlParams.get('targetNum');
    const pTargetDen = urlParams.get('targetDen');

    if (pTargetNum !== null && pTargetNum !== '') targetNum = parseInt(pTargetNum);
    if (pTargetDen !== null && pTargetDen !== '') targetDen = parseInt(pTargetDen);

    if (!isNaN(pNum) && !isNaN(pDen) && pDen >= 1) {
        document.getElementById('n_start').value = Math.min(pNum, pDen);
        document.getElementById('d_start').value = Math.min(pDen, LIMITS.den_start);
    }

    if (pMode === 'simplify') {
        setMode('/');
    } else {
        setMode('*');
    }

    renderQuestionBanner();
    manualInputChange();

    window.addEventListener('message', function(e) {
        if (e.data && e.data.type === 'set-params') {
            const p = e.data.params;
            if (p.targetNum !== undefined) targetNum = p.targetNum;
            if (p.targetDen !== undefined) targetDen = p.targetDen;
            if (p.numerator != null && p.denominator != null) {
                document.getElementById('n_start').value = Math.min(p.numerator, p.denominator);
                document.getElementById('d_start').value = Math.min(p.denominator, LIMITS.den_start);
            }
            if (p.mode === 'simplify') setMode('/');
            else setMode('*');
            renderQuestionBanner();
            manualInputChange();
        }
    });
};
