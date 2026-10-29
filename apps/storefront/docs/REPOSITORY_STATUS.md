# Repository status

Updated: 2026-10-28.

## Public snapshot

The public demo retains 240 published responsive-image entries and all 795 derivative variants. Private originals and procurement records are excluded. Production deployment state, customer/order records, credentials and actual operational exports are not included.

## Verification in this export

- `npm run build`: passed; 28 routes statically prerendered. Private Sites hosting configuration is optional.
- `npm run test:sites`: 51 passed, 3 failed, 1 explicitly skipped. Skipped/failed tests are not reported as passes.
- Remaining failures: the cup exposes purchase actions with colour-specific catalogue records and preserves its image and index boundaries; prerendered full page includes every zodiac, useful detail content and no video or preview purchase shell; Shop, search and sitemap match the zodiac range.
- Private environment/original-material checks remain in source and skip explicitly when the corresponding private inputs are absent.

## Limits

Public product presentation is retained as case-study material; private contact, merchant environment and source records are fictionalized or omitted. The preview does not default to a live merchant backend.

No live payment, external mail, production database, search indexing or marketing outcome was verified. Full desktop/mobile visual acceptance has not been repeated after source export; a successful build does not establish visual quality.

## Production metadata follow-up

A second build with `PUBLICATION_MODE=production VITE_PUBLICATION_MODE=production` passed with no merchant origin configured. The targeted `crystal-preview` and `aster-prerender` suites passed 8 of 9 tests: the two preview-versus-production SEO differences disappeared, while the historical cup chapter-anchor assertion at `tests/aster-prerender.test.mjs:74` remained failed. No UI or assertion was removed. This targeted run does not replace the earlier full-suite count.

## 本次验证

详见 [实际验证结果](VALIDATION.md)。
