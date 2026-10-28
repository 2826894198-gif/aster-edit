import { cupPrice } from "./cup.js";

// Owner-confirmed facts and reviewed copy. Unknown dimensions, bead material,
// packaging and delivery promises stay out of the customer-facing page.
export const cupSeo = {
  title: "Ceramic Fidget Mug with a Rolling Bead | Aster Edit",
  description: "Explore a ceramic fidget mug with a thumb-rolling bead, three glaze colours and an approx. 400ml capacity. View the cup, care details and ordering status.",
  primaryIntent: "ceramic fidget mug with rotating bead",
};
export const cupGestureImage = "/images/aster/cup-preview/upright-20261015/purple-grey-gesture.webp";
export const cupColourStories = [
  { id: "purple-grey", title: "Purple-grey", description: "A muted purple-grey glaze, with darker lines following the ribs." },
  { id: "olive", title: "Olive", description: "An earthy yellow-green glaze with visible mottling across the surface." },
  { id: "deep-green", title: "Deep green", description: "A darker green glaze, with lighter and deeper tones around the ribs." },
];
export const cupQuestions = [
  ["What is a ceramic fidget mug?", "It is a ceramic cup with a small moving detail for your fingers. Here, a black-and-white bead sits at the top of the handle and turns under your thumb."],
  ["How does the bead work?", "Move your thumb across the exposed part of the bead to turn it within its recessed seat. The gesture illustration above shows where your thumb meets the bead."],
  [`Is the $${cupPrice} price for all three cups?`, `No. The displayed $${cupPrice} USD price is for one cup in one chosen colour. The three-cup image shows the colour options together.`],
  ["How much does it hold?", "Approximately 400ml. Full measurements will be added when confirmed."],
  ["Which colours are available to explore?", "Purple-grey, olive and deep green. Selecting a colour changes the main product view."],
  ["Can I put it in the dishwasher or microwave?", "The cup is suitable for dishwasher cleaning. Microwave use is not recommended."],
  ["When can I order?", `All three colours are available to order at $${cupPrice} USD per cup, with free shipping. Choose a colour and quantity, then add to your bag or buy now.`],
];
