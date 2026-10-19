import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LegalNoticeService } from '../core/legal-notice.service';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="container grid">
        <div>
          <span class="mark" role="img" aria-label="JyC Bienestar"></span>
          <p class="copy">
            Power Sex Jarabe 500 ml. Entrega discreta y pago contraentrega en Medellín y el Valle de Aburrá.
          </p>
        </div>
        <nav class="links" aria-label="Pie">
          <a routerLink="/" fragment="producto">Producto</a>
          <a routerLink="/" fragment="resenas">Palabras</a>
          <button type="button" (click)="legal.show()">Términos y privacidad</button>
        </nav>
      </div>
      <div class="container legal">© {{ year }} JyC Bienestar · Pago contraentrega</div>
    </footer>
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
        z-index: 1;
        view-transition-name: site-footer;
      }
      .footer {
        margin-top: var(--space-9);
        padding: var(--space-8) 0 calc(var(--space-6) + 5.5rem);
        border-top: 1px solid var(--gold-line);
      }
      @media (min-width: 960px) {
        .footer {
          padding-bottom: var(--space-8);
        }
      }
      .grid {
        display: grid;
        gap: 2.5rem;
      }
      .mark {
        display: block;
        width: min(100%, 8.5rem);
        aspect-ratio: 827 / 570;
        margin-bottom: 1.25rem;
        background: #6e5234;
        -webkit-mask: url('/assets/logo-jyc.png') center / contain no-repeat;
        mask: url('/assets/logo-jyc.png') center / contain no-repeat;
        -webkit-mask-mode: luminance;
        mask-mode: luminance;
      }
      .copy {
        max-width: 24rem;
        color: var(--mist);
        font-size: 0.95rem;
      }
      .links {
        display: flex;
        flex-wrap: wrap;
        align-content: end;
        gap: 0.85rem 1.5rem;
        font-size: 0.72rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--ink-soft);
      }
      .links a:hover,
      .links button:hover {
        color: var(--champagne-deep);
      }
      .links button {
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font: inherit;
        letter-spacing: inherit;
        text-transform: inherit;
      }
      .legal {
        margin-top: 3rem;
        padding-top: 1.25rem;
        border-top: 1px solid var(--gold-line);
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mist);
      }
      @media (min-width: 800px) {
        .grid {
          grid-template-columns: 1.4fr 1fr;
          align-items: end;
        }
        .links {
          justify-content: flex-end;
        }
      }
    `,
  ],
})
export class SiteFooterComponent {
  readonly legal = inject(LegalNoticeService);
  readonly year = new Date().getFullYear();
}
