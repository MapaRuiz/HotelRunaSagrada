import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  let t: string | null = null;
  if (isBrowser) {
    try {
      t = localStorage.getItem('access_token');
      if (!t) {
        const raw = localStorage.getItem('user');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            t = parsed?.token ?? parsed?.access_token ?? null;
          } catch (e) { /* ignore malformed user */ }
        }
      }
    } catch (e) {
      t = null;
    }
  }

  const authReq = t
    ? req.clone({ setHeaders: { Authorization: `Bearer ${t}` } })
    : req;

  return next(authReq).pipe(
    catchError(err => {
      if (err?.status === 401) {
        console.warn('Token inválido o expirado. Cerrando sesión.');
        if (isBrowser) {
          try { localStorage.removeItem('access_token'); } catch (e) { /* ignore */ }
        }

        router.navigateByUrl('/login');
      }

      return throwError(() => err);
    })
  );
};
