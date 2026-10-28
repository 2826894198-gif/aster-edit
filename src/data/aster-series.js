import {
  getSeriesPrice,
  getSeriesSetOffer,
  isComplimentaryGift,
} from "./aster-pricing.js";

export const archivedAssetSources = new Set();

const demoContextImages = {
  "demo-garden-shift": "/images/aster/optimized/72eea32a9f5be0b6-1086.webp",
  "demo-petal-blue": "/images/aster/optimized/daa605cbf2f614e3-1086.webp",
  "demo-ocean-blue": "/images/aster/optimized/1da9af5cb7dcb995-1254.webp",
  "demo-yellow-petal": "/images/aster/optimized/935363c235cab81c-1064.webp",
  "demo-ivory": "/images/aster/optimized/ee3edf2b9fd5d0e0-1254.webp",
  "demo-orange-oval": "/images/aster/optimized/785a0c30a86c6787-1086.webp"
};

const sourceAsset = (relativePath) => {
  archivedAssetSources.add(relativePath);
  // Public demonstration uses selected product derivatives, not original supplier archives.
  return demoContextImages[relativePath.split("/")[0]];
};

const cleanAsset = (relativePath) =>
  `/images/aster/clean-drafts/${relativePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;

const item = ({
  id,
  name,
  dimensions,
  capacity,
  sourceSpecification,
  purchaseUrl,
  sourceImage,
  detailImage,
  group,
  availability,
  availabilityNote,
}) => ({
  id,
  name,
  dimensions,
  capacity,
  sourceSpecification,
  purchaseUrl,
  sourceImagePath: sourceImage,
  image: sourceAsset(sourceImage),
  detailImage: detailImage ? sourceAsset(detailImage) : null,
  group,
  availability,
  availabilityNote,
});

const monetUrl =
  "https://source.example.test/demo-product";
const petalBlueUrl =
  "https://source.example.test/demo-product";
const oceanLargeUrl =
  "https://source.example.test/demo-product";
const oceanRoundUrl =
  "https://source.example.test/demo-product";
const fangjuUrl = "https://source.example.test/demo-product";
const suhuoUrl = "https://source.example.test/demo-product";
const orangeUrl =
  "https://source.example.test/demo-product";

const monetRoot = "demo-garden-shift";
const petalRoot = "demo-petal-blue";
const oceanRoot = "demo-ocean-blue";
const fangjuRoot = "demo-yellow-petal";
const suhuoRoot = "demo-ivory";
const orangeRoot = "demo-orange-oval";

export const archivedSeries = [
  {
    id: "mood-monet-green",
    kind: "archived-series",
    slug: "garden-shift-green-ceramics",
    legacySlug: "mood-monet-garden-green",
    legacyName: "Mood Monet Garden Green",
    name: "Garden Shift",
    titleMain: "Garden",
    titleAccent: "Shift",
    eyebrow: "GARDEN SHIFT · MOTTLED GREEN CERAMICS",
    description:
      "A bowl, plate and small sauce bowl share a mottled garden-green finish at three distinct scales.",
    image: sourceAsset(
      `${monetRoot}/03_系列组合展示_含多器型/demo-public-product.webp`,
    ),
    sourceUrl: monetUrl,
    sourceItemIds: ["DEMO-SOURCE"],
    sourceArchive: `${monetRoot}/商品档案.json`,
    defaultItemId: "bowl-7",
    theme: { wash: "#f0f1e9", ink: "#6d7657", border: "#d8dccd" },
    items: [
      item({
        id: "bowl-7",
        name: "7-inch Bowl",
        dimensions: "Approx. Ø 18 × H 7 cm",
        capacity: "Approx. 600 ml",
        sourceSpecification: "7英寸碗",
        purchaseUrl: monetUrl,
        sourceImage: `${monetRoot}/01_单品SKU/01_7英寸碗_有货/规格图.png`,
        detailImage: `${monetRoot}/02_单品展示图/01_7英寸碗/demo-public-product.webp`,
        group: "Bowls",
        availability: "available-at-capture",
      }),
      item({
        id: "plate-8",
        name: "8-inch Flat Plate",
        dimensions: "Approx. Ø 21 × H 3 cm",
        sourceSpecification: "8英寸平盘",
        purchaseUrl: monetUrl,
        sourceImage: `${monetRoot}/01_单品SKU/02_8英寸平盘_有货/规格图.png`,
        group: "Plates",
        availability: "available-at-capture",
      }),
      item({
        id: "sauce-bowl-4-5",
        name: "4.5-inch Sauce Bowl",
        dimensions: "Approx. Ø 11.5 × H 5.3 cm",
        capacity: "Approx. 180 ml",
        sourceSpecification: "4.5英寸酱料碗",
        purchaseUrl: monetUrl,
        sourceImage: `${monetRoot}/01_单品SKU/03_4.5英寸酱料碗_有货/规格图.png`,
        group: "Bowls",
        availability: "available-at-capture",
      }),
    ],
    story: {
      eyebrow: "GARDEN SHIFT · THREE CERAMIC FORMS",
      title: "One green surface, three ways to see it",
      intro:
        "A bowl, plate and sauce bowl carry the same mottled green field at different depths and scales. Their changing silhouettes give the surface a different presence on each piece.",
      hero: sourceAsset(
        `${monetRoot}/03_系列组合展示_含多器型/demo-public-product.webp`,
      ),
      morning: sourceAsset(
        `${monetRoot}/02_单品展示图/01_7英寸碗/demo-public-product.webp`,
      ),
      midday: sourceAsset(
        `${monetRoot}/03_系列组合展示_含多器型/demo-public-product.webp`,
      ),
      gathering: sourceAsset(
        `${monetRoot}/03_系列组合展示_含多器型/demo-public-product.webp`,
      ),
      texture: sourceAsset(
        `${monetRoot}/04_工艺与细节/demo-public-product.webp`,
      ),
      approach: sourceAsset(
        `${monetRoot}/03_系列组合展示_含多器型/demo-public-product.webp`,
      ),
      chapterOne: {
        eyebrow: "ONE BOWL",
        title: "A form with visible depth",
        copy: "The seven-inch bowl measures about 18 cm across and 7 cm high, while the sauce bowl is about 11.5 cm across and 5.3 cm high. Their raised walls distinguish them from the flatter plate.",
      },
      chapterTwo: {
        eyebrow: "ACROSS THE TABLE",
        title: "Three scales, one glaze language",
        copy: "The flat plate measures about 21 cm across and 3 cm high. It gives the mottled green a wider, lower outline beside the two deeper bowls.",
      },
      gatheringCopy:
        "One bowl, one plate and one sauce bowl—each is individually priced, with the full series also available as a set.",
      surfaceTitle: "A mottled garden surface",
      surfaceCopy:
        "Mottled green shifts around the curves, with scattered lighter flecks and a pale exposed foot. The irregular rim gives each silhouette a softer outline.",
      surfaceNotes: [
        "Mottled green variation",
        "Irregular rims",
        "Pale exposed foot",
      ],
      closing: "Forms that leave room for colour.",
    },
  },
  {
    id: "mood-mist-blue-petal",
    kind: "archived-series",
    slug: "petal-haze-blue-ceramics",
    legacySlug: "mood-mist-blue-petal",
    legacyName: "Mood Mist Blue Petal",
    name: "Petal Haze",
    titleMain: "Petal",
    titleAccent: "Haze",
    eyebrow: "PETAL HAZE · BLUE-GREY CERAMICS",
    description:
      "Four flower-rimmed forms share a cool mist-blue finish, with different depths and scales.",
    image: sourceAsset(
      `${petalRoot}/02_多商品组合展示/demo-public-product.webp`,
    ),
    sourceUrl: petalBlueUrl,
    sourceItemIds: ["DEMO-SOURCE"],
    sourceArchive: `${petalRoot}/商品档案.json`,
    defaultItemId: "soup-plate-8",
    theme: { wash: "#eef2f4", ink: "#71808b", border: "#d7e0e5" },
    items: [
      item({
        id: "soup-plate-8",
        name: "8-inch Soup Plate",
        dimensions: "Ø 20 × H 5 cm",
        capacity: "Approx. 800 ml",
        sourceSpecification: "8英寸汤盘",
        purchaseUrl: petalBlueUrl,
        sourceImage: `${petalRoot}/01_单品SKU/01_8英寸汤盘/规格图.png`,
        group: "Bowls",
      }),
      item({
        id: "bowl-6",
        name: "6-inch Bowl",
        dimensions: "Ø 15 × H 7.5 cm",
        capacity: "Approx. 600 ml",
        sourceSpecification: "6英寸碗",
        purchaseUrl: petalBlueUrl,
        sourceImage: `${petalRoot}/01_单品SKU/02_6英寸碗/规格图.png`,
        group: "Bowls",
      }),
      item({
        id: "plate-8-5",
        name: "8.5-inch Plate",
        dimensions: "Ø 21.5 × H 2.8 cm",
        sourceSpecification: "8.5英寸盘",
        purchaseUrl: petalBlueUrl,
        sourceImage: `${petalRoot}/01_单品SKU/03_8.5英寸盘/规格图.png`,
        group: "Plates",
      }),
      item({
        id: "plate-10-3",
        name: "10.3-inch Large Plate",
        dimensions: "Ø 26.3 × H 4 cm",
        sourceSpecification: "10.3英寸超大盘",
        purchaseUrl: petalBlueUrl,
        sourceImage: `${petalRoot}/01_单品SKU/04_10.3英寸超大盘/规格图.png`,
        group: "Plates",
        availability: "out-of-stock-at-capture",
        availabilityNote: "Currently out of stock.",
      }),
    ],
    story: {
      eyebrow: "PETAL HAZE · FOUR CERAMIC FORMS",
      title: "A repeated edge, a change in depth",
      intro:
        "The petal rim gives four blue-grey forms a family resemblance. The deeper bowls hold that outline upright while the plates let it open outward.",
      hero: sourceAsset(
        `${petalRoot}/02_多商品组合展示/demo-public-product.webp`,
      ),
      morning: sourceAsset(
        `${petalRoot}/02_多商品组合展示/demo-public-product.webp`,
      ),
      midday: sourceAsset(
        `${petalRoot}/02_多商品组合展示/demo-public-product.webp`,
      ),
      gathering: sourceAsset(
        `${petalRoot}/02_多商品组合展示/demo-public-product.webp`,
      ),
      texture: sourceAsset(
        `${petalRoot}/03_工艺与纹理特写/demo-public-product.webp`,
      ),
      approach: sourceAsset(
        `${petalRoot}/02_多商品组合展示/demo-public-product.webp`,
      ),
      chapterOne: {
        eyebrow: "DEPTH",
        title: "Bowls that keep their profile",
        copy: "The 6-inch bowl is 15 cm across and 7.5 cm high; the soup plate is wider at 20 cm, with a lower 5 cm wall. Both carry the same rounded petal edge.",
      },
      chapterTwo: {
        eyebrow: "SURFACE",
        title: "Blue-grey, held quietly",
        copy: "The smaller plate is 21.5 cm across and 2.8 cm high. The larger format extends to 26.3 cm, with a 4 cm wall. The shared scalloped edge connects the two scales.",
      },
      gatheringCopy:
        "Two deeper forms and two plates share one repeated petal rhythm; each is individually priced and the full set is shown in the purchase area.",
      surfaceTitle: "A cool, matte-looking blue",
      surfaceCopy:
        "A soft blue-grey field meets darker colour near the edges and a pale exposed foot. The repeated petal profile makes the connection between bowls and plates easy to see.",
      surfaceNotes: [
        "Cool blue-grey field",
        "Darker edge pooling",
        "Repeated petal profile",
      ],
      closing: "Quiet colour, shaped at the edge.",
    },
  },
  {
    id: "mood-ocean-blue",
    kind: "archived-series",
    slug: "open-tide-blue-plates",
    legacySlug: "mood-ocean-blue-plates",
    legacyName: "Mood Ocean Blue Plates",
    name: "Open Tide",
    titleMain: "Open",
    titleAccent: "Tide",
    eyebrow: "OPEN TIDE · SPECKLED BLUE CERAMIC PLATES",
    description:
      "An oval platter and two round plates carry a fine-speckled ocean blue across three serving scales.",
    image: sourceAsset(
      `${oceanRoot}/03_系列组合展示_含多器型/demo-public-product.webp`,
    ),
    sourceUrl: oceanLargeUrl,
    sourceItemIds: ["DEMO-SOURCE"],
    sourceArchive: `${oceanRoot}/商品档案.json`,
    defaultItemId: "oval-14-5",
    theme: { wash: "#edf4f7", ink: "#557b93", border: "#d5e2e9" },
    items: [
      item({
        id: "oval-14-5",
        name: "14.5-inch Large Oval Plate",
        dimensions: "L 37 × W 23.5 × H 2 cm",
        sourceSpecification: "14.5英寸超大盘",
        purchaseUrl: oceanLargeUrl,
        sourceImage: `${oceanRoot}/01_单品SKU/01_14.5英寸超大盘_有货/规格图.png`,
        detailImage: `${oceanRoot}/02_单品展示图/01_14.5英寸超大盘/demo-public-product.webp`,
        group: "Oval Plates",
        availability: "available-at-capture",
      }),
      item({
        id: "plate-8-5",
        name: "8.5-inch Small Plate",
        dimensions: "Ø 22 × H 2 cm",
        sourceSpecification: "8.5英寸小盘",
        purchaseUrl: oceanRoundUrl,
        sourceImage: `${oceanRoot}/01_单品SKU/02_8.5英寸小盘_没货/规格图.png`,
        group: "Round Plates",
        availability: "out-of-stock-at-capture",
        availabilityNote:
          "Archived as out of stock on 2026-09-16; current stock has not been rechecked.",
      }),
      item({
        id: "plate-10-5",
        name: "10.5-inch Large Plate",
        dimensions: "Ø 27 × H 2.5 cm",
        sourceSpecification: "10.5英寸大盘",
        purchaseUrl: oceanRoundUrl,
        sourceImage: `${oceanRoot}/01_单品SKU/03_10.5英寸大盘_有货/规格图.png`,
        detailImage: `${oceanRoot}/02_单品展示图/03_10.5英寸大盘/demo-public-product.webp`,
        group: "Round Plates",
        availability: "available-at-capture",
        availabilityNote:
          "The 2026-09-16 source snapshot said stock was running low; current stock is unverified.",
      }),
    ],
    story: {
      eyebrow: "OPEN TIDE · THREE PLATE FORMS",
      title: "One blue, three serving scales",
      intro:
        "A long oval and two round plates spread a fine-speckled blue across three different serving planes. Each format keeps its own proportion and purpose.",
      hero: sourceAsset(
        `${oceanRoot}/03_系列组合展示_含多器型/demo-public-product.webp`,
      ),
      morning: sourceAsset(
        `${oceanRoot}/03_系列组合展示_含多器型/demo-public-product.webp`,
      ),
      midday: sourceAsset(
        `${oceanRoot}/03_系列组合展示_含多器型/demo-public-product.webp`,
      ),
      gathering: sourceAsset(
        `${oceanRoot}/03_系列组合展示_含多器型/demo-public-product.webp`,
      ),
      texture: sourceAsset(
        `${oceanRoot}/04_工艺与细节/demo-public-product.webp`,
      ),
      approach: sourceAsset(
        `${oceanRoot}/03_系列组合展示_含多器型/demo-public-product.webp`,
      ),
      chapterOne: {
        eyebrow: "OVAL",
        title: "A longer serving plane",
        copy: "The oval platter is 37 cm long, 23.5 cm wide and 2 cm high. Its long footprint offers a different outline from the round plates.",
      },
      chapterTwo: {
        eyebrow: "ROUND",
        title: "Two scales for one surface",
        copy: "The smaller round plate measures 22 cm across and 2 cm high. The larger plate adds 5 cm in diameter and a slightly higher 2.5 cm wall.",
      },
      gatheringCopy:
        "One oval platter and two round plates can be chosen individually. The Full Set option is listed separately in the purchase area, where availability is shown.",
      surfaceTitle: "Blue with a fine-grain finish",
      surfaceCopy:
        "A soft ocean-blue field carries fine speckling across the broad plate surfaces. Low pale edges keep the outline distinct from the darker centre.",
      surfaceNotes: [
        "Fine blue speckle",
        "Low rounded rims",
        "Oval and round scales",
      ],
      closing: "A quieter blue, spread wide.",
    },
  },
  {
    id: "fangju-yellow",
    kind: "archived-series",
    slug: "sunfold-fluted-ceramics",
    legacySlug: "fangju-yellow-petal",
    legacyName: "Fangju Yellow Petal",
    name: "Sunfold",
    titleMain: "Sun",
    titleAccent: "fold",
    eyebrow: "SUNFOLD · YELLOW-GREEN FLUTED CERAMICS",
    description:
      "Seven bowls, plates and one breakfast cup share fluted petal walls and a warm yellow-green edge.",
    image: sourceAsset(
      `${fangjuRoot}/07_系列组合与详情/demo-public-product.webp`,
    ),
    sourceUrl: fangjuUrl,
    sourceItemIds: ["DEMO-SOURCE"],
    sourceArchive: `${fangjuRoot}/商品档案.json`,
    defaultItemId: "plate-8",
    theme: { wash: "#f5f0df", ink: "#988152", border: "#e4dbc0" },
    items: [
      item({
        id: "rice-bowl-4-5",
        name: "4.5-inch Rice Bowl",
        dimensions: "Mouth Ø 12 × H 6.5 cm",
        capacity: "360 ml · 268 g",
        sourceSpecification: "芳菊黄-4.5英寸饭碗",
        purchaseUrl: fangjuUrl,
        sourceImage: `${fangjuRoot}/01_碗具规格/demo-public-product.webp_.webp`,
        group: "Bowls",
      }),
      item({
        id: "noodle-bowl-6-5",
        name: "6.5-inch Noodle Bowl",
        dimensions: "Mouth Ø 16 × H 6.5 cm",
        capacity: "690 ml · 540 g",
        sourceSpecification: "芳菊黄-6.5英寸面碗",
        purchaseUrl: fangjuUrl,
        sourceImage: `${fangjuRoot}/01_碗具规格/demo-public-product.webp_.webp`,
        group: "Bowls",
      }),
      item({
        id: "serving-bowl-7-5",
        name: "7.5-inch Serving Bowl",
        dimensions: "Mouth Ø 20 × H 6 cm",
        capacity: "1,045 ml · 590 g",
        sourceSpecification: "芳菊黄-7.5英寸菜碗",
        purchaseUrl: fangjuUrl,
        sourceImage: `${fangjuRoot}/01_碗具规格/demo-public-product.webp_.webp`,
        detailImage: `${fangjuRoot}/06_7_5寸菜碗场景/demo-public-product.webp`,
        group: "Bowls",
      }),
      item({
        id: "dip-dish-4",
        name: "4-inch Petal Dip Dish",
        dimensions: "Mouth Ø 10.5 × H 2.2 cm",
        capacity: "120 g listed weight",
        sourceSpecification: "芳菊黄-4英寸花瓣味碟",
        purchaseUrl: fangjuUrl,
        sourceImage: `${fangjuRoot}/02_盘碟规格/demo-public-product.webp_.webp`,
        group: "Plates",
      }),
      item({
        id: "plate-8",
        name: "8-inch Petal Plate",
        dimensions: "Mouth Ø 20.5 × H 3 cm",
        capacity: "430 g listed weight",
        sourceSpecification: "芳菊黄-8英寸花瓣圆盘",
        purchaseUrl: fangjuUrl,
        sourceImage: `${fangjuRoot}/02_盘碟规格/demo-public-product.webp_.webp`,
        detailImage: `${fangjuRoot}/04_8寸花瓣圆盘场景/demo-public-product.webp_q50.jpg_.webp`,
        group: "Plates",
      }),
      item({
        id: "deep-plate-10",
        name: "10-inch Petal Deep Plate",
        dimensions: "Mouth Ø 26.5 × H 3.5 cm",
        capacity: "850 g listed weight",
        sourceSpecification: "芳菊黄-10英寸花瓣深盘",
        purchaseUrl: fangjuUrl,
        sourceImage: `${fangjuRoot}/02_盘碟规格/demo-public-product.webp_.webp`,
        detailImage: `${fangjuRoot}/05_10寸花瓣深盘场景/demo-public-product.webp`,
        group: "Plates",
        availabilityNote:
          "A scene image says 10.5 inches while the dedicated specification image says 10 inches / 26.5 cm; the name remains unresolved.",
      }),
      item({
        id: "breakfast-cup-430",
        name: "430 ml Breakfast Cup",
        dimensions: "Mouth Ø 11.5 × H 7.2 cm",
        capacity: "430 ml · 375 g",
        sourceSpecification: "芳菊黄-早餐杯",
        purchaseUrl: fangjuUrl,
        sourceImage: `${fangjuRoot}/03_杯具规格/demo-public-product.webp_.webp`,
        group: "Cup",
      }),
    ],
    story: {
      eyebrow: "SUNFOLD · SEVEN FLUTED FORMS",
      title: "A shared edge across the table",
      intro:
        "The fluted outline moves from breakfast cup and small bowls to broader plates. Pale centres and yellow-green edge variation connect seven forms without hiding their different scales.",
      hero: sourceAsset(
        `${fangjuRoot}/07_系列组合与详情/demo-public-product.webp`,
      ),
      morning: sourceAsset(
        `${fangjuRoot}/07_系列组合与详情/demo-public-product.webp`,
      ),
      midday: sourceAsset(
        `${fangjuRoot}/04_8寸花瓣圆盘场景/demo-public-product.webp`,
      ),
      gathering: sourceAsset(
        `${fangjuRoot}/07_系列组合与详情/demo-public-product.webp`,
      ),
      texture: sourceAsset(
        `${fangjuRoot}/07_系列组合与详情/demo-public-product.webp_q50.jpg_.webp`,
      ),
      approach: sourceAsset(
        `${fangjuRoot}/07_系列组合与详情/demo-public-product.webp`,
      ),
      chapterOne: {
        eyebrow: "MORNING",
        title: "Cup and bowl, visibly related",
        copy: "The breakfast cup and smaller bowls carry the same fluted wall without hiding their different proportions.",
      },
      chapterTwo: {
        eyebrow: "MIDDAY",
        title: "Petal edges across a wider plane",
        copy: "The plate photographs make the radial grooves and darker rim easiest to compare.",
      },
      gatheringCopy:
        "Three bowls, three plate forms and one cup share a repeated fluted language; each is individually priced and the full series is also available as a set.",
      surfaceTitle: "Fluting from centre to edge",
      surfaceCopy:
        "Radiating grooves lead from pale centres to yellow-green edges. The uneven darker outline brings warmth to the fluted bowls, plates and cup.",
      surfaceNotes: [
        "Radiating fluted walls",
        "Yellow-green edge variation",
        "Pale central field",
      ],
      closing: "A repeated rhythm, in seven useful forms.",
    },
  },
  {
    id: "suhuo-ivory",
    kind: "archived-series",
    slug: "pale-ground-ivory-ceramics",
    legacySlug: "suhuo-matte-ivory",
    legacyName: "Suhuo Matte Ivory",
    name: "Pale Ground",
    titleMain: "Pale",
    titleAccent: "Ground",
    eyebrow: "PALE GROUND · IVORY CERAMIC TABLEWARE",
    description:
      "Ivory ceramic cups, bowls, plates and serveware in 18 individually priced forms, with two smaller gift-only pieces.",
    image: sourceAsset(
      `${suhuoRoot}/02_详情与组合参考/demo-public-product.webp`,
    ),
    sourceUrl: suhuoUrl,
    sourceItemIds: ["DEMO-SOURCE"],
    sourceArchive: `${suhuoRoot}/商品档案.json`,
    defaultItemId: "flat-plate-8",
    theme: { wash: "#f3f0e8", ink: "#897a65", border: "#e0d9cc" },
    items: [
      item({
        id: "handled-dip-2-5",
        name: "2.5-inch Handled Dip Dish",
        dimensions: "Ø 6.5 × handle height 3.5 cm",
        sourceSpecification: "【2.5寸】带柄小味碟",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/01_2.5寸带柄小味碟/demo-public-product.webp_.webp`,
        group: "Small Pieces",
      }),
      item({
        id: "spoon",
        name: "Matte Ivory Spoon",
        dimensions: "L 13 × W 4.6 × H 4 cm",
        sourceSpecification: "米白小勺 铁点明显",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/02_米白小勺_铁点明显/demo-public-product.webp`,
        group: "Small Pieces",
      }),
      item({
        id: "tumbler-200",
        name: "200 ml Tumbler",
        dimensions: "Ø 8.6 × H 7.3 cm",
        capacity: "Approx. 200 ml",
        sourceSpecification: "米白水杯-约200ml",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/03_米白水杯_约200ml/demo-public-product.webp_.webp`,
        group: "Small Pieces",
      }),
      item({
        id: "bowl-4-7",
        name: "4.7-inch Small Bowl",
        dimensions: "Ø 12 × H 5.6 cm",
        capacity: "Approx. 300 ml",
        sourceSpecification: "【4.7寸】哑光米白小碗",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/04_4.7寸哑光米白小碗/demo-public-product.webp_.webp`,
        group: "Bowls",
      }),
      item({
        id: "pedestal-bowl-4-25",
        name: "4.25-inch Pedestal Bowl",
        dimensions: "Ø 10.8 × H 9.3 cm",
        capacity: "Approx. 200 ml",
        sourceSpecification: "【4.25寸】米白竹风高足碗",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/05_4.25寸米白竹风高足碗/demo-public-product.webp_.webp`,
        group: "Bowls",
      }),
      item({
        id: "noodle-bowl-8-25",
        name: "8.25-inch Noodle Bowl",
        dimensions: "Ø 21 × H 7 cm",
        capacity: "Approx. 1,000 ml",
        sourceSpecification: "【8.25寸】米白贵妃汤面碗",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/06_8.25寸米白贵妃汤面碗/demo-public-product.webp_.webp`,
        group: "Bowls",
      }),
      item({
        id: "flat-plate-8",
        name: "8-inch Flat-Rim Plate",
        dimensions: "Ø 20.5 × H 1.5 cm",
        sourceSpecification: "【8寸】米白平边浅圆盘",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/07_8寸米白平边浅圆盘/demo-public-product.webp_.webp`,
        group: "Round Plates",
      }),
      item({
        id: "flat-plate-10-5",
        name: "10.5-inch Flat-Rim Plate",
        dimensions: "Ø 26.5 × H 2 cm",
        sourceSpecification: "【10.5寸】米白平边浅圆盘",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/08_10.5寸米白平边浅圆盘/demo-public-product.webp_.webp`,
        group: "Round Plates",
      }),
      item({
        id: "oval-shallow-9-25",
        name: "9.25-inch Shallow Oval Plate",
        dimensions: "L 23.5 × W 19 × H 2.5 cm",
        sourceSpecification: "【9.25寸】折边【米白】椭圆浅盘",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/09_9.25寸折边米白椭圆浅盘/demo-public-product.webp_.webp`,
        group: "Oval Plates",
      }),
      item({
        id: "oval-deep-9-5",
        name: "9.5-inch Deep Oval Plate",
        dimensions: "L 24.5 × W 20 × H 4.3 cm",
        sourceSpecification: "【9.5寸】折边【米白】椭圆深盘",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/10_9.5寸折边米白椭圆深盘/demo-public-product.webp_.webp`,
        group: "Oval Plates",
      }),
      item({
        id: "fish-plate-11-5",
        name: "11.5-inch Oval Fish Plate",
        dimensions: "L 30 × W 20 × H 3.5 cm",
        sourceSpecification: "【11.5寸】折边【米白】椭圆鱼盘",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/11_11.5寸折边米白椭圆鱼盘/demo-public-product.webp_.webp`,
        group: "Oval Plates",
      }),
      item({
        id: "fish-plate-15",
        name: "15-inch Large Oval Fish Plate",
        dimensions: "L 38.5 × W 20 × H 4 cm",
        sourceSpecification: "【15寸】折边【米白】椭圆大鱼盘",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/12_15寸折边米白椭圆大鱼盘/demo-public-product.webp_.webp`,
        group: "Oval Plates",
      }),
      item({
        id: "octagonal-dish-5-5",
        name: "5.5-inch Octagonal Dish",
        dimensions: "Ø 14 × H 4 cm",
        capacity: "Approx. 200 ml",
        sourceSpecification: "【5.5寸】米白八角碟",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/13_5.5寸米白八角碟/demo-public-product.webp_.webp`,
        group: "Sculptural Forms",
      }),
      item({
        id: "octagonal-bowl-7-8",
        name: "7.8-inch Octagonal Bowl",
        dimensions: "Ø 20 × H 6 cm",
        capacity: "Approx. 700 ml",
        sourceSpecification: "【7.8寸】米白八角碗",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/14_7.8寸米白八角碗/demo-public-product.webp_.webp`,
        group: "Sculptural Forms",
      }),
      item({
        id: "hat-bowl-small",
        name: "8-inch Small Ribbed Hat Bowl",
        dimensions: "L 21 × W 17.5 × H 6.5 cm",
        sourceSpecification: "【小号】米白螺纹帽子盘【8寸】",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/15_小号米白螺纹帽子盘_8寸/demo-public-product.webp_.webp`,
        group: "Sculptural Forms",
      }),
      item({
        id: "hat-bowl-large",
        name: "9.5-inch Large Ribbed Hat Bowl",
        dimensions: "L 24.5 × W 21 × H 7.5 cm",
        sourceSpecification: "【大号】米白螺纹帽子盘【9.5寸】",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/16_大号米白螺纹帽子盘_9.5寸/demo-public-product.webp_.webp`,
        group: "Sculptural Forms",
      }),
      item({
        id: "olive-bowl-small",
        name: "8.6-inch Small Olive Bowl",
        dimensions: "L 22 × W 15 × H 5.5 cm",
        capacity: "Approx. 550 ml",
        sourceSpecification: "【小号】米白橄榄碗【8.6寸】",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/17_小号米白橄榄碗_8.6寸/demo-public-product.webp_.webp`,
        group: "Sculptural Forms",
      }),
      item({
        id: "olive-bowl-large",
        name: "9.5-inch Large Olive Bowl",
        dimensions: "L 24 × W 16.8 × H 6.5 cm",
        capacity: "Approx. 800 ml",
        sourceSpecification: "【大号】米白橄榄碗【9.5寸】",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/18_大号米白橄榄碗_9.5寸/demo-public-product.webp_.webp`,
        group: "Sculptural Forms",
      }),
      item({
        id: "handled-soup-bowl-7-6",
        name: "7.6-inch Two-Handle Soup Bowl",
        dimensions: "Handle width 23 × mouth Ø 19.5 × H 8 cm",
        capacity: "Approx. 1,200 ml",
        sourceSpecification: "【7.6寸】米白双耳螺纹汤碗",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/19_7.6寸米白双耳螺纹汤碗/demo-public-product.webp_.webp`,
        group: "Sculptural Forms",
      }),
      item({
        id: "ingot-bowl-9-8",
        name: "9.8-inch Ingot Bowl",
        dimensions: "L 25 × W 20 × H 7 cm",
        capacity: "Approx. 900 ml",
        sourceSpecification: "【9.8寸】米白元宝碗",
        purchaseUrl: suhuoUrl,
        sourceImage: `${suhuoRoot}/01_单品SKU/20_9.8寸米白元宝碗/demo-public-product.webp_.webp`,
        group: "Sculptural Forms",
      }),
    ],
    story: {
      eyebrow: "PALE GROUND · IVORY CERAMIC FORMS",
      title: "A quiet place to begin",
      intro:
        "An ivory palette connects cups, bowls, plates and serving pieces through twenty distinct silhouettes. Eighteen pieces are individually priced; the spoon and small handled dip dish are reserved as gifts.",
      hero: sourceAsset(
        `${suhuoRoot}/02_详情与组合参考/demo-public-product.webp`,
      ),
      morning: sourceAsset(
        `${suhuoRoot}/02_详情与组合参考/demo-public-product.webp`,
      ),
      midday: sourceAsset(
        `${suhuoRoot}/02_详情与组合参考/demo-public-product.webp`,
      ),
      gathering: sourceAsset(
        `${suhuoRoot}/02_详情与组合参考/demo-public-product.webp`,
      ),
      texture: sourceAsset(
        `${suhuoRoot}/02_详情与组合参考/demo-public-product.webp`,
      ),
      approach: sourceAsset(
        `${suhuoRoot}/02_详情与组合参考/demo-public-product.webp`,
      ),
      chapterOne: {
        eyebrow: "EVERYDAY",
        title: "Small pieces, kept distinct",
        copy: "The 200 ml tumbler, small bowl and pedestal bowl share a quiet ivory surface. Their different heights and diameters give each form its own outline.",
      },
      chapterTwo: {
        eyebrow: "SERVING",
        title: "Scale through silhouette",
        copy: "The two flat-rim plates measure 20.5 cm and 26.5 cm across. The deep oval plate adds a 4.3 cm wall, giving the ivory surface a different profile.",
      },
      gatheringCopy:
        "Eighteen individually priced pieces share one ivory palette. The spoon and small handled dip dish remain gift-only forms.",
      surfaceTitle: "A quiet ivory field",
      surfaceCopy:
        "A low-sheen ivory surface lets the silhouette lead. Small dark specks are visible on some pieces, adding detail to the otherwise quiet field.",
      surfaceNotes: [
        "Low-sheen ivory surface",
        "Visible dark specks",
        "Wide silhouette range",
      ],
      closing: "A neutral collection led by form.",
    },
  },
  {
    id: "orange-peel-oval",
    kind: "archived-series",
    slug: "citrus-note-oval-plate",
    legacySlug: "orange-peel-oval-plate",
    legacyName: "Orange-Peel Oval Plate",
    name: "Citrus Note",
    titleMain: "Citrus",
    titleAccent: "Note",
    eyebrow: "CITRUS NOTE · ORANGE-SPECKLED OVAL PLATE",
    description:
      "A shallow 8.3-inch oval plate with a dense orange-peel surface and warm speckled colour.",
    image: sourceAsset(
      `${orangeRoot}/02_单品展示图/demo-public-product.webp`,
    ),
    sourceUrl: orangeUrl,
    sourceItemIds: ["DEMO-SOURCE"],
    sourceArchive: `${orangeRoot}/商品档案.json`,
    defaultItemId: "oval-plate-8-3",
    theme: { wash: "#f7edde", ink: "#9d6e2e", border: "#ead8bd" },
    items: [
      item({
        id: "oval-plate-8-3",
        name: "8.3-inch Oval Plate",
        dimensions: "L 21 × W 16.6 × H 2.5 cm",
        capacity: "Approx. 335 g listed weight",
        sourceSpecification: "橘子皮椭圆盘 - 8.3英寸",
        purchaseUrl: orangeUrl,
        sourceImage: `${orangeRoot}/01_单品SKU/8.3英寸橘子皮椭圆盘/规格图.webp`,
        detailImage: `${orangeRoot}/02_单品展示图/demo-public-product.webp`,
        group: "Oval Plate",
      }),
    ],
    story: {
      eyebrow: "CITRUS NOTE · ONE OVAL FORM",
      title: "A single warm note",
      intro:
        "Citrus Note is one 8.3-inch oval ceramic plate, 21 cm long and 16.6 cm wide. Its orange-speckled surface adds a warm accent, while the raised rim keeps the shallow outline clear.",
      hero: sourceAsset(
        `${orangeRoot}/02_单品展示图/demo-public-product.webp`,
      ),
      morning: sourceAsset(
        `${orangeRoot}/02_单品展示图/demo-public-product.webp`,
      ),
      midday: sourceAsset(
        `${orangeRoot}/02_单品展示图/demo-public-product.webp`,
      ),
      gathering: sourceAsset(
        `${orangeRoot}/02_单品展示图/demo-public-product.webp`,
      ),
      texture: sourceAsset(
        `${orangeRoot}/04_工艺与细节/demo-public-product.webp`,
      ),
      approach: sourceAsset(
        `${orangeRoot}/02_单品展示图/demo-public-product.webp`,
      ),
      chapterOne: {
        eyebrow: "FORM",
        title: "A compact oval footprint",
        copy: "At 21 cm long, 16.6 cm wide and 2.5 cm high, the plate has a compact oval footprint. Its rounded raised edge frames the orange-speckled surface.",
      },
      chapterTwo: {
        eyebrow: "USE",
        title: "Scale made visible",
        copy: "The oval outline brings a longer direction to a place setting. Consider it alongside round ivory forms when you want one distinct note of colour.",
      },
      gatheringCopy:
        "Each purchase contains one oval plate. The surrounding bowls, cutlery, food and other styling objects are not included.",
      surfaceTitle: "Warm orange, densely speckled",
      surfaceCopy:
        "A warm ochre-orange field carries dense dark speckling. The lighter exposed underside contrasts with the coloured upper surface and rounded edge.",
      surfaceNotes: [
        "Dense dark speckling",
        "Shallow oval profile",
        "Raised rounded edge",
      ],
      closing: "One useful form, with enough character.",
    },
  },
];

