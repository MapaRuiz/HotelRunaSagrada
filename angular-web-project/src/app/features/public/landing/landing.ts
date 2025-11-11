import { Component, OnInit, inject } from '@angular/core';
import { Primera } from './primera/primera';
import { Hoteles } from './hoteles/hoteles';
import { Details } from './details/details';
import { Stats } from './stats/stats';
import { Servicios } from './servicios/servicios';
import { Testimonials } from './testimonials/testimonials';
import { Footer } from './footer/footer';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-landing',
  imports: [Primera, Hoteles, Details, Stats, Servicios, Testimonials, Footer],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class Landing implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    try {
      // Detectar token/usuario (solo en browser)
      const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('access_token');
      const rawUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

      // Preferir snapshot del servicio, fallback a localStorage
      let user = this.auth.userSnapshot() as any;
      if (!user && rawUser) {
        try { user = JSON.parse(rawUser); } catch (e) { user = null; }
      }

      if (hasToken || user) {
        // Calcular rol
        let roleName = 'CLIENT';
        try {
          if (user?.roles && Array.isArray(user.roles) && user.roles.length > 0) {
            const r = user.roles[0];
            roleName = typeof r === 'string' ? r : (r.name || r?.role || r?.role_id ? 'OPERATOR' : 'CLIENT');
          }
        } catch {}

        // Hacer logout para limpiar token/session
        this.auth.logout();

        // Redirigir según rol detectado
        const rn = (roleName || '').toString().toUpperCase();
        if (rn.includes('ADMIN')) this.router.navigate(['/admin']);
        else if (rn.includes('OPERATOR')) this.router.navigate(['/operator']);
        else this.router.navigate(['/client']);
      }
    } catch (err) {
      // No bloquear la carga si algo falla
      console.error('Landing init redirect error:', err);
    }
  }

}
