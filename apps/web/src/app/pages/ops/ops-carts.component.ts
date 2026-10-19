import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CopPipe } from '../../core/money.pipe';
import { AbandonedCart } from '../../core/models';
import { formatWhen, isUnauthorized } from './ops-format';

@Component({
  selector: 'app-ops-carts',
  standalone: true,
  imports: [CopPipe],
  template: `
    <header class="ops-head">
      <div>
        <p class="ops-kicker">Seguimiento</p>
        <h1>Carritos abandonados</h1>
        <p class="ops-muted">
          Quienes armaron un pedido y no lo confirmaron. Si dejaron celular, se puede escribir.
        </p>
      </div>
    </header>

    @if (error()) {
      <p class="ops-error">{{ error() }}</p>
    }

    <section class="ops-panel">
      @if (loading()) {
        <div class="ops-empty"><span class="ops-skeleton" style="width:12rem"></span></div>
      } @else if (carts().length === 0) {
        <div class="ops-empty">
          <strong>Sin carritos abiertos</strong>
          <span>No hay abandonos pendientes por ahora.</span>
        </div>
      } @else {
        <div class="ops-table-wrap">
          <table class="ops-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (cart of carts(); track cart.id) {
                <tr>
                  <td>
                    <strong>{{ cart.customerName || 'Sin nombre' }}</strong>
                    <span class="ops-muted">{{ formatWhen(cart.updatedAt) }}</span>
                  </td>
                  <td>
                    @if (cart.customerPhone) {
                      <a class="ops-wa" [href]="wa(cart.customerPhone)" target="_blank" rel="noopener noreferrer">
                        {{ cart.customerPhone }}
                      </a>
                    } @else {
                      <span class="ops-muted" style="display:inline;margin:0">Sin celular</span>
                    }
                    @if (cart.addressLine) {
                      <span class="ops-muted">{{ cart.addressLine }}</span>
                    }
                  </td>
                  <td>
                    @for (item of cart.items; track item.productId) {
                      <span class="ops-muted" style="display:block;margin:0">{{ item.quantity }}× {{ item.name }}</span>
                    }
                  </td>
                  <td><strong>{{ cart.subtotalCents | cop }}</strong></td>
                  <td>
                    <button class="ops-btn danger" type="button" (click)="remove(cart)">Eliminar</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class OpsCartsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  readonly formatWhen = formatWhen;
  readonly carts = signal<AbandonedCart[]>([]);
  readonly error = signal<string | null>(null);
  readonly loading = signal(true);

  ngOnInit() {
    this.load();
  }

  load() {
    const token = this.auth.token();
    if (!token) return;
    this.loading.set(true);
    this.api.adminCarts(token).subscribe({
      next: (rows) => {
        this.carts.set(rows);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        if (isUnauthorized(error)) this.auth.clear();
        else this.error.set('No se pudieron cargar los carritos.');
      },
    });
  }

  remove(cart: AbandonedCart) {
    const token = this.auth.token();
    if (!token) return;
    this.api.deleteCart(token, cart.id).subscribe({
      next: () => this.load(),
      error: (error) => {
        if (isUnauthorized(error)) this.auth.clear();
        else this.error.set('No se pudo eliminar el carrito.');
      },
    });
  }

  wa(phone: string) {
    const digits = phone.replace(/\D/g, '');
    const full = digits.startsWith('57') ? digits : `57${digits}`;
    return `https://wa.me/${full}?text=${encodeURIComponent('Hola, vimos que dejaste un pedido pendiente de Power Sex Jarabe. ¿Te ayudamos a cerrarlo?')}`;
  }
}
