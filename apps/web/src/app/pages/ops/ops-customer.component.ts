import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CopPipe } from '../../core/money.pipe';
import { OpsCustomer } from '../../core/models';
import {
  OPS_PATH,
  formatWhen,
  isUnauthorized,
  phoneKey,
  statusLabel,
} from './ops-format';

@Component({
  selector: 'app-ops-customer',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CopPipe],
  template: `
    <a class="ops-back" [routerLink]="['/', path, 'clientes']">Volver a clientes</a>
    @if (customer(); as current) {
      <header class="ops-head">
        <div>
          <p class="ops-kicker">{{ current.ordersCount }} pedidos · {{ current.openCount }} abiertos</p>
          <h1>{{ current.customerName }}</h1>
          <p class="ops-muted">
            {{ current.municipalityName }} {{ current.departmentName }} · total {{ current.spentCents | cop }}
          </p>
        </div>
      </header>

      @if (error()) { <p class="ops-error">{{ error() }}</p> }
      @if (saved()) { <p class="ops-ok">Datos actualizados en sus pedidos.</p> }

      <div class="ops-detail">
        <form class="ops-panel ops-form" [formGroup]="form" (ngSubmit)="save()">
          <h2>Contacto</h2>
          <p class="ops-muted">Al guardar, se corrige en todos los pedidos de este teléfono.</p>
          <div class="ops-field">
            <label>Nombre</label>
            <input formControlName="customerName" />
          </div>
          <div class="ops-field">
            <label>Teléfono</label>
            <input formControlName="customerPhone" />
          </div>
          <div class="ops-field">
            <label>Correo</label>
            <input formControlName="customerEmail" />
          </div>
          <div class="ops-field">
            <label>Dirección</label>
            <input formControlName="addressLine" />
          </div>
          <div class="ops-field">
            <label>Barrio</label>
            <input formControlName="neighborhood" />
          </div>
          <button class="ops-btn" type="submit" [disabled]="form.invalid || saving()">Guardar cliente</button>
          @if (!confirming()) {
            <button class="ops-btn danger" type="button" (click)="confirming.set(true)">Eliminar cliente</button>
          } @else {
            <div class="ops-confirm">
              <p>Se eliminan sus {{ current.ordersCount }} pedidos. El inventario de los que no se entregaron vuelve al stock.</p>
              <div class="ops-actions">
                <button class="ops-btn danger" type="button" (click)="remove()">Sí, eliminar</button>
                <button class="ops-btn quiet" type="button" (click)="confirming.set(false)">Cancelar</button>
              </div>
            </div>
          }
        </form>

        <section class="ops-panel">
          <h2>Pedidos</h2>
          @for (order of current.orders ?? []; track order.id) {
            <a class="ops-row" [routerLink]="['/', path, 'pedidos', order.id]">
              <span>
                <strong>{{ order.orderNumber }}</strong>
                <span class="ops-muted">{{ formatWhen(order.createdAt) }}</span>
              </span>
              <span class="ops-pill" [attr.data-status]="order.status">{{ statusLabel(order.status) }}</span>
              <strong>{{ order.totalCents | cop }}</strong>
            </a>
          }
        </section>
      </div>
    } @else if (!error()) {
      <p class="ops-muted">Cargando cliente…</p>
    }
  `,
})
export class OpsCustomerComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly path = OPS_PATH;
  readonly formatWhen = formatWhen;
  readonly statusLabel = statusLabel;

  readonly customer = signal<OpsCustomer | null>(null);
  readonly error = signal<string | null>(null);
  readonly saved = signal(false);
  readonly saving = signal(false);
  readonly confirming = signal(false);

  readonly form = this.fb.nonNullable.group({
    customerName: ['', [Validators.required, Validators.minLength(3)]],
    customerPhone: ['', [Validators.required, Validators.minLength(7)]],
    customerEmail: [''],
    addressLine: ['', [Validators.required, Validators.minLength(5)]],
    neighborhood: [''],
  });

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const key = params.get('phoneKey');
      if (key) this.load(key);
    });
  }

  load(phoneKeyValue: string) {
    const token = this.auth.token();
    if (!token) return;
    this.api.adminCustomer(token, phoneKeyValue).subscribe({
      next: (customer) => {
        this.customer.set(customer);
        this.form.patchValue({
          customerName: customer.customerName,
          customerPhone: customer.customerPhone,
          customerEmail: customer.customerEmail ?? '',
          addressLine: customer.addressLine,
          neighborhood: customer.neighborhood ?? '',
        });
      },
      error: (error) => this.fail(error, 'No encontramos ese cliente.'),
    });
  }

  save() {
    const token = this.auth.token();
    const current = this.customer();
    if (!token || !current || this.form.invalid) return;
    this.saving.set(true);
    this.saved.set(false);
    this.error.set(null);
    this.api.updateCustomer(token, current.phoneKey, this.form.getRawValue()).subscribe({
      next: (customer) => {
        this.saving.set(false);
        this.saved.set(true);
        const nextKey = phoneKey(customer.customerPhone);
        if (nextKey !== current.phoneKey) {
          void this.router.navigate(['/', this.path, 'clientes', nextKey]);
          return;
        }
        this.customer.set(customer);
      },
      error: (error) => {
        this.saving.set(false);
        this.fail(error, 'No se pudo guardar. Revisa los datos.');
      },
    });
  }

  remove() {
    const token = this.auth.token();
    const current = this.customer();
    if (!token || !current) return;
    this.api.deleteCustomer(token, current.phoneKey).subscribe({
      next: () => void this.router.navigate(['/', this.path, 'clientes']),
      error: (error) => this.fail(error, 'No se pudo eliminar el cliente.'),
    });
  }

  private fail(error: unknown, message: string) {
    if (isUnauthorized(error)) this.auth.clear();
    else this.error.set(message);
  }
}
