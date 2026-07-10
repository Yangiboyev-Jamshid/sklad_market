import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  addFavorite, removeFavorite, getFavorites, getAccessToken,
  getCart, addCartItem, updateCartItem, removeCartItem as apiRemoveCartItem, clearCart as apiClearCart,
  addCompanyFavorite, removeCompanyFavorite, getCompanyFavorites,
} from "../api/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

// Roles that are NOT allowed to use cart on the backend
const CART_BLOCKED_ROLES = ["SELLER", "MODERATOR", "ADMIN", "seller", "moderator", "admin"];

export function CartProvider({ children }) {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [items, setItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [favorites, setFavorites] = useState(new Set());

  // Cart is blocked for SELLER / MODERATOR / ADMIN roles
  const cartBlocked = isLoggedIn && CART_BLOCKED_ROLES.includes(user?.role);

  // ── Cart ──────────────────────────────────────────────────────────────────────────────
  const reloadCart = useCallback(async () => {
    if (!getAccessToken() || cartBlocked) return;
    setCartLoading(true);
    try {
      const data = await getCart();
      setItems(data?.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setCartLoading(false);
    }
  }, [cartBlocked]);

  // Re-fetch whenever login state flips (login populates the cart, logout clears it) —
  // CartProvider mounts once for the whole session, so this can't just be a mount-time effect.
  useEffect(() => {
    if (isLoggedIn) reloadCart();
    else setItems([]);
  }, [isLoggedIn, reloadCart]);

  const addToCart = useCallback(async (product) => {
    if (!getAccessToken()) { navigate("/login"); return; }
    if (cartBlocked) {
      alert("Корзина недоступна для продавцов / модераторов. Войдите как покупатель.");
      return;
    }
    try {
      const newItem = await addCartItem({ productId: product.id, quantity: product.qty || 1 });
      if (newItem && newItem.id) {
        // Optimistic update with server response
        setItems((prev) => {
          const idx = prev.findIndex(
            (i) => i.productId === newItem.productId || i.id === newItem.id
          );
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = newItem;
            return next;
          }
          return [...prev, newItem];
        });
      } else {
        // Server returned null/empty — reload to get fresh cart state
        await reloadCart();
      }
    } catch (err) {
      console.error("addToCart error:", err.message);
      // On error, reload cart to sync with server
      await reloadCart();
    }
  }, [navigate, reloadCart, cartBlocked]);

  const updateQty = useCallback(async (id, qty) => {
    const safeQty = Math.max(1, qty);
    // Optimistic
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: safeQty } : i)));
    try {
      const updated = await updateCartItem(id, { quantity: safeQty });
      if (updated) setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err) {
      console.error(err.message);
    }
  }, []);

  const removeFromCart = useCallback(async (id) => {
    // Optimistic
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await apiRemoveCartItem(id);
    } catch (err) {
      console.error(err.message);
      reloadCart();
    }
  }, [reloadCart]);

  const emptyCart = useCallback(async () => {
    setItems([]);
    try {
      await apiClearCart();
    } catch (err) {
      console.error(err.message);
      reloadCart();
    }
  }, [reloadCart]);

  const total = items.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0);
  const currency = items[0]?.currency ?? "UZS";

  // ── Product Favorites ─────────────────────────────────────────────────────
  const loadFavoriteIds = useCallback(async () => {
    if (!getAccessToken()) return;
    try {
      const data = await getFavorites({ page: 1, perPage: 200 });
      setFavorites(new Set((data?.content ?? []).map((p) => p.id)));
    } catch {
      // not logged in or request failed — leave favorites empty
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadFavoriteIds();
    else setFavorites(new Set());
  }, [isLoggedIn, loadFavoriteIds]);

  const toggleFavorite = useCallback(async (productId) => {
    if (!getAccessToken()) { navigate("/login"); return; }
    const isFav = favorites.has(productId);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(productId);
      else next.add(productId);
      return next;
    });
    try {
      if (isFav) await removeFavorite(productId);
      else await addFavorite(productId);
    } catch {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(productId);
        else next.delete(productId);
        return next;
      });
    }
  }, [favorites, navigate]);

  // ── Company Favorites ─────────────────────────────────────────────────────
  const [companyFavorites, setCompanyFavorites] = useState(new Set());

  const loadCompanyFavoriteIds = useCallback(async () => {
    if (!getAccessToken()) return;
    try {
      const data = await getCompanyFavorites({ page: 1, perPage: 200 });
      setCompanyFavorites(new Set((data?.content ?? []).map((c) => c.id)));
    } catch {
      // not logged in or request failed — leave company favorites empty
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadCompanyFavoriteIds();
    else setCompanyFavorites(new Set());
  }, [isLoggedIn, loadCompanyFavoriteIds]);

  const toggleCompanyFavorite = useCallback(async (companyId) => {
    if (!getAccessToken()) { navigate("/login"); return; }
    const isFav = companyFavorites.has(companyId);
    setCompanyFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(companyId);
      else next.add(companyId);
      return next;
    });
    try {
      if (isFav) await removeCompanyFavorite(companyId);
      else await addCompanyFavorite(companyId);
    } catch {
      setCompanyFavorites((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(companyId);
        else next.delete(companyId);
        return next;
      });
    }
  }, [companyFavorites, navigate]);

  return (
    <CartContext.Provider value={{
      items, cartLoading, cartBlocked, addToCart, updateQty, removeFromCart, emptyCart, reloadCart,
      total, currency,
      favorites, toggleFavorite, reloadFavorites: loadFavoriteIds,
      companyFavorites, toggleCompanyFavorite, reloadCompanyFavorites: loadCompanyFavoriteIds,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
