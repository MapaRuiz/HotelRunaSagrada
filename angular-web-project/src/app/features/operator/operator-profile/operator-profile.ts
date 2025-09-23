import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { User } from '../../../model/user';
import { UsersService } from '../../../services/users';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-operator-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './operator-profile.html',
  styleUrls: ['./operator-profile.css'],
})
export class OperatorProfileComponent implements OnInit {
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
    password?: string;
    password2?: string;
  } = {};

  ngOnInit() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      this.me = stored ? JSON.parse(stored) as User : null;
      if (this.me) {
        this.draft = {
          full_name: this.me.full_name,
          phone: this.me.phone,
          national_id: this.me.national_id,
          selected_pet: this.me.selected_pet,
        };
      }
    }
  }

  img(path?: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.backendBase}${path}`;
  }

  isPasswordOk(v?: string) { return !!v && v.length >= 6; }
  passwordsMatch(a?: string, b?: string) { return (a || '') === (b || ''); }

  save(f: NgForm) {
    this.editTouched = true;

    if (this.draft.password && (!this.isPasswordOk(this.draft.password) || !this.passwordsMatch(this.draft.password, this.draft.password2))) {
      return;
    }

    const body: any = {
      full_name: this.draft.full_name,
      phone: this.draft.phone,
      national_id: this.draft.national_id,
      selected_pet: this.draft.selected_pet,
    };
    if (this.draft.password) body.password = this.draft.password;

    if (!this.me) return;

    this.api.update(this.me.user_id, body).subscribe({
      next: (upd) => {
        this.me = upd;
        localStorage.setItem('user', JSON.stringify(upd));
        this.editTouched = false;
        alert('Perfil de operador actualizado con éxito');
      },
      error: (err) => alert(err?.error?.message || 'Error al actualizar perfil'),
    });
  }

  deleteAccount() {
    if (!this.me) return;
    if (!confirm('¿Seguro que deseas eliminar tu cuenta de operador? Esta acción no se puede deshacer.')) return;

    this.api.delete(this.me.user_id).subscribe({
      next: () => {
        localStorage.removeItem('user');
        alert('Cuenta de operador eliminada');
        this.router.navigate(['/']);
      },
      error: (err) => alert(err?.error?.message || 'Error al eliminar cuenta'),
    });
  }
}
