import qrcode from 'qrcode'

export type QRModuleType = 'eye' | 'data'

export interface QRModule {
  x: number
  y: number
  isDark: boolean
  type: QRModuleType
}

export interface ParsedQR {
  size: number
  modules: QRModule[]
}

export function getMatrixSize(value: string, ecLevel: 'L' | 'M' | 'Q' | 'H'): number {
  if (!value) return 21;
  // Content past the level's capacity has no encodable matrix — qrcode.create
  // throws. This runs at render (logo-cap / risky-pattern derivation), so a throw
  // would take the whole generator down; report the smallest matrix instead and
  // let the capacity guard upstream clear the preview.
  try {
    const qr = qrcode.create(value, { errorCorrectionLevel: ecLevel })
    return qr.modules.size;
  } catch {
    return 21;
  }
}

/**
 * Parses raw `qrcode` module matrix into a 2D-aware list specifying coordinate locations,
 * module type (positional 'eye' vs standard 'data'), and light/dark status.
 */
export function parseQRCode(value: string, ecLevel: 'L' | 'M' | 'Q' | 'H'): ParsedQR {
  // Use qrcode to generate the raw binary matrix
  const qr = qrcode.create(value, { errorCorrectionLevel: ecLevel })
  const size = qr.modules.size
  const data = qr.modules.data
  
  const modules: QRModule[] = []

  // Iterate over 1D bit array calculating 2D coords
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const isDark = !!data[y * size + x]
      
      // Calculate if the module falls within the 3 standard QR alignment corners
      // Standard format defines position detection patterns as 7x7 squares located at corners
      const isTopLeftEye = x < 7 && y < 7
      const isTopRightEye = x >= size - 7 && y < 7
      const isBottomLeftEye = x < 7 && y >= size - 7
      
      const type: QRModuleType = (isTopLeftEye || isTopRightEye || isBottomLeftEye) ? 'eye' : 'data'

      modules.push({ x, y, isDark, type })
    }
  }

  return { size, modules }
}

/**
 * Eye FRAME (outer ring). Returns two subpaths — the outer 7×7 boundary and the 5×5
 * hole — meant to be rendered with `fill-rule="evenodd"` so the hole punches the ring.
 * The dark 3×3 center is NOT included here; see {@link getEyeCenterPath}. Splitting the
 * frame from the center lets each take an independent shape and color.
 */
