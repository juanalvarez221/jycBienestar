import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { CartService } from '../../core/cart.service';
import { CopPipe } from '../../core/money.pipe';
import { Product } from '../../core/models';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [RouterLink, CopPipe],
  template: `
    @if (product(); as p) {
      <section class="page container">
        <div class="grid">
          <div class="visual">
            <img [src]="p.imageUrl || '/assets/product-placeholder.svg'" [alt]="p.name" />
          </div>
          <div>
            <p class="brand">J&amp;C Bienestar</p>
            <h1>{{ p.name }}</h1>
            <p class="price">{{ p.priceCents | cop }}</p>
            <p class="desc">{{ p.description }}</p>
            <dl>
              <div><dt>Contenido neto</dt><dd>{{ p.netContent }}</dd></div>
              <div><dt>Ingredientes</dt><dd>{{ p.ingredients }}</dd></div>
              <div><dt>Modo de uso</dt><dd>{{ p.usageText }}</dd></div>
              @if (p.manufacturer) {
                <div><dt>Fabricante / titular</dt><dd>{{ p.manufacturer }}</dd></div>
              }
            </dl>
            <div class="actions">
              <button class="btn btn-primary" type="button" (click)="add(p)" [disabled]="p.stock < 1">
                Agregar a la bolsa
              </button>
              <a class="btn btn-ghost" routerLink="/checkout">Ir a pedir</a>
            </div>
          </div>
        </div>
      </section>
    } @else if (!loading()) {
      <section class="page container"><p>Producto no disponible.</p></section>
    }
  `,
  styles: [
    `
      .page { padding: var(--space-7) 0 var(--space-8); }
      .grid { display: grid; gap: 2rem; }
      .visual {
        background: linear-gradient(160deg, var(--petrol), var(--forest));
        border: 1px solid var(--line);
        padding: 1.5rem;
        aspect-ratio: 4/5;
        max-width: 440px;
      }
      .visual img { width: 100%; height: 100%; object-fit: contain; }
      .brand { color: var(--champagne); font-family: var(--font-display); font-size: 1.4rem; margin-bottom: 0.35rem; }
      h1 { font-size: clamp(2rem, 4vw, 2.8rem); margin-bottom: 0.5rem; }
      .price { font-size: 1.4rem; font-weight: 700; margin-bottom: 1rem; color: var(--champagne-bright); }
      .desc { color: var(--mist); margin-bottom: 1.5rem; }
      dl { display: grid; gap: 1rem; margin: 0 0 1.75rem; }
      dt { font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(243,238,228,0.5); }
      dd { margin: 0.25rem 0 0; color: var(--ivory-deep); }
      .actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
      @media (min-width: 900px) { .grid { grid-template-columns: 0.9fr 1.1fr; align-items: start; } }
    `,
  ],
})
export class ProductComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly cart = inject(CartService);

  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    this.api.getProduct(slug).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  add(p: Product) {
    this.cart.add(p, 1);
  }
}
