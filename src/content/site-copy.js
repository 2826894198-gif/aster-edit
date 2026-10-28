import { cupPrice } from "../data/cup.js";
import { vertexPath, vertexProduct, vertexSeo, vertexQuestions } from "../data/vertex-crystal.js";
import { getProductBySlug as getAsterProduct } from "../data/aster.js";
import { crystalPath, crystalProduct, crystalSeo, crystalQuestions } from "../data/crystal.js";

const CATEGORIES = Object.freeze([
  Object.freeze({
    key: "plates",
    label: "Plates",
    note: "A possible category, not a promised item.",
  }),
  Object.freeze({
    key: "bowls",
    label: "Bowls",
    note: "A possible category, not a promised item.",
  }),
  Object.freeze({
    key: "mugs",
    label: "Mugs",
    note: "A possible category, not a promised item.",
  }),
  Object.freeze({
    key: "cups",
    label: "Cups",
    note: "A possible category, not a promised item.",
  }),
  Object.freeze({
    key: "serveware",
    label: "Serveware",
    note: "A possible category, not a promised item.",
  }),
]);

export const possibleContentCategories = CATEGORIES;

export const editorialTopics = Object.freeze([
  "What is a tableware mystery box?",
  "Are dinnerware mystery boxes worth it?",
  "What can be inside a tableware mystery box?",
  "Mystery box gift guide",
  "How to mix mismatched tableware",
  "Ceramic care and dishwasher guidance",
  "Real unboxing stories",
  "3-piece vs 6-piece vs 12-piece comparison",
]);

