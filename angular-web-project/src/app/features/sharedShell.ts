import { Directive, OnDestroy, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth';
import { Subject, takeUntil } from 'rxjs';
import { User } from '../model/user';

@Directive()
export class ShellBaseComponent implements OnInit, OnDestroy {
  today = new Date();
  logoSrc: string;
  me: User | null = null;
  avatar = '';

  private readonly backendBase =
    (environment as any).backendBaseUrl ||
    (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  private readonly destroy$ = new Subject<void>();

  protected constructor(protected auth: AuthService) {
    this.logoSrc = this.img('/images/logito.png');
    this.auth.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.me = user;
      this.avatar = this.img(user?.selected_pet || '/images/icons/default.png');
    });
  }

  img(path?: string): string {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.backendBase}${path}`;
  }

  ngOnInit(): void {
    this.auth
      .me()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: () => {
          // Keep last cached user if refresh fails (e.g., 401 handled elsewhere)
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
