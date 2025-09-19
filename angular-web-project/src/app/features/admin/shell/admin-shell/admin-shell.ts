import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-admin-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
  <div class="d-flex" style="min-height:100vh;">
    <!-- Sidebar -->
    <aside class="d-flex flex-column p-3" style="width:260px; background:#0f1524;">
      <div class="d-flex align-items-center gap-2 mb-4">
        <i class="bi bi-compass fs-4 text-info"></i>
        <span class="fw-bold">Runa Admin</span>
      </div>

      <nav class="nav flex-column gap-1">
        <a routerLink="/admin" class="nav-link px-2 py-2 rounded-3" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
          <i class="bi bi-grid me-2"></i> Dashboard
        </a>
        <a routerLink="/admin/users" class="nav-link px-2 py-2 rounded-3" routerLinkActive="active">
          <i class="bi bi-people me-2"></i> Usuarios
        </a>
        <a routerLink="/admin/hotels" class="nav-link px-2 py-2 rounded-3" routerLinkActive="active">
          <i class="bi bi-building me-2"></i> Hoteles
        </a>
        <a routerLink="/admin/amenities" class="nav-link px-2 py-2 rounded-3" routerLinkActive="active">
          <i class="bi bi-list-check me-2"></i> Amenities
        </a>
      </nav>

      <div class="mt-auto small text-secondary">
        v1.0 • {{ today | date:'mediumDate' }}
      </div>
    </aside>

    <!-- Main -->
    <main class="flex-grow-1 p-4">
      <!-- Topbar -->
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="input-group" style="max-width:420px;">
          <span class="input-group-text bg-transparent border-end-0"><i class="bi bi-search"></i></span>
          <input class="form-control border-start-0" placeholder="Buscar… (demo visual)">
        </div>
        <div class="d-flex align-items-center gap-3">
          <button class="btn btn-dark border"><i class="bi bi-bell"></i></button>
          <img src="/assets/avatar.png" class="rounded-circle" style="width:36px;height:36px;object-fit:cover;">
        </div>
      </div>

      <router-outlet></router-outlet>
    </main>
  </div>
  `,
  styles: [`
    .nav-link { color:#cfe3ff; }
    .nav-link.active, .nav-link:hover { background:#18233a; color:#fff; }
  `]
})
export class AdminShellComponent {
  today = new Date();
}
