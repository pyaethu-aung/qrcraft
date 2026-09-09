/**
 * Code-drawn QR frames. Every frame is composed from SVG primitives (paths, rects,
 * text) — no licensed or raster artwork. Given the QR's natural size `Q` (in user
 * units), each style returns a square `viewBox`, the box the QR should occupy, and
 * an SVG `decoration` fragment (border / band / caption) drawn around it.
 *
 * The QR is never scaled here: `qrBox.size` always equals `Q`, so callers only
 * translate it. The frame grows the canvas around the QR instead.
 */

import type { QRFramePosition, QRFrameStyle } from '../types/qr'
import { readableTextColor } from './contrast'

export interface FrameRender {
  /** Square canvas edge in user units. */
  viewBox: number
  /** Where the QR sits inside the canvas. `size` always equals the input `Q`. */
  qrBox: { x: number; y: number; size: number }
  /** SVG fragment drawn after the background and before the QR. */
  decoration: string
}

const n = (v: number): number => Math.round(v * 1000) / 1000

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '"': return '&quot;'
      default: return '&apos;'
    }
  })
}

/** Closed rounded-rectangle path. */
function rrect(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2)
  return (
    `M${n(x + rr)},${n(y)} h${n(w - 2 * rr)} a${n(rr)},${n(rr)} 0 0 1 ${n(rr)},${n(rr)} ` +
    `v${n(h - 2 * rr)} a${n(rr)},${n(rr)} 0 0 1 -${n(rr)},${n(rr)} ` +
    `h-${n(w - 2 * rr)} a${n(rr)},${n(rr)} 0 0 1 -${n(rr)},-${n(rr)} ` +
    `v-${n(h - 2 * rr)} a${n(rr)},${n(rr)} 0 0 1 ${n(rr)},-${n(rr)} Z`
  )
}

/** Bar with rounded outer corners on one edge and square corners on the other. */
function edgeBar(x: number, y: number, w: number, h: number, r: number, round: 'top' | 'bottom'): string {
  const rr = Math.min(r, w / 2, h)
  if (round === 'bottom') {
    return (
      `M${n(x)},${n(y)} h${n(w)} v${n(h - rr)} a${n(rr)},${n(rr)} 0 0 1 -${n(rr)},${n(rr)} ` +
      `h-${n(w - 2 * rr)} a${n(rr)},${n(rr)} 0 0 1 -${n(rr)},-${n(rr)} Z`
    )
  }
  return (
    `M${n(x + rr)},${n(y)} h${n(w - 2 * rr)} a${n(rr)},${n(rr)} 0 0 1 ${n(rr)},${n(rr)} ` +
    `v${n(h - rr)} h-${n(w)} v-${n(h - rr)} a${n(rr)},${n(rr)} 0 0 1 ${n(rr)},-${n(rr)} Z`
  )
}

/** Centered caption `<text>`, shrunk to fit `maxWidth` when it would overflow. */
function caption(text: string, cx: number, cy: number, fontSize: number, color: string, maxWidth: number): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  const ls = fontSize * 0.08
  const estimate = trimmed.length * fontSize * 0.62 + Math.max(0, trimmed.length - 1) * ls
  const fit = estimate > maxWidth ? ` textLength="${n(maxWidth)}" lengthAdjust="spacingAndGlyphs"` : ''
  return (
    `<text x="${n(cx)}" y="${n(cy)}" fill="${color}" font-family="Arial, Helvetica, sans-serif" ` +
    `font-size="${n(fontSize)}" font-weight="700" letter-spacing="${n(ls)}" text-anchor="middle" ` +
    `dominant-baseline="central"${fit}>${escapeXml(trimmed)}</text>`
  )
}

/**
 * Renders a non-`None` frame. `None` is handled by the composer, which draws the bare QR.
 */
