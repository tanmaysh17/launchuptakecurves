export interface Bound {
  min: number;
  max: number;
}

export interface NelderMeadOptions {
  maxIterations?: number;
  tolerance?: number;
  initialStep?: number;
}

export interface OptimizationResult {
  x: number[];
  fx: number;
  iterations: number;
}

function sigmoid(z: number): number {
  if (z >= 0) {
    const ez = Math.exp(-z);
    return 1 / (1 + ez);
  }
  const ez = Math.exp(z);
  return ez / (1 + ez);
}

function logit(p: number): number {
  return Math.log(p / (1 - p));
}

function clamp01(x: number): number {
  return Math.min(1 - 1e-9, Math.max(1e-9, x));
}

function encodeBounded(x: number, b: Bound): number {
  const r = clamp01((x - b.min) / (b.max - b.min));
  return logit(r);
}

function decodeBounded(u: number, b: Bound): number {
  const s = sigmoid(u);
  return b.min + s * (b.max - b.min);
}

function centroid(points: number[][]): number[] {
  const n = points[0].length;
  const c = new Array<number>(n).fill(0);
  for (const p of points) {
    for (let i = 0; i < n; i += 1) {
      c[i] += p[i];
    }
  }
  for (let i = 0; i < n; i += 1) {
    c[i] /= points.length;
  }
  return c;
}

function add(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i]);
}

function sub(a: number[], b: number[]): number[] {
  return a.map((v, i) => v - b[i]);
}

function scale(a: number[], s: number): number[] {
  return a.map((v) => v * s);
}

interface Vertex {
  u: number[];
  x: number[];
  fx: number;
}

export function boundedNelderMead(
  objective: (x: number[]) => number,
  bounds: Bound[],
  start: number[],
  options: NelderMeadOptions = {}
): OptimizationResult {
  const n = start.length;
  const maxIterations = options.maxIterations ?? 400;
  const tolerance = options.tolerance ?? 1e-7;
  const initialStep = options.initialStep ?? 0.2;

  const alpha = 1;
  const gamma = 2;
  const rho = 0.5;
  const sigma = 0.5;

  const startU = start.map((x, i) => encodeBounded(x, bounds[i]));
  const simplexU: number[][] = [startU];

  for (let i = 0; i < n; i += 1) {
    const v = [...startU];
    v[i] += initialStep;
    simplexU.push(v);
  }

  const evaluate = (u: number[]): Vertex => {
    const x = u.map((value, i) => decodeBounded(value, bounds[i]));
    const fx = objective(x);
    return { u, x, fx };
  };

  let simplex = simplexU.map(evaluate);

  for (let iter = 0; iter < maxIterations; iter += 1) {
    simplex.sort((a, b) => a.fx - b.fx);
    const best = simplex[0];
    const worst = simplex[n];
    const secondWorst = simplex[n - 1];

    const mean = simplex.reduce((acc, v) => acc + v.fx, 0) / simplex.length;
    const variance = simplex.reduce((acc, v) => acc + (v.fx - mean) ** 2, 0) / simplex.length;
    if (Math.sqrt(variance) < tolerance) {
      return { x: best.x, fx: best.fx, iterations: iter };
    }

    const c = centroid(simplex.slice(0, n).map((v) => v.u));
    const reflectedU = add(c, scale(sub(c, worst.u), alpha));
    const reflected = evaluate(reflectedU);

    if (reflected.fx < best.fx) {
      const expandedU = add(c, scale(sub(reflected.u, c), gamma));
      const expanded = evaluate(expandedU);
      simplex[n] = expanded.fx < reflected.fx ? expanded : reflected;
      continue;
    }

    if (reflected.fx < secondWorst.fx) {
      simplex[n] = reflected;
      continue;
    }

    const contractedU =
      reflected.fx < worst.fx
        ? add(c, scale(sub(reflected.u, c), rho))
        : add(c, scale(sub(worst.u, c), rho));
    const contracted = evaluate(contractedU);

    if (contracted.fx < Math.min(worst.fx, reflected.fx)) {
      simplex[n] = contracted;
      continue;
    }

    const bestU = best.u;
    simplex = simplex.map((vertex, index) => {
      if (index === 0) {
        return vertex;
      }
      const shrunkU = add(bestU, scale(sub(vertex.u, bestU), sigma));
      return evaluate(shrunkU);
    });
  }

  simplex.sort((a, b) => a.fx - b.fx);
  return { x: simplex[0].x, fx: simplex[0].fx, iterations: maxIterations };
}
