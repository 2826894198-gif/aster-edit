import { StoreImage } from "./StoreImage.jsx";
import { ArrowRight } from "@phosphor-icons/react";
import { SiteLink } from "./Shared.jsx";

const image = (name) => `/images/aster/home-prototype/${name}`;

const promises = [
  {
    number: "01",
    title: "Make a table feel collected",
    text: "Start with one useful object, then add pieces that share proportion or surface without asking everything to match.",
  },
  {
    number: "02",
    title: "Make choosing feel clearer",
    text: "Compare each collection's forms and dimensions, then check what is included before choosing a piece.",
  },
  {
    number: "03",
    title: "Make room for a changing home",
    text: "Choose objects that can move between quiet mornings, everyday meals and the people who gather around them.",
  },
];

const steps = [
  {
    number: "01",
    title: "Observe the form",
    text: "We begin with the rim, depth, footprint and scale of a single object.",
  },
  {
    number: "02",
    title: "Connect the surfaces",
    text: "Colour, texture and proportion create a relationship without forcing a matching set.",
  },
  {
    number: "03",
    title: "Keep it useful",
    text: "Every edit is brought back to daily rituals, clear product facts and a table that can keep changing.",
  },
];

export function AboutPage({ navigate }) {
  return (
    <main className="aster-about-page">
      <section className="aster-about-hero" aria-labelledby="about-title">
        <div className="aster-about-hero-copy">
          <p className="aster-editorial-kicker">ABOUT ASTER EDIT</p>
          <h1 id="about-title">A table assembled by relationship, not sameness.</h1>
          <p className="aster-about-lede">
            Aster Edit curates ceramic bowls, plates, cups and serving pieces,
            helping you build a table one considered object at a time.
          </p>
          <p>
            A quiet cup can sit beside a fluted bowl; a cool plate can hold its own
            without asking every piece around it to match.
          </p>
          <SiteLink to="/shop" navigate={navigate} className="aster-editorial-primary">
            Explore the ceramics <ArrowRight size={14} />
          </SiteLink>
        </div>
        <figure className="aster-about-hero-image">
          <StoreImage
            src={image("about-hero-real-v2.jpg")}
            alt="Aster Edit's orange-speckled oval plate in use at a real table"
            width="1440"
            height="960"
          />
        </figure>
      </section>

      <section className="aster-about-purpose" id="purpose" aria-labelledby="purpose-title">
        <div className="aster-about-section-intro">
          <p className="aster-editorial-kicker">WHAT WE ARE HERE TO DO</p>
          <h2 id="purpose-title">A little less noise around the table.</h2>
          <p>
            The world already has plenty of matching sets. We make the path from
            “I like this piece” to “I know where it belongs” feel more intuitive.
          </p>
        </div>
        <div className="aster-about-promise-grid">
          {promises.map((promise) => (
            <article key={promise.number}>
              <span className="aster-about-number">{promise.number}</span>
              <h3>{promise.title}</h3>
              <p>{promise.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="aster-about-approach" id="approach" aria-labelledby="approach-title">
        <figure className="aster-about-approach-image">
          <StoreImage
            src={image("about-approach-real-v1.jpg")}
            alt="A real Aster Edit scalloped bowl being held for a serving moment"
            width="720"
            height="480"
            loading="lazy"
          />
        </figure>
        <div className="aster-about-approach-copy">
          <p className="aster-editorial-kicker">OUR APPROACH</p>
          <h2 id="approach-title">Choose the relationship, not the rulebook.</h2>
          <p>
            We edit around the details that make an object worth keeping: the way a
            rim meets the hand, how a surface catches light, and whether a form can
            live through more than one kind of meal.
          </p>
          <p>
            Each collection stays legible on its own, while the wider archive leaves
            room for contrast. The result is a table that can grow without losing its
            rhythm.
          </p>
          <SiteLink to="/collections" navigate={navigate} className="aster-editorial-link">
            Compare the collections <ArrowRight size={13} />
          </SiteLink>
        </div>
      </section>

      <section className="aster-about-steps" aria-labelledby="steps-title">
        <header>
          <p className="aster-editorial-kicker">HOW WE EDIT</p>
          <h2 id="steps-title">A considered route from object to table.</h2>
        </header>
        <div className="aster-about-step-grid">
          {steps.map((step) => (
            <article key={step.number}>
              <span className="aster-about-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="aster-about-cta" aria-labelledby="about-cta-title">
        <p className="aster-editorial-kicker">START WITH ONE PIECE</p>
        <h2 id="about-cta-title">Find the form that gives your table somewhere to begin.</h2>
        <SiteLink to="/shop" navigate={navigate} className="aster-editorial-primary">
          Browse the ceramics <ArrowRight size={14} />
        </SiteLink>
      </section>
    </main>
  );
}
