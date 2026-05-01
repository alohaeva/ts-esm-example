# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Run with tsx (no build step, for development)
npm run build      # Compile TypeScript to dist/
npm run start      # Run compiled output from dist/
npm run typecheck  # Type-check without emitting files
```

## Architecture

This is an educational TypeScript ESM (ECMAScript Modules) example for Node.js, demonstrating correct ESM patterns and TypeScript configuration.

**Key ESM rule:** Import paths must use `.js` extensions even in `.ts` source files — the specifier must match the compiled output filename. TypeScript resolves `.js` → `.ts` at compile time.

### Source files (`src/`)

- `types.ts` — Type-only exports (branded primitives, `Result<T,E>` discriminated union). Uses `export type` exclusively; nothing survives to runtime output.
- `math.ts` — Named exports demonstrating the most common ESM pattern.
- `greeting.ts` — Default export (class) alongside a named export (function) in the same file.
- `index.ts` — Dual-purpose: barrel re-exports for library consumers + runnable demo entry point. Shows all import patterns: named, default, type-only, and re-exports.

### TypeScript config highlights

- `"module": "NodeNext"` + `"moduleResolution": "NodeNext"` — enforces Node.js ESM semantics
- `"verbatimModuleSyntax": true` — requires `import type` / `export type` for type-only imports, making it explicit they are erased at runtime
- `"isolatedModules": true` — each file must be independently compilable