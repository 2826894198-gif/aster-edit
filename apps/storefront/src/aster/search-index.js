import { archivedSeries } from "../data/aster-series.js";
import { wanxiangProduct } from "../data/aster.js";
import { shopCollections } from "../data/aster-home.js";
import { cupProduct } from "../data/cup.js";
import { crystalProduct } from "../data/crystal.js";
import { vertexProduct } from "../data/vertex-crystal.js";

const seriesByPath = new Map(
  [...archivedSeries, wanxiangProduct].map((series) => [
    `/products/${series.slug}`,
    series,
  ]),
);

export const searchEntries = [
  {
    id: `product:${vertexProduct.id}`,
    kind: "Crystal glassware",
    title: vertexProduct.name,
    detail: `$${vertexProduct.price} USD / glass · Two forms · Six base colours`,
    image: vertexProduct.image,
    href: vertexProduct.path,
    terms: "vertex crystal glass glassware tumbler tall low sculpted square base red amber blue indigo violet purple green colour colored coloured",
  },
  {
    id: `product:${crystalProduct.id}`,
    kind: "Individual form",
    title: crystalProduct.name,
    detail: `${crystalProduct.price} USD · One crystal tumbler · 12 zodiac signs · Free shipping`,
    image: crystalProduct.image,
    href: crystalProduct.path,
    terms: "prism zodiac crystal tumbler glass glassware engraved engraving constellation horoscope gift aries taurus gemini cancer leo virgo libra scorpio sagittarius capricorn aquarius pisces 220ml faceted base",
  },
  {
    id: `product:${cupProduct.id}`,
    kind: "Individual form",
    title: cupProduct.name,
    detail: `$${cupProduct.price} USD · Three colours · Free shipping`,
    image: cupProduct.image,
    href: cupProduct.path,
    terms: "rolling bead ceramic cup mug purple-grey olive deep green fidget tactile sensory rotating thumb stress relief 400ml dishwasher",
  },
  ...shopCollections.map((collection) => ({
    id: `collection:${collection.id}`,
    kind: "Collection",
    title: collection.name,
    detail: `${collection.count} ${collection.count === 1 ? "form" : "forms"} · ${collection.description}`,
    image: collection.image,
    href: collection.path,
    terms: `${collection.name} ${seriesByPath.get(collection.path)?.legacyName || ""} ${collection.description} ${collection.kind}`,
  })),
  ...[...archivedSeries, wanxiangProduct].flatMap((series) =>
    [series.fullSet, ...series.items]
      .filter((piece) => piece && !piece.isComplimentaryGift)
      .map((piece) => ({
        id: `piece:${series.id}:${piece.id}`,
        kind: piece.id === "full-set" ? "Full set" : "Individual form",
        title: piece.name,
        detail: series.name,
        image: piece.selectorImage || piece.image,
        href: `/products/${series.slug}?piece=${encodeURIComponent(piece.id)}`,
        terms: `${piece.name} ${series.name} ${series.legacyName || ""} ${piece.dimensions || ""} ${piece.group || ""}`,
        unavailable: piece.availability === "out-of-stock-at-capture",
      })),
  ),
];

export function filterSearchEntries(query) {
  const tokens = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  return searchEntries.filter((entry) =>
    tokens.every((token) => entry.terms.toLocaleLowerCase().includes(token)),
  );
}
