import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const t = localStorage.getItem('access_token');

  const authReq = t
    ? req.clone({ setHeaders: { Authorization: `Bearer ${t}` } })
    : req;

  return next(authReq).pipe(
    catchError(err => {
      if (err?.status === 401) {
        console.warn('Token inválido o expirado. Cerrando sesión.');
        localStorage.removeItem('access_token');

        router.navigateByUrl('/login');
      }

      return throwError(() => err);
    })
  );
};
