import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { User } from '../../../model/user';
import { UsersService } from '../../../services/users';
import { PaymentMethod } from '../../../model/payment-method';
import { PaymentMethodService, PaymentMethodRequest } from '../../../services/payment-method';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-client-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './client-profile.html',
  styleUrls: ['./client-profile.css'],
})
export class ClientProfileComponent implements OnInit {
  private api = inject(UsersService);
  private paymentApi = inject(PaymentMethodService);
  private router = inject(Router);

  me: User | null = null;
  editTouched = false;
  imgBroken = false;

  paymentMethods: PaymentMethod[] = [];
  editingPayment: PaymentMethod | null = null;

  private backendBase =
    (environment as any).backendBaseUrl ||
    (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  draft: {
    full_name?: string;
    phone?: string;
    national_id?: string;
    selected_pet?: string;
  } = {};

  ngOnInit() {
    this.loadProfile();
  }

  /** Cargar datos del usuario */
  loadProfile() {
    this.api.getMe().subscribe({
      next: (u) => {
        this.me = u;
        this.draft = {
          full_name: u.full_name ?? '',
          phone: u.phone ?? '',
          national_id: u.national_id ?? '',
          selected_pet: u.selected_pet ?? '',
        };
        this.loadPayments();
      },
      error: (err) => {
        if (err?.status === 401) {
          localStorage.removeItem('user');
          this.router.navigate(['/login'], { queryParams: { returnUrl: '/client/profile' } });
        }
      }
    });
  }

  /** Cargar métodos de pago del cliente */
  loadPayments() {
    if (!this.me?.user_id) return;
    this.paymentApi.getMy(this.me.user_id).subscribe({
      next: (data) => {
        this.paymentMethods = data;
        console.log('Métodos de pago cargados:', data);
      },
      error: (err) => {
        console.error('Error al cargar métodos de pago:', err);
        this.paymentMethods = [];
      },
    });
  }

  img(path?: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.backendBase}${path}`;
  }

  /** Guardar cambios de perfil */
  save(f: NgForm) {
    this.editTouched = true;

    const body: any = {
      full_name: this.draft.full_name,
      phone: this.draft.phone,
      national_id: this.draft.national_id,
      selected_pet: this.draft.selected_pet,
    };

    this.api.updateMe(body).subscribe({
      next: (upd) => {
        this.me = upd;
        this.editTouched = false;

        const prev = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...prev,
          id: upd.user_id,
          user_id: upd.user_id,
          name: upd.full_name,
          full_name: upd.full_name
        }));

        alert('Perfil actualizado con éxito');
      },
      error: (err) => alert(err?.error?.message || 'Error al actualizar perfil'),
    });
  }

  /** Eliminar cuenta */
  deleteAccount() {
    if (!confirm('¿Seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) return;
    this.api.deleteMe(true).subscribe({
      next: () => {
        localStorage.removeItem('user');
        alert('Cuenta eliminada');
        this.router.navigate(['/']);
      },
      error: (err) => alert(err?.error?.message || 'Error al eliminar cuenta'),
    });
  }

  // ------------------------
  // MÉTODOS DE PAGO CLIENTE
  // ------------------------

  startAddPayment() {
    this.editingPayment = { type: 'TARJETA', last4: '', holder_name: '' } as PaymentMethod;
  }

  startEditPayment(p: PaymentMethod) {
    this.editingPayment = { ...p };
  }

  cancelEditPayment() {
    this.editingPayment = null;
  }

  savePayment() {
    if (!this.editingPayment || !this.me) return;

    const data: PaymentMethodRequest = {
      user_id: this.me.user_id,
      type: this.editingPayment.type as 'TARJETA' | 'PAYPAL' | 'EFECTIVO',
      last4: this.editingPayment.last4 ?? undefined,
      holder_name: this.editingPayment.holder_name ?? undefined,
      billing_address: this.editingPayment.billing_address ?? undefined,
    };

    const req = this.editingPayment.method_id
      ? this.paymentApi.update(this.editingPayment.method_id, data)
      : this.paymentApi.create(data);

    req.subscribe({
      next: (saved) => {
        alert('Método de pago guardado correctamente');
        this.editingPayment = null;

        const existing = this.paymentMethods.find(p => p.method_id === saved.method_id);
        if (existing) {
          Object.assign(existing, saved);
        } else {
          this.paymentMethods.push(saved);
        }
      },
      error: (err) => alert(err?.error?.message || 'Error al guardar método de pago'),
    });
  }

  deletePayment(p: PaymentMethod) {
    if (!p.method_id) {
      alert('No se puede eliminar: el método de pago no tiene un ID válido.');
      return;
    }

    if (!confirm('¿Eliminar este método de pago?')) return;
    this.paymentApi.delete(p.method_id).subscribe({
      next: () => {
        alert('Método eliminado');
        this.paymentMethods = this.paymentMethods.filter(x => x.method_id !== p.method_id);
      },
      error: (err) => alert(err?.error?.message || 'Error al eliminar método'),
    });
  }
}
