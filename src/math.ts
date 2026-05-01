// Named exports — the most common ESM pattern.
// Import selectively: import { add, PI } from './math.js'
//
// NOTE: The import path uses the '.js' extension even though this file is '.ts'.
// This is the Node.js ESM rule: the specifier in your source must match the
// filename in the *output* — TypeScript resolves .js -> .ts at compile time.

import type { Result } from './types.js';

export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

// Returns a Result instead of throwing — lets callers handle errors explicitly.
export function safeDivide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return { ok: false, error: 'Division by zero' };
  }
  return { ok: true, value: a / b };
}

export const PI = 3.14159265358979;
