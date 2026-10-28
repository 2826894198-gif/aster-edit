import { StoreImage } from "./StoreImage.jsx";
import {
  ArrowRight,
  Cube,
  FileText,
  Headset,
  Ruler,
} from "@phosphor-icons/react";
import { SiteLink } from "./Shared.jsx";
import { CupHeroPreview } from "./CupHeroPreview.jsx";
import { cupGestureImage } from "../data/cup-content.js";
import { cupPath } from "../data/cup.js";
import { MaterialEntrances } from "./MaterialEntrances.jsx";

const image = (name) => `/images/aster/home-prototype/${name}`;

const collections = [
  {
    id: "suhuo",
    count: 20,
    name: "Pale Ground",
    description:
      "A calm beginning for a table built over time. Soft ivory ceramics bring cups, bowls, plates and serving pieces into one quiet family, leaving room for colour and daily life.",
    path: "/products/pale-ground-ivory-ceramics",
    hero: image("series-suhuo-full-v3.png"),
    accent: "#8a7562",
  },
  {
    id: "fangju",
    count: 7,
    name: "Sunfold",
    description:
      "The warmth of a sunlit table, carried in a fluted edge. A yellow-green line follows a breakfast cup, bowls and plates, giving each piece a familiar, gently unfolding shape.",
    path: "/products/sunfold-fluted-ceramics",
    hero: image("series-fangju-full-v3.png"),
    accent: "#a56f22",
    reverse: true,
  },
  {
    id: "monet",
    count: 3,
    name: "Garden Shift",
    description:
      "A garden is never one shade of green. Across a bowl, plate and small sauce bowl, a mottled surface shifts with every curve, bringing quiet variation to the table.",
    path: "/products/garden-shift-green-ceramics",
    hero: image("series-monet-full-v2.png"),
    accent: "#66785b",
  },
  {
    id: "mist-blue",
    count: 4,
    name: "Petal Haze",
    description:
      "Like petals seen through morning mist, these blue-grey bowls and plates feel soft in colour and clear in outline. Their scalloped edges bring a quiet floral note to the table.",
    path: "/products/petal-haze-blue-ceramics",
    hero: image("series-mist-blue-full-v2.png"),
    accent: "#66777d",
    reverse: true,
  },
  {
    id: "ocean-blue",
    count: 3,
    name: "Open Tide",
    description:
      "The openness of the sea, translated into tableware. Fine speckling moves across an oval platter and two round plates, letting blue stretch across broad, shallow forms.",
    path: "/products/open-tide-blue-plates",
    hero: image("series-ocean-blue-full-v2.png"),
    accent: "#517d91",
  },
];

const forms = [
  ["Bowls", image("form-bowls-v2.png"), "/shop"],
  ["Plates", image("form-plates-v2.png"), "/shop"],
  ["Cups", image("form-cups-v2.png"), "/shop"],
  ["Smallware", image("form-smallware-v2.png"), "/shop"],
];

const notes = [
  {
    number: "01",
    title: "Start with a quiet base",
    text: "Begin with versatile forms in calm, neutral tones that work for everyday moments.",
    image: image("story-suhuo-v2.png"),
  },
  {
    number: "02",
    title: "Add one distinct surface",
    text: "Introduce a texture or pattern to bring character to the table.",
    image: image("collection-monet-clean-v1.png"),
  },
  {
    number: "03",
    title: "Let colour repeat, not match",
    text: "Use a colour more than once, but in different forms, to create a cohesive feel.",
    image: image("collection-mist-blue-clean-v1.png"),
  },
];

function Hero({ navigate }) {
  return (
    <section className="aster-editorial-hero" aria-labelledby="home-title">
      <StoreImage
        src={image("hero-selected-homepage.png")}
        alt="Aster Edit ceramics arranged across a sunlit stone table"
        width="1825"
        height="862"
        fetchPriority="high"
      />
      <div className="aster-editorial-hero-copy">
        <p className="aster-editorial-kicker">OBJECTS CHOSEN FOR THE TABLE</p>
        <h1 id="home-title">A table shaped by<br />texture and form.</h1>
        <p>Aster Edit curates ceramic bowls, plates and serving pieces, one object at a time.</p>
        <SiteLink to="/#collection-library" navigate={navigate} className="aster-editorial-primary">
          Explore the collections
        </SiteLink>
        <SiteLink to="/shop" navigate={navigate} className="aster-editorial-link">
          Shop all products <ArrowRight size={13} />
        </SiteLink>
      </div>
    </section>
  );
}

