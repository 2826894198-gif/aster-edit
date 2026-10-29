import { StoreImage } from "./StoreImage.jsx";
import { CaretDown } from "@phosphor-icons/react";
import { SiteLink } from "./Shared.jsx";

const storyImages = {
  hero: "/images/aster/wanxiang/story/moments-hero.jpg",
  morning: "/images/aster/wanxiang/story/morning-bowl-mug.jpg",
  midday: "/images/aster/wanxiang/story/midday-deep-plate.jpg",
  gathering: "/images/aster/wanxiang/story/gathering-eight-forms.jpg",
  approach: "/images/aster/wanxiang/story/aster-edit-still-life.jpg",
  texture: "/images/aster/wanxiang/story/water-duck-blue-texture.jpg",
};

const itemGroups = [
  {
    label: "3 Bowls",
    ids: ["bowl-4-6", "bowl-6-1", "soup-bowl-8-1"],
  },
  {
    label: "4 Plates",
    ids: [
      "shallow-plate-8-2",
      "deep-plate-8",
      "deep-plate-9",
      "plate-10-5",
    ],
  },
  { label: "1 Mug", ids: ["mug-320"] },
];

function StoryChapter({ eyebrow, title, copy, image, alt, reverse = false }) {
  return (
    <article className={`wanxiang-story-chapter${reverse ? " is-reverse" : ""}`}>
      <div className="wanxiang-story-chapter-image">
        <StoreImage src={image} alt={alt} loading="lazy" />
      </div>
      <div className="wanxiang-story-chapter-copy">
        <p className="aster-eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
    </article>
  );
}

