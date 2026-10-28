// Owner confirmed crystal, USD179 /99, and purchase under the prior crystal
// standard: one glass, free cup/crystal shipping, existing checkout. 2026-10-22.
// Only the eight photographed form/colour combinations are sold.
export const vertexPath = "/products/vertex-crystal-glass";
const asset = (id) => `/images/aster/vertex-preview/vertex-${id}-white-v${id === "tall-display-group" ? 1 : 2}.webp`;

export const vertexColours = Object.freeze([
  { id: "red", name: "Red", swatch: "#a92336" },
  { id: "amber", name: "Amber", swatch: "#b87716" },
  { id: "blue", name: "Blue", swatch: "#3486b2" },
  { id: "indigo", name: "Indigo", swatch: "#343480" },
  { id: "violet", name: "Violet", swatch: "#784287" },
  { id: "green", name: "Green", swatch: "#18785a" },
]);

export const vertexForms = Object.freeze([
  {
    id: "tall",
    name: "Tall glass",
    colours: vertexColours.map((colour) => colour.id),
    description:
      "An elongated silhouette. Long, sweeping faces lead into an angular square base.",
  },
  {
    id: "low",
    name: "Low glass",
    colours: ["violet", "green"],
    description:
      "A wider, compact silhouette. Broad curved faces gather around a substantial square base.",
  },
]);

export function vertexPhoto(form, colour, view = "front") {
  const tone = vertexColours.find((item) => item.id === colour);
  const shape = vertexForms.find((item) => item.id === form);
  return {
    src: asset(`${form}-${colour}-${view}`),
    label: `${shape.name} · ${tone.name} · ${view === "front" ? "Upright view" : "Side & base view"}`,
    alt: `${shape.name} in crystal with a ${tone.name.toLowerCase()} base, ${view === "front" ? "upright on white, showing the circular rim and curved sculptural sides" : "resting on its side on white, showing the angular square foot and clear wall"}`,
    width: 1254,
    height: 1254,
  };
}

export const vertexProduct = Object.freeze({
  id: "vertex-crystal-glass",
  name: "Vertex Crystal Glass",
  path: vertexPath,
  material: "Crystal",
  regularPrice: 179,
  price: 99,
  currency: "USD",
  image: asset("tall-violet-front"),
  description:
    "A clear crystal glass with broad, sweeping faces and a sculpted square base. Colour gathers at the foot, bringing depth to the low and tall silhouettes.",
  availableForPurchase: true,
  freeShipping: true,
});

export const vertexGroupPhoto = Object.freeze({
  src: asset("tall-display-group"),
  label: "The complete colour palette",
  alt: "Six tall crystal glasses in red, amber, blue, indigo, violet and green, photographed upside down on a display stand against white",
  width: 1254,
  height: 1254,
});

export const vertexDetailPhoto = Object.freeze({
  src: "/images/aster/vertex-preview/vertex-base-detail-studio-v1.webp",
  label: "A closer look at the indigo base",
  alt: "Close-up of the indigo square foot of a Vertex crystal glass, showing dense clear edges, curved faces and layered reflections on a quiet grey studio surface",
  width: 1448,
  height: 1086,
});

export const vertexImageAssets = Object.freeze([
  ...vertexForms.flatMap((form) =>
    form.colours.flatMap((colour) =>
      ["front", "side"].map((view) => vertexPhoto(form.id, colour, view)),
    ),
  ),
  vertexGroupPhoto,
  vertexDetailPhoto,
]);

export const vertexSeo = Object.freeze({
  title:
    "Vertex Crystal Glass | Sculpted Glassware & Coloured Bases | Aster Edit",
  description:
    "Explore Vertex crystal glassware: low and tall silhouettes, sweeping clear faces and a sculpted square base in six colours. Discover the form from every side.",
  primaryIntent: "crystal glass with coloured square base",
});

export const vertexQuestions = Object.freeze([
  {
    question: "How is Vertex sold and shipped?",
    answer:
      "Each item is one glass in your chosen form and base colour, priced at $99 USD with a reference price of $179 USD. Cup and crystal-only orders ship free. Orders including ceramic tableware use the store's standard rule: $30 below $150 and free shipping at $150 or more, based on merchandise after discounts.",
  },
  {
    question: "What is Vertex made from?",
    answer:
      "Vertex is made from crystal. Its clear upper body lets you see the curved faces and the colour concentrated around the base.",
  },
  {
    question: "How do the two forms differ?",
    answer:
      "The low glass has a compact, wider profile; the tall glass extends the same sculptural language into a longer silhouette. Choose a form above to compare the photographed views.",
  },
  {
    question: "Where can I see the colours?",
    answer:
      "The full palette is Red, Amber, Blue, Indigo, Violet and Green. The tall form is photographed in all six colours; the low-form photographs show Violet and Green. Highlights and colour depth vary with the light and viewing angle.",
  },
]);

