import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/public/landing/landing').then(m => m.Landing) },
  { path: 'login', loadComponent: () => import('./features/public/login/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('./features/public/register/register').then(m => m.Register) },

  // client
  { path: 'client/profile', loadComponent: () => import('./features/client/clientprofile/clientprofile').then(m => m.ClientProfile) },

  // operator
  { path: 'operator/profile', loadComponent: () => import('./features/operator/operatorprofile/operatorprofile').then(m => m.OperatorProfile) },

  // ADMIN - shell con children
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/shell/admin-shell/admin-shell')
      .then(m => m.AdminShellComponent),
    children: [
      { path: '', pathMatch: 'full',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard/admin-dashboard')
          .then(m => m.AdminDashboardComponent)
      },
      { path: 'users', loadComponent: () => import('./features/admin/users/users').then(m => m.Users) },
      { path: 'hotels', loadComponent: () => import('./features/admin/hotels/hotels').then(m => m.HotelsComponent) },
      { path: 'amenities', loadComponent: () => import('./features/admin/amenities/amenities').then(m => m.AmenitiesComponent) },
    ]
  },

  { path: '**', redirectTo: '' }
];
