import type { QREyeCenterShape, QREyeFrameShape, QRPixelPattern } from '@qrcraft/core';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Small preview glyphs for the Design sheet's shape pickers, ported from
// the stroke/fill icons in docs/specs/qrcraft-mobile-design/IosDesignSheet
// & IosDesignAdvanced.dc.html — a simplified 2x2 tile grid per pixel
// pattern, a ring+center per eye frame shape.

export function PixelPatternIcon({ pattern, color, size = 27 }: { pattern: QRPixelPattern; color: string; size?: number }) {
  const cells: [number, number][] = [[0, 0], [14, 0], [7, 7], [21, 7], [0, 14], [14, 14], [7, 21], [21, 21]];

  if (pattern === 'Dots' || pattern === 'Fluid') {
    return (
      <Svg width={size} height={size} viewBox="0 0 27 27">
        {cells.map(([x, y]) => (
          <Circle key={`${x}-${y}`} cx={x + 3} cy={y + 3} r={3} fill={color} />
        ))}
      </Svg>
    );
  }

  if (pattern === 'Diamond') {
    return (
      <Svg width={size} height={size} viewBox="0 0 27 27">
        {cells.map(([x, y]) => (
          <Path key={`${x}-${y}`} d={`M${x + 3} ${y}l3 3-3 3-3-3z`} fill={color} />
        ))}
      </Svg>
    );
  }

  const rounded = pattern === 'Rounded' || pattern === 'Classy';
  return (
    <Svg width={size} height={size} viewBox="0 0 27 27">
      {cells.map(([x, y]) => (
        <Rect key={`${x}-${y}`} x={x} y={y} width={6} height={6} rx={rounded ? 2 : 0} fill={color} />
      ))}
    </Svg>
  );
}

export function EyeFrameIcon({ shape, color, size = 28 }: { shape: QREyeFrameShape; color: string; size?: number }) {
  if (shape === 'Circle' || shape === 'Hexagon') {
    return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        <Circle cx={14} cy={14} r={10} fill="none" stroke={color} strokeWidth={4} />
        <Circle cx={14} cy={14} r={3} fill={color} />
      </Svg>
    );
  }
  if (shape === 'Leaf' || shape === 'RoundSquare') {
    return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        <Path d="M4 14a10 10 0 0 1 10-10h10v10a10 10 0 0 1-10 10H4z" fill="none" stroke={color} strokeWidth={4} />
        <Circle cx={14} cy={14} r={3} fill={color} />
      </Svg>
    );
  }
  const rounded = shape === 'Rounded' || shape === 'SquareRound';
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Rect x={4} y={4} width={20} height={20} rx={rounded ? 6 : 0} fill="none" stroke={color} strokeWidth={4} />
      <Rect x={11} y={11} width={6} height={6} rx={rounded ? 2 : 0} fill={color} />
    </Svg>
  );
}

export function EyeCenterIcon({ shape, color, size = 28 }: { shape: QREyeCenterShape; color: string; size?: number }) {
  switch (shape) {
    case 'Dot':
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          <Circle cx={14} cy={14} r={5} fill={color} />
        </Svg>
      );
    case 'Diamond':
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          <Path d="M14 8l6 6-6 6-6-6z" fill={color} />
        </Svg>
      );
    case 'Star':
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          <Path d="M14 7l2 4.6 5 .5-3.8 3.4 1.1 5-4.3-2.6-4.3 2.6 1.1-5L8 12.1l5-.5z" fill={color} />
        </Svg>
      );
    case 'Cross':
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          <Rect x={11} y={5} width={6} height={18} fill={color} />
          <Rect x={5} y={11} width={18} height={6} fill={color} />
        </Svg>
      );
    case 'Rounded':
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          <Rect x={9} y={9} width={10} height={10} rx={3} fill={color} />
        </Svg>
      );
    case 'Square':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 28 28">
          <Rect x={9} y={9} width={10} height={10} fill={color} />
        </Svg>
      );
  }
}
