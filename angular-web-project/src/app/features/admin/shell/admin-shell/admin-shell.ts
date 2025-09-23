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
