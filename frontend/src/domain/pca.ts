/** A dense row-major matrix: one row per observation, one column per feature. */
export interface Matrix {
  readonly rows: number;
  readonly cols: number;
  readonly data: Float64Array;
}

const ITERATIONS = 300;

function entry(values: Float64Array, index: number): number {
  return values[index] ?? 0;
}

/** Subtract the mean of every column, in place. */
export function centerColumns(matrix: Matrix): void {
  for (let col = 0; col < matrix.cols; col += 1) {
    let sum = 0;
    for (let row = 0; row < matrix.rows; row += 1) {
      sum += entry(matrix.data, row * matrix.cols + col);
    }
    const mean = sum / matrix.rows;
    for (let row = 0; row < matrix.rows; row += 1) {
      const index = row * matrix.cols + col;
      matrix.data[index] = entry(matrix.data, index) - mean;
    }
  }
}

function scatter(matrix: Matrix): Float64Array {
  const size = matrix.cols;
  const result = new Float64Array(size * size);
  for (let row = 0; row < matrix.rows; row += 1) {
    const offset = row * size;
    for (let i = 0; i < size; i += 1) {
      const left = entry(matrix.data, offset + i);
      for (let j = 0; j < size; j += 1) {
        result[i * size + j] = entry(result, i * size + j) + left * entry(matrix.data, offset + j);
      }
    }
  }
  return result;
}

function multiply(square: Float64Array, vector: Float64Array): Float64Array {
  const size = vector.length;
  const result = new Float64Array(size);
  for (let i = 0; i < size; i += 1) {
    let sum = 0;
    for (let j = 0; j < size; j += 1) {
      sum += entry(square, i * size + j) * entry(vector, j);
    }
    result[i] = sum;
  }
  return result;
}

function dot(a: Float64Array, b: Float64Array): number {
  return a.reduce((sum, value, index) => sum + value * entry(b, index), 0);
}

function normalized(vector: Float64Array): Float64Array {
  const norm = Math.sqrt(dot(vector, vector));
  return norm === 0 ? vector : vector.map((value) => value / norm);
}

/** Orient an axis so that its largest loading is positive, which makes the result stable. */
function oriented(axis: Float64Array): Float64Array {
  const largest = axis.reduce(
    (best, value) => (Math.abs(value) > Math.abs(best) ? value : best),
    0,
  );
  return largest < 0 ? axis.map((value) => -value) : axis;
}

function dominantAxis(square: Float64Array, size: number): Float64Array {
  let axis = normalized(new Float64Array(size).map((_, index) => 1 / (index + 1)));
  for (let step = 0; step < ITERATIONS; step += 1) {
    axis = normalized(multiply(square, axis));
  }
  return oriented(axis);
}

function deflate(square: Float64Array, axis: Float64Array): void {
  const value = dot(axis, multiply(square, axis));
  const size = axis.length;
  for (let i = 0; i < size; i += 1) {
    for (let j = 0; j < size; j += 1) {
      square[i * size + j] = entry(square, i * size + j) - value * entry(axis, i) * entry(axis, j);
    }
  }
}

/**
 * Return the principal axes of a centered matrix, by power iteration with
 * deflation from a fixed start, so the same data always gives the same axes.
 */
export function principalAxes(matrix: Matrix, count: number): readonly Float64Array[] {
  const square = scatter(matrix);
  const axes: Float64Array[] = [];
  for (let index = 0; index < count; index += 1) {
    const axis = dominantAxis(square, matrix.cols);
    axes.push(axis);
    deflate(square, axis);
  }
  return axes;
}

/** Return the coordinate of every row along an axis. */
export function projection(matrix: Matrix, axis: Float64Array): Float64Array {
  const result = new Float64Array(matrix.rows);
  for (let row = 0; row < matrix.rows; row += 1) {
    result[row] = dot(matrix.data.subarray(row * matrix.cols, (row + 1) * matrix.cols), axis);
  }
  return result;
}
