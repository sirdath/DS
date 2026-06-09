# Image-Generation Prompting Guide

Distilled best practices for prompting **GPT-image / DALL·E (ChatGPT)** and similar models.
Sources: [OpenAI Cookbook — image-gen prompting guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-1.5-prompting_guide),
[OpenAI Cookbook repo](https://github.com/openai/openai-cookbook), and current (2026) practitioner guides
([LTX](https://ltx.io/blog/ai-image-prompt-guide), [Let's Enhance](https://letsenhance.io/blog/article/ai-text-prompt-guide/)).

## How GPT-image "thinks"
It rewards **specific natural language**, not Midjourney keyword-soup or `--flags`. It follows
**spatial and quantity instructions** ("subject on the left third, negative space on the right",
"exactly three"). Camera/photography language steers realism far better than "8K, ultra-detailed, masterpiece".

## Prompt anatomy (order matters — anchor the scene first)
1. **Mode / use** — what the image is *for* ("a website hero background", "a product UI mock"). Sets polish + framing.
2. **Scene / environment** — the setting and overall composition, **before** any subject.
3. **Subject** — what's in it (or *that there is no subject*, for abstract work). Be concrete; state quantity.
4. **Composition** — framing (wide / close / top-down), angle (eye-level / low), **placement + negative space**, aspect ratio.
5. **Lighting** — direction, quality, time of day ("soft volumetric haze", "hard noon sun", "cool rim light"). Lighting does the heavy lifting.
6. **Colour** — name the palette concretely ("deep charcoal and slate, one restrained cool-blue accent"); reference hexes if you have them.
7. **Style / medium** — "cinematic photograph, shallow depth of field, 35mm, fine film grain" etc.
8. **Texture / detail** — only the ones that matter ("film grain", "fabric wear", "wet stone").

## Rules that move quality the most
- **Specificity beats brevity.** Concrete material/composition/lighting detail outperforms generic quality words.
- **Positive constraints, not negatives.** Modern models largely ignore long "no X, no Y" lists; instead *describe what should be true* ("the frame stays dark and uncluttered", "only light and mist"). A short, targeted "no text / no logos" is fine.
- **Control layout explicitly.** "Light pooled in the upper third; the lower-centre falls to near-black" gives intentional space for text overlays.
- **Use camera language for realism.** Lens, aperture feel, film stock, grain — not "render, 3D, CGI" unless you want CGI.
- **Pick the model whose default is closest to your goal, then nudge.** Don't fight it.
- **Iterate one change at a time**, and re-state the invariants each round ("same palette and mood as before, only change …") to stop drift.
- **For text in-image:** put literal words in quotes/ALL CAPS and spell hard brand names; otherwise say *no text*.

## A reusable skeleton
> "[use]. [scene + composition, aspect ratio]. [subject or 'no subject — only …']. [lighting]. [palette]. [style/medium]. [texture]. Keep [the invariant that protects legibility/placement]."

## Common failure → fix
- **Flat, over-saturated, icon-like result** → you under-specified the medium/lighting and over-specified a single colour/object. Fix: lead with "cinematic photograph / atmospheric", name a *dark* palette with the bright colour as a small *accent only*, and say "no central object, no icon, no flat colour fill".
