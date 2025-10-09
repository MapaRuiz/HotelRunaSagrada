import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { User } from '../../../model/user';
import { UsersService } from '../../../services/users';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-client-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './client-profile.html',
  styleUrls: ['./client-profile.css'],
})
export class ClientProfileComponent implements OnInit {
  private api = inject(UsersService);
  private router = inject(Router);

  me: User | null = null;
  editTouched = false;
  imgBroken = false;

  private backendBase =
    (environment as any).backendBaseUrl ||
    (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  draft: {
    full_name?: string;
    phone?: string;
    national_id?: string;
    selected_pet?: string;
  } = {};

  ngOnInit() {
    this.api.getMe().subscribe({
      next: (u) => {
        this.me = u;
        this.draft = {
          full_name: u.full_name ?? '',
          phone: u.phone ?? '',
          national_id: u.national_id ?? '',
          selected_pet: u.selected_pet ?? '',
        };
      },
      error: (err) => {
        if (err?.status === 401) {
          localStorage.removeItem('user');
          this.router.navigate(['/login'], { queryParams: { returnUrl: '/client/profile' } });
        }
      }
    });
  }

  img(path?: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.backendBase}${path}`;
  }

  save(f: NgForm) {
    this.editTouched = true;

    const body: any = {
      full_name: this.draft.full_name,
      phone: this.draft.phone,
      national_id: this.draft.national_id,
      selected_pet: this.draft.selected_pet,
    };

    this.api.updateMe(body).subscribe({
      next: (upd) => {
        this.me = upd;
        this.editTouched = false;

        const prev = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...prev,
          id: upd.user_id,
          user_id: upd.user_id,
          name: upd.full_name,
          full_name: upd.full_name
        }));

        alert('Perfil actualizado con éxito');
      },
      error: (err) => alert(err?.error?.message || 'Error al actualizar perfil'),
    });
  }

  deleteAccount() {
    if (!confirm('¿Seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) return;
    this.api.deleteMe(true).subscribe({
      next: () => {
        localStorage.removeItem('user');
        alert('Cuenta eliminada');
        this.router.navigate(['/']);
      },
      error: (err) => alert(err?.error?.message || 'Error al eliminar cuenta'),
    });
  }
}
