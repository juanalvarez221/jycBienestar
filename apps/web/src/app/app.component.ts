import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../environments/environment';
import { AnalyticsService } from './core/analytics.service';
import { BlurFieldComponent } from './layout/blur-field.component';
import { CookieNoticeComponent } from './layout/cookie-notice.component';
import { LegalDialogComponent } from './layout/legal-dialog.component';
import { SiteFooterComponent } from './layout/site-footer.component';
import { SiteHeaderComponent } from './layout/site-header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    SiteHeaderComponent,
    SiteFooterComponent,
    BlurFieldComponent,
    LegalDialogComponent,
    CookieNoticeComponent,
  ],
  template: `
    <div class="stage" [class.is-studio]="!storefront()">
      @if (storefront()) {
        <app-site-header />
      }
      <main class="stage-main" [class.studio]="!storefront()">
        @if (storefront()) {
          <app-blur-field />
        }
        <router-outlet />
      </main>
      @if (storefront()) {
        <app-site-footer />
        <app-legal-dialog />
        <app-cookie-notice />
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }
      .stage {
        min-height: 100vh;
      }
      .stage-main {
        position: relative;
        z-index: 0;
        isolation: isolate;
        min-height: calc(100vh - var(--header-h));
        padding-top: var(--header-h);
        view-transition-name: page;
      }
      .stage-main.studio {
        min-height: 100vh;
        padding-top: 0;
        view-transition-name: none;
      }
    `,
  ],
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);
  readonly storefront = signal(this.isStore(this.router.url));

  constructor() {
    this.analytics.start();
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.storefront.set(this.isStore(event.urlAfterRedirects)));
  }

  private isStore(url: string) {
    const path = url.split('?')[0].split('#')[0];
    const base = `/${environment.opsPath}`;
    return path !== base && !path.startsWith(`${base}/`);
  }
}