export function renderFrame(
  style: Exclude<QRFrameStyle, 'None'>,
  Q: number,
  frameColor: string,
  bgColor: string,
  text: string,
  position: QRFramePosition,
): FrameRender {
  const onBand = readableTextColor(frameColor)
  const atBottom = position === 'bottom'

  switch (style) {
    case 'Banner': {
      const om = Q * 0.05
      const bh = Q * 0.17
      const g = Q * 0.045
      const viewBox = n(Q + g + bh + 2 * om)
      const qx = (viewBox - Q) / 2
      const qy = atBottom ? om : om + bh + g
      const bandY = atBottom ? om + Q + g : om
      const band = `<path d="${rrect(qx, bandY, Q, bh, bh / 2)}" fill="${frameColor}"/>`
      const cap = caption(text, qx + Q / 2, bandY + bh / 2, bh * 0.42, onBand, Q * 0.84)
      return { viewBox, qrBox: { x: qx, y: qy, size: Q }, decoration: band + cap }
    }

    case 'Card': {
      const om = Q * 0.05
      const ip = Q * 0.08
      const bh = Q * 0.17
      const bt = Q * 0.03
      const cardW = Q + 2 * ip
      const cardH = ip + Q + ip + bh
      const viewBox = n(cardH + 2 * om)
      const cardX = (viewBox - cardW) / 2
      const cardY = om
      const radius = Q * 0.07
      const qx = cardX + ip
      const qy = atBottom ? cardY + ip : cardY + bh + ip
      const barY = atBottom ? cardY + cardH - bh : cardY
      const border = `<path d="${rrect(cardX, cardY, cardW, cardH, radius)}" fill="none" stroke="${frameColor}" stroke-width="${n(bt)}"/>`
      const bar = `<path d="${edgeBar(cardX + bt, barY + (atBottom ? 0 : bt), cardW - 2 * bt, bh - bt, radius - bt, atBottom ? 'bottom' : 'top')}" fill="${frameColor}"/>`
      const cap = caption(text, viewBox / 2, barY + bh / 2 + (atBottom ? -bt / 2 : bt / 2), bh * 0.4, onBand, Q * 0.8)
      return { viewBox, qrBox: { x: qx, y: qy, size: Q }, decoration: border + bar + cap }
    }

    case 'Ticket': {
      const om = Q * 0.05
      const ip = Q * 0.09
      const ch = Q * 0.2
      const bt = Q * 0.028
      const tagW = Q + 2 * ip
      const tagH = ip + Q + ip + ch
      const viewBox = n(tagH + 2 * om)
      const tagX = (viewBox - tagW) / 2
      const tagY = om
      const radius = Q * 0.06
      const qy = atBottom ? tagY + ip : tagY + ch + ip
      const perfY = atBottom ? tagY + ip + Q + ip * 0.55 : tagY + ch + ip * 0.45
      const capCy = atBottom ? (perfY + tagY + tagH) / 2 : (tagY + perfY) / 2
      const nr = Q * 0.035
      const border = `<path d="${rrect(tagX, tagY, tagW, tagH, radius)}" fill="none" stroke="${frameColor}" stroke-width="${n(bt)}"/>`
      const perf = `<line x1="${n(tagX + ip * 0.6)}" y1="${n(perfY)}" x2="${n(tagX + tagW - ip * 0.6)}" y2="${n(perfY)}" stroke="${frameColor}" stroke-width="${n(bt * 0.8)}" stroke-dasharray="${n(Q * 0.03)} ${n(Q * 0.022)}" stroke-linecap="round"/>`
      const notchL = `<circle cx="${n(tagX)}" cy="${n(perfY)}" r="${n(nr)}" fill="${bgColor}" stroke="${frameColor}" stroke-width="${n(bt)}"/>`
      const notchR = `<circle cx="${n(tagX + tagW)}" cy="${n(perfY)}" r="${n(nr)}" fill="${bgColor}" stroke="${frameColor}" stroke-width="${n(bt)}"/>`
      const cap = caption(text, viewBox / 2, capCy, ch * 0.34, frameColor, Q * 0.82)
      return { viewBox, qrBox: { x: tagX + ip, y: qy, size: Q }, decoration: border + perf + notchL + notchR + cap }
    }

    case 'Label': {
      const om = Q * 0.05
      const bh = Q * 0.14
      const rh = Q * 0.06
      const g = Q * 0.04
      const viewBox = n(om + rh + g + Q + g + bh + om)
      const qx = (viewBox - Q) / 2
      const capH = bh
      const capY = atBottom ? om + rh + g + Q + g : om
      const ruleY = atBottom ? om + rh / 2 : om + bh + g + Q + g + rh / 2
      const qy = atBottom ? om + rh + g : om + bh + g
      const rule = `<line x1="${n(qx + Q * 0.18)}" y1="${n(ruleY)}" x2="${n(qx + Q * 0.82)}" y2="${n(ruleY)}" stroke="${frameColor}" stroke-width="${n(Q * 0.014)}" stroke-linecap="round"/>`
      const bar = `<path d="${rrect(qx, capY, Q, capH, capH / 2)}" fill="${frameColor}"/>`
      const cap = caption(text, qx + Q / 2, capY + capH / 2, capH * 0.46, onBand, Q * 0.84)
      return { viewBox, qrBox: { x: qx, y: qy, size: Q }, decoration: rule + bar + cap }
    }

    case 'Bubble': {
      const om = Q * 0.05
      const bh = Q * 0.19
      const g = Q * 0.03
      const th = Q * 0.05
      const tw = Q * 0.055
      const bubbleW = Q * 0.9
      const viewBox = n(om + Q + g + th + bh + om)
      const qx = (viewBox - Q) / 2
      const qy = atBottom ? om : om + bh + th + g
      const bubbleX = (viewBox - bubbleW) / 2
      const bubbleY = atBottom ? om + Q + g + th : om
      const bubble = `<path d="${rrect(bubbleX, bubbleY, bubbleW, bh, bh / 2)}" fill="${frameColor}"/>`
      const cxv = viewBox / 2
      const tail = atBottom
        ? `<path d="M${n(cxv - tw)},${n(bubbleY)} L${n(cxv + tw)},${n(bubbleY)} L${n(cxv)},${n(bubbleY - th)} Z" fill="${frameColor}"/>`
        : `<path d="M${n(cxv - tw)},${n(bubbleY + bh)} L${n(cxv + tw)},${n(bubbleY + bh)} L${n(cxv)},${n(bubbleY + bh + th)} Z" fill="${frameColor}"/>`
      const cap = caption(text, cxv, bubbleY + bh / 2, bh * 0.4, onBand, bubbleW * 0.82)
      return { viewBox, qrBox: { x: qx, y: qy, size: Q }, decoration: bubble + tail + cap }
    }

    case 'Ticks': {
      const om = Q * 0.07
      const ch = Q * 0.14
      const g = Q * 0.05
      const off = Q * 0.05
      const al = Q * 0.16
      const tk = Q * 0.03
      const viewBox = n(om + Q + g + ch + om)
      const qx = (viewBox - Q) / 2
      const qy = atBottom ? om : om + ch + g
      const corner = (cxr: number, cyr: number, dx: number, dy: number): string => {
        // horizontal arm + vertical arm forming an L at (cxr,cyr), extending by (dx,dy)
        const hx = dx > 0 ? cxr : cxr - al
        const vy = dy > 0 ? cyr : cyr - al
        return (
          `<rect x="${n(hx)}" y="${n(dy > 0 ? cyr : cyr - tk)}" width="${n(al)}" height="${n(tk)}" fill="${frameColor}"/>` +
          `<rect x="${n(dx > 0 ? cxr : cxr - tk)}" y="${n(vy)}" width="${n(tk)}" height="${n(al)}" fill="${frameColor}"/>`
        )
      }
      const left = qx - off
      const right = qx + Q + off
      const top = qy - off
      const bottom = qy + Q + off
      const brackets =
        corner(left, top, 1, 1) +
        corner(right, top, -1, 1) +
        corner(left, bottom, 1, -1) +
        corner(right, bottom, -1, -1)
      const capCy = atBottom ? qy + Q + g + ch / 2 : om + ch / 2
      const cap = caption(text, viewBox / 2, capCy, ch * 0.5, frameColor, Q * 0.8)
      return { viewBox, qrBox: { x: qx, y: qy, size: Q }, decoration: brackets + cap }
    }

    case 'Photo': {
      // A solid mat fills the tile; a white window holds the QR (its quiet zone),
      // and the caption sits in a wide margin on the position side, like an instant print.
      const om = Q * 0.04
      const pad = Q * 0.06 // white quiet zone around the QR inside the window
      const win = Q + 2 * pad
      const matSide = Q * 0.09 // mat thickness on the three thin sides
      const capMargin = Q * 0.24 // wide caption margin on the caption side
      const matW = win + 2 * matSide
      const matH = matSide + win + capMargin
      const viewBox = n(Math.max(matW, matH) + 2 * om)
      const matX = (viewBox - matW) / 2
      const matY = (viewBox - matH) / 2
      const winX = matX + matSide
      const winY = atBottom ? matY + matSide : matY + capMargin
      const capCy = atBottom ? winY + win + capMargin / 2 : matY + capMargin / 2
      const mat = `<path d="${rrect(matX, matY, matW, matH, Q * 0.04)}" fill="${frameColor}"/>`
      const windowRect = `<path d="${rrect(winX, winY, win, win, Q * 0.02)}" fill="${bgColor}"/>`
      const cap = caption(text, viewBox / 2, capCy, capMargin * 0.34, onBand, win * 0.9)
      return { viewBox, qrBox: { x: winX + pad, y: winY + pad, size: Q }, decoration: mat + windowRect + cap }
    }

    case 'Circle': {
      // The QR square is inscribed in a ring (inner radius clears the square's
      // corners, which sit a half-diagonal from the center), and a "SCAN ME"
      // pill straddles the ring's edge on the caption side, like a round badge.
      const om = Q * 0.05
      const pad = Q * 0.06 // quiet zone between the QR's corners and the ring
      const t = Q * 0.035 // ring thickness
      const rIn = Q * Math.SQRT1_2 + pad // half-diagonal of the QR + pad
      const rMid = rIn + t / 2 // ring stroke centerline
      const rOut = rIn + t
      const ph = Q * 0.16 // pill height
      const pw = Q * 0.5 // pill width
      const overhang = rMid + ph / 2 // center → far pill edge on the caption side
      const viewBox = n(2 * om + rOut + overhang)
      const cx = viewBox / 2
      const cy = atBottom ? om + rOut : viewBox - om - rOut
      const pillCy = atBottom ? cy + rMid : cy - rMid
      const disc = `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(rIn)}" fill="${bgColor}"/>`
      const ring = `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(rMid)}" fill="none" stroke="${frameColor}" stroke-width="${n(t)}"/>`
      const pill = text.trim() ? `<path d="${rrect(cx - pw / 2, pillCy - ph / 2, pw, ph, ph / 2)}" fill="${frameColor}"/>` : ''
      const cap = caption(text, cx, pillCy, ph * 0.42, onBand, pw * 0.84)
      return { viewBox, qrBox: { x: cx - Q / 2, y: cy - Q / 2, size: Q }, decoration: disc + ring + pill + cap }
    }
  }
}
