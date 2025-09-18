import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { UsersService } from '../../../services/users';

@Component({
  standalone: true,
  selector: 'app-operator-profile',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <h4>Perfil (Operador)</h4>
  <form [formGroup]="form" (ngSubmit)="save()" class="mt-3" style="max-width:520px">
    <input class="form-control mb-2" formControlName="full_name" placeholder="Nombre">
    <input class="form-control mb-2" formControlName="email" placeholder="Email" type="email" [disabled]="true">
    <input class="form-control mb-2" formControlName="phone" placeholder="Teléfono">
    <input class="form-control mb-2" formControlName="national_id" placeholder="Documento">
    <input class="form-control mb-2" formControlName="selected_pet" placeholder="Icono seleccionado (ruta)">
    <button class="btn btn-primary">Guardar</button>
  </form>
  `
})
export class OperatorProfile implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private users = inject(UsersService);

  form = this.fb.group({
    full_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    national_id: ['', Validators.required],
    selected_pet: ['']
  });

  ngOnInit() { this.auth.me().subscribe(u => this.form.patchValue(u)); }
  save() {
    const { email, ...rest } = this.form.getRawValue(); // no cambiamos email
    // Convert null values to undefined to match Partial<User> type
    const userUpdate = Object.fromEntries(
      Object.entries(rest).map(([key, value]) => [key, value === null ? undefined : value])
    );
    this.users.updateMe(userUpdate).subscribe(() => this.auth.me().subscribe());
  }
}
