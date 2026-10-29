import { StoreImage } from "./StoreImage.jsx";
import { CaretDown } from "@phosphor-icons/react";
import { SiteLink } from "./Shared.jsx";

function CompleteSeriesAtlas({ product, selected, onSelect }) {
  const visibleColumns = Math.min(product.items.length, 7);

  return (
    <section
      className="series-complete-atlas"
      aria-labelledby={`${product.id}-atlas-title`}
    >
      <header>
        <p className="aster-eyebrow">THE SERIES</p>
        <h2 id={`${product.id}-atlas-title`}>The Complete Series</h2>
        <p>
          {product.items.length} independently mapped piece
          {product.items.length === 1 ? "" : "s"}. No bundle is implied.
        </p>
      </header>
      <div
        className="series-atlas-scroll"
        tabIndex="0"
        aria-label={`Browse all ${product.name} forms`}
      >
        <div
          className="series-atlas-track"
          style={{
            "--atlas-count": product.items.length,
            "--atlas-visible": visibleColumns,
            "--atlas-min-width": `${Math.max(visibleColumns * 118, product.items.length * 118)}px`,
          }}
        >
          {product.items.map((candidate) => {
            const active = candidate.id === selected.id;
            return (
              <button
                type="button"
                className={active ? "is-active" : ""}
                aria-pressed={active}
                onClick={() => onSelect(candidate)}
                key={candidate.id}
              >
                <span className="series-atlas-image">
                  <StoreImage
                    src={candidate.selectorImage || candidate.image}
                    alt=""
                    loading="lazy"
                  />
                </span>
                <strong>{candidate.name}</strong>
                <small>{candidate.dimensions}</small>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProductFacts({ product, selected }) {
  return (
    <section
      className="series-facts"
      aria-labelledby={`${product.id}-facts-title`}
    >
      <div>
        <p className="aster-eyebrow">PRODUCT DETAILS</p>
        <h2 id={`${product.id}-facts-title`}>What we know so far</h2>
        <p className="series-facts-intro">
          The archive separates observed product facts from details that still
          need supplier confirmation.
        </p>
      </div>
      <div>
        <details open>
          <summary>
            Dimensions and capacity <CaretDown size={15} weight="light" />
          </summary>
          <p>
            {selected.dimensions}
            {selected.capacity ? ` · ${selected.capacity}` : ""}
          </p>
        </details>
        <details>
          <summary>
            What is included <CaretDown size={15} weight="light" />
          </summary>
          <p>One {selected.name}. No bundle or sibling SKU is implied.</p>
        </details>
      </div>
    </section>
  );
}

function StoryChapter({
  eyebrow,
  title,
  copy,
  image,
  alt,
  meta = [],
  reverse = false,
}) {
  return (
    <article
      className={`series-editorial-chapter${reverse ? " is-reverse" : ""}`}
    >
      <figure>
        <StoreImage src={image} alt={alt} loading="lazy" />
      </figure>
      <div>
        <p className="aster-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{copy}</p>
        {meta.length > 0 && (
          <div className="series-chapter-meta" aria-label="Chapter notes">
            {meta.map((note, index) => (
              <span key={note}>
                <strong>{String(index + 1).padStart(2, "0")}</strong>
                {note}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function SurfaceStudy({ product, selected }) {
  const studyItems = [
    selected,
    ...product.items.filter((candidate) => candidate.id !== selected.id),
  ].slice(0, 3);

  return (
    <section
      className="series-surface-study"
      aria-labelledby={`${product.id}-surface-title`}
    >
      <div
        className={`series-surface-images is-${studyItems.length}`}
        aria-label="Surface studies"
      >
        {studyItems.map((candidate, index) => (
          <figure key={candidate.id} className={`is-${index + 1}`}>
            <StoreImage
              src={candidate.selectorImage || candidate.image}
              alt={`${candidate.name}, clean source-mapped surface view`}
              loading="lazy"
            />
          </figure>
        ))}
      </div>
      <div>
        <p className="aster-eyebrow">CHAPTER 04 · COLOUR &amp; SURFACE</p>
        <h2 id={`${product.id}-surface-title`}>{product.story.surfaceTitle}</h2>
        <p>{product.story.surfaceCopy}</p>
        <div className="series-surface-notes" aria-label="Observed details">
          {product.story.surfaceNotes.map((note, index) => (
            <span key={note}>
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              {note}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SeriesStory({ product, selected, onSelect, navigate }) {
  const story = product.story;
  const featureImage = product.storyImage || product.contextImage;
  const supportingItems = product.items
    .filter((candidate) => candidate.id !== selected.id)
    .slice(0, 3);
  const chapterItems = supportingItems.length
    ? supportingItems
    : [selected];
  const approachItems = product.items.slice(-3);

  return (
    <div className="series-story-v3">
      <section
        className="series-story-hero"
        aria-labelledby={`${product.id}-story-title`}
      >
        <StoreImage
          src={featureImage}
          alt={`${product.name}, source-grounded table setting`}
          loading="lazy"
        />
        <div className="series-story-hero-copy">
          <p className="aster-eyebrow">{story.eyebrow}</p>
          <h2 id={`${product.id}-story-title`}>{story.title}</h2>
          <p>{story.intro}</p>
          <p>{story.gatheringCopy}</p>
        </div>
      </section>

      <CompleteSeriesAtlas
        product={product}
        selected={selected}
        onSelect={onSelect}
      />

      <section className="series-editorial-chapters" aria-label="Series story">
        <StoryChapter
          eyebrow={`CHAPTER 01 · ${story.chapterOne.eyebrow}`}
          title={story.chapterOne.title}
          copy={story.chapterOne.copy}
          image={product.catalogImage}
          alt={`${product.name}, complete source-mapped catalogue lineup`}
          meta={[
            `${product.items.length} source-mapped forms`,
            "Each remains an independent option",
          ]}
        />

        <StoryChapter
          reverse
          eyebrow={`CHAPTER 02 · ${story.chapterTwo.eyebrow}`}
          title={story.chapterTwo.title}
          copy={story.chapterTwo.copy}
          image={product.contextImage}
          alt={`${product.name}, source-grounded context study`}
          meta={story.surfaceNotes}
        />

        <article className="series-editorial-chapter is-object-study">
          <figure className="series-object-study">
            {chapterItems.map((candidate) => (
              <span key={candidate.id}>
                <StoreImage
                  src={candidate.selectorImage || candidate.image}
                  alt={`${candidate.name}, clean product view`}
                  loading="lazy"
                />
                <small>{candidate.name}</small>
                <small>{candidate.dimensions}</small>
              </span>
            ))}
          </figure>
          <div>
            <p className="aster-eyebrow">CHAPTER 03 · ACROSS THE TABLE</p>
            <h2>Related by surface, distinct in use.</h2>
            <p>{story.gatheringCopy}</p>
            <p className="series-chapter-note">
              The forms are shown as individual source-mapped pieces rather
              than a promised set or fixed combination.
            </p>
          </div>
        </article>
      </section>

      <SurfaceStudy product={product} selected={selected} />

      <section className="series-curation-note">
        <figure className="series-curation-objects" aria-label="Aster Edit form study">
          {approachItems.map((candidate) => (
            <span key={candidate.id}>
              <StoreImage
                src={candidate.selectorImage || candidate.image}
                alt={`${candidate.name}, clean source-mapped product view`}
                loading="lazy"
              />
              <small>{candidate.name}</small>
            </span>
          ))}
        </figure>
        <div>
          <p className="aster-eyebrow">CHAPTER 05 · THE ASTER EDIT</p>
          <h2>A series is understood through relationships.</h2>
          <p>
            We compare silhouette, depth, edge and surface before presenting a
            family together. The catalogue remains explicit about which facts
            come from the source archive and which launch details are pending.
          </p>
          <p>
            Use the atlas to move between forms. The selected piece, dimensions
            and evidence notes update without turning a single product into an
            assumed bundle.
          </p>
        </div>
      </section>

      <section
        className="series-selected-profile-v3"
        aria-labelledby={`${product.id}-current-title`}
      >
        <figure>
          <StoreImage
            src={selected.selectorImage || selected.image}
            alt={`${selected.name}, clean source-mapped detail view`}
            loading="lazy"
          />
        </figure>
        <div>
          <p className="aster-eyebrow">CHAPTER 06 · YOUR CURRENT CHOICE</p>
          <h2 id={`${product.id}-current-title`}>{selected.name}</h2>
          <p>
            This is the individual form currently selected in the purchase
            area. Its archived dimensions stay attached to this exact option.
          </p>
          <dl className="series-current-specs">
            <div>
              <dt>Current piece</dt>
              <dd>{selected.name}</dd>
            </div>
            <div>
              <dt>Dimensions</dt>
              <dd>{selected.dimensions}</dd>
            </div>
            {selected.capacity && (
              <div>
                <dt>Source-listed detail</dt>
                <dd>{selected.capacity}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <ProductFacts product={product} selected={selected} />

      <section className="series-story-closing">
        <p className="aster-eyebrow">CONTINUE BROWSING</p>
        <h2>{story.closing}</h2>
        <SiteLink to="/shop" navigate={navigate}>
          Return to the archive
        </SiteLink>
      </section>
    </div>
  );
}
