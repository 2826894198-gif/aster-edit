import { useEffect, useRef, useState } from "react";
import {
  AppleLogo, ArrowLeft, ArrowRight, Check, CreditCard, GoogleLogo,
  Handbag, List, LockKey, MagnifyingGlass, PaypalLogo, User, X,
} from "@phosphor-icons/react";

// A reviewed selection, not a cart or payment API. No customer data is persisted.
const selection = Object.freeze({
  catalogKey: "fangju-yellow-petal:05", name: "Sunfold · 8-inch Petal Plate",
  image: "/images/aster/clean-drafts/fangju-yellow-petal/plate-8.png",
  quantity: 1, subtotal: 39, shipping: 30, total: 69, currency: "USD",
});
const money = amount => new Intl.NumberFormat("en-US", { style: "currency", currency: selection.currency }).format(amount);
const methods = {
  card: { label: "Debit & credit card", detail: "Enter your card details", icon: CreditCard, heading: "Pay by card", action: "Place order" },
  paypal: { label: "PayPal", detail: "Pay with your PayPal account", icon: PaypalLogo, heading: "Pay with PayPal", action: "Pay with PayPal" },
  google: { label: "Google Pay", detail: "Use your saved payment details", icon: GoogleLogo, heading: "Pay with Google Pay", action: "Pay with Google Pay" },
  apple: { label: "Apple Pay", detail: "Use your saved payment details", icon: AppleLogo, heading: "Pay with Apple Pay", action: "Pay with Apple Pay" },
};
const initialDetails = { email: "", first: "", last: "", country: "United States", address: "", apartment: "", city: "", state: "", postal: "", phone: "", note: "", billingAddress: "", billingCity: "", billingPostal: "" };
const required = ["email", "first", "last", "address", "city", "state", "postal"];
const names = { email: "Email address", first: "First name", last: "Last name", address: "Address", city: "City", state: "State / province", postal: "ZIP / postal code", billingAddress: "Billing address", billingCity: "Billing city", billingPostal: "Billing ZIP / postal code" };

function ReviewDialog({ title, children, onClose }) {
  const close = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    close.current?.focus();
    const key = event => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") { event.preventDefault(); close.current?.focus(); }
    };
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = overflow; previous?.focus(); };
  }, [onClose]);
  return <div className="review-dialog-backdrop" onClick={onClose}>
    <section className="review-dialog" role="dialog" aria-modal="true" aria-labelledby="review-dialog-title" onClick={event => event.stopPropagation()}>
      <h2 id="review-dialog-title">{title}</h2>{children}
      <button ref={close} className="review-primary" type="button" onClick={onClose}>Back to checkout <ArrowRight size={18} /></button>
    </section>
  </div>;
}

function Header({ onBag }) {
  const [open, setOpen] = useState(false);
  return <header className="review-header">
    <div className="review-header-inner">
      <a className="review-wordmark" href="/" aria-label="Aster Edit home">ASTER EDIT</a>
      <nav className="review-nav" aria-label="Primary navigation"><a href="/">Home</a><a href="/shop">Shop</a><a href="/collections">Collections</a><a href="/about">About</a><a href="https://commerce.example.test/order-status/">Track an order</a></nav>
      <div className="review-tools"><a href="/search" aria-label="Search"><MagnifyingGlass size={21} /></a><a href="https://commerce.example.test/my-account/" aria-label="Your account"><User size={21} /></a><button type="button" aria-label="Review your bag, 1 item" onClick={onBag}><Handbag size={21} /><span>1</span></button><button className="review-menu-trigger" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <List size={22} />}</button></div>
    </div>
    {open && <nav className="review-mobile-nav" aria-label="Mobile navigation"><a href="/">Home</a><a href="/shop">Shop</a><a href="/collections">Collections</a><a href="/about">About</a><a href="https://commerce.example.test/order-status/">Track an order</a></nav>}
  </header>;
}

function OrderSummary() {
  return <section className="review-order" aria-labelledby="order-title">
    <div className="review-section-heading"><h2 id="order-title">Your order</h2><span>1 item</span></div>
    <div className="review-order-item"><div className="review-product-image"><img src={selection.image} alt={selection.name} /><span>{selection.quantity}</span></div><div><h3>{selection.name}</h3><p>Quantity {selection.quantity}</p></div><strong>{money(selection.subtotal)}</strong></div>
    <dl className="review-totals"><div><dt>Subtotal</dt><dd>{money(selection.subtotal)}</dd></div><div><dt>International shipping</dt><dd>{money(selection.shipping)}</dd></div><div className="review-total"><dt>Total <small>USD</small></dt><dd>{money(selection.total)}</dd></div></dl>
    <p className="review-shipping-note">Import duties and charges may be payable on delivery.</p>
  </section>;
}