const cleanSelectorFolders = {
  "mood-monet-garden-green": "mood-monet-green",
  "mood-mist-blue-petal": "mood-mist-blue-petal",
  "mood-ocean-blue-plates": "mood-ocean-blue",
  "fangju-yellow-petal": "fangju-yellow-petal",
  "suhuo-matte-ivory": "suhuo-matte-ivory",
  "orange-peel-oval-plate": "orange-peel-oval-plate",
};

const cleanContextSources = {
  "mood-monet-garden-green": `${monetRoot}/03_系列组合展示_含多器型/demo-public-product.webp`,
  "mood-mist-blue-petal": `${petalRoot}/02_多商品组合展示/demo-public-product.webp`,
  "mood-ocean-blue-plates": `${oceanRoot}/03_系列组合展示_含多器型/demo-public-product.webp`,
  "fangju-yellow-petal": `${fangjuRoot}/07_系列组合与详情/demo-public-product.webp`,
  "suhuo-matte-ivory": `${suhuoRoot}/02_详情与组合参考/demo-public-product.webp`,
  "orange-peel-oval-plate": `${orangeRoot}/02_单品展示图/demo-public-product.webp`,
};

const cleanContextFilenames = {
  "mood-monet-garden-green": "mood-monet-green.png",
};

const cleanSelectorFilenameOverrides = {
  "mood-ocean-blue-plates:oval-14-5": "platter-14-5.png",
};

