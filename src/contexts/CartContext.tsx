import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

/** Cart is in-memory only: it clears on hard refresh / new page load. */
interface CartContextType {
  cartSlugs: string[];
  addToCart: (slug: string) => void;
  removeFromCart: (slug: string) => void;
  setCartSlugs: (slugs: string[] | ((prev: string[]) => string[])) => void;
  isInCart: (slug: string) => boolean;
  cartCount: number;
}

const CartContext = createContext<CartContextType>({
  cartSlugs: [],
  addToCart: () => {},
  removeFromCart: () => {},
  setCartSlugs: () => {},
  isInCart: () => false,
  cartCount: 0,
});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartSlugs, setCartSlugsState] = useState<string[]>([]);

  const setCartSlugs = useCallback((value: string[] | ((prev: string[]) => string[])) => {
    setCartSlugsState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      return Array.from(new Set(next));
    });
  }, []);

  const addToCart = useCallback((slug: string) => {
    setCartSlugsState((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
  }, []);

  const removeFromCart = useCallback((slug: string) => {
    setCartSlugsState((prev) => prev.filter((s) => s !== slug));
  }, []);

  const isInCart = useCallback(
    (slug: string) => cartSlugs.includes(slug),
    [cartSlugs],
  );

  const value: CartContextType = {
    cartSlugs,
    addToCart,
    removeFromCart,
    setCartSlugs,
    isInCart,
    cartCount: cartSlugs.length,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
