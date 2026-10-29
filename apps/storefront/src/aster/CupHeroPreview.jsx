import { Circle } from "@phosphor-icons/react";
import { SiteLink } from "./Shared.jsx";
import "../styles/cup-hero-preview.css";
import { cupColours as colours, cupPath, cupPrice } from "../data/cup.js";

export function CupHeroPreview({ navigate }) {
  return (
    <section className="aster-cup-hero" aria-labelledby="home-cup-title">
      <picture className="cup-hero-media">
        <source
          media="(min-width: 981px) and (min-aspect-ratio: 4/3)"
          srcSet="/assets/aster-hero-viewport-f53e20219f25-980.webp 980w, /assets/aster-hero-viewport-9a1381079221-1448.webp 1448w"
          sizes="100vw"
          width="1448" height="1086"
        />
        <source
          media="(min-width: 981px)"
          srcSet="/assets/aster-hero-space-review-f34a6596aeda-980.webp 980w, /assets/aster-hero-space-review-78d17d50a640-1440.webp 1440w, /assets/aster-hero-space-review-7344002c5e51-1942.webp 1942w"
          sizes="(min-width: 1760px) 1760px, 100vw"
          width="1942" height="809"
        />
        <img
          src="/assets/aster-home-20261019-9a9363d5a7bd-1280.webp"
          srcSet="/assets/aster-home-20261019-e05312be1295-480.webp 480w, /assets/aster-home-20261019-5ee3786d3195-800.webp 800w, /assets/aster-home-20261019-9a9363d5a7bd-1280.webp 1280w, /assets/aster-home-20261019-4c81e59c7573-1832.webp 1832w"
          sizes="100vw"
          alt="Purple-grey, olive and deep green rolling-bead cups with ceramic bowls and plates on a sunlit table"
          width="1832" height="858" loading="eager" decoding="async" fetchPriority="high"
        />
      </picture>
      <div className="cup-hero-copy">
        <div className="cup-hero-heading">
          <p className="aster-editorial-kicker">CERAMIC CUP WITH A ROLLING BEAD</p>
          <h1 id="home-cup-title">A little pause,<br />in your hands.</h1>
        </div>
        <p className="cup-hero-description">
          <span className="cup-hero-mobile-text">A ribbed ceramic cup with a bead that turns under your thumb. Explore three glaze colours and a small tactile detail.</span>
          <span className="cup-hero-wide-text">A ribbed ceramic cup with a little bead to roll beneath your thumb.</span>
        </p>
        <div className="cup-hero-colours" aria-label="Three colours: purple-grey, olive and deep green">
          {colours.map((colour) => <Circle key={colour.name} size={18} weight="fill" color={colour.colour} aria-hidden="true" />)}
          <span className="cup-hero-mobile-text">APPROX. 400ML · THREE COLOURS</span>
          <span className="cup-hero-wide-text">THREE GLAZE COLOURS</span>
        </div>
        <div className="cup-hero-action">
          <SiteLink to={cupPath} navigate={navigate} className="aster-editorial-primary">Discover the cup</SiteLink>
          <p className="cup-hero-status">
            <span className="cup-hero-mobile-text">${cupPrice} USD per cup · Free shipping on cup-only orders.</span>
            <span className="cup-hero-wide-text">${cupPrice} USD per cup</span>
            <span className="cup-hero-wide-text">Free shipping on cup-only orders.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
