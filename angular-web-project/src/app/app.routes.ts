import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/public/landing/landing').then(m => m.Landing) },
  { path: 'login', loadComponent: () => import('./features/public/login/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('./features/public/register/register').then(m => m.Register) },

  // client
  { path: 'client/profile', loadComponent: () => import('./features/client/clientprofile/clientprofile').then(m => m.ClientProfile) },

  // operator
  { path: 'operator/profile', loadComponent: () => import('./features/operator/operatorprofile/operatorprofile').then(m => m.OperatorProfile) },

  // admin
  { path: 'admin/users', loadComponent: () => import('./features/admin/users/users').then(m => m.Users) },

  { path: '**', redirectTo: '' }
];

