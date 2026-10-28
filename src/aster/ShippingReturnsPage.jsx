import { SiteLink } from "./Shared.jsx";
import { shippingPolicy } from "../data/aster-pricing.js";

export function ShippingReturnsPage({ navigate }) {
  return (
    <main className="aster-policy-page" id="main-content">
      <p className="aster-eyebrow">HELP</p>
      <h1>Shipping &amp; Returns</h1>
      <p className="aster-policy-intro">
        Check delivery charges, the free-shipping threshold and how to get
        help with a return or damaged item before placing your order.
      </p>
      <div className="aster-policy-sections">
        <section aria-labelledby="aster-policy-shipping">
          <h2 id="aster-policy-shipping">Shipping</h2>
          <h3>How much is shipping?</h3>
          <p>
            International shipping is ${shippingPolicy.standardInternationalShipping} for a merchandise subtotal below
            ${shippingPolicy.freeShippingThreshold}. At ${shippingPolicy.freeShippingThreshold} or more, shipping is free. Rolling-bead ceramic cups and crystal glassware include free shipping at any quantity. If your bag also contains tableware, the standard tableware shipping rule applies to the order.
            The charge updates automatically as your bag changes and is shown before you place an order.
          </p>
          <h3>How is the free-shipping threshold calculated?</h3>
          <p>The threshold uses your merchandise subtotal after discounts, before shipping and taxes.</p>
          <h3>Could there be import charges?</h3>
          <p>
            Import duties, VAT, customs-processing charges or carrier fees may
            apply depending on your destination and the applicable delivery
            terms. Charges not collected at checkout may be requested by the
            carrier or customs before delivery.
          </p>
        </section>
        <section aria-labelledby="aster-policy-returns">
          <h2 id="aster-policy-returns">Returns &amp; exchanges</h2>
          <h3>Can I request a return or cancellation?</h3>
          <p>
            We do not offer discretionary exchanges for used tableware. If
            your local law gives you a right to cancel an online purchase, you
            may use that right within the applicable period. This policy does
            not limit your rights if an item is faulty, damaged, or not as
            described.
          </p>
          <h3>What if my item is incorrect or damaged?</h3>
          <p>
            For cancellation requests or help with an incorrect or damaged
            item, email <a href="mailto:support@example.test">support@example.test</a>.
          </p>
        </section>
      </div>
      <SiteLink to="/shop" navigate={navigate} className="aster-policy-back">
        Back to the collection
      </SiteLink>
    </main>
  );
}
