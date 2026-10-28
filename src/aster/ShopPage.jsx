import { StoreImage } from "./StoreImage.jsx";
import { ArrowRight } from "@phosphor-icons/react";
import { shopCollections } from "../data/aster-home.js";
import { cupProduct } from "../data/cup.js";
import { crystalProduct } from "../data/crystal.js";
import { vertexProduct } from "../data/vertex-crystal.js";
import { SectionTitle, SiteLink } from "./Shared.jsx";
import "../styles/cup-shop.css";

export function ShopPage({ navigate }) {
  const launchCollections = shopCollections.filter((collection) => collection.id !== "wanxiang");

  return (
    <main className="aster-shop-page">
      <section className="aster-shop-heading">
        <SectionTitle
          eyebrow="CERAMICS & GLASSWARE"
          title="Shop the Archive"
          level={1}
        />
        <p>Explore six ceramic edits, our rolling-bead cup and sculptural crystal glassware. Open a collection or get to know an individual object.</p>
      </section>

      <section
        className="aster-home-section aster-home-collections aster-shop-library"
        aria-label="Aster Edit product library"
      >
        <div className="aster-shop-objects aster-shop-objects-extended" role="group" aria-label="Cups and crystal">
          <SiteLink to={cupProduct.path} navigate={navigate} className="aster-shop-object" aria-label={`${cupProduct.name}, three colours, $${cupProduct.price} USD per cup. Free shipping.`}>
            <span className="aster-shop-object-image">
              <StoreImage src={cupProduct.image} alt="Purple-grey, olive and deep-green rolling-bead ceramic cups, staggered on white" width="1800" height="1200" loading="eager" fetchPriority="high" sizes="(min-width: 1000px) 280px, (min-width: 721px) 40vw, 50vw" />
            </span>
            <div className="aster-shop-object-copy">
              <h2>{cupProduct.name}</h2>
              <span className="aster-shop-object-options">Ceramic · 3 colours</span>
              <span className="aster-shop-object-description">A rolling bead tucked into the handle of a ribbed ceramic cup.</span>
              <span className="aster-shop-object-price">${cupProduct.price} <small>USD / cup</small></span>
              <span className="aster-shop-object-action">Explore the cup <ArrowRight size={16} aria-hidden="true" /></span>
            </div>
          </SiteLink>
          <SiteLink to={crystalProduct.path} navigate={navigate} className="aster-shop-object aster-shop-object-crystal" aria-label={`${crystalProduct.name}, ${crystalProduct.price} USD per tumbler. Twelve zodiac signs. Free shipping.`}>
            <span className="aster-shop-object-image">
              <StoreImage src={crystalProduct.image} alt="Shared form of the Prism zodiac crystal tumbler, with vertical facets and a substantial base" width="1073" height="1466" loading="eager" sizes="(min-width: 1000px) 280px, (min-width: 721px) 40vw, 50vw" />
            </span>
            <div className="aster-shop-object-copy">
              <h2>{crystalProduct.name}</h2>
              <span className="aster-shop-object-options">Crystal · 12 zodiac signs</span>
              <span className="aster-shop-object-description">Intricate facets and a quiet play of light.</span>
              <span className="aster-shop-object-price"><del>${crystalProduct.regularPrice}</del> ${crystalProduct.price} <small>USD / tumbler</small></span>
              <span className="aster-shop-object-action">Explore Prism <ArrowRight size={16} aria-hidden="true" /></span>
            </div>
          </SiteLink>
          <SiteLink to={vertexProduct.path} navigate={navigate} className="aster-shop-object aster-shop-object-vertex" aria-label={`${vertexProduct.name}, ${vertexProduct.price} USD per glass. Explore two forms and six base colours.`}>
            <span className="aster-shop-object-image"><StoreImage src={vertexProduct.image} alt="Tall Vertex crystal glass with sweeping clear sides and a violet square base" width="1254" height="1254" sizes="(min-width: 1001px) 360px, (min-width: 721px) 40vw, 50vw" /></span>
            <div className="aster-shop-object-copy">
              <h2>{vertexProduct.name}</h2>
              <span className="aster-shop-object-options">Crystal · 2 forms · 6 base colours</span>
              <span className="aster-shop-object-description">Sweeping clear faces and colour held at the base.</span>
              <span className="aster-shop-object-price"><del>${vertexProduct.regularPrice}</del> ${vertexProduct.price} <small>USD / glass</small></span>
              <span className="aster-shop-object-action">Explore Vertex <ArrowRight size={16} aria-hidden="true" /></span>
            </div>
          </SiteLink>
        </div>
        <div className="aster-shop-tableware-heading">
          <h2>Ceramic tableware</h2>
          <span>6 collections</span>
        </div>
        <div className="aster-home-collection-grid">
          {launchCollections.map((collection) => (
            <SiteLink
              to={collection.path}
              navigate={navigate}
              className="aster-home-collection-card"
              key={collection.id}
            >
              <span className="aster-home-collection-image">
                <StoreImage
                  src={collection.image}
                  width="1536"
                  height="1024"
                  sizes="(min-width: 1000px) 400px, (min-width: 721px) 50vw, 100vw"
                  alt={`${collection.name}, complete series catalogue view`}
                  style={{ objectPosition: collection.imagePosition }}
                />
                <span className="aster-home-collection-kind">
                  {collection.kind}
                </span>
              </span>
              <span className="aster-home-collection-copy">
                <span className="aster-home-card-meta">
                  {collection.count} {collection.count === 1 ? "form" : "forms"}
                </span>
                <strong>{collection.name}</strong>
                <span>{collection.description}</span>
                <span className="aster-home-card-action">
                  View products <ArrowRight size={15} />
                </span>
              </span>
            </SiteLink>
          ))}
        </div>
      </section>
    </main>
  );
}
