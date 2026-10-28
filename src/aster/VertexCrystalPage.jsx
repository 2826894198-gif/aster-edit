import { useEffect, useRef, useState } from "react";
import { MagnifyingGlassPlus, Minus, Plus, X } from "@phosphor-icons/react";
import {
  vertexProduct,
  vertexColours,
  vertexForms,
  vertexPhoto,
  vertexGroupPhoto,
  vertexDetailPhoto,
  vertexQuestions,
  vertexProducts,
} from "../data/vertex-crystal.js";
import { StoreImage } from "./StoreImage.jsx";
import { SiteLink } from "./Shared.jsx";
import "../styles/vertex-crystal.css";

const usd = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
const contact =
  "mailto:support@example.test?subject=Vertex%20Crystal%20Glass%20enquiry";

function readSelection() {
  const params = new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.search,
  );
  const form =
    vertexForms.find((item) => item.id === params.get("form")) ||
    vertexForms[0];
  return {
    form: form.id,
    colour: form.colours.includes(params.get("colour"))
      ? params.get("colour")
      : "violet",
    view: params.get("view") === "side" ? "side" : "front",
  };
}

function Photo({ media, onEnlarge, priority = false, className = "" }) {
  return (
    <button
      type="button"
      className={`vertex-photo ${className}`}
      onClick={() => onEnlarge(media)}
      aria-label={`Enlarge ${media.label}`}
    >
      <StoreImage
        src={media.src}
        alt={media.alt}
        width={media.width}
        height={media.height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        sizes="(min-width: 1200px) 650px, (min-width: 801px) 55vw, 100vw"
      />
      <span className="vertex-zoom">
        <MagnifyingGlassPlus size={19} aria-hidden="true" />
      </span>
    </button>
  );
}

export function VertexCrystalPage({ navigate, onAdd, onBuy }) {
  const [selection, setSelection] = useState(readSelection);
  const [enlarged, setEnlarged] = useState(null);
  const dialog = useRef(null);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const request = useRef(null);
  const form = vertexForms.find((item) => item.id === selection.form);
  const colour = vertexColours.find((item) => item.id === selection.colour);
  const media = vertexPhoto(selection.form, selection.colour, selection.view);
  const selectedProduct = vertexProducts.find(
    (item) => item.formId === selection.form && item.colourId === selection.colour,
  );
  useEffect(() => () => request.current?.abort(), []);
  const buyNow = async () => {
    if (!selectedProduct || !onBuy || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setNotice("");
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      await onBuy(selectedProduct, quantity, controller.signal);
    } catch (error) {
      setNotice(
        error.name === "AbortError" || error instanceof TypeError
          ? "Could not reach checkout. Your selection is in your bag; please try again."
          : error.message,
      );
    } finally {
      window.clearTimeout(timeout);
      request.current = null;
      setBusy(false);
    }
  };

  useEffect(() => {
    const sync = () => setSelection(readSelection());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => {
    if (!enlarged) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.current.open) dialog.current.showModal();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [enlarged]);

  const select = (next, clearAnchor = false) => {
    if (busy) return;
    setNotice("");
    const targetForm = vertexForms.find((item) => item.id === next.form);
    const safe = {
      ...next,
      colour: targetForm.colours.includes(next.colour) ? next.colour : "violet",
    };
    setSelection(safe);
    const url = new URL(window.location.href);
    if (clearAnchor) url.hash = "";
    for (const [key, value] of Object.entries(safe))
      url.searchParams.set(key, value);
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  };

  return (
    <main className="vertex-page" id="vertex-main">
      <a className="vertex-skip" href="#vertex-details">
        Skip to glass details
      </a>
      <nav className="vertex-breadcrumb" aria-label="Breadcrumb">
        <SiteLink to="/shop" navigate={navigate}>
          Shop
        </SiteLink>
        <span aria-hidden="true">/</span>
        <span>Vertex</span>
      </nav>
      <section className="vertex-hero" aria-labelledby="vertex-title">
        <div className="vertex-gallery">
          <Photo
            media={media}
            onEnlarge={setEnlarged}
            priority
            className="vertex-primary-photo"
          />
          <div className="vertex-gallery-bottom">
            <div
              className="vertex-thumbnails"
              role="group"
              aria-label="Photograph view"
            >
              {["front", "side"].map((view) => {
                const image = vertexPhoto(
                  selection.form,
                  selection.colour,
                  view,
                );
                return (
                  <button
                    key={view}
                    type="button"
                    aria-label={`Show ${view === "front" ? "upright" : "side and base"} view`}
                    aria-pressed={selection.view === view}
                    disabled={busy}
                    onClick={() => select({ ...selection, view })}
                  >
                    <StoreImage
                      src={image.src}
                      alt=""
                      width={image.width}
                      height={image.height}
                      sizes="72px"
                    />
                  </button>
                );
              })}
            </div>
            <p aria-live="polite">
              {form.name} · {colour.name}
              <br />
              <span>
                {selection.view === "front"
                  ? "Upright view"
                  : "Side & base view"}
              </span>
            </p>
          </div>
        </div>
        <div className="vertex-summary">
          <p className="vertex-material">Crystal glassware</p>
          <h1 id="vertex-title" tabIndex={-1}>
            Vertex <br />
            Crystal Glass
          </h1>
          <p className="vertex-lead">Clear above. Colour below.</p>
          <p className="vertex-description">{vertexProduct.description}</p>
          <div className="vertex-price">
            <del>
              <span className="sr-only">Reference price </span>
              {usd(vertexProduct.regularPrice)}
            </del>
            <strong>
              <span className="sr-only">Current price </span>
              {usd(vertexProduct.price)}
            </strong>
            <span>USD / glass</span>
          </div>
          <fieldset className="vertex-options" disabled={busy}>
            <legend>Choose a form</legend>
            <div className="vertex-form-options">
              {vertexForms.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selection.form === item.id}
                  onClick={() => select({ ...selection, form: item.id })}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="vertex-options" disabled={busy}>
            <legend>
              Base colour: <strong>{colour.name}</strong>
            </legend>
            <div className="vertex-colours">
              {vertexColours
                .filter((item) => form.colours.includes(item.id))
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selection.colour === item.id}
                    onClick={() => select({ ...selection, colour: item.id })}
                  >
                    <span
                      style={{ backgroundColor: item.swatch }}
                      aria-hidden="true"
                    />
                    {item.name}
                  </button>
                ))}
            </div>
          </fieldset>
          <div className="vertex-purchase" aria-busy={busy}>
            <div className="vertex-quantity" role="group" aria-label="Glass quantity">
              <button type="button" aria-label="Decrease glass quantity" disabled={busy || quantity === 1} onClick={() => setQuantity((value) => value - 1)}>
                <Minus size={16} aria-hidden="true" />
              </button>
              <output aria-live="polite" aria-label="Quantity">{quantity}</output>
              <button type="button" aria-label="Increase glass quantity" disabled={busy || quantity === 20} onClick={() => setQuantity((value) => value + 1)}>
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>
            <button type="button" className="vertex-add" disabled={busy || !selectedProduct} onClick={() => onAdd?.(selectedProduct, null, quantity)}>
              Add to bag
            </button>
            <button type="button" className="vertex-buy" disabled={busy || !selectedProduct} onClick={buyNow}>
              {busy ? "Opening checkout…" : "Buy now"}
            </button>
            <p className="vertex-order-summary" aria-live="polite">
              {quantity === 1 ? "One glass" : `${quantity} glasses`} · {usd(vertexProduct.price * quantity)} USD · Free shipping
            </p>
          </div>
          {notice && <p className="vertex-purchase-notice" role="alert">{notice}</p>}
          <div className="vertex-purchase-links">
            <a href="#vertex-details">Form & detail</a>
            <a href={contact}>Ask about Vertex</a>
          </div>
        </div>
      </section>

      <section
        className="vertex-detail-band"
        id="vertex-details"
        aria-labelledby="vertex-detail-title"
      >
        <Photo
          media={vertexDetailPhoto}
          onEnlarge={setEnlarged}
          className="vertex-macro"
        />
        <div className="vertex-detail-copy">
          <h2 id="vertex-detail-title">
            The shape is <br />
            in the turn.
          </h2>
          <p>
            Broad, curved faces carry a quiet twist down the clear wall. At the
            foot, those lines draw together into a more angular, square outline.
          </p>
          <dl>
            <div>
              <dt>A circular rim</dt>
              <dd>A simple opening above the sculptural sides.</dd>
            </div>
            <div>
              <dt>Sweeping clear faces</dt>
              <dd>Long reflections reveal each change of surface.</dd>
            </div>
            <div>
              <dt>A coloured square foot</dt>
              <dd>
                Depth and colour collect at the base, where the form is most
                intricate.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section
        className="vertex-forms-section"
        aria-labelledby="vertex-forms-title"
      >
        <div className="vertex-section-intro">
          <h2 id="vertex-forms-title">
            Two forms.
            <br />
            One sculptural line.
          </h2>
          <p>
            Compact and broad, or tall and elongated. Both bring a rounded
            opening and an angular base into the same clear silhouette.
          </p>
        </div>
        <div className="vertex-form-profiles">
          {vertexForms
            .slice()
            .reverse()
            .map((item) => (
              <article key={item.id}>
                <Photo
                  media={vertexPhoto(
                    item.id,
                    item.id === "low" ? "green" : "blue",
                  )}
                  onEnlarge={setEnlarged}
                />
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <button
                    type="button"
                    className="vertex-text-action"
                    onClick={() => {
                      select(
                        {
                          form: item.id,
                          colour: item.id === "low" ? "green" : "blue",
                          view: "front",
                        },
                        true,
                      );
                      const heading = document.getElementById("vertex-title");
                      heading.focus({ preventScroll: true });
                      heading.scrollIntoView({
                        block: "start",
                        behavior: "instant",
                      });
                    }}
                  >
                    View the {item.id} form
                  </button>
                </div>
              </article>
            ))}
        </div>
      </section>

      <section
        className="vertex-colour-band"
        aria-labelledby="vertex-colour-title"
      >
        <div className="vertex-colour-copy">
          <h2 id="vertex-colour-title">
            Colour, held <br />
            at the base.
          </h2>
          <p>
            Red, Amber, Blue, Indigo, Violet and Green. The upper body stays
            clear while each coloured foot adds its own depth to the silhouette.
          </p>
          <p>
            Look from the side to follow the colour through the base. Turn to
            the upright view to see it rise into the curves as a reflection.
          </p>
          <div
            className="vertex-palette-labels"
            aria-label="Complete colour palette"
          >
            {vertexColours.map((item) => (
              <span key={item.id}>
                <i
                  style={{ backgroundColor: item.swatch }}
                  aria-hidden="true"
                />
                {item.name}
              </span>
            ))}
          </div>
        </div>
        <figure>
          <Photo media={vertexGroupPhoto} onEnlarge={setEnlarged} />
          <figcaption>
            All six colours, photographed together on a display stand. Each
            glass is priced individually.
          </figcaption>
        </figure>
      </section>

      <section
        className="vertex-questions"
        aria-labelledby="vertex-questions-title"
      >
        <h2 id="vertex-questions-title">A closer look</h2>
        <div>
          {vertexQuestions.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
      <div className="vertex-closing">
        <SiteLink to="/products/prism-crystal-tumbler" navigate={navigate}>
          Explore Prism crystal
        </SiteLink>
        <SiteLink to="/shop" navigate={navigate}>
          Back to the archive
        </SiteLink>
      </div>

      <dialog
        ref={dialog}
        className="vertex-dialog"
        aria-label="Enlarged crystal glass photograph"
        onClose={() => setEnlarged(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current.close();
        }}
      >
        <button
          type="button"
          className="vertex-dialog-close"
          onClick={() => dialog.current.close()}
          aria-label="Close enlarged photograph"
        >
          <X size={24} aria-hidden="true" />
        </button>
        {enlarged && (
          <figure>
            <img
              src={enlarged.src}
              alt={enlarged.alt}
              width={enlarged.width}
              height={enlarged.height}
            />
            <figcaption>{enlarged.label}</figcaption>
          </figure>
        )}
      </dialog>
    </main>
  );
}
