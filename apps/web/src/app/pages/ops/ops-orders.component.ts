import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CopPipe } from '../../core/money.pipe';
import { OpsOrder } from '../../core/models';
import {
  OPS_PATH,
  ORDER_STATUSES,
  formatWhen,
  isUnauthorized,
  statusLabel,
  statusOptions,
} from './ops-format';

@Component({
  selector: 'app-ops-orders',
  standalone: true,
  imports: [RouterLink, CopPipe],
  template: `
    <header class="ops-head">
      <div>
        <p class="ops-kicker">Entregas</p>
        <h1>Pedidos</h1>
        <p class="ops-muted">Filtra, cambia el estado o abre el detalle para editar datos del cliente.</p>
      </div>
    </header>

    <div class="ops-tools">
      <input
        type="search"
        placeholder="Buscar por nombre, teléfono o número"
        [value]="query()"
        (input)="query.set($any($event.target).value)"
        aria-label="Buscar pedidos"
      />
      <select [value]="status()" (change)="status.set($any($event.target).value)" aria-label="Filtrar por estado">
        <option value="">Todos los estados</option>
        @for (item of statuses; track item) {
          <option [value]="item">{{ statusLabel(item) }}</option>
        }
      </select>
    </div>

    @if (error()) {
      <p class="ops-error">{{ error() }}</p>
    }

    <section class="ops-panel">
      @if (loading()) {
        <div class="ops-empty"><span class="ops-skeleton" style="width:12rem"></span></div>
      } @else if (filtered().length === 0) {
        <div class="ops-empty">
          <strong>Sin resultados</strong>
          <span>No hay pedidos con ese filtro.</span>
        </div>
      } @else {
        <div class="ops-table-wrap">
          <table class="ops-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (order of filtered(); track order.id) {
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
                  <td><strong>{{ order.totalCents | cop }}</strong></td>
                  <td>
                    <select
                      [value]="order.status"
                      [disabled]="savingId() === order.id"
                      [attr.aria-label]="'Estado de ' + order.orderNumber"
                      (change)="setStatus(order, $any($event.target).value)"
                    >
                      @for (item of statusesFor(order.status); track item) {
                        <option [value]="item">{{ statusLabel(item) }}</option>
                      }
                    </select>
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
export class OpsOrdersComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  readonly path = OPS_PATH;
  readonly statuses = ORDER_STATUSES;
  readonly statusesFor = statusOptions;
  readonly statusLabel = statusLabel;
  readonly formatWhen = formatWhen;

  readonly orders = signal<OpsOrder[]>([]);
  readonly query = signal('');
  readonly status = signal('');
  readonly savingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly loading = signal(true);

  readonly filtered = () => {
    const text = this.query().trim().toLowerCase();
    const status = this.status();
    return this.orders().filter((order) => {
      const matchesStatus = !status || order.status === status;
      const haystack = `${order.orderNumber} ${order.customerName} ${order.customerPhone}`.toLowerCase();
      return matchesStatus && (!text || haystack.includes(text));
    });
  };

  ngOnInit() {
    this.load();
  }

  load() {
    const token = this.auth.token();
    if (!token) return;
    this.loading.set(true);
    this.api.adminOrders(token).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.fail(error);
      },
    });
  }

  setStatus(order: OpsOrder, status: string) {
    const token = this.auth.token();
    if (!token || status === order.status) return;
    this.savingId.set(order.id);
    this.api.updateOrderStatus(token, order.id, status).subscribe({
      next: () => {
        this.savingId.set(null);
        this.load();
      },
      error: (error) => {
        this.savingId.set(null);
        this.fail(error);
      },
    });
  }

  private fail(error: unknown) {
    if (isUnauthorized(error)) this.auth.clear();
    else this.error.set('No se pudieron cargar los pedidos.');
  }
}
