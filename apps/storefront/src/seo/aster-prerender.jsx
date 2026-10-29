import { renderToString } from "react-dom/server";
import { HomePage } from "../aster/HomePage.jsx";
import { CupPage } from "../aster/CupPage.jsx";
import { cupPath } from "../data/cup.js";
import { crystalPath } from "../data/crystal.js";
import { CrystalPage } from "../aster/CrystalPage.jsx";
import { vertexPath } from "../data/vertex-crystal.js";
import { VertexCrystalPage } from "../aster/VertexCrystalPage.jsx";
import { ShopPage } from "../aster/ShopPage.jsx";
import { CollectionsPage } from "../aster/CollectionsPage.jsx";
import { AboutPage } from "../aster/AboutPage.jsx";
import { ShippingReturnsPage } from "../aster/ShippingReturnsPage.jsx";
import { SeriesPage } from "../aster/SeriesPage.jsx";
import { Header, Footer } from "../aster/Shared.jsx";
import { getProductBySlug } from "../data/aster.js";

// Render the same components visitors use. No alternate crawler-only copy,
// browser storage, analytics, checkout requests or customer data at build time.
const idle = () => {};
const pages = {
  [cupPath]: CupPage,
  [crystalPath]: CrystalPage,
  [vertexPath]: VertexCrystalPage,
  "/": HomePage,
  "/shop": ShopPage,
  "/collections": CollectionsPage,
  "/about": AboutPage,
  "/shipping-returns": ShippingReturnsPage,
};

export function renderAsterPage(route) {
  const location = new URL(route.path, "https://asteredit.com");
  const Page = pages[route.path];
  const product = route.type === "aster-series"
    ? getProductBySlug(route.path.split("/")[2])
    : null;
  if (!Page && (!product || product.id === "wanxiang")) {
    throw new Error(`No full-page prerender for ${route.path}`);
  }
  return renderToString(
    <div className="aster-site" data-prerendered-content="full-page">
      <Header navigate={idle} cartCount={0} onCartOpen={idle} location={location} />
      {Page
        ? <Page navigate={idle} />
        : <SeriesPage product={product} navigate={idle} onAdd={idle} search="" />}
      <Footer navigate={idle} location={location} />
    </div>,
  );
}
