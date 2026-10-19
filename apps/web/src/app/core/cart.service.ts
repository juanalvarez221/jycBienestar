import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { CartItem, Product } from './models';

const CART_KEY = 'jyc_cart_v1';
const VISITOR_KEY = 'jyc_visitor_v1';
const DRAFT_KEY = 'jyc_checkout_v1';

export interface CheckoutDraft {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  addressLine: string;
  neighborhood: string;
  departmentCode: string;
  municipalityCode: string;
  notes: string;
}

const EMPTY_DRAFT: CheckoutDraft = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  addressLine: '',
  neighborhood: '',
  departmentCode: '05',
  municipalityCode: '',
  notes: '',
};

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly api = inject(ApiService);
  private readonly itemsSignal = signal<CartItem[]>(this.readCart());
  private syncTimer = 0;

  readonly items = this.itemsSignal.asReadonly();
  readonly visitorId = this.readVisitor();
  readonly draft = signal<CheckoutDraft>(this.readDraft());

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => this.sync());
    }
  }

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
    const current = this.itemsSignal().find((i) => i.product.id === product.id);
    const next = (current?.quantity ?? 0) + quantity;
    this.setQuantity(product.id, next, product);
  }

  setQuantity(productId: string, quantity: number, product?: Product) {
    let items = [...this.itemsSignal()];
    const current = items.find((i) => i.product.id === productId);
    const stock = product?.stock ?? current?.product.stock ?? 20;
    const capped = Math.min(Math.max(0, quantity), Math.max(stock, 0));
    if (capped <= 0) {
      items = items.filter((i) => i.product.id !== productId);
    } else if (current) {
      items = items.map((i) =>
        i.product.id === productId
          ? { product: product ?? i.product, quantity: capped }
          : i,
      );
    } else if (product) {
      items.push({ product, quantity: capped });
    }
    this.persist(items);
  }

  saveDraft(partial: Partial<CheckoutDraft>) {
    const next = { ...this.draft(), ...partial };
    this.draft.set(next);
    this.write(DRAFT_KEY, next);
    this.scheduleSync();
  }

  clear() {
    this.persist([]);
    this.draft.set({ ...EMPTY_DRAFT });
    this.write(DRAFT_KEY, EMPTY_DRAFT);
    this.scheduleSync();
  }

  private persist(items: CartItem[]) {
    this.itemsSignal.set(items);
    this.write(CART_KEY, items);
    this.scheduleSync();
  }

  private scheduleSync() {
    if (typeof window === 'undefined') return;
    window.clearTimeout(this.syncTimer);
    this.syncTimer = window.setTimeout(() => this.sync(), 800);
  }

  private sync() {
    const items = this.itemsSignal();
    const draft = this.draft();
    this.api
      .saveCart({
        visitorId: this.visitorId,
        items: items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          unitPriceCents: item.product.priceCents,
        })),
        subtotalCents: this.subtotalCents(),
        customerName: draft.customerName || undefined,
        customerPhone: draft.customerPhone || undefined,
        customerEmail: draft.customerEmail || undefined,
        addressLine: draft.addressLine || undefined,
        neighborhood: draft.neighborhood || undefined,
        departmentCode: draft.departmentCode || undefined,
        municipalityCode: draft.municipalityCode || undefined,
      })
      .subscribe({ error: () => undefined });
  }

  private readVisitor() {
    if (typeof localStorage === 'undefined') return 'guest';
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  }

  private readCart(): CartItem[] {
    return this.read<CartItem[]>(CART_KEY, []);
  }

  private readDraft(): CheckoutDraft {
    return { ...EMPTY_DRAFT, ...this.read<Partial<CheckoutDraft>>(DRAFT_KEY, {}) };
  }

  private read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private write(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode */
    }
  }
}
