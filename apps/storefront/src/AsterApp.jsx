import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { edits, getProductBySlug } from "./data/aster.js";
import { Header, Footer } from "./aster/Shared.jsx";
import { HomePage } from "./aster/HomePage.jsx";
import { CupPage } from "./aster/CupPage.jsx";
import { cupPath } from "./data/cup.js";
import { crystalPath } from "./data/crystal.js";
import { CrystalPage } from "./aster/CrystalPage.jsx";
import { vertexPath } from "./data/vertex-crystal.js";
import { VertexCrystalPage } from "./aster/VertexCrystalPage.jsx";
import { AboutPage } from "./aster/AboutPage.jsx";
import { ProductPage } from "./aster/ProductPage.jsx";
import { WanxiangPage } from "./aster/WanxiangPage.jsx";
import { SeriesPage } from "./aster/SeriesPage.jsx";
import { ShopPage } from "./aster/ShopPage.jsx";
import { CollectionsPage } from "./aster/CollectionsPage.jsx";
import { SearchPage } from "./aster/SearchPage.jsx";
import { ShippingReturnsPage } from "./aster/ShippingReturnsPage.jsx";
import { CartDrawer } from "./aster/CartDrawer.jsx";
import { BAG_STORAGE_KEY, restoreBag, serializeBag, commerceConfig, requestCheckout } from "./aster/commerce.js";
import { trackAsterEvent, asterSource } from "./analytics/aster-geo.js";
import { applyClientHead } from "./seo/client-head.js";
import "./styles/aster.css";

function usePathname() {
  const [location, setLocation] = useState(() => ({
    href: window.location.href,
    scroll: window.location.hash || null,
  }));
  useEffect(() => {
    // Let the browser restore the saved position on Back / Forward.
    const onPop = () => setLocation({ href: window.location.href, scroll: null });
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = (to) => {
    const target = new URL(to, window.location.href);
    if (target.href !== window.location.href) window.history.pushState({}, "", target.pathname + target.search + target.hash);
    setLocation({ href: window.location.href, scroll: target.hash || "top" });
  };
  useLayoutEffect(() => {
    if (!location.scroll) return;
    // Run after the destination DOM commits, before paint. Explicit instant
    // scrolling avoids inheriting html's smooth-scroll animation across pages.
    if (location.scroll === "top") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } else {
      document.getElementById(location.scroll.slice(1))?.scrollIntoView({
        block: "start",
        behavior: "instant",
      });
    }
  }, [location]);
  return [new URL(location.href).pathname, navigate, location.href];
}

export function AsterApp() {
  const [pathname, navigate, href] = usePathname();
  const [items, setItems] = useState(() => {
    try {
      return restoreBag(window.localStorage.getItem(BAG_STORAGE_KEY));
    } catch {
      return [];
    }
  });
  const [bagSaved, setBagSaved] = useState(true);
  useEffect(() => {
    try {
      window.localStorage.setItem(BAG_STORAGE_KEY, serializeBag(items));
      setBagSaved(true);
    } catch {
      setBagSaved(false);
    }
  }, [items]);
  const [cartOpen, setCartOpen] = useState(() => window.location.hash === "#bag");
  const closeCart = useCallback(() => {
    setCartOpen(false);
    if (window.location.hash === "#bag") {
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
  }, []);
  useEffect(() => {
    const syncBagLink = () => {
      if (window.location.hash === "#bag") setCartOpen(true);
    };
    window.addEventListener("hashchange", syncBagLink);
    window.addEventListener("popstate", syncBagLink);
    window.addEventListener("pageshow", syncBagLink);
    return () => {
      window.removeEventListener("hashchange", syncBagLink);
      window.removeEventListener("popstate", syncBagLink);
      window.removeEventListener("pageshow", syncBagLink);
    };
  }, []);
  const product = pathname.startsWith("/products/")
    ? getProductBySlug(pathname.split("/")[2])
    : null;
  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );
  const addToCart = (item, edit = edits[1], quantity = 1) => {
    const key = `${item.id}:${edit?.id ?? "none"}`;
    setItems((current) => {
      const found = current.some((entry) => entry.key === key);
      return found
        ? current.map((entry) =>
            entry.key === key
              ? { ...entry, quantity: Math.min(20, entry.quantity + quantity) }
              : entry,
          )
        : [...current, { key, product: item, edit, quantity }];
    });
    trackAsterEvent("add_to_cart", item, quantity);
    setCartOpen(true);
  };
  const buyNow = async (product, quantity, signal) => {
    const row = { key: `${product.id}:none`, product, edit: null, quantity };
    // Keep the existing bag and retain this selection if checkout cannot open.
    // A retry must not add another copy of the same requested quantity.
    setItems((current) => current.some((item) => item.key === row.key)
      ? current.map((item) => item.key === row.key ? { ...item, quantity: Math.max(item.quantity, quantity) } : item)
      : [...current, row]);
    const url = await requestCheckout([row], commerceConfig(window.location), fetch, signal, asterSource());
    if (!signal.aborted) window.location.assign(url);
  };
  useEffect(() => {
    if (pathname === "/shop" || pathname === "/collections") {
      trackAsterEvent("view_item_list");
    }
  }, [pathname]);
  useEffect(() => {
    if (cartOpen) trackAsterEvent("view_cart");
  }, [cartOpen]);
  useEffect(() => {
    applyClientHead(document, window.location.href, {
      publicationMode: import.meta.env.VITE_PUBLICATION_MODE === "production"
        ? "production"
        : "prototype",
    });
  }, [href]);
  return (
    <div className="aster-site">
      <Header
        navigate={navigate}
        cartCount={cartCount}
        onCartOpen={() => setCartOpen(true)}
      />
      {pathname.replace(/\/+$/, "") === vertexPath ? (
        <VertexCrystalPage navigate={navigate} onAdd={addToCart} onBuy={buyNow} />
      ) : pathname.replace(/\/+$/, "") === crystalPath ? (
        <CrystalPage navigate={navigate} onAdd={addToCart} onBuy={buyNow} />
      ) : pathname === cupPath ? (
        <CupPage navigate={navigate} onAdd={addToCart} onBuy={buyNow} />
      ) : pathname === "/shop" ? (
        <ShopPage navigate={navigate} />
      ) : pathname === "/collections" ? (
        <CollectionsPage navigate={navigate} />
      ) : pathname === "/search" ? (
        <SearchPage navigate={navigate} />
      ) : pathname === "/shipping-returns" ? (
        <ShippingReturnsPage navigate={navigate} />
      ) : pathname === "/about" ? (
        <AboutPage navigate={navigate} />
      ) : product ? (
        product.id === "wanxiang" ? (
          <WanxiangPage
            key={product.id}
            product={product}
            navigate={navigate}
            onAdd={addToCart}
          />
        ) : product.kind === "archived-series" ? (
          <SeriesPage
            key={product.id}
            product={product}
            navigate={navigate}
            onAdd={addToCart}
          />
        ) : (
          <ProductPage
            key={product.id}
            product={product}
            navigate={navigate}
            onAdd={addToCart}
          />
        )
      ) : (
        <HomePage navigate={navigate} onAdd={addToCart} />
      )}
      <Footer navigate={navigate} />
      {cartOpen && (
        <CartDrawer
          items={items}
          bagSaved={bagSaved}
          setItems={setItems}
          onClose={closeCart}
          navigate={navigate}
        />
      )}
    </div>
  );
}