export function getEyeFramePath(shape: import('../types/qr').QREyeFrameShape, x: number, y: number, cellSize: number): string {
  const s = cellSize;

  if (shape === 'Rounded') {
    // outer 7×7 (r=1.5s) → 5×5 hole (r=s)
    return (
      `M${x+1.5*s},${y} h${4*s} a${1.5*s},${1.5*s} 0 0 1 ${1.5*s},${1.5*s} v${4*s} a${1.5*s},${1.5*s} 0 0 1 -${1.5*s},${1.5*s} h-${4*s} a${1.5*s},${1.5*s} 0 0 1 -${1.5*s},-${1.5*s} v-${4*s} a${1.5*s},${1.5*s} 0 0 1 ${1.5*s},-${1.5*s} Z ` +
      `M${x+2*s},${y+s} h${3*s} a${s},${s} 0 0 1 ${s},${s} v${3*s} a${s},${s} 0 0 1 -${s},${s} h-${3*s} a${s},${s} 0 0 1 -${s},-${s} v-${3*s} a${s},${s} 0 0 1 ${s},-${s} Z`
    );
  }

  if (shape === 'Circle') {
    const cy = y + 3.5*s;
    // outer circle (r=3.5s) → hole circle (r=2.5s)
    return (
      `M${x},${cy} a${3.5*s},${3.5*s} 0 1 0 ${7*s},0 a${3.5*s},${3.5*s} 0 1 0 -${7*s},0 Z ` +
      `M${x+s},${cy} a${2.5*s},${2.5*s} 0 1 0 ${5*s},0 a${2.5*s},${2.5*s} 0 1 0 -${5*s},0 Z`
    );
  }

  if (shape === 'Leaf') {
    // Top-left sharp, bottom-right rounded outer → 5×5 hole (matching corners)
    return (
      `M${x},${y} h${5.5*s} a${1.5*s},${1.5*s} 0 0 1 ${1.5*s},${1.5*s} v${5.5*s} h-${5.5*s} a${1.5*s},${1.5*s} 0 0 1 -${1.5*s},-${1.5*s} Z ` +
      `M${x+s},${y+s} h${4*s} a${s},${s} 0 0 1 ${s},${s} v${4*s} h-${4*s} a${s},${s} 0 0 1 -${s},-${s} Z`
    );
  }

  if (shape === 'Hexagon') {
    const cx = x + 3.5*s;
    // Pointy-top hexagon: side vertices at H/4 and 3H/4 of each layer's height.
    // outer 7s tall: sides at 1.75s, 5.25s. hole 5s tall (y+s..y+6s): sides at y+2.25s, y+4.75s.
    return (
      `M${cx},${y} L${x+7*s},${y+1.75*s} L${x+7*s},${y+5.25*s} L${cx},${y+7*s} L${x},${y+5.25*s} L${x},${y+1.75*s} Z ` +
      `M${cx},${y+s} L${x+6*s},${y+2.25*s} L${x+6*s},${y+4.75*s} L${cx},${y+6*s} L${x+s},${y+4.75*s} L${x+s},${y+2.25*s} Z`
    );
  }

  if (shape === 'SquareRound') {
    // outer 7×7 square → 5×5 rounded hole (r=s)
    return (
      `M${x},${y} h${7*s} v${7*s} h-${7*s} Z ` +
      `M${x+2*s},${y+s} h${3*s} a${s},${s} 0 0 1 ${s},${s} v${3*s} a${s},${s} 0 0 1 -${s},${s} h-${3*s} a${s},${s} 0 0 1 -${s},-${s} v-${3*s} a${s},${s} 0 0 1 ${s},-${s} Z`
    );
  }

  if (shape === 'RoundSquare') {
    // outer rounded ring (r=1.5s) → square 5×5 hole
    return (
      `M${x+1.5*s},${y} h${4*s} a${1.5*s},${1.5*s} 0 0 1 ${1.5*s},${1.5*s} v${4*s} a${1.5*s},${1.5*s} 0 0 1 -${1.5*s},${1.5*s} h-${4*s} a${1.5*s},${1.5*s} 0 0 1 -${1.5*s},-${1.5*s} v-${4*s} a${1.5*s},${1.5*s} 0 0 1 ${1.5*s},-${1.5*s} Z ` +
      `M${x+s},${y+s} h${5*s} v${5*s} h-${5*s} Z`
    );
  }

  if (shape === 'Diamond') {
    const cx = x + 3.5*s;
    // outer rotated 45° diamond → inner diamond hole
    return (
      `M${cx},${y} L${x+7*s},${y+3.5*s} L${cx},${y+7*s} L${x},${y+3.5*s} Z ` +
      `M${cx},${y+s} L${x+6*s},${y+3.5*s} L${cx},${y+6*s} L${x+s},${y+3.5*s} Z`
    );
  }

  // Square: outer 7×7 → 5×5 hole
  return (
    `M${x},${y} h${7*s} v${7*s} h-${7*s} Z ` +
    `M${x+s},${y+s} h${5*s} v${5*s} h-${5*s} Z`
  );
}

/**
 * Eye CENTER (the dark 3×3 dot, inset 2 modules). A single filled subpath rendered with
 * the default non-zero fill rule. Pairs with any {@link getEyeFramePath} shape.
 */
