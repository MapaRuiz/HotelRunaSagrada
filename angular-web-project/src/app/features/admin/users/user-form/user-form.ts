import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User, Role, RoleEntity } from '../../../../model/user';
import { environment } from '../../../../../environments/environment';
import { UsersService } from '../../../../services/users';
import { debounceTime, Subject } from 'rxjs';

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

  private api = inject(UsersService);

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
  emailExists = false;
  checkingEmail = false;
  originalEmail = '';
  private emailCheckSubject = new Subject<string>();

  // Base del backend para imágenes
  private backendBase = (environment as any).backendBaseUrl
    || (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  constructor() {
    // Configurar debounce para verificación de email
    this.emailCheckSubject.pipe(
      debounceTime(500) // Esperar 500ms después de que el usuario deje de escribir
    ).subscribe(email => {
      this.performEmailCheck(email);
    });
  }

  ngOnInit(): void {
    if (this.user) {
      this.originalEmail = this.user.email;
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
    if (!v) return false;
    const formatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    // Si el email es el mismo que el original, no verificamos duplicados
    if (v === this.originalEmail) return formatValid;
    // Si cambió el email, verificamos que no exista y tenga formato válido
    return formatValid && !this.emailExists;
  }
  
  isPasswordOk(v?: string) { 
    return !v || v.length >= 6; // Password es opcional en edición
  }
  
  passwordsMatch(a?: string, b?: string) { 
    return (a || '') === (b || ''); 
  }

  // Método público que se llama desde el template
  checkEmailExists(email: string) {
    // Si el email es el mismo que el original, no necesitamos verificar
    if (email === this.originalEmail) {
      this.emailExists = false;
      this.checkingEmail = false;
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.emailExists = false;
      this.checkingEmail = false;
      return;
    }
    
    this.emailCheckSubject.next(email);
  }

  // Método privado que realiza la verificación real con debounce
  private performEmailCheck(email: string) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email === this.originalEmail) {
      this.emailExists = false;
      this.checkingEmail = false;
      return;
    }

    this.checkingEmail = true;
    this.api.existsByEmail(email).subscribe({
      next: (exists) => {
        this.emailExists = exists;
        this.checkingEmail = false;
      },
      error: () => {
        this.emailExists = false;
        this.checkingEmail = false;
      }
    });
  }

  isFormValid(): boolean {
    return this.isEmailValid(this.draft.email) &&
           !this.emailExists &&
           !this.checkingEmail &&
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