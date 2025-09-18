import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { roleNames } from '../../../utils/roles';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="mx-auto" style="max-width:420px">
    <h3 class="mb-3">Login</h3>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input class="form-control mb-2" placeholder="Email" formControlName="email" type="email">
      <input class="form-control mb-3" placeholder="Contraseña" formControlName="password" type="password">
      <button class="btn btn-primary w-100" [disabled]="form.invalid">Entrar</button>
    </form>
  </div>`
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  private dashboardBy(rolesIn?: any[]) {
  const roles = roleNames(rolesIn);
  if (roles.includes('ADMIN')) return '/admin/users';
  if (roles.includes('OPERATOR')) return '/operator/profile';
  return '/client/profile';
}

  onSubmit() {
  
  if (this.form.invalid) return;
  this.auth.login(this.form.value as any).subscribe({
    next: res => this.router.navigate([this.dashboardBy(res.user.roles)])
  });
}
}