const staticPageCopy = Object.freeze({
  "/": Object.freeze({
    eyebrow: "ASTER EDIT",
    title: "Curated Ceramic Tableware | Aster Edit",
    description:
      "Explore individually chosen ceramic bowls, plates and serving pieces by form, colour and scale. Build a table that feels collected over time.",
    h1: "A table collected over time.",
    intro:
      "Explore ceramic tableware through individual forms, considered collections and the relationships between pieces.",
    sections: Object.freeze([
      Object.freeze({
        heading: "Begin with one piece",
        paragraphs: Object.freeze([
          "Compare bowls, plates, cups and serving pieces by shape, size and surface before finding the pieces that belong together on your table.",
        ]),
      }),
      Object.freeze({
        heading: "Explore the collections",
        paragraphs: Object.freeze([
          "Each collection brings related ceramic forms into a coherent visual language while keeping individual pieces easy to choose.",
        ]),
      }),
    ]),
    primaryAction: Object.freeze({ href: "/shop", label: "Shop tableware" }),
    relatedLinks: Object.freeze([
      Object.freeze({ href: "/collections", label: "Explore collections" }),
      Object.freeze({ href: "/about", label: "About Aster Edit" }),
    ]),
  }),
  "/cute": Object.freeze({
    eyebrow: "MYSTERY TABLEWARE BOX",
    title: "Cute Mystery Box Preview",
    description:
      "Explore the surprise. cute-style tableware mystery box preview in 3, 6, and 12 pieces. This visual concept remains a draft until products and purchase terms are verified.",
    h1: "Tableware Mystery Boxes",
    intro:
      "Choose a piece-count format, then explore the categories that may shape a future tableware mystery box.",
    sections: Object.freeze([
      Object.freeze({
        heading: "Choose the format first",
        paragraphs: Object.freeze([
          "The prototype currently maps three formats: 3, 6, and 12 pieces. A piece count helps compare the scale of an assortment without claiming a final SKU mix.",
        ]),
      }),
      Object.freeze({
        heading: "See examples before terms are published",
        paragraphs: Object.freeze([
          "Plates, bowls, mugs, cups, and serveware are shown as possible categories from an authorized source set. They are not a confirmed packing list for any tier.",
        ]),
      }),
    ]),
    primaryAction: Object.freeze({
      href: "/collections/mystery-tableware-box",
      label: "Compare piece-count formats",
    }),
    relatedLinks: Object.freeze([
      Object.freeze({
        href: "/pages/how-it-works",
        label: "How the format works",
      }),
      Object.freeze({
        href: "/pages/what-could-be-inside",
        label: "Possible contents",
      }),
    ]),
  }),
  "/shop": Object.freeze({
    eyebrow: "CERAMIC TABLEWARE",
    title: "Shop the Archive | Aster Edit",
    description:
      "Browse Aster Edit ceramic bowls, plates, cups and serving pieces by collection. Compare individual forms and sizes before choosing.",
    h1: "Shop the Archive",
    intro:
      "Browse the confirmed product-line structure, then open a series to compare its individual forms and sizes.",
    sections: Object.freeze([
      Object.freeze({
        heading: "Compare by form",
        paragraphs: Object.freeze([
          "Browse the five ceramic collections and the focused oval-plate object study, then compare the individual forms inside each line.",
        ]),
      }),
      Object.freeze({
        heading: "Choose with context",
        paragraphs: Object.freeze([
          "Each series page brings the available forms, dimensions, prices and visual details into one place so you can choose a specific piece.",
        ]),
      }),
    ]),
    primaryAction: Object.freeze({ href: "/shop", label: "Browse all series" }),
    relatedLinks: Object.freeze([
      Object.freeze({ href: "/", label: "Return to Aster Edit" }),
    ]),
  }),
  "/collections": Object.freeze({
    eyebrow: "THE ASTER EDIT ARCHIVE",
    title: "Collections | Aster Edit",
    description: "Explore Aster Edit ceramic collections by form, proportion and surface, then compare the individually mapped pieces in each series.",
    h1: "Collections",
    intro: "Explore each series by its forms, proportions and surface. Choose a collection to compare its individual pieces.",
    sections: Object.freeze([
      Object.freeze({
        heading: "Six launch series",
        paragraphs: Object.freeze(["The six mapped launch series each have their own product-detail page and individual form choices."]),
      }),
      Object.freeze({
        heading: "Object study",
        paragraphs: Object.freeze(["Citrus Note focuses on one orange-speckled oval plate with its own page and details."]),
      }),
    ]),
    primaryAction: Object.freeze({ href: "/shop", label: "Shop all products" }),
    relatedLinks: Object.freeze([Object.freeze({ href: "/search", label: "Search products" })]),
  }),
  "/search": Object.freeze({
    eyebrow: "PRODUCT FINDER",
    title: "Search Products | Aster Edit",
    description: "Search Aster Edit collections and individual ceramic forms by name, colour, size or product type to find the right series and piece.",
    h1: "Find your next piece.",
    intro: "Search collection names, individual forms and sizes in the Aster Edit archive.",
    sections: Object.freeze([
      Object.freeze({
        heading: "Search the archive",
        paragraphs: Object.freeze(["Use the search field to find collections, bowls, plates, cups and other mapped forms."]),
      }),
    ]),
    primaryAction: Object.freeze({ href: "/collections", label: "Browse collections" }),
    relatedLinks: Object.freeze([Object.freeze({ href: "/shop", label: "Shop all products" })]),
  }),
  "/about": Object.freeze({
    eyebrow: "ABOUT ASTER EDIT",
    title: "About Aster Edit | Considered Ceramic Tableware",
    description:
      "Learn how Aster Edit helps you build a more considered table through form, surface, proportion and everyday use.",
    h1: "A table assembled by relationship, not sameness.",
    intro:
      "Aster Edit helps you build a table with a point of view, one considered object at a time.",
    sections: Object.freeze([
      Object.freeze({
        heading: "A little less noise around the table",
        paragraphs: Object.freeze([
          "We make the path from liking one piece to understanding where it belongs feel more intuitive, without forcing every object into a matching set.",
        ]),
      }),
      Object.freeze({
        heading: "How we edit",
        paragraphs: Object.freeze([
          "We look at form, surface, proportion and daily use, then connect individual objects into collections that can grow with a home.",
        ]),
      }),
    ]),
    primaryAction: Object.freeze({
      href: "/shop",
      label: "Explore the archive",
    }),
    relatedLinks: Object.freeze([
      Object.freeze({ href: "/shop", label: "Browse the archive" }),
      Object.freeze({
        href: "/#collection-library",
        label: "View the collection library",
      }),
    ]),
  }),
  "/shipping-returns": Object.freeze({
    eyebrow: "HELP",
    title: "Shipping & Returns | Aster Edit",
    description:
      "Review Aster Edit's $30 international shipping charge below a $150 merchandise subtotal, automatic free shipping at $150, and applicable customer return rights.",
    h1: "Shipping & Returns",
    intro:
      "Delivery charges and any taxes collected by us are shown before an order is placed. Available destinations are confirmed at checkout.",
    sections: Object.freeze([
      Object.freeze({
        heading: "Shipping",
        paragraphs: Object.freeze([
          "International shipping is $30 below a $150 merchandise subtotal after discounts and before shipping and taxes. At $150 or more, shipping is free. Import or carrier charges may apply according to the destination and delivery terms.",
        ]),
      }),
      Object.freeze({
        heading: "Returns and exchanges",
        paragraphs: Object.freeze([
          "Discretionary exchanges are not offered for used tableware. Applicable online cancellation rights and remedies for faulty, damaged or incorrectly described items remain available.",
        ]),
      }),
    ]),
    primaryAction: Object.freeze({ href: "/shop", label: "Back to the collection" }),
    relatedLinks: Object.freeze([
      Object.freeze({ href: "/shop", label: "Browse the archive" }),
    ]),
  }),
  "/collections/mystery-tableware-box": Object.freeze({
    eyebrow: "COLLECTION OVERVIEW",
    title: "Mystery Tableware Box Collection",
    description:
      "Compare 3-, 6-, and 12-piece mystery tableware box formats. Each remains a draft until its contents, availability, and commercial terms are verified.",
    h1: "Choose Your Mystery Tableware Box",
    intro:
      "Start with the piece count that fits the moment. The exact colors and forms stay a surprise.",
    sections: Object.freeze([
      Object.freeze({
        heading: "Three ways to compare",
        paragraphs: Object.freeze([
          "Use the piece count to decide the scale that may fit your table or gifting idea. The count does not establish the shapes, colors, condition, or exact combination in a future box.",
        ]),
      }),
      Object.freeze({
        heading: "What is still being verified",
        paragraphs: Object.freeze([
          "Every tier still needs a sourced SKU model, pricing, availability, shipping markets and timing, return terms, and product-specific image authorization before it can become active.",
        ]),
      }),
    ]),
    primaryAction: Object.freeze({
      href: "/pages/what-could-be-inside",
      label: "Explore possible categories",
    }),
    relatedLinks: Object.freeze([
      Object.freeze({
        href: "/pages/how-it-works",
        label: "How the mystery-box format works",
      }),
      Object.freeze({
        href: "/pages/shipping-returns",
        label: "Shipping and returns status",
      }),
    ]),
  }),
  "/pages/how-it-works": Object.freeze({
    eyebrow: "FORMAT GUIDE",
    title: "How Tableware Mystery Boxes Work",
    description:
      "Learn how to compare a tableware mystery box by piece count, understand possible categories, and see which purchase terms must be confirmed before sale.",
    h1: "How Tableware Mystery Boxes Work",
    intro:
      "A mystery box begins with a clear choice about scale and an honest boundary around what has not yet been confirmed.",
    sections: Object.freeze([
      Object.freeze({
        heading: "1. Start with a piece count",
        paragraphs: Object.freeze([
          "The current prototype uses 3-, 6-, and 12-piece formats. They make it easier to compare assortment size without inventing a value ladder or a final price.",
        ]),
      }),
      Object.freeze({
        heading: "2. Treat the mix as a surprise",
        paragraphs: Object.freeze([
          "Possible categories can be shown in advance, but no category, color, form, or quantity is assigned to a specific tier until sourcing and packing are confirmed.",
        ]),
      }),
      Object.freeze({
        heading: "3. Publish purchase terms only when they are real",
        paragraphs: Object.freeze([
          "A future active product must show its price, inventory state, delivery coverage and timing, return eligibility, and authorized product images. Until then, checkout stays unavailable.",
        ]),
      }),
    ]),
    primaryAction: Object.freeze({
      href: "/collections/mystery-tableware-box",
      label: "Compare the three formats",
    }),
    relatedLinks: Object.freeze([
      Object.freeze({
        href: "/pages/what-could-be-inside",
        label: "What could be inside",
      }),
      Object.freeze({
        href: "/pages/shipping-returns",
        label: "Shipping and returns status",
      }),
    ]),
  }),
  "/pages/what-could-be-inside": Object.freeze({
    eyebrow: "POSSIBLE CONTENTS",
    title: "What Can Be Inside a Tableware Mystery Box?",
    description:
      "See the plates, bowls, mugs, cups, and serveware that may inform a tableware mystery box. These authorized examples do not confirm a future SKU mix.",
    h1: "What Can Be Inside a Tableware Mystery Box?",
    intro:
      "The current source set shows the kinds of tabletop pieces that may inform future boxes—not a guaranteed inventory list.",
    sections: Object.freeze([
      Object.freeze({
        heading: "Possible categories",
        paragraphs: Object.freeze([
          "The reference set includes plates, bowls, mugs, cups, and serveware. Individual examples are useful for showing category range, but they are not assigned to a 3-, 6-, or 12-piece SKU.",
        ]),
      }),
      Object.freeze({
        heading: "What these examples do not establish",
        paragraphs: Object.freeze([
          "They do not prove current stock, commercial image rights for a listing, item condition, final combinations, or the exact product a customer would receive.",
        ]),
      }),
    ]),
    primaryAction: Object.freeze({
      href: "/collections/mystery-tableware-box",
      label: "Compare piece-count formats",
    }),
    relatedLinks: Object.freeze([
      Object.freeze({
        href: "/pages/how-it-works",
        label: "How the format works",
      }),
      Object.freeze({
        href: "/blogs/table-stories",
        label: "Read Table Stories",
      }),
    ]),
  }),
  "/pages/shipping-returns": Object.freeze({
    eyebrow: "POLICY STATUS",
    title: "Mystery Tableware Box Shipping & Returns",
    description:
      "Check the current shipping and returns status for mystery tableware boxes. Delivery markets, costs, timing, and return terms are not published until verified.",
    h1: "Shipping and Returns for Mystery Tableware Boxes",
    intro:
      "Shipping and return details must match the active product, not a prototype or a generic promise.",
    sections: Object.freeze([
      Object.freeze({
        heading: "Not published yet",
        paragraphs: Object.freeze([
          "This prototype does not publish shipping countries, rates, handling windows, delivery estimates, return countries, return windows, methods, or fees.",
        ]),
      }),
      Object.freeze({
        heading: "What will be checked before launch",
        paragraphs: Object.freeze([
          "A product can only become active after those terms are sourced, dated, matched to its exact SKU, and visible alongside the checkout price and availability.",
        ]),
      }),
    ]),
    primaryAction: Object.freeze({
      href: "/pages/how-it-works",
      label: "See how the format works",
    }),
    relatedLinks: Object.freeze([
      Object.freeze({
        href: "/collections/mystery-tableware-box",
        label: "View the planned formats",
      }),
      Object.freeze({
        href: "/pages/what-could-be-inside",
        label: "See possible categories",
      }),
    ]),
  }),
  "/blogs/table-stories": Object.freeze({
    eyebrow: "EDITORIAL IN PREPARATION",
    title: "Table Stories: Tableware Mystery Box Guides",
    description:
      "Table Stories is a forthcoming guide series about tableware mystery boxes, gifting, care, styling, and verified unboxing evidence when it is available.",
    h1: "Table Stories",
    intro:
      "A future editorial space for useful tableware mystery box guides. No article is published from this prototype yet.",
    sections: Object.freeze([
      Object.freeze({
        heading: "What the guide series will cover",
        paragraphs: Object.freeze([
          "The planned topics cover choosing a mystery box, possible contents, gifting, mixing tableware, care, and a clear comparison of 3-, 6-, and 12-piece formats.",
        ]),
      }),
      Object.freeze({
        heading: "Publishing standard",
        paragraphs: Object.freeze([
          "Each article needs one search intent, original evidence or examples, an editor, a publish date, and a useful link to the relevant collection or tier before it is treated as published content.",
        ]),
      }),
    ]),
    primaryAction: Object.freeze({
      href: "/collections/mystery-tableware-box",
      label: "View the planned formats",
    }),
    relatedLinks: Object.freeze([
      Object.freeze({
        href: "/pages/what-could-be-inside",
        label: "Explore possible categories",
      }),
      Object.freeze({
        href: "/pages/how-it-works",
        label: "How the format works",
      }),
    ]),
  }),
});

