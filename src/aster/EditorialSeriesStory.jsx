import { StoreImage } from "./StoreImage.jsx";
import { guidePieces, seriesGuides } from "../data/aster-series-content.js";
import { SeriesDetails } from "./SeriesDetails.jsx";

const seriesNumbers = {
  "mood-monet-garden-green": "01",
  "mood-mist-blue-petal": "02",
  "mood-ocean-blue-plates": "03",
  "suhuo-matte-ivory": "05",
  "orange-peel-oval-plate": "06",
};

const editorialAssets = {
  "mood-monet-garden-green": {
    scene:
      "/images/aster/editorial-stories/source-clean/mood-monet-real-table-v1.png",
    detail:
      "/images/aster/editorial-stories/source-clean/mood-monet-real-detail-v1.png",
    surface:
      "/images/aster/editorial-stories/source-clean/mood-monet-real-surface-v2.png",
    curation:
      "/images/aster/editorial-stories/source-clean/mood-monet-curation-v1.png",
    use: "/images/aster/editorial-stories/source-clean/mood-monet-scale-in-hand-v1.png",
    useCaption: "A closer look at scale",
    moment:
      "Seen together in daylight, the three forms show how the same mottled green changes across their different proportions.",
  },
  "mood-mist-blue-petal": {
    scene:
      "/images/aster/editorial-stories/source-clean/mood-mist-real-table-v1.png",
    detail:
      "/images/aster/editorial-stories/source-clean/mood-mist-real-detail-v1.png",
    surface:
      "/images/aster/editorial-stories/source-clean/mood-mist-real-surface-v2.png",
    curation:
      "/images/aster/editorial-stories/source-clean/mood-mist-curation-v1.png",
    use: "/images/aster/editorial-stories/source-clean/mood-mist-use-v2.png",
    useCaption: "Two forms at the table",
    useReverse: true,
    moment:
      "At the table, the scalloped plate and deeper bowl show the difference in their profiles.",
  },
  "mood-ocean-blue-plates": {
    scene:
      "/images/aster/editorial-stories/source-clean/mood-ocean-real-table-v1.png",
    detail:
      "/images/aster/editorial-stories/source-clean/mood-ocean-real-detail-v1.png",
    surface:
      "/images/aster/editorial-stories/source-clean/mood-ocean-real-surface-v2.png",
    curation:
      "/images/aster/editorial-stories/source-clean/mood-ocean-curation-v1.png",
    use: "/images/aster/editorial-stories/source-clean/mood-ocean-use-v2.png",
    useCaption: "A closer look at the plates",
    moment:
      "The breakfast setting shows the oval platter and round plates at a familiar table scale.",
  },
  "suhuo-matte-ivory": {
    scene:
      "/images/aster/editorial-stories/source-clean/suhuo-real-table-v1.jpg",
    detail:
      "/images/aster/editorial-stories/source-clean/suhuo-real-detail-v1.jpg",
    surface:
      "/images/aster/editorial-stories/source-clean/suhuo-real-surface-v2.png",
    curation:
      "/images/aster/editorial-stories/source-clean/suhuo-curation-v2.jpg",
    use: "/images/aster/editorial-stories/source-clean/suhuo-nested-table-v1.jpg",
    useCaption: "Forms and proportions together",
    useReverse: true,
    moment:
      "Handled, octagonal and low serving forms sit together here to show their different outlines.",
  },
  "orange-peel-oval-plate": {
    scene:
      "/images/aster/editorial-stories/source-clean/orange-real-table-v1.jpg",
    detail:
      "/images/aster/editorial-stories/source-clean/orange-real-detail-v1.jpg",
    surface:
      "/images/aster/editorial-stories/source-clean/orange-real-surface-v2.png",
    curation:
      "/images/aster/editorial-stories/source-clean/orange-curation-v1.png",
    use: "/images/aster/editorial-stories/source-clean/orange-serving-scale-v1.png",
    useCaption: "The oval plate at the table",
    moment:
      "The table setting shows the single oval form at serving scale.",
  },
};

