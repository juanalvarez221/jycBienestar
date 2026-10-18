import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="container grid">
        <div>
          <p class="mark">J&amp;C Bienestar</p>
          <p class="copy">
            Bienestar masculino con entrega discreta en Medellín y el Valle de Aburrá.
          </p>
        </div>
        <div class="links">
          <a routerLink="/producto/power-sex-jarabe-500ml">Producto</a>
          <a routerLink="/terminos">Términos</a>
          <a routerLink="/privacidad">Privacidad</a>
          <a routerLink="/admin">Admin</a>
        </div>
      </div>
      <div class="container legal">
        © {{ year }} J&amp;C Bienestar · Pago contraentrega
      </div>
    </footer>
  `,
  styles: [
    `
      .footer {
        margin-top: var(--space-9);
        padding: var(--space-8) 0 var(--space-6);
        border-top: 1px solid var(--line);
        background: linear-gradient(180deg, transparent, rgba(15, 42, 31, 0.55));
      }
      .grid {
        display: grid;
        gap: 1.5rem;
      }
      .mark {
        font-family: var(--font-display);
        font-size: 1.8rem;
        color: var(--champagne);
        margin-bottom: 0.5rem;
      }
      .copy {
        max-width: 28rem;
        color: var(--mist);
      }
      .links {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem 1.5rem;
        color: var(--ivory-deep);
        font-size: 0.92rem;
      }
      .links a:hover {
        color: var(--champagne);
      }
      .legal {
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(243, 238, 228, 0.08);
        font-size: 0.8rem;
        color: rgba(243, 238, 228, 0.55);
      }
      @media (min-width: 800px) {
        .grid {
          grid-template-columns: 1.4fr 1fr;
          align-items: end;
        }
      }
    `,
  ],
})
export class SiteFooterComponent {
  readonly year = new Date().getFullYear();
}