function About({ navigate }) {
  return (
    <section id="about" className="aster-editorial-brand-story" aria-labelledby="brand-story-heading">
      <div className="aster-editorial-brand-story-copy">
        <p className="aster-editorial-kicker">ABOUT ASTER EDIT</p>
        <h2 id="brand-story-heading">A table assembled by relationship, not sameness.</h2>
        <p>
          Aster Edit begins with individual objects. A quiet cup can sit beside
          a fluted bowl; a cool plate can hold its own without asking every
          piece around it to match.
        </p>
        <p>
          Each edit is guided by proportion, surface and daily use — ceramics
          chosen one by one, then considered together as a table with its own
          rhythm.
        </p>
        <SiteLink to="/about#approach" navigate={navigate} className="aster-editorial-link">
          Our approach <ArrowRight size={13} />
        </SiteLink>
      </div>
      <div className="aster-editorial-brand-story-image">
        <StoreImage
          src={image("brand-story-dining-v1.png")}
          alt="Aster Edit ceramic forms serving a relaxed meal on a sunlit dining table"
          loading="lazy"
        />
      </div>
    </section>
  );
}

function Approach({ navigate }) {
  return (
    <section className="aster-editorial-brand-story is-reverse" aria-labelledby="home-approach-heading">
      <div className="aster-editorial-brand-story-image">
        <StoreImage
          src="/images/aster/editorial-stories/source-clean/suhuo-real-table-v1.jpg"
          alt="Ivory ceramic bowls and serving dishes arranged together on a wood table"
          width="800"
          height="800"
          loading="lazy"
        />
      </div>
      <div className="aster-editorial-brand-story-copy">
        <p className="aster-editorial-kicker">WHAT ASTER EDIT MAKES CLEARER</p>
        <h2 id="home-approach-heading">Build a table one useful object at a time.</h2>
        <p>
          Compare ceramic bowls, plates, cups and serving pieces through their
          form, scale and surface. Choose a single object, or a listed full set
          when you want the collection together.
        </p>
        <p>
          Begin with what you need now, see how it can relate to pieces you
          already own, and let the table grow without having to start again.
        </p>
        <SiteLink to="/shop" navigate={navigate} className="aster-editorial-link">
          Browse the ceramics <ArrowRight size={13} />
        </SiteLink>
      </div>
    </section>
  );
}

function CollectionRow({ collection, navigate, index }) {
  const sequence = String(index + 1).padStart(2, "0");

  return (
    <article
      className={`aster-editorial-collection ${collection.reverse ? "is-reverse" : ""}`}
      style={{
        "--collection-accent": collection.accent,
      }}
    >
      <div className="aster-editorial-collection-copy">
        <div className="aster-editorial-collection-meta">
          <span>COLLECTION {sequence}</span>
          <span aria-hidden="true" />
          <span>{collection.count} FORMS</span>
        </div>
        <div className="aster-editorial-collection-body">
          <h3>{collection.name}</h3>
          <p>{collection.description}</p>
        </div>
        <div className="aster-editorial-collection-footer">
          <SiteLink
            to={collection.path}
            navigate={navigate}
            className="aster-editorial-collection-cta"
          >
            Explore the series <ArrowRight size={15} />
          </SiteLink>
          <span className="aster-editorial-collection-folio" aria-hidden="true">
            {sequence}
          </span>
        </div>
      </div>
      <SiteLink
        to={collection.path}
        navigate={navigate}
        className="aster-editorial-collection-visual show-full-image"
      >
        <StoreImage
          src={collection.hero}
          alt={`${collection.name} ceramic collection`}
          loading="lazy"
        />
      </SiteLink>
    </article>
  );
}

function CollectionLibrary({ navigate }) {
  return (
    <section id="collection-library" className="aster-editorial-library">
      <header>
        <h2>Collection Library</h2>
        <p>Five ceramic collections and one singular accent, each with its own colour, character and place at the table.</p>
      </header>
      {collections.map((collection, index) => (
        <CollectionRow
          collection={collection}
          navigate={navigate}
          index={index}
          key={collection.id}
        />
      ))}
    </section>
  );
}

