# DS2 design skill

**Version 1.0.0 — v1, first release.** This skill will be updated as the DS2 brand evolves; see [CHANGELOG.md](CHANGELOG.md).

DS2's brand design system as an invokable Claude Code skill.

## Files
- **[SKILL.md](SKILL.md)** — the skill manifest. Makes `/ds2-design` (and `/DS2-design`) available and tells Claude how to apply the branding.
- **[DS2-design.md](DS2-design.md)** — the portable design-system spec (like the `awesome-design-md` / getdesign.md files). Single source of truth: colour, type, motion, glass, components, copy voice. Built from the DS2 v2 brand system + the Event Mapping Platform's React 19 / Tailwind 4 implementation.

## Use here
In any session inside this repo, run:
```
/ds2-design
```
or say "apply DS2 branding to this UI". Claude reads `DS2-design.md` and styles the target in the DS2 language (dark + Ice-blue by default).

## Use in another project
Two options:
1. **Skill (recommended):** copy this `ds2-design/` folder into that project's `.claude/skills/` — `/ds2-design` then works there too.
2. **Reference only:** copy `DS2-design.md` into the project and tell Claude "follow DS2-design.md". The spec is self-contained, including a paste-ready Tailwind 4 `@theme` token block.

## Source of truth
Derived from `BRAND MATERIAL/v2/` (active DS2 brand). If the brand evolves, update `DS2-design.md` to match — it's the file every project consumes.
