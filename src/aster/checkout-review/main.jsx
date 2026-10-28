import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import { CheckoutReview } from "./CheckoutReview.jsx";
import "./checkout-review.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode><CheckoutReview /></React.StrictMode>,
);
