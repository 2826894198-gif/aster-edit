import { StoreImage } from "./StoreImage.jsx";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { CaretUp, Cube, ImageSquare, X } from "@phosphor-icons/react";
import { SiteLink } from "./Shared.jsx";
import { WanxiangStory } from "./WanxiangStory.jsx";
import { asterConfig, formatPrice } from "../data/aster.js";

const WanxiangDeepPlate3D = lazy(() =>
  import("./WanxiangDeepPlate3D.jsx").then((module) => ({
    default: module.WanxiangDeepPlate3D,
  })),
);

function WanxiangGallery({ selected }) {
  const supportsThreeDimensions = selected.id === "deep-plate-8";
  const [viewMode, setViewMode] = useState("2d");

  useEffect(() => setViewMode("2d"), [selected.id]);

  return (
    <div className="wanxiang-gallery">
      <div className="wanxiang-gallery-main">
        {supportsThreeDimensions && viewMode === "3d" ? (
          <Suspense
            fallback={
              <StoreImage
                src={selected.image}
                alt={`${selected.name} in the Waterline blue ceramic collection`}
                width="1586"
                height="992"
              />
            }
          >
            <WanxiangDeepPlate3D poster={selected.image} />
          </Suspense>
        ) : (
          <StoreImage
            src={selected.image}
            alt={`${selected.name} in the Waterline blue ceramic collection`}
            width="1586"
            height="992"
            fetchPriority="high"
          />
        )}
        {supportsThreeDimensions && (
          <div
            className="wanxiang-view-toggle"
            role="group"
            aria-label="Choose product view"
          >
            <button
              type="button"
              className={viewMode === "2d" ? "is-active" : ""}
              aria-pressed={viewMode === "2d"}
              onClick={() => setViewMode("2d")}
            >
              <ImageSquare size={14} weight="light" />
              2D
            </button>
            <button
              type="button"
              className={viewMode === "3d" ? "is-active" : ""}
              aria-pressed={viewMode === "3d"}
              onClick={() => setViewMode("3d")}
            >
              <Cube size={14} weight="light" />
              3D
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PieceOptions({ items, selectedId, onSelect, mobile = false }) {
  return (
    <div
      className={
        mobile ? "wanxiang-mobile-option-grid" : "wanxiang-option-grid"
      }
    >
      {items.map((item) => {
        const selected = item.id === selectedId;
        const fullSet = item.id === "full-set";
        const unavailable = item.availability === "out-of-stock-at-capture";
        return (
          <button
            type="button"
            className={`${selected ? "is-selected" : ""}${
              fullSet ? " is-full-set" : ""
            }${unavailable ? " is-unavailable" : ""}`}
            aria-pressed={selected}
            disabled={unavailable}
            onClick={() => onSelect(item)}
            key={item.id}
          >
            <StoreImage src={item.image} alt="" loading="lazy" />
            <span>
              <strong>{item.name}</strong>
              <small>
                {unavailable
                  ? "Out of stock"
                  : fullSet
                    ? `${item.contents} · Gift included`
                    : item.dimensions}
              </small>
            </span>
            {!unavailable && (
              <strong className="wanxiang-option-price">
                {formatPrice(item.price)}
              </strong>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ProductSelector({ options, selected, onSelect }) {
  return (
    <div className="wanxiang-selector">
      <div className="wanxiang-selector-heading">
        <span>Choose your piece</span>
      </div>
      <PieceOptions
        items={options}
        selectedId={selected.id}
        onSelect={onSelect}
      />
    </div>
  );
}

function MobileSelectorSheet({ options, selected, onSelect, onClose }) {
  return (
    <div className="wanxiang-sheet-backdrop" onClick={onClose}>
      <section
        className="wanxiang-mobile-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wanxiang-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="wanxiang-sheet-handle" aria-hidden="true" />
        <header>
          <div>
            <p className="aster-eyebrow">THE WATERLINE ARCHIVE</p>
            <h2 id="wanxiang-sheet-title">Choose your piece</h2>
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
            items={options}
            selectedId={selected.id}
            onSelect={(item) => {
              onSelect(item);
              onClose();
            }}
          />
        </div>
      </section>
    </div>
  );
}

export function WanxiangPage({ product, navigate, onAdd }) {
  const purchaseRef = useRef(null);
  const options = [product.fullSet, ...product.items];
  const pilotProduct =
    product.items.find((item) => item.id === "deep-plate-8") ?? product.fullSet;
  const requestedId = new URLSearchParams(window.location.search).get("piece");
  const initialId = options.some((item) => item.id === requestedId)
    ? requestedId
    : pilotProduct.id;
  const [selectedId, setSelectedId] = useState(initialId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const selected =
    options.find((item) => item.id === selectedId) ?? product.fullSet;

  const selectFromStory = (item) => {
    setSelectedId(item.id);
    window.requestAnimationFrame(() => {
      purchaseRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    });
  };

  const addSelected = () => {
    onAdd(
      {
        ...selected,
        id: `wanxiang-${selected.id}`,
        name: `Waterline ${selected.name}`,
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
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [sheetOpen]);

  return (
    <main className="aster-product-page wanxiang-page">
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
          <span>Waterline</span>
        </nav>

        <section
          ref={purchaseRef}
          id="wanxiang-purchase"
          className="wanxiang-top"
        >
          <WanxiangGallery selected={selected} />

          <div className="wanxiang-intro">
            <p className="aster-eyebrow">{product.eyebrow}</p>
            <h1>
              Waterline
              <span>Water-Duck Blue</span>
            </h1>
            <p className="wanxiang-lead">{product.description}</p>

            <ProductSelector
              options={options}
              selected={selected}
              onSelect={(item) => setSelectedId(item.id)}
            />

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
              <button type="button" onClick={addSelected}>
                Add to Cart
              </button>
              <button type="button" onClick={addSelected}>
                Buy Now
              </button>
            </div>
          </div>
        </section>
      </div>

      <WanxiangStory
        product={product}
        selected={selected}
        onSelect={selectFromStory}
        navigate={navigate}
      />

      <div className="wanxiang-mobile-buybar">
        <button
          className="wanxiang-mobile-current"
          type="button"
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen(true)}
        >
          <StoreImage src={selected.image} alt="" />
          <span>
            <small>Current choice · {formatPrice(selected.price)}</small>
            <strong>{selected.name}</strong>
          </span>
          <CaretUp size={15} aria-hidden="true" />
        </button>
        <button
          className="wanxiang-mobile-cart"
          type="button"
          onClick={addSelected}
        >
          Add to Cart
        </button>
        <button
          className="wanxiang-mobile-buy"
          type="button"
          onClick={addSelected}
        >
          Buy Now
        </button>
      </div>

      {sheetOpen && (
        <MobileSelectorSheet
          options={options}
          selected={selected}
          onSelect={(item) => setSelectedId(item.id)}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </main>
  );
}
