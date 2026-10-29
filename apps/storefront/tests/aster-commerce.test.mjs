import test from "node:test";
import assert from "node:assert/strict";
import { archivedSeries } from "../src/data/aster-series.js";
import { cupProducts } from "../src/data/cup.js";
import {
  catalogKeys,
  commerceConfig,
  commerceLinks,
  handoffItems,
  requestCheckout,
  restoreBag,
  serializeBag,
} from "../src/aster/commerce.js";
import {
  amountUntilFreeShipping,
  calculateInternationalShipping,
  calculateBagShipping,
} from "../src/data/aster-pricing.js";

const product = { id: "fangju-yellow-plate-8", price: 9999 };
const bag = [{ product, edit: null, quantity: 2 }];
const config = commerceConfig({ hostname: "localhost", port: "5173" }, true);
test("all 38 pieces and four reviewed full sets have fixed mappings", () => {
  const ids = archivedSeries.flatMap((series) =>
    series.items.map((item) => `${series.id}-${item.id}`),
  );
  assert.equal(ids.length, 38);
  assert.deepEqual(
    new Set(ids),
    new Set(
      Object.keys(catalogKeys).filter((key) => !key.endsWith("-full-set") && !key.startsWith("rolling-bead-cup-") && !key.startsWith("prism-crystal-tumbler-") && !key.startsWith("prism-zodiac-tumbler-") && !key.startsWith("vertex-crystal-glass-")),
    ),
  );
  assert.equal(new Set(Object.values(catalogKeys)).size, 65);
  assert.equal(catalogKeys["fangju-yellow-plate-8"], "fangju-yellow-petal:05");
  assert.equal(
    catalogKeys["fangju-yellow-full-set"],
    "fangju-yellow-petal:full-set",
  );
  assert.throws(() =>
    handoffItems([{ product: { id: "wanxiang-full-set" }, quantity: 1 }]),
  );
  assert.throws(() =>
    handoffItems([{ product: { id: "gathering" }, quantity: 1 }]),
  );
});
test("cup colours survive refresh with trusted prices and exact checkout mappings", async () => {
  for (const product of cupProducts) {
    const restored = restoreBag(serializeBag([{ product: { ...product, price: 1, image: "https://evil.test" }, edit: null, quantity: 2 }]));
    assert.equal(restored.length, 1);
    assert.equal(restored[0].product.price, 75);
    assert.equal(restored[0].product.image, product.image);
    assert.equal(restored[0].product.freeShipping, true);
    assert.deepEqual(handoffItems(restored), [{ catalog_key: product.catalogKey, quantity: 2 }]);
    let payload;
    await requestCheckout(restored, config, async (_, options) => {
      payload = JSON.parse(options.body);
      return { status: 201, json: async () => ({ handoff_url: `${config.origin}/checkout/?aster_handoff=1#handoff=${"a".repeat(64)}` }) };
    });
    assert.deepEqual(payload.items, [{ catalog_key: product.catalogKey, quantity: 2 }]);
  }
});
test("cups ship free while mixed bags retain the tableware shipping threshold", () => {
  const cup = { product: cupProducts[0], quantity: 1 };
  const plate = { product: { price: 39 }, quantity: 1 };
  assert.equal(calculateBagShipping([cup]), 0);
  assert.equal(calculateBagShipping([{ ...cup, quantity: 2 }]), 0);
  assert.equal(calculateBagShipping([plate]), 30);
  assert.equal(calculateBagShipping([cup, plate]), 30);
  assert.equal(calculateBagShipping([{ ...cup, quantity: 2 }, plate]), 0);
  assert.equal(calculateBagShipping([{ product: { price: null }, quantity: 1 }]), null);
});
test("a full set crosses checkout as one line instead of expanded pieces", () => {
  assert.deepEqual(
    handoffItems([
      {
        product: { id: "fangju-yellow-full-set", name: "Full Set" },
        quantity: 2,
      },
    ]),
    [{ catalog_key: "fangju-yellow-petal:full-set", quantity: 2 }],
  );
});
test("only identifiers and quantities cross the boundary, including duplicate aggregation", () => {
  assert.deepEqual(handoffItems(bag), [
    { catalog_key: "fangju-yellow-petal:05", quantity: 2 },
  ]);
  assert.equal(handoffItems([...bag, ...bag])[0].quantity, 4);
  for (const quantity of [0, -1, 21, 1.2, "2"])
    assert.throws(() => handoffItems([{ product, quantity }]));
  assert.throws(() => handoffItems([{ product, quantity: 20 }, ...bag]));
  assert.throws(() => handoffItems([]));
});
test("restore ignores saved prices and arbitrary HTML/URLs; no credentials or customer data saved", () => {
  const raw = serializeBag(bag);
  assert.equal(raw.includes("price"), false);
  const restored = restoreBag(raw);
  assert.equal(restored.length, 1);
  assert.equal(restored[0].product.price, 39);
  assert.equal(restored[0].quantity, 2);
  assert.equal(restoreBag("{bad").length, 0);
  assert.equal(
    restoreBag(
      JSON.stringify({
        version: 1,
        items: [{ productId: "evil", editId: null, quantity: 1 }],
      }),
    ).length,
    0,
  );
  assert.equal(
    restoreBag(JSON.stringify({ version: 1, items: [null] })).length,
    0,
  );
});
test("international shipping is $30 below $150 and free from $150", () => {
  assert.equal(calculateInternationalShipping(0), 30);
  assert.equal(calculateInternationalShipping(149), 30);
  assert.equal(calculateInternationalShipping(150), 0);
  assert.equal(calculateInternationalShipping(229), 0);
  assert.equal(amountUntilFreeShipping(120), 30);
  assert.equal(amountUntilFreeShipping(150), 0);
});
test("complimentary gifts and out-of-stock pieces cannot cross checkout handoff", () => {
  assert.throws(
    () => handoffItems([{ product: { id: "suhuo-ivory-spoon" }, quantity: 1 }]),
    /cannot be purchased separately/,
  );
  assert.throws(
    () =>
      handoffItems([
        {
          product: {
            id: "mood-ocean-blue-plate-8-5",
            availability: "out-of-stock-at-capture",
          },
          quantity: 1,
        },
      ]),
    /out-of-stock/,
  );
});
test("production builds and non-whitelisted development hosts never default to local Woo", () => {
  assert.equal(
    commerceConfig({ hostname: "localhost", port: "5173" }, false),
    null,
  );
  assert.equal(
    commerceConfig({ hostname: "example.com", port: "5173" }, true),
    null,
  );
  assert.equal(
    commerceConfig({ hostname: "localhost", port: "5174" }, true),
    null,
  );
  assert.equal(config.account, "http://127.0.0.1:8088/my-account/");
  const publicLocation = {
    protocol: "https:",
    hostname: "asteredit.com",
    port: "",
  };
  assert.equal(commerceConfig(publicLocation, false), null);
  assert.equal(
    commerceConfig(publicLocation, false, "https://untrusted.example"),
    null,
  );
  assert.equal(
    commerceConfig({ ...publicLocation, protocol: "http:" }, false, "https://commerce.example.test"),
    null,
  );
  assert.equal(
    commerceConfig(publicLocation, false, "https://commerce.example.test")?.account,
    "https://commerce.example.test/my-account/",
  );
});
test("account links stay reachable while public checkout remains explicitly gated", () => {
  const publicLocation = { protocol: "https:", hostname: "asteredit.com", port: "" };
  assert.equal(commerceConfig(publicLocation, false), null);
  assert.equal(commerceLinks(publicLocation, false)?.account, "https://commerce.example.test/my-account/");
  assert.equal(commerceLinks(publicLocation, false)?.orders, "https://commerce.example.test/order-status/");
  assert.equal(commerceLinks({ hostname: "127.0.0.1", port: "5174" }, true)?.account, "http://127.0.0.1:8088/my-account/");
  assert.equal(commerceLinks({ protocol: "https:", hostname: "example.com" }, false), null);
});

