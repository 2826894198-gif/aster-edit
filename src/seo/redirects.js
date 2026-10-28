import { archivedSeries } from "../data/aster-series.js";
import { wanxiangProduct } from "../data/aster.js";

export const routeRedirects = Object.freeze({
  "/mystery-tableware-preview": "/cute",
  ...Object.fromEntries(
    [...archivedSeries, wanxiangProduct].map((series) => [
      `/products/${series.legacySlug}`,
      `/products/${series.slug}`,
    ]),
  ),
});

export const redirectTarget = (pathname) => routeRedirects[pathname] ?? null;
