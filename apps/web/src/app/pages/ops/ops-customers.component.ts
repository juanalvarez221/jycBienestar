import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CopPipe } from '../../core/money.pipe';
import { OpsCustomer } from '../../core/models';
import { OPS_PATH, formatWhen, isUnauthorized } from './ops-format';

@Component({
  selector: 'app-ops-customers',
  standalone: true,
  imports: [RouterLink, CopPipe],
  template: `
    <header class="ops-head">
      <div>
        <p class="ops-kicker">Quién compra</p>
        <h1>Clientes</h1>
        <p class="ops-muted">Cada teléfono agrupa sus pedidos. Ábrelo para corregir datos o borrarlo.</p>
      </div>
    </header>

    <div class="ops-tools">
      <input
        type="search"
        placeholder="Buscar por nombre o teléfono"
        [value]="query()"
        (input)="query.set($any($event.target).value)"
        aria-label="Buscar clientes"
      />
    </div>

    @if (error()) {
      <p class="ops-error">{{ error() }}</p>
    }

    <section class="ops-panel">
      @if (loading()) {
        <div class="ops-empty"><span class="ops-skeleton" style="width:12rem"></span></div>
      } @else if (filtered().length === 0) {
        <div class="ops-empty">
          <strong>Sin clientes</strong>
          <span>Todavía no hay clientes con ese criterio.</span>
        </div>
      } @else {
        <div class="ops-table-wrap">
          <table class="ops-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Pedidos</th>
                <th>Gastado</th>
                <th>Último pedido</th>
              </tr>
            </thead>
            <tbody>
              @for (customer of filtered(); track customer.phoneKey) {
                <tr>
                  <td>
                    <a [routerLink]="['/', path, 'clientes', customer.phoneKey]">
                      <strong>{{ customer.customerName }}</strong>
                      <span class="ops-muted">{{ customer.customerPhone }}</span>
                    </a>
                  </td>
                  <td>{{ customer.ordersCount }} · {{ customer.openCount }} abiertos</td>
                  <td><strong>{{ customer.spentCents | cop }}</strong></td>
                  <td><span class="ops-muted" style="display:inline;margin:0">{{ formatWhen(customer.lastOrderAt) }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class OpsCustomersComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  readonly path = OPS_PATH;
  readonly formatWhen = formatWhen;

  readonly customers = signal<OpsCustomer[]>([]);
  readonly query = signal('');
  readonly error = signal<string | null>(null);
  readonly loading = signal(true);

  readonly filtered = () => {
    const text = this.query().trim().toLowerCase();
    return this.customers().filter((customer) => {
      const haystack = `${customer.customerName} ${customer.customerPhone}`.toLowerCase();
      return !text || haystack.includes(text);
    });
  };

  ngOnInit() {
    const token = this.auth.token();
    if (!token) return;
    this.api.adminCustomers(token).subscribe({
      next: (customers) => {
        this.customers.set(customers);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        if (isUnauthorized(error)) this.auth.clear();
        else this.error.set('No se pudieron cargar los clientes.');
      },
    });
  }
}
