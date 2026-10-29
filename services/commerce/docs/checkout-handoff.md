# Checkout handoff V1 — local implementation

2026-09-23: a remote bridge opt-in was added for the planned `https://commerce.example.test` service. It requires matching WordPress/Commerce `staging` or `production` environment types, HTTPS home URL at that exact host, and an explicit `ASTER_CHECKOUT_HANDOFF_ENABLED` constant. With any condition missing, non-local origins and exchange remain disabled. The current public storefront build does not set `VITE_ASTER_COMMERCE_ORIGIN`, and the backend has not been deployed on the public domain; no public checkout has been connected.

Update 2026-09-22: storefront local wiring is now implemented under separate user approval (account/order links, durable identifier-only selection, immutable 38-piece mapping, availability request and validated redirect). The original no-frontend-change statement below describes the backend-only phase. Production and PayPal remain disabled/unverified.

2026-09-22. This is an independently tested backend adapter, not a storefront release or PayPal certification. No frontend files were changed. Non-local issuance/exchange is deliberately disabled until deployment review; changing an Origin alone does not enable production.

## Frontend contract

```js
const response = await fetch('http://127.0.0.1:8088/wp-json/aster/v1/checkout-handoffs', {
  method: 'POST',
  credentials: 'omit',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ items: [{ catalog_key: 'fangju-yellow-petal:05', quantity: 1 }] }),
});
// 409 today: all real products and full sets intentionally remain unapproved drafts.
// On 201, top-level navigate to the returned handoff_url.
```

Only `{items:[{catalog_key,quantity}]}` is accepted. Quantities must be integers 1–20, at most 20 unique references and 100 customer-facing lines total. Duplicate keys and extra fields (including browser prices, user/order IDs and redirects) are rejected. Product ID mapping uses deterministic SKU plus matching catalog metadata. A reviewed full set uses one `:full-set` key and one Woo cart line; the backend validates every mapped component and adds the component manifest to order-line fulfillment metadata without exposing separate component cart lines. Published, approved, priced and `instock` states are checked on issue, review and confirm, along with disabled backorders. Woo rechecks at cart/checkout; binary availability is not an inventory reservation.

For sets, the local guard checks the set and every included component for binary `instock` status at issue, review, confirm and native cart validation. Woo numeric stock management is disabled for these launch products, so customer order quantities do not decrement or reserve warehouse stock. A supply change must update the affected item status; a set containing an out-of-stock piece then becomes unavailable.

Local fixture key `test-only:ceramic` resolves only to `ASTER-TEST-ONLY-001`, only in local mode. It is not a launch SKU or commercial price. A local preview entry exists at `/checkout-handoff/?demo=1`; it is absent from the ordinary customer route and cannot enable real payments.

Response: HTTP 201 `{handoff_url, expires_in:300}`. Issue allows exactly the commerce origin and `http://localhost:5173`, `http://127.0.0.1:5173`. CORS returns only a matching Origin, never credential permission. HTTP 400 malformed input; 403 origin/disabled; 409 unavailable; 429 throttled. No Woo session is handed to the cross-origin caller.

## Native session transfer

1. Browser navigates to `/checkout-handoff/#handoff=<256-bit random>`. The page removes the fragment immediately; no localStorage or URL query persistence.
2. Same-origin JSON POST `/?wc-ajax=aster_handoff_review` with `{token}`. Native Woo AJAX is intentional: a REST call without a WordPress login nonce can lose the logged-in identity. A signed native Woo cookie is created if necessary. The first successful review binds the token to that session.
3. Response shows backend prices (decimal strings + currency), quantities and any existing bag; excludes customer/order/address data. It issues a random proof bound to session, product snapshot, currency and existing cart/coupons. Prices shown here are item prices before shipping and tax, not a promised final total.
4. For an empty bag, explicit Continue sends `{token,proof}` to `/?wc-ajax=aster_handoff_confirm`. Revalidation must pass. Atomic token consumption has one winner. Woo `add_to_cart` / validation / totals / native session persistence are used. Return destination is only the configured Woo checkout URL.
5. For a non-empty bag, V1 stops and offers Review existing bag. It never silently clears, replaces or merges. The shopper can finish/edit the old bag and request a fresh selection from the storefront. Automatic merge, coupon transfer from the storefront and returning edits into its separate local bag are not implemented.

No account verification/email round trip is part of handoff. Existing login is preserved. Creating an account remains email + password → immediate native login. Historical guest-order ownership checks are unchanged.

## Security and failure behavior

- Handoff rows store keyed token/proof/session hashes and selection only, expire after five minutes, and are cleaned by the existing hourly cleanup event. Raw tokens are never stored in the database.
- Review/confirm require same-origin JSON POST, limited size, IP throttling and no-store. The page has no-referrer and self-only CSP with frame-ancestors none. Link possession grants only selection transfer, not login, order access or payment authority.
- Native signed-cookie/user and validated Store API Cart-Token/query-session identities are locked before Woo loads session state. Locks have bounded waits and are released after native shutdown saving. This serializes the tested cookie-based transfers and native cart access; new third-party plugins, custom session handlers or external writers need fresh compatibility review.
- Review does not mutate cart contents. A price or cart change invalidates confirmation. Session changes require a new selection link. A token is consumed before writes; failed/uncertain responses are not automatically retried. The customer is sent to review the actual bag, not told that payment succeeded.
- A failed batch removes newly inserted lines from the previously empty cart; simulated second-line rejection and post-insert hook exception are tested. No distributed transaction across arbitrary plugin side effects is claimed.
- No order creation, capture, refund, gateway request or stock reservation occurs. Official Woo/PayPal owns all later payment work.
- Production remains gated on HTTPS, reviewed Origin/proxy rate-limit configuration, durable database/cache behavior, native login/cart migration concurrency, operational monitoring and payment acceptance. Local DB locks are not proof of production multi-instance behavior.

## Evidence

`node --test tests/handoff.test.mjs`: exact-origin preflight and no credential CORS; strict input/commercial gates; real Woo cart/session; proof bound to device; eight concurrent confirmations exactly one success; different selections cannot race to overwrite; existing bag unchanged; price changes invalidate review; expiry; signed-in immediate-registration handoff reaches native checkout without email/REST auth detour. Order count and fixture stock do not change.

`docker compose run --rm cli eval-file /workspace/tests/handoff-rollback.php`: isolated CLI guest cart, second add rejected and post-insert extension exception both leave an empty persisted cart and no undo-able partial lines.

Tests use only fictional local products/customers. They reset only the two local bridge-IP handoff throttle counters, temporarily change/restore the fictional fixture price, retain synthetic accounts and carts, and perform no payment. No merchant credentials are present.

Full `sh scripts/verify-local.sh` passed after implementation: 22 environment checks, 29 commerce checks, 20 Node test groups and the two rollback scenarios. PHP/JS syntax and diff whitespace checks passed. Chrome verified the existing-bag conflict flow on desktop, 390px and 320px; mobile document scrollWidth matched the viewport, action widths were 350px / 280px, and no page console errors were recorded. The existing browser fixture bag stayed unchanged. Empty-bag and logged-in success paths were verified through HTTP to the real Woo cart/checkout, not by submitting browser payment controls.

## 2026-10-09 local update: one merchant checkout

The user clarified that provider-owned PayPal authorization windows are acceptable; the duplicate merchant checkout/repeated delivery form is the problem. A new direct-entry flag defaults on only in `local`. Remote environments require `ASTER_SINGLE_CHECKOUT_ENABLED === true` in addition to all existing handoff opt-in checks; production remains unchanged by these local source edits.

When enabled, issuance returns `/checkout/?aster_handoff=1#handoff=<token>`. A lightweight preparation response on that same checkout path runs before Woo's empty-cart redirect. It immediately removes the fragment and uses the existing native session-bound review/proof/confirm protocol. Empty carts transfer automatically and identical carts proceed without adding lines. The preparation state is replaced with `/checkout/`, which renders the sole native Woo form; there is no extra Continue action and no delivery/payment input on the preparation response. This includes one same-path initialization reload and does not promise zero HTTP requests/transitions. Existing `/checkout-handoff/` links work through the same automatic flow when opted in.

Different carts stop with an explicit review-existing-bag choice and exact quantities/prices. They are never silently merged, cleared or replaced. Timeout/lost cart-write responses expose recovery and are not automatically replayed; page restore cannot reuse a submitted token. Session locks, current price/availability snapshots, proof binding, expiry, atomic consumption and failed-batch rollback stay in place. Order-pay and order-received endpoints remain native and outside the preparation handler.

Current local verification: frontend checkout-contract tests 10/10, native Woo handoff HTTP groups 5/5, client flow groups 6/6, presentation groups 5/5, both rollback scenarios, PHP/JS syntax and isolated storefront build passed. Browser testing reached `/checkout/` automatically from a fresh one-piece fixture, reached it again from an identical cart without duplication, and kept a conflicting two-piece cart intact. One actual `form.wc-block-checkout__form` and no additional Continue action were present. Historical desktop/mobile captures were recorded during that original check but are not included in the public snapshot; the frontend now lives in `apps/storefront/`. No real merchandise was made available for local payments.

Order count stayed 5 and the fictional fixture stock stayed 10 before/after these checks. The local service has no connected test merchant: the official plugin reports an unavailable client-token/eligibility check. Provider popup, cancel/return, hosted fields, webhook and capture are therefore not verified by this update. The approved payment-layout preview remains a separate disconnected UI fixture and still needs official native-control integration. No production settings/files or release were changed.

Rollback: turn the remote opt-in off to restore the previous review route; deploy the preserved source snapshot for a full client/server rollback. Frontend recognizes both the exact direct-entry URL and the legacy route during rollout. No schema migration or payment-state rewrite is involved.

## 2026-10-09 reviewed entry publication

The user approved the actual local native-entry comparison. Scoped production entry is now enabled by the guarded `aster-single-checkout.php` MU opt-in, with storefront release `preview-20261009-151950`. The deployed three-file candidate is based on the actual live implementation and preserves its schema 2/source column and GEO hooks, which are newer than this local runtime's schema 1. No schema migration, gateway configuration change, order write or capture operation was part of publication.

New clients advertise constant `entry: "checkout"`; cached clients that omit it still receive `/checkout-handoff/`, which automatically opens the native checkout under the enabled flag. Already-open legacy HTML can finish safely with the backwards-compatible `/checkout/` destination fallback. Actual live browser entry reached one checkout form at `/checkout/`, with the existing Sunfold Full Set selection, $229 total and free shipping intact. A separate ephemeral HTTP session verified proof/replay guards and identical/conflicting-cart preservation without reading or changing shopper cookies. Configuration fingerprints and order counts were unchanged before/after QA.

The original three live files and hashes are backed up under `<PRIVATE_DEPLOYMENT_PATH>`. The coordinated storefront backup contains `rollback_remote.py`, which disables the opt-in, restores the previous storefront release and restores the three original files; it never restores a database. The original storefront publication record and private captures are not included in this public snapshot; shared runtime/setup boundaries are documented at the monorepo root. The approved payment-selector mock and provider popup/cancel/capture remain unverified and were not published by this entry release.
