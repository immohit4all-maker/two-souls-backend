import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import type { ReactNode } from 'react';
import { CartContext } from './cart-context';
import type { CartContextValue } from './cart-context';
import type { CartLine, Product } from '../types';
import { toNumber } from '../lib/format';

const STORAGE_KEY = 'two_souls_cart';

type CartAction =
  | { type: 'add'; line: CartLine }
  | { type: 'setQuantity'; productId: string; quantity: number }
  | { type: 'remove'; productId: string }
  | { type: 'clear' };

/** Never let a line exceed known stock, and never drop below one unit. */
function clampQuantity(quantity: number, stock?: number): number {
  const floored = Math.max(1, Math.floor(quantity));
  if (stock === undefined || stock <= 0) return floored;
  return Math.min(floored, stock);
}

function reducer(state: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case 'add': {
      const existing = state.find((line) => line.product_id === action.line.product_id);
      if (!existing) return [...state, action.line];
      return state.map((line) =>
        line.product_id === action.line.product_id
          ? {
              ...line,
              // Refresh price and image from the newer product record while merging quantity.
              unit_price: action.line.unit_price,
              imageUrl: action.line.imageUrl,
              stock_quantity: action.line.stock_quantity,
              quantity: clampQuantity(line.quantity + action.line.quantity, action.line.stock_quantity),
            }
          : line,
      );
    }
    case 'setQuantity':
      return state.map((line) =>
        line.product_id === action.productId
          ? { ...line, quantity: clampQuantity(action.quantity, line.stock_quantity) }
          : line,
      );
    case 'remove':
      return state.filter((line) => line.product_id !== action.productId);
    case 'clear':
      return [];
    default:
      return state;
  }
}

function readStoredCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Trust nothing from storage: keep only entries that still look like cart lines.
    return parsed.filter((entry): entry is CartLine => {
      if (typeof entry !== 'object' || entry === null) return false;
      const line = entry as Partial<CartLine>;
      return (
        typeof line.product_id === 'string' &&
        typeof line.title === 'string' &&
        typeof line.unit_price === 'number' &&
        typeof line.quantity === 'number' &&
        line.quantity > 0
      );
    });
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, undefined, readStoredCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // A full or disabled localStorage should not break checkout.
    }
  }, [lines]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    const stock = product.stock_quantity === undefined ? undefined : toNumber(product.stock_quantity);
    dispatch({
      type: 'add',
      line: {
        product_id: product.product_id,
        title: product.title,
        sku: product.sku,
        seller_id: product.seller_id,
        imageUrl: product.imageUrl,
        unit_price: toNumber(product.sell_price),
        quantity: clampQuantity(quantity, stock),
        stock_quantity: stock,
      },
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) dispatch({ type: 'remove', productId });
    else dispatch({ type: 'setQuantity', productId, quantity });
  }, []);

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: 'remove', productId });
  }, []);

  const clear = useCallback(() => dispatch({ type: 'clear' }), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((total, line) => total + line.quantity, 0);
    const subtotal = lines.reduce((total, line) => total + line.unit_price * line.quantity, 0);
    return {
      lines,
      count,
      subtotal,
      isOpen,
      openCart,
      closeCart,
      addItem,
      setQuantity,
      removeItem,
      clear,
    };
  }, [lines, isOpen, openCart, closeCart, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
