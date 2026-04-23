// Type exports — these exist only at compile time, zero runtime cost.
// With verbatimModuleSyntax enabled, TypeScript enforces `export type` for
// type-only exports, making it explicit that nothing here survives to .js output.

// Branded primitive types strengthen the structural type system.
// A plain `string` cannot be passed where `UserId` is expected without an explicit cast.
export type UserId = string & { readonly __brand: 'UserId' };
export type Timestamp = number & { readonly __brand: 'Timestamp' };

export interface User {
  id: UserId;
  name: string;
  createdAt: Timestamp;
}

// A discriminated union — the canonical TypeScript alternative to throwing exceptions.
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };
