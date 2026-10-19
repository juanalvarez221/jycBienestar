import { NgTemplateOutlet } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AnalyticsService } from '../../core/analytics.service';
import { ApiService } from '../../core/api.service';
import { CartService } from '../../core/cart.service';
import { CopPipe } from '../../core/money.pipe';
import { Product } from '../../core/models';
import { QtyComponent } from '../../ui/qty.component';

interface Review {
  name: string;
  place: string;
  stars: number;
  text: string;
  photo?: string;
}

type NoteMotion = 'flutter' | 'lift' | 'drift' | 'tumble';

interface WallNote {
  place: number;
  reviewIndex: number;
  key: number;
  tilt: string;
  tape: string;
  motion: NoteMotion;
  leaving: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CopPipe, NgTemplateOutlet, QtyComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly cart = inject(CartService);
  private readonly analytics = inject(AnalyticsService);
  private readonly router = inject(Router);
  private readonly loupe =
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
      .matches;

  readonly product = signal<Product | null>(null);
  readonly quantity = signal(1);
  readonly askOpen = signal<number | null>(0);
  private askPinned: number | null = 0;
  readonly title = computed(() => this.product()?.name || 'Power Sex Jarabe 500 ml');
  readonly titleWords = computed(() => this.title().split(/\s+/).filter(Boolean));
  readonly starSlots = [1, 2, 3, 4, 5];
  readonly whatsappHref =
    'https://wa.me/573156841671?text=' +
    encodeURIComponent('Hola, quiero pedir Power Sex Jarabe 500 ml.');
  readonly motionOk =
    typeof window === 'undefined' ||
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly wallWide =
    typeof window === 'undefined' ? null : window.matchMedia('(min-width: 1000px)');
  private readonly slotCount = signal(this.wallWide?.matches ? 6 : 4);
  readonly wallNotes = signal<WallNote[]>([]);
  @ViewChild('wallStage') private wallStage?: ElementRef<HTMLElement>;
  private swapTimers: number[] = [];
  private cycleTimer = 0;
  private noteKey = 0;
  private swapping = false;
  private wallInView = false;
  private wallObserver: IntersectionObserver | null = null;
  private readonly dwellMs = 3000;
  private readonly swapMs = 620;
  private readonly staggerMs = 85;
  private readonly motions: NoteMotion[] = ['flutter', 'lift', 'drift', 'tumble'];
  private readonly tilts = [-1.6, 1.4, -1.1, 1.25, -1.45, 0.95];
  private readonly tapes = [-3, 2.5, -2, 3, -2.5, 1.5];
  private readonly avatarPalette = [
    '#1a73e8',
    '#188038',
    '#e37400',
    '#9334e6',
    '#c5221f',
    '#1967d2',
    '#0d7377',
    '#b06000',
  ];

  initials(name: string) {
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
    return (first + last).toUpperCase();
  }

  avatarColor(name: string) {
    const index = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return this.avatarPalette[index % this.avatarPalette.length];
  }

