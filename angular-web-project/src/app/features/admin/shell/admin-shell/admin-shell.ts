import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { User } from '../../../../model/user';

@Component({
  standalone: true,
  selector: 'app-admin-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.html',
  styleUrls: ['./admin-shell.css']
})
export class AdminShellComponent {
  today = new Date();


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
        <a routerLink="/admin/services" class="nav-link px-2 py-2 rounded-3" routerLinkActive="active">
          <i class="bi bi-gear me-2"></i> Servicios
        </a>
        <a routerLink="/admin/room-types" class="nav-link px-2 py-2 rounded-3" routerLinkActive="active">
  <i class="bi bi-collection me-2"></i> Room Types
</a>
<a routerLink="/admin/room" class="nav-link px-2 py-2 rounded-3" routerLinkActive="active">
  <i class="bi bi-door-open me-2"></i> Rooms
</a>
      </nav>
=======
  // Base del backend (igual que en Login/Users)
  private backendBase =
    (environment as any).backendBaseUrl ||
    (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');


  // Función de imágenes
  img(path?: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.backendBase}${path}`;
  }

  // Logo fijo del backend
  logoSrc = this.img('/images/logito.png');

  // Avatar admin (del user logeado)
  adminUser: User | null = null;
  adminAvatar = '';

  constructor() {
    // ⚠️ protege contra SSR
    if (typeof window !== 'undefined') {
      const me = JSON.parse(localStorage.getItem('user') || 'null') as User | null;
      this.adminUser = me;
      this.adminAvatar = this.img(me?.selected_pet || '/images/icons/default.png');
    }
  }
}
