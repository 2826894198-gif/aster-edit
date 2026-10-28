import { StoreImage } from "./StoreImage.jsx";
import { useEffect, useRef, useState } from "react";
import { CaretUp, X } from "@phosphor-icons/react";
import { asterConfig, formatPrice } from "../data/aster.js";
import { SiteLink } from "./Shared.jsx";
import { EditorialSeriesStory } from "./EditorialSeriesStory.jsx";
import { FangjuStory } from "./FangjuStory.jsx";
import { trackAsterEvent } from "../analytics/aster-geo.js";

function PieceOptions({ items, selectedId, onSelect, mobile = false }) {
  return (
    <div
      className={
        mobile ? "wanxiang-mobile-option-grid" : "wanxiang-option-grid"
      }
    >
      {items.map((candidate) => {
        const selected = candidate.id === selectedId;
        const fullSet = candidate.id === "full-set";
        const unavailable =
          candidate.availability === "out-of-stock-at-capture";
        return (
          <button
            type="button"
            className={`${selected ? "is-selected" : ""}${
              fullSet ? " is-full-set" : ""
            }${unavailable ? " is-unavailable" : ""}`}
            aria-pressed={selected}
            disabled={unavailable}
            onClick={() => onSelect(candidate)}
            key={candidate.id}
          >
            <StoreImage
              src={candidate.selectorImage || candidate.image}
              alt=""
              loading="lazy"
            />
            <span>
              <strong>{candidate.name}</strong>
              <small>
                {unavailable
                  ? "Out of stock"
                  : fullSet
                    ? `${candidate.contents} · Gift included`
                    : candidate.dimensions}
              </small>
            </span>
            {!unavailable && (
              <strong className="wanxiang-option-price">
                {formatPrice(candidate.price)}
              </strong>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MobileSelectorSheet({ product, selected, onSelect, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    dialogRef.current?.querySelector("button")?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = [
        ...dialogRef.current.querySelectorAll("button:not(:disabled)"),
      ];
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable.at(-1)?.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === focusable.at(-1)
      ) {
        event.preventDefault();
        focusable[0]?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="wanxiang-sheet-backdrop" onClick={onClose}>
      <section
        ref={dialogRef}
        className="wanxiang-mobile-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${product.id}-sheet-title`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="wanxiang-sheet-handle" aria-hidden="true" />
        <header>
          <div>
            <p className="aster-eyebrow">{product.eyebrow}</p>
            <h2 id={`${product.id}-sheet-title`}>Choose your piece</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close piece selector"
          >
            <X size={20} />
          </button>
        </header>
        <div className="wanxiang-sheet-content">
          <PieceOptions
            mobile
            items={product.items}
            selectedId={selected.id}
            onSelect={(candidate) => {
              onSelect(candidate);
              onClose();
            }}
          />
        </div>
      </section>
    </div>
  );
}

export function SeriesPage({ product, navigate, onAdd, search = window.location.search }) {
  const purchaseRef = useRef(null);
  const purchasableItems = product.items.filter(
    (candidate) => !candidate.isComplimentaryGift,
  );
  const options = product.fullSet
    ? [product.fullSet, ...purchasableItems]
    : purchasableItems;
  const defaultItem =
    options.find((candidate) => candidate.id === product.defaultItemId) ||
    options.find(
      (candidate) => candidate.availability !== "out-of-stock-at-capture",
    ) ||
    options[0];
  const requestedId = new URLSearchParams(search).get("piece");
  const initialId = options.some((candidate) => candidate.id === requestedId)
    ? requestedId
    : defaultItem.id;
  const [selectedId, setSelectedId] = useState(initialId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const selected =
    options.find((candidate) => candidate.id === selectedId) || defaultItem;
  const storyProduct = { ...product, items: purchasableItems };
  const storySelected =
    selected.id === product.fullSet?.id ? purchasableItems[0] : selected;
  const unavailable = selected.availability === "out-of-stock-at-capture";

  useEffect(() => {
    trackAsterEvent("view_item", {
      ...selected,
      id: `${product.id}-${selected.id}`,
      name: `${product.name} · ${selected.name}`,
    });
    // A change of option is separately recorded as select_item below.
  }, [product.id]);

  const selectPiece = (candidate) => {
    setSelectedId(candidate.id);
    trackAsterEvent("select_item", {
      ...candidate,
      id: `${product.id}-${candidate.id}`,
      name: `${product.name} · ${candidate.name}`,
    });
  };

  const selectFromStory = (candidate) => {
    selectPiece(candidate);
    window.requestAnimationFrame(() => {
      purchaseRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    });
  };

  useEffect(() => {
    setSelectedId(initialId);
    setSheetOpen(false);
  }, [product.id, initialId]);

  const addSelected = () => {
    if (unavailable) return;
    onAdd(
      {
        ...selected,
        id: `${product.id}-${selected.id}`,
        name: `${product.name} · ${selected.name}`,
        price: selected.price,
        description: product.description,
      },
      null,
      1,
    );
  };

  useEffect(() => {
    if (!sheetOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sheetOpen]);

  return (
    <main
      className="aster-product-page wanxiang-page series-page"
      style={{
        "--wanxiang-blue-wash": product.theme.wash,
        "--wanxiang-blue-ink": product.theme.ink,
        "--aster-blue-ink": product.theme.ink,
        "--series-border": product.theme.border,
      }}
    >
      <div className="aster-content">
        <nav className="aster-breadcrumb" aria-label="Breadcrumb">
          <SiteLink to="/" navigate={navigate}>
            Home
          </SiteLink>
          <span>›</span>
          <SiteLink to="/collections" navigate={navigate}>
            Collections
          </SiteLink>
          <span>›</span>
          <span>{product.name}</span>
        </nav>

        <section
          ref={purchaseRef}
          id={`${product.id}-purchase`}
          className="wanxiang-top"
        >
          <div className="wanxiang-gallery">
            <div className="wanxiang-gallery-main">
              <StoreImage
                src={selected.selectorImage || selected.image}
                alt={`${product.name} · ${selected.name}`}
                fetchPriority="high"
              />
            </div>
          </div>

          <div className="wanxiang-intro">
            <p className="aster-eyebrow">{product.eyebrow}</p>
            <h1>
              {product.titleMain}
              {product.titleAccent && (
                <>
                  {product.name === `${product.titleMain}${product.titleAccent}` ? "" : " "}
                  <span>{product.titleAccent}</span>
                </>
              )}
            </h1>
            <p className="wanxiang-lead">{product.description}</p>

            <div className="wanxiang-selector">
              <div className="wanxiang-selector-heading">
                <span>Choose your piece</span>
              </div>
              <PieceOptions
                items={options}
                selectedId={selected.id}
                onSelect={selectPiece}
              />
            </div>

            <div className="aster-purchase-summary">
              <p>
                <span>Selected</span>
                <strong>{selected.name}</strong>
              </p>
              <strong className="aster-purchase-price">
                {formatPrice(selected.price)}
              </strong>
            </div>
            <p className="aster-purchase-note">
              {selected.includesComplimentaryGift
                ? asterConfig.setGiftShortNote
                : asterConfig.shippingShortNote}
            </p>
            <div className="wanxiang-purchase-actions">
              <button
                type="button"
                disabled={unavailable}
                onClick={addSelected}
              >
                {unavailable ? "Out of stock" : "Add to Cart"}
              </button>
              <button
                type="button"
                disabled={unavailable}
                onClick={addSelected}
              >
                {unavailable ? "Out of stock" : "Buy Now"}
              </button>
            </div>
          </div>
        </section>
      </div>

      {product.id === "fangju-yellow" ? (
        <FangjuStory
          product={storyProduct}
          selected={storySelected}
          purchaseSelection={selected}
          navigate={navigate}
          onSelect={selectFromStory}
        />
      ) : (
        <EditorialSeriesStory
          product={storyProduct}
          selected={storySelected}
          purchaseSelection={selected}
          navigate={navigate}
          onSelect={selectFromStory}
        />
      )}

      <div className="wanxiang-mobile-buybar">
        <button
          className="wanxiang-mobile-current"
          type="button"
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen(true)}
        >
          <StoreImage src={selected.selectorImage || selected.image} alt="" />
          <span>
            <small>Current choice · {formatPrice(selected.price)}</small>
            <strong>{selected.name}</strong>
          </span>
          <CaretUp size={15} aria-hidden="true" />
        </button>
        <button
          className="wanxiang-mobile-cart"
          type="button"
          disabled={unavailable}
          onClick={addSelected}
        >
          {unavailable ? "Out of stock" : "Add to Cart"}
        </button>
        <button
          className="wanxiang-mobile-buy"
          type="button"
          disabled={unavailable}
          onClick={addSelected}
        >
          {unavailable ? "Out of stock" : "Buy Now"}
        </button>
      </div>

      {sheetOpen && (
        <MobileSelectorSheet
          product={{ ...product, items: options }}
          selected={selected}
          onSelect={selectPiece}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </main>
  );
}
