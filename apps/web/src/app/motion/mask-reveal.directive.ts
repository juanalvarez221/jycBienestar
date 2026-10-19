import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';

@Directive({
  selector: '[appMaskReveal]',
  standalone: true,
  host: { class: 'reveal' },
})
export class MaskRevealDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  constructor() {
    if (
      typeof window === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      this.el.nativeElement.classList.add('is-revealed');
    }
  }

  ngAfterViewInit() {
    if (this.el.nativeElement.classList.contains('is-revealed')) return;
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        this.el.nativeElement.classList.add('is-revealed');
        this.observer?.disconnect();
      },
      { threshold: 0.35, rootMargin: '0px 0px -8% 0px' },
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