// Explicit stable catalog and SKU mappings for the owner-authorized range.
export const vertexProducts = Object.freeze([
  {
    "id": "vertex-crystal-glass-tall-red",
    "name": "Vertex Crystal Glass \u00b7 Tall glass \u00b7 Red",
    "formId": "tall",
    "colourId": "red",
    "catalogKey": "vertex-crystal-glass:tall-red",
    "sku": "ASTER-3A227770EA400130A5D9E66C",
    "regularPrice": 179,
    "price": 99,
    "currency": "USD",
    "freeShipping": true,
    "image": "/images/aster/vertex-preview/vertex-tall-red-front-white-v2.webp",
    "description": "One tall crystal glass with a red base.",
    "path": "/products/vertex-crystal-glass?form=tall&colour=red"
  },
  {
    "id": "vertex-crystal-glass-tall-amber",
    "name": "Vertex Crystal Glass \u00b7 Tall glass \u00b7 Amber",
    "formId": "tall",
    "colourId": "amber",
    "catalogKey": "vertex-crystal-glass:tall-amber",
    "sku": "ASTER-1182527328CC0CDC4913B78D",
    "regularPrice": 179,
    "price": 99,
    "currency": "USD",
    "freeShipping": true,
    "image": "/images/aster/vertex-preview/vertex-tall-amber-front-white-v2.webp",
    "description": "One tall crystal glass with a amber base.",
    "path": "/products/vertex-crystal-glass?form=tall&colour=amber"
  },
  {
    "id": "vertex-crystal-glass-tall-blue",
    "name": "Vertex Crystal Glass \u00b7 Tall glass \u00b7 Blue",
    "formId": "tall",
    "colourId": "blue",
    "catalogKey": "vertex-crystal-glass:tall-blue",
    "sku": "ASTER-EACD43A0D2396EBFE9FD05DE",
    "regularPrice": 179,
    "price": 99,
    "currency": "USD",
    "freeShipping": true,
    "image": "/images/aster/vertex-preview/vertex-tall-blue-front-white-v2.webp",
    "description": "One tall crystal glass with a blue base.",
    "path": "/products/vertex-crystal-glass?form=tall&colour=blue"
  },
  {
    "id": "vertex-crystal-glass-tall-indigo",
    "name": "Vertex Crystal Glass \u00b7 Tall glass \u00b7 Indigo",
    "formId": "tall",
    "colourId": "indigo",
    "catalogKey": "vertex-crystal-glass:tall-indigo",
    "sku": "ASTER-DA28DE79D00A07E8C263F0A3",
    "regularPrice": 179,
    "price": 99,
    "currency": "USD",
    "freeShipping": true,
    "image": "/images/aster/vertex-preview/vertex-tall-indigo-front-white-v2.webp",
    "description": "One tall crystal glass with a indigo base.",
    "path": "/products/vertex-crystal-glass?form=tall&colour=indigo"
  },
  {
    "id": "vertex-crystal-glass-tall-violet",
    "name": "Vertex Crystal Glass \u00b7 Tall glass \u00b7 Violet",
    "formId": "tall",
    "colourId": "violet",
    "catalogKey": "vertex-crystal-glass:tall-violet",
    "sku": "ASTER-63A761CFA3FB83331BB71A3C",
    "regularPrice": 179,
    "price": 99,
    "currency": "USD",
    "freeShipping": true,
    "image": "/images/aster/vertex-preview/vertex-tall-violet-front-white-v2.webp",
    "description": "One tall crystal glass with a violet base.",
    "path": "/products/vertex-crystal-glass?form=tall&colour=violet"
  },
  {
    "id": "vertex-crystal-glass-tall-green",
    "name": "Vertex Crystal Glass \u00b7 Tall glass \u00b7 Green",
    "formId": "tall",
    "colourId": "green",
    "catalogKey": "vertex-crystal-glass:tall-green",
    "sku": "ASTER-DE85BF83F373519A4497C458",
    "regularPrice": 179,
    "price": 99,
    "currency": "USD",
    "freeShipping": true,
    "image": "/images/aster/vertex-preview/vertex-tall-green-front-white-v2.webp",
    "description": "One tall crystal glass with a green base.",
    "path": "/products/vertex-crystal-glass?form=tall&colour=green"
  },
  {
    "id": "vertex-crystal-glass-low-violet",
    "name": "Vertex Crystal Glass \u00b7 Low glass \u00b7 Violet",
    "formId": "low",
    "colourId": "violet",
    "catalogKey": "vertex-crystal-glass:low-violet",
    "sku": "ASTER-A273A44EAFB891A7B6038DDB",
    "regularPrice": 179,
    "price": 99,
    "currency": "USD",
    "freeShipping": true,
    "image": "/images/aster/vertex-preview/vertex-low-violet-front-white-v2.webp",
    "description": "One low crystal glass with a violet base.",
    "path": "/products/vertex-crystal-glass?form=low&colour=violet"
  },
  {
    "id": "vertex-crystal-glass-low-green",
    "name": "Vertex Crystal Glass \u00b7 Low glass \u00b7 Green",
    "formId": "low",
    "colourId": "green",
    "catalogKey": "vertex-crystal-glass:low-green",
    "sku": "ASTER-A244059918CC470ECEC2C94B",
    "regularPrice": 179,
    "price": 99,
    "currency": "USD",
    "freeShipping": true,
    "image": "/images/aster/vertex-preview/vertex-low-green-front-white-v2.webp",
    "description": "One low crystal glass with a green base.",
    "path": "/products/vertex-crystal-glass?form=low&colour=green"
  }
].map(Object.freeze));
