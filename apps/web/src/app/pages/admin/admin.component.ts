import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CopPipe } from '../../core/money.pipe';
import { Product } from '../../core/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ReactiveFormsModule, CopPipe],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);

  readonly metrics = signal<Record<string, number> | null>(null);
  readonly orders = signal<any[]>([]);
  readonly products = signal<Product[]>([]);
  readonly error = signal<string | null>(null);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['admin@jycbienestar.com', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  ngOnInit() {
    if (this.auth.isLoggedIn()) this.refresh();
  }

  login() {
    this.error.set(null);
    const { email, password } = this.loginForm.getRawValue();
    this.api.login(email, password).subscribe({
      next: (res) => {
        this.auth.setToken(res.accessToken);
        this.refresh();
      },
      error: () => this.error.set('No pudimos iniciar sesión.'),
    });
  }

  logout() {
    this.auth.clear();
    this.metrics.set(null);
    this.orders.set([]);
  }

  refresh() {
    const token = this.auth.token();
    if (!token) return;
    this.api.adminMetrics(token).subscribe((m) => this.metrics.set(m));
    this.api.adminOrders(token).subscribe((o) => this.orders.set(o));
    this.api.adminProducts(token).subscribe((p) => this.products.set(p));
  }

  setStatus(id: string, status: string) {
    const token = this.auth.token();
    if (!token) return;
    this.api.updateOrderStatus(token, id, status).subscribe(() => this.refresh());
  }

  savePrice(product: Product, value: string) {
    const token = this.auth.token();
    if (!token) return;
    const priceCents = Math.round(Number(value) * 100);
    if (Number.isNaN(priceCents)) return;
    this.api
      .updateProduct(token, product.id, { priceCents } as any)
      .subscribe(() => this.refresh());
  }

  saveStock(product: Product, value: string) {
    const token = this.auth.token();
    if (!token) return;
    const stock = Number(value);
    if (Number.isNaN(stock)) return;
    this.api
      .updateProduct(token, product.id, { stock } as any)
      .subscribe(() => this.refresh());
  }
}
