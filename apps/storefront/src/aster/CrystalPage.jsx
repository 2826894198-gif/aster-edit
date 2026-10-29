import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  MagnifyingGlassPlus,
  Minus,
  Plus,
  Truck,
  X,
} from "@phosphor-icons/react";
import { SiteLink } from "./Shared.jsx";
import { crystalProducts, crystalQuestions } from "../data/crystal.js";
import signs from "../data/prism-zodiac.json";
import "../styles/aster.css";
import "../styles/prism-zodiac.css";

const asset = (name) => `/assets/prism-zodiac-v1/${name}`;
const money = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
const contact =
  "mailto:support@example.test?subject=Prism%20Zodiac%20Crystal%20Tumbler";
const productTitle = "Prism Zodiac Crystal Tumbler";
const price = 129;

function readSelection() {
  const query = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const sign = signs.find((item) => item.id === query.get("sign"))?.id || null;
  return { sign };
}

// These are the supplier's exact design illustrations, framed from each individual
// source option image. This reference remains separate from the labeled AI visualizations.
export function ZodiacArt({ sign, className = "", decorative = false }) {
  return (
    <span
      className={`z-sign-art ${className}`}
      role={decorative ? undefined : "img"}
      aria-label={
        decorative ? undefined : `${sign.name} zodiac engraving illustration`
      }
      aria-hidden={decorative || undefined}
    >
      <img
        src={sign.sourceImage}
        alt=""
        width="1200"
        height="1200"
        loading="lazy"
      />
    </span>
  );
}

// Owner approved photo-derived AI visualizations for all twelve signs.
// Original photographs remain separately identified in the detail chapter.
const baseVisualizations = Object.fromEntries(signs.map((sign) => [sign.id, {
  id: sign.id,
  name: sign.name,
  src: `/assets/prism-zodiac-ai-v1/${sign.id}-base-1254.webp`,
  srcSet: [480, 960, 1254].map((width) =>
    `/assets/prism-zodiac-ai-v1/${sign.id}-base-${width}.webp ${width}w`).join(", "),
}]));

function ZodiacVisualization({ visualization, priority = false, sizes = "(min-width: 1440px) 660px, (min-width: 981px) 52vw, 100vw" }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="z-base-frame">
      {failed ? <span className="z-image-error">The engraving preview could not load. You can still compare the source designs below.</span> : <img key={visualization.id} src={visualization.src} srcSet={visualization.srcSet}
        sizes={sizes}
        alt={`${visualization.name} crystal-base engraving — AI-generated product visualization`}
        width="1254" height="1254"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined} onError={() => setFailed(true)} />}
    </span>
  );
}

const sourcePhotos = {
  base: {src: "/assets/prism-base-photos-v1/taurus-base.jpg", width:1000, height:1500, crop:[100,480,800,800], alt:"Taurus sample photograph: the engraved bull motif in the actual crystal base"},
  hand: {src: "/assets/prism-pdp-v2/hand-scale.jpg", width:1000, height:1345, crop:[140,280,740,1000], alt:"Actual crystal tumbler held in one hand to show the scale of its shared glass form"},
  drink: {src: "/assets/prism-pdp-v2/drink-scene.jpg", width:1000, height:1281, crop:[40,80,920,920], alt:"Photographed Prism crystal tumbler with ice and an amber drink on a table"},
};

function SourcePhoto({ type }) {
  const photo=sourcePhotos[type];
  const [left,top,width,height]=photo.crop;
  return <span className="z-source-photo" style={{"--source-aspect":width/height,"--source-ratio":`${width} / ${height}`,"--source-width":`${photo.width / width * 100}%`,"--source-left":`${-left / width * 100}%`,"--source-top":`${-top / height * 100}%`}}>
    <img src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} loading="lazy" />
  </span>;
}