const catalogEntryImages = {
  "suhuo-matte-ivory": "suhuo-matte-ivory-v1.png",
  "fangju-yellow-petal": "fangju-yellow-petal-v1.png",
  "mood-monet-garden-green": "mood-monet-green-v1.png",
  "mood-mist-blue-petal": "mood-mist-blue-petal-v1.png",
  "mood-ocean-blue-plates": "mood-ocean-blue-v3.png",
  "orange-peel-oval-plate": "orange-peel-oval-v1.png",
};

const editorialStoryImages = {
  "fangju-yellow-petal": "/images/aster/home-prototype/story-fangju-v2.png",
  "suhuo-matte-ivory": "/images/aster/home-prototype/story-suhuo-v2.png",
};

for (const series of archivedSeries) {
  const assetKey = series.legacySlug ?? series.slug;
  const contextFilename =
    cleanContextFilenames[assetKey] ?? `${assetKey}.png`;
  series.contextImage = cleanAsset(`context/${contextFilename}`);
  series.catalogImage = `/images/aster/series-entry/generated/${catalogEntryImages[assetKey]}`;
  series.storyImage = editorialStoryImages[assetKey] || series.contextImage;
  series.contextSourceImagePath = cleanContextSources[assetKey];
  const selectorFolder = cleanSelectorFolders[assetKey];
  const setOffer = getSeriesSetOffer(series.id);
  series.fullSet = setOffer
    ? {
        ...setOffer,
        image: series.catalogImage,
        selectorImage: series.catalogImage,
      }
    : null;

  for (const candidate of series.items) {
    const filename =
      cleanSelectorFilenameOverrides[`${assetKey}:${candidate.id}`] ??
      `${candidate.id}.png`;
    candidate.selectorImage = cleanAsset(`${selectorFolder}/${filename}`);
    candidate.price = getSeriesPrice(series.id, candidate.id);
    candidate.isComplimentaryGift = isComplimentaryGift(
      series.id,
      candidate.id,
    );
  }
}

export const getArchivedSeriesBySlug = (slug) =>
  archivedSeries.find((series) => series.slug === slug || series.legacySlug === slug) ?? null;
