import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth';

/**
 * Guard que verifica si existe un token válido en localStorage.
 * Si no existe, redirige a /login y limpia la sesión.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  // Verificar si existe token
  const hasToken = (() => {
    try {
      return typeof window !== 'undefined' && !!localStorage.getItem('access_token');
    } catch (e) {
      return false;
    }
  })();

  if (hasToken) {
    return true;
  }

  // Sin token válido: logout y redirigir
  auth.logout();
  if (typeof window !== 'undefined') {
    window.history.replaceState(null, '', window.location.origin + '/login');
  }
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