function ProductPhoto({ type, className = "", priority = false, sizes }) {
  if (type === "base")
    return (
      <img
        className={`z-photo ${className}`}
        src="/assets/prism-base-photos-v1/taurus-base.jpg"
        alt="Photographed Taurus sample: engraved design and reflected highlights in the crystal base"
        width="1000"
        height="1500"
        loading="lazy"
      />
    );

  return (
    <img
      className={`z-photo ${className}`}
      src={asset(
        type === "table" ? "glass-table-1440.webp" : "glass-studio-960.webp",
      )}
      srcSet={[480, 960, 1440]
        .map(
          (w) =>
            `${asset(`${type === "table" ? "glass-table" : "glass-studio"}-${w}.webp`)} ${w}w`,
        )
        .join(", ")}
      sizes={
        sizes || (type === "table"
          ? "(min-width: 1440px) 1280px, 100vw"
          : "(min-width: 1000px) 650px, 90vw")
      }
      alt={
        type === "table"
          ? "Prism crystal tumbler on a pale table beside linen and ceramic"
          : "Shared form of the Prism zodiac crystal tumbler, with vertical facets and a thick transparent base"
      }
      width={type === "table" ? 1774 : 1073}
      height={type === "table" ? 887 : 1466}
      fetchPriority={priority ? "high" : undefined}
      loading={priority ? "eager" : "lazy"}
    />
  );
}

// Common Western zodiac date ranges, checked against the Farmers' Almanac
// birthday guide. Changeover dates can vary; this is a selection aid only.
const birthdayDates = {
  aries: "Mar 21 – Apr 19", taurus: "Apr 20 – May 20",
  gemini: "May 21 – Jun 20", cancer: "Jun 21 – Jul 22",
  leo: "Jul 23 – Aug 22", virgo: "Aug 23 – Sep 22",
  libra: "Sep 23 – Oct 22", scorpio: "Oct 23 – Nov 21",
  sagittarius: "Nov 22 – Dec 21", capricorn: "Dec 22 – Jan 19",
  aquarius: "Jan 20 – Feb 18", pisces: "Feb 19 – Mar 20",
};
const conciseAnswers = {
  "What changes when I choose a zodiac sign?": "The motif and constellation at the base change. Selecting a sign updates its engraving preview and the item you add to your bag. The glass form, price and packaging stay the same.",
  "Is the price for one tumbler or a set?": "The price is for one tumbler. A quantity of two means two glasses of your selected design. Add different zodiac signs to your bag separately.",
  "How do delivery and after-sales support work?": "Ask customer care about delivery timing to your destination before ordering a date-sensitive gift. Our Shipping & returns policy explains shipping charges and any applicable import charges. If your item arrives incorrect or damaged, email customer care with your order details.",
};
const questions = crystalQuestions.map(({question,answer}) => [question,conciseAnswers[question] || answer]);

