import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { User } from '../../../model/user';

@Component({
  standalone: true,
  selector: 'app-operator-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './operator-shell.html',
  styleUrls: ['./operator-shell.css']
})
export class OperatorShellComponent {
  today = new Date();

  private backendBase =
    (environment as any).backendBaseUrl ||
    (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  img(path?: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.backendBase}${path}`;
  }

  logoSrc = this.img('/images/logito.png');

  me: User | null = null;
  avatar = '';

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      this.me = stored ? JSON.parse(stored) as User : null;
      this.avatar = this.img(this.me?.selected_pet || '/images/icons/default.png');
    }
  }
}
