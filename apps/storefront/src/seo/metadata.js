import { getCommerceReadiness, productTiers } from "../domain/catalog.js";
import { getRoute } from "./routes.js";
import { siteConfig } from "./site-config.js";
import { cupPath, cupProduct } from "../data/cup.js";
import { vertexPath, vertexProduct, vertexForms, vertexColours, vertexImageAssets } from "../data/vertex-crystal.js";
import { crystalPath, crystalProduct, crystalSigns, crystalImageAssets, crystalProducts } from "../data/crystal.js";
import { getProductBySlug } from "../data/aster.js";
import { homeCollections } from "../data/aster-home.js";

const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "ttclid",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term",
]);
const FILTER_PARAMS = new Set(["category", "piece_count", "sort"]);

export function getQueryPolicy(input) {
  const url = input instanceof URL ? input : new URL(input, siteConfig.origin);
  const unsupported = [];
  let hasFilter = false;
  let page = null;

  for (const [key, value] of url.searchParams) {
    if (url.pathname.replace(/\/+$/, "") === crystalPath && (
      (key === "sign" && crystalSigns.some((item) => item.id === value)) ||
      (key === "view" && ["glass", "engraving", "in-hand"].includes(value))
    )) continue;
    if (url.pathname.replace(/\/+$/, "") === vertexPath && (
      (key === "form" && vertexForms.some((item) => item.id === value)) ||
      (key === "colour" && vertexColours.some((item) => item.id === value)) ||
      (key === "view" && ["front", "side"].includes(value))
    )) continue;
    if (TRACKING_PARAMS.has(key)) continue;
    if (FILTER_PARAMS.has(key)) {
      hasFilter = true;
      continue;
    }
    if (key === "page" && /^\d+$/.test(value) && Number(value) > 1) {
      page = Number(value);
      continue;
    }
    unsupported.push(key);
  }

  const normalizedPath = url.pathname !== "/" ? url.pathname.replace(/\/+$/, "") : "/";
  const canonical = new URL(normalizedPath, siteConfig.origin);
  if (page && !hasFilter && !unsupported.length) canonical.searchParams.set("page", String(page));

  return Object.freeze({
    canonicalPath: `${canonical.pathname}${canonical.search}`,
    indexable: !hasFilter && unsupported.length === 0,
    unsupported: Object.freeze([...new Set(unsupported)]),
  });
}

export function isRouteReadyForIndexing(route) {
  if (route.type !== "product") return route.readyForIndexing;
  const product = productTiers.find((item) => item.id === route.productId);
  return Boolean(product && getCommerceReadiness(product).ready);
}

export function getPageMetadata(pathname, { publicationMode = "prototype" } = {}) {
  const route = getRoute(pathname);
  if (!route) return null;

  return Object.freeze({
    ...route,
    canonicalUrl: new URL(route.path, siteConfig.origin).href,
    robots: publicationMode === "production" && isRouteReadyForIndexing(route)
      ? "index,follow"
      : "noindex,nofollow",
    openGraph: Object.freeze({
      type: route.type === "product" ? "product" : "website",
      title: route.title,
      description: route.description,
      url: new URL(route.path, siteConfig.origin).href,
      locale: siteConfig.defaultLocale.replace("-", "_"),
      siteName: route.group === "cute" ? "surprise." : siteConfig.siteName,
      image: route.group === "aster" ? new URL(getSocialImage(route), siteConfig.origin).href : null,
      ...(route.path === vertexPath ? { imageAlt: vertexImageAssets[0].alt, imageWidth: 1254, imageHeight: 1254, imageType: "image/webp", twitterCard: "summary_large_image" } : {}),
      ...(route.path === crystalPath ? { imageAlt: crystalImageAssets[0].alt, imageWidth: 1073, imageHeight: 1466, imageType: "image/webp", twitterCard: "summary_large_image" } : {}),
    }),
  });
}

export function getSocialImage(route) {
  if (route.path === vertexPath) return vertexProduct.image;
  if (route.path === crystalPath) return crystalProduct.image;
  if (route.path === cupPath) return cupProduct.image;
  if (route.path === "/") return "/images/aster/cup-preview/cup-hero-desktop-v1.webp";
  if (route.path === "/about") return "/images/aster/home-prototype/about-hero-real-v2.jpg";
  const product = route.productId ? getProductBySlug(route.path.split("/")[2]) : null;
  return product?.image || homeCollections[0].image;
}

export function getProductStructuredData(product) {
  if (!getCommerceReadiness(product).ready) return null;

  const toDays = (window) => ({
    "@type": "QuantitativeValue",
    minValue: window.minDays,
    maxValue: window.maxDays,
    unitCode: "DAY",
  });

  return {
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.map((image) => new URL(image.url, siteConfig.origin).href),
    sku: product.id,
    offers: {
      "@type": "Offer",
      url: `${siteConfig.origin}${product.url}`,
      priceCurrency: product.pricing.currency,
      price: (product.pricing.priceMinor / 100).toFixed(2),
      itemCondition: `https://schema.org/${product.specifications.condition}`,
      availability: `https://schema.org/${product.inventory.availability}`,
      shippingDetails: product.shipping.markets.map((country) => ({
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: (product.shipping.costMinor / 100).toFixed(2),
          currency: product.pricing.currency,
        },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: country },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: toDays(product.shipping.handlingWindow),
          transitTime: toDays(product.shipping.transitWindow),
        },
      })),
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: product.returns.applicableCountries,
        returnPolicyCategory: `https://schema.org/${product.returns.policyCategory}`,
        merchantReturnDays: product.returns.windowDays,
        returnMethod: `https://schema.org/${product.returns.method}`,
        returnFees: `https://schema.org/${product.returns.fees}`,
        merchantReturnLink: `${siteConfig.origin}${product.returns.policyUrl}`,
      },
    },
  };
}