export function CrystalPage({ navigate, onAdd, onBuy }) {
  const [selection, setSelection] = useState(readSelection);
  const selected = signs.find((item) => item.id === selection.sign);
  const displayVisualization = baseVisualizations[selected?.id || "gemini"];
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const activeRequest = useRef(null);
  const selectedProduct = crystalProducts.find((item) => item.signId === selected?.id);
  const [viewer, setViewer] = useState(null);
  const [notice, setNotice] = useState("");
  const imageDialog = useRef(null);
  const choiceRef = useRef(null);
  const overviewRef = useRef(null);
  const relatedRef = useRef(null);
  const [showSticky, setShowSticky] = useState(false);
  const deliveryContact = `${contact}&body=${encodeURIComponent(`Hello Aster Edit,\n\nI am interested in the Prism Crystal Tumbler${selected ? ` in ${selected.name}` : ""}.\n\nDelivery destination: \nNeeded by: \n\nPlease confirm the current delivery timing, packaging and what is included before I order.\n\nThank you.`)}`;
  useEffect(() => {
    const visible={overview:true,related:false};
    const observer=new IntersectionObserver(entries => {
      for(const entry of entries) {
        if(entry.target === overviewRef.current)visible.overview=entry.isIntersecting;
        if(entry.target === relatedRef.current)visible.related=entry.isIntersecting;
      }
      setShowSticky(!visible.overview && !visible.related);
    });
    if(overviewRef.current)observer.observe(overviewRef.current);
    if(relatedRef.current)observer.observe(relatedRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const sync = () => setSelection(readSelection());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => () => activeRequest.current?.abort(), []);
  const changeSelection = (next) => {
    if (busy) return;
    setSelection(next);
    setNotice("");
    const url = new URL(window.location.href);
    for (const old of ["study", "pattern", "view", "sign"])
      url.searchParams.delete(old);
    if (next.sign) url.searchParams.set("sign", next.sign);
    window.history.replaceState(
      window.history.state,
      "",
      url.pathname + url.search + url.hash,
    );
  };
  const choose = (id) => changeSelection({ sign: id });
  const goToChoice = (event) => {
    event?.preventDefault();
    choiceRef.current?.scrollIntoView({ block: "center", behavior: "instant" });
    const focusTarget = choiceRef.current?.querySelector("input:checked")
      || choiceRef.current?.querySelector("input");
    focusTarget?.focus({ preventScroll: true });
  };
  const openViewer = (kind) => {
    setViewer(kind);
    imageDialog.current?.showModal();
  };
  const addSelection = () => {
    if (!selectedProduct) return goToChoice();
    onAdd?.(selectedProduct, null, quantity);
    setNotice(`${selected.name} has been added to your bag.`);
  };
  const buyNow = async () => {
    if (!selectedProduct) return goToChoice();
    if (!onBuy || activeRequest.current) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    setBusy(true);
    setNotice("");
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      await onBuy(selectedProduct, quantity, controller.signal);
    } catch (error) {
      setNotice(error.name === "AbortError" || error instanceof TypeError
        ? "Could not reach checkout. Your selection is in your bag; please try again."
        : error.message);
    } finally {
      window.clearTimeout(timeout);
      activeRequest.current = null;
      setBusy(false);
    }
  };
  return (
    <>
      <main className="z-page" id="z-main">
        <a className="z-skip" href="#z-title">Skip to product details</a>
        <nav className="z-frame z-breadcrumb" aria-label="Breadcrumb">
          <SiteLink to="/" navigate={navigate}>Home</SiteLink><span>/</span>
          <SiteLink to="/shop" navigate={navigate}>Shop</SiteLink><span>/</span>
          <span aria-current="page">Prism Zodiac</span>
        </nav>

        <section className="z-frame z-overview" ref={overviewRef} aria-labelledby="z-title">
          <div className="z-overview-heading">
            <h1 id="z-title" tabIndex={-1}>{productTitle}</h1>
            <p className="z-price"><del>$179</del><strong>{money(price)}</strong><span>USD / one tumbler</span></p>
          </div>
          <div className="z-overview-media">
          <div className="z-gallery">
            <figure className="z-main-figure">
              <button className="z-stage" type="button" onClick={() => openViewer(displayVisualization.id)} aria-label={`Enlarge ${displayVisualization.name} AI-generated base visualization`}>
                <ZodiacVisualization key={displayVisualization.id} visualization={displayVisualization} priority sizes="(min-width: 1440px) 390px, (min-width: 981px) 28vw, (min-width: 681px) 400px, 60vw" />
                <span className="z-zoom"><MagnifyingGlassPlus size={20} aria-hidden="true" /></span>
              </button>
              <figcaption className="z-gallery-caption" aria-live="polite">
                <span>{selected ? `${selected.name} engraving preview` : "Gemini shown as an example"}</span>
                <small>AI-generated product visualization. Actual finish and reflections may vary.</small>
              </figcaption>
            </figure>
            <figure className="z-form-companion">
              <button type="button" onClick={() => openViewer("glass")} aria-label="Enlarge the complete crystal tumbler">
                <ProductPhoto type="glass" priority sizes="(min-width: 1440px) 220px, (min-width: 981px) 16vw, (min-width: 681px) 230px, 35vw" />
                <MagnifyingGlassPlus size={17} aria-hidden="true" />
              </button>
              <figcaption>The complete glass</figcaption>
            </figure>
          </div>

          <div className="z-product-summary">
            <p className="z-description">A faceted crystal tumbler with your chosen zodiac engraved at the base.</p>
            <dl className="z-quick-facts">
              <div><dt>Capacity</dt><dd>Approx. 220 mL</dd></div>
              <div><dt>Height</dt><dd>9 cm</dd></div>
              <div><dt>Rim diameter</dt><dd>7.5 cm</dd></div>
            </dl>
          </div>
          </div>
          <div className="z-purchase">
            <fieldset className="z-choices" id="zodiac-choice" ref={choiceRef} disabled={busy}>
              <legend>Choose your zodiac <span>{selected ? selected.name : "12 designs"}</span></legend>
              <div className="z-choice-grid">
                {signs.map((sign) => <label key={sign.id} className={`z-choice ${selected?.id === sign.id ? "is-selected" : ""}`}>
                  <input type="radio" name="zodiac" value={sign.id} checked={selected?.id === sign.id} onChange={() => choose(sign.id)} />
                  <span>{sign.name}</span>{selected?.id === sign.id && <Check size={13} weight="bold" aria-hidden="true" />}
                </label>)}
              </div>
            </fieldset>
            <div className="z-selection-line">
              <p className="z-selection-summary" aria-live="polite"><strong>{selected ? `${selected.name}: ${selected.motif}` : "Choose a sign."}</strong></p>
              <a className="z-compare-link" href="#z-design">Compare designs <ArrowRight size={15} aria-hidden="true" /></a>
            </div>
            <div className="z-quantity-line">
              <span>Quantity</span>
              <div className="z-quantity" role="group" aria-label="Tumbler quantity">
                <button type="button" aria-label="Decrease tumbler quantity" disabled={busy || quantity === 1} onClick={() => setQuantity(n => n - 1)}><Minus size={15} aria-hidden="true" /></button>
                <output aria-live="polite">{quantity}</output>
                <button type="button" aria-label="Increase tumbler quantity" disabled={busy || quantity === 20} onClick={() => setQuantity(n => n + 1)}><Plus size={15} aria-hidden="true" /></button>
              </div>
              <span className="z-quantity-total">{money(price * quantity)}</span>
            </div>
            <div className="z-actions">
              <button className="z-add" type="button" disabled={busy || !selectedProduct} onClick={addSelection}>Add to bag</button>
              <button className="z-buy" type="button" disabled={busy || !selectedProduct} onClick={buyNow}>{busy ? "Opening checkout…" : "Buy now"}</button>
            </div>
            <p className="z-shipping"><Truck size={19} aria-hidden="true" />Free shipping on crystal-only orders</p>
            <div className="z-purchase-help"><a href="#z-order">Delivery & packaging</a><a href={contact}>Ask about this glass</a></div>
            <p className="z-notice" role="status">{notice}</p>
          </div>
        </section>

        <nav className="z-section-nav" aria-label="Explore Prism"><div className="z-frame">
          <a href="#z-story">The glass</a><a href="#z-details">The details</a><a href="#z-design">12 zodiac designs</a><a href="#z-size">Size & use</a><a href="#z-order">Shipping & care</a><a href="#z-questions">Questions</a>
        </div></nav>

        <section className="z-frame z-chapter z-introduction" id="z-story" aria-labelledby="z-story-title">
          <figure className="z-drink-figure">
            <button className="z-photo-button" type="button" onClick={() => openViewer("drink")} aria-label="Enlarge the photographed tumbler with ice and a drink"><SourcePhoto type="drink" /><span className="z-zoom"><MagnifyingGlassPlus size={18} aria-hidden="true" /></span></button>
            <figcaption>Photographed glass with a drink and ice. Styling items are not included.</figcaption>
          </figure>
          <div className="z-introduction-copy">
            <h2 id="z-story-title">Clear crystal.<br />A personal detail underneath.</h2>
            <p>Prism starts with a simple silhouette: a circular opening, straight-cut sides and a substantial clear base. Turn the glass and the detail comes into view—a zodiac motif paired with its constellation.</p>
            <p>Choose the sign that means something to you. It could mark a birthday, a connection, or simply a design you enjoy seeing each time you pick up the glass.</p>
            <dl className="z-feature-notes">
              <div><dt>Faceted crystal</dt><dd>Vertical lines give the clear wall its rhythm.</dd></div>
              <div><dt>An engraved base</dt><dd>The motif sits beneath the glass, within the detailed lower section.</dd></div>
              <div><dt>A compact pour</dt><dd>A smaller drink, with room left for ice or garnish.</dd></div>
            </dl>
          </div>
        </section>

        <section className="z-frame z-chapter z-details" id="z-details" aria-labelledby="z-details-title">
          <div className="z-section-heading"><h2 id="z-details-title">Look closer, from rim to base.</h2><p>The shape stays quiet. The cuts, engraving and reflected light provide the detail.</p></div>
          <div className="z-detail-pair">
            <figure><button className="z-detail-photo z-rim-photo" type="button" onClick={() => openViewer("glass")} aria-label="Enlarge the shared glass form and rim"><ProductPhoto type="glass" /><span className="z-zoom"><MagnifyingGlassPlus size={18} aria-hidden="true" /></span></button><figcaption><h3>A clear, circular opening</h3><p>The 7.5 cm opening sits above a faceted wall. The vertical lines lead down into the substantial clear base.</p></figcaption></figure>
            <figure><button className="z-detail-photo z-base-photo" type="button" onClick={() => openViewer("base")} aria-label="Enlarge Taurus sample base photograph"><SourcePhoto type="base" /><span className="z-zoom"><MagnifyingGlassPlus size={18} aria-hidden="true" /></span></button><figcaption><h3>The signature beneath the glass</h3><p>Taurus sample photograph. Fine engraved lines sit within the clear base, surrounded by the facets and their reflected highlights.</p></figcaption></figure>
          </div>
          <p className="z-light-note">Blue, green and amber highlights vary with light, angle and surroundings. They are reflections, not separate colour choices or a self-lighting feature.</p>
        </section>

        <section className="z-design-wrap" id="z-design" aria-labelledby="z-design-title"><div className="z-frame z-chapter">
          <div className="z-section-heading"><h2 id="z-design-title">Twelve designs. Find yours.</h2><p>Compare the motif and constellation, then choose the design that means something to you.</p></div>
          <details className="z-birthday-guide">
            <summary>Find a sign by birthday <Plus size={16} className="z-guide-plus" aria-hidden="true" /><Minus size={16} className="z-guide-minus" aria-hidden="true" /></summary>
            <dl>{signs.map(sign => <div key={sign.id}><dt>{sign.name}</dt><dd>{birthdayDates[sign.id]}</dd></div>)}</dl>
            <p className="z-small">Common date ranges; dates near a changeover can vary. If you know the recipient’s sign, choose that design.</p>
          </details>
          <div className="z-design-browser">
            <div className="z-design-selected">
              <button className="z-design-art-button" type="button" onClick={() => openViewer("design")} aria-label={`Enlarge ${(selected || signs[2]).name} source design illustration`}><ZodiacArt sign={selected || signs[2]} /><span className="z-zoom"><MagnifyingGlassPlus size={18} aria-hidden="true" /></span></button>
              <div><h3>{(selected || signs[2]).name}</h3><p>{(selected || signs[2]).motif} motif with constellation lines.</p><small>Source design illustration. Compare the line drawing here with the AI-generated engraving preview above.</small><button type="button" className="z-inline-link" onClick={() => openViewer("design")}>View design larger <MagnifyingGlassPlus size={16} aria-hidden="true" /></button></div>
            </div>
            <div className="z-design-directory">
              <div className="z-motif-grid" role="group" aria-label="Compare the twelve zodiac designs">
                {signs.map(sign => <button key={sign.id} type="button" disabled={busy} aria-pressed={selected?.id === sign.id} onClick={() => choose(sign.id)} className="z-motif-choice">
                  <ZodiacArt sign={sign} decorative /><span><strong>{sign.name}</strong><small>{sign.motif}</small></span>{selected?.id === sign.id && <Check size={15} weight="bold" aria-hidden="true" />}
                </button>)}
              </div>
              <div className="z-design-next"><p>{selected ? `${selected.name} is selected. You can change it at any time before adding to your bag.` : "Choose by birthday, personal connection, or the illustration you like best."}</p><button type="button" className="z-inline-link" onClick={goToChoice}>{selected ? `Continue with ${selected.name}` : "Return to the purchase options"}<ArrowRight size={16} aria-hidden="true" /></button></div>
            </div>
          </div>
        </div></section>

        <section className="z-frame z-chapter z-size" id="z-size" aria-labelledby="z-size-title">
          <div className="z-section-heading"><h2 id="z-size-title">Know the size before it arrives.</h2><p>A small tumbler with a substantial base. Use the measurements alongside the hand-held photograph to judge its scale.</p></div>
          <div className="z-size-layout">
            <figure className="z-hand-figure"><button className="z-photo-button" type="button" onClick={() => openViewer("hand")} aria-label="Enlarge the real hand-held glass scale photograph"><SourcePhoto type="hand" /><span className="z-zoom"><MagnifyingGlassPlus size={18} aria-hidden="true" /></span></button><figcaption>Actual glass photographed in hand; a shared-form reference.</figcaption></figure>
            <figure className="z-size-figure"><div className="z-rim-measure">7.5 cm<span>rim diameter</span></div><ProductPhoto type="glass" /><div className="z-height-measure">9 cm<span>height</span></div><figcaption>Capacity approx. 220 mL</figcaption></figure>
            <div className="z-size-copy"><h3>Made for a smaller pour.</h3><p>A pour over ice, or water alongside a meal. Leave room for ice or garnish.</p><dl className="z-specifications"><div><dt>Material</dt><dd>Crystal</dd></div><div><dt>Capacity</dt><dd>Approx. 220 mL</dd></div><div><dt>Height</dt><dd>9 cm</dd></div><div><dt>Rim diameter</dt><dd>7.5 cm</dd></div><div><dt>Sold as</dt><dd>One tumbler</dd></div><div><dt>Design options</dt><dd>12 zodiac engravings</dd></div></dl><p className="z-small">Capacity is approximate and is not a recommended fill level. Measurements describe the glass, not its packaging.</p></div>
          </div>
        </section>

        <section className="z-frame z-chapter z-gifting" aria-labelledby="z-gifting-title">
          <figure><ProductPhoto type="table" /><figcaption>Prism in a styled table setting. Other objects shown are not included.</figcaption></figure>
          <div><h2 id="z-gifting-title">For someone<br />whose sign you know.</h2><p>A birthday, a connection, or a design that reminds you of someone. Choose their sign, then add each different design to your bag separately.</p><dl className="z-gift-included"><div><dt>Included</dt><dd>One tumbler in your chosen zodiac</dd></div><div><dt>Packaging</dt><dd>Packaging is the same for all signs.</dd></div></dl><p className="z-small">Other objects in the styled photographs are not included.</p><div className="z-gift-date"><h3>Have a date in mind?</h3><p>Tell us your destination and needed-by date before ordering. We can confirm current delivery timing and packaging details.</p><a href={deliveryContact} className="z-inline-link">Check timing & packaging <ArrowRight size={16} aria-hidden="true" /></a></div><button type="button" className="z-inline-link" onClick={goToChoice}>Choose a sign for someone <ArrowRight size={16} aria-hidden="true" /></button></div>
        </section>

        <section className="z-order-wrap" id="z-order" aria-labelledby="z-order-title"><div className="z-frame z-chapter">
          <h2 id="z-order-title">Before you place your order.</h2>
          <div className="z-order-columns">
            <div><h3>Your selection</h3><p>Quantity adds more glasses of the same sign. For several zodiac designs, add each selection separately.</p><p className="z-small">Choose from twelve existing designs. Separate name or message engraving is not offered.</p></div>
            <div><h3>Shipping, clearly</h3><p>Crystal-only orders ship free. The same applies to bags containing only crystal glasses and rolling-bead ceramic cups.</p><p>Adding other tableware brings in the standard rule: $30 below a $150 merchandise subtotal after discounts; free from $150.</p><SiteLink to="/shipping-returns" navigate={navigate} className="z-inline-link">Read shipping & returns <ArrowRight size={16} aria-hidden="true" /></SiteLink></div>
            <div><h3>Care & support</h3><p>Wash gently by hand and dry with a soft cloth. Contact us before using hot liquids or placing the glass in an appliance.</p><p>For an incorrect or damaged item, email customer care with your order details.</p><a href={contact} className="z-inline-link">Contact customer care <ArrowRight size={16} aria-hidden="true" /></a></div>
          </div>
          <div className="z-delivery-note"><div><h3>Delivery to your destination</h3><p>For current dispatch and delivery timing, contact us with your destination before ordering.</p></div><a href={deliveryContact} className="z-inline-link">Ask about delivery <ArrowRight size={16} aria-hidden="true" /></a></div>
        </div></section>

        <section className="z-frame z-chapter z-questions" id="z-questions" aria-labelledby="z-question-title">
          <div className="z-section-heading"><h2 id="z-question-title">Questions about Prism</h2><a href={contact} className="z-inline-link">Ask us a question <ArrowRight size={16} aria-hidden="true" /></a></div>
          <div className="z-faq-columns">
            {['Choosing your glass', 'Using & ordering'].map((heading, group) => <div key={heading}><h3>{heading}</h3>{questions.filter((_,i) => group === 0 ? i < 5 : i >= 5).map(([q,a],i) => <details key={q} open={i === 0}><summary><span>{q}</span><Plus size={17} aria-hidden="true" className="z-faq-plus" /><Minus size={17} aria-hidden="true" className="z-faq-minus" /></summary><p>{a}</p></details>)}</div>)}
          </div>
        </section>

        <section className="z-frame z-chapter z-related" ref={relatedRef} aria-labelledby="z-related-title"><div className="z-section-heading"><h2 id="z-related-title">More for your table.</h2><SiteLink to="/shop" navigate={navigate} className="z-inline-link">Explore Aster Edit <ArrowRight size={16} aria-hidden="true" /></SiteLink></div><div>
          <SiteLink to="/products/rolling-bead-ceramic-cup" navigate={navigate}><img src="/images/aster/cup-preview/catalogue/three-colours-staggered-white-v2.png" width="1536" height="1024" alt="Rolling-bead ceramic cups in three glaze colours" loading="lazy" /><h3>Rolling-bead ceramic cup</h3><p>Glazed ceramic with a small, tactile detail.</p><span>Explore the cup <ArrowRight size={16} aria-hidden="true" /></span></SiteLink>
          <SiteLink to="/collections" navigate={navigate}><img src="/assets/material-preview/ceramics-category-960.webp" width="960" height="640" alt="Cream ceramic bowls and plates from the Aster Edit collections" loading="lazy" /><h3>The ceramic collections</h3><p>Bowls and plates to build the rest of your setting.</p><span>Browse the collections <ArrowRight size={16} aria-hidden="true" /></span></SiteLink>
        </div></section>
      </main>

      {showSticky && <aside className="z-purchase-return" aria-label="Your Prism selection"><div className="z-frame"><button type="button" className="z-return-edit" onClick={goToChoice} disabled={busy} aria-label={`Edit ${selected ? selected.name : 'Prism'} selection and quantity`}><span className="z-return-summary"><strong>{selected ? selected.name : 'Prism Zodiac'}</strong><span>{selected ? `${quantity} tumbler${quantity > 1 ? 's' : ''} / ${money(price * quantity)}` : '12 designs / $129 each'}</span></span><span className="z-return-edit-label">Edit selection <ArrowRight size={14} aria-hidden="true" /></span></button><button type="button" className="z-add" onClick={selectedProduct ? addSelection : goToChoice} disabled={busy}>{selectedProduct ? 'Add to bag' : 'Choose a zodiac'}</button></div></aside>}

      <dialog className="z-modal z-image-modal" ref={imageDialog} onClose={() => setViewer(null)} onClick={event => {if(event.target === event.currentTarget)imageDialog.current?.close();}} aria-labelledby="z-image-modal-title">
        <div className="z-modal-top"><h2 id="z-image-modal-title">{baseVisualizations[viewer] ? `${baseVisualizations[viewer].name} engraving preview` : viewer === 'design' ? `${(selected || signs[2]).name} design illustration` : ({base:'Taurus sample base photograph',hand:'The glass, in hand',drink:'The glass with a drink',glass:'The complete crystal tumbler',table:'Prism at the table'}[viewer] || 'Prism detail')}</h2><button type="button" aria-label="Close image" onClick={() => imageDialog.current?.close()}><X size={22} aria-hidden="true" /></button></div>
        {baseVisualizations[viewer] ? <><ZodiacVisualization key={viewer} visualization={baseVisualizations[viewer]} priority /><p className="z-visualization-disclosure">AI-generated product visualization. Actual finish and reflections may vary.</p></> : viewer === 'design' ? <><ZodiacArt sign={selected || signs[2]} /><p className="z-visualization-disclosure">Source design illustration.</p></> : ['base','hand','drink'].includes(viewer) ? <SourcePhoto type={viewer} /> : viewer && <ProductPhoto type={viewer} priority />}
      </dialog>
    </>
  );
}
