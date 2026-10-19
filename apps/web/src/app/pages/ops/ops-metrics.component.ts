import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CopPipe } from '../../core/money.pipe';
import { OpsMetrics } from '../../core/models';
import { OPS_PATH, formatWhen, isUnauthorized } from './ops-format';

@Component({
  selector: 'app-ops-metrics',
  standalone: true,
  imports: [RouterLink, CopPipe],
  template: `
    <header class="ops-head">
      <div>
        <p class="ops-kicker">Inteligencia</p>
        <h1>Métricas</h1>
        <p class="ops-muted">
          Pedidos, carritos abandonados, clics y zonas calientes de la tienda.
        </p>
      </div>
      <button class="ops-btn quiet" type="button" (click)="load()">Actualizar</button>
    </header>

    @if (error()) {
      <p class="ops-error">{{ error() }}</p>
    }

    @if (loading()) {
      <section class="ops-panel">
        <div class="ops-empty"><span class="ops-skeleton" style="width:12rem"></span></div>
      </section>
    } @else {
      @if (metrics(); as m) {
      <section class="ops-stats">
        <article class="ops-stat">
          <span>Por atender</span>
          <strong>{{ m.porAtender }}</strong>
        </article>
        <article class="ops-stat">
          <span>Ingresos</span>
          <strong>{{ m.ingresosCentavos | cop }}</strong>
        </article>
        <article class="ops-stat">
          <span>Carritos abiertos</span>
          <strong>{{ m.carritosAbandonados ?? 0 }}</strong>
        </article>
        <article class="ops-stat">
          <span>Valor abandonado</span>
          <strong>{{ (m.valorCarritosAbandonadosCentavos ?? 0) | cop }}</strong>
        </article>
        <article class="ops-stat">
          <span>Visitantes 7d</span>
          <strong>{{ m.visitantes7d ?? 0 }}</strong>
        </article>
        <article class="ops-stat">
          <span>Vistas 7d</span>
          <strong>{{ m.vistas7d ?? 0 }}</strong>
        </article>
        <article class="ops-stat">
          <span>Clics 7d</span>
          <strong>{{ m.clics7d ?? 0 }}</strong>
        </article>
        <article class="ops-stat">
          <span>Clientes</span>
          <strong>{{ m.clientes }}</strong>
        </article>
      </section>

      <div class="ops-split ops-metrics-grid">
        <section class="ops-panel">
          <h2>Mapa de clics (últimos 30 días)</h2>
          <p class="ops-muted">Intensidad relativa sobre el viewport. Más oscuro = más interacción.</p>
          <div class="ops-heat" aria-label="Mapa de calor de clics">
            @for (cell of m.mapaClics ?? []; track cell.x + '-' + cell.y) {
              <span
                [style.opacity]="0.12 + (cell.intensity / 100) * 0.88"
                [title]="cell.count + ' clics'"
              ></span>
            }
          </div>
        </section>

        <section class="ops-panel">
          <h2>Dónde hacen clic</h2>
          @if (!(m.topClics?.length)) {
            <p class="ops-muted">Aún no hay clics registrados. Navega la tienda para generar datos.</p>
          } @else {
            @for (row of m.topClics; track row.label) {
              <div class="ops-meter">
                <div>
                  <strong>{{ row.label }}</strong>
                  <span class="ops-muted">{{ row.count }} clics</span>
                </div>
                <div class="ops-bar"><i [style.width.%]="bar(row.count, m.topClics![0].count)"></i></div>
              </div>
            }
          }
        </section>

        <section class="ops-panel">
          <h2>Páginas más vistas</h2>
          @for (row of m.topPaginas ?? []; track row.label) {
            <div class="ops-meter">
              <div>
                <strong>{{ row.label || '/' }}</strong>
                <span class="ops-muted">{{ row.count }} vistas</span>
              </div>
              <div class="ops-bar"><i [style.width.%]="bar(row.count, m.topPaginas![0].count)"></i></div>
            </div>
          } @empty {
            <p class="ops-muted">Sin vistas aún.</p>
          }
        </section>

        <section class="ops-panel">
          <h2>Ubicaciones reportadas</h2>
          @for (row of m.topUbicaciones ?? []; track row.label) {
            <div class="ops-row ops-row-compact">
              <strong>{{ row.label }}</strong>
              <span>{{ row.count }}</span>
            </div>
          } @empty {
            <p class="ops-muted">Sin dato de ubicación del navegador todavía.</p>
          }
        </section>

        <section class="ops-panel">
          <h2>Pedidos por municipio</h2>
          @for (row of m.pedidosPorMunicipio ?? []; track row.name) {
            <div class="ops-row ops-row-compact">
              <div>
                <strong>{{ row.name }}</strong>
                <span class="ops-muted">{{ row.department }}</span>
              </div>
              <span>{{ row.orders }}</span>
              <strong>{{ row.revenueCents | cop }}</strong>
            </div>
          } @empty {
            <p class="ops-muted">Todavía no hay pedidos geolocalizados.</p>
          }
        </section>

        <section class="ops-panel">
          <h2>Carritos abandonados</h2>
          @for (cart of m.carritos ?? []; track cart.id) {
            <div class="ops-row ops-row-compact">
              <div>
                <strong>{{ cart.customerName || 'Visitante anónimo' }}</strong>
                <span class="ops-muted">{{ formatWhen(cart.updatedAt) }}</span>
              </div>
              <span>{{ cart.customerPhone || '—' }}</span>
              <strong>{{ cart.subtotalCents | cop }}</strong>
            </div>
          } @empty {
            <p class="ops-muted">No hay carritos abiertos con valor.</p>
          }
          <a class="ops-back" [routerLink]="['/', path, 'carritos']">Ver todos los carritos</a>
        </section>
      </div>

      <section class="ops-panel" style="margin-top:0.85rem">
        <h2>Actividad reciente</h2>
        @for (ev of m.eventosRecientes ?? []; track ev.id) {
          <div class="ops-row ops-row-compact">
            <div>
              <strong>{{ ev.type }}</strong>
              <span class="ops-muted">{{ ev.path }} · {{ ev.label || '—' }}</span>
            </div>
            <span class="ops-muted">{{ formatWhen(ev.createdAt) }}</span>
          </div>
        } @empty {
          <p class="ops-muted">Sin eventos todavía.</p>
        }
      </section>
      }
    }
  `,
})
export class OpsMetricsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  readonly path = OPS_PATH;
  readonly formatWhen = formatWhen;

  readonly metrics = signal<OpsMetrics | null>(null);
  readonly error = signal<string | null>(null);
  readonly loading = signal(true);

  ngOnInit() {
    this.load();
  }

  load() {
    const token = this.auth.token();
    if (!token) return;
    this.loading.set(true);
    this.api.adminMetrics(token).subscribe({
      next: (metrics) => {
        this.metrics.set(metrics);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        if (isUnauthorized(error)) this.auth.clear();
        else this.error.set('No se pudieron cargar las métricas.');
      },
    });
  }

  bar(value: number, max: number) {
    return max ? Math.max(8, Math.round((value / max) * 100)) : 0;
  }
}
