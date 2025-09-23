import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { User } from '../../../model/user';
import { BlindsBgComponent } from '../cppn-bg/cppn-bg'; // <-- importa tu bg
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, BlindsBgComponent],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  private backendBase =
    (environment as any).backendBaseUrl ||
    (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  img(path?: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.backendBase}${path}`;
  }

  loading = signal(false);
  flash = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  private showFlash(type: 'success' | 'error', text: string, ms = 2600) {
    this.flash.set({ type, text });
    window.setTimeout(() => this.flash.set(null), ms);
  }

  form = this.fb.group({
    full_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(10)]],
    national_id: ['', [Validators.required, Validators.minLength(10)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get f() {
    return this.form.controls;
  }

  // Medidor de seguridad simple (0..4)
  get pwScore(): number {
    const v = this.form.controls.password.value || '';
    let s = 0;
    if (v.length >= 6) s++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return Math.min(4, s);
  }
  get pwPct(): number { return (this.pwScore / 4) * 100; }
  get pwLabel(): string {
    return ['Muy débil', 'Débil', 'Media', 'Fuerte', 'Excelente'][this.pwScore];
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const body = this.form.value as unknown as User;

    this.auth.register(body, 'CLIENT').subscribe({
      next: _ => {
        this.showFlash('success', 'Cuenta creada. ¡Ya puedes iniciar sesión!');
        setTimeout(() => this.router.navigate(['/login']), 300);
      },
      error: err => {
        const msg = err?.error?.message ?? 'No se pudo crear la cuenta.';
        this.showFlash('error', msg);
        this.loading.set(false);
      }
    });
  }
}
