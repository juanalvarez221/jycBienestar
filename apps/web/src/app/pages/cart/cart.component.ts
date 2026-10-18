import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/cart.service';
import { CopPipe } from '../../core/money.pipe';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, CopPipe],
  template: `
    <section class="page container">
      <h1>Tu bolsa</h1>
      @if (cart.items().length === 0) {
        <p class="empty">Aún no hay productos. <a routerLink="/">Volver al inicio</a></p>
      } @else {
        <ul class="list">
          @for (item of cart.items(); track item.product.id) {
            <li>
              <div>
                <strong>{{ item.product.name }}</strong>
                <p>{{ item.product.priceCents | cop }} c/u</p>
              </div>
              <div class="qty">
                <button type="button" (click)="cart.setQuantity(item.product.id, item.quantity - 1)">−</button>
                <span>{{ item.quantity }}</span>
                <button type="button" (click)="cart.setQuantity(item.product.id, item.quantity + 1)">+</button>
              </div>
              <div class="line">{{ item.product.priceCents * item.quantity | cop }}</div>
            </li>
          }
        </ul>
        <div class="summary">
          <p>Subtotal <strong>{{ cart.subtotalCents() | cop }}</strong></p>
          <a class="btn btn-primary" routerLink="/checkout">Continuar pedido</a>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .page { padding: var(--space-7) 0 var(--space-8); }
      h1 { font-size: 2.4rem; margin-bottom: 1.5rem; }
      .empty { color: var(--mist); }
      .list { list-style: none; padding: 0; margin: 0; display: grid; gap: 1rem; }
      li {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 1rem;
        align-items: center;
        padding: 1rem 0;
        border-bottom: 1px solid var(--line);
      }
      li p { color: var(--mist); font-size: 0.9rem; margin-top: 0.25rem; }
      .qty { display: inline-flex; align-items: center; gap: 0.5rem; }
      .qty button {
        width: 2rem; height: 2rem; border: 1px solid var(--line);
        background: transparent; color: var(--ivory); cursor: pointer;
      }
      .summary {
        margin-top: 2rem; display: flex; flex-wrap: wrap;
        justify-content: space-between; align-items: center; gap: 1rem;
      }
    `,
  ],
})
export class CartComponent {
  readonly cart = inject(CartService);
}
