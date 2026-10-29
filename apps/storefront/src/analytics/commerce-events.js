export const commerceEventNames = Object.freeze({
  viewItemList: "view_item_list",
  selectItem: "select_item",
  viewItem: "view_item",
  addToCart: "add_to_cart",
  viewCart: "view_cart",
  beginCheckout: "begin_checkout",
  purchase: "purchase",
  viewUnboxingProof: "view_unboxing_proof",
});

export function toAnalyticsItem(product, quantity = 1) {
  return Object.freeze({
    item_id: product.id,
    item_name: product.title,
    item_category: "Mystery Tableware Box",
    item_variant: `${product.pieceCount} pieces`,
    price: Number.isInteger(product.pricing.priceMinor)
      ? product.pricing.priceMinor / 100
      : undefined,
    quantity,
  });
}

export function buildCommerceEvent(name, products, context = {}) {
  if (!Object.values(commerceEventNames).includes(name)) {
    throw new Error(`Unsupported commerce event: ${name}`);
  }

  return Object.freeze({
    event: name,
    ecommerce: Object.freeze({
      currency: products.find((product) => product.pricing.currency)?.pricing.currency,
      value: products.every((product) => Number.isInteger(product.pricing.priceMinor))
        ? products.reduce((sum, product) => sum + product.pricing.priceMinor, 0) / 100
        : undefined,
      items: Object.freeze(products.map((product) => toAnalyticsItem(product))),
      ...context,
    }),
  });
}

