import type { ScreenQuad } from "./laptop-3d";

/**
 * The projective (homography) fit that pastes the flat desktop overlay onto the
 * 3D laptop's display panel, split out of desktop-portal.tsx so the scroll
 * section there stays readable. Pure maths: no React, no DOM, no module state.
 *
 * Width / height of the laptop's display panel, measured off the display mesh
 * in /public/laptop/scene.gltf with the same plane fit and corner ordering
 * laptop-3d.ts uses at runtime: 34.3769 x 22.2540 model units, top edge long.
 * (A 16" MacBook panel is 3456x2234 = 1.5470, so the model is within 0.15%.)
 *
 * The overlay is authored at viewport size, so on any viewport wider than
 * 1.5447:1 the projective fit would otherwise squeeze it horizontally to
 * reach the panel. The source rect below starts at the panel's own aspect
 * (undistorted on the glass) and widens to the viewport as the flatten runs,
 * so it is exactly viewport-sized, and the transform exactly identity, by
 * the time .desktopLayer takes over.
 */
export const SCREEN_PANEL_ASPECT = 1.544748;

function solveLinearSystem(matrix: number[][], values: number[]) {
  const size = values.length;
  const rows = matrix.map((row, index) => [...row, values[index]]);
  for (let pivot = 0; pivot < size; pivot += 1) {
    let best = pivot;
    for (let row = pivot + 1; row < size; row += 1) {
      if (Math.abs(rows[row]![pivot]!) > Math.abs(rows[best]![pivot]!)) best = row;
    }
    const pivotRow = rows[pivot]!;
    rows[pivot] = rows[best]!;
    rows[best] = pivotRow;
    const normalizedPivotRow = rows[pivot]!;
    const divisor = normalizedPivotRow[pivot]!;
    if (Math.abs(divisor) < 1e-9) return null;
    for (let column = pivot; column <= size; column += 1) normalizedPivotRow[column] = normalizedPivotRow[column]! / divisor;
    for (let row = 0; row < size; row += 1) {
      if (row === pivot) continue;
      const currentRow = rows[row]!;
      const factor = currentRow[pivot]!;
      for (let column = pivot; column <= size; column += 1) {
        currentRow[column] = currentRow[column]! - factor * normalizedPivotRow[column]!;
      }
    }
  }
  return rows.map((row) => row[size]!);
}

export function screenMatrix(
  destination: ScreenQuad,
  sourceWidth: number,
  sourceHeight: number,
) {
  const source: ScreenQuad = [[0, 0], [sourceWidth, 0], [sourceWidth, sourceHeight], [0, sourceHeight]];
  const matrix: number[][] = [];
  const values: number[] = [];
  source.forEach(([x, y], index) => {
    const [u, v] = destination[index]!;
    matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    values.push(u);
    matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    values.push(v);
  });
  const solved = solveLinearSystem(matrix, values);
  if (!solved) return null;
  const [a, b, c, d, e, f, g, h] = solved;
  return `matrix3d(${a},${d},0,${g},${b},${e},0,${h},0,0,1,0,${c},${f},0,1)`;
}