function FormAtlas({ items, selected, onSelect }) {
  return (
    <section className="wanxiang-form-atlas" aria-labelledby="wanxiang-form-title">
      <div className="wanxiang-story-section-heading">
        <div>
          <p className="aster-eyebrow">THE COLLECTION</p>
          <h2 id="wanxiang-form-title">Choose the right form</h2>
        </div>
        <p>Eight pieces. One shared surface language.</p>
      </div>

      <div className="wanxiang-form-groups">
        {itemGroups.map((group) => (
          <div className={`wanxiang-form-group is-${group.ids.length}`} key={group.label}>
            <h3>{group.label}</h3>
            <div>
              {group.ids.map((id) => {
                const item = items.find((candidate) => candidate.id === id);
                if (!item) return null;
                const active = selected.id === item.id;
                return (
                  <button
                    type="button"
                    className={active ? "is-active" : ""}
                    aria-pressed={active}
                    onClick={() => onSelect(item)}
                    key={item.id}
                  >
                    <span className="wanxiang-form-image">
                      <StoreImage src={item.image} alt="" loading="lazy" />
                    </span>
                    <strong>{item.name}</strong>
                    <small>{item.dimensions}</small>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SelectedPieceStory({ selected }) {
  const isSet = selected.id === "full-set";
  return (
    <section className="wanxiang-selected-story" aria-labelledby="wanxiang-selected-title">
      <div className="wanxiang-selected-copy">
        <p className="aster-eyebrow">YOUR CURRENT CHOICE</p>
        <h2 id="wanxiang-selected-title">{selected.name}</h2>
        <p>
          {isSet
            ? "The complete edit brings all eight observed forms together."
            : "See the selected form in isolation, with its seller-listed proportions kept close at hand."}
        </p>
        <dl>
          <div>
            <dt>{isSet ? "Contents" : "Dimensions"}</dt>
            <dd>{selected.dimensions ?? selected.contents}</dd>
          </div>
          {selected.capacity && (
            <div>
              <dt>Capacity</dt>
              <dd>{selected.capacity}</dd>
            </div>
          )}
        </dl>
      </div>
      <div className="wanxiang-selected-views">
        <figure>
          <StoreImage src={selected.image} alt={`${selected.name}, three-quarter product view`} loading="lazy" />
          <figcaption>Form</figcaption>
        </figure>
        <figure>
          <StoreImage src={selected.image} alt={`${selected.name}, surface detail`} loading="lazy" />
          <figcaption>Surface</figcaption>
        </figure>
      </div>
    </section>
  );
}

export function WanxiangStory({ product, selected, onSelect, navigate }) {
  return (
    <div className="wanxiang-story">
      <section className="wanxiang-story-hero" aria-labelledby="wanxiang-story-title">
        <StoreImage
          src={storyImages.hero}
          alt="Waterline bowl, mug and deep plate in cool morning light"
          width="2400"
          height="1050"
        />
        <div className="wanxiang-story-hero-copy">
          <p className="aster-eyebrow">WATERLINE · WATER-DUCK BLUE</p>
          <h2 id="wanxiang-story-title">Made for the moments between</h2>
          <p>
            Eight familiar forms, brought together by one quiet blue and a repeating
            incised surface.
          </p>
        </div>
        <aside className="wanxiang-story-brand-card">
          <p className="aster-eyebrow">OUR EDIT</p>
          <h3>Considered objects for a more intentional everyday.</h3>
          <p>We edit for useful form, calm colour and the rituals that shape a home.</p>
        </aside>
      </section>

      <FormAtlas items={product.items} selected={selected} onSelect={onSelect} />

      <section className="wanxiang-story-chapters" aria-label="Waterline in use">
        <StoryChapter
          eyebrow="MORNING"
          title="Small rituals, bigger days"
          copy="A cup. A bowl. A quieter start before the rest of the day arrives."
          image={storyImages.morning}
          alt="Waterline mug and small bowl in morning light"
        />
        <StoryChapter
          reverse
          eyebrow="MIDDAY"
          title="Everyday, considered"
          copy="The shallow curve of the deep plate keeps the colour and radial texture in view."
          image={storyImages.midday}
          alt="Waterline deep plate set for a simple midday meal"
        />
        <article className="wanxiang-gathering-story">
          <StoreImage
            src={storyImages.gathering}
            alt="All eight Waterline forms arranged together"
            loading="lazy"
            width="2400"
            height="900"
          />
          <div>
            <p className="aster-eyebrow">GATHERING</p>
            <h3>A table for what matters</h3>
            <p>Three bowls, four plates and one mug—separate forms with a shared visual rhythm.</p>
          </div>
        </article>
      </section>

      <section className="wanxiang-texture-story" aria-labelledby="wanxiang-colour-title">
        <div className="wanxiang-texture-image">
          <StoreImage
            src={storyImages.texture}
            alt="Close view of the Waterline blue surface and radial incised texture"
            loading="lazy"
          />
        </div>
        <div>
          <p className="aster-eyebrow">COLOUR &amp; SURFACE</p>
          <h2 id="wanxiang-colour-title">A colour with quiet depth</h2>
          <p>
            The seller names the glaze Water-Duck Blue. Across the photographed forms,
            fine radial lines move from centre to rim and catch light differently at every angle.
          </p>
          <div className="wanxiang-texture-notes" aria-label="Observed surface details">
            <span><strong>01</strong> Layered blue variation</span>
            <span><strong>02</strong> Radial incised texture</span>
            <span><strong>03</strong> Soft ivory exterior</span>
          </div>
        </div>
      </section>

      <section className="wanxiang-approach" aria-labelledby="wanxiang-approach-title">
        <StoreImage
          src={storyImages.approach}
          alt="A restrained still life of Waterline bowls, plates and mug"
          loading="lazy"
          width="2200"
          height="1319"
        />
        <div>
          <p className="aster-eyebrow">THE ASTER EDIT APPROACH</p>
          <h2 id="wanxiang-approach-title">A quieter way to choose for the home</h2>
          <ol>
            <li><span>01</span><strong>Considered curation</strong><small>Fewer forms, selected to work together.</small></li>
            <li><span>02</span><strong>Everyday relevance</strong><small>Pieces are presented around real daily moments.</small></li>
            <li><span>03</span><strong>Clear product truth</strong><small>Observed forms and dimensions stay visible.</small></li>
          </ol>
        </div>
      </section>

      <SelectedPieceStory selected={selected} />

      <section className="wanxiang-facts" aria-labelledby="wanxiang-facts-title">
        <div>
          <p className="aster-eyebrow">PRODUCT DETAILS</p>
          <h2 id="wanxiang-facts-title">What we know so far</h2>
        </div>
        <div>
          <details>
            <summary>Dimensions <CaretDown size={15} weight="light" /></summary>
            <p>{selected.dimensions ?? "Eight seller-listed forms are mapped in the selector above."}</p>
          </details>
          <details>
            <summary>What is included <CaretDown size={15} weight="light" /></summary>
            <p>{selected.id === "full-set" ? selected.contents : `One ${selected.name}.`}</p>
          </details>
          <details>
            <summary>Image and source notes <CaretDown size={15} weight="light" /></summary>
            <p>
              The product forms and dimensions are mapped from archived seller specification
              images. Price, stock, material and commercial image rights remain unverified.
            </p>
          </details>
        </div>
      </section>

      <section className="wanxiang-story-closing">
        <StoreImage
          src={storyImages.gathering}
          alt="Waterline collection in a calm dining setting"
          loading="lazy"
          width="2400"
          height="900"
        />
        <div>
          <h2>For the everyday you want to keep.</h2>
          <SiteLink to="/#collection-library" navigate={navigate}>Return to the collection</SiteLink>
        </div>
      </section>
    </div>
  );
}
