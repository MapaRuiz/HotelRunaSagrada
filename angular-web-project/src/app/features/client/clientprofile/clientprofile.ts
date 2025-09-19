import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { UsersService } from '../../../services/users';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-client-profile',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <h4>Mi perfil (Cliente)</h4>

  <form [formGroup]="form" (ngSubmit)="save()" class="mt-3" style="max-width:520px">
    <input class="form-control mb-2" formControlName="full_name" placeholder="Nombre">
    <input class="form-control mb-2" formControlName="email" placeholder="Email" type="email">
    <input class="form-control mb-2" formControlName="phone" placeholder="Teléfono">
    <input class="form-control mb-2" formControlName="national_id" placeholder="Documento">
    <input class="form-control mb-2" formControlName="selected_pet" placeholder="Icono seleccionado (ruta)">
    <button class="btn btn-primary">Guardar</button>
    <button class="btn btn-outline-danger mt-3" type="button" (click)="deleteMyAccount()">
  Eliminar mi cuenta
</button>

  </form>
  `
})
export class ClientProfile implements OnInit {
  private router = inject(Router);
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
    const formValues = this.form.value;
    const userUpdate = Object.fromEntries(
      Object.entries(formValues).filter(([_, value]) => value !== null)
    );
    this.users.updateMe(userUpdate).subscribe(() => this.auth.me().subscribe()); 
  }

  deleteMyAccount() {
    
    if (!confirm('¿Seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) return;
    this.users.deleteMe().subscribe({
      next: () => {
        this.auth.logout();
        this.router.navigate(['/']); // landing
      },
      error: err => alert('No se pudo eliminar la cuenta: ' + (err?.error?.error || err.message))
    });
  }
}