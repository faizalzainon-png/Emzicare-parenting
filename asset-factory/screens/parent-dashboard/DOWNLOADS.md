# Parent Dashboard — pending local downloads

The three pilot finals + cutouts were generated on 2026-07-16 (model `gpt_image_2`,
4k/high, dual references). The remote session's network policy blocks the Higgsfield
CDN, so pull the files on a normally networked machine — run this from
`asset-factory/screens/parent-dashboard/`:

```bash
BASE="https://d8j0ntlcm91z4.cloudfront.net/user_3FASFJ2KvAn9gbeFLa3MeLLQDbB"

# Master reference (approved dashboard design, media 8d726217…)
curl -o master-reference.png "https://d2ol7oe51mr4n9.cloudfront.net/user_3FASFJ2KvAn9gbeFLa3MeLLQDbB/8d726217-7693-4a58-a5be-f20c6836fccd.png"

# 1. EQ Greeting Companion — final (2880×2880) + transparent cutout
curl -o raw/eq-greeting-companion-attempt-2.png        "$BASE/hf_20260716_124721_61a86b86-67cd-44cc-a6e7-bb3b4b1a3dea.png"
curl -o raw/eq-greeting-companion-attempt-2-cutout.png "$BASE/hf_20260716_125039_d54be498-cf01-47e0-bc77-2c0bff7696bb.png"

# 2. Hero Landscape — final (2480×3312), keeps background
curl -o raw/hero-landscape-attempt-2.png               "$BASE/hf_20260716_124734_4e5858d7-c0a4-4655-9386-232fef01f76f.png"

# 3. Family Quest Floating Island — final (2880×2880) + transparent cutout
curl -o raw/family-quest-island-attempt-2.png          "$BASE/hf_20260716_124749_fc92aa25-3bb9-4319-8a6a-d4b90b0cfeb3.png"
curl -o raw/family-quest-island-attempt-2-cutout.png   "$BASE/hf_20260716_125109_e44a08f8-1df8-43ca-8140-b9a2a1e75af8.png"
```

After Faizal's visual approval, promote the approved files:

```bash
cp raw/eq-greeting-companion-attempt-2-cutout.png assets/eq-greeting-companion.png
cp raw/hero-landscape-attempt-2.png               assets/hero-landscape.png
cp raw/family-quest-island-attempt-2-cutout.png   assets/family-quest-island.png
```

(Or use the factory UI's review buttons after downloading, which does the same.)

Check the cutouts at 100% zoom against both a dark and a light backdrop before
approving — usable alpha is an acceptance criterion.