function Field({ id, label, details, update, errors, optional = false, type = "text" }) {
  return <label className="review-field" htmlFor={`review-${id}`}><span id={`label-${id}`}>{label}{optional && <small>Optional</small>}</span><input id={`review-${id}`} name={id} type={type} value={details[id]} onChange={event => update(id, event.target.value)} autoComplete="off" aria-labelledby={`label-${id}`} aria-invalid={Boolean(errors[id])} aria-describedby={errors[id] ? `error-${id}` : undefined} />{errors[id] && <small className="review-error" id={`error-${id}`}>{errors[id]}</small>}</label>;
}

function CurrentLayout() {
  return <section className="review-before">
    <h1>Current payment layout</h1><p>Live captures of the two payment areas. Customer details are excluded.</p>
    <div className="review-before-captures">{["express", "payment"].map(part => <picture key={part}>
      <source media="(max-width: 350px)" srcSet={`/qa/checkout-payment-preview-20261009/before-${part}-320.jpg`} />
      <source media="(max-width: 600px)" srcSet={`/qa/checkout-payment-preview-20261009/before-${part}-390.jpg`} />
      <img src={`/qa/checkout-payment-preview-20261009/before-${part}-1440.jpg`} alt={part === "express" ? "Current express checkout with PayPal, Pay Later and Google Pay" : "Current regular payment options with card and PayPal"} />
    </picture>)}</div>
  </section>;
}

