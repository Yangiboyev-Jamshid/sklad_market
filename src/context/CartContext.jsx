import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([
    { id: "p2-cart", name: "Оцинкованный рулон", company: "Asia Steel Group", price: 850, pricePerTon: 85, qty: 10 },
    { id: "p5-cart", name: "Хлопковая пряжа №30/1", company: "TextilGroup", price: 850, pricePerTon: 85, qty: 10 },
  ]);
  const [favorites, setFavorites] = useState(new Set(["p1-0", "p2-1"]));

  const addToCart = (product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.name === product.name);
      if (existing) {
        return prev.map((i) =>
          i.name === product.name ? { ...i, qty: i.qty + (product.qty || 1) } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id + "-cart",
          name: product.name,
          company: product.company,
          price: product.price,
          pricePerTon: Math.round(product.price / 10),
          qty: product.qty || product.minOrder || 1,
        },
      ];
    });
  };

  const updateQty = (id, qty) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)));
  };

  const removeFromCart = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const total = items.reduce((sum, i) => sum + i.pricePerTon * i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, updateQty, removeFromCart, total, favorites, toggleFavorite }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
