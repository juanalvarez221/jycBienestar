import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CopPipe } from '../../core/money.pipe';
import { OpsMetrics, OpsOrder } from '../../core/models';
import {
  OPS_PATH,
  formatWhen,
  isUnauthorized,
  statusLabel,
} from './ops-format';

@Component({
  selector: 'app-ops-home',
  standalone: true,
  imports: [RouterLink, CopPipe],
  template: `
    <header class="ops-head">
      <div>
        <p class="ops-kicker">Dashboard</p>
        <h1>Operación</h1>
        <p class="ops-muted">Resumen en vivo: pedidos por atender, carritos abiertos e ingresos.</p>
      </div>
      <a class="ops-btn" [routerLink]="['/', path, 'metricas']">Ver métricas</a>
    </header>

    @if (error()) {
      <p class="ops-error">{{ error() }}</p>
    }

    @if (loading()) {
      <section class="ops-stats">
        @for (_ of [1, 2, 3, 4]; track $index) {
          <article class="ops-stat"><span class="ops-skeleton" style="width:4rem"></span><div class="ops-skeleton" style="width:3rem;height:1.4rem;margin-top:0.5rem"></div></article>
        }
      </section>
    } @else {
      @if (metrics(); as m) {
        <section class="ops-stats">
          <article class="ops-stat">
            <span>Por atender</span>
            <strong>{{ m.porAtender }}</strong>
          </article>
          <article class="ops-stat">
            <span>En camino</span>
            <strong>{{ m.enviados }}</strong>
          </article>
          <article class="ops-stat">
            <span>Carritos abiertos</span>
            <strong>{{ m.carritosAbandonados ?? 0 }}</strong>
          </article>
          <article class="ops-stat">
            <span>Ingresos</span>
            <strong>{{ m.ingresosCentavos | cop }}</strong>
          </article>
        </section>
      }
    }

    <div class="ops-split">
      <section class="ops-panel">
        <div class="ops-panel-head">
          <h2>Pedidos que esperan</h2>
          <a class="ops-back" [routerLink]="['/', path, 'pedidos']">Ver todos</a>
        </div>
        @if (pending().length === 0) {
          <div class="ops-empty">
            <strong>Sin pendientes</strong>
            <span>Cuando entre un pedido nuevo, aparece aquí y en la alerta superior.</span>
          </div>
        } @else {
          <div class="ops-table-wrap">
            <table class="ops-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                @for (order of pending(); track order.id) {
                  <tr>
                    <td>
                      <a [routerLink]="['/', path, 'pedidos', order.id]">
                        <strong>{{ order.orderNumber }}</strong>
                        <span class="ops-muted">{{ formatWhen(order.createdAt) }}</span>
                      </a>
                    </td>
                    <td>
                      <strong>{{ order.customerName }}</strong>
                      <span class="ops-muted">{{ order.customerPhone }}</span>
                    </td>
                    <td>
                      <span class="ops-pill" [attr.data-status]="order.status">{{ statusLabel(order.status) }}</span>
                    </td>
                    <td><strong>{{ order.totalCents | cop }}</strong></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>

      <section class="ops-panel">
        <h2>Atajos</h2>
        <div class="ops-form">
          <a class="ops-shortcut" [routerLink]="['/', path, 'pedidos']">
            <div>
              <strong>Pedidos</strong>
              <span>Estados, edición y seguimiento</span>
            </div>
          </a>
          <a class="ops-shortcut" [routerLink]="['/', path, 'productos']">
            <div>
              <strong>Productos</strong>
              <span>Precio, stock y visibilidad</span>
            </div>
          </a>
          <a class="ops-shortcut" [routerLink]="['/', path, 'carritos']">
            <div>
              <strong>Carritos</strong>
              <span>Recuperar abandonos</span>
            </div>
          </a>
          <a class="ops-shortcut" [routerLink]="['/', path, 'clientes']">
            <div>
              <strong>Clientes</strong>
              <span>Historial por teléfono</span>
            </div>
          </a>
          <a class="ops-shortcut" [routerLink]="['/', path, 'correos']">
            <div>
              <strong>Correos</strong>
              <span>Alertas de pedidos nuevos</span>
            </div>
          </a>
        </div>
      </section>
    </div>
  `,
})
export class OpsHomeComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  readonly path = OPS_PATH;
  readonly statusLabel = statusLabel;
  readonly formatWhen = formatWhen;

  readonly metrics = signal<OpsMetrics | null>(null);
  readonly orders = signal<OpsOrder[]>([]);
  readonly error = signal<string | null>(null);
  readonly loading = signal(true);

  readonly pending = () =>
    this.orders().filter((order) =>
      ['RECIBIDO', 'EN_PREPARACION', 'RECEIVED', 'PREPARING'].includes(order.status),
    );

  ngOnInit() {
    this.load();
  }

  load() {
    const token = this.auth.token();
    if (!token) return;
    this.loading.set(true);
    let pending = 2;
    const done = () => {
      pending -= 1;
      if (pending <= 0) this.loading.set(false);
    };
    this.api.adminMetrics(token).subscribe({
      next: (metrics) => {
        this.metrics.set(metrics);
        done();
      },
      error: (error) => {
        this.fail(error);
        done();
      },
    });
    this.api.adminOrders(token).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        done();
      },
      error: (error) => {
        this.fail(error);
        done();
      },
    });
  }

  private fail(error: unknown) {
    if (isUnauthorized(error)) this.auth.clear();
    else this.error.set('No se pudo cargar la operación.');
  }
}
