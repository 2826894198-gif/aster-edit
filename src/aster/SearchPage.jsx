import { StoreImage } from "./StoreImage.jsx";
import { useState } from "react";
import { ArrowRight, MagnifyingGlass, X } from "@phosphor-icons/react";
import { shopCollections } from "../data/aster-home.js";
import { filterSearchEntries } from "./search-index.js";
import { SiteLink } from "./Shared.jsx";

export function SearchPage({ navigate }) {
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get("q") || "");
  const results = filterSearchEntries(query);
  const hasQuery = Boolean(query.trim());

  return (
    <main className="aster-search-page">
      <div className="aster-search-page-inner">
        <header className="aster-search-heading">
          <p className="aster-eyebrow">ASTER EDIT · PRODUCT FINDER</p>
          <h1>Find your next piece.</h1>
          <p>Search the collection names, individual forms and sizes in the archive.</p>
        </header>
        <div className="aster-search-field" role="search">
          <MagnifyingGlass size={22} aria-hidden="true" />
          <label className="sr-only" htmlFor="aster-search-input">Search products</label>
          <input
            id="aster-search-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try ‘blue plate’ or ‘serving bowl’"
            autoComplete="off"
          />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={18} /></button>}
        </div>
        <div className="aster-search-result-heading">
          <span>{hasQuery ? `${results.length} ${results.length === 1 ? "result" : "results"}` : "Browse collections"}</span>
          <SiteLink to="/collections" navigate={navigate}>All collections <ArrowRight size={16} /></SiteLink>
        </div>
        {hasQuery && !results.length ? (
          <div className="aster-search-empty">
            <h2>No matching pieces.</h2>
            <p>Try a collection name, a colour or a form such as bowl, plate or cup.</p>
          </div>
        ) : (
          <div className="aster-search-results">
            {(hasQuery ? results : shopCollections.map((collection) => ({
              id: collection.id,
              kind: "Collection",
              title: collection.name,
              detail: `${collection.count} ${collection.count === 1 ? "form" : "forms"}`,
              image: collection.image,
              href: collection.path,
            }))).map((entry) => (
              <a className="aster-search-result" href={entry.href} key={entry.id}>
                <span className="aster-search-result-image"><StoreImage src={entry.image} alt="" loading="lazy" /></span>
                <span className="aster-search-result-copy">
                  <small>{entry.kind}{entry.unavailable ? " · Out of stock" : ""}</small>
                  <strong>{entry.title}</strong>
                  <span>{entry.detail}</span>
                </span>
                <ArrowRight size={19} aria-hidden="true" />
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
