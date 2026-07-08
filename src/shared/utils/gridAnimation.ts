/**
 * Shared grid animation utility used by addition, subtraction, and division apps.
 * Renders thick separator lines and thin subdivision lines with optional
 * animated expand / simplify transitions.
 */
export function applyGridAnimation(
  gridContainer: Element,
  d: number,
  s: number,
  old_s: number,
  action: string,
  currentSpeed: number,
): void {
  const animTimeMs = (0.6 / currentSpeed) * 1000
  const halfAnimMs = animTimeMs / 2

  gridContainer.innerHTML = ''
  let html = '<div class="grid-overlay">'

  for (let k = 1; k < d; k++) {
    html += `<div class="abs-thick-line" style="left: ${(k / d) * 100}%;"></div>`
  }

  if (action === 'simplify') {
    for (let k = 0; k < d; k++) {
      const remove_j = Math.floor(old_s / 2)
      for (let j = 1; j < old_s; j++) {
        const oldLeftPct = ((k * old_s + j) / (d * old_s)) * 100
        const lineId = `line_${Math.random().toString(36).substr(2, 5)}`
        if (j === remove_j) {
          html += `<div id="${lineId}" class="abs-thin-line removed-line" style="left: ${oldLeftPct}%; top: 0; height: 100%; transition: height ${halfAnimMs}ms ease-in;"></div>`
        } else {
          const new_j = j < remove_j ? j : j - 1
          const newLeftPct = ((k * s + new_j) / (d * s)) * 100
          html += `<div id="${lineId}" class="abs-thin-line retained-line" style="left: ${oldLeftPct}%; top: 0; height: 100%; transition: left ${halfAnimMs}ms ease-out;" data-target-left="${newLeftPct}%"></div>`
        }
      }
    }
    html += '</div>'
    gridContainer.innerHTML = html
    setTimeout(() => {
      gridContainer.querySelectorAll<HTMLElement>('.removed-line').forEach(l => { l.style.height = '0%' })
    }, 50)
    setTimeout(() => {
      gridContainer.querySelectorAll<HTMLElement>('.retained-line').forEach(l => {
        l.style.left = l.getAttribute('data-target-left') || ''
      })
    }, 50 + halfAnimMs)
  } else if (action === 'expand') {
    for (let k = 0; k < d; k++) {
      for (let j = 1; j < s; j++) {
        const leftPct = ((k * s + j) / (d * s)) * 100
        html += `<div class="abs-thin-line expand-anim-line" style="left: ${leftPct}%; height: 0%; top: 0; background: var(--orange); transition: height ${animTimeMs}ms cubic-bezier(0.4, 0, 0.2, 1), background-color ${animTimeMs}ms;"></div>`
      }
    }
    html += '</div>'
    gridContainer.innerHTML = html
    setTimeout(() => {
      gridContainer.querySelectorAll<HTMLElement>('.expand-anim-line').forEach(l => {
        l.style.height = '100%'
        setTimeout(() => { l.style.background = 'var(--dark)' }, animTimeMs)
      })
    }, 50)
  } else {
    for (let k = 0; k < d; k++) {
      for (let j = 1; j < s; j++) {
        const leftPct = ((k * s + j) / (d * s)) * 100
        html += `<div class="abs-thin-line" style="left: ${leftPct}%;"></div>`
      }
    }
    html += '</div>'
    gridContainer.innerHTML = html
  }
}
