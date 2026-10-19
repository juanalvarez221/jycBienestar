import { Component, inject, signal } from '@angular/core';
import { LegalNoticeService } from '../core/legal-notice.service';

const KEY = 'jyc_cookie_ok_v1';

@Component({
  selector: 'app-cookie-notice',
  standalone: true,
  template: `
    @if (visible()) {
      <div class="veil" role="presentation"></div>
      <div
        class="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-title"
      >
        <p class="eyebrow">Aviso de privacidad</p>
        <h2 id="cookie-title">Usamos cookies para que el sitio funcione</h2>
        <p>
          Guardamos en tu dispositivo lo mínimo para recordar el carrito, las unidades que elegiste
          y que ya viste este aviso. Así el pedido no se pierde si cierras la página. También
          usamos datos técnicos del navegador para que la tienda cargue bien.
        </p>
        <p>
          No vendemos tu información. El tratamiento se rige por la Ley 1581 de 2012. Al continuar,
          aceptas este uso. El detalle está en los términos y la privacidad.
        </p>
        <div class="actions">
          <button class="btn btn-ghost" type="button" (click)="openLegal()">Leer el aviso</button>
          <button class="btn btn-primary" type="button" (click)="accept()">Aceptar y continuar</button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .veil {
        position: fixed;
        inset: 0;
        z-index: 90;
        background: rgba(28, 25, 22, 0.5);
        backdrop-filter: blur(10px);
      }
      .panel {
        position: fixed;
        z-index: 91;
        right: 1rem;
        bottom: calc(1rem + env(safe-area-inset-bottom));
        left: 1rem;
        width: min(34rem, calc(100% - 2rem));
        margin-inline: auto;
        padding: 1.35rem 1.25rem 1.2rem;
        border: 1px solid rgba(143, 115, 78, 0.24);
        background: linear-gradient(180deg, #fffdf9, #f4ece1);
        box-shadow: 0 28px 70px rgba(28, 25, 22, 0.24);
      }
      .eyebrow {
        margin-bottom: 0.45rem;
        color: var(--champagne-deep);
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      h2 {
        margin-bottom: 0.7rem;
        font-size: clamp(1.55rem, 4vw, 2rem);
        line-height: 1.05;
      }
      p {
        color: var(--ink-soft);
        font-size: 0.95rem;
        line-height: 1.55;
      }
      p + p {
        margin-top: 0.65rem;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
        margin-top: 1.15rem;
      }
      .actions .btn {
        flex: 1 1 10rem;
      }
    `,
  ],
})
export class CookieNoticeComponent {
  private readonly legal = inject(LegalNoticeService);
  readonly visible = signal(this.needsConsent());

  private needsConsent() {
    try {
      return !localStorage.getItem(KEY);
    } catch {
      return true;
    }
  }

  accept() {
    try {
      localStorage.setItem(KEY, new Date().toISOString());
    } catch {
      /* private mode */
    }
    this.visible.set(false);
  }

  openLegal() {
    this.legal.show();
  }
}
