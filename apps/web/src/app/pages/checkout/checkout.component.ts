import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AnalyticsService } from '../../core/analytics.service';
import { ApiService } from '../../core/api.service';
import { LegalNoticeService } from '../../core/legal-notice.service';
import { CartService } from '../../core/cart.service';
import { CopPipe } from '../../core/money.pipe';
import { QtyComponent } from '../../ui/qty.component';
import { Department, Municipality, ShippingQuote } from '../../core/models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, CopPipe, QtyComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly analytics = inject(AnalyticsService);
  private readonly router = inject(Router);
  private readonly legal = inject(LegalNoticeService);
  readonly cart = inject(CartService);

  readonly departments = signal<Department[]>([]);
  readonly municipalities = signal<Municipality[]>([]);
  readonly shipping = signal<ShippingQuote | null>(null);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    customerName: ['', [Validators.required, Validators.minLength(3)]],
    customerPhone: ['', [Validators.required, Validators.minLength(7)]],
    customerEmail: ['', [Validators.email]],
    addressLine: ['', [Validators.required, Validators.minLength(5)]],
    neighborhood: [''],
    departmentCode: ['05', Validators.required],
    municipalityCode: ['', Validators.required],
    notes: [''],
    acceptedTerms: [false, Validators.requiredTrue],
  });

  ngOnInit() {
    this.analytics.trackCheckoutStart();
    const draft = this.cart.draft();
    this.form.patchValue(
      { ...draft, acceptedTerms: false },
      { emitEvent: false },
    );

    if (this.cart.items().length === 0) {
      this.api.getProduct('power-sex-jarabe-500ml').subscribe((p) => {
        if (this.cart.items().length === 0) this.cart.add(p, 1);
      });
    }

    this.api.getDepartments().subscribe((d) => this.departments.set(d));
    this.loadMunicipalities(draft.departmentCode || '05', draft.municipalityCode);

    this.form.valueChanges.subscribe((value) => {
      this.cart.saveDraft({
        customerName: value.customerName ?? '',
        customerPhone: value.customerPhone ?? '',
        customerEmail: value.customerEmail ?? '',
        addressLine: value.addressLine ?? '',
        neighborhood: value.neighborhood ?? '',
        departmentCode: value.departmentCode ?? '05',
        municipalityCode: value.municipalityCode ?? '',
        notes: value.notes ?? '',
      });
    });

    this.form.controls.departmentCode.valueChanges.subscribe((code) => {
      this.form.controls.municipalityCode.setValue('');
      this.shipping.set(null);
      this.loadMunicipalities(code);
    });

    this.form.controls.municipalityCode.valueChanges.subscribe((code) => {
      if (!code) return;
      this.api.getShipping(code).subscribe((q) => this.shipping.set(q));
    });
  }

  private loadMunicipalities(departmentCode: string, preferredCode?: string) {
    this.api.getMunicipalities(departmentCode).subscribe((m) => {
      this.municipalities.set(m);
      const saved = preferredCode && m.some((item) => item.code === preferredCode)
        ? preferredCode
        : this.form.controls.municipalityCode.value;
      if (saved && m.some((item) => item.code === saved)) {
        this.form.controls.municipalityCode.setValue(saved);
        return;
      }
      const preferred =
        m.find((x) => x.code === '05001') ||
        m.find((x) => x.isPriority) ||
        m[0];
      if (preferred && departmentCode === '05') {
        this.form.controls.municipalityCode.setValue(preferred.code);
      }
    });
  }

  totalCents() {
    return this.cart.subtotalCents() + (this.shipping()?.feeCents ?? 0);
  }

  openLegal(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.legal.show();
  }

  invalid(
    name:
      | 'customerName'
      | 'customerPhone'
      | 'customerEmail'
      | 'addressLine'
      | 'departmentCode'
      | 'municipalityCode'
      | 'acceptedTerms',
  ) {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  submit() {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Revisa los datos y acepta los términos para continuar.');
      return;
    }
    if (this.cart.items().length === 0) {
      this.error.set('Tu carrito está vacío.');
      return;
    }

    this.submitting.set(true);
    const v = this.form.getRawValue();
    this.api
      .createOrder({
        ...v,
        customerEmail: v.customerEmail || undefined,
        items: this.cart.items().map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        visitorId: this.cart.visitorId,
      })
      .subscribe({
        next: (order) => {
          this.analytics.trackCheckoutComplete(order.orderNumber);
          this.cart.clear();
          this.success.set(order.orderNumber);
          this.submitting.set(false);
          void this.router.navigate(['/pedido-ok'], {
            queryParams: { n: order.orderNumber },
          });
        },
        error: (err) => {
          this.submitting.set(false);
          const msg =
            err?.error?.message ||
            'No pudimos registrar el pedido. Intenta de nuevo.';
          this.error.set(Array.isArray(msg) ? msg.join(' ') : msg);
        },
      });
  }
}
