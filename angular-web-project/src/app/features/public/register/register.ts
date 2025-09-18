import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { User } from '../../../model/user';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="mx-auto" style="max-width:520px">
    <h3 class="mb-3">Registro</h3>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input class="form-control mb-2" placeholder="Nombre completo" formControlName="full_name">
      <input class="form-control mb-2" placeholder="Email" type="email" formControlName="email">
      <input class="form-control mb-2" placeholder="Teléfono" formControlName="phone">
      <input class="form-control mb-2" placeholder="Documento" formControlName="national_id">
      <input class="form-control mb-2" placeholder="Contraseña" type="password" formControlName="password">
      <button class="btn btn-success w-100" [disabled]="form.invalid">Crear cuenta</button>
    </form>
  </div>`
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    full_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    national_id: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit() {
    if (this.form.invalid) return;
    const body = this.form.value as unknown as User;
    this.auth.register(body, 'CLIENT').subscribe({
      next: _ => this.router.navigate(['/login'])
    });
  }
}
