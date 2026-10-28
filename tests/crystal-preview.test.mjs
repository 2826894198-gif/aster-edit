import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {crystalPath,crystalProducts,crystalSigns,legacyCrystalProducts,crystalQuestions} from '../src/data/crystal.js';
import {restoreBag,serializeBag,handoffItems} from '../src/aster/commerce.js';
import {calculateBagShipping} from '../src/data/aster-pricing.js';
import {getStructuredData,getPageMetadata,getQueryPolicy} from '../src/seo/metadata.js';
import {getRoute} from '../src/seo/routes.js';
import {filterSearchEntries} from '../src/aster/search-index.js';

test('all twelve signs retain distinct trusted products and checkout keys',()=>{
 assert.equal(crystalProducts.length,12);assert.equal(new Set(crystalProducts.map(p=>p.catalogKey)).size,12);assert.equal(new Set(crystalProducts.map(p=>p.sku)).size,12);
 const raw=JSON.parse(serializeBag(crystalProducts.map(product=>({product,edit:null,quantity:2}))));raw.items.forEach(i=>{i.price=1;i.name='tampered';});
 const bag=restoreBag(JSON.stringify(raw));assert.equal(bag.length,12);assert.deepEqual(handoffItems(bag),crystalProducts.map(p=>({catalog_key:p.catalogKey,quantity:2})));assert.equal(bag.reduce((s,i)=>s+i.product.price*i.quantity,0),3096);
 for(const p of crystalProducts){assert.equal(p.sku,'ASTER-'+createHash('sha256').update(p.catalogKey).digest('hex').slice(0,24).toUpperCase());assert.equal(p.price,129);assert.equal(p.regularPrice,179);assert.equal(p.packaging,'uniform');assert.ok(p.path.endsWith('?sign='+p.signId));}
});
test('legacy selections survive for explicit reselection without becoming zodiac orders',()=>{
 const bag=restoreBag(serializeBag([{product:legacyCrystalProducts[0],edit:null,quantity:2},{product:crystalProducts[0],edit:null,quantity:1}]));assert.equal(bag.length,2);assert.equal(bag[0].product.retired,true);assert.throws(()=>handoffItems(bag),/earlier Prism selection needs a zodiac sign/);assert.deepEqual(handoffItems(bag.slice(1)),[{catalog_key:'prism-zodiac-tumbler:aries',quantity:1}]);
});
test('quantity limits and free cup-crystal versus mixed tableware shipping remain correct',()=>{
 for(const q of [0,21,1.5])assert.deepEqual(restoreBag(JSON.stringify({version:1,items:[{productId:crystalProducts[0].id,editId:null,quantity:q}]})),[]);
 for(const p of crystalProducts)assert.equal(calculateBagShipping([{product:p,quantity:1}]),0);
 assert.equal(calculateBagShipping([{product:crystalProducts[0],quantity:1},{product:{price:20},quantity:1}]),30);assert.equal(calculateBagShipping([{product:crystalProducts[0],quantity:1},{product:{price:21},quantity:1}]),0);
});
test('prerendered full page includes every zodiac, useful detail content and no video or preview purchase shell',async()=>{
 const html=await readFile('dist/client'+crystalPath+'/index.html','utf8');assert.equal((html.match(/<h1\b/g)||[]).length,1);
 for(const s of crystalSigns){assert.ok(html.includes('value="'+s.id+'"'));await access('public'+s.sourceImage);}
 for(const q of crystalQuestions)assert.ok(html.includes(q.question.replaceAll('&','&amp;')));
 for(const a of ['z-design','z-details','z-size','z-questions']){assert.ok(html.includes('id="'+a+'"'));assert.ok(html.includes('href="#'+a+'"'));}
 assert.match(html,/data-prerendered-content="full-page"/);assert.match(html,/Packaging is the same for all signs/);assert.match(html,/Taurus sample photograph/);assert.doesNotMatch(html,/<video\b|Your preview bag|Design preview|Three patterns/);assert.match(html,/Add to bag/);assert.match(html,/Buy now/);assert.match(html,/content="index,follow"/);
});
test('SEO uses twelve current offers and a canonical product URL',()=>{
 const group=getStructuredData(getRoute(crystalPath))['@graph'].find(n=>n['@type']==='ProductGroup');assert.equal(group.hasVariant.length,12);assert.ok(group.hasVariant.every(p=>p.offers.price==='129.00'&&p.offers.url.includes('?sign=')&&p.pattern));assert.doesNotMatch(JSON.stringify(group),/wide-flute|fine-line|"Diamond"|AggregateRating|Review/);assert.equal(getPageMetadata(crystalPath,{publicationMode:'production'}).robots,'index,follow');const policy=getQueryPolicy(crystalPath+'?sign=aquarius&view=engraving');assert.equal(policy.indexable,true);assert.equal(policy.canonicalPath,crystalPath);assert.equal(getQueryPolicy(crystalPath+'?sign=invalid').indexable,false);
});
test('Shop, search and sitemap match the zodiac range',async()=>{
 const shop=await readFile('dist/client/shop/index.html','utf8');assert.match(shop,/12 zodiac signs/);assert.doesNotMatch(shop,/Three patterns|3 patterns/);for(const q of ['aquarius','zodiac crystal','capricorn'])assert.ok(filterSearchEntries(q).some(e=>e.href===crystalPath));const sitemap=await readFile('dist/client/sitemap.xml','utf8');assert.ok(sitemap.includes('glass-studio-960.webp'));assert.ok(!sitemap.includes('prism-crystal-wide-flute'));assert.ok(!(await readFile('dist/client/merchant-feed.csv','utf8')).includes('prism-zodiac-tumbler:'));
});
