import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { CartService } from '../../core/cart.service';
import { CopPipe } from '../../core/money.pipe';
import { Department, Municipality, ShippingQuote } from '../../core/models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CopPipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
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
    if (this.cart.items().length === 0) {
      this.api.getProduct('power-sex-jarabe-500ml').subscribe((p) => {
        if (this.cart.items().length === 0) this.cart.add(p, 1);
      });
    }

    this.api.getDepartments().subscribe((d) => this.departments.set(d));
    this.loadMunicipalities('05');

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

  private loadMunicipalities(departmentCode: string) {
    this.api.getMunicipalities(departmentCode).subscribe((m) => {
      this.municipalities.set(m);
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

  submit() {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Revisa los datos y acepta los términos para continuar.');
      return;
    }
    if (this.cart.items().length === 0) {
      this.error.set('Tu bolsa está vacía.');
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
      })
      .subscribe({
        next: (order) => {
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
