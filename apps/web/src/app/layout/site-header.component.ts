import { AfterViewInit, Component, NgZone, OnDestroy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../core/cart.service';
import { cn } from '../core/cn';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="bar" [class.is-away]="away()">
    <div class="ticker">
      <p class="ticker-live">Envío gratis. Pagas al recibir en el Valle de Aburrá.</p>
      <div class="ticker-track">
        @for (copy of tapeCopies; track $index) {
          <p>{{ tape }}</p>
        }
      </div>
    </div>
    <nav class="float-nav" aria-label="Principal">
      <a
        routerLink="/"
        class="brand"
        aria-label="JyC Bienestar, ir al inicio"
        (click)="goHome($event)"
      >
        <span class="brand-mark" aria-hidden="true"></span>
      </a>
      <div class="actions">
        <a
          routerLink="/carrito"
          [class]="bagClass()"
          aria-label="Ver carrito de compras"
          (click)="revealNav()"
        >
          Carrito
          @if (cart.count() > 0) {
            <span class="badge" aria-hidden="true">{{ cart.count() }}</span>
          }
        </a>
        <a
          routerLink="/checkout"
          class="btn btn-primary buy"
          aria-label="Ir a comprar"
          (click)="revealNav()"
        >
          Comprar
        </a>
      </div>
    </nav>
    </div>
  `,
  styles: [
    `
      :host {
        position: relative;
        z-index: 100;
        display: block;
        view-transition-name: site-header;
      }
      .bar {
        position: fixed;
        z-index: 100;
        top: 0;
        left: 0;
        right: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-bottom: 0.75rem;
        background: #fdfbf7;
        border-bottom: 1px solid rgba(143, 115, 78, 0.18);
        box-shadow: 0 10px 24px rgba(28, 25, 22, 0.12);
        transform: translateY(0);
        transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
      }
      .bar.is-away {
        transform: translateY(calc(-100% - 1.25rem));
        transition-duration: 520ms;
        pointer-events: none;
      }
      .ticker {
        position: relative;
        width: 100%;
        display: flex;
        align-items: center;
        height: calc(var(--ticker-h) + env(safe-area-inset-top));
        padding-top: env(safe-area-inset-top);
        overflow: hidden;
        background: var(--ink);
        color: var(--ivory);
      }
      .ticker-live {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      .ticker-track {
        display: flex;
        width: max-content;
        animation: ticker 28s linear infinite;
      }
      .ticker-track p {
        margin: 0;
        padding-right: 2.4rem;
        font-size: 0.68rem;
        font-weight: 600;
        letter-spacing: 0.14em;
        line-height: 1;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .ticker-track p::after {
        content: '·';
        margin-left: 2.4rem;
        color: var(--champagne);
      }
      @keyframes ticker {
        from {
          transform: translateX(0);
        }
        to {
          transform: translateX(-50%);
        }
      }
      .float-nav {
        position: relative;
        z-index: 1;
        margin-top: 0.55rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        width: min(68rem, calc(100% - 1.4rem));
        max-width: calc(100% - 1.4rem);
        min-height: 3.6rem;
        padding: 0.35rem 0.4rem 0.35rem 0.85rem;
        border: 1px solid rgba(110, 82, 52, 0.22);
        border-radius: 999px;
        background: #ffffff;
        box-shadow: 0 4px 14px rgba(28, 25, 22, 0.1);
      }
      .brand {
        display: flex;
        align-items: center;
        flex: 0 0 auto;
        cursor: pointer;
        border-radius: 0.5rem;
        text-decoration: none;
      }
      .brand:focus-visible,
      .cart-link:focus-visible,
      .buy:focus-visible {
        outline: 2px solid var(--champagne-deep);
        outline-offset: 3px;
      }
      .brand-mark {
        display: block;
        width: 4.35rem;
        aspect-ratio: 827 / 570;
        background: #6e5234;
        -webkit-mask: url('/assets/logo-jyc.png') center / contain no-repeat;
        mask: url('/assets/logo-jyc.png') center / contain no-repeat;
        -webkit-mask-mode: luminance;
        mask-mode: luminance;
        pointer-events: none;
      }
      .actions {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        margin-left: auto;
      }
      .cart-link {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        min-height: 2.5rem;
        padding: 0 0.85rem;
        border-radius: 999px;
        font-size: 0.68rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--ink);
        text-decoration: none;
        cursor: pointer;
      }
      .cart-link:hover {
        color: var(--champagne-deep);
      }
      .cart-link.has-items {
        color: var(--champagne-deep);
      }
      .badge {
        min-width: 1.2rem;
        height: 1.2rem;
        padding: 0 0.3rem;
        border-radius: 999px;
        background: var(--ink);
        color: var(--ivory);
        font-size: 0.68rem;
        font-weight: 600;
        letter-spacing: 0;
        display: inline-grid;
        place-items: center;
        pointer-events: none;
      }
      .buy {
        min-height: 2.55rem;
        padding: 0.45rem 1.05rem;
        cursor: pointer;
        text-decoration: none;
      }
      @media (max-width: 720px) {
        .float-nav {
          gap: 0.45rem;
          padding: 0.3rem 0.3rem 0.3rem 0.65rem;
        }
        .brand-mark {
          width: 3.35rem;
        }
        .cart-link {
          padding: 0 0.45rem;
          letter-spacing: 0.1em;
        }
        .buy {
          padding: 0.4rem 0.7rem;
          letter-spacing: 0.1em;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .bar,
        .bar.is-away {
          transition: none;
        }
        .ticker-track {
          animation: none;
          width: 100%;
          justify-content: center;
        }
        .ticker-track p:not(:first-child) {
          display: none;
        }
        .ticker-track p {
          padding-right: 0;
        }
      }
    `,
  ],
})
export class SiteHeaderComponent implements AfterViewInit, OnDestroy {
  readonly cart = inject(CartService);
  private readonly zone = inject(NgZone);
  private readonly router = inject(Router);
  readonly tape = 'Envío gratis · Pagas al recibir en el Valle de Aburrá';
  readonly tapeCopies = Array.from({ length: 12 }, (_, index) => index);
  readonly away = signal(false);
  private lastY = 0;
  private acc = 0;
  private ticking = false;
  private readonly topLock = 48;
  private readonly hideAfter = 14;
  private readonly showAfter = 8;

  ngAfterViewInit() {
    this.lastY = Math.max(0, window.scrollY);
    this.zone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.onScroll, { passive: true });
    });
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.onScroll);
  }

  bagClass() {
    return cn('cart-link', this.cart.count() > 0 && 'has-items');
  }

  goHome(event: Event) {
    this.revealNav();
    const path = this.router.url.split('?')[0].split('#')[0];
    if (path === '/') {
      event.preventDefault();
      this.scrollTop();
    }
  }

  revealNav() {
    this.away.set(false);
    this.lastY = Math.max(0, window.scrollY);
    this.acc = 0;
  }

  private scrollTop() {
    history.replaceState(null, '', '/');
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }

  private readonly onScroll = () => {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      this.ticking = false;
      this.syncAway();
    });
  };

  private syncAway() {
    const y = Math.max(0, window.scrollY);
    const delta = y - this.lastY;
    this.lastY = y;

    if (y <= this.topLock) {
      this.acc = 0;
      this.setAway(false);
      return;
    }

    // Ignore tiny jitter from layout / address-bar resize.
    if (Math.abs(delta) < 2) return;

    // Reset accumulator when direction flips.
    if ((delta > 0 && this.acc < 0) || (delta < 0 && this.acc > 0)) this.acc = 0;
    this.acc += delta;

    if (this.acc >= this.hideAfter) {
      this.acc = 0;
      this.setAway(true);
      return;
    }

    if (this.acc <= -this.showAfter) {
      this.acc = 0;
      this.setAway(false);
    }
  }

  private setAway(value: boolean) {
    if (this.away() === value) return;
    this.zone.run(() => this.away.set(value));
  }
}
