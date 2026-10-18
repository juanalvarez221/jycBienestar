import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../core/cart.service';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <div class="container inner">
        <a routerLink="/" class="brand" aria-label="J&C Bienestar inicio">
          <span class="brand-mark">J&amp;C</span>
          <span class="brand-name">Bienestar</span>
        </a>
        <nav class="nav">
          <a routerLink="/" fragment="producto" routerLinkActive="active">Producto</a>
          <a routerLink="/" fragment="envio">Envío discreto</a>
          <a routerLink="/checkout">Pedir</a>
        </nav>
        <a routerLink="/carrito" class="cart-link">
          Bolsa
          @if (cart.count() > 0) {
            <span class="badge">{{ cart.count() }}</span>
          }
        </a>
      </div>
    </header>
  `,
  styles: [
    `
      .header {
        position: sticky;
        top: 0;
        z-index: 40;
        height: var(--header-h);
        backdrop-filter: blur(14px);
        background: rgba(18, 20, 18, 0.78);
        border-bottom: 1px solid var(--line);
      }
      .inner {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }
      .brand {
        display: flex;
        align-items: baseline;
        gap: 0.45rem;
      }
      .brand-mark {
        font-family: var(--font-display);
        font-size: 1.55rem;
        color: var(--champagne);
        letter-spacing: 0.04em;
      }
      .brand-name {
        font-size: 0.78rem;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--ivory);
      }
      .nav {
        display: none;
        gap: 1.5rem;
        font-size: 0.9rem;
        color: var(--mist);
      }
      .nav a:hover {
        color: var(--champagne-bright);
      }
      .cart-link {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.85rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--ivory);
      }
      .badge {
        min-width: 1.35rem;
        height: 1.35rem;
        padding: 0 0.35rem;
        border-radius: 999px;
        background: var(--champagne);
        color: var(--carbon);
        font-size: 0.75rem;
        font-weight: 700;
        display: inline-grid;
        place-items: center;
      }
      @media (min-width: 860px) {
        .nav {
          display: flex;
        }
      }
    `,
  ],
})
export class SiteHeaderComponent {
  readonly cart = inject(CartService);
}
