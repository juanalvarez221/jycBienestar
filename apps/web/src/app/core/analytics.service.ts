import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ApiService } from './api.service';
import { CartService } from './cart.service';
import { environment } from '../../environments/environment';

const SESSION_KEY = 'jyc_session_v1';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly api = inject(ApiService);
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);
  private bound = false;
  private readonly sessionId = this.readSession();

  start() {
    if (typeof window === 'undefined' || this.bound) return;
    this.bound = true;

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (this.isOps(e.urlAfterRedirects)) return;
        this.track('page_view', { path: this.cleanPath(e.urlAfterRedirects) });
      });

    document.addEventListener(
      'click',
      (event) => {
        if (this.isOps(this.router.url)) return;
        const target = event.target as HTMLElement | null;
        if (!target) return;
        const el = target.closest('a,button,[data-track]') as HTMLElement | null;
        if (!el) return;
        const rect = document.documentElement;
        const xPercent = rect.clientWidth
          ? Math.round((event.clientX / rect.clientWidth) * 1000) / 10
          : undefined;
        const yPercent = rect.clientHeight
          ? Math.round((event.clientY / rect.clientHeight) * 1000) / 10
          : undefined;
        const label =
          el.getAttribute('data-track') ||
          el.getAttribute('aria-label') ||
          el.textContent?.trim().slice(0, 80) ||
          el.tagName.toLowerCase();
        this.track('click', {
          path: this.cleanPath(this.router.url),
          label,
          element: el.tagName.toLowerCase(),
          xPercent,
          yPercent,
        });
      },
      true,
    );
  }

  trackAddToCart(productName: string) {
    this.track('add_to_cart', {
      path: this.cleanPath(this.router.url),
      label: productName,
    });
  }

  trackCheckoutStart() {
    this.track('checkout_start', { path: '/checkout', label: 'Checkout' });
  }

  trackCheckoutComplete(orderNumber: string) {
    this.track('checkout_complete', {
      path: '/pedido-ok',
      label: orderNumber,
    });
  }

  private track(
    type: 'page_view' | 'click' | 'add_to_cart' | 'checkout_start' | 'checkout_complete',
    data: {
      path: string;
      label?: string;
      element?: string;
      xPercent?: number;
      yPercent?: number;
    },
  ) {
    this.api
      .trackEvent({
        visitorId: this.cart.visitorId,
        sessionId: this.sessionId,
        type,
        path: data.path,
        label: data.label,
        element: data.element,
        xPercent: data.xPercent,
        yPercent: data.yPercent,
        viewportW: typeof window !== 'undefined' ? window.innerWidth : undefined,
        viewportH: typeof window !== 'undefined' ? window.innerHeight : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      })
      .subscribe({ error: () => undefined });
  }

  private cleanPath(url: string) {
    return url.split('?')[0].split('#')[0] || '/';
  }

  private isOps(url: string) {
    const path = this.cleanPath(url);
    const base = `/${environment.opsPath}`;
    return path === base || path.startsWith(`${base}/`);
  }

  private readSession() {
    if (typeof localStorage === 'undefined') return `s_${Date.now()}`;
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${crypto.randomUUID?.() ?? `${Date.now()}_${Math.random()}`}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }
}
