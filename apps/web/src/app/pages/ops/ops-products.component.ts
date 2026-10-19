import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CopPipe } from '../../core/money.pipe';
import { Product } from '../../core/models';
import { isUnauthorized } from './ops-format';

@Component({
  selector: 'app-ops-products',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CopPipe],
  template: `
    <header class="ops-head">
      <div>
        <p class="ops-kicker">Catálogo</p>
        <h1>Productos</h1>
        <p class="ops-muted">Crea, edita o elimina cualquier producto de la tienda.</p>
      </div>
      <button class="ops-btn" type="button" (click)="startCreate()">Nuevo producto</button>
    </header>

    @if (error()) { <p class="ops-error">{{ error() }}</p> }
    @if (ok()) { <p class="ops-ok">{{ ok() }}</p> }

    @if (editing()) {
      <section class="ops-panel" style="margin-bottom:1rem">
        <h2>{{ selected()?.id ? 'Editar producto' : 'Nuevo producto' }}</h2>
        <form class="ops-form ops-grid" [formGroup]="form" (ngSubmit)="save()">
          <div class="ops-field"><label>Nombre</label><input formControlName="name" /></div>
          <div class="ops-field"><label>SKU</label><input formControlName="sku" /></div>
          <div class="ops-field"><label>Slug</label><input formControlName="slug" /></div>
          <div class="ops-field"><label>Tagline</label><input formControlName="tagline" /></div>
          <div class="ops-field"><label>Precio (pesos)</label><input type="number" min="0" formControlName="pricePesos" /></div>
          <div class="ops-field"><label>Disponibles</label><input type="number" min="0" formControlName="stock" /></div>
          <div class="ops-field"><label>Contenido neto</label><input formControlName="netContent" /></div>
          <div class="ops-field"><label>Fabricante</label><input formControlName="manufacturer" /></div>
          <div class="ops-field"><label>URL imagen</label><input formControlName="imageUrl" /></div>
          <div class="ops-field">
            <label>Activo en tienda</label>
            <select formControlName="active">
              <option [ngValue]="true">Sí</option>
              <option [ngValue]="false">No</option>
            </select>
          </div>
          <div class="ops-field" style="grid-column:1/-1"><label>Descripción</label><textarea formControlName="description"></textarea></div>
          <div class="ops-field" style="grid-column:1/-1"><label>Ingredientes</label><textarea formControlName="ingredients"></textarea></div>
          <div class="ops-field" style="grid-column:1/-1"><label>Uso</label><textarea formControlName="usageText"></textarea></div>
          <div class="ops-actions">
            <button class="ops-btn" type="submit" [disabled]="form.invalid || saving()">Guardar</button>
            <button class="ops-btn quiet" type="button" (click)="cancelEdit()">Cancelar</button>
          </div>
        </form>
      </section>
    }

    <section class="ops-panel">
      @if (products().length === 0) {
        <div class="ops-empty">
          <strong>Sin productos</strong>
          <span>Crea el primero con el botón superior.</span>
        </div>
      } @else {
        <div class="ops-table-wrap">
          <table class="ops-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (product of products(); track product.id) {
                <tr>
                  <td>
                    <div class="ops-product">
                      <img [src]="product.imageUrl || '/assets/power-sex-jarabe-500.png'" [alt]="product.name" />
                      <div>
                        <strong>{{ product.name }}</strong>
                        <span class="ops-muted">{{ product.sku }}</span>
                      </div>
                    </div>
                  </td>
                  <td><strong>{{ product.priceCents | cop }}</strong></td>
                  <td>{{ product.stock }} und.</td>
                  <td>
                    <span class="ops-pill" [attr.data-status]="product.active ? 'ENVIADO' : 'CANCELADO'">
                      {{ product.active ? 'Activo' : 'Oculto' }}
                    </span>
                  </td>
                  <td>
                    <div class="ops-actions">
                      <button class="ops-btn quiet" type="button" (click)="edit(product)">Editar</button>
                      <button class="ops-btn danger" type="button" (click)="remove(product)">Eliminar</button>
                    </div>
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
export class OpsProductsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly products = signal<Product[]>([]);
  readonly selected = signal<Product | null>(null);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly ok = signal<string | null>(null);

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
    active: [true],
    description: ['', [Validators.required, Validators.minLength(10)]],
    ingredients: ['', Validators.required],
    usageText: ['', Validators.required],
  });

  ngOnInit() {
    this.load();
  }

  load() {
    const token = this.auth.token();
    if (!token) return;
    this.api.adminProducts(token).subscribe({
      next: (products) => this.products.set(products),
      error: (error) => this.fail(error),
    });
  }

  startCreate() {
    this.selected.set(null);
    this.editing.set(true);
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
  }

  edit(product: Product) {
    this.selected.set(product);
    this.editing.set(true);
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
      active: product.active,
      description: product.description,
      ingredients: product.ingredients,
      usageText: product.usageText,
    });
  }

  cancelEdit() {
    this.editing.set(false);
    this.selected.set(null);
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
      next: () => {
        this.saving.set(false);
        this.ok.set('Producto guardado.');
        this.cancelEdit();
        this.load();
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
    if (!confirm(`¿Eliminar “${product.name}”? Si tiene pedidos, se ocultará.`)) return;
    this.api.deleteProduct(token, product.id).subscribe({
      next: (res) => {
        this.ok.set(res.softDeleted ? 'Producto ocultado (tenía pedidos).' : 'Producto eliminado.');
        this.load();
      },
      error: (error) => this.fail(error, 'No se pudo eliminar.'),
    });
  }

  private fail(error: unknown, message = 'No se pudo cargar el catálogo.') {
    if (isUnauthorized(error)) this.auth.clear();
    else this.error.set(message);
  }
}
