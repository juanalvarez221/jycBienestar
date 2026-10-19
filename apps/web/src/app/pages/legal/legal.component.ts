import { Component, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-legal',
  standalone: true,
  template: `
    <section class="page container">
      <article class="content" [innerHTML]="html()"></article>
    </section>
  `,
  styles: [
    `
      .page { padding: var(--space-7) 0 var(--space-8); }
      .content { max-width: 42rem; color: var(--mist); }
      :host ::ng-deep h1 {
        color: var(--ivory);
        font-size: 2.4rem;
        margin-bottom: 1rem;
      }
      :host ::ng-deep h2 {
        color: var(--champagne-bright);
        font-size: 1.4rem;
        margin: 1.5rem 0 0.5rem;
      }
      :host ::ng-deep p,
      :host ::ng-deep li { margin-bottom: 0.75rem; }
    `,
  ],
})
export class LegalComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  readonly html = signal<SafeHtml>('');

  ngOnInit() {
    const kind = this.route.snapshot.data['kind'] as 'terms' | 'privacy';
    this.api.getSiteConfig().subscribe((c) => {
      const raw = kind === 'privacy' ? c.privacyHtml : c.termsHtml;
      this.html.set(this.sanitizer.bypassSecurityTrustHtml(raw));
    });
  }
}
