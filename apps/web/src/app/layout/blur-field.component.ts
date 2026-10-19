import { Component } from '@angular/core';

@Component({
  selector: 'app-blur-field',
  standalone: true,
  template: `
    <div class="blur-field" aria-hidden="true">
      <span class="orb orb-a"></span>
      <span class="orb orb-b"></span>
      <span class="orb orb-c"></span>
      <span class="veil"></span>
    </div>
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        z-index: -1;
        overflow: hidden;
        pointer-events: none;
      }
    `,
  ],
})
export class BlurFieldComponent {}
