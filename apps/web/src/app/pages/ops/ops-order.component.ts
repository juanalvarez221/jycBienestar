import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CopPipe } from '../../core/money.pipe';
import { OpsOrder } from '../../core/models';
import {
  OPS_PATH,
  formatWhen,
  isUnauthorized,
  phoneKey,
  canonicalStatus,
  statusLabel,
  statusOptions,
} from './ops-format';

@Component({
  selector: 'app-ops-order',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CopPipe],
  template: `
    <a class="ops-back" [routerLink]="['/', path, 'pedidos']">Volver a pedidos</a>
    @if (order(); as current) {
      <header class="ops-head">
        <div>
          <p class="ops-kicker">{{ formatWhen(current.createdAt) }}</p>
          <h1>{{ current.orderNumber }}</h1>
          <p class="ops-muted">
            {{ current.municipalityName }} {{ current.departmentName }} · Contraentrega
          </p>
        </div>
        <span class="ops-pill" [attr.data-status]="current.status">{{ statusLabel(current.status) }}</span>
      </header>

      @if (error()) { <p class="ops-error">{{ error() }}</p> }
      @if (saved()) { <p class="ops-ok">Pedido actualizado.</p> }

      <div class="ops-detail">
        <form class="ops-panel ops-form" [formGroup]="form" (ngSubmit)="save()">
          <h2>Datos del pedido</h2>
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
          <div class="ops-field">
            <label>Notas</label>
            <textarea formControlName="notes"></textarea>
          </div>
          <div class="ops-field">
            <label>Estado</label>
            <select formControlName="status">
              @for (item of statusOptions(current.status); track item) {
                <option [value]="item">{{ statusLabel(item) }}</option>
              }
            </select>
          </div>
          <div class="ops-actions">
            <button class="ops-btn" type="submit" [disabled]="form.invalid || saving()">Guardar cambios</button>
            <a class="ops-btn quiet" [routerLink]="['/', path, 'clientes', phoneKey(current.customerPhone)]">Ver cliente</a>
          </div>
          @if (!confirming()) {
            <button class="ops-btn danger" type="button" (click)="confirming.set(true)">Eliminar pedido</button>
          } @else {
            <div class="ops-confirm">
              <p>Se borra este pedido. Si no estaba entregado, las unidades vuelven al inventario.</p>
              <div class="ops-actions">
                <button class="ops-btn danger" type="button" (click)="remove()">Sí, eliminar</button>
                <button class="ops-btn quiet" type="button" (click)="confirming.set(false)">Cancelar</button>
              </div>
            </div>
          }
        </form>

        <div class="ops-form">
          <section class="ops-panel">
            <h2>Qué pidió</h2>
            @for (item of current.items; track item.id) {
              <div class="ops-lines">
                <div>
                  <span>{{ item.quantity }} × {{ item.productName }}</span>
                  <strong>{{ item.unitPriceCents * item.quantity | cop }}</strong>
                </div>
              </div>
            }
            <dl class="ops-lines">
              <div><dt>Subtotal</dt><dd>{{ current.subtotalCents | cop }}</dd></div>
              <div><dt>Envío</dt><dd>{{ current.shippingCents | cop }}</dd></div>
              <div><dt>Total</dt><dd><strong>{{ current.totalCents | cop }}</strong></dd></div>
            </dl>
          </section>
          <section class="ops-panel">
            <h2>Historial</h2>
            <ol class="ops-history">
              @for (event of current.statusEvents ?? []; track event.id) {
                <li>
                  <strong>{{ statusLabel(event.status) }}</strong>
                  <span>{{ formatWhen(event.createdAt) }} · {{ event.note }}</span>
                </li>
              }
            </ol>
          </section>
        </div>
      </div>
    } @else if (!error()) {
      <p class="ops-muted">Cargando pedido…</p>
    }
  `,
})
export class OpsOrderComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly path = OPS_PATH;
  readonly statusOptions = statusOptions;
  readonly statusLabel = statusLabel;
  readonly formatWhen = formatWhen;
  readonly phoneKey = phoneKey;

  readonly order = signal<OpsOrder | null>(null);
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
    notes: [''],
    status: ['RECIBIDO', Validators.required],
  });

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (id) this.load(id);
    });
  }

  load(id: string) {
    const token = this.auth.token();
    if (!token) return;
    this.api.adminOrder(token, id).subscribe({
      next: (order) => {
        this.order.set(order);
        this.form.patchValue({
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail ?? '',
          addressLine: order.addressLine,
          neighborhood: order.neighborhood ?? '',
          notes: order.notes ?? '',
          status: canonicalStatus(order.status),
        });
      },
      error: (error) => this.fail(error, 'No encontramos ese pedido.'),
    });
  }

  save() {
    const token = this.auth.token();
    const current = this.order();
    if (!token || !current || this.form.invalid) return;
    this.saving.set(true);
    this.saved.set(false);
    this.error.set(null);
    const value = this.form.getRawValue();
    this.api.updateOrder(token, current.id, value).subscribe({
      next: (order) => {
        this.order.set(order);
        this.saving.set(false);
        this.saved.set(true);
      },
      error: (error) => {
        this.saving.set(false);
        this.fail(error, 'No se pudo guardar. Revisa los datos.');
      },
    });
  }

  remove() {
    const token = this.auth.token();
    const current = this.order();
    if (!token || !current) return;
    this.api.deleteOrder(token, current.id).subscribe({
      next: () => void this.router.navigate(['/', this.path, 'pedidos']),
      error: (error) => this.fail(error, 'No se pudo eliminar el pedido.'),
    });
  }

  private fail(error: unknown, message: string) {
    if (isUnauthorized(error)) this.auth.clear();
    else this.error.set(message);
  }
}
