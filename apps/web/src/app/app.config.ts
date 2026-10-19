import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { ActivatedRouteSnapshot, provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ transition, from, to }) => {
          const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (reduce || routeKey(from) === routeKey(to)) transition.skipTransition();
        },
      }),
    ),
    provideHttpClient(),
  ],
};

function routeKey(snapshot: ActivatedRouteSnapshot) {
  return snapshot.pathFromRoot
    .flatMap((route) => route.url)
    .map((segment) => segment.path)
    .join('/');
}