export function getStructuredData(route) {
  if (route.group === "aster") {
    const pageId = `${siteConfig.origin}${route.path}#webpage`;
    const graph = [
      {
        "@type": "Organization",
        "@id": `${siteConfig.origin}/#organization`,
        name: "Aster Edit",
        url: `${siteConfig.origin}/`,
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.origin}/#website`,
        url: `${siteConfig.origin}/`,
        name: "Aster Edit",
        inLanguage: siteConfig.defaultLocale,
        publisher: { "@id": `${siteConfig.origin}/#organization` },
      },
      {
        "@type": ["aster-crystal", "aster-vertex"].includes(route.type) ? "ItemPage" : route.type === "aster-series" || route.type === "aster-collections" || route.type === "aster-shop"
          ? "CollectionPage"
          : route.path === "/about" ? "AboutPage" : "WebPage",
        "@id": pageId,
        url: `${siteConfig.origin}${route.path}`,
        name: route.title,
        description: route.description,
        isPartOf: { "@id": `${siteConfig.origin}/#website` },
        inLanguage: siteConfig.defaultLocale,
        ...(["/", "/shop", "/collections", "/about", cupPath, crystalPath, vertexPath].includes(route.path)
          ? { primaryImageOfPage: { "@type": "ImageObject", url: new URL(getSocialImage(route), siteConfig.origin).href } }
          : {}),
      },
    ];
    if (route.path === crystalPath) {
      const productId = `${siteConfig.origin}${crystalPath}#product`;
      graph[2].mainEntity = { "@id": productId };
      graph.push({
        "@type": "ProductGroup", "@id": productId,
        name: crystalProduct.name, description: crystalProduct.description,
        url: new URL(crystalPath, siteConfig.origin).href,
        material: "Crystal", productGroupID: crystalProduct.id,
        variesBy: ["https://schema.org/pattern"],
        image: new URL(crystalProduct.image, siteConfig.origin).href,
        hasVariant: crystalProducts.map((product) => ({
          "@type": "Product", "@id": `${productId}-${product.signId}`,
          name: product.name, description: product.description, sku: product.sku,
          pattern: product.pattern, material: "Crystal",
          image: new URL(product.image, siteConfig.origin).href,
          isVariantOf: { "@id": productId },
          offers: { "@type": "Offer", url: new URL(product.path, siteConfig.origin).href,
            price: product.price.toFixed(2), priceCurrency: product.currency,
            availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition" },
        })),
      });
      const galleryId = `${siteConfig.origin}${crystalPath}#photographs`;
      graph[2].hasPart = { "@id": galleryId };
      const media = crystalImageAssets.map((image, index) => ({
        "@type": "ImageObject",
        "@id": `${siteConfig.origin}${crystalPath}#image-${index + 1}`,
        contentUrl: new URL(image.src, siteConfig.origin).href,
        url: new URL(image.src, siteConfig.origin).href,
        name: image.label,
        caption: image.alt,
        width: image.width,
        height: image.height,
        encodingFormat: image.src.endsWith(".jpg") ? "image/jpeg" : "image/webp",
      }));
      graph.push({
        "@type": "ImageGallery", "@id": galleryId,
        name: "Prism zodiac crystal tumbler form and details",
        description: "The shared glass form, an actual Taurus base detail, a hand-held scale photograph, a drink scene and a table setting. Selected zodiac previews are labeled AI-generated on the page.",
        isPartOf: { "@id": pageId },
        associatedMedia: media.map((image) => ({ "@id": image["@id"] })),
      }, ...media);
    }
    if (route.path === vertexPath) {
      const galleryId = `${siteConfig.origin}${vertexPath}#photographs`;
      graph[2].hasPart = { "@id": galleryId };
      const images = vertexImageAssets.map((image, index) => ({
        "@type": "ImageObject", "@id": `${galleryId}-${index + 1}`,
        contentUrl: new URL(image.src, siteConfig.origin).href,
        name: image.label, caption: image.alt, width: image.width, height: image.height,
        encodingFormat: "image/webp",
      }));
      graph.push({ "@type": "ImageGallery", "@id": galleryId,
        name: "Vertex crystal glass forms and base colours",
        isPartOf: { "@id": pageId },
        associatedMedia: images.map((image) => ({ "@id": image["@id"] })),
      }, ...images);
    }
    if (["/shop", "/collections"].includes(route.path)) {
      graph[2].mainEntity = {
        "@type": "ItemList",
        itemListElement: [...homeCollections, ...(route.path === "/shop" ? [cupProduct, crystalProduct, vertexProduct] : [])].map((collection, index) => ({
          "@type": "ListItem", position: index + 1,
          name: collection.name, url: new URL(collection.path, siteConfig.origin).href,
        })),
      };
    }
    if (route.path !== "/") {
      const parents = ["aster-crystal", "aster-vertex"].includes(route.type)
        ? [{ name: "Shop", path: "/shop" }]
        : route.type === "aster-series"
        ? [{ name: "Collections", path: "/collections" }]
        : [];
      graph.push({
        "@type": "BreadcrumbList",
        itemListElement: [
          { name: "Home", path: "/" },
          ...parents,
          { name: route.title, path: route.path },
        ].map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: new URL(item.path, siteConfig.origin).href,
        })),
      });
    }
    return Object.freeze({ "@context": "https://schema.org", "@graph": graph });
  }

  const nodes = [
    {
      "@type": "WebSite",
      "@id": `${siteConfig.origin}/cute#website`,
      url: `${siteConfig.origin}/cute`,
      name: "surprise.",
      inLanguage: siteConfig.defaultLocale,
    },
  ];

  if (route.path !== "/cute") {
    const breadcrumbItems = [
      { name: "Cute", path: "/cute" },
      ...(route.type === "product"
        ? [{ name: "Mystery Tableware Box Collection", path: "/collections/mystery-tableware-box" }]
        : []),
      { name: route.title, path: route.path },
    ];
    nodes.push({
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: new URL(item.path, siteConfig.origin).href,
        })),
    });
  }

  if (route.type === "product") {
    const product = productTiers.find((item) => item.id === route.productId);
    const productNode = getProductStructuredData(product);
    if (productNode) nodes.push(productNode);
  }

  return Object.freeze({
    "@context": "https://schema.org",
    "@graph": nodes,
  });
}
