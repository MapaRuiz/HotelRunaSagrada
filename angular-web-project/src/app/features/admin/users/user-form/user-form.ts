import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User, Role, RoleEntity } from '../../../../model/user';
import { environment } from '../../../../../environments/environment';

export interface UserFormPayload {
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
  };
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.css']
})
export class UserFormComponent implements OnInit {
  @Input() user?: User;
  @Input() loading = false;
  @Output() onCancel = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<UserFormPayload>();

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
  } = { email: '', role: 'CLIENT', enabled: true };

  allRoles: Role[] = ['ADMIN','OPERATOR','CLIENT'];
  imgBroken = false;

  // Base del backend para imágenes
  private backendBase = (environment as any).backendBaseUrl
    || (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  constructor() {}

  ngOnInit(): void {
    if (this.user) {
      this.draft = {
        email: this.user.email,
        full_name: this.user.full_name,
        phone: this.user.phone,
        national_id: this.user.national_id,
        selected_pet: this.user.selected_pet,
        role: (this.roleNames(this.user.roles)[0] as Role) || 'CLIENT',
        enabled: this.user.enabled !== false
      };
    }
  }

  img(path?: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.backendBase}${path}`;
  }

  roleNames(roles?: RoleEntity[] | string[]): string[] {
    if (!roles) return [];
    if (typeof roles[0] === 'string') return roles as string[];
    return (roles as RoleEntity[]).map(r => r.name);
  }

  // Validaciones
  isEmailValid(v?: string) { 
    return !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); 
  }
  
  isPasswordOk(v?: string) { 
    return !v || v.length >= 6; // Password es opcional en edición
  }
  
  passwordsMatch(a?: string, b?: string) { 
    return (a || '') === (b || ''); 
  }

  isFormValid(): boolean {
    return this.isEmailValid(this.draft.email) &&
           this.isPasswordOk(this.draft.password) &&
           this.passwordsMatch(this.draft.password, this.draft.password2);
  }

  submit(): void {
    if (!this.isFormValid()) return;

    this.onSave.emit({
      draft: { ...this.draft }
    });
  }

  cancelEdit(): void {
    this.onCancel.emit();
  }

  onImageError(): void {
    this.imgBroken = true;
  }

  onImageLoad(): void {
    this.imgBroken = false;
  }
}