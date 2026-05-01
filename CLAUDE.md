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

This is a TypeScript ESM (ECMAScript Modules) project for Node.js running a Fastify HTTP server.

**Key ESM rule:** Import paths must use `.js` extensions even in `.ts` source files — the specifier must match the compiled output filename. TypeScript resolves `.js` → `.ts` at compile time.

### Source files (`src/`)

- `index.ts` — Entry point: starts the Fastify server on port 3000.
- `server.ts` — Builds and configures the Fastify app instance, registers route plugins.
- `types.ts` — Type-only exports (branded primitives, `Result<T,E>` discriminated union). Uses `export type` exclusively; nothing survives to runtime output.

### API endpoints

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | `{ username, password }` | Register user, returns JWT (201) or conflict (409) |
| POST | `/api/auth/login` | `{ username, password }` | Login, returns JWT (200) or unauthorized (401) |

### TypeScript config highlights

- `"module": "NodeNext"` + `"moduleResolution": "NodeNext"` — enforces Node.js ESM semantics
- `"verbatimModuleSyntax": true` — requires `import type` / `export type` for type-only imports, making it explicit they are erased at runtime
- `"isolatedModules": true` — each file must be independently compilable