  readonly reviews: Review[] = [
    {
      name: 'Juan Esteban Gómez',
      place: 'Laureles',
      stars: 5,
      photo: '/assets/reviews/p13.jpg',
      text: 'Pedí por WhatsApp y me respondieron enseguida. Llegó al día siguiente, bien empacado. Se nota la diferencia en el ánimo; por eso volví a escribirles.',
    },
    {
      name: 'Brayan Estiven Cano',
      place: 'Bello',
      stars: 5,
      photo: '/assets/reviews/p01.jpg',
      text: 'Pedí en la noche y al otro día ya lo tenía. Pagué al recibirlo, sin complicaciones. El proceso da confianza.',
    },
    {
      name: 'Santiago Castaño',
      place: 'Envigado',
      stars: 5,
      photo: '/assets/reviews/l01.jpg',
      text: 'Me explicaron todo con claridad por el celular. El producto cumple lo que prometen; no sentí que fuera solo publicidad.',
    },
    {
      name: 'Jhon Jairo Muñoz',
      place: 'Itagüí',
      stars: 5,
      photo: '/assets/reviews/p14.jpg',
      text: 'Me daba un poco de miedo pedir esto por internet, pero la atención fue respetuosa. La caja venía sellada y el mensajero fue discreto.',
    },
    {
      name: 'Yeison Andrés Ríos',
      place: 'Manrique',
      stars: 5,
      text: 'Les escribí un domingo y me respondieron. El martes ya lo estaba tomando. Me ha ayudado a sentirme con más energía en las noches.',
    },
    {
      name: 'Mateo Arango',
      place: 'Sabaneta',
      stars: 5,
      photo: '/assets/reviews/p02.jpg',
      text: 'Vivo en Sabaneta y pensé que se demoraba más. Llegó en un día, pagué al recibirlo y listo. Se toma fácil.',
    },
    {
      name: 'Stiven Galeano',
      place: 'Castilla',
      stars: 5,
      photo: '/assets/reviews/p15.jpg',
      text: 'La entrega fue más rápida de lo que esperaba. Después del turno se nota que uno no queda tan agotado. Lo recomiendo con tranquilidad.',
    },
    {
      name: 'Andrés Felipe Quintero',
      place: 'Belén',
      stars: 5,
      photo: '/assets/reviews/l02.jpg',
      text: 'Me gustó que la caja no anuncia nada. Pregunté varias veces por WhatsApp y me respondieron con paciencia. Entrega al día siguiente.',
    },
    {
      name: 'Dubán Herrera',
      place: 'Copacabana',
      stars: 5,
      photo: '/assets/reviews/p16.jpg',
      text: 'Desde Copacabana pensé que se iba a demorar, pero llegó a tiempo. El mensajero fue amable y el producto sí se nota en la energía.',
    },
    {
      name: 'Nicolás Ospina',
      place: 'El Poblado',
      stars: 5,
      photo: '/assets/reviews/p03.jpg',
      text: 'Pedido sencillo: me respondieron rápido y al día siguiente lo tenía. Pagar cuando llega me dio mucha confianza.',
    },
    {
      name: 'Yeferson Quintero',
      place: 'Aranjuez',
      stars: 5,
      text: 'Llegó rápido y la atención fue excelente. Preferí pedirlo a domicilio antes que buscarlo en un mostrador. En casa se toma con tranquilidad.',
    },
    {
      name: 'Juan Pablo Mejía',
      place: 'La Estrella',
      stars: 5,
      photo: '/assets/reviews/p04.jpg',
      text: 'Me lo trajeron a la mañana siguiente. Tenía una duda del envío, les escribí y me contestaron de inmediato. Buena experiencia.',
    },
    {
      name: 'Samuel Rendón',
      place: 'Robledo',
      stars: 5,
      photo: '/assets/reviews/p17.jpg',
      text: 'Pedí un jueves y el viernes ya estaba en la casa. El sabor es agradable y me deja con más ganas de aprovechar la noche.',
    },
    {
      name: 'Harol Andrés Posada',
      place: 'Caldas',
      stars: 5,
      photo: '/assets/reviews/l03.jpg',
      text: 'Caldas queda un poco lejos y aun así llegó al día siguiente. Pagué en efectivo al mensajero. No me dejaron esperando respuesta.',
    },
    {
      name: 'David Londoño',
      place: 'Floresta',
      stars: 5,
      photo: '/assets/reviews/p05.jpg',
      text: 'Llegó sellado, pagué y listo. Discreto de principio a fin. El producto me funcionó bien y pedí de nuevo el de 500 ml.',
    },
    {
      name: 'Julián Marín',
      place: 'Girardota',
      stars: 5,
      text: 'Pensé que a Girardota se demoraban más, pero llegó en un día. Me explicaron el flete antes. Me ha caído bien: más energía, sin sentirme pesado.',
    },
    {
      name: 'Tomás Cano',
      place: 'Buenos Aires',
      stars: 5,
      photo: '/assets/reviews/p06.jpg',
      text: 'La atención es clara y directa. El domicilio fue rápido y el jarabe cumple. Lo recomiendo sin problema.',
    },
    {
      name: 'Miguel Ángel Vargas',
      place: 'Prado',
      stars: 5,
      photo: '/assets/reviews/p07.jpg',
      text: 'Me atendieron por el celular con mucha amabilidad. Al día siguiente llegó el mensajero y pagué ahí mismo. El frasco rinde bien.',
    },
    {
      name: 'Emerson Galeano',
      place: 'San Javier',
      stars: 5,
      text: 'Tenía mis dudas, pero llegó rápido y el producto sí se siente. Quedé con más ánimo en la noche. Gracias por la buena atención.',
    },
    {
      name: 'Juan Camilo Betancur',
      place: 'Estadio',
      stars: 5,
      photo: '/assets/reviews/p08.jpg',
      text: 'Pedí a las 8 de la noche y al otro día, cerca del mediodía, ya lo tenía. La caja es discreta y el jarabe me ha ayudado.',
    },
    {
      name: 'Wilmar de Jesús Rúa',
      place: 'Bello',
      stars: 5,
      photo: '/assets/reviews/p09.jpg',
      text: 'Respondieron todas mis preguntas sin afán. El envío a Bello fue al día siguiente. El sabor es suave y se deja tomar.',
    },
    {
      name: 'Alejandro Cárdenas',
      place: 'Envigado',
      stars: 5,
      photo: '/assets/reviews/p10.jpg',
      text: 'Llevo dos pedidos. Las dos veces llegó al día siguiente y la atención fue igual de buena. Eso me da seguridad para seguir pidiendo.',
    },
    {
      name: 'Sebastián Henao',
      place: 'Itagüí',
      stars: 5,
      text: 'Uno escribe y le contestan, sin tener que insistir. Es un producto práctico para tener en la casa; se nota cuando lo tomo.',
    },
    {
      name: 'Juan José Restrepo',
      place: 'Laureles',
      stars: 5,
      photo: '/assets/reviews/p11.jpg',
      text: 'Llegó en la tarde del día siguiente. Caja sellada, pagué en la puerta y sin explicaciones. Más energía, sin sentirme alterado.',
    },
    {
      name: 'Deiro Andrés Montoya',
      place: 'Manrique',
      stars: 5,
      photo: '/assets/reviews/p18.jpg',
      text: 'Mandé mal la dirección y aun así me ayudaron a corregirla. Llegó al día siguiente. Muy buena disposición del equipo.',
    },
    {
      name: 'Felipe Giraldo',
      place: 'Sabaneta',
      stars: 5,
      photo: '/assets/reviews/p19.jpg',
      text: 'No solo me gustó el producto, también cómo atienden: claros con el envío, rápidos, y uno paga cuando lo tiene en la mano.',
    },
    {
      name: 'Cristian Camilo Zapata',
      place: 'Barbosa',
      stars: 5,
      text: 'Hasta Barbosa me llegó al día siguiente. Pagué al mensajero y listo. Buen frasco y se nota más actividad durante el día.',
    },
    {
      name: 'Esteban Morales',
      place: 'Envigado',
      stars: 5,
      text: 'Me escribieron para confirmar la dirección y al día siguiente ya estaba aquí. Lo tengo en la alcoba y sí se nota la diferencia.',
    },
  ];