test("handoff accepts only the direct or legacy entry with the expected origin and fragment", async () => {
  const url = `${config.origin}/checkout-handoff/#handoff=${"a".repeat(64)}`;
  const received = [];
  assert.equal(
    await requestCheckout(bag, config, async (...args) => {
      received.push(args);
      return { status: 201, json: async () => ({ handoff_url: url }) };
    }),
    url,
  );
  assert.equal(received[0][1].credentials, "omit");
  assert.equal(received[0][1].redirect, "error");
  assert.deepEqual(JSON.parse(received[0][1].body), {
    items: handoffItems(bag),
    entry: "checkout",
  });
  const direct = `${config.origin}/checkout/?aster_handoff=1#handoff=${"a".repeat(64)}`;
  assert.equal(await requestCheckout(bag, config, async () => ({
    status: 201, json: async () => ({ handoff_url: direct }),
  })), direct);
  for (const invalid of [
    "https://evil.test/",
    `${config.origin}/my-account/`,
    `${config.origin}/checkout-handoff/?key=secret#handoff=${"a".repeat(64)}`,
    `http://user:pass@127.0.0.1:8088/checkout-handoff/#handoff=${"a".repeat(64)}`,
    `${config.origin}/checkout/#handoff=${"a".repeat(64)}`,
    `${config.origin}/checkout/?aster_handoff=1&redirect=https://evil.test#handoff=${"a".repeat(64)}`,
    `${config.origin}/checkout/?aster_handoff=0#handoff=${"a".repeat(64)}`,
    `${config.origin}/checkout/order-pay/123/?aster_handoff=1#handoff=${"a".repeat(64)}`,
  ]) {
    await assert.rejects(
      requestCheckout(bag, config, async () => ({
        status: 201,
        json: async () => ({ handoff_url: invalid }),
      })),
    );
  }
  for (const status of [409, 429, 500])
    await assert.rejects(
      requestCheckout(bag, config, async () => ({ status })),
      /kept/,
    );
  assert.equal(bag[0].quantity, 2);
});

