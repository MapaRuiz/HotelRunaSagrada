// app/src/app/features/admin/users/users.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../../services/users';
import { User, Role } from '../../../model/user';

@Component({
  standalone: true,
  selector: 'app-admin-users',
  imports: [CommonModule, FormsModule],
  template: `
  <h4>Usuarios</h4>

  <table class="table table-striped mt-3" *ngIf="users.length; else empty">
    <thead>
      <tr>
        <th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Activo</th><th class="text-end">Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let u of users">
        <ng-container *ngIf="editId !== u.user_id; else editRow">
          <td>{{u.user_id}}</td>
          <td>{{u.full_name}}</td>
          <td>{{u.email}}</td>
          <td>{{ (u.roles?.[0]) || '—' }}</td>
          <td>
            <span class="badge" [class.text-bg-success]="u.enabled !== false" [class.text-bg-secondary]="u.enabled === false">
              {{ u.enabled === false ? 'No' : 'Sí' }}
            </span>
          </td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary me-2" (click)="beginEdit(u)" [disabled]="isSelf(u)">Editar</button>
            <button class="btn btn-sm btn-outline-danger" (click)="remove(u)" [disabled]="isSelf(u)">Eliminar</button>
          </td>
        </ng-container>

        <ng-template #editRow>
          <td>{{u.user_id}}</td>
          <td>
            <input class="form-control form-control-sm" [(ngModel)]="draft.full_name" placeholder="Nombre completo">
          </td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <span>{{u.email}}</span>
              <button class="btn btn-link btn-sm p-0" (click)="toggleEmailEdit()">
                {{ draft.changeEmail ? 'Cancelar email' : 'Cambiar email' }}
              </button>
            </div>

            <div *ngIf="draft.changeEmail" class="mt-2">
              <input class="form-control form-control-sm" [(ngModel)]="draft.email" placeholder="Nuevo email"
                     [class.is-invalid]="draft.emailTouched && !isEmailValid(draft.email)"
                     (blur)="draft.emailTouched = true">
              <div class="invalid-feedback">Email inválido.</div>
            </div>
          </td>
          <td>
            <select class="form-select form-select-sm" [(ngModel)]="draft.role">
              <option *ngFor="let r of allRoles" [value]="r">{{r}}</option>
            </select>
          </td>
          <td>
            <input type="checkbox" class="form-check-input" [(ngModel)]="draft.enabled" id="chk{{u.user_id}}">
          </td>
          <td class="text-end">
            <div class="d-flex flex-column align-items-end gap-2">
              <button class="btn btn-sm btn-outline-secondary" (click)="togglePasswordEdit()">
                {{ draft.changePassword ? 'Cancelar contraseña' : 'Cambiar contraseña' }}
              </button>

              <div *ngIf="draft.changePassword" class="border rounded p-2" style="min-width: 280px;">
                <div class="mb-2">
                  <div class="input-group input-group-sm">
                    <input [type]="showPwd ? 'text' : 'password'" class="form-control"
                           [(ngModel)]="draft.password" placeholder="Nueva contraseña"
                           [class.is-invalid]="draft.passwordTouched && !isPasswordStrong(draft.password)"
                           (blur)="draft.passwordTouched = true">
                    <button class="btn btn-outline-secondary" type="button" (click)="showPwd = !showPwd">
                      {{ showPwd ? 'Ocultar' : 'Mostrar' }}
                    </button>
                  </div>
                  <div class="invalid-feedback d-block" *ngIf="draft.passwordTouched && !isPasswordStrong(draft.password)">
                    Debe tener mínimo 8 caracteres, con letras y números.
                  </div>
                </div>
                <div>
                  <input [type]="showPwd ? 'text' : 'password'" class="form-control form-control-sm"
                         [(ngModel)]="draft.password2" placeholder="Confirmar contraseña"
                         [class.is-invalid]="draft.password2Touched && !passwordsMatch()"
                         (blur)="draft.password2Touched = true">
                  <div class="invalid-feedback">Las contraseñas no coinciden.</div>
                </div>
              </div>

              <div *ngIf="confirming" class="alert alert-warning py-2 px-3 mb-0" style="max-width: 360px;">
                <div class="small mb-2 fw-semibold">Confirmación requerida</div>
                <ul class="small mb-2 ps-3">
                  <li *ngIf="draft.changeEmail">Email: {{u.email}} → <strong>{{draft.email}}</strong></li>
                  <li *ngIf="draft.changePassword">Contraseña: se actualizará</li>
                </ul>
                <div class="d-flex gap-2 justify-content-end">
                  <button class="btn btn-sm btn-secondary" (click)="cancelConfirm()">Cancelar</button>
                  <button class="btn btn-sm btn-primary" (click)="save(u, true)">Confirmar</button>
                </div>
              </div>

              <div class="d-flex gap-2" *ngIf="!confirming">
                <button class="btn btn-sm btn-primary" (click)="save(u)">Guardar</button>
                <button class="btn btn-sm btn-secondary" (click)="cancel()">Cancelar</button>
              </div>
            </div>
          </td>
        </ng-template>
      </tr>
    </tbody>
  </table>

  <ng-template #empty>
    <div class="alert alert-info mt-3">No hay usuarios.</div>
  </ng-template>
  `,
})
export class Users implements OnInit {
  private api = inject(UsersService);

