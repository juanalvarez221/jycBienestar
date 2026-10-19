import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-qty',
  standalone: true,
  template: `
    <div class="qty" role="group" [attr.aria-label]="label()">
      <button type="button" (click)="bump(-1)" [disabled]="value() <= min()" aria-label="Quitar unidad">
        −
      </button>
      <span>{{ value() }}</span>
      <button type="button" (click)="bump(1)" [disabled]="value() >= max()" aria-label="Añadir unidad">
        +
      </button>
    </div>
  `,
  styles: [
    `
      .qty {
        display: inline-flex;
        align-items: center;
        border: 1px solid rgba(143, 115, 78, 0.28);
        background: rgba(255, 253, 249, 0.92);
      }
      button,
      span {
        min-width: 2.4rem;
        min-height: 2.4rem;
        display: grid;
        place-items: center;
      }
      button {
        border: 0;
        background: transparent;
        color: var(--ink);
        cursor: pointer;
        font-size: 1.05rem;
      }
      button:disabled {
        opacity: 0.28;
        cursor: not-allowed;
      }
      span {
        min-width: 1.8rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }
    `,
  ],
})
export class QtyComponent {
  readonly value = input.required<number>();
  readonly min = input(1);
  readonly max = input(20);
  readonly label = input('Cantidad');
  readonly changed = output<number>();

  bump(delta: number) {
    const next = Math.min(this.max(), Math.max(this.min(), this.value() + delta));
    if (next !== this.value()) this.changed.emit(next);
  }
}
