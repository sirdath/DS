# Changelog

All notable changes to the DS2 design skill are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-06-27

**Initial release (v1).** This is the first version of the DS2 design skill — it will be updated as the DS2 brand evolves.

### Added
- `SKILL.md` — invokable `/ds2-design` skill that applies DS2 branding to any frontend.
- `DS2-design.md` — portable design-system spec (colour, typography, layout, glass/material, motion, components, graphic devices, logo, voice, do/don't) derived from the DS2 v2 brand system and a proven React 19 + Tailwind 4 implementation.
- Paste-ready Tailwind 4 `@theme` token block (dark default + light alternate).
- `README.md`, `VERSION`, `CHANGELOG.md`.

### Notes
- Default theme is **dark** (Space `#050607` + Ice `#8DCBFF` accent) — DS2's signature.
- Source of truth is `BRAND MATERIAL/v2/` in the DS2 monorepo; update `DS2-design.md` here when the brand changes and bump the version.