export function getEyeCenterPath(shape: import('../types/qr').QREyeCenterShape, x: number, y: number, cellSize: number): string {
  const s = cellSize;
  const cx = x + 3.5*s;
  const cy = y + 3.5*s;

  if (shape === 'Rounded') {
    // 3×3 rounded square (r=0.75s)
    return (
      `M${x+2.75*s},${y+2*s} h${1.5*s} a${0.75*s},${0.75*s} 0 0 1 ${0.75*s},${0.75*s} v${1.5*s} a${0.75*s},${0.75*s} 0 0 1 -${0.75*s},${0.75*s} h-${1.5*s} a${0.75*s},${0.75*s} 0 0 1 -${0.75*s},-${0.75*s} v-${1.5*s} a${0.75*s},${0.75*s} 0 0 1 ${0.75*s},-${0.75*s} Z`
    );
  }

  if (shape === 'Dot') {
    // circle (r=1.5s) centered in the 3×3 zone
    return `M${x+2*s},${cy} a${1.5*s},${1.5*s} 0 1 0 ${3*s},0 a${1.5*s},${1.5*s} 0 1 0 -${3*s},0 Z`;
  }

  if (shape === 'Diamond') {
    return `M${cx},${y+2*s} L${x+5*s},${cy} L${cx},${y+5*s} L${x+2*s},${cy} Z`;
  }

  if (shape === 'Star') {
    // 5-point star, outer r=1.3s, inner r=0.55s, centered at (cx, cy)
    return (
      `M${cx},${cy-1.3*s} ` +
      `L${cx+0.323*s},${cy-0.445*s} L${cx+1.236*s},${cy-0.402*s} ` +
      `L${cx+0.523*s},${cy+0.170*s} L${cx+0.764*s},${cy+1.052*s} ` +
      `L${cx},${cy+0.55*s} ` +
      `L${cx-0.764*s},${cy+1.052*s} L${cx-0.523*s},${cy+0.170*s} ` +
      `L${cx-1.236*s},${cy-0.402*s} L${cx-0.323*s},${cy-0.445*s} Z`
    );
  }

  if (shape === 'Cross') {
    // Plus/cross shape inside 3×3 zone: arm width = s, traced as 12-vertex polygon
    return `M${x+3*s},${y+2*s} h${s} v${s} h${s} v${s} h-${s} v${s} h-${s} v-${s} h-${s} v-${s} h${s} Z`;
  }

  // Square: dark 3×3
  return `M${x+2*s},${y+2*s} h${3*s} v${3*s} h-${3*s} Z`;
}

/**
 * Returns the SVG `shape-rendering` value appropriate for a given pattern.
 * Rectilinear patterns (Square, Vertical, Horizontal) use `crispEdges` for sharp
 * pixel-aligned rendering. Curved or diagonal patterns (Rounded, Diamond, Dots,
 * Classy, Fluid) use `geometricPrecision` to avoid jagged edges.
 */
export function getDataShapeRendering(pattern: import('../types/qr').QRPixelPattern): 'crispEdges' | 'geometricPrecision' {
  return (pattern === 'Square' || pattern === 'Vertical' || pattern === 'Horizontal') ? 'crispEdges' : 'geometricPrecision'
}

/**
 * Orthogonal dark-neighbor flags for a single data module. `true` means an adjacent
 * dark data module sits on that side. The connected patterns (Classy, Fluid) use these
 * to round only the corners that face open space, so a run of modules merges into one
 * continuous form while shared edges stay square.
 */
export interface DataNeighbors {
  top: boolean
  right: boolean
  bottom: boolean
  left: boolean
}

const NO_NEIGHBORS: DataNeighbors = { top: false, right: false, bottom: false, left: false }

/**
 * A cell whose corners round only when both of the corner's edges face open space.
 * `eligible` gates which corners may round at all: Fluid permits all four (a soft,
 * blobby mass); Classy permits only the top-left / bottom-right pair (a directional,
 * leaf-like flow). Corners adjacent to a dark neighbor stay square so the shape connects.
 */
function connectedCellPath(
  x: number,
  y: number,
  s: number,
  r: number,
  n: DataNeighbors,
  eligible: { tl: boolean; tr: boolean; br: boolean; bl: boolean },
): string {
  const rTL = eligible.tl && !n.top && !n.left ? r : 0
  const rTR = eligible.tr && !n.top && !n.right ? r : 0
  const rBR = eligible.br && !n.bottom && !n.right ? r : 0
  const rBL = eligible.bl && !n.bottom && !n.left ? r : 0
  return (
    `M${x + rTL},${y} ` +
    `L${x + s - rTR},${y} ` + (rTR ? `a${r},${r} 0 0 1 ${r},${r} ` : '') +
    `L${x + s},${y + s - rBR} ` + (rBR ? `a${r},${r} 0 0 1 -${r},${r} ` : '') +
    `L${x + rBL},${y + s} ` + (rBL ? `a${r},${r} 0 0 1 -${r},-${r} ` : '') +
    `L${x},${y + rTL} ` + (rTL ? `a${r},${r} 0 0 1 ${r},-${r} ` : '') +
    'Z '
  )
}