const seriesCopy = {
  "mood-monet-garden-green": {
    openingTitle: "Green that changes\nwith the light.",
    chapterOneLabel: "THREE FORMS",
    chapterOneTitle: "Two bowls, two distinct footprints.",
    chapterTwoLabel: "PROPORTION",
    chapterTwoTitle: "A lower, wider outline.",
    relationshipTitle: "A plate, bowl and smaller accent in conversation.",
    curationTitle: "Variation is the point of the edit.",
    use: {
      label: "SCALE IN HAND",
      title: "The smallest form becomes legible in the hand.",
      body: "Held against the larger pieces, the compact sauce bowl reads as a deliberate accent rather than a miniature duplicate. Its higher wall keeps the size change visible while the mottled surface remains continuous.",
      facts: [
        ["Sauce bowl", "Approx. Ø 11.5 × H 5.3 cm"],
        ["Series range", "3 individual forms"],
      ],
    },
  },
  "mood-mist-blue-petal": {
    openingTitle: "A softer blue,\nshaped at the edge.",
    chapterOneLabel: "DEPTH",
    chapterOneTitle: "Two deeper forms, clearly separated.",
    chapterTwoLabel: "PLATES",
    chapterTwoTitle: "The petal rhythm opens outward.",
    relationshipTitle: "Depth first, then diameter.",
    curationTitle: "A restrained family with clear differences.",
    use: {
      label: "ONE PLACE SETTING",
      title: "A soft edge, in two different depths.",
      body: "The real table photograph places a deeper round form beside the flatter petal plate. The shared blue-grey finish connects them, while the wall height keeps their roles visibly separate.",
      facts: [
        ["Soup plate", "Ø 20 × H 5 cm"],
        ["Petal plate", "Ø 21.5 × H 2.8 cm"],
      ],
    },
  },
  "mood-ocean-blue-plates": {
    openingTitle: "Blue across\na wider plane.",
    chapterOneLabel: "THREE PLATES",
    chapterOneTitle: "Oval length beside two round scales.",
    chapterTwoLabel: "PROFILE",
    chapterTwoTitle: "A low rim keeps the surface broad.",
    relationshipTitle: "Three serving planes, compared together.",
    curationTitle: "A plate edit built around proportion.",
    use: {
      label: "ROUND PLATE PAIR",
      title: "Two diameters, read in a single glance.",
      body: "Stacking the two round formats makes the diameter change immediate without disguising their shared low rim. The larger plate frames the smaller one while the blue field remains uninterrupted.",
      facts: [
        ["Small plate", "Ø 22 × H 2 cm"],
        ["Large plate", "Ø 27 × H 2.5 cm"],
      ],
    },
  },
  "suhuo-matte-ivory": {
    openingTitle: "One neutral,\nmany silhouettes.",
    chapterOneLabel: "FORM LIBRARY",
    chapterOneTitle: "A cup and two bowl profiles.",
    chapterTwoLabel: "SERVING",
    chapterTwoTitle: "Round rims beside a deeper oval.",
    relationshipTitle: "Ivory pieces, organised by silhouette.",
    curationTitle: "Neutral colour leaves room for form.",
    use: {
      label: "NESTED PROPORTIONS",
      title: "One neutral surface, three useful scales.",
      body: "Bowl, plate and spoon sit together so that rim height and diameter carry the comparison. The quiet ivory surface lets each outline stand out.",
      facts: [
        ["Individual choices", "18 priced pieces"],
        ["Visual cue", "Silhouette before colour"],
      ],
    },
  },
  "orange-peel-oval-plate": {
    openingTitle: "One plate,\nseen from every side.",
    chapterOneLabel: "ONE FORM",
    chapterOneTitle: "A compact oval footprint.",
    chapterTwoLabel: "AT THE TABLE",
    chapterTwoTitle: "An oval among round forms.",
    relationshipTitle: "A single accent for the table.",
    curationTitle: "Selected for shape, surface and restraint.",
    use: {
      label: "SERVING SCALE",
      title: "A compact oval at the table.",
      body: "The table setting shows the 21-centimetre plate at a practical scale. Its shallow oval profile remains the focus.",
      facts: [
        ["Plate", "L 21 × W 16.6 × H 2.5 cm"],
        ["Collection", "1 individual form"],
      ],
    },
  },
};

