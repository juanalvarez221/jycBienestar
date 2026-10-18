import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { CartService } from '../../core/cart.service';
import { CopPipe } from '../../core/money.pipe';
import { Product } from '../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CopPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly cart = inject(CartService);

  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);

  ngOnInit() {
    this.api.getProduct('power-sex-jarabe-500ml').subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  addToCart() {
    const p = this.product();
    if (p) this.cart.add(p, 1);
  }
}
