import { Injectable, signal } from '@angular/core';

const KEY = 'jyc_admin_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenSignal = signal<string | null>(
    localStorage.getItem(KEY),
  );

  readonly token = this.tokenSignal.asReadonly();

  setToken(token: string) {
    localStorage.setItem(KEY, token);
    this.tokenSignal.set(token);
  }

  clear() {
    localStorage.removeItem(KEY);
    this.tokenSignal.set(null);
  }

  isLoggedIn() {
    return !!this.tokenSignal();
  }
}