export function getStaticPageCopy(pathname) {
  return staticPageCopy[pathname] ?? null;
}

export function getDraftProductCopy(pieceCount) {
  const title = `${pieceCount}-Piece Mystery Tableware Box`;

  return Object.freeze({
    eyebrow: "DRAFT PRODUCT FORMAT",
    title,
    description: `Explore a ${pieceCount}-piece tableware mystery box. Possible categories include plates, bowls, mugs, cups, or serveware. Exact contents and terms await verification.`,
    h1: title,
    intro: `This ${pieceCount}-piece format is a draft catalog option. The piece count describes format size, not a promise about a final assortment.`,
    sections: Object.freeze([
      Object.freeze({
        heading: "Possible tableware categories",
        paragraphs: Object.freeze([
          "Plates, bowls, mugs, cups, and serveware are possible categories in the current source set. None is a confirmed inclusion for this format.",
        ]),
      }),
      Object.freeze({
        heading: "Before this becomes available",
        paragraphs: Object.freeze([
          "The exact SKU contents, item condition, price, availability, delivery terms, return terms, and product-specific image authorization must be verified first.",
        ]),
      }),
    ]),
    primaryAction: Object.freeze({
      href: "/collections/mystery-tableware-box",
      label: "Compare all piece-count formats",
    }),
    relatedLinks: Object.freeze([
      Object.freeze({
        href: "/pages/what-could-be-inside",
        label: "See possible categories",
      }),
      Object.freeze({
        href: "/pages/how-it-works",
        label: "How the format works",
      }),
      Object.freeze({
        href: "/pages/shipping-returns",
        label: "Shipping and returns status",
      }),
    ]),
  });
}

