import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { AsterApp } from "./AsterApp.jsx";
import { getProductBySlug } from "./data/aster.js";
import { getRoute } from "./seo/routes.js";
import { redirectTarget } from "./seo/redirects.js";

const LegacyApp = lazy(() => import("./LegacyApp.jsx"));
const oldPath = window.location.pathname;
const redirect = redirectTarget(oldPath);
if (redirect) {
  window.history.replaceState(window.history.state, "", `${redirect}${window.location.search}${window.location.hash}`);
}
const path = window.location.pathname;
const route = getRoute(path);
const cuteRoute = route?.group === "cute";
const asterRoute =
  (["aster-cup", "aster-crystal", "aster-vertex"].includes(route?.type) || path === "/" ||
    path === "/shop" ||
    path === "/collections" ||
    path === "/search" ||
    path === "/about" ||
    path === "/shipping-returns" ||
    (path.startsWith("/products/") && getProductBySlug(path.split("/")[2])));

const container = document.getElementById("root");
const root = container.__asterReactRoot ?? createRoot(container);
container.__asterReactRoot = root;

root.render(
  <React.StrictMode>
    {asterRoute ? (
      <AsterApp />
    ) : cuteRoute ? (
      <Suspense fallback={null}>
        <LegacyApp />
      </Suspense>
    ) : (
      <main style={{ maxWidth: 720, margin: "12vh auto", padding: 24, fontFamily: "Inter, sans-serif" }}>
        <h1>Page not found</h1>
        <p>Return to Aster Edit to explore ceramic tableware.</p>
        <a href="/">Aster Edit home</a>
      </main>
    )}
  </React.StrictMode>,
);
