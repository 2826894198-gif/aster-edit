import { ArrowRight, CaretDown } from "@phosphor-icons/react";
import { guidePieces, seriesGuides } from "../data/aster-series-content.js";
import { SiteLink } from "./Shared.jsx";

function PieceMeasurements({ pieces }) {
  return (
    <dl className="aster-detail-measurements">
      {pieces.map((piece) => (
        <div key={piece.id}>
          <dt>{piece.name}</dt>
          <dd>
            {piece.dimensions}
            {piece.capacity && <span>{piece.capacity}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function SeriesDetails({ product, selected, navigate }) {
  const guide = seriesGuides[product.id];
  const pieces = product.items.filter((piece) => !piece.isComplimentaryGift);
  const isSet = selected.id === product.fullSet?.id;
  const selectionPieces = isSet ? pieces : [selected];
  return (
    <section
      className="fangju-facts aster-series-details"
      aria-labelledby={`${product.id}-facts-title`}
    >
      <div className="aster-details-intro">
        <div className="fangju-facts-heading">
          <p className="aster-eyebrow">DETAILS & CHOICES</p>
          <h2 id={`${product.id}-facts-title`}>
            {pieces.length === 1
              ? "Know your oval plate."
              : "Choose by form and scale."}
          </h2>
        </div>
        <div className="aster-details-context">
          <p>{guide.intro}</p>
          <SiteLink
            to={guide.related[1]}
            navigate={navigate}
            className="aster-detail-related"
          >
            Compare with {guide.related[0]} <ArrowRight size={14} />
          </SiteLink>
        </div>
      </div>
      <div className="aster-details-body">
        <div className="fangju-facts-list aster-details-comparison">
          <details open>
            <summary>
              {guide.comparisonQuestion} <CaretDown size={16} />
            </summary>
            <p>{guide.comparison}</p>
            <PieceMeasurements
              pieces={guidePieces(product, guide.comparisonIds)}
            />
          </details>
        </div>
        <div className="fangju-facts-list aster-details-questions">
          <details>
            <summary>
              {isSet
                ? "Dimensions of the full set"
                : "Dimensions, capacity & weight"}{" "}
              <CaretDown size={16} />
            </summary>
            <PieceMeasurements pieces={selectionPieces} />
          </details>
          <details>
            <summary>
              What is included in my selection? <CaretDown size={16} />
            </summary>
            <p>
              {isSet
                ? `${product.fullSet.contents}.${product.fullSet.includesComplimentaryGift ? " A complimentary gift is included." : ""}`
                : `One ${selected.name}. Other forms and sizes are sold separately.`}
            </p>
          </details>
          {pieces.length > 1 && (
            <details>
              <summary>
                Can I buy individual pieces? <CaretDown size={16} />
              </summary>
              <p>
                {pieces.length} individually priced pieces are listed in this
                collection.
                {product.fullSet
                  ? ` The Full Set contains one of each of these ${pieces.length} forms. ${product.fullSet.availability === "out-of-stock-at-capture" ? "The Full Set option is marked out of stock in the selector." : "You can choose it in the selector above."}`
                  : " Each available piece can be chosen separately in the selector above."}
                {product.id === "suhuo-ivory" &&
                  " The spoon and small handled dip dish are gift-only and are not offered as individual purchases."}
              </p>
            </details>
          )}
          <details>
            <summary>
              Where can I check delivery and returns? <CaretDown size={16} />
            </summary>
            <p>
              See our{" "}
              <SiteLink to="/shipping-returns" navigate={navigate}>
                Shipping & Returns
              </SiteLink>{" "}
              page for delivery charges, the free-shipping threshold and how to
              contact us about an order.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}
