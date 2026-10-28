import { SiteLink } from "./Shared.jsx";
import { StoreImage } from "./StoreImage.jsx";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Handbag,
  Minus,
  Plus,
  Trash,
  X,
} from "@phosphor-icons/react";
import { formatPrice } from "../data/aster.js";
import {
  amountUntilFreeShipping,
  calculateBagShipping,
  shippingPolicy,
} from "../data/aster-pricing.js";
import { commerceConfig, handoffItems, requestCheckout } from "./commerce.js";
import { asterSource } from "../analytics/aster-geo.js";

export function CartDrawer({ items, setItems, onClose, navigate, bagSaved }) {
  const drawerRef = useRef(null);
  const commerce = commerceConfig(window.location);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const activeRequest = useRef(null);
  let eligible = false;
  let checkoutIssue = "";
  try {
    handoffItems(items);
    eligible = Boolean(commerce);
    if (!commerce) checkoutIssue = "Checkout is temporarily unavailable. Your bag has been kept; please try again later.";
  } catch (error) {
    checkoutIssue = error.message;
  }
  useEffect(() => {
    setNotice("");
    activeRequest.current?.abort();
    setBusy(false);
  }, [items]);
  useEffect(() => () => activeRequest.current?.abort(), []);
  const checkAvailability = async () => {
    if (activeRequest.current) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    setBusy(true);
    setNotice("");
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const url = await requestCheckout(
        items,
        commerce,
        fetch,
        controller.signal,
        asterSource(),
      );
      if (!controller.signal.aborted) {
        window.location.assign(url);
      }
    } catch (error) {
      setNotice(
        error.name === "AbortError" || error instanceof TypeError
          ? "Could not reach checkout. Your selection has been kept; please try again."
          : error.message,
      );
    } finally {
      window.clearTimeout(timeout);
      activeRequest.current = null;
      setBusy(false);
    }
  };
  const hasPendingPrices = items.some(
    (item) => !Number.isFinite(item.product.price),
  );
  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      (Number.isFinite(item.product.price)
        ? item.product.price * item.quantity
        : 0),
    0,
  );
  const shipping = hasPendingPrices
    ? null
    : calculateBagShipping(items);
  const complimentaryShippingOnly = items.length > 0 && items.every((item) => item.product.freeShipping === true);
  const total = shipping === null ? null : subtotal + shipping;
  const remainingForFreeShipping = amountUntilFreeShipping(subtotal);
  const hasComplimentaryGift = items.some(
    (item) => item.product.includesComplimentaryGift,
  );
  useEffect(() => {
    const previous = document.activeElement;
    drawerRef.current?.querySelector("button")?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const targets = [
        ...drawerRef.current.querySelectorAll("button:not(:disabled), a[href]"),
      ];
      if (!targets.length) return;
      if (event.shiftKey && document.activeElement === targets[0]) {
        event.preventDefault();
        targets.at(-1).focus();
      } else if (!event.shiftKey && document.activeElement === targets.at(-1)) {
        event.preventDefault();
        targets[0].focus();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, []);
  const adjust = (key, delta) =>
    setItems((current) =>
      current.map((item) =>
        item.key === key
          ? {
              ...item,
              quantity: Math.min(20, Math.max(1, item.quantity + delta)),
            }
          : item,
      ),
    );
  return (
    <>
      <button
        className="aster-scrim"
        type="button"
        onClick={onClose}
        aria-label="Close bag"
      />
      <aside
        ref={drawerRef}
        className="aster-cart"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aster-cart-title"
      >
        <header>
          <div>
            <p className="aster-eyebrow">YOUR SELECTION</p>
            <h2 id="aster-cart-title">Your Bag</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close bag">
            <X size={24} />
          </button>
        </header>
        {items.length ? (
          <>
            <div className="aster-cart-items">
              {items.map((item) => (
                <article
                  key={item.key}
                  className={item.product.id.endsWith("-full-set") ? "is-full-set" : undefined}
                >
                  <StoreImage
                    src={item.product.selectorImage || item.product.image}
                    alt=""
                  />
                  <div>
                    <h3>{item.product.name}</h3>
                    {item.edit && <p>{item.edit.name}</p>}
                    {item.product.retired && <p><SiteLink to={item.product.path} navigate={(to) => { onClose(); navigate(to); }}>Choose a zodiac sign</SiteLink></p>}
                    {item.product.signId && <p>{item.product.pattern} zodiac · One tumbler</p>}
                    <strong>
                      {Number.isFinite(item.product.price)
                        ? formatPrice(item.product.price * item.quantity)
                        : "Price pending"}
                    </strong>
                    {item.product.includesComplimentaryGift && (
                      <p className="aster-cart-gift">
                        Complimentary gift included
                      </p>
                    )}
                    <div className="aster-cart-item-actions">
                      <button
                        type="button"
                        onClick={() => adjust(item.key, -1)}
                        aria-label={`Decrease ${item.product.name} quantity`}
                        disabled={busy || item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => adjust(item.key, 1)}
                        aria-label={`Increase ${item.product.name} quantity`}
                        disabled={busy || item.quantity >= 20}
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        type="button"
                        className="aster-cart-remove"
                        disabled={busy}
                        onClick={() =>
                          setItems((current) =>
                            current.filter((entry) => entry.key !== item.key),
                          )
                        }
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="aster-cart-bottom">
              <p>
                <span>Subtotal</span>
                <strong>
                  {hasPendingPrices ? "Price pending" : formatPrice(subtotal)}
                </strong>
              </p>
              <p>
                <span>International shipping</span>
                <strong>
                  {shipping === null
                    ? "Calculated at checkout"
                    : shipping === 0
                      ? "Free"
                      : formatPrice(shipping)}
                </strong>
              </p>
              <p className="aster-cart-total">
                <span>Total</span>
                <strong>
                  {total === null ? "Price pending" : formatPrice(total)}
                </strong>
              </p>
              <small>
                {complimentaryShippingOnly
                  ? "Free shipping is included with these cups and tumblers."
                  : remainingForFreeShipping > 0
                  ? `Add ${formatPrice(remainingForFreeShipping)} more for free international shipping. Orders below ${formatPrice(shippingPolicy.freeShippingThreshold)} ship for ${formatPrice(shippingPolicy.standardInternationalShipping)}.`
                  : `Free international shipping applied to orders of ${formatPrice(shippingPolicy.freeShippingThreshold)} or more.`}
              </small>
              {hasComplimentaryGift && (
                <small className="aster-cart-gift-summary">
                  Your full set includes a complimentary gift. It will ship in
                  the same parcel and is not sold separately.
                </small>
              )}
              {!bagSaved && (
                <small role="status">
                  Your browser cannot save this bag. Leaving or refreshing may
                  lose your selection.
                </small>
              )}
              {notice && (
                <p className="aster-commerce-notice" role="status">
                  {notice}
                </p>
              )}
              {!eligible && <p className="aster-commerce-notice" role="status">{checkoutIssue}</p>}
              <button
                type="button"
                disabled={!eligible || busy}
                onClick={checkAvailability}
              >
                {busy
                  ? "Checking availability…"
                  : eligible
                    ? "Continue to checkout"
                    : "Checkout unavailable"}
              </button>
              <button
                type="button"
                className="aster-continue"
                onClick={onClose}
              >
                Continue exploring
              </button>
            </div>
          </>
        ) : (
          <div className="aster-cart-empty">
            <Handbag size={42} weight="thin" />
            <h3>Your bag is empty.</h3>
            <p>Find pieces for a more considered table.</p>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/shop");
              }}
            >
              Explore the collection <ArrowRight size={16} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