  readonly compareCents = 7_500_000;

  reviewAt(index: number) {
    return this.reviews[index];
  }

  ngOnInit() {
    this.wallWide?.addEventListener('change', this.onWallWide);
    this.seedWall(this.slotCount());
    this.api.getProduct('power-sex-jarabe-500ml').subscribe({
      next: (p) => this.product.set(p),
      error: () => this.product.set(null),
    });
    const saved = this.cart.items()[0];
    if (saved) this.quantity.set(saved.quantity);
  }

  ngAfterViewInit() {
    if (!this.motionOk) return;
    const stage = this.wallStage?.nativeElement;
    document.addEventListener('visibilitychange', this.onVisibility);
    if (stage && typeof IntersectionObserver !== 'undefined') {
      this.wallObserver = new IntersectionObserver(
        ([entry]) => {
          this.wallInView = entry.isIntersecting;
          if (this.wallInView) this.armCycle();
          else this.clearCycle();
        },
        { threshold: 0.18, rootMargin: '80px 0px' },
      );
      this.wallObserver.observe(stage);
      return;
    }
    this.wallInView = true;
    this.armCycle();
  }

  ngOnDestroy() {
    this.wallWide?.removeEventListener('change', this.onWallWide);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.wallObserver?.disconnect();
    this.clearCycle();
    this.clearSwapTimers();
  }

  canBuy() {
    const p = this.product();
    return !!p && p.stock >= 1;
  }

  saleCents() {
    return this.product()?.priceCents ?? 5_000_000;
  }

  stockCap() {
    return Math.max(this.product()?.stock ?? 1, 1);
  }

  lineTotal() {
    return this.saleCents() * this.quantity();
  }

  buy() {
    const p = this.product();
    if (!p || p.stock < 1) return;
    const qty = Math.min(this.quantity(), p.stock);
    const existing = this.cart.items().find((item) => item.product.id === p.id);
    if (existing) this.cart.setQuantity(p.id, qty, p);
    else this.cart.add(p, qty);
    this.analytics.trackAddToCart(p.name);
    this.analytics.trackCheckoutStart();
    void this.router.navigate(['/checkout']);
  }

