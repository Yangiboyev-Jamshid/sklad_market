// Lightweight pub/sub bridging "add to cart" clicks (anywhere in the tree)
// with the cart icon in the header (mounted separately), without prop drilling.

export const cartIconRefs = { desktop: null, mobile: null };

export function getCartIconEl() {
  const isVisible = (el) => el && el.getBoundingClientRect().width > 0 && el.offsetParent !== null;
  if (isVisible(cartIconRefs.desktop)) return cartIconRefs.desktop;
  if (isVisible(cartIconRefs.mobile)) return cartIconRefs.mobile;
  return cartIconRefs.desktop || cartIconRefs.mobile || null;
}

export function flyToCart({ imageUrl, sourceEl }) {
  if (!sourceEl) return;
  const sourceRect = sourceEl.getBoundingClientRect();
  window.dispatchEvent(new CustomEvent("fly-to-cart", { detail: { imageUrl, sourceRect } }));
}
