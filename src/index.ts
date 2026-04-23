// This file serves dual purpose:
//   1. Barrel re-exports — consumers import from this single entry point
//   2. Runnable entry point — demonstrates all ESM import patterns

// --- Barrel re-exports ---

// Re-export everything from math (add, multiply, safeDivide, PI)
export * from './math.js';

// Re-export named export from greeting
export { formatGreeting } from './greeting.js';

// Re-export the default export under a named alias so consumers can do:
//   import { Greeter } from 'ts-esm-example'
export { default as Greeter } from './greeting.js';

// Type re-exports must use `export type` when verbatimModuleSyntax is enabled
export type { User, Result, UserId, Timestamp } from './types.js';

// --- Runnable demo ---

import Greeter, { formatGreeting } from './greeting.js'; // default + named import
import { add, multiply, safeDivide, PI } from './math.js'; // named imports
import type { User, Result } from './types.js'; // type-only import (erased at runtime)

function makeUser(name: string): User {
  return {
    id: 'u_001' as User['id'],
    name,
    createdAt: Date.now() as User['createdAt'],
  };
}

function main(): void {
  console.log('=== TypeScript ESM Example ===\n');

  console.log('-- math.ts (named exports) --');
  console.log(`add(2, 3)      = ${add(2, 3)}`);
  console.log(`multiply(4, 5) = ${multiply(4, 5)}`);
  console.log(`PI             = ${PI}`);

  const divResult: Result<number, string> = safeDivide(10, 0);
  if (!divResult.ok) {
    console.log(`safeDivide(10, 0) error: ${divResult.error}`);
  }

  console.log('\n-- greeting.ts (default export: class) --');
  const greeter = new Greeter('Hi');
  const users: User[] = [makeUser('Alice'), makeUser('Bob')];
  greeter.greetMany(users).forEach((g) => console.log(g));

  console.log('\n-- greeting.ts (named export: function) --');
  console.log(formatGreeting('Carol', 'Good morning'));

  console.log('\n=== Build successful — ESM is working! ===');
}

main();
