import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ViewEncapsulation } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { OpsOrder } from '../../core/models';
import { isUnauthorized, OPS_PATH, formatWhen } from './ops-format';

@Component({
  selector: 'app-ops-shell',
  standalone: true,
  imports: [ReactiveFormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (!auth.isLoggedIn()) {
      <section class="ops-login">
        <form class="ops-login-card" [formGroup]="loginForm" (ngSubmit)="login()">
          <div class="ops-login-brand">
            <img src="/assets/logo-jyc.png" alt="JyC Bienestar" />
            <h1>Panel de administración</h1>
            <p style="margin:0">Acceso exclusivo del equipo operativo.</p>
          </div>
          <div class="ops-form">
            <div class="ops-field">
              <label for="ops-email">Correo</label>
              <input id="ops-email" type="email" formControlName="email" autocomplete="username" />
            </div>
            <div class="ops-field">
              <label for="ops-pass">Contraseña</label>
              <input id="ops-pass" type="password" formControlName="password" autocomplete="current-password" />
            </div>
            @if (error()) {
              <p class="ops-error">{{ error() }}</p>
            }
            <button class="ops-btn" type="submit" [disabled]="loginForm.invalid || sending()">
              {{ sending() ? 'Entrando…' : 'Entrar al panel' }}
            </button>
          </div>
        </form>
      </section>
    } @else {
      <div class="ops-app">
        <aside class="ops-side">
          <a class="ops-side-brand" [routerLink]="'/' + path" aria-label="Inicio de administración">
            <img src="/assets/logo-jyc.png" alt="" />
            <strong>Ops Console</strong>
            <span>JyC Bienestar</span>
          </a>
          <nav aria-label="Navegación de administración">
            <div class="ops-nav-group">
              <p class="ops-nav-label">General</p>
              <a [routerLink]="'/' + path" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }">Inicio</a>
              <a [routerLink]="'/' + path + '/metricas'" routerLinkActive="on">Métricas</a>
            </div>
            <div class="ops-nav-group">
              <p class="ops-nav-label">Operación</p>
              <a [routerLink]="'/' + path + '/pedidos'" routerLinkActive="on">
                Pedidos
                @if (openCount() > 0) {
                  <span class="ops-count">{{ openCount() }}</span>
                }
              </a>
              <a [routerLink]="'/' + path + '/carritos'" routerLinkActive="on">Carritos</a>
              <a [routerLink]="'/' + path + '/clientes'" routerLinkActive="on">Clientes</a>
            </div>
            <div class="ops-nav-group">
              <p class="ops-nav-label">Catálogo</p>
              <a [routerLink]="'/' + path + '/productos'" routerLinkActive="on">Productos</a>
              <a [routerLink]="'/' + path + '/correos'" routerLinkActive="on">Correos</a>
            </div>
          </nav>
          <button class="linkish ops-exit" type="button" (click)="logout()">Cerrar sesión</button>
        </aside>
        <div class="ops-content">
          @if (alertOrder(); as alert) {
            <aside class="ops-alert" role="status">
              <div>
                <p class="ops-kicker">Pedido nuevo</p>
                <strong>{{ alert.orderNumber }} · {{ alert.customerName }}</strong>
                <span class="ops-muted" style="display:block;margin:0">
                  {{ alert.customerPhone }} · {{ formatWhen(alert.createdAt) }}
                </span>
              </div>
              <div class="ops-actions">
                <a class="ops-btn" [routerLink]="['/', path, 'pedidos', alert.id]" (click)="dismissAlert()">Abrir</a>
                <button class="ops-btn quiet" type="button" (click)="dismissAlert()">Listo</button>
              </div>
            </aside>
          }
          <router-outlet />
        </div>
      </div>
    }
  `,
  styleUrl: './ops-shell.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class OpsShellComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  readonly path = OPS_PATH;
  readonly formatWhen = formatWhen;

  readonly error = signal<string | null>(null);
  readonly sending = signal(false);
  readonly openCount = signal(0);
  readonly alertOrder = signal<OpsOrder | null>(null);

  private knownOrderIds = new Set<string>();
  private primed = false;
  private pollTimer = 0;

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    const previousTitle = document.title;
    document.title = 'Administración · JyC';
    this.destroyRef.onDestroy(() => {
      document.title = previousTitle;
      if (this.pollTimer) window.clearInterval(this.pollTimer);
    });
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        if (this.auth.isLoggedIn()) this.refresh();
      });
  }

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.refresh();
      this.startPolling();
    }
  }

  login() {
    if (this.loginForm.invalid) return;
    this.error.set(null);
    this.sending.set(true);
    const { email, password } = this.loginForm.getRawValue();
    this.api.login(email, password).subscribe({
      next: (res) => {
        this.auth.setToken(res.accessToken);
        this.sending.set(false);
        this.primed = false;
        this.knownOrderIds.clear();
        this.refresh();
        this.startPolling();
        void this.router.navigate(['/', this.path]);
      },
      error: () => {
        this.sending.set(false);
        this.error.set('Correo o contraseña incorrectos.');
      },
    });
  }

  logout() {
    this.auth.clear();
    this.openCount.set(0);
    this.alertOrder.set(null);
    this.primed = false;
    this.knownOrderIds.clear();
    if (this.pollTimer) window.clearInterval(this.pollTimer);
    this.loginForm.controls.password.setValue('');
    void this.router.navigate(['/', this.path]);
  }

  dismissAlert() {
    this.alertOrder.set(null);
  }

  private startPolling() {
    if (this.pollTimer) window.clearInterval(this.pollTimer);
    this.pollTimer = window.setInterval(() => this.refresh(), 12000);
  }

  private refresh() {
    const token = this.auth.token();
    if (!token) return;
    this.api.adminMetrics(token).subscribe({
      next: (metrics) => this.openCount.set(metrics.porAtender),
      error: (error) => {
        if (isUnauthorized(error)) this.auth.clear();
      },
    });
    this.api.adminOrders(token).subscribe({
      next: (orders) => this.watchOrders(orders),
      error: (error) => {
        if (isUnauthorized(error)) this.auth.clear();
      },
    });
  }

  private watchOrders(orders: OpsOrder[]) {
    const newest = orders[0];
    if (!this.primed) {
      orders.forEach((o) => this.knownOrderIds.add(o.id));
      this.primed = true;
      return;
    }
    const fresh = orders.filter((o) => !this.knownOrderIds.has(o.id));
    orders.forEach((o) => this.knownOrderIds.add(o.id));
    if (fresh.length && newest && fresh.some((o) => o.id === newest.id)) {
      this.alertOrder.set(newest);
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        gain.gain.value = 0.04;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } catch {
        /* sin audio */
      }
    }
  }
}
