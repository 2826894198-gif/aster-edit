import {
  ArrowRight,
  CaretLeft,
  ChatCircleText,
  CheckCircle,
  Handbag,
  MagnifyingGlass,
  Sparkle,
  User,
} from "@phosphor-icons/react";
import { productTiers } from "./domain/catalog.js";
import { authorizedProductAssets } from "./domain/product-assets.js";
import { editorialTopics, getPageCopy } from "./content/site-copy.js";
import { sourceBoxExamples } from "./ReferenceHomepage.jsx";

const navigation = Object.freeze([
  Object.freeze({ href: "/cute", label: "Home" }),
  Object.freeze({ href: "/collections/mystery-tableware-box", label: "Shop" }),
  Object.freeze({ href: "/pages/what-could-be-inside", label: "Collections" }),
  Object.freeze({ href: "/blogs/table-stories", label: "Blog" }),
  Object.freeze({ href: "/pages/how-it-works", label: "About" }),
  Object.freeze({ href: "/pages/shipping-returns", label: "FAQ" }),
]);

const tierColors = Object.freeze(["tier-pink", "tier-yellow", "tier-purple"]);

const sourceCommunityMoments = Object.freeze([
  Object.freeze({
    author: "大老虎🐯",
    time: "4天前·广东",
    text: "太好看了，可可爱爱的，商家说这是惊喜款，确实物超所值，满意～",
    image: "/assets/product/source/xhs-seller-6a0d4c48/captures/2026-09-11/comment-images/13c229180f07c7e8.webp",
  }),
  Object.freeze({
    author: "淡若清风",
    time: "2天前·江西",
    text: "超级无敌之满意啊，不知道该咋夸了，这套颜值绝了！搭配起来真是氛围感满满。",
    image: "/assets/product/source/xhs-seller-6a0d4c48/captures/2026-09-11/comment-images/74101aeb00361222.webp",
  }),
  Object.freeze({
    author: "小红薯68F630E0",
    time: "2天前·江苏",
    text: "好好看呐，这个盲盒非常不错，盘子碟子碗都有啦，很棒哦！最喜欢这个盘子了。",
    image: "/assets/product/source/xhs-seller-6a0d4c48/captures/2026-09-11/comment-images/54d67d0b69d9d2d9.webp",
  }),
]);

function ContentHeader({ path, cartCount = 0, onCartOpen }) {
  return (
    <header className="content-header">
      <div className="content-header-inner">
        <a className="content-brand" href="/cute" aria-label="Mystery Tableware Box home">surprise<span>.</span></a>
        <nav className="content-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} aria-current={item.href === path ? "page" : undefined}>{item.label}</a>
          ))}
        </nav>
        <div className="content-tools">
          <button className="content-utility" type="button" aria-label="Search"><MagnifyingGlass weight="bold" /></button>
          <button className="content-utility" type="button" aria-label="Account"><User weight="bold" /></button>
          <button className="content-cart" type="button" onClick={onCartOpen} aria-label={`Open selection, ${cartCount} items`}>
            <Handbag weight="bold" />
            {cartCount > 0 && <b>{cartCount}</b>}
          </button>
        </div>
      </div>
    </header>
  );
}

