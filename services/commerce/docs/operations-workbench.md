# Aster order desk — local V1

Implemented locally on 2026-09-22. Entry: `/wp-admin/admin.php?page=aster-orders`. This is a restricted operations workbench, not a second order engine. HPOS/Woo CRUD remains the record source. Native Woo payment state, totals, customer snapshots and official PayPal behavior are untouched.

## Role boundaries

| Role | Order summary/items | Internal notes | Shipping address/draft | Payment review |
| --- | --- | --- | --- | --- |
| `aster_support` | Read | Read/add | No | No |
| `aster_fulfillment` | Read | No | Read/save draft | No |
| `aster_finance` | Read | No | No | Read only |
| Existing administrator (`manage_options`) | All local workbench functions | Yes | Yes | Yes |
| Customer / guest | No staff access | No | No | No |

The three staff roles have only WordPress `read` and their explicit Aster capabilities; no `manage_woocommerce`, Woo order/customer/product editing, user editing, plugin installation, capture or refund rights. No real user was assigned a new role. Test users are separately labelled TEST ONLY and use `.test` addresses. Existing externally managed role definitions are not overwritten; role conflicts require review. This foundation is disabled outside local; production role grants require named staff and security review.

Support intentionally does not yet include a contact-email/address viewer or reply sender. Finance currently sees Woo's payment fields, not independently reconciled PayPal evidence. Neither screen should be presented as a complete customer-service or finance system.

## Workflows

- List up to 20 orders per page, filter native status, or open an exact order ID.
- Clearly separate native order status from dispatch readiness. Flags identify unpaid/unconfirmed Woo status, missing payment fields, refunds and closed orders. These are internal review hints, not provider conclusions.
- Support adds private notes. They are not Woo customer notes, do not email the customer, and do not appear in native customer order details or the guest order-access response.
- Fulfillment saves a carrier label and tracking reference as **internal draft only**. Closed/failed/refunded orders reject preparation. Pending orders can have a draft but cannot dispatch.
- There is deliberately **no dispatch, order-status, payment, refund or outbound notification writer**. `dispatch_allowed` is always false until independently verified payment reconciliation and fulfillment acceptance are implemented. Even a manually set Woo paid status + transaction reference cannot unlock it. Draft carrier labels are not confirmed commercial shipping methods.

## Data and concurrency

`_aster_operations_v1` stores a revision, private notes, a single current shipment draft and a bounded activity history on the Woo order via metadata CRUD. This V1 does not implement split parcels, label purchasing, automatic carrier tracking, customer delivery notifications or returns/refunds. Every operation records actor ID, action, UTC time and idempotency key/digest. Public staff audit responses omit request keys and content digests; address/tracking/note contents are never copied into audit text or application logs.

REST API: `/wp-json/aster/v1/ops/orders`, `/orders/{id}`, POST `/orders/{id}/note`, POST `/orders/{id}/shipment-draft`. Cookie auth requires the native `X-WP-Nonce`. Writes also require same-origin JSON, small payload, explicit capability, unique `request_id` and expected `revision`. A per-order database lock surrounds read/check/write. Reusing the same actor/key/payload returns the previous success without duplicating; stale revisions or conflicting reuse return 409. Up to 200 activity entries/order; at the cap, fail closed for administrator review instead of silently discarding history. No delete endpoint exists.

This is not a tamper-proof independent audit store: administrators/database operators can edit the database. Persistence failure, backups, retention, employee offboarding/MFA, proxy access controls and a durable external audit/alert sink remain production work. No note retention or personal-data legal policy has been invented.

## Tests and review

- `tests/operations-fixture.php`: 36 local permission checks, denied broad native capabilities, scoped fields, guest/customer denial, paid-looking in-memory object cannot enable dispatch. Creates/reuses four fictional local role users and one pending synthetic order, never persists a paid status.
- `tests/operations.test.mjs`: real authenticated REST cookies/nonces, narrow-role admin HTML, rejection through Woo's broad order API, private field separation, same-origin/nonce protection, idempotent parallel note saves, revision conflicts, concurrent different-role edits, draft-only shipping, actual customer order HTML privacy, no customer mail from internal writes.
- Chrome sign-in and actual workbench inspection completed after the user-requested local administrator rename to `asteredit`. Desktop, 390px and 320px were checked; 320px document width equals viewport width, with a 298px detail panel. Fixed mobile filter grouping, detail focus/scroll and bounded newest-first note/activity history. No console errors were observed. Narrow staff-role permissions are HTTP-tested; separate interactive browser login for each staff role remains future acceptance. The customer-facing storefront was not modified.

The CLI auth fixture prints short-lived cookies only into its test runner's private child-process pipe; do not run its `auth` mode into chat, logs or screenshots. No real account password was read or changed.