function SeriesStrip({ product, selected, onSelect }) {
  const count = product.items.length;
  const single = count === 1;
  const minWidth = single ? 240 : Math.max(520, count * 132);

  return (
    <section
      className={`fangju-series-strip editorial-series-strip${single ? " is-single" : ""}`}
      aria-labelledby={`${product.id}-series-strip-title`}
    >
      <header>
        <p className="aster-eyebrow">{single ? "THE FORM" : "THE SERIES"}</p>
        <h2 id={`${product.id}-series-strip-title`}>
          {single ? (
            <>The Single Form</>
          ) : (
            <>
              The Complete
              <br />
              Series
            </>
          )}
        </h2>
        <p>
          {count} individually priced {count === 1 ? "piece" : "pieces"}.
          {product.fullSet && (
            <>
              <br />{product.fullSet.availability === "out-of-stock-at-capture"
                ? "The full set is currently out of stock."
                : "A full-set option is available above."}
            </>
          )}
        </p>
      </header>

      <div
        className="fangju-series-strip-scroll"
        tabIndex="0"
        aria-label={`Choose from all ${count} ${product.name} ${count === 1 ? "piece" : "pieces"}`}
      >
        <div
          className="fangju-series-strip-track editorial-series-strip-track"
          style={{
            "--editorial-series-count": count,
            minWidth: `${minWidth}px`,
          }}
        >
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

export function EditorialSeriesStory({ product, selected, purchaseSelection = selected, navigate, onSelect }) {
  const storyKey = product.legacySlug ?? product.slug;
  const copy = seriesCopy[storyKey];
  const assets = editorialAssets[storyKey];
  const story = product.story;
  const guide = seriesGuides[product.id];

  return (
    <div
      className={`fangju-story editorial-series-story editorial-series-story--${storyKey}`}
      style={{
        "--fangju-paper": product.theme.wash,
        "--fangju-accent": product.theme.ink,
        "--fangju-line": product.theme.border,
      }}
    >
      <section
        className="fangju-story-opening editorial-series-opening"
        aria-labelledby={`${product.id}-story-opening-title`}
      >
        <StoreImage
          src={assets.scene}
          alt={`${product.name} in a table setting`}
          loading="lazy"
        />
        <div>
          <p className="aster-eyebrow">{story.eyebrow}</p>
          <h2 id={`${product.id}-story-opening-title`}>
            {copy.openingTitle.split("\n").map((line, index) => (
              <span key={line}>
                {line}
                {index === 0 && <br />}
              </span>
            ))}
          </h2>
          <p>{story.intro}</p>
          <p>{story.gatheringCopy}</p>
        </div>
      </section>

      <section
        className="fangju-story-chapter editorial-series-context"
        aria-labelledby={`${product.id}-chapter-one-title`}
      >
        <div className="fangju-story-chapter-copy">
          <span className="fangju-chapter-number">01</span>
          <p className="aster-eyebrow">{copy.chapterOneLabel}</p>
          <h2 id={`${product.id}-chapter-one-title`}>{copy.chapterOneTitle}</h2>
          <p>{story.chapterOne.copy}</p>
          <dl>
            {guidePieces(product, guide.chapterOneIds).map((item) => (
                <div key={item.id}>
                  <dt>{item.name}</dt>
                  <dd>{item.dimensions}</dd>
                </div>
              ))}
          </dl>
        </div>
        <figure>
          <StoreImage
            src={product.contextImage}
            alt={`${product.name} forms shown together`}
            loading="lazy"
          />
          <figcaption>Forms and proportions</figcaption>
        </figure>
      </section>

      <SeriesStrip product={product} selected={selected} onSelect={onSelect} />

      <section
        className="editorial-series-moment"
        aria-labelledby={`${product.id}-chapter-two-title`}
      >
        <figure>
          <StoreImage
            src={assets.detail}
            alt={`${product.name} photographed surface and form detail`}
            loading="lazy"
          />
          <figcaption>Surface and form detail</figcaption>
        </figure>
        <div>
          <span className="fangju-chapter-number">02</span>
          <p className="aster-eyebrow">{copy.chapterTwoLabel}</p>
          <h2 id={`${product.id}-chapter-two-title`}>{copy.chapterTwoTitle}</h2>
          <p>{story.chapterTwo.copy}</p>
          <p>{assets.moment}</p>
          <dl>
            {guidePieces(product, guide.chapterTwoIds).map((item) => (
                <div key={item.id}>
                  <dt>{item.name}</dt>
                  <dd>{item.dimensions}</dd>
                </div>
              ))}
          </dl>
        </div>
      </section>

      <section
        className="editorial-series-relationship"
        aria-labelledby={`${product.id}-relationship-title`}
      >
        <div className="editorial-series-relationship-copy">
          <span className="fangju-chapter-number">03</span>
          <p className="aster-eyebrow">TABLE RELATIONSHIPS</p>
          <h2 id={`${product.id}-relationship-title`}>
            {copy.relationshipTitle}
          </h2>
          <p>{story.gatheringCopy}</p>
          <p>
            The objects are shown together to compare scale and outline. Each
            form can be chosen individually.
          </p>
        </div>
        <figure className="editorial-series-relationship-art">
          <StoreImage
            src={product.catalogImage}
            alt={`${product.name} complete lineup`}
            loading="lazy"
          />
          <figcaption>
            {product.items.length}{" "}
            {product.items.length === 1 ? "form" : "forms"} · choose individually
          </figcaption>
        </figure>
      </section>

      <section
        className="fangju-surface editorial-series-surface"
        aria-labelledby={`${product.id}-surface-title`}
      >
        <div className="fangju-surface-heading">
          <span className="fangju-chapter-number">04</span>
          <p className="aster-eyebrow">SURFACE STUDY</p>
          <h2 id={`${product.id}-surface-title`}>{story.surfaceTitle}</h2>
          <p>{story.surfaceCopy}</p>
        </div>
        <figure>
          <StoreImage
            src={assets.surface}
            alt={`${product.name} photographed surface, edge and form detail`}
            loading="lazy"
          />
          <figcaption>
            {story.surfaceNotes.map((note) => (
              <span key={note}>{note}</span>
            ))}
          </figcaption>
        </figure>
      </section>

      <section
        className="editorial-series-curation"
        aria-labelledby={`${product.id}-curation-title`}
      >
        <figure>
          <StoreImage
            src={assets.curation}
            alt={`${product.name} at the table`}
            loading="lazy"
          />
        </figure>
        <div>
          <span className="fangju-chapter-number">05</span>
          <p className="aster-eyebrow">THE ASTER EDIT</p>
          <h2 id={`${product.id}-curation-title`}>{copy.curationTitle}</h2>
          <p>{guide.curation}</p>
          <dl>
            <div>
              <dt>Individual forms</dt>
              <dd>{product.items.length}</dd>
            </div>
            <div>
              <dt>Purchase formats</dt>
              <dd>
                {product.fullSet ? "Single pieces + full set" : "Single pieces"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section
        className="aster-use-chapter"
        aria-labelledby={`${product.id}-use-title`}
      >
        <figure>
          <StoreImage
            src={assets.use}
            alt={`${product.name} shown at a familiar scale`}
            loading="lazy"
          />
          <figcaption>{assets.useCaption}</figcaption>
        </figure>
        <div className="aster-use-chapter-copy">
          <span className="fangju-chapter-number">06</span>
          <p className="aster-eyebrow">{copy.use.label}</p>
          <h2 id={`${product.id}-use-title`}>{copy.use.title}</h2>
          <p>{copy.use.body}</p>
          <dl>
            {copy.use.facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <SeriesDetails product={product} selected={purchaseSelection} navigate={navigate} />

      <section
        className="fangju-story-closing"
        aria-label="Series closing note"
      >
        <p className="aster-eyebrow">
          ASTER EDIT · SERIES {seriesNumbers[storyKey]}
        </p>
        <h2>{story.closing}</h2>
        <p>
          {product.fullSet
            ? product.fullSet.availability === "out-of-stock-at-capture"
              ? "Choose an available single piece in the purchase area. The full set is currently out of stock."
              : "Choose an available single piece or the full set in the purchase area. Current availability remains visibly stated for every option."
            : "Choose from the dimensions and forms above. Availability is shown for every option."}
        </p>
      </section>
    </div>
  );
}
