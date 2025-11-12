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
import { roleNames } from '../../../utils/roles';

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
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const user = this.auth.userSnapshot() ?? this.readStoredUser();
    if (!user) return;

    const roles = roleNames(user.roles);
    if (roles.includes('ADMIN')) {
      this.router.navigate(['/admin']);
      return;
    }
    if (roles.includes('OPERATOR')) {
      this.router.navigate(['/operator']);
    }
  }

  private readStoredUser() {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
