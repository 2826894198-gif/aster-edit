import { ArrowRight } from "@phosphor-icons/react";
import { SiteLink } from "./Shared.jsx";
import "../styles/material-entrances.css";

const materials = [
  {
    id: "ceramics",
    name: "Ceramics",
    description: "Everyday forms, quietly considered.",
    path: "/collections",
    alt: "A Sunfold fluted ceramic bowl resting on matching plates in warm daylight",
  },
  {
    id: "crystal",
    name: "Crystal",
    description: "A study in line and light.",
    path: "/products/prism-crystal-tumbler",
    alt: "One upright Wide flute Prism crystal tumbler on a warm neutral tabletop",
  },
];

export function MaterialEntrances({ navigate }) {
  return (
    <section
      className="aster-material-section"
      id="materials"
      aria-labelledby="material-heading"
    >
      <div className="aster-material-frame">
        <div className="aster-material-intro">
          <h2 id="material-heading">Explore by material.</h2>
          <p>
            Ceramic forms and crystal details, brought together for the table.
          </p>
        </div>
        <div className="aster-material-cards">
          {materials.map((material) => (
            <SiteLink
              key={material.id}
              to={material.path}
              navigate={navigate}
              className={`aster-material-card is-${material.id}`}
              aria-label={`Explore ${material.name.toLowerCase()}`}
            >
              <img
                src={`/assets/material-preview/${material.id}-category-960.webp`}
                srcSet={`/assets/material-preview/${material.id}-category-480.webp 480w, /assets/material-preview/${material.id}-category-960.webp 960w`}
                sizes="(min-width: 1200px) 450px, (min-width: 681px) 45vw, 100vw"
                width="1470"
                height="1070"
                loading="lazy"
                decoding="async"
                alt={material.alt}
              />
              <span className="aster-material-card-copy">
                <strong>{material.name}</strong>
                <span>{material.description}</span>
                <span className="aster-material-action">
                  Explore {material.name.toLowerCase()}
                  <ArrowRight size={15} aria-hidden="true" />
                </span>
              </span>
            </SiteLink>
          ))}
        </div>
      </div>
    </section>
  );
}