  users: User[] = [];
  meId: number | null = null;

  editId: number | null = null;
  confirming = false;
  showPwd = false;

  allRoles: Role[] = ['ADMIN','OPERATOR','CLIENT'] as const;

  draft: {
    full_name: string;
    role: Role;
    enabled: boolean;
    national_id?: string;
    phone?: string;
    // sensibles:
    changeEmail: boolean;
    email: string;
    emailTouched?: boolean;

    changePassword: boolean;
    password: string;
    password2: string;
    passwordTouched?: boolean;
    password2Touched?: boolean;
  } = this.emptyDraft();

  ngOnInit() { this.load(); }

  emptyDraft() {
    return {
      full_name: '', role: 'CLIENT' as Role, enabled: true,
      changeEmail: false, email: '',
      changePassword: false, password: '', password2: ''
    };
  }

  load() {
    this.api.getAll().subscribe(d => this.users = d);
    const me = JSON.parse(localStorage.getItem('user') || 'null') as User | null;
    this.meId = me?.user_id ?? null;
  }

  isSelf(u: User) { return this.meId && u.user_id === this.meId; }

  beginEdit(u: User) {
    this.editId = u.user_id;
    this.confirming = false;
    this.showPwd = false;
    this.draft = {
      ...this.emptyDraft(),
      full_name: u.full_name,
      role: (u.roles?.[0] as Role) ?? 'CLIENT',
      enabled: u.enabled !== false,
      national_id: u.national_id,
      phone: u.phone,
      email: u.email,
    };
  }

  cancel() {
    this.editId = null;
    this.confirming = false;
    this.draft = this.emptyDraft();
  }

  toggleEmailEdit() { this.draft.changeEmail = !this.draft.changeEmail; }
  togglePasswordEdit() { this.draft.changePassword = !this.draft.changePassword; }

  isEmailValid(v?: string) {
    if (!this.draft.changeEmail) return true;
    if (!v) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  isPasswordStrong(v?: string) {
    if (!this.draft.changePassword) return true;
    if (!v) return false;
    const long = v.length >= 8;
    const hasLetters = /[A-Za-z]/.test(v);
    const hasDigits = /\d/.test(v);
    return long && hasLetters && hasDigits;
  }

  passwordsMatch() {
    if (!this.draft.changePassword) return true;
    return this.draft.password === this.draft.password2 && this.draft.password.length > 0;
  }

  cancelConfirm() { this.confirming = false; }

  save(u: User, forceConfirm = false) {
    // Validaciones
    if (this.draft.changeEmail) {
      this.draft.emailTouched = true;
      if (!this.isEmailValid(this.draft.email)) return;
    }
    if (this.draft.changePassword) {
      this.draft.passwordTouched = this.draft.password2Touched = true;
      if (!this.isPasswordStrong(this.draft.password) || !this.passwordsMatch()) return;
    }

    const hasSensitiveChange = this.draft.changeEmail || this.draft.changePassword;

    // Paso de confirmación inline (sin modal)
    if (hasSensitiveChange && !forceConfirm && !this.confirming) {
      this.confirming = true;
      return;
    }

    const payload: Partial<User> & { roles: string[] } = {
      full_name: this.draft.full_name,
      phone: this.draft.phone,
      national_id: this.draft.national_id,
      enabled: this.draft.enabled,
      roles: [this.draft.role]
    };
    if (this.draft.changeEmail) payload.email = this.draft.email;
    if (this.draft.changePassword) payload.password = this.draft.password;

    this.api.update(u.user_id, payload).subscribe({
      next: updated => {
        this.users = this.users.map(x => x.user_id === updated.user_id ? updated : x);
        this.editId = null;
        this.confirming = false;
      },
      error: err => {
        const msg = (err?.error?.message || err?.error?.error || err?.message || 'Error desconocido');
        alert('No se pudo actualizar: ' + msg);
      }
    });
  }

  remove(u: User) {
    if (!confirm(`¿Eliminar a ${u.full_name}?`)) return;
    this.api.delete(u.user_id).subscribe({
      next: () => this.users = this.users.filter(x => x.user_id !== u.user_id),
      error: err => alert('No se pudo eliminar: ' + (err?.error?.error || err.message))
    });
  }
}
