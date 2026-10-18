import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page container">
      <p class="eyebrow">Pedido recibido</p>
      <h1>Listo, {{ orderNumber || 'tu pedido' }} va en camino a gestión.</h1>
      <p>
        Te contactaremos al celular para coordinar la entrega discreta.
        Pagas contraentrega al recibir.
      </p>
      <a class="btn btn-primary" routerLink="/">Volver al inicio</a>
    </section>
  `,
  styles: [
    `
      .page { padding: var(--space-9) 0; max-width: 36rem; }
      .eyebrow { color: var(--champagne); letter-spacing: 0.14em; text-transform: uppercase; font-size: 0.75rem; }
      h1 { font-size: clamp(2rem, 4vw, 2.8rem); margin: 0.75rem 0 1rem; }
      p { color: var(--mist); margin-bottom: 1.5rem; }
    `,
  ],
})
export class OrderSuccessComponent {
  readonly orderNumber =
    inject(ActivatedRoute).snapshot.queryParamMap.get('n') || '';
}
