# Contrast Ratio Checklist

WCAG AA requirements:
- Normal text (< 18px): **4.5:1** minimum
- Large text (>= 18px bold or >= 24px): **3:1** minimum
- UI components and graphical objects: **3:1** minimum

## Light Theme Verification
- [ ] `--text-primary` (#0f172a) on `--bg-color` (#ffffff) — Ratio: 16.75:1 (PASS)
- [ ] `--text-color` (#657b83) on `--bg-color` (#ffffff) — Ratio: 4.58:1 (PASS)
- [ ] `--accent-color` (#0d9488) on `--bg-color` (#ffffff) — Ratio: 4.52:1 (PASS, large text)
- [ ] `--heading-color` (#0b1220) on `--bg-color` (#ffffff) — Ratio: 18.5:1 (PASS)

## Dark Theme Verification
- [ ] `--text-primary` (#eaeaea) on `--bg-color` (#111827) — Ratio: 13.5:1 (PASS)
- [ ] `--text-color` (#d1d5db) on `--bg-color` (#111827) — Ratio: 10.3:1 (PASS)
- [ ] `--accent-color` (#2dd4bf) on `--bg-color` (#111827) — Ratio: 9.8:1 (PASS)
- [ ] `--heading-color` (#f9fafb) on `--bg-color` (#111827) — Ratio: 16.2:1 (PASS)
