# DS monorepo, architecture snapshot

> Structural snapshot of the workspace and its internal (`@ds/*`) dependency edges.
> Regenerate when packages or cross-package deps change. GitHub renders the Mermaid below.

## Workspace dependency graph

```mermaid
graph TD
  classDef app fill:#1e293b,stroke:#38bdf8,color:#e2e8f0;
  classDef pkg fill:#0b0d14,stroke:#64748b,color:#cbd5e1;
  classDef tool fill:#1c1917,stroke:#f59e0b,color:#fde68a;
  classDef ref fill:#0b0d14,stroke:#334155,color:#64748b,stroke-dasharray:4 3;

  subgraph apps["apps/"]
    site["@ds/site<br/><i>ds-site · Next.js 15</i>"]:::app
    inspo["@ds/inspo-gallery"]:::app
  end

  subgraph packages["packages/"]
    ui["@ds/ui<br/><i>shared components</i>"]:::pkg
    tokens["@ds/tokens<br/><i>design tokens</i>"]:::pkg
    video["@ds/video<br/><i>Remotion</i>"]:::pkg
    motion["@ds/motion-editor"]:::pkg
    eslint["@ds/eslint-config"]:::pkg
    tsconfig["@ds/tsconfig"]:::pkg
    fmx["frontendmaxxing-reference<br/><i>read-only · not a pkg</i>"]:::ref
  end

  subgraph tools["tools/"]
    lead["@ds/lead-finder"]:::tool
  end

  site --> tokens
  site --> ui
  site --> eslint
  site --> tsconfig
```

## Reading it

- **`@ds/site` is the only integrator**, it consumes `@ds/tokens`, `@ds/ui`, and the shared `@ds/eslint-config` / `@ds/tsconfig`. Everything else is currently standalone.
- **`@ds/ui` does not yet depend on `@ds/tokens`**, worth wiring up so shared components pull from the token source rather than re-declaring values.
- **`@ds/inspo-gallery`, `@ds/video`, `@ds/motion-editor`, `@ds/lead-finder`** are independent (no internal deps yet).
- **`frontendmaxxing-reference`** is a read-only inspiration library (no `package.json`), ported *from*, never imported directly (per CLAUDE.md).

## Tree (top 2 levels)

```
DATHSTEL/
├── apps/        ds-site (Next.js 15), inspo-gallery
├── packages/    ui, tokens, video, motion-editor, eslint-config, tsconfig, frontendmaxxing-reference
├── tools/       lead-finder
└── docs/        brand/, ARCHITECTURE.md, DELIVERY-CHECKLIST.md, …
```

*For a deeper, queryable graph (call chains, per-symbol edges), drop a repo ZIP into [gitnexus.vercel.app](https://gitnexus.vercel.app), runs client-side, safe for this private repo.*
