import images from "../generated/responsive-images.json";

export function responsiveImage(src, sizes) {
  const image = images[src];
  if (!image) return {src};
  return {
    src: image.variants.at(-1)[1],
    srcSet: image.variants.map(([width, url]) => `${url} ${width}w`).join(", "),
    sizes,
  };
}

export function responsiveSource(src, sizes) {
  const {src: fallback, ...source} = responsiveImage(src, sizes);
  return source.srcSet ? source : {srcSet: fallback, sizes};
}

// Keep the exact DOM element, crop and CSS of each existing photograph.
// Native lazy loading and responsive sizes avoid requesting desktop files for
// mobile cards while explicit high priority keeps purchase/hero images eager.
export function StoreImage({src, sizes, loading, fetchPriority, ...props}) {
  const mode = loading ?? (fetchPriority === "high" ? "eager" : "lazy");
  const slot = sizes ?? "(max-width: 720px) 100vw, 1280px";
  return <img {...props}
    {...responsiveImage(src, slot)} loading={mode} decoding="async" fetchPriority={fetchPriority} />;
}
