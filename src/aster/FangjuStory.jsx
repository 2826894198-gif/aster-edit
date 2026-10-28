import { StoreImage } from "./StoreImage.jsx";
import { SeriesDetails } from "./SeriesDetails.jsx";

const storyAssets = {
  morning: "/images/aster/fangju-story/morning-cup-bowl-v1.png",
  plates: "/images/aster/fangju-story/plates-table-v1.png",
  surface: "/images/aster/fangju-story/surface-triptych-v1.png",
  scale:
    "/images/aster/editorial-stories/source-clean/fangju-scale-in-hand-v1.webp",
};

function FangjuSeriesStrip({ product, selected, onSelect }) {
  return (
    <section
      className="fangju-series-strip"
      aria-labelledby={`${product.id}-series-strip-title`}
    >
      <header>
        <p className="aster-eyebrow">THE SERIES</p>
        <h2 id={`${product.id}-series-strip-title`}>
          The Complete
          <br />
          Series
        </h2>
        <p>
          {product.items.length} individually priced pieces.
          {product.fullSet && (
            <>
              <br />A full-set option is available above.
            </>
          )}
        </p>
      </header>

      <div
        className="fangju-series-strip-scroll"
        tabIndex="0"
        aria-label={`Choose from all ${product.items.length} ${product.name} pieces`}
      >
        <div className="fangju-series-strip-track">
          {product.items.map((candidate) => {
            const active = candidate.id === selected.id;
            const unavailable =
              candidate.availability === "out-of-stock-at-capture";
            return (
              <button
                type="button"
                className={`${active ? "is-active" : ""}${
                  unavailable ? " is-unavailable" : ""
                }`}
                aria-pressed={active}
                disabled={unavailable}
                onClick={() => onSelect(candidate)}
                key={candidate.id}
              >
                <span className="fangju-series-strip-image">
                  <StoreImage
                    src={candidate.selectorImage || candidate.image}
                    alt=""
                  />
                </span>
                <strong>{candidate.name}</strong>
                <small>
                  {unavailable ? "Out of stock" : candidate.dimensions}
                </small>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FangjuStory({ product, selected, purchaseSelection = selected, navigate, onSelect }) {
  return (
    <div className="fangju-story">
      <section
        className="fangju-story-opening"
        aria-labelledby={`${product.id}-story-opening-title`}
      >
        <StoreImage
          src={product.storyImage}
          alt={`${product.name} bowls, plates and cup in a table setting`}
          loading="lazy"
        />
        <div>
          <p className="aster-eyebrow">SUNFOLD · SEVEN FLUTED FORMS</p>
          <h2 id={`${product.id}-story-opening-title`}>
            A warmer rhythm
            <br />
            across the table.
          </h2>
          <p>
            Seven separately purchasable forms share one visible language: pale
            centres, vertical petal flutes and a darker, irregular edge.
          </p>
          <p>
            The family moves from a small dip dish and breakfast cup to deeper
            bowls and broad plates. Each form can be selected separately, or
            together through the full-set option above.
          </p>
        </div>
      </section>

      <section
        className="fangju-story-chapter is-morning"
        aria-labelledby={`${product.id}-morning-title`}
      >
        <div className="fangju-story-chapter-copy">
          <span className="fangju-chapter-number">01</span>
          <p className="aster-eyebrow">MORNING</p>
          <h2 id={`${product.id}-morning-title`}>
            Cup and bowl, visibly related.
          </h2>
          <p>
            The 430 ml breakfast cup and 4.5-inch bowl carry the same vertical
            rhythm at two different heights. Their shared edge treatment makes
            the pairing legible without making them identical.
          </p>
          <dl>
            <div>
              <dt>Breakfast cup</dt>
              <dd>Ø 11.5 × H 7.2 cm</dd>
            </div>
            <div>
              <dt>Rice bowl</dt>
              <dd>Ø 12 × H 6.5 cm</dd>
            </div>
          </dl>
        </div>
        <figure>
          <StoreImage
            src={storyAssets.morning}
            alt="Sunfold breakfast cup with coffee and small bowl with yogurt, granola and berries"
            loading="lazy"
          />
          <figcaption>
            Cup and bowl at the table
          </figcaption>
        </figure>
      </section>

      <FangjuSeriesStrip
        product={product}
        selected={selected}
        onSelect={onSelect}
      />

      <section
        className="fangju-story-chapter is-plates"
        aria-labelledby={`${product.id}-plates-title`}
      >
        <figure>
          <StoreImage
            src={storyAssets.plates}
            alt="Sunfold 8-inch plate and 10-inch deep plate in a restrained dining scene"
            loading="lazy"
          />
          <figcaption>
            Two plate profiles
          </figcaption>
        </figure>
        <div className="fangju-story-chapter-copy">
          <span className="fangju-chapter-number">02</span>
          <p className="aster-eyebrow">PLATES</p>
          <h2 id={`${product.id}-plates-title`}>Two diameters, two depths.</h2>
          <p>
            The 8-inch plate opens into a shallower profile. The 10-inch deep
            plate adds diameter and a higher wall. Seen at an angle, the
            difference is structural rather than decorative.
          </p>
          <dl>
            <div>
              <dt>Petal plate</dt>
              <dd>Ø 20.5 × H 3 cm</dd>
            </div>
            <div>
              <dt>Deep plate</dt>
              <dd>Ø 26.5 × H 3.5 cm</dd>
            </div>
          </dl>
        </div>
      </section>

      <section
        className="fangju-surface"
        aria-labelledby={`${product.id}-surface-title`}
      >
        <div className="fangju-surface-heading">
          <span className="fangju-chapter-number">03</span>
          <p className="aster-eyebrow">SURFACE STUDY</p>
          <h2 id={`${product.id}-surface-title`}>
            The detail is in the transitions.
          </h2>
          <p>
            A pale field and radiating flutes meet an uneven rim where warmer
            amber and muted green gather.
          </p>
        </div>
        <figure>
          <StoreImage
            src={storyAssets.surface}
            alt="Three macro studies of Sunfold fluting, pale centre and irregular rim"
            loading="lazy"
          />
          <figcaption>
            <span>Radiating flutes</span>
            <span>Pale centre field</span>
            <span>Irregular darker rim</span>
          </figcaption>
        </figure>
      </section>

      <section
        className="aster-use-chapter fangju-scale-chapter"
        aria-labelledby={`${product.id}-scale-title`}
      >
        <figure>
          <StoreImage
            src={storyAssets.scale}
            alt="Two Sunfold plates held together to compare their diameter and petal edge"
            loading="lazy"
          />
          <figcaption>
            Two diameters in hand
          </figcaption>
        </figure>
        <div className="aster-use-chapter-copy">
          <span className="fangju-chapter-number">04</span>
          <p className="aster-eyebrow">SCALE IN HAND</p>
          <h2 id={`${product.id}-scale-title`}>
            Diameter becomes clear in the hand.
          </h2>
          <p>
            Held together, the two plate formats reveal the difference between a
            compact place-setting plate and the broader deep plate. Their
            repeated petal edge connects them across the full series.
          </p>
          <dl>
            <div>
              <dt>Petal plate</dt>
              <dd>Ø 20.5 × H 3 cm</dd>
            </div>
            <div>
              <dt>Deep plate</dt>
              <dd>Ø 26.5 × H 3.5 cm</dd>
            </div>
          </dl>
        </div>
      </section>

      <SeriesDetails product={product} selected={purchaseSelection} navigate={navigate} />

      <section
        className="fangju-story-closing"
        aria-label="Series closing note"
      >
        <p className="aster-eyebrow">ASTER EDIT · SERIES 02</p>
        <h2>Seven forms. One visible rhythm.</h2>
        <p>
          Choose a single form by diameter, depth and use, or select the full
          series as one set in the purchase area.
        </p>
      </section>
    </div>
  );
}
