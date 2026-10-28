import { StoreImage } from "./StoreImage.jsx";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CaretLeft,
  CaretRight,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
} from "@phosphor-icons/react";
import {
  asterConfig,
  asterImages,
  accessories,
  edits,
  formatPrice,
  productPath,
  products,
} from "../data/aster.js";
import { SectionTitle, SiteLink } from "./Shared.jsx";

const galleryFor = (product, editId) => {
  if (editId === "quiet-earth")
    return [
      asterImages.earth,
      product.image,
      asterImages.everyday,
      asterImages.lifestyle,
      asterImages.hero,
    ];
  if (editId === "garden-archive")
    return [
      asterImages.garden,
      product.image,
      asterImages.gatheringAlt,
      asterImages.lifestyle,
      asterImages.hero,
    ];
  return [
    product.image,
    asterImages.gatheringAlt,
    asterImages.blue,
    asterImages.lifestyle,
    asterImages.hero,
  ];
};

function ProductGallery({ product, selectedEdit }) {
  const gallery = galleryFor(product, selectedEdit.id);
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [product.id, selectedEdit.id]);
  const next = (direction) =>
    setActive((index) => (index + direction + gallery.length) % gallery.length);
  return (
    <div className="aster-gallery">
      <div className="aster-thumbnails" aria-label="Product images">
        {gallery.map((src, index) => (
          <button
            type="button"
            aria-label={`View image ${index + 1}`}
            aria-pressed={active === index}
            className={active === index ? "is-active" : ""}
            onClick={() => setActive(index)}
            key={`${src}-${index}`}
          >
            <StoreImage src={src} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      <div className="aster-gallery-main">
        <StoreImage
          src={gallery[active]}
          alt={`${product.name}, ${selectedEdit.name} concept photograph ${active + 1}`}
          width="1122"
          height="1402"
        />
        <div className="aster-gallery-arrows">
          <button
            type="button"
            onClick={() => next(-1)}
            aria-label="Previous product image"
          >
            <CaretLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => next(1)}
            aria-label="Next product image"
          >
            <CaretRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function QuantitySelector({ quantity, setQuantity }) {
  return (
    <div className="aster-quantity" aria-label="Quantity">
      <button
        type="button"
        onClick={() => setQuantity(Math.max(1, quantity - 1))}
        aria-label="Decrease quantity"
        disabled={quantity <= 1}
      >
        <Minus size={16} />
      </button>
      <output>{quantity}</output>
      <button
        type="button"
        onClick={() => setQuantity(Math.min(99, quantity + 1))}
        aria-label="Increase quantity"
        disabled={quantity >= 99}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function ProductInfo({
  product,
  selectedEdit,
  setSelectedEdit,
  quantity,
  setQuantity,
  onAdd,
}) {
  return (
    <div className="aster-product-info">
      <p className="aster-eyebrow">{product.eyebrow}</p>
      <h1>{product.name}</h1>
      <p className="aster-price">{formatPrice(product.price)}</p>
      <p className="aster-product-status">
        Concept collection · Details being finalized
      </p>
      {product.includesComplimentaryGift && (
        <p className="aster-set-gift-note">{asterConfig.setGiftNote}</p>
      )}
      <p className="aster-product-description">{product.description}</p>
      <fieldset className="aster-edit-options">
        <legend>Choose your edit</legend>
        <div>
          {edits.map((edit) => (
            <button
              type="button"
              key={edit.id}
              className={selectedEdit.id === edit.id ? "is-selected" : ""}
              aria-pressed={selectedEdit.id === edit.id}
              onClick={() => setSelectedEdit(edit)}
            >
              <span
                className="aster-swatch"
                style={{ backgroundColor: edit.color }}
              />
              <span>{edit.name}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <label className="aster-quantity-label">Quantity</label>
      <div className="aster-purchase-row">
        <QuantitySelector quantity={quantity} setQuantity={setQuantity} />
        <button
          type="button"
          className="aster-button aster-add-button"
          onClick={() => onAdd(product, selectedEdit, quantity)}
        >
          Add to Cart <span>{formatPrice(product.price * quantity)}</span>
        </button>
      </div>
      <div className="aster-service-notes">
        <p>
          <Truck size={19} weight="thin" />
          {asterConfig.shippingNote}
        </p>
        <p>
          <ShieldCheck size={19} weight="thin" />
          {asterConfig.breakageNote}
        </p>
      </div>
    </div>
  );
}

function ProductDetails({ product }) {
  return (
    <section className="aster-details" aria-label="Product details">
      <div>
        <h2>What's Included</h2>
        {product.includes.map((item) => (
          <p key={item.name}>
            {item.quantity} × {item.name}
          </p>
        ))}
        <small>Illustrative set composition.</small>
      </div>
      <div>
        <h2>Dimensions</h2>
        {product.dimensions.map((item) => (
          <p key={item.name}>
            {item.name}: {item.value}
          </p>
        ))}
        <p>Material: {product.material}</p>
      </div>
      <div>
        <h2>Shipping &amp; Returns</h2>
        <p>
          <Truck size={18} weight="thin" /> {asterConfig.shippingNote}
        </p>
        <p>
          <ShieldCheck size={18} weight="thin" /> {asterConfig.returnsNote}
        </p>
        <p>{asterConfig.breakageNote}</p>
      </div>
    </section>
  );
}

function LifestyleBanner({ navigate }) {
  return (
    <section className="aster-lifestyle">
      <StoreImage
        src={asterImages.lifestyle}
        alt="Ceramic tableware arranged on linen beside flowers"
        width="1862"
        height="845"
        loading="lazy"
      />
      <div>
        <h2>
          A more considered table,
          <br />
          in your home.
        </h2>
        <p>Pair with linen, glassware and serveware for a complete look.</p>
        <SiteLink to="/collections" navigate={navigate}>
          Shop the Look <ArrowRight size={16} />
        </SiteLink>
      </div>
    </section>
  );
}

function Recommendations({ product, navigate, onAdd }) {
  const companionSet =
    products.find((item) => item.id !== product.id) || products[0];
  const related = [companionSet, ...accessories];
  return (
    <section className="aster-recommendations">
      <SectionTitle
        title="You May Also Like"
        action="View All"
        to="/collections"
        navigate={navigate}
      />
      <div className="aster-recommendation-grid">
        {related.map((item) => (
          <article key={item.id}>
            {item.slug ? (
              <SiteLink to={productPath(item)} navigate={navigate}>
                <StoreImage
                  src={item.image}
                  alt={`${item.name} concept`}
                  loading="lazy"
                />
              </SiteLink>
            ) : (
              <div className="aster-recommendation-image">
                <StoreImage
                  src={item.image}
                  alt={`${item.name} concept`}
                  loading="lazy"
                />
              </div>
            )}
            <div className="aster-recommendation-copy">
              <h3>{item.name}</h3>
              <p>{formatPrice(item.price)}</p>
            </div>
            <button
              type="button"
              onClick={() => onAdd(item, item.slug ? edits[1] : null, 1)}
              aria-label={`Add ${item.name} to bag`}
            >
              <Plus size={15} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ProductPage({ product, navigate, onAdd }) {
  const initialEdit =
    edits.find((edit) => window.location.hash === `#${edit.id}`) || edits[1];
  const [selectedEdit, setSelectedEdit] = useState(initialEdit);
  const [quantity, setQuantity] = useState(1);
  return (
    <main className="aster-product-page">
      <div className="aster-content">
        <nav className="aster-breadcrumb" aria-label="Breadcrumb">
          <SiteLink to="/" navigate={navigate}>
            Home
          </SiteLink>
          <span>›</span>
          <SiteLink to="/collections" navigate={navigate}>
            Sets
          </SiteLink>
          <span>›</span>
          <span>{product.name}</span>
        </nav>
        <div className="aster-product-top">
          <ProductGallery product={product} selectedEdit={selectedEdit} />
          <ProductInfo
            product={product}
            selectedEdit={selectedEdit}
            setSelectedEdit={setSelectedEdit}
            quantity={quantity}
            setQuantity={setQuantity}
            onAdd={onAdd}
          />
        </div>
        <ProductDetails product={product} />
        <LifestyleBanner navigate={navigate} />
        <Recommendations product={product} navigate={navigate} onAdd={onAdd} />
      </div>
      <div className="aster-sticky-buy">
        <div>
          <span>{product.name}</span>
          <strong>{formatPrice(product.price * quantity)}</strong>
        </div>
        <button
          type="button"
          onClick={() => onAdd(product, selectedEdit, quantity)}
        >
          Add to Cart
        </button>
      </div>
    </main>
  );
}
