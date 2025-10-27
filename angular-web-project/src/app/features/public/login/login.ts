import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { roleNames } from '../../../utils/roles'; // <-- importa tu bg
import { ActivatedRoute } from '@angular/router';

// ⚙️ Utiliza la misma lógica de baseURL que me pasaste
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Base del backend para imágenes (/images/...)
  private backendBase =
    (environment as any).backendBaseUrl ||
    (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  img(path?: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.backendBase}${path}`;
  }

  loading = signal(false);

  // toast simple (sin dependencias)
  flash = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  private showFlash(type: 'success' | 'error', text: string, ms = 2400) {
    this.flash.set({ type, text });
    window.setTimeout(() => this.flash.set(null), ms);
  }

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  get f() {
    return this.form.controls;
  }

  private dashboardBy(rolesIn?: any[]) {
    const roles = roleNames(rolesIn);
    if (roles.includes('ADMIN')) return '/admin';
    if (roles.includes('OPERATOR')) return '/operator';
    return '/client';
  }

  onSubmit(ev?: Event) {
    ev?.preventDefault();
    ev?.stopPropagation();

    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);

    const payload = {
      email: (this.form.value.email ?? '').trim().toLowerCase(),
      password: (this.form.value.password ?? '').trim()
    };

    this.auth.login(payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.showFlash('success', 'Login successful');

        // Guarda un shape simple que nuestra función de detalle sabe leer
        localStorage.setItem('user', JSON.stringify({
          // Shape ligero que usas en el resto de la app
          id: res.user?.user_id,
          name: res.user?.full_name,
          roles: res.user?.roles ?? [],
          token: res.access_token ?? null,

          user_id: res.user?.user_id,
          full_name: res.user?.full_name
        }));

        // Si veníamos de /room-type/:id?hotelId=...
        const ret = this.route.snapshot.queryParamMap.get('returnUrl');
        if (ret) {
          this.router.navigateByUrl(ret);
          return;
        }
        // Si no hay returnUrl, ve al dashboard por rol
        this.router.navigate([this.dashboardBy(res.user?.roles)]);
      },
      error: (err) => {
        this.loading.set(false);
        const status = err?.status ?? 0;
        const errorMessage = (status === 401 || status === 403)
          ? 'Invalid credentials. Please check your email and password.'
          : 'Could not log in. Please try again.';
        this.showFlash('error', errorMessage);
      }
    });
  }

  get returnUrl() {
    return this.route.snapshot.queryParamMap.get('returnUrl') || this.router.url;
  }

}


