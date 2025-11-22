import { create } from 'zustand';
import { CartItem, Product, Customer } from '../types';

interface CartState {
  items: CartItem[];
  customer: Customer | null;
  discount: number;
  notes: string;

  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  setCustomer: (customer: Customer | null) => void;
  setGlobalDiscount: (discount: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;

  // Computed values
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

/**
 * Cart store for POS checkout
 */
export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  discount: 0,
  notes: '',

  addItem: (product: Product, quantity = 1) => {
    const items = get().items;
    const existingItem = items.find((item) => item.product.id === product.id);

    if (existingItem) {
      set({
        items: items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ),
      });
    } else {
      set({
        items: [
          ...items,
          { product, quantity, discount: 0, notes: '' },
        ],
      });
    }
  },

  removeItem: (productId: string) => {
    set({
      items: get().items.filter((item) => item.product.id !== productId),
    });
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    set({
      items: get().items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    });
  },

  updateDiscount: (productId: string, discount: number) => {
    set({
      items: get().items.map((item) =>
        item.product.id === productId ? { ...item, discount } : item
      ),
    });
  },

  updateNotes: (productId: string, notes: string) => {
    set({
      items: get().items.map((item) =>
        item.product.id === productId ? { ...item, notes } : item
      ),
    });
  },

  setCustomer: (customer: Customer | null) => {
    set({ customer });
  },

  setGlobalDiscount: (discount: number) => {
    set({ discount });
  },

  setNotes: (notes: string) => {
    set({ notes });
  },

  clearCart: () => {
    set({
      items: [],
      customer: null,
      discount: 0,
      notes: '',
    });
  },

  getSubtotal: () => {
    return get().items.reduce((total, item) => {
      return total + item.product.price * item.quantity - item.discount;
    }, 0);
  },

  getTax: () => {
    const taxRate = 8.875; // Default tax rate, should come from settings
    const taxableAmount = get().items.reduce((total, item) => {
      if (item.product.isTaxable) {
        return total + (item.product.price * item.quantity - item.discount);
      }
      return total;
    }, 0);
    return (taxableAmount * taxRate) / 100;
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const tax = get().getTax();
    const globalDiscount = get().discount;
    return subtotal + tax - globalDiscount;
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));