test("handoff passes only a bounded acquisition category, never raw campaign data", async () => {
  const url = `${config.origin}/checkout-handoff/#handoff=${"b".repeat(64)}`;
  let body;
  await requestCheckout(bag, config, async (_, options) => {
    body = JSON.parse(options.body);
    return { status: 201, json: async () => ({ handoff_url: url }) };
  }, undefined, "organic_search");
  assert.deepEqual(body, { items: handoffItems(bag), source: "organic_search", entry: "checkout" });
});

test("production handoff stays on the storefront origin while redeeming only at Aster Woo", async () => {
  const production = commerceConfig({protocol:"https:", hostname:"asteredit.com"}, false, "https://commerce.example.test");
  let sent;
  const target = `${production.origin}/checkout/?aster_handoff=1#handoff=${"c".repeat(64)}`;
  assert.equal(await requestCheckout(bag, production, async (url, options) => {
    sent = {url, options}; return {status:201, json:async () => ({handoff_url:target})};
  }), target);
  assert.equal(sent.url, "/aster-commerce/checkout-handoffs");
  assert.equal(sent.options.credentials, "omit");
  assert.equal(sent.options.redirect, "error");
});

test("invalid and interrupted handoff responses never replay a write or discard a bag", async () => {
  for (const failure of [() => {throw new TypeError('network');}, () => ({status:201, json:async () => {throw new SyntaxError('not JSON');}})]) {
    let calls = 0;
    await assert.rejects(requestCheckout(bag, config, async () => {calls++; return failure();}));
    assert.equal(calls, 1);
    assert.equal(bag[0].quantity, 2);
  }
});