export function getDataPath(
  pattern: import('../types/qr').QRPixelPattern,
  x: number,
  y: number,
  cellSize: number,
  neighbors: DataNeighbors = NO_NEIGHBORS,
): string {
  const s = cellSize;
  if (pattern === 'Dots') {
    const r = 0.45 * s
    return `M${x + 0.5 * s},${y + (0.5 * s - r)} a${r},${r} 0 1,0 0,${2 * r} a${r},${r} 0 1,0 0,${-2 * r} `
  }
  if (pattern === 'Rounded') {
    const r = 0.35 * s
    const straight = 0.3 * s
    return (
      `M${x+r},${y} h${straight} a${r},${r} 0 0 1 ${r},${r} ` +
      `v${straight} a${r},${r} 0 0 1 -${r},${r} ` +
      `h-${straight} a${r},${r} 0 0 1 -${r},-${r} ` +
      `v-${straight} a${r},${r} 0 0 1 ${r},-${r} Z `
    )
  }
  if (pattern === 'Classy') {
    return connectedCellPath(x, y, s, 0.5 * s, neighbors, { tl: true, tr: false, br: true, bl: false })
  }
  if (pattern === 'Fluid') {
    return connectedCellPath(x, y, s, 0.5 * s, neighbors, { tl: true, tr: true, br: true, bl: true })
  }
  if (pattern === 'Diamond') {
    return `M${x+0.5*s},${y+0.1*s} L${x+0.9*s},${y+0.5*s} L${x+0.5*s},${y+0.9*s} L${x+0.1*s},${y+0.5*s} Z `
  }
  if (pattern === 'Vertical') {
    return `M${x+0.1*s},${y} h${0.8*s} v${s} h-${0.8*s} Z `
  }
  if (pattern === 'Horizontal') {
    return `M${x},${y+0.1*s} h${s} v${0.8*s} h-${s} Z `
  }
  return `M${x},${y} h${s} v${s} h-${s} Z `;
}

export function generateQRPaths(
  value: string,
  ecLevel: 'L'|'M'|'Q'|'H',
  eyeFrameShape: import('../types/qr').QREyeFrameShape,
  eyeCenterShape: import('../types/qr').QREyeCenterShape,
  pattern: import('../types/qr').QRPixelPattern,
  cellSize: number = 10,
) {
  const parsed = parseQRCode(value, ecLevel);
  const size = parsed.size;

  // Set of dark data modules, keyed "x,y", for orthogonal-neighbor lookup. Connected
  // patterns (Classy, Fluid) consult this so adjacent modules merge instead of rounding
  // every cell in isolation. Eye modules are excluded — the white separator keeps data
  // from ever connecting into an eye zone.
  const darkData = new Set<string>();
  parsed.modules.forEach(m => {
    if (m.isDark && m.type === 'data') darkData.add(`${m.x},${m.y}`);
  });
  const has = (x: number, y: number) => darkData.has(`${x},${y}`);

  let dataPath = '';
  parsed.modules.forEach(m => {
    if (m.isDark && m.type === 'data') {
      const neighbors: DataNeighbors = {
        top: has(m.x, m.y - 1),
        right: has(m.x + 1, m.y),
        bottom: has(m.x, m.y + 1),
        left: has(m.x - 1, m.y),
      };
      dataPath += getDataPath(pattern, m.x * cellSize, m.y * cellSize, cellSize, neighbors);
    }
  });

  // Standard 3 eye locations: top-left, top-right, bottom-left.
  // Frame (ring, even-odd) and center (fill) are emitted as separate paths so each can
  // carry an independent shape and color.
  const eyePositions: [number, number][] = [
    [0, 0],
    [(size - 7) * cellSize, 0],
    [0, (size - 7) * cellSize],
  ];
  const eyeFramePath = eyePositions
    .map(([ex, ey]) => getEyeFramePath(eyeFrameShape, ex, ey, cellSize))
    .join(' ');
  const eyeCenterPath = eyePositions
    .map(([ex, ey]) => getEyeCenterPath(eyeCenterShape, ex, ey, cellSize))
    .join(' ');

  // 8×8 background rects (eye zone + 1-module separator) per eye position.
  // Separator modules are always white per QR spec, so covering them is safe.
  // Rendered between data and eye paths to ensure clean visual separation for
  // non-rectangular eye shapes whose transparent corners would otherwise expose
  // adjacent dark timing/format-info modules.
  const c = cellSize;
  const eyeBgPath =
    `M0,0 h${8*c} v${8*c} h-${8*c} Z ` +
    `M${(size-8)*c},0 h${8*c} v${8*c} h-${8*c} Z ` +
    `M0,${(size-8)*c} h${8*c} v${8*c} h-${8*c} Z`;

  return { dataPath, eyeFramePath, eyeCenterPath, eyeBgPath, size };
}
