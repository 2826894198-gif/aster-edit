import { useEffect, useState } from "react";
import {
  ArrowRight,
  Handbag,
  List,
  MagnifyingGlass,
  User,
  X,
} from "@phosphor-icons/react";
import { commerceLinks } from "./commerce.js";

const primaryLinks = [
  { label: "Home", href: "/" },
  { label: "The Cup", href: "/products/rolling-bead-ceramic-cup" },
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "About", href: "/about" },
];

export function SiteLink({ to, navigate, children, ...props }) {
  return (
    <a
      href={to}
      onClick={(event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        navigate(to);
      }}
      {...props}
    >
      {children}
    </a>
  );
}

export function Header({ navigate, cartCount, onCartOpen, location = window.location }) {
  const commerce = commerceLinks(location);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.activeElement;
    const menu = document.querySelector(".aster-mobile-menu");
    const focusables = [...menu.querySelectorAll("button, a[href]")];
    focusables[0]?.focus();
    document.body.style.overflow = "hidden";
    const trapTab = (event) => {
      if (event.key !== "Tab") return;
      if (event.shiftKey && document.activeElement === focusables[0]) {
        event.preventDefault();
        focusables.at(-1)?.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === focusables.at(-1)
      ) {
        event.preventDefault();
        focusables[0]?.focus();
      }
    };
    window.addEventListener("keydown", trapTab);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", trapTab);
      previous?.focus();
    };
  }, [menuOpen]);
  const go = (to) => {
    setMenuOpen(false);
    navigate(to);
  };
  return (
    <>
      <header className="aster-header">
        <div className="aster-header-inner">
          <SiteLink
            to="/"
            navigate={navigate}
            className="aster-wordmark"
            aria-label="Aster Edit home"
          >
            Aster Edit
          </SiteLink>
          <nav className="aster-nav" aria-label="Primary navigation">
            {primaryLinks.map((link) => (
              <SiteLink key={link.label} to={link.href} navigate={navigate}>
                {link.label}
              </SiteLink>
            ))}
            {commerce && <a href={commerce.orders}>Track an order</a>}
          </nav>
          <div className="aster-tools">
            <SiteLink to="/search" navigate={navigate} className="aster-search-link aster-tool-link" aria-label="Search products">
              <MagnifyingGlass size={19} weight="regular" />
            </SiteLink>
            {commerce && <a className="aster-account aster-tool-link" href={commerce.account} aria-label="Sign in or view account"><User size={19} weight="regular" /></a>}
            <button
              type="button"
              className="aster-bag"
              aria-label={`Open bag, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
              onClick={() => {
                setMenuOpen(false);
                onCartOpen();
              }}
            >
              <Handbag size={20} weight="regular" />
              {cartCount > 0 && <span>{cartCount}</span>}
            </button>
            <button
              type="button"
              className="aster-menu-button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => {
                setMenuOpen((open) => !open);
              }}
            >
              <List size={23} weight="regular" />
            </button>
          </div>
        </div>
      </header>
      {menuOpen && (
        <>
          <button
            className="aster-scrim"
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          />
          <nav className="aster-mobile-menu" aria-label="Mobile navigation">
            <div className="aster-mobile-menu-top">
              <span>Aster Edit</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>
            {commerce && <a href={commerce.orders}>Track an order</a>}
            {primaryLinks.map((link) => (
              <SiteLink key={link.label} to={link.href} navigate={go}>
                {link.label}
              </SiteLink>
            ))}
            <SiteLink to="/search" navigate={go}>Search products</SiteLink>
            {commerce && <a href={commerce.account}>My account</a>}
          </nav>
        </>
      )}
    </>
  );
}

export function SectionTitle({ eyebrow, title, action, to, navigate, level = 2 }) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div className="aster-section-heading">
      <div>
        {eyebrow && <p className="aster-eyebrow">{eyebrow}</p>}
        <Heading>{title}</Heading>
      </div>
      {action && (
        <SiteLink to={to} navigate={navigate} className="aster-text-link">
          {action}
          <ArrowRight size={17} />
        </SiteLink>
      )}
    </div>
  );
}

export function Footer({ navigate, location = window.location }) {
  const commerce = commerceLinks(location);
  const publicPolicies = ["asteredit.com", "www.asteredit.com"].includes(location.hostname);
  return (
    <footer className="aster-footer">
      <div className="aster-footer-inner">
        <div className="aster-footer-brand">
          <SiteLink to="/" navigate={navigate} className="aster-wordmark">
            Aster Edit
          </SiteLink>
          <p>Objects for a more considered table.</p>
        </div>
        <nav aria-label="Shop navigation">
          <strong>Shop</strong>
          <SiteLink to="/shop" navigate={navigate}>All Products</SiteLink>
          <SiteLink to="/shop" navigate={navigate}>Shop by Form</SiteLink>
          <SiteLink to="/collections" navigate={navigate}>Collections</SiteLink>
        </nav>
        <nav aria-label="Collections navigation">
          <strong>Collections</strong>
          <SiteLink to="/products/pale-ground-ivory-ceramics" navigate={navigate}>Pale Ground</SiteLink>
          <SiteLink to="/products/sunfold-fluted-ceramics" navigate={navigate}>Sunfold</SiteLink>
          <SiteLink to="/products/garden-shift-green-ceramics" navigate={navigate}>Garden Shift</SiteLink>
          <SiteLink to="/products/petal-haze-blue-ceramics" navigate={navigate}>Petal Haze</SiteLink>
          <SiteLink to="/products/open-tide-blue-plates" navigate={navigate}>Open Tide</SiteLink>
          <SiteLink to="/products/citrus-note-oval-plate" navigate={navigate}>Citrus Note</SiteLink>
          <SiteLink to="/products/waterline-blue-ceramics" navigate={navigate}>Waterline</SiteLink>
        </nav>
        <nav aria-label="About navigation">
          <strong>About</strong>
          <SiteLink to="/about" navigate={navigate}>Our Story</SiteLink>
          <SiteLink to="/about#approach" navigate={navigate}>Our Approach</SiteLink>
        </nav>
        <nav aria-label="Help navigation">
          <strong>Help</strong>
          {commerce && <><a href={commerce.account}>My account</a><a href={commerce.orders}>Track an order</a></>}
          <SiteLink to="/shipping-returns#aster-policy-shipping" navigate={navigate}>Shipping</SiteLink>
          <SiteLink to="/shipping-returns#aster-policy-returns" navigate={navigate}>Returns</SiteLink>
          <a href="mailto:support@example.test">Contact</a>
        </nav>
        <div className="aster-footer-right" id="footer-help">
          <strong>Customer care</strong>
          <p>Questions about a piece or order? Write to us directly.</p>
          <a className="aster-footer-contact" href="mailto:support@example.test">Email us <ArrowRight size={14} /></a>
        </div>
      </div>
      <div className="aster-footer-meta">
        <small>© {new Date().getFullYear()} Aster Edit. All rights reserved.</small>
        <div><SiteLink to="/shipping-returns" navigate={navigate}>Shipping &amp; returns</SiteLink>{publicPolicies && <><a href="https://commerce.example.test/terms-and-conditions/">Store terms</a><a href="https://commerce.example.test/privacy-policy/">Privacy</a></>}<a href="mailto:support@example.test">Contact</a></div>
      </div>
    </footer>
  );
}
