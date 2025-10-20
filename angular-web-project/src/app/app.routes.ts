import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/public/landing/landing').then(m => m.Landing) },
  { path: 'login', loadComponent: () => import('./features/public/login/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('./features/public/register/register').then(m => m.Register) },
  { path: 'hotel/:id', loadComponent: () => import('./features/public/Hotel/hotel-detail/hotel-detail').then(m => m.HotelDetailComponent) },
  {
    path: 'room-type/:typeId',
    loadComponent: () =>
      import('./features/public/Room/room-detail/room-detail')
        .then(m => m.RoomDetailComponent),
  },
  {
    path: 'reservation-summary',
    loadComponent: () =>
      import('./features/public/reservation-summary/reservation-summary')
        .then(m => m.ReservationSummaryComponent),
  },

  // CLIENT - shell con children
  {
    path: 'client',
    loadComponent: () => import('./features/client/client-shell/client-shell')
      .then(m => m.ClientShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/client/client-dashboard/client-dashboard')
          .then(m => m.ClientDashboardComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/client/client-profile/client-profile')
          .then(m => m.ClientProfileComponent)
      },
    ]
  },

  // OPERATOR
  {
    path: 'operator',
    loadComponent: () => import('./features/operator/operator-shell/operator-shell')
      .then(m => m.OperatorShellComponent),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/operator/operator-dashboard/operator-dashboard').then(m => m.OperatorDashboardComponent) },
      { path: 'department', loadComponent: () => import('./features/operator/department/department').then(m => m.DepartmentComponent) },
      { path: 'task', loadComponent: () => import('./features/operator/task/task').then(m => m.TaskComponent) },
      { path: 'staff-member', loadComponent: () => import('./features/operator/staff-member/staff-member').then(m => m.StaffMemberComponent) },
      { path: 'profile', loadComponent: () => import('./features/operator/operator-profile/operator-profile').then(m => m.OperatorProfileComponent) },
      { path: 'reservation-service', loadComponent: () => import('./features/operator/operator-reservation-service/operator-reservation-service').then(m => m.ReservationServiceComponent) },
      { path: 'reservation-table', loadComponent: () => import('./features/operator/reservation/reservation-table/reservation-table').then(m => m.ReservationTableOperatorComponent) },
    ]
  },
  // ADMIN - shell con children
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/shell/admin-shell/admin-shell')
      .then(m => m.AdminShellComponent),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/admin/dashboard/admin-dashboard/admin-dashboard').then(m => m.AdminDashboardComponent) },
      { path: 'users', loadComponent: () => import('./features/admin/users/users').then(m => m.Users) },
      { path: 'hotels', loadComponent: () => import('./features/admin/hotels/hotels').then(m => m.HotelsComponent) },
      { path: 'amenities', loadComponent: () => import('./features/admin/amenities/amenities').then(m => m.AmenitiesComponent) },
      { path: 'services', loadComponent: () => import('./features/admin/services-offering-component/services-offering-component').then(m => m.ServicesOfferingComponent) },
      { path: 'room-types', loadComponent: () => import('./features/admin/room-type/room-type').then(m => m.RoomType) },
      { path: 'room', loadComponent: () => import('./features/admin/room/room').then(m => m.Room) },
      { path: 'reservations', loadComponent: () => import('./features/admin/reservation/reservation').then(m => m.ReservationComponent) },
    ]
  },

  { path: '**', redirectTo: '' }
];