function TierCards({ showHeading = true }) {
  return (
    <section className={`content-tier-section ${showHeading ? "" : "shop-tier-section"}`} aria-labelledby={showHeading ? "tier-formats-title" : undefined} aria-label={showHeading ? undefined : "Choose a mystery box format"}>
      {showHeading && <div className="content-section-heading centered-heading">
        <span>CHOOSE YOUR BOX</span>
        <h2 id="tier-formats-title">One piece count. A surprise mix.</h2>
        <p>Compare scale now; exact contents and purchase terms remain unpublished until verified.</p>
      </div>}
      <div className="content-tier-grid">
        {productTiers.map((product, index) => (
          <article className={`content-tier-card ${tierColors[index]}`} key={product.id}>
            <a className="content-tier-card-link" href={product.url} aria-label={`View the ${product.pieceCount}-piece mystery box`}>
              <div className="tier-card-visual">
                <img src={`/assets/design-prototype/source-backed/tier-${product.pieceCount}-v1.jpg`} width="1672" height="941" alt={`Source-backed style preview for the ${product.pieceCount}-piece mystery box; exact contents vary`} loading="lazy" />
              </div>
              <div className="tier-card-copy">
                <div>
                  <small>{index === 0 ? "SMALLEST FORMAT" : index === 1 ? "MIDDLE FORMAT" : "LARGEST FORMAT"}</small>
                  <h3>{product.pieceCount} Pieces</h3>
                </div>
                <span className="tier-card-action">View box <ArrowRight weight="bold" /></span>
              </div>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

function SourceLineup() {
  return (
    <section className="content-lineup" aria-labelledby="source-lineup-title">
      <div className="content-section-heading">
        <span>AUTHORIZED CATEGORY EXAMPLES</span>
        <h2 id="source-lineup-title">Possible pieces, shown honestly</h2>
      </div>
      <div className="content-object-grid">
        {authorizedProductAssets.map((asset) => (
          <figure key={asset.id}>
            <div><img src={asset.url} width={asset.width} height={asset.height} alt={asset.alt} loading="lazy" /></div>
            <figcaption>{asset.label}</figcaption>
          </figure>
        ))}
      </div>
      <p className="content-caption">Authorized source examples for category exploration. They are not product-listing images or promised box contents.</p>
    </section>
  );
}

function EvidenceRow() {
  return (
    <section className="content-evidence" aria-labelledby="evidence-title">
      <div className="content-section-heading evidence-heading">
        <div><span>SOURCE EXAMPLES</span><h2 id="evidence-title">A look at real box combinations</h2></div>
        <a href="https://source.example.test/reference" target="_blank" rel="noreferrer">View source <ArrowRight weight="bold" /></a>
      </div>
      <div className="content-evidence-grid">
        {sourceBoxExamples.map((example, index) => (
          <a href={example.href} target="_blank" rel="noreferrer" key={example.id} aria-label={`Open seller source post ${index + 1}`}>
            <img src={example.src} width="640" height="853" alt={`Real seller box example ${index + 1}`} loading="lazy" />
          </a>
        ))}
      </div>
      <p className="content-caption">Seller source examples are shown as visual evidence only. They do not establish the contents of a future order.</p>
    </section>
  );
}

function EditorialTopics() {
  return (
    <section className="content-topic-section" aria-labelledby="editorial-topics-title">
      <div className="content-section-heading">
        <span>PLANNED TOPICS</span>
        <h2 id="editorial-topics-title">Editorial briefs, not published articles</h2>
      </div>
      <ul className="content-topic-list">
        {editorialTopics.map((topic) => <li key={topic}><CheckCircle weight="fill" aria-hidden="true" />{topic}</li>)}
      </ul>
    </section>
  );
}

function PossibleContentsPage({ copy }) {
  return (
    <>
      <header className="support-visual-hero contents-hero">
        <div className="support-hero-copy">
          <p className="content-eyebrow">{copy.eyebrow}</p>
          <h1>{copy.h1}</h1>
          <p>{copy.intro}</p>
          <a className="content-primary-action" href="#source-lineup-title">See the source examples <ArrowRight weight="bold" /></a>
        </div>
        <div className="contents-hero-objects" aria-label="Authorized tableware category examples">
          {authorizedProductAssets.slice(0, 4).map((asset) => (
            <figure key={asset.id}><img src={asset.url} width={asset.width} height={asset.height} alt={asset.alt} /></figure>
          ))}
          <span>PLATES · BOWLS · MUGS · SERVEWARE</span>
        </div>
      </header>
      <SourceLineup />
      <CopySections sections={copy.sections} />
      <EvidenceRow />
    </>
  );
}

function HowItWorksPage({ copy }) {
  return (
    <>
      <header className="content-hero process-hero">
        <p className="content-eyebrow">{copy.eyebrow}</p>
        <h1>{copy.h1}</h1>
        <p>{copy.intro}</p>
        <a className="content-primary-action" href="#process-steps">See the three steps <ArrowRight weight="bold" /></a>
      </header>
      <section className="process-grid" id="process-steps" aria-label="How the format works">
        {copy.sections.map((section, index) => (
          <article key={section.heading}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{section.heading.replace(/^\d+\.\s*/, "")}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </article>
        ))}
      </section>
      <TierCards />
    </>
  );
}

function PolicyPage({ copy }) {
  const questions = [
    ["Can I order from this prototype?", "Not yet. The format can be selected for preview, but checkout stays unavailable until the commercial terms are verified."],
    ["Where will the boxes ship?", "Shipping markets, rates, handling time, and delivery estimates have not been published."],
    ["Can a mystery box be returned?", "Return eligibility, countries, window, method, and fees must be matched to the final active product before launch."],
  ];
  return (
    <>
      <header className="support-visual-hero policy-hero">
        <div className="support-hero-copy">
          <p className="content-eyebrow">{copy.eyebrow}</p>
          <h1>{copy.h1}</h1>
          <p>{copy.intro}</p>
          <a className="content-primary-action" href="#policy-status">Review current status <ArrowRight weight="bold" /></a>
        </div>
        <div className="policy-hero-card">
          <ShieldCheck weight="duotone" aria-hidden="true" />
          <strong>Clear before checkout</strong>
          <p>Price, delivery coverage, timing, and return terms must be visible beside the active product.</p>
          <span>CURRENT STATUS · IN VERIFICATION</span>
        </div>
      </header>
      <CopySections sections={copy.sections} />
      <section className="policy-faq" id="policy-status" aria-labelledby="policy-faq-title">
        <div className="content-section-heading"><span>QUICK ANSWERS</span><h2 id="policy-faq-title">What is available today?</h2></div>
        <div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div>
      </section>
    </>
  );
}

function BlogPage({ copy }) {
  return (
    <>
      <header className="support-visual-hero blog-hero">
        <div className="support-hero-copy">
          <p className="content-eyebrow">{copy.eyebrow}</p>
          <h1>{copy.h1}</h1>
          <p>{copy.intro}</p>
          <a className="content-primary-action" href="#editorial-topics-title">Browse planned guides <ArrowRight weight="bold" /></a>
        </div>
        <div className="blog-hero-visual">
          <img src={sourceBoxExamples[2].src} width="640" height="853" alt="Seller source example of a tableware piece" />
          <span>Useful guides.<br />Honest evidence.<br />No filler.</span>
        </div>
      </header>
      <EditorialTopics />
      <CopySections sections={copy.sections} />
    </>
  );
}

function CopySections({ sections }) {
  return (
    <article className="content-sections">
      {sections.map((section) => (
        <section className="content-copy-section" key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ))}
    </article>
  );
}

function CollectionPage({ copy }) {
  return (
    <>
      <header className="shop-heading">
        <p className="content-eyebrow">SHOP</p>
        <h1>{copy.h1}</h1>
        <p>{copy.intro}</p>
      </header>
      <TierCards showHeading={false} />
    </>
  );
}

function ProductPage({ copy, product, onChoose }) {
  const visualSrc = `/assets/design-prototype/source-backed/tier-${product.pieceCount}-v1.jpg`;

  return (
    <>
      <section className="product-detail product-detail--direction-two" aria-labelledby="product-title">
        <div className="product-stage" aria-label="Source-backed mystery box visual">
          <div className="product-gallery">
            <img src={visualSrc} width="1672" height="941" alt={`Source-backed style preview for the ${product.pieceCount}-piece mystery box; exact contents vary`} />
          </div>
          <p className="product-visual-caption">Source-backed style preview — it does not define the exact final mix.</p>
        </div>
        <div className="product-summary">
          <h1 id="product-title">{copy.h1}</h1>
          <p className="product-intro">This format is for {product.pieceCount} pieces. The exact colors and forms stay part of the surprise.</p>
          <div className="product-action-row">
            <button className="product-select" type="button" onClick={() => onChoose?.(product)}>Add {product.pieceCount}-piece box <ArrowRight weight="bold" /></button>
          </div>
          <p className="product-purchase-note">Prototype selection only. Price and delivery terms are not published yet.</p>
        </div>
      </section>
      <section className="source-community" aria-labelledby="source-community-title">
        <div className="source-community-heading">
          <div>
            <span className="source-community-heading-spark" aria-hidden="true"><Sparkle weight="fill" /></span>
            <h2 id="source-community-title">Unboxing notes from the source community</h2>
          </div>
          <p>Different tables, same happier days.</p>
        </div>
        <div className="source-community-grid">
          {sourceCommunityMoments.map((moment) => (
            <article className="source-community-card" key={`${moment.author}-${moment.image}`}>
              <div className="source-community-photo"><img src={moment.image} width="640" height="853" loading="lazy" alt={`Public source-comment image shared by ${moment.author}`} /></div>
              <div className="source-community-copy">
                <p className="source-community-kicker">From<br />source community</p>
                <p lang="zh-CN">“{moment.text}”</p>
                <div className="source-community-meta"><strong>{moment.author}</strong><span>{moment.time}</span></div>
                <small><ChatCircleText weight="fill" aria-hidden="true" /> Public source comment</small>
              </div>
            </article>
          ))}
        </div>
        <p className="source-community-boundary">These public comment snapshots are kept in this local draft for source context only. They are not reviews of this storefront or confirmed future-box contents. <a href="https://source.example.test/reference" target="_blank" rel="noreferrer">View the seller source <ArrowRight weight="bold" /></a></p>
      </section>
    </>
  );
}

function GenericPage({ copy }) {
  return (
    <>
      <header className="content-hero">
        <p className="content-eyebrow">{copy.eyebrow}</p>
        <h1>{copy.h1}</h1>
        <p>{copy.intro}</p>
        <a className="content-primary-action" href={copy.primaryAction.href}>{copy.primaryAction.label}<ArrowRight weight="bold" /></a>
      </header>
      <CopySections sections={copy.sections} />
    </>
  );
}

function SupportingPage({ copy, route }) {
  if (route.path === "/pages/what-could-be-inside") return <PossibleContentsPage copy={copy} />;
  if (route.path === "/pages/how-it-works") return <HowItWorksPage copy={copy} />;
  if (route.path === "/pages/shipping-returns") return <PolicyPage copy={copy} />;
  if (route.type === "blog") return <BlogPage copy={copy} />;
  return <GenericPage copy={copy} />;
}

function RelatedLinks({ links }) {
  if (!links?.length) return null;
  return (
    <section className="content-related" aria-labelledby="related-content-title">
      <span>KEEP EXPLORING</span>
      <h2 id="related-content-title">Useful next steps</h2>
      <div>{links.map((link) => <a href={link.href} key={link.href}>{link.label}<ArrowRight weight="bold" /></a>)}</div>
    </section>
  );
}

function NotFoundPage({ cartCount, onCartOpen }) {
  return (
    <div className="content-page">
      <ContentHeader path="" cartCount={cartCount} onCartOpen={onCartOpen} />
      <main className="content-main content-not-found">
        <a className="content-back" href="/cute"><CaretLeft weight="bold" />Back to the homepage</a>
        <p className="content-eyebrow">NOT FOUND</p>
        <h1>That page is not in this prototype.</h1>
        <p>Use the homepage to explore the current tableware mystery box format.</p>
      </main>
    </div>
  );
}

export function ContentPage({ route, cartCount = 0, onCartOpen, onChoose }) {
  if (!route) return <NotFoundPage cartCount={cartCount} onCartOpen={onCartOpen} />;
  const product = route.type === "product" ? productTiers.find((item) => item.id === route.productId) ?? null : null;
  const copy = getPageCopy(route.path, product);
  if (!copy) return <NotFoundPage cartCount={cartCount} onCartOpen={onCartOpen} />;

  return (
    <div className="content-page" data-page-type={route.type}>
      <ContentHeader path={route.path} cartCount={cartCount} onCartOpen={onCartOpen} />
      <main className="content-main">
        {route.type !== "collection" && route.type !== "product" && (
          <a className="content-back" href="/cute">
            <CaretLeft weight="bold" />Back to mystery boxes
          </a>
        )}
        {route.type === "collection"
          ? <CollectionPage copy={copy} />
          : product
            ? <ProductPage copy={copy} product={product} onChoose={onChoose} />
            : <SupportingPage copy={copy} route={route} />}
        {route.type !== "collection" && route.type !== "product" && <RelatedLinks links={copy.relatedLinks} />}
      </main>
    </div>
  );
}
