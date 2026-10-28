import { productTiers } from './domain/catalog.js';
import { ArrowRight, Coffee, DiamondsFour, Gift, Handbag, ImagesSquare, MagnifyingGlass, User } from '@phosphor-icons/react';

export function TierArtwork({ index, count }) {
  return <span className={`tier-artwork tier-${index}`}>
    <img className="tier-hd-image" src={`/assets/design-prototype/source-backed/tier-${count}-v1.jpg`} alt="" width="1672" height="941" />
    <span className="tier-native-label">{count} Pieces <span className="tier-native-arrow"><ArrowRight weight="bold" /></span></span>
  </span>;
}

export const sourceBoxExamples = Object.freeze([
  { id: '6aa24ee2', src: '/assets/product/source/xhs-seller-6a0d4c48/posts/6aa24ee2-cover.webp', href: 'https://source.example.test/reference' },
  { id: '6aa22693', src: '/assets/product/source/xhs-seller-6a0d4c48/posts/6aa22693-cover.webp', href: 'https://source.example.test/reference' },
  { id: '6aa218bb', src: '/assets/product/source/xhs-seller-6a0d4c48/posts/6aa218bb-cover.webp', href: 'https://source.example.test/reference' },
  { id: '6aa0cbd4', src: '/assets/product/source/xhs-seller-6a0d4c48/posts/6aa0cbd4-cover.webp', href: 'https://source.example.test/reference' },
]);

// Deliberately raster-backed artwork for the approved local visual prototype.
// The source is not catalog evidence and must not enter Product/Offer/feed data.
export function ReferenceArt({ x = 0, y = 0, width = 1448, height, className = '' }) {
  return <span className={`reference-art ${className}`} style={{ aspectRatio: `${width} / ${height}` }} aria-hidden="true">
    <img src="/assets/design-prototype/reference-redrawn.png" alt="" width="1448" height="1086" draggable="false" style={{ width: `${1448 / width * 100}%`, left: `${-x / width * 100}%`, top: `${-y / height * 100}%` }} />
  </span>;
}

const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
const valueItems = [
  [Gift, '3 / 6 / 12 Pieces'],
  [DiamondsFour, 'A Different Mix'],
  [ImagesSquare, 'Possible Categories'],
  [Coffee, 'A More Joyful Table'],
];
const nav = [
  ['Shop', 549, 45, '/collections/mystery-tableware-box'],
  ['Collections', 620, 87, '/pages/what-could-be-inside'],
  ['Blog', 720, 43, '/blogs/table-stories'],
  ['About', 781, 48, '/pages/how-it-works'],
  ['FAQ', 851, 41, '/pages/shipping-returns'],
];

export function ReferenceHomepage({ count, selectedId, onChoose, onCartOpen }) {
  return <div className="reference-home">
    <header className="reference-header">
      <span className="reference-header-surface" aria-hidden="true" />
      <button className="reference-hit crisp-logo" style={{ left: '19.3%', top: '8%', width: '12%', height: '83%' }} aria-label="surprise — Back to top" onClick={() => jump('top')}>surprise<span>.</span></button>
      <nav aria-label="Main navigation">{nav.map(([name, x, width, href]) => <a key={name} className="reference-hit crisp-nav" style={{ left: `${x / 1448 * 100}%`, top: '20%', width: `${width / 1448 * 100}%`, height: '65%' }} href={href}>{name}</a>)}</nav>
      <span className="crisp-utilities" aria-hidden="true"><MagnifyingGlass /><User /></span>
      <button className="reference-hit reference-cart crisp-cart" style={{ left: '77.6%', top: '13%', width: '3.5%', height: '70%' }} aria-label={`Open selection, ${count} items`} onClick={onCartOpen}><Handbag /><b>{count}</b></button>
    </header>
    <main>
      <section className="reference-hero" id="reference-hero" aria-labelledby="reference-title">
        <img className="source-backed-hero" src="/assets/design-prototype/source-backed/hero-desktop-v2.jpg" width="2048" height="768" alt="Source-backed visualization of a tableware surprise box" fetchPriority="high" />
        <img className="hero-right-note" src="/assets/design-prototype/source-backed/hero-note-hd-v2.png" width="1254" height="1254" alt="" aria-hidden="true" />
        <div className="crisp-hero-copy"><h1 id="reference-title">Mystery<br />Tableware Box</h1><p>A little surprise for a happier table.</p></div>
        <button className="reference-hit reference-cta crisp-cta" aria-label="Shop Mystery Boxes" onClick={() => jump('boxes')}>Shop Mystery Boxes <ArrowRight weight="bold" /></button>
      </section>
      <section id="value-strip" className="reference-value-strip" aria-label="Mystery box overview: three formats, a different mix, possible tableware categories, and a tableware surprise">
        {valueItems.map(([Icon, label]) => <div key={label}><Icon weight="regular" aria-hidden="true" /><span>{label}</span></div>)}
      </section>
      <section id="boxes" aria-labelledby="reference-boxes-title">
        <div className="crisp-chooser-title"><ReferenceArt y={530} height={67} /><h2 id="reference-boxes-title">Choose Your Box</h2></div>
        <div className="reference-box-grid">{productTiers.map((product, index) => <button className="reference-box" key={product.id} onClick={() => onChoose(product)} aria-label={`Choose ${product.pieceCount} pieces`} aria-pressed={selectedId === product.id}>
          <TierArtwork index={index} count={product.pieceCount} />
          {selectedId === product.id && <span className="reference-selected">Selected</span>}
        </button>)}</div>
      </section>
      <section className="reference-unboxing" id="unboxing" aria-labelledby="reference-proof-title">
        <div className="reference-proof-heading crisp-proof-heading"><h2 id="reference-proof-title">Real Box Examples</h2><a href="https://source.example.test/reference" target="_blank" rel="noreferrer" aria-label="View more seller box examples">View More <ArrowRight /></a></div>
        <div className="reference-proof-grid">{sourceBoxExamples.map((example, index) => <a key={example.id} href={example.href} target="_blank" rel="noreferrer" aria-label={`Open seller source post ${index + 1}`}><img src={example.src} alt={`Real seller box example ${index + 1}`} width="640" height="853" /></a>)}</div>
      </section>
    </main>
  </div>;
}
