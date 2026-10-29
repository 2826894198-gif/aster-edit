.DEFAULT_GOAL := help
.PHONY: help storefront-install storefront-dev storefront-build storefront-test storefront-seo-check commerce-bootstrap commerce-verify commerce-stop

help:
	@printf '%s\n' 'storefront-install / storefront-dev / storefront-build / storefront-test / storefront-seo-check' 'commerce-bootstrap / commerce-verify / commerce-stop' 'Commands keep frontend and commerce configuration separate. See docs/SETUP.md.'

storefront-install:
	npm --prefix apps/storefront ci

storefront-dev:
	npm --prefix apps/storefront run dev

storefront-build:
	npm --prefix apps/storefront run build

storefront-test:
	npm --prefix apps/storefront run test:sites

storefront-seo-check:
	cd apps/storefront && PUBLICATION_MODE=production VITE_PUBLICATION_MODE=production VITE_ASTER_COMMERCE_ORIGIN= npm run build
	cd apps/storefront && node --test tests/crystal-preview.test.mjs tests/aster-prerender.test.mjs

commerce-bootstrap:
	cd services/commerce && sh scripts/bootstrap-local.sh

commerce-verify:
	cd services/commerce && sh scripts/verify-local.sh

commerce-stop:
	cd services/commerce && docker compose stop
