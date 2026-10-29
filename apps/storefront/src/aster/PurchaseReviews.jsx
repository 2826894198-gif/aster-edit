import { useEffect, useRef, useState } from "react";
import "../styles/purchase-reviews.css";
export default function PurchaseReviews() {
  const [page,setPage]=useState(1),[data,setData]=useState(null),[reviews,setReviews]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const scrolled=useRef(false);
  useEffect(()=>{const controller=new AbortController();setLoading(true);setError("");
    fetch(`/aster-commerce/reviews?group=rolling-bead-cup&page=${page}`,{credentials:"omit",cache:"no-store",signal:controller.signal})
      .then(async r=>{if(!r.ok)throw new Error("Purchase reviews could not be loaded.");return r.json();})
      .then(result=>{setData(result);setReviews(previous=>page===1 ? result.reviews : [...new Map([...previous,...result.reviews].map(review=>[review.id,review])).values()]);})
      .catch(e=>{if(e.name!=="AbortError")setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[page]);
  useEffect(()=>{if(data?.count && !scrolled.current && window.location.hash==="#purchase-reviews"){scrolled.current=true;document.getElementById("purchase-reviews")?.scrollIntoView({block:"start"});}},[data]);
  if(!data?.count)return null;
  return <section id="purchase-reviews" className="ae-product-reviews-preview" aria-labelledby="purchase-reviews-title"><p className="cup-page-kicker">PURCHASE REVIEWS</p><header><div><h2 id="purchase-reviews-title">From a purchase,<br/>in their own words.</h2><p>{data.average} / 5 · {data.count} approved purchase review{data.count===1 ? "" : "s"}</p></div><a href="https://commerce.example.test/customer-care/?view=reviews">Write a purchase review →</a></header>
  {error && <p role="status">{error}</p>}<div className="ae-product-review-list">{reviews.map(review=><article key={review.id}><div className="ae-product-review-copy"><header><strong>{review.name}</strong><span>{review.rating} / 5 ★</span></header><small>Verified purchase · {review.date}</small><p>{review.text}</p><small>{review.variant}</small></div>{!!review.photos.length && <div className="ae-product-review-photos">{review.photos.map(photo=><a key={photo.id} href={photo.full_url} target="_blank" rel="noopener"><img src={photo.url} width="88" height="88" loading="lazy" alt="Photo shared with this purchase review"/></a>)}</div>}</article>)}</div>
  {data.has_more && <button className="ae-product-review-more" disabled={loading} onClick={()=>setPage(p=>p+1)}>{loading ? "Loading…" : "Load more reviews"}</button>}</section>;
}