export function CheckoutReview() {
  const query = new URLSearchParams(window.location.search);
  const [view, setView] = useState(query.get("view") === "before" ? "before" : "after");
  const [wallet, setWallet] = useState(query.get("method") === "apple" ? "apple" : "google");
  const [method, setMethod] = useState(methods[query.get("method")] ? query.get("method") : "paypal");
  const [details, setDetails] = useState(initialDetails);
  const [errors, setErrors] = useState({});
  const [sameBilling, setSameBilling] = useState(true);
  const [dialog, setDialog] = useState(null);
  const active = methods[method];
  const ActiveIcon = active.icon;
  const options = ["card", "paypal", ...(wallet === "none" ? [] : [wallet])];
  const update = (id, value) => { setDetails(current => ({ ...current, [id]: value })); setErrors(current => ({ ...current, [id]: undefined })); };
  const changeView = next => { setView(next); const url = new URL(window.location.href); url.searchParams.set("view", next); window.history.replaceState({}, "", url); };
  const changeWallet = next => { setWallet(next); if (method === "google" || method === "apple") setMethod(next === "none" ? "paypal" : next); };
  const previewAction = event => {
    event?.preventDefault();
    const nextErrors = {};
    const requiredFields = sameBilling ? required : [...required, "billingAddress", "billingCity", "billingPostal"];
    for (const field of requiredFields) if (!details[field].trim()) nextErrors[field] = `Enter your ${names[field].toLowerCase()}.`;
    if (details.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) nextErrors.email = "Enter a valid email address.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { document.getElementById(`review-${Object.keys(nextErrors)[0]}`)?.focus(); return; }
    setDialog("interaction");
  };
  return <>
    <a className="review-skip" href="#review-main">Skip to checkout</a>
    <div className="review-toolbar" aria-label="Local preview controls"><div><strong>LOCAL REVIEW</strong><span>No orders or payments. Card fields are disabled.</span></div><div className="review-view-switch"><button type="button" aria-pressed={view === "before"} onClick={() => changeView("before")}>Before</button><button type="button" aria-pressed={view === "after"} onClick={() => changeView("after")}>After</button></div>{view === "after" && <label className="review-wallet-preview">Wallet example<select value={wallet} onChange={event => changeWallet(event.target.value)}><option value="google">Google Pay</option><option value="apple">Apple Pay</option><option value="none">No eligible wallet</option></select></label>}</div>
    <Header onBag={() => setDialog("bag")} />
    <main id="review-main" className="review-main">
      {view === "before" ? <CurrentLayout /> : <>
        <div className="review-page-heading"><a href="/shop"><ArrowLeft size={15} /> Back to shop</a><p className="review-eyebrow">ASTER EDIT · CHECKOUT</p><h1>The final details.</h1><p>Review your selection, delivery details and payment method.</p></div>
        <p className="review-mail-notice">Order emails are currently off. Save your order number on the confirmation page and use the <a href="https://commerce.example.test/order-status/">order status page</a> to check your order.</p>
        <form className="review-checkout-grid" onSubmit={previewAction} noValidate>
          <div className="review-delivery">
            <section aria-labelledby="contact-title"><h2 id="contact-title">Contact information</h2><Field id="email" label="Email address" type="email" {...{ details, update, errors }} /></section>
            <section aria-labelledby="delivery-title"><h2 id="delivery-title">Shipping address</h2>
              <label className="review-field" htmlFor="review-country"><span>Country / region</span><select id="review-country" value={details.country} onChange={event => update("country", event.target.value)}>{["United States", "United Kingdom", "Germany", "France", "Canada", "Australia"].map(country => <option key={country}>{country}</option>)}</select></label>
              <div className="review-fields-two"><Field id="first" label="First name" {...{ details, update, errors }} /><Field id="last" label="Last name" {...{ details, update, errors }} /></div>
              <Field id="address" label="Address" {...{ details, update, errors }} />
              <details className="review-apartment"><summary>Add apartment, suite or unit</summary><Field id="apartment" label="Apartment, suite or unit" optional {...{ details, update, errors }} /></details>
              <div className="review-fields-two"><Field id="city" label="City" {...{ details, update, errors }} /><Field id="postal" label="ZIP / postal code" {...{ details, update, errors }} /></div>
              <Field id="state" label="State / province" {...{ details, update, errors }} />
              <Field id="phone" label="Phone" type="tel" optional {...{ details, update, errors }} />
              <label className="review-checkbox"><input type="checkbox" checked={sameBilling} onChange={event => setSameBilling(event.target.checked)} />Use same address for billing</label>
              {!sameBilling && <div className="review-billing"><h3>Billing address</h3><Field id="billingAddress" label="Billing address" {...{ details, update, errors }} /><div className="review-fields-two"><Field id="billingCity" label="City" {...{ details, update, errors }} /><Field id="billingPostal" label="ZIP / postal code" {...{ details, update, errors }} /></div></div>}
            </section>
            <section className="review-delivery-method" aria-labelledby="shipping-title"><h2 id="shipping-title">Delivery</h2><div><span><Check size={17} />International shipping</span><strong>{money(selection.shipping)}</strong></div></section>
            <details className="review-order-note"><summary>Add a note to your order <span>Optional</span></summary><label className="review-field"><span>Order note</span><textarea maxLength={500} value={details.note} onChange={event => update("note", event.target.value)} /></label></details>
          </div>
          <aside className="review-order-payment" aria-label="Order and payment">
            <OrderSummary />
            <section className="review-payment" aria-labelledby="payment-title">
              <div className="review-section-heading"><h2 id="payment-title">Payment method</h2><LockKey size={19} /></div>
              <fieldset className={`review-payment-options ${options.length % 2 ? "has-last-wide" : ""}`}><legend className="review-visually-hidden">Choose how to pay</legend>{options.map(key => { const item = methods[key], Icon = item.icon; return <label key={key} className={`review-method ${method === key ? "is-selected" : ""}`}><input type="radio" name="payment-method" value={key} checked={method === key} onChange={() => setMethod(key)} aria-controls="review-payment-panel" /><Icon size={23} aria-hidden="true" /><span><strong>{item.label}</strong><small>{item.detail}</small></span></label>; })}</fieldset>
              <p className="review-wallet-note">Wallet options appear on supported devices and browsers.</p>
              <div className="review-payment-panel" id="review-payment-panel" aria-live="polite"><div className="review-panel-heading"><ActiveIcon size={25} aria-hidden="true" /><h3>{active.heading}</h3></div>
                {method === "card" ? <div className="review-card-fields"><label className="review-field"><span>Card number</span><input readOnly aria-label="Card number, visual preview only" placeholder="Card number" inputMode="none" /></label><div className="review-fields-two"><label className="review-field"><span>Expiry</span><input readOnly aria-label="Expiry, visual preview only" placeholder="MM / YY" inputMode="none" /></label><label className="review-field"><span>Security code</span><input readOnly aria-label="Security code, visual preview only" placeholder="CVV" inputMode="none" /></label></div></div> : <p>{method === "paypal" ? "Confirm your payment in the secure PayPal window, then return to this checkout." : `Confirm your payment using ${active.label} on your device.`}</p>}
                <button className="review-primary" type="submit">{active.action}<ArrowRight size={17} aria-hidden="true" /></button>
              </div>
              <p className="review-terms">By placing your order, you agree to our <a href="https://commerce.example.test/store-terms/">Terms and Conditions</a> and <a href="https://commerce.example.test/privacy-policy/">Privacy Policy</a>.</p>
            </section>
          </aside>
        </form>
      </>}
    </main>
    <footer className="review-footer"><div><a className="review-wordmark" href="/">ASTER EDIT</a><p>Objects for a more considered table.</p></div><nav aria-label="Explore"><h2>Explore</h2><a href="/shop">All products</a><a href="/collections">Collections</a><a href="/about">Our story</a></nav><nav aria-label="Your order"><h2>Your order</h2><a href="https://commerce.example.test/order-status/">Order status</a><a href="/shipping-returns">Shipping & returns</a><a href="https://commerce.example.test/my-account/">My account</a></nav></footer>
    {dialog && <ReviewDialog title={dialog === "bag" ? "Your selection" : `${active.label} · local preview`} onClose={() => setDialog(null)}><p>{selection.name} · Quantity 1</p><p className="review-dialog-total">Total {money(selection.total)} USD</p>{dialog === "interaction" && <><p>{method === "card" ? "Card payment belongs on this checkout, using secure payment fields." : `The live ${active.label} authorization uses the payment provider’s window. Closing it returns you to this checkout with your details kept.`}</p><p>This is a local interaction preview. No order or payment was created. Live payment controls are not connected.</p></>}</ReviewDialog>}
  </>;
}
