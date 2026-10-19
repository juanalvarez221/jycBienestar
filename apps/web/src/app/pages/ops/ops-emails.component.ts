import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { AdminNotifyEmail } from '../../core/models';
import { formatWhen, isUnauthorized } from './ops-format';

@Component({
  selector: 'app-ops-emails',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  template: `
    <header class="ops-head">
      <div>
        <p class="ops-kicker">Alertas</p>
        <h1>Correos de administración</h1>
        <p class="ops-muted">
          Quién recibe avisos de pedidos nuevos desde
          <strong>bienestarjyc&#64;gmail.com</strong>. Puedes agregar, pausar o quitar destinatarios.
        </p>
      </div>
      <button class="ops-btn quiet" type="button" [disabled]="testing()" (click)="sendTest()">
        {{ testing() ? 'Enviando…' : 'Enviar prueba' }}
      </button>
    </header>

    @if (error()) { <p class="ops-error">{{ error() }}</p> }
    @if (ok()) { <p class="ops-ok">{{ ok() }}</p> }

    <div class="ops-split">
      <section class="ops-panel">
        <h2>{{ editingId() ? 'Editar destinatario' : 'Agregar correo' }}</h2>
        <form class="ops-form" [formGroup]="form" (ngSubmit)="save()">
          <div class="ops-field">
            <label for="notify-name">Nombre</label>
            <input id="notify-name" formControlName="name" placeholder="Ej. Juan" />
          </div>
          <div class="ops-field">
            <label for="notify-email">Correo</label>
            <input id="notify-email" type="email" formControlName="email" placeholder="nombre&#64;gmail.com" />
          </div>
          <div class="ops-field">
            <label for="notify-active">Estado</label>
            <select id="notify-active" formControlName="active">
              <option [ngValue]="true">Activo — recibe alertas</option>
              <option [ngValue]="false">Pausado — no recibe</option>
            </select>
          </div>
          <div class="ops-actions">
            <button class="ops-btn" type="submit" [disabled]="form.invalid || saving()">
              {{ editingId() ? 'Guardar cambios' : 'Agregar' }}
            </button>
            @if (editingId()) {
              <button class="ops-btn quiet" type="button" (click)="cancelEdit()">Cancelar</button>
            }
          </div>
        </form>
      </section>

      <section class="ops-panel">
        <div class="ops-panel-head">
          <h2>Destinatarios</h2>
          <span class="ops-muted" style="margin:0">{{ emails().length }}</span>
        </div>
        @if (loading()) {
          <div class="ops-empty"><span class="ops-skeleton" style="width:10rem"></span></div>
        } @else if (emails().length === 0) {
          <div class="ops-empty">
            <strong>Sin destinatarios</strong>
            <span>Agrega al menos uno para recibir pedidos nuevos.</span>
          </div>
        } @else {
          <div class="ops-table-wrap">
            <table class="ops-table">
              <thead>
                <tr>
                  <th>Destinatario</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (row of emails(); track row.id) {
                  <tr>
                    <td>
                      <strong>{{ row.name || 'Sin nombre' }}</strong>
                      <span class="ops-muted">{{ row.email }}</span>
                      <span class="ops-muted">Desde {{ formatWhen(row.createdAt) }}</span>
                    </td>
                    <td>
                      <span class="ops-pill" [attr.data-status]="row.active ? 'ENVIADO' : 'CANCELADO'">
                        {{ row.active ? 'Activo' : 'Pausado' }}
                      </span>
                    </td>
                    <td>
                      <div class="ops-actions">
                        <button class="ops-btn quiet" type="button" (click)="edit(row)">Editar</button>
                        <button class="ops-btn quiet" type="button" (click)="toggle(row)">
                          {{ row.active ? 'Pausar' : 'Activar' }}
                        </button>
                        <button class="ops-btn danger" type="button" (click)="remove(row)">Quitar</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>
  `,
})
export class OpsEmailsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  readonly formatWhen = formatWhen;

  readonly emails = signal<AdminNotifyEmail[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly testing = signal(false);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly ok = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    active: [true],
  });

  ngOnInit() {
    this.load();
  }

  load() {
    const token = this.auth.token();
    if (!token) return;
    this.loading.set(true);
    this.api.adminNotifyEmails(token).subscribe({
      next: (rows) => {
        this.emails.set(rows);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.fail(error);
      },
    });
  }

  edit(row: AdminNotifyEmail) {
    this.editingId.set(row.id);
    this.form.patchValue({
      name: row.name ?? '',
      email: row.email,
      active: row.active,
    });
    this.ok.set(null);
  }

  cancelEdit() {
    this.editingId.set(null);
    this.form.reset({ name: '', email: '', active: true });
  }

  save() {
    const token = this.auth.token();
    if (!token || this.form.invalid) return;
    const value = this.form.getRawValue();
    const payload = {
      name: value.name.trim() || undefined,
      email: value.email.trim().toLowerCase(),
      active: value.active === true || (value.active as unknown) === 'true',
    };
    this.saving.set(true);
    this.error.set(null);
    this.ok.set(null);
    const id = this.editingId();
    const req = id
      ? this.api.updateNotifyEmail(token, id, payload)
      : this.api.createNotifyEmail(token, payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.ok.set(id ? 'Destinatario actualizado.' : 'Correo agregado a las alertas.');
        this.cancelEdit();
        this.load();
      },
      error: (error) => {
        this.saving.set(false);
        this.fail(error, 'No se pudo guardar el correo.');
      },
    });
  }

  toggle(row: AdminNotifyEmail) {
    const token = this.auth.token();
    if (!token) return;
    this.api.updateNotifyEmail(token, row.id, { active: !row.active }).subscribe({
      next: () => {
        this.ok.set(row.active ? 'Alertas pausadas para ese correo.' : 'Alertas reactivadas.');
        this.load();
      },
      error: (error) => this.fail(error),
    });
  }

  remove(row: AdminNotifyEmail) {
    const token = this.auth.token();
    if (!token) return;
    if (!confirm(`¿Quitar ${row.email} de las alertas?`)) return;
    this.api.deleteNotifyEmail(token, row.id).subscribe({
      next: () => {
        this.ok.set('Correo eliminado de la lista.');
        if (this.editingId() === row.id) this.cancelEdit();
        this.load();
      },
      error: (error) => this.fail(error, 'No se pudo eliminar.'),
    });
  }

  sendTest() {
    const token = this.auth.token();
    if (!token) return;
    this.testing.set(true);
    this.error.set(null);
    this.ok.set(null);
    this.api.testNotifyEmails(token).subscribe({
      next: (res) => {
        this.testing.set(false);
        this.ok.set(`Prueba enviada a: ${res.recipients.join(', ')}`);
      },
      error: (error) => {
        this.testing.set(false);
        const msg =
          (error as { error?: { message?: string | string[] } })?.error?.message;
        this.fail(
          error,
          Array.isArray(msg) ? msg.join(' ') : msg || 'No se pudo enviar la prueba.',
        );
      },
    });
  }

  private fail(error: unknown, message = 'No se pudo cargar la lista de correos.') {
    if (isUnauthorized(error)) this.auth.clear();
    else this.error.set(message);
  }
}
