import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { UsersService } from '../../../services/users';
import { User, Role, RoleEntity } from '../../../model/user';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-admin-users',
  imports: [CommonModule, FormsModule],
  template: `
  <h4>Usuarios</h4>

  <!-- Crear -->
  <details class="mt-3" open>
    <summary class="mb-2">Crear usuario</summary>
    <div class="card card-body">
      <form #f="ngForm" (ngSubmit)="create(f)">
        <div class="row g-2">
          <div class="col-md-4">
            <label class="form-label">Email *</label>
            <input class="form-control" name="email" [(ngModel)]="createForm.email" required
                   [class.is-invalid]="createTouched && !isEmailValid(createForm.email)">
            <div class="invalid-feedback">Ingresa un correo válido.</div>
          </div>

          <div class="col-md-4">
            <label class="form-label">Contraseña *</label>
            <input class="form-control" type="password" name="password" [(ngModel)]="createForm.password" required
                   [class.is-invalid]="createTouched && !isPasswordOk(createForm.password)">
            <div class="invalid-feedback">Mínimo 6 caracteres.</div>
          </div>

          <div class="col-md-4">
            <label class="form-label">Confirmar contraseña *</label>
            <input class="form-control" type="password" name="password2" [(ngModel)]="createForm.password2" required
                   [class.is-invalid]="createTouched && !passwordsMatch(createForm.password, createForm.password2)">
            <div class="invalid-feedback">Las contraseñas no coinciden.</div>
          </div>

          <div class="col-md-4">
            <label class="form-label">Nombre completo</label>
            <input class="form-control" name="full_name" [(ngModel)]="createForm.full_name">
          </div>

          <div class="col-md-4">
            <label class="form-label">Teléfono</label>
            <input class="form-control" name="phone" [(ngModel)]="createForm.phone">
          </div>

          <div class="col-md-4">
            <label class="form-label">Documento</label>
            <input class="form-control" name="national_id" [(ngModel)]="createForm.national_id">
          </div>

          <div class="col-md-4">
            <label class="form-label">Rol</label>
            <select class="form-select" name="role" [(ngModel)]="createForm.role">
              <option *ngFor="let r of allRoles" [value]="r">{{r}}</option>
            </select>
          </div>

          <div class="col-md-4">
            <label class="form-label">Activo</label>
            <div>
              <input class="form-check-input" type="checkbox" id="enabledCreate" [(ngModel)]="createForm.enabled" name="enabled">
              <label class="form-check-label ms-1" for="enabledCreate">Sí</label>
            </div>
          </div>

          <div class="col-md-4">
            <label class="form-label">Imagen (ruta/URL)</label>
            <input class="form-control" name="selected_pet" [(ngModel)]="createForm.selected_pet"
                   placeholder="/images/icons/icono1.png o https://...">
            <div class="mt-2" *ngIf="createForm.selected_pet as src">
              <img [src]="img(src)" (error)="imgBrokenCreate=true" (load)="imgBrokenCreate=false"
                   style="width:64px;height:64px;object-fit:cover;border-radius:50%;">
              <div class="text-danger small mt-1" *ngIf="imgBrokenCreate">No se pudo cargar la imagen.</div>
            </div>
          </div>
        </div>

        <div class="mt-3 d-flex gap-2">
          <button class="btn btn-primary"
                  (click)="createTouched = true"
                  [disabled]="!isEmailValid(createForm.email) || !isPasswordOk(createForm.password) || !passwordsMatch(createForm.password, createForm.password2)">
            Crear
          </button>
          <button type="button" class="btn btn-secondary" (click)="resetCreate()">Limpiar</button>
        </div>
      </form>
    </div>
  </details>

  <!-- Lista -->
  <table class="table table-striped mt-4" *ngIf="users.length; else empty">
    <thead>
      <tr>
        <th>ID</th><th>Usuario</th><th>Roles</th><th>Activo</th><th class="text-end">Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let u of users">
        <ng-container *ngIf="editId !== u.user_id; else editRow">
          <td>{{u.user_id}}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <img *ngIf="u.selected_pet" [src]="img(u.selected_pet)" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
              <div>
                <div class="fw-semibold">{{u.full_name || '—'}}</div>
                <div class="text-muted small">{{u.email}}</div>
              </div>
            </div>
          </td>
          <td>
            <span *ngFor="let r of roleNames(u.roles)" class="badge text-bg-secondary me-1">{{r}}</span>
          </td>
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
            <div class="row g-2">
              <div class="col-md-6">
                <input class="form-control form-control-sm mb-1" [(ngModel)]="draft.full_name" placeholder="Nombre completo">
                <input class="form-control form-control-sm mb-1" [(ngModel)]="draft.email" placeholder="Email"
                       [class.is-invalid]="editTouched && !isEmailValid(draft.email)">
                <div class="invalid-feedback">Email inválido.</div>
              </div>
              <div class="col-md-6">
                <input class="form-control form-control-sm mb-1" [(ngModel)]="draft.selected_pet" placeholder="/images/icons/icono1.png o https://...">
                <div class="mt-1" *ngIf="draft.selected_pet as src">
                  <img [src]="img(src)" (error)="imgBrokenEdit=true" (load)="imgBrokenEdit=false"
                       style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
                  <div class="text-danger small mt-1" *ngIf="imgBrokenEdit">No se pudo cargar la imagen.</div>
                </div>
              </div>
              <div class="col-md-6">
                <input class="form-control form-control-sm" [(ngModel)]="draft.password" type="password" placeholder="Nueva contraseña (opcional)">
                <div class="form-text" *ngIf="draft.password">Mín. 6 caracteres.</div>
              </div>
              <div class="col-md-6" *ngIf="draft.password">
                <input class="form-control form-control-sm" [(ngModel)]="draft.password2" type="password" placeholder="Confirmar contraseña">
                <div class="text-danger small" *ngIf="editTouched && !passwordsMatch(draft.password, draft.password2)">No coincide</div>
              </div>
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
            <button class="btn btn-sm btn-primary me-2"
                    (click)="save(u)"
                    (mousedown)="editTouched = true"
                    [disabled]="!isEmailValid(draft.email) || (draft.password && (!isPasswordOk(draft.password) || !passwordsMatch(draft.password, draft.password2)))">
              Guardar
            </button>
            <button class="btn btn-sm btn-secondary" (click)="cancel()">Cancelar</button>
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

  // Crear
  createForm: {
    email: string;
    password: string;
    password2: string;
    full_name?: string;
    phone?: string;
    national_id?: string;
    selected_pet?: string;
    role: Role;
    enabled: boolean;
  } = { email: '', password: '', password2: '', role: 'CLIENT', enabled: true };
  createTouched = false;
  imgBrokenCreate = false;

  // Editar
  editId: number | null = null;
  draft: {
    email: string;
    full_name?: string;
    phone?: string;
    national_id?: string;
    selected_pet?: string;
    password?: string;
    password2?: string;
    role: Role;
    enabled: boolean;
  } = this.emptyDraft();
  editTouched = false;
  imgBrokenEdit = false;

  allRoles: Role[] = ['ADMIN','OPERATOR','CLIENT'];

  // Base del backend para imágenes (/images/...) – usa backendBaseUrl si existe; si no, deriva de apiBaseUrl
  private backendBase = (environment as any).backendBaseUrl
    || (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  ngOnInit() {
    this.load();
    const me = JSON.parse(localStorage.getItem('user') || 'null') as User | null;
    this.meId = me?.user_id ?? null;
  }

  emptyDraft() {
    return { email: '', role: 'CLIENT' as Role, enabled: true };
  }

  load() {
    // conserva tu método actual
    this.api.getAll().subscribe(d => this.users = d.sort((a,b)=>(a.user_id||0)-(b.user_id||0)));
  }

  // Helpers
  img(path?: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.backendBase}${path}`;
  }

  roleNames(roles?: RoleEntity[] | string[]): string[] {
    if (!roles) return [];
    if (typeof roles[0] === 'string') return roles as string[];
    return (roles as RoleEntity[]).map(r => r.name);
  }

  isSelf(u: User) { return this.meId && u.user_id === this.meId; }

  // Validaciones suaves
  isEmailValid(v?: string) { return !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  isPasswordOk(v?: string) { return !!v && v.length >= 6; }
  passwordsMatch(a?: string, b?: string) { return (a || '') === (b || ''); }

  // Crear
  resetCreate() {
    this.createForm = { email: '', password: '', password2: '', role: 'CLIENT', enabled: true };
    this.createTouched = false;
    this.imgBrokenCreate = false;
  }

  create(f: NgForm) {
    this.createTouched = true;
    if (!this.isEmailValid(this.createForm.email) ||
        !this.isPasswordOk(this.createForm.password) ||
        !this.passwordsMatch(this.createForm.password, this.createForm.password2)) {
      return;
    }

    const body: any = {
      email: this.createForm.email,
      password: this.createForm.password,
      full_name: this.createForm.full_name,
      phone: this.createForm.phone,
      national_id: this.createForm.national_id,
      selected_pet: this.createForm.selected_pet,
      enabled: this.createForm.enabled,
      roles: [this.createForm.role] // nombres de rol, como ya usabas
    };

    this.api.create(body).subscribe({
      next: u => {
        this.users = [u, ...this.users];
        this.resetCreate();
        f.resetForm();
      },
      error: err => alert(err?.error?.message || err.message || 'Error al crear usuario')
    });
  }

  // Editar
  beginEdit(u: User) {
    this.editId = u.user_id;
    this.editTouched = false;
    this.imgBrokenEdit = false;
    this.draft = {
      email: u.email,
      full_name: u.full_name,
      phone: u.phone,
      national_id: u.national_id,
      selected_pet: u.selected_pet,
      role: (this.roleNames(u.roles)[0] as Role) || 'CLIENT',
      enabled: u.enabled !== false
    };
  }

  cancel() {
    this.editId = null;
    this.editTouched = false;
    this.imgBrokenEdit = false;
    this.draft = this.emptyDraft();
  }

  save(u: User) {
    this.editTouched = true;
    if (!this.isEmailValid(this.draft.email)) return;
    if (this.draft.password && (!this.isPasswordOk(this.draft.password) || !this.passwordsMatch(this.draft.password, this.draft.password2))) {
      return;
    }

    const body: any = {
      email: this.draft.email,
      full_name: this.draft.full_name,
      phone: this.draft.phone,
      national_id: this.draft.national_id,
      selected_pet: this.draft.selected_pet,
      enabled: this.draft.enabled,
      roles: [this.draft.role]
    };
    if (this.draft.password) body.password = this.draft.password;

    this.api.update(u.user_id, body).subscribe({
      next: upd => {
        this.users = this.users.map(x => x.user_id === upd.user_id ? upd : x);
        this.cancel();
      },
      error: err => alert(err?.error?.message || err.message || 'Error al actualizar usuario')
    });
  }

  remove(u: User) {
  if (!confirm(`¿Eliminar a ${u.full_name || u.email}?`)) return;

  this.api.delete(u.user_id, true).subscribe({
    next: () => this.users = this.users.filter(x => x.user_id !== u.user_id),
    error: err => {
      // Si hay reservas -> 409 desde el back (Opción A) o FK directo
      if (err?.status === 409 || /Referential integrity|FOREIGN KEY/i.test(err?.error || '')) {
        const goCascade = confirm(
          'Este usuario tiene reservas asociadas.\n' +
          '¿Quieres eliminar también sus reservas y continuar?'
        );
        if (!goCascade) return;

        this.api.delete(u.user_id, true).subscribe({
          next: () => this.users = this.users.filter(x => x.user_id !== u.user_id),
          error: e2 => alert(e2?.error?.message || e2.message || 'Error al eliminar en cascada')
        });
      } else {
        alert(err?.error?.message || err.message || 'Error al eliminar usuario');
      }
    }
  });
}

}