function ShopByForm({ navigate }) {
  return (
    <section className="aster-editorial-forms" aria-labelledby="forms-heading">
      <h2 id="forms-heading">Shop by Form</h2>
      <div>
        {forms.map(([label, src, path]) => (
          <SiteLink to={path} navigate={navigate} key={label}>
            <span><StoreImage src={src} alt={`${label} from the Aster Edit archive`} loading="lazy" /></span>
            <strong>{label}</strong><ArrowRight size={13} />
          </SiteLink>
        ))}
      </div>
    </section>
  );
}

function ObjectStudy({ navigate }) {
  return (
    <section className="aster-editorial-study" aria-labelledby="study-heading">
      <div>
        <p className="aster-editorial-kicker">OBJECT STUDY</p>
        <h2 id="study-heading">Citrus Note</h2>
        <p>
          A single, sun-warmed note among quieter pieces. Orange speckles and a
          raised rim give this oval plate a lively presence without asking the
          whole table to match.
        </p>
        <SiteLink to="/products/citrus-note-oval-plate" navigate={navigate} className="aster-editorial-primary">
          View the object
        </SiteLink>
      </div>
      <div className="aster-editorial-study-image">
        <StoreImage
          src={image("object-orange-food-user-v1.jpg")}
          alt="Citrus Note orange-speckled oval plate set with croissants, fruit and salad"
          loading="lazy"
        />
      </div>
    </section>
  );
}

function TableNotes({ navigate }) {
  return (
    <section id="table-notes" className="aster-editorial-notes">
      <p className="aster-editorial-kicker">TABLE NOTES</p>
      <h2>How different pieces find their place.</h2>
      <p>A simple way to build a table without asking every piece to match.</p>
      <div className="aster-editorial-note-grid">
        {notes.map((note) => (
          <article key={note.number}>
            <StoreImage src={note.image} alt="" loading="lazy" />
            <h3><span>{note.number}</span> — {note.title}</h3>
            <p>{note.text}</p>
          </article>
        ))}
      </div>
      <SiteLink to="/collections" navigate={navigate} className="aster-editorial-link">
        Explore the collections <ArrowRight size={13} />
      </SiteLink>
    </section>
  );
}

function DecisionDetails() {
  const details = [
    [Ruler, "Dimensions & capacity", "Check the product page for the available measurements and capacity."],
    [FileText, "What is included", "See what each individual item or listed set includes."],
    [Cube, "Shipping", "Review delivery charges before placing an order."],
    [Headset, "Returns & contact", "Read our support information or ask us a question."],
  ];
  return (
    <section className="aster-editorial-decisions">
      <h2>Details before decisions</h2>
      <div>
        {details.map(([Icon, title, copy]) => (
          <article key={title}>
            <Icon size={36} weight="thin" />
            <p><strong>{title}</strong><span>{copy}</span></p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CustomerCare() {
  return (
    <section className="aster-editorial-newsletter">
      <div>
        <h2>Questions for Aster Edit?</h2>
        <p>We can help with a piece, delivery or an existing order.</p>
      </div>
      <div className="aster-editorial-contact">
        <span>Write directly to our team</span>
        <a href="mailto:support@example.test">Contact us <ArrowRight size={14} /></a>
      </div>
    </section>
  );
}

export function HomePage({ navigate }) {
  return (
    <main className="aster-editorial-home">
      <CupHeroPreview navigate={navigate} />
      <MaterialEntrances navigate={navigate} />
      <section className="aster-home-cup-detail" aria-labelledby="home-cup-detail-title">
        <figure><StoreImage src={cupGestureImage} alt="Illustrative thumb contact with the recessed bead on the purple-grey ceramic cup" width="1536" height="1024" loading="lazy" /></figure>
        <div><p className="aster-editorial-kicker">THE THUMB-ROLL DETAIL</p><h2 id="home-cup-detail-title">A small movement,<br />close at hand.</h2><p>The black-and-white bead sits at the top of the handle. Explore the thumb gesture, three glaze colours and the cup’s practical details.</p><SiteLink to={`${cupPath}#cup-gesture`} navigate={navigate} className="aster-editorial-link">Explore the cup <ArrowRight size={14} aria-hidden="true" /></SiteLink></div>
      </section>
      <About navigate={navigate} />
      <Approach navigate={navigate} />
      <ShopByForm navigate={navigate} />
      <CollectionLibrary navigate={navigate} />
      <ObjectStudy navigate={navigate} />
      <TableNotes navigate={navigate} />
      <DecisionDetails />
      <CustomerCare />
    </main>
  );
}
