import { Injectable, computed, signal } from '@angular/core';
import { CartItem, Product } from './models';

const KEY = 'jyc_cart_v1';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsSignal = signal<CartItem[]>(this.load());

  readonly items = this.itemsSignal.asReadonly();
  readonly count = computed(() =>
    this.itemsSignal().reduce((n, i) => n + i.quantity, 0),
  );
  readonly subtotalCents = computed(() =>
    this.itemsSignal().reduce(
      (n, i) => n + i.product.priceCents * i.quantity,
      0,
    ),
  );

  add(product: Product, quantity = 1) {
    const items = [...this.itemsSignal()];
    const idx = items.findIndex((i) => i.product.id === product.id);
    if (idx >= 0) {
      items[idx] = {
        ...items[idx],
        quantity: items[idx].quantity + quantity,
      };
    } else {
      items.push({ product, quantity });
    }
    this.persist(items);
  }

  setQuantity(productId: string, quantity: number) {
    let items = [...this.itemsSignal()];
    if (quantity <= 0) {
      items = items.filter((i) => i.product.id !== productId);
    } else {
      items = items.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i,
      );
    }
    this.persist(items);
  }

  clear() {
    this.persist([]);
  }

  private persist(items: CartItem[]) {
    this.itemsSignal.set(items);
    localStorage.setItem(KEY, JSON.stringify(items));
  }

  private load(): CartItem[] {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }
}
