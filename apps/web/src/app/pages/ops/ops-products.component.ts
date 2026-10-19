import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CopPipe } from '../../core/money.pipe';
import { Product } from '../../core/models';
import { OPS_PATH, isUnauthorized } from './ops-format';

@Component({
  selector: 'app-ops-products',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CopPipe],
  template: `
    <header class="ops-head">
      <div>
        <p class="ops-kicker">Catálogo · Admin</p>
        <h1>Producto publicado</h1>
        <p class="ops-muted">
          Revisa cómo queda en la tienda y ajusta precio, stock o contenido sin salir del panel.
        </p>
      </div>
      @if (mode() !== 'list') {
        <button class="ops-btn quiet" type="button" (click)="backToList()">Volver al listado</button>
      } @else {
        <button class="ops-btn quiet" type="button" (click)="startCreate()">Nuevo producto</button>
      }
    </header>

    @if (error()) {
      <p class="ops-error">{{ error() }}</p>
    }
    @if (ok()) {
      <p class="ops-ok">{{ ok() }}</p>
    }

    @if (loading()) {
      <section class="ops-panel">
        <div class="ops-empty"><span class="ops-skeleton" style="width:14rem"></span></div>
      </section>
    } @else if (mode() === 'list') {
      <section class="ops-panel">
        @if (products().length === 0) {
          <div class="ops-empty">
            <strong>Sin productos</strong>
            <span>Crea el primero para publicarlo en la tienda.</span>
            <button class="ops-btn" type="button" (click)="startCreate()">Crear producto</button>
          </div>
        } @else {
          <div class="ops-table-wrap">
            <table class="ops-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Publicación</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (product of products(); track product.id) {
                  <tr>
                    <td>
                      <div class="ops-product">
                        <img
                          [src]="product.imageUrl || '/assets/power-sex-jarabe-500.png'"
                          [alt]="product.name"
                        />
                        <div>
                          <strong>{{ product.name }}</strong>
                          <span class="ops-muted">{{ product.sku }}</span>
                        </div>
                      </div>
                    </td>
                    <td><strong>{{ product.priceCents | cop }}</strong></td>
                    <td>{{ product.stock }} und.</td>
                    <td>
                      <span
                        class="ops-pill"
                        [attr.data-status]="product.active ? 'ENVIADO' : 'CANCELADO'"
                      >
                        {{ product.active ? 'Publicado' : 'Oculto' }}
                      </span>
                    </td>
                    <td>
                      <div class="ops-actions">
                        <button class="ops-btn" type="button" (click)="openProduct(product)">
                          Ver y editar
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    } @else {
      <div class="ops-catalog">
        <section class="ops-panel ops-preview" aria-label="Vista del producto publicado">
          <div class="ops-panel-head">
            <h2>Vista publicada</h2>
            <span
              class="ops-pill"
              [attr.data-status]="preview().active ? 'ENVIADO' : 'CANCELADO'"
            >
              {{ preview().active ? 'Visible en tienda' : 'Oculto al público' }}
            </span>
          </div>
          <p class="ops-preview-note">
            Previsualización interna del panel. No abre la tienda pública.
          </p>
          <div class="ops-preview-body">
            <img
              class="ops-preview-img"
              [src]="preview().imageUrl || '/assets/power-sex-jarabe-500.png'"
              [alt]="preview().name"
            />
            <div class="ops-preview-copy">
              @if (preview().tagline) {
                <p class="ops-kicker">{{ preview().tagline }}</p>
              }
              <h3>{{ preview().name || 'Sin nombre' }}</h3>
              <p class="ops-preview-price">{{ preview().priceCents | cop }}</p>
              <p class="ops-muted">{{ preview().netContent || '—' }} · {{ preview().stock }} disponibles</p>
              <p class="ops-preview-desc">{{ preview().description || 'Sin descripción.' }}</p>
              <div class="ops-preview-meta">
                <div>
                  <span>Ingredientes</span>
                  <strong>{{ preview().ingredients || '—' }}</strong>
                </div>
                <div>
                  <span>Uso</span>
                  <strong>{{ preview().usageText || '—' }}</strong>
                </div>
                @if (preview().manufacturer) {
                  <div>
                    <span>Fabricante</span>
                    <strong>{{ preview().manufacturer }}</strong>
                  </div>
                }
              </div>
            </div>
          </div>
        </section>

        <section class="ops-panel">
          <div class="ops-panel-head">
            <h2>{{ selected()?.id ? 'Editar ficha' : 'Nuevo producto' }}</h2>
          </div>
          <form class="ops-form ops-grid" [formGroup]="form" (ngSubmit)="save()">
            <div class="ops-field">
              <label for="p-name">Nombre</label>
              <input id="p-name" formControlName="name" (input)="syncPreview()" />
            </div>
            <div class="ops-field">
              <label for="p-sku">SKU</label>
              <input id="p-sku" formControlName="sku" />
            </div>
            <div class="ops-field">
              <label for="p-slug">Slug</label>
              <input id="p-slug" formControlName="slug" />
            </div>
            <div class="ops-field">
              <label for="p-tag">Tagline</label>
              <input id="p-tag" formControlName="tagline" (input)="syncPreview()" />
            </div>
            <div class="ops-field">
              <label for="p-price">Precio (pesos)</label>
              <input
                id="p-price"
                type="number"
                min="0"
                formControlName="pricePesos"
                (input)="syncPreview()"
              />
            </div>
            <div class="ops-field">
              <label for="p-stock">Disponibles</label>
              <input
                id="p-stock"
                type="number"
                min="0"
                formControlName="stock"
                (input)="syncPreview()"
              />
            </div>
            <div class="ops-field">
              <label for="p-net">Contenido neto</label>
              <input id="p-net" formControlName="netContent" (input)="syncPreview()" />
            </div>
            <div class="ops-field">
              <label for="p-man">Fabricante</label>
              <input id="p-man" formControlName="manufacturer" (input)="syncPreview()" />
            </div>
            <div class="ops-field">
              <label for="p-img">URL imagen</label>
              <input id="p-img" formControlName="imageUrl" (input)="syncPreview()" />
            </div>
            <div class="ops-field">
              <label for="p-active">Publicación</label>
              <select id="p-active" formControlName="active" (change)="syncPreview()">
                <option [ngValue]="true">Publicado en tienda</option>
                <option [ngValue]="false">Oculto</option>
              </select>
            </div>
            <div class="ops-field" style="grid-column:1/-1">
              <label for="p-desc">Descripción</label>
              <textarea id="p-desc" formControlName="description" (input)="syncPreview()"></textarea>
            </div>
            <div class="ops-field" style="grid-column:1/-1">
              <label for="p-ing">Ingredientes</label>
              <textarea id="p-ing" formControlName="ingredients" (input)="syncPreview()"></textarea>
            </div>
            <div class="ops-field" style="grid-column:1/-1">
              <label for="p-use">Uso</label>
              <textarea id="p-use" formControlName="usageText" (input)="syncPreview()"></textarea>
            </div>
            <div class="ops-actions" style="grid-column:1/-1">
              <button class="ops-btn" type="submit" [disabled]="form.invalid || saving()">
                {{ saving() ? 'Guardando…' : 'Guardar cambios' }}
              </button>
              <button class="ops-btn quiet" type="button" (click)="backToList()">Cancelar</button>
              @if (selected()?.id) {
                <button class="ops-btn danger" type="button" (click)="remove(selected()!)">
                  Eliminar
                </button>
              }
            </div>
          </form>
        </section>
      </div>
    }
  `,
})
export class OpsProductsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly path = OPS_PATH;

  readonly products = signal<Product[]>([]);
  readonly selected = signal<Product | null>(null);
  readonly mode = signal<'list' | 'detail'>('list');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly ok = signal<string | null>(null);
  readonly preview = signal<Product>(this.emptyPreview());

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    sku: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', [Validators.required, Validators.minLength(2)]],
    tagline: [''],
    pricePesos: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    netContent: ['', Validators.required],
    manufacturer: [''],
    imageUrl: [''],
    active: [true as boolean],
    description: ['', [Validators.required, Validators.minLength(10)]],
    ingredients: ['', Validators.required],
    usageText: ['', Validators.required],
  });

  ngOnInit() {
    this.load();
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.mode.set('list');
        this.selected.set(null);
        return;
      }
      const found = this.products().find((p) => p.id === id);
      if (found) this.openProduct(found, false);
    });
  }

  load() {
    const token = this.auth.token();
    if (!token) return;
    this.loading.set(true);
    this.api.adminProducts(token).subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
          const found = products.find((p) => p.id === id);
          if (found) this.openProduct(found, false);
          else {
            this.error.set('Producto no encontrado en el catálogo admin.');
            this.backToList();
          }
        }
      },
      error: (error) => {
        this.loading.set(false);
        this.fail(error);
      },
    });
  }

  openProduct(product: Product, navigate = true) {
    this.selected.set(product);
    this.mode.set('detail');
    this.ok.set(null);
    this.form.patchValue({
      name: product.name,
      sku: product.sku,
      slug: product.slug,
      tagline: product.tagline ?? '',
      pricePesos: product.priceCents / 100,
      stock: product.stock,
      netContent: product.netContent,
      manufacturer: product.manufacturer ?? '',
      imageUrl: product.imageUrl ?? '',
      active: product.active ?? true,
      description: product.description,
      ingredients: product.ingredients,
      usageText: product.usageText,
    });
    this.syncPreview();
    if (navigate) {
      void this.router.navigate(['/', this.path, 'productos', product.id], {
        replaceUrl: false,
      });
    }
  }

  startCreate() {
    this.selected.set(null);
    this.mode.set('detail');
    this.ok.set(null);
    this.form.reset({
      name: '',
      sku: '',
      slug: '',
      tagline: '',
      pricePesos: 0,
      stock: 0,
      netContent: '',
      manufacturer: '',
      imageUrl: '',
      active: true,
      description: '',
      ingredients: '',
      usageText: '',
    });
    this.syncPreview();
    void this.router.navigate(['/', this.path, 'productos']);
  }

  backToList() {
    this.mode.set('list');
    this.selected.set(null);
    this.ok.set(null);
    void this.router.navigate(['/', this.path, 'productos']);
  }

  syncPreview() {
    const value = this.form.getRawValue();
    this.preview.set({
      id: this.selected()?.id ?? 'preview',
      name: value.name.trim() || 'Sin nombre',
      sku: value.sku.trim(),
      slug: value.slug.trim(),
      tagline: value.tagline.trim() || null,
      description: value.description.trim(),
      netContent: value.netContent.trim(),
      ingredients: value.ingredients.trim(),
      usageText: value.usageText.trim(),
      manufacturer: value.manufacturer.trim() || null,
      imageUrl: value.imageUrl.trim() || null,
      priceCents: Math.round(Number(value.pricePesos || 0) * 100),
      stock: Math.round(Number(value.stock || 0)),
      active: value.active === true || (value.active as unknown) === 'true',
    });
  }

  save() {
    const token = this.auth.token();
    if (!token || this.form.invalid) return;
    const value = this.form.getRawValue();
    const payload = {
      name: value.name.trim(),
      sku: value.sku.trim(),
      slug: value.slug.trim(),
      tagline: value.tagline.trim() || undefined,
      priceCents: Math.round(Number(value.pricePesos) * 100),
      stock: Math.round(Number(value.stock)),
      netContent: value.netContent.trim(),
      manufacturer: value.manufacturer.trim() || undefined,
      imageUrl: value.imageUrl.trim() || undefined,
      active: value.active === true || (value.active as unknown) === 'true',
      description: value.description.trim(),
      ingredients: value.ingredients.trim(),
      usageText: value.usageText.trim(),
    };
    this.saving.set(true);
    this.error.set(null);
    const current = this.selected();
    const req = current
      ? this.api.updateProduct(token, current.id, payload)
      : this.api.createProduct(token, payload);
    req.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.ok.set('Cambios guardados en el catálogo admin.');
        this.products.update((list) => {
          const rest = list.filter((p) => p.id !== saved.id);
          return [saved, ...rest];
        });
        this.openProduct(saved, true);
      },
      error: (error) => {
        this.saving.set(false);
        this.fail(error, 'No se pudo guardar el producto.');
      },
    });
  }

  remove(product: Product) {
    const token = this.auth.token();
    if (!token) return;
    if (!confirm(`¿Eliminar “${product.name}”? Si tiene pedidos, solo se ocultará.`)) return;
    this.api.deleteProduct(token, product.id).subscribe({
      next: (res) => {
        this.ok.set(
          res.softDeleted
            ? 'Producto ocultado (tenía pedidos).'
            : 'Producto eliminado del catálogo.',
        );
        this.backToList();
        this.load();
      },
      error: (error) => this.fail(error, 'No se pudo eliminar.'),
    });
  }

  private emptyPreview(): Product {
    return {
      id: 'preview',
      name: '',
      sku: '',
      slug: '',
      description: '',
      netContent: '',
      ingredients: '',
      usageText: '',
      priceCents: 0,
      stock: 0,
      active: true,
    };
  }

  private fail(error: unknown, message = 'No se pudo cargar el catálogo admin.') {
    if (isUnauthorized(error)) this.auth.clear();
    else this.error.set(message);
  }
}
