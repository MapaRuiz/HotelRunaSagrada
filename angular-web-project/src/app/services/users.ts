import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { User } from '../model/user';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  getAll() { return this.http.get<User[]>(`${this.base}/users`); }
  updateMe(body: Partial<User>) { return this.http.put<User>(`${this.base}/users/me`, body); }
  delete(id: number) { return this.http.delete<void>(`${this.base}/users/${id}`); }
  deleteMe() {
  return this.http.delete<void>(`${this.base}/users/me`);
  }
  
  update(id: number, body: Partial<User> & { roles?: string[] }) {
    return this.http.put<User>(`${this.base}/users/${id}`, body);
  }
}
