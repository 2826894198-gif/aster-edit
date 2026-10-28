import { StoreImage } from "./StoreImage.jsx";
import { ArrowRight } from "@phosphor-icons/react";
import { homeCollections, shopCollections } from "../data/aster-home.js";
import { SiteLink } from "./Shared.jsx";

function CollectionRow({ collection, index, navigate }) {
  return (
    <SiteLink to={collection.path} navigate={navigate} className="aster-collections-row">
      <span className="aster-collections-number">{String(index + 1).padStart(2, "0")}</span>
      <span className="aster-collections-thumbnail"><StoreImage src={collection.image} alt="" loading="lazy" /></span>
      <span className="aster-collections-copy">
        <small>{collection.kind} · {collection.count} {collection.count === 1 ? "form" : "forms"}</small>
        <strong>{collection.name}</strong>
        <span>{collection.description}</span>
      </span>
      <ArrowRight size={22} aria-hidden="true" />
    </SiteLink>
  );
}

export function CollectionsPage({ navigate }) {
  const reference = shopCollections.find((collection) => collection.id === "wanxiang");
  return (
    <main className="aster-collections-page">
      <div className="aster-collections-frame">
        <header className="aster-collections-intro">
          <div>
            <p className="aster-eyebrow">THE ASTER EDIT ARCHIVE</p>
            <h1>Collections</h1>
          </div>
          <p>Six ceramic edits, from quiet ivory to mottled green and speckled blue. Open a series to compare bowls, plates, cups and serving pieces by size.</p>
        </header>
        <div className="aster-collections-index" aria-label="Launch collections">
          {homeCollections.map((collection, index) => (
            <CollectionRow collection={collection} index={index} navigate={navigate} key={collection.id} />
          ))}
        </div>
        {reference && (
          <section className="aster-collections-reference" aria-labelledby="aster-reference-title">
            <div>
              <p className="aster-eyebrow">ADDITIONAL ARCHIVE</p>
              <h2 id="aster-reference-title">Waterline</h2>
              <p>A separate catalogue study of eight water-duck-blue bowls, plates and a mug.</p>
            </div>
            <CollectionRow collection={reference} index={homeCollections.length} navigate={navigate} />
          </section>
        )}
      </div>
    </main>
  );
}
