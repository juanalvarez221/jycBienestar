import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LegalNoticeService {
  readonly open = signal(false);

  show() {
    this.open.set(true);
    document.documentElement.style.overflow = 'hidden';
  }

  hide() {
    this.open.set(false);
    document.documentElement.style.overflow = '';
  }
}
