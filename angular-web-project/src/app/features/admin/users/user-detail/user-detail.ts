import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User, RoleEntity } from '../../../../model/user';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-detail.html',
  styleUrls: ['./user-detail.css', '../user-form/user-form.css']
})
export class UserDetailComponent {
  @Input() user?: User;
  @Output() editRequested = new EventEmitter<User>();

  readonly fallbackText = 'Sin información';

  // Base del backend para imágenes
  private backendBase = (environment as any).backendBaseUrl
    || (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  img(path?: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.backendBase}${path}`;
  }

  roleNames(roles?: RoleEntity[] | string[]): string[] {
    if (!roles) return [];
    if (typeof roles[0] === 'string') return roles as string[];
    return (roles as RoleEntity[]).map(r => r.name);
  }

  beginEdit(): void {
    if (!this.user) return;
    this.editRequested.emit(this.user);
  }
}