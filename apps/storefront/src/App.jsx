import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Coffee,
  DiamondsFour,
  Gift,
  Handbag,
  Heart,
  ImagesSquare,
  List,
  MagnifyingGlass,
  Minus,
  Plus,
  ShuffleAngular,
  Sparkle,
  Star,
  User,
  X,
} from "@phosphor-icons/react";
import { productTiers } from "./domain/catalog.js";
import { applyClientHead } from "./seo/client-head.js";
import { getRoute } from "./seo/routes.js";
import { buildCommerceEvent, commerceEventNames } from "./analytics/commerce-events.js";
import { ReferenceHomepage, sourceBoxExamples, TierArtwork } from "./ReferenceHomepage.jsx";
import { ContentPage } from "./ContentPage.jsx";
import './reference-homepage.css';
import "./content-pages.css";

const cardColors = ["pink-card", "yellow-card", "purple-card"];

function trackCommerce(name, products, context = {}) {
  const event = buildCommerceEvent(name, products, context);
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(event);
  window.dispatchEvent(new CustomEvent("storefront:commerce", { detail: event }));
}

function scrollTo(id) {
  const mobileTarget = document.getElementById(`mobile-${id}`);
  const target = mobileTarget?.getClientRects().length ? mobileTarget : document.getElementById(id);
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function BrandMark() {
  return <button className="brand" type="button" onClick={() => scrollTo("top")} aria-label="Back to top">surprise<span>.</span></button>;
}

function Header({ count, onCartOpen }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    ["Shop", "/collections/mystery-tableware-box"],
    ["Collections", "/pages/what-could-be-inside"],
    ["Blog", "/blogs/table-stories"],
    ["About", "/pages/how-it-works"],
    ["FAQ", "/pages/shipping-returns"],
  ];

  return (
    <>
      <header className="site-header">
        <div className="header-content">
          <BrandMark />
          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
          </nav>
          <div className="header-tools">
            <button className="tool-button utility-tool" type="button" aria-label="Search"><MagnifyingGlass size={22} weight="bold" /></button>
            <button className="tool-button utility-tool" type="button" aria-label="Account"><User size={22} weight="bold" /></button>
            <button className="tool-button bag-tool" type="button" onClick={onCartOpen} aria-label={`Open selection, ${count} items`}>
              <Handbag size={23} weight="bold" />
              {count > 0 && <b>{count}</b>}
            </button>
            <button className="tool-button menu-tool" type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><List size={24} weight="bold" /></button>
          </div>
        </div>
      </header>
      <aside className={`mobile-menu ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen} inert={!menuOpen}>
        <div><BrandMark /><button className="tool-button" type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={24} /></button></div>
        <nav aria-label="Mobile navigation">
          {links.map(([label, href]) => <a key={label} href={href} onClick={() => setMenuOpen(false)}>{label}<ArrowRight size={18} /></a>)}
        </nav>
      </aside>
      {menuOpen && <button className="screen-shade menu-shade" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
    </>
  );
}

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-note left-note">SMALL<br />SURPRISES<br />BRIGHTER<br />DAYS <Heart size={22} weight="bold" /></div>
      <div className="hero-copy">
        <Sparkle className="pink-rays" size={34} weight="fill" aria-hidden="true" />
        <h1 id="hero-title">Mystery<br />Tableware Box</h1>
        <p>A little surprise for a happier table.</p>
        <button className="black-cta" type="button" onClick={() => scrollTo("boxes")}>Shop Mystery Boxes <ArrowRight size={22} weight="bold" /></button>
      </div>
      <div className="hero-image">
        <img src="/assets/design-prototype/source-backed/hero-mobile-v3.jpg" width="1448" height="1086" alt="Source-backed visualization of a tableware surprise box" fetchPriority="high" />
        <Star className="hero-star star-one" size={35} weight="fill" aria-hidden="true" />
        <Sparkle className="hero-star star-two" size={27} weight="fill" aria-hidden="true" />
      </div>
      <div className="hero-note right-note">SAME PIECE COUNT.<br />A DIFFERENT MIX. <Heart size={20} weight="fill" /></div>
    </section>
  );
}

function ValueStrip() {
  const values = [
    [Gift, "3 / 6 / 12 Pieces"],
    [DiamondsFour, "A Different Mix"],
    [ImagesSquare, "Possible Categories"],
    [Coffee, "A More Joyful Table"],
  ];
  return (
    <section className="value-strip" id="mobile-value-strip" aria-label="Mystery box overview">
      {values.map(([Icon, label]) => <div key={label}><Icon size={42} weight="regular" aria-hidden="true" /><span>{label}</span></div>)}
    </section>
  );
}

function BoxCard({ product, index, selected, onChoose }) {
  return (
    <button className={`box-card ${cardColors[index]} ${selected ? "selected" : ""}`} type="button" onClick={onChoose} aria-label={`Choose ${product.pieceCount} pieces`}>
      <TierArtwork index={index} count={product.pieceCount} />
      {selected && <span className="selected-check"><Check size={13} weight="bold" /> Selected</span>}
    </button>
  );
}

function BoxChooser({ selectedId, onChoose }) {
  return (
    <section className="chooser" id="mobile-boxes" aria-labelledby="chooser-title">
      <h2 id="chooser-title"><Sparkle size={24} weight="fill" aria-hidden="true" />Choose Your Box<Sparkle size={24} weight="fill" aria-hidden="true" /></h2>
      <div className="box-grid">
        {productTiers.map((product, index) => <BoxCard key={product.id} product={product} index={index} selected={selectedId === product.id} onChoose={() => onChoose(product)} />)}
      </div>
    </section>
  );
}

function UnboxingRow() {
  return (
    <section className="unboxing" id="mobile-unboxing" aria-labelledby="unboxing-title">
      <div className="unboxing-heading">
        <h2 id="unboxing-title">Real Box Examples <Sparkle size={20} weight="fill" aria-hidden="true" /></h2>
        <a href="https://source.example.test/reference" target="_blank" rel="noreferrer">View More <ArrowRight size={17} weight="bold" /></a>
      </div>
      <div className="unboxing-grid">
        {sourceBoxExamples.map((example, index) => (
          <figure key={example.id} aria-label={`Real seller box example ${index + 1}`}>
            <a href={example.href} target="_blank" rel="noreferrer"><img src={example.src} alt={`Real seller box example ${index + 1}`} width="640" height="853" /></a>
          </figure>
        ))}
      </div>
    </section>
  );
}

function SelectionDrawer({ item, quantity, onClose, onQuantity, onRemove }) {
  const drawerRef = useRef(null);
  const visualIndex = item ? productTiers.findIndex((product) => product.id === item.id) : 0;
  useEffect(() => {
    const previousFocus = document.activeElement;
    drawerRef.current?.querySelector('button')?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const buttons = [...drawerRef.current.querySelectorAll('button:not(:disabled), a[href]')];
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); previousFocus?.focus(); };
  }, []);

  return (
    <>
      <button className="screen-shade" type="button" onClick={onClose} aria-label="Close selection" />
      <aside ref={drawerRef} className="selection-drawer" role="dialog" aria-modal="true" aria-labelledby="selection-title">
        <header><div><small>YOUR CHOICE</small><h2 id="selection-title">Selection</h2></div><button className="tool-button" type="button" onClick={onClose} aria-label="Close selection"><X size={24} /></button></header>
        {item ? <div className="drawer-body">
          <div className={`drawer-preview ${cardColors[visualIndex]}`}><img src={`/assets/design-prototype/source-backed/tier-${item.pieceCount}-v1.jpg`} alt="Selected source-backed box visualization" width="1672" height="941" /></div>
          <h3>{item.title}</h3>
          <p>The exact colors and forms stay a surprise.</p>
          <strong>Price to be confirmed</strong>
          <div className="quantity"><span>Quantity</span><div><button type="button" onClick={() => onQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus size={16} /></button><b>{quantity}</b><button type="button" onClick={() => onQuantity(quantity + 1)} aria-label="Increase quantity"><Plus size={16} /></button></div></div>
          <button className="remove" type="button" onClick={onRemove}>Remove selection</button>
          <p className="drawer-disclosure"><Check size={19} /> Checkout opens only after pricing and policies are verified.</p>
          <button className="black-cta drawer-action" type="button" disabled>Checkout unavailable in prototype</button>
        </div> : <div className="drawer-empty"><Handbag size={38} /><h3>No box selected yet.</h3><p>Choose from the 3, 6, or 12-piece options.</p><button className="black-cta" type="button" onClick={() => { onClose(); scrollTo("boxes"); }}>See the boxes <ArrowRight size={18} /></button></div>}
      </aside>
    </>
  );
}

export function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [selectedId, setSelectedId] = useState(null);
  const [cartItem, setCartItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const route = getRoute(pathname === "/mystery-tableware-preview" ? "/cute" : pathname);
  const isCuteHome = route?.path === "/cute";

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    if (pathname === "/mystery-tableware-preview") currentUrl.pathname = "/cute";
    applyClientHead(document, currentUrl);
    const updatePathname = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", updatePathname);
    return () => window.removeEventListener("popstate", updatePathname);
  }, [pathname]);

  useEffect(() => {
    if (!isCuteHome) return;
    trackCommerce(commerceEventNames.viewItemList, productTiers, { item_list_id: "homepage_piece_count" });
  }, [isCuteHome]);

  function choose(product) {
    setSelectedId(product.id);
    setCartItem(product);
    setQuantity(1);
    setDrawerOpen(true);
    trackCommerce(commerceEventNames.selectItem, [product], { item_list_id: "homepage_piece_count" });
    trackCommerce(commerceEventNames.addToCart, [product]);
  }

  function openCart() {
    setDrawerOpen(true);
    if (cartItem) trackCommerce(commerceEventNames.viewCart, [cartItem]);
  }

  if (!isCuteHome) return (
    <div className="page">
      <ContentPage route={route} cartCount={cartItem ? quantity : 0} onCartOpen={openCart} onChoose={choose} />
      {drawerOpen && <SelectionDrawer item={cartItem} quantity={quantity} onClose={() => setDrawerOpen(false)} onQuantity={setQuantity} onRemove={() => { setCartItem(null); setQuantity(1); }} />}
    </div>
  );

  return (
    <div id="top" className="page">
      <ReferenceHomepage count={cartItem ? quantity : 0} selectedId={selectedId} onChoose={choose} onCartOpen={openCart} />
      <div className="mobile-storefront">
      <Header count={cartItem ? quantity : 0} onCartOpen={openCart} />
      <main>
        <Hero />
        <ValueStrip />
        <BoxChooser selectedId={selectedId} onChoose={choose} />
        <UnboxingRow />
      </main>
      </div>
      {drawerOpen && <SelectionDrawer item={cartItem} quantity={quantity} onClose={() => setDrawerOpen(false)} onQuantity={setQuantity} onRemove={() => { setCartItem(null); setQuantity(1); }} />}
    </div>
  );
}
