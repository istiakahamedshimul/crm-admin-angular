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
  hasRole(...roles: string[]) { return roles.includes(this.user()?.role ?? ''); }
  hasPermission(...permissions:string[]){const granted=this.user()?.permissions??this.defaultPermissions(this.user()?.role);return granted.includes('*')||permissions.some(x=>granted.includes(x))}

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
  private defaultPermissions(role?:string){const map:Record<string,string[]>={SuperAdmin:['*'],SubAdmin:['customers.view','reports.view'],CA:['customers.view','agreements.manage','emi.manage','payments.view','payments.record','payments.approve','payments.reverse','reports.view'],Transportation:['transportation.manage','customers.view'],BrandAndIT:['leads.manage','bookings.manage','customers.view','notifications.manage','reports.view'],SalesExecutive:['customers.view']};return map[role??'']??[]}
}