export function getPageCopy(pathname, product = null) {
  if (pathname === vertexPath) return Object.freeze({
    eyebrow: "Crystal glassware",
    ...vertexSeo,
    h1: vertexProduct.name,
    intro: vertexProduct.description,
    sections: vertexQuestions.map((item) => ({ heading: item.question, paragraphs: [item.answer] })),
    primaryAction: { href: "#vertex-details", label: "Explore form & detail" },
    relatedLinks: [{ href: "/shop", label: "Back to the archive" }],
  });
  if (pathname === crystalPath) return Object.freeze({
    eyebrow: "Glassware · Twelve zodiac signs",
    ...crystalSeo,
    h1: crystalProduct.name,
    intro: crystalProduct.description,
    sections: crystalQuestions.map((item) => ({heading:item.question,paragraphs:[item.answer]})),
    primaryAction: { href: "#z-details", label: "Discover the details" },
    relatedLinks: [{ href: "/shop", label: "Explore the rest of the edit" }],
  });
  if (product) return getDraftProductCopy(product.pieceCount);
  if (pathname === "/products/rolling-bead-ceramic-cup") return Object.freeze({
    eyebrow: "THE CUP · ROLLING BEAD",
    title: "Rolling-Bead Ceramic Cup in Three Colours | Aster Edit",
    description: `Discover a ribbed ceramic cup with a bead in the handle that rolls under your thumb. Purple-grey, olive and deep green. $${cupPrice} USD. Ordering opens soon.`,
    h1: "A little pause, in your hands.",
    intro: "A ribbed ceramic cup with a bead in the handle that you can roll with your thumb.",
    sections: [
      { heading: "Three colours", paragraphs: ["Explore purple-grey, olive and deep green through the product photographs."] },
      { heading: "Ordering opens soon", paragraphs: ["Dimensions, capacity and care guidance will be added before ordering opens."] },
    ],
    primaryAction: { href: "mailto:support@example.test?subject=Rolling-bead%20ceramic%20cup", label: "Ask about the cup" },
    relatedLinks: [{ href: "/collections", label: "Explore the tableware" }],
  });
  const asterProduct = pathname.startsWith("/products/")
    ? getAsterProduct(pathname.split("/")[2])
    : null;
  if (asterProduct) {
    const isSourceMapped = Boolean(asterProduct.sourceUrl);
    const itemCount = asterProduct.items?.length ?? asterProduct.pieces;

    return Object.freeze({
      eyebrow: asterProduct.eyebrow,
      title: `${asterProduct.name} | Aster Edit`,
      description: isSourceMapped
        ? `Explore ${asterProduct.name} at Aster Edit. Compare ${itemCount} individual ceramic forms by shape, size, finish and current availability.`
        : `Explore ${asterProduct.name}, an illustrative Aster Edit ceramic collection for everyday tables. Final assortment and purchase terms remain under review.`,
      h1: asterProduct.name,
      intro: asterProduct.description,
      sections: Object.freeze([
        Object.freeze({
          heading: isSourceMapped ? "Explore the forms" : "A considered edit",
          paragraphs: Object.freeze([
            isSourceMapped
              ? `Compare ${itemCount} individual forms in this collection. Each choice has its own product image, dimensions and price when available.`
              : `This ${itemCount}-piece concept shows how different ceramic forms and finishes can live together on one table.`,
          ]),
        }),
        Object.freeze({
          heading: isSourceMapped ? "Choosing your piece" : "Before launch",
          paragraphs: Object.freeze([
            isSourceMapped
              ? "Choose the exact form and size on this page. Availability and shipping charges are shown before an order is placed."
              : "The displayed imagery, assortment and prices are concepts. Final SKU contents, dimensions, shipping, returns and product rights require verification.",
          ]),
        }),
      ]),
      primaryAction: Object.freeze({ href: "/", label: "Explore Aster Edit" }),
      relatedLinks: Object.freeze([]),
    });
  }
  return getStaticPageCopy(pathname);
}
