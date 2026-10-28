// Editorial guidance uses existing catalog IDs and measured dimensions.
// Keep commercial identifiers, prices, availability and sourcing in the catalog.
export const seriesGuides = {
  "mood-monet-green": {
    intro: "Garden Shift brings a deeper bowl, a flatter plate and a compact sauce bowl together in mottled green. Compare their footprint and wall height before choosing a piece.",
    comparisonQuestion: "Bowl, plate or sauce bowl?",
    comparison: "The bowl has the tallest wall; the flat plate has the widest diameter. The sauce bowl keeps a raised wall in a smaller footprint.",
    comparisonIds: ["bowl-7", "plate-8", "sauce-bowl-4-5"],
    chapterOneIds: ["bowl-7", "sauce-bowl-4-5"],
    chapterTwoIds: ["plate-8"],
    curation: "A deeper bowl and a flatter plate give the same mottled green two distinct outlines. The smaller sauce bowl repeats that surface without taking up the same space.",
    related: ["Pale Ground ivory ceramics", "/products/pale-ground-ivory-ceramics"],
  },
  "mood-mist-blue-petal": {
    intro: "Petal Haze includes a bowl, a soup plate and two flatter plate formats. A shared blue-grey surface connects them; diameter and wall height distinguish each choice.",
    comparisonQuestion: "How do the four Petal Haze forms differ?",
    comparison: "The bowl is narrower and taller than the soup plate. The two flatter plates offer a wider surface with a lower wall; compare both diameter and height.",
    comparisonIds: ["bowl-6", "soup-plate-8", "plate-8-5", "plate-10-3"],
    chapterOneIds: ["soup-plate-8", "bowl-6"],
    chapterTwoIds: ["plate-8-5", "plate-10-3"],
    curation: "The scalloped outline repeats across deeper vessels and flatter plates. Choose the depth you need first, then the diameter, while keeping the same soft blue-grey note.",
    related: ["Open Tide blue plates", "/products/open-tide-blue-plates"],
  },
  "mood-ocean-blue": {
    intro: "Open Tide offers two round plates and one long oval platter in speckled blue. Compare the round diameters with the oval footprint to see how much space each form occupies.",
    comparisonQuestion: "Round plate or oval platter?",
    comparison: "The round plates differ in diameter and height. The oval platter is longer than either round format, with a low profile and a narrower width than its length.",
    comparisonIds: ["plate-8-5", "plate-10-5", "oval-14-5"],
    chapterOneIds: ["oval-14-5"],
    chapterTwoIds: ["plate-8-5", "plate-10-5"],
    curation: "Two round diameters create a repeating blue outline; the longer oval brings a different direction to the table. The fine speckling holds the three forms together.",
    related: ["Petal Haze bowls and plates", "/products/petal-haze-blue-ceramics"],
  },
  "fangju-yellow": {
    intro: "Sunfold brings fluted bowls, plates, a dip dish and a breakfast cup into one warm-toned family. Compare bowl capacity and plate depth before choosing a form.",
    comparisonQuestion: "How do the three Sunfold bowls differ?",
    comparison: "The rice and noodle bowls share the same listed height but have different diameters and capacities. The serving bowl is wider, slightly lower and has the largest listed capacity.",
    comparisonIds: ["rice-bowl-4-5", "noodle-bowl-6-5", "serving-bowl-7-5"],
    related: ["Pale Ground ivory ceramics", "/products/pale-ground-ivory-ceramics"],
  },
  "suhuo-ivory": {
    intro: "Pale Ground lets silhouette lead: flat-rim plates sit alongside deeper oval forms, bowls and a tumbler. Choose among 18 individually priced pieces; the spoon and small handled dip dish are gift-only forms.",
    comparisonQuestion: "How do the Pale Ground plate profiles differ?",
    comparison: "The two flat-rim plates offer round surfaces at different scales. For an oval footprint, compare the shallow and deep versions by both width and wall height.",
    comparisonIds: ["flat-plate-8", "flat-plate-10-5", "oval-shallow-9-25", "oval-deep-9-5"],
    chapterOneIds: ["tumbler-200", "bowl-4-7", "pedestal-bowl-4-25"],
    chapterTwoIds: ["flat-plate-8", "flat-plate-10-5", "oval-deep-9-5"],
    curation: "Ivory leaves the difference between a flat rim, a raised foot and a handled form easy to read. Begin with one silhouette, then add a contrasting shape in the same quiet palette.",
    related: ["Sunfold fluted ceramics", "/products/sunfold-fluted-ceramics"],
  },
  "orange-peel-oval": {
    intro: "Citrus Note is one orange-speckled oval plate. Its compact footprint adds a warm accent alongside a quieter collection, without requiring a matching set.",
    comparisonQuestion: "Is Citrus Note a collection or one plate?",
    comparison: "Citrus Note contains one oval plate format, with a shallow profile and raised edge. There are no additional sizes or matching bowls in this edit.",
    comparisonIds: ["oval-plate-8-3"],
    chapterOneIds: ["oval-plate-8-3"],
    chapterTwoIds: [],
    curation: "The orange-speckled surface gives one compact oval a clear presence. It can be considered as an accent beside ivory forms, rather than the start of a matching series.",
    related: ["Pale Ground ivory ceramics", "/products/pale-ground-ivory-ceramics"],
  },
};

export function guidePieces(product, ids) {
  return ids.map((id) => {
    const piece = product.items.find((item) => item.id === id);
    if (!piece || piece.isComplimentaryGift) {
      throw new Error(`Missing purchasable guidance piece: ${product.id}:${id}`);
    }
    return piece;
  });
}
