import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { User } from '../model/user';

@Injectable({ providedIn: 'root' })
export class UsersService {
  // Correcion 
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  getAll() { return this.http.get<User[]>(`${this.base}/users`); }

  getMe() { 
  return this.http.get<User>(`${this.base}/users/me`); 
}

  // ✔ Admin crea usuarios reutilizando /auth/register con ?role=
  create(body: Partial<User> & { role?: string; roles?: string[] }) {
    const role = body.role ?? (Array.isArray(body.roles) ? body.roles[0] : undefined);
    // No mandes 'role/roles' en el payload JSON; va en query param
    const { role: _r, roles: _rs, ...payload } = body;
    const url = role ? `${this.base}/auth/register?role=${encodeURIComponent(role)}` : `${this.base}/auth/register`;
    return this.http.post<User>(url, payload);
  }

  update(id: number, body: Partial<User> & { roles?: string[] }) {
    return this.http.put<User>(`${this.base}/users/${id}`, body);
  }

  updateMe(body: Partial<User>) {
    return this.http.put<User>(`${this.base}/users/me`, body);
  }

  // services/users.ts
delete(id: number, cascade = false) {
  return this.http.delete<void>(`${this.base}/users/${id}`, { params: { cascade } });
}

  deleteMe(cascade = false) { return this.http.delete<void>(`${this.base}/users/me`, { params: { cascade } }); }

  
  getCurrentReservations(userId: number) {
    return this.http.get<any[]>(`${this.base}/reservations/current`, { params: { userId: String(userId) } });
  }

  getHistoryReservations(userId: number) {
    return this.http.get<any[]>(`${this.base}/reservations/history`, { params: { userId: String(userId) } });
  }
}
