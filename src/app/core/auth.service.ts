import { Injectable, signal } from '@angular/core';
import { AuthResponse } from '../models/crm.models';

const tokenKey = 'crm_admin_token';
const userKey = 'crm_admin_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  token = signal(localStorage.getItem(tokenKey) ?? '');
  user = signal<AuthResponse | null>(this.readUser());

  isLoggedIn() {
    return this.token().length > 0;
  }

  setSession(response: AuthResponse) {
    localStorage.setItem(tokenKey, response.token);
    localStorage.setItem(userKey, JSON.stringify(response));
    this.token.set(response.token);
    this.user.set(response);
  }

  logout() {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    this.token.set('');
    this.user.set(null);
  }

  private readUser(): AuthResponse | null {
    const raw = localStorage.getItem(userKey);
    return raw ? JSON.parse(raw) as AuthResponse : null;
  }
}
