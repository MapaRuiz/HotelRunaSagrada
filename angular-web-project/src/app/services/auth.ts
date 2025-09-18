import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse } from '../model/auth';
import { User } from '../model/user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUser());
  currentUser$ = this.currentUserSubject.asObservable();

  private loadUser(): User | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }
  private persist(session: LoginResponse) {
    localStorage.setItem('access_token', session.access_token);
    localStorage.setItem('user', JSON.stringify(session.user));
    this.currentUserSubject.next(session.user);
  }
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  register(user: User, role?: string) {
    const url = role ? `${this.base}/auth/register?role=${role}` : `${this.base}/auth/register`;
    return this.http.post<User>(url, user);
  }
  login(dto: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, dto)
      .pipe(tap(res => this.persist(res)));
  }
  me() {
    return this.http.get<User>(`${this.base}/auth/me`).pipe(
      tap(u => { localStorage.setItem('user', JSON.stringify(u)); this.currentUserSubject.next(u); })
    );
  }
  userSnapshot() { return this.currentUserSubject.value; }
}