  zoomPhoto(event: PointerEvent) {
    if (!this.loupe || event.pointerType !== 'mouse') return;
    const frame = event.currentTarget as HTMLElement;
    const img = frame.querySelector('img');
    if (!img) return;
    const rect = frame.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    img.style.transition = 'transform 160ms linear';
    img.style.transformOrigin = `${x}% ${y}%`;
    img.style.transform = 'scale(1.85)';
  }

  resetPhoto(event: PointerEvent) {
    const img = (event.currentTarget as HTMLElement).querySelector('img');
    if (!img) return;
    img.style.transition = '';
    img.style.transform = 'scale(1)';
  }

  peekAsk(index: number, event: PointerEvent) {
    if (event.pointerType !== 'mouse') return;
    this.askOpen.set(index);
  }

  leaveAsk() {
    this.askOpen.set(this.askPinned);
  }

  toggleAsk(index: number) {
    if (this.askPinned === index) {
      this.askPinned = null;
      this.askOpen.set(null);
      return;
    }
    this.askPinned = index;
    this.askOpen.set(index);
  }

  private readonly onVisibility = () => {
    if (document.hidden) this.clearCycle();
    else this.armCycle();
  };

  private readonly onWallWide = (event: MediaQueryListEvent) => {
    const next = event.matches ? 6 : 4;
    if (next === this.slotCount()) return;
    this.slotCount.set(next);
    this.clearSwapTimers();
    this.swapping = false;
    this.seedWall(next);
  };

  private armCycle() {
    this.clearCycle();
    if (!this.motionOk || !this.wallInView || document.hidden || this.swapping) return;
    this.cycleTimer = window.setTimeout(() => this.swapAllNotes(), this.dwellMs);
  }

  private clearCycle() {
    window.clearTimeout(this.cycleTimer);
    this.cycleTimer = 0;
  }

  private clearSwapTimers() {
    for (const timer of this.swapTimers) window.clearTimeout(timer);
    this.swapTimers = [];
  }

  private seedWall(count: number) {
    const pool = this.shuffledIndices(this.reviews.length).slice(0, count);
    this.wallNotes.set(pool.map((reviewIndex, place) => this.makeNote(place, reviewIndex)));
  }

  private swapAllNotes() {
    const notes = this.wallNotes();
    if (!notes.length || this.swapping) {
      this.armCycle();
      return;
    }

    const order = this.shuffledIndices(notes.length);
    const avoid = new Set(notes.map((note) => note.reviewIndex));
    const batch = this.pickFreshBatch(notes.length, avoid);
    const plan = new Map<number, { reviewIndex: number; motion: NoteMotion }>();

    order.forEach((place, index) => {
      plan.set(place, {
        reviewIndex: batch[index],
        motion: this.motions[Math.floor(Math.random() * this.motions.length)],
      });
    });

    this.swapping = true;
    this.clearSwapTimers();
    let pending = order.length;

    order.forEach((place, index) => {
      const startAt = index * this.staggerMs;
      const leaveTimer = window.setTimeout(() => {
        const next = plan.get(place);
        if (!next) return;
        this.wallNotes.update((list) =>
          list.map((note) =>
            note.place === place ? { ...note, leaving: true, motion: next.motion } : note,
          ),
        );

        const enterTimer = window.setTimeout(() => {
          this.wallNotes.update((list) =>
            list.map((note) =>
              note.place === place
                ? this.makeNote(place, next.reviewIndex, next.motion)
                : note,
            ),
          );
          pending -= 1;
          if (pending <= 0) {
            this.swapping = false;
            this.armCycle();
          }
        }, this.swapMs);
        this.swapTimers.push(enterTimer);
      }, startAt);
      this.swapTimers.push(leaveTimer);
    });
  }

  private makeNote(place: number, reviewIndex: number, motion?: NoteMotion): WallNote {
    return {
      place,
      reviewIndex,
      key: ++this.noteKey,
      tilt: `${this.tilts[place % this.tilts.length]}deg`,
      tape: `${this.tapes[place % this.tapes.length]}deg`,
      motion: motion ?? this.motions[place % this.motions.length],
      leaving: false,
    };
  }

  private pickFreshBatch(count: number, avoid: Set<number>) {
    const free = this.shuffledIndices(this.reviews.length).filter((index) => !avoid.has(index));
    if (free.length >= count) return free.slice(0, count);
    const rest = this.shuffledIndices(this.reviews.length).filter((index) => avoid.has(index));
    return [...free, ...rest].slice(0, count);
  }

  private shuffledIndices(total: number) {
    const list = Array.from({ length: total }, (_, index) => index);
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

}
