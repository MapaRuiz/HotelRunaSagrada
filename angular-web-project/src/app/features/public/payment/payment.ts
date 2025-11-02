import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { PaymentService } from '../../../services/payment';
import { PaymentMethodService } from '../../../services/payment-method';
import { ReservationService } from '../../../services/reservation';
import { UsersService } from '../../../services/users';
import { AmenitiesService } from '../../../services/amenities';
import { PaymentMethod } from '../../../model/payment-method';
import { Reservation } from '../../../model/reservation';
import { User } from '../../../model/user';
import { Amenity } from '../../../model/amenity';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './payment.html',
  styleUrls: ['./payment.scss'],
})
export class PaymentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentSvc = inject(PaymentService);
  private paymentMethodSvc = inject(PaymentMethodService);
  private reservationSvc = inject(ReservationService);
  private usersSvc = inject(UsersService);
  private amenitiesSvc = inject(AmenitiesService);

  // Base del backend para imágenes
  private backendBase =
    (environment as any).backendBaseUrl ||
    (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  // Datos
  reservationId: number | null = null;
  reservation: Reservation | null = null;
  currentUser: User | null = null;
  paymentMethods: PaymentMethod[] = [];

  // ✨ Amenities disponibles y seleccionados
  availableAmenities: Amenity[] = [];
  selectedAmenities: Set<number> = new Set();
  amenitiesTotal: number = 0;
  readonly AMENITY_PRICE = 50000; // Precio por amenity en COP

  // Formulario
  selectedPaymentMethodId: number | null = null;
  showNewPaymentForm = false;
  newPaymentMethod = {
    type: 'TARJETA' as 'TARJETA' | 'PAYPAL' | 'EFECTIVO',
    holderName: '',
    last4: '',
    billingAddress: '',
  };

  // Tarjeta nueva
  cardNumber = '';
  cardExpiry = '';
  cardCVV = '';

  // Estados
  isLoading = true;
  isProcessing = false;
  loadError = '';
  paymentError = '';
  paymentSuccess = false;

  // Precios
  subtotal: number = 0;
  taxes: number = 0;
  total: number = 0;

  // 🎮 Konami Code Easter Egg - Solo flechas
  private konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];
  private konamiIndex = 0;
  konamiActivated = false;
  showKonamiMessage = false;

  ngOnInit() {
    this.reservationId = Number(this.route.snapshot.queryParamMap.get('reservationId'));

    if (!this.reservationId) {
      this.loadError = 'No se encontró el ID de la reserva.';
      this.isLoading = false;
      return;
    }

    this.loadData();
    this.setupKonamiListener();
  }

  // 🎮 Setup Konami Code listener
  private setupKonamiListener(): void {
    if (this.isBrowser()) {
      console.log('🎮 Konami Code listener activado. Secuencia: ↑↑↓↓←→←→');
      console.log('📋 Código esperado:', this.konamiCode);
      window.addEventListener('keydown', (e: KeyboardEvent) => this.handleKonamiKey(e));
    }
  }

  // 🎮 Handle Konami Code input
  private handleKonamiKey(e: KeyboardEvent): void {
    if (this.konamiActivated) return; // Ya activado

    const key = e.key;
    const expectedKey = this.konamiCode[this.konamiIndex];

    // 🐛 DEBUG: Mostrar qué tecla se presionó
    console.log('🎮 Konami Debug:', {
      teclaPresionada: key,
      teclaEsperada: expectedKey,
      progreso: `${this.konamiIndex}/${this.konamiCode.length}`,
      coincide: key === expectedKey
    });

    if (key === expectedKey) {
      this.konamiIndex++;
      console.log(`✅ ¡Correcto! Progreso: ${this.konamiIndex}/${this.konamiCode.length}`);

      if (this.konamiIndex === this.konamiCode.length) {
        console.log('🎉 ¡CÓDIGO KONAMI COMPLETADO!');
        this.activateKonami();
        this.konamiIndex = 0;
      }
    } else {
      if (this.konamiIndex > 0) {
        console.log('❌ Tecla incorrecta - Reiniciando secuencia');
      }
      this.konamiIndex = 0; // Reset si falla
    }
  }

  // 🎮 Activate Konami Code bonus!
  private activateKonami(): void {
    console.log('🎮 Activando Konami Code...');
    this.konamiActivated = true;
    this.showKonamiMessage = true;

    // Recalcular solo el total (que será 0), pero mantener los valores reales
    this.updateTotal();

    console.log('💰 Precios con Konami activado:', {
      subtotal: this.subtotal,
      taxes: this.taxes,
      amenitiesTotal: this.amenitiesTotal,
      total: this.total // Este será 0
    });

    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
      this.showKonamiMessage = false;
    }, 5000);

    console.log('🎮 KONAMI CODE ACTIVATED! Free reservation! 🎉');
  }

  private loadData(): void {
    this.usersSvc.getMe().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.loadReservation();
        this.loadPaymentMethods();
        this.loadAmenities();
      },
      error: (err) => {
        console.error('Error loading user:', err);
        this.loadError = 'Error al cargar los datos del usuario.';
        this.isLoading = false;
      },
    });
  }

  private loadAmenities(): void {
    this.amenitiesSvc.list().subscribe({
      next: (amenities) => {
        // Filtrar solo amenities de tipo ROOM
        this.availableAmenities = (amenities || []).filter(
          (a) => a.type === 'ROOM'
        );
      },
      error: (err) => {
        console.error('Error loading amenities:', err);
      },
    });
  }

  private loadReservation(): void {
    this.reservationSvc.getById(this.reservationId!).subscribe({
      next: (reservation) => {
        this.reservation = reservation;
        this.calculatePrices();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading reservation:', err);
        this.loadError = 'Error al cargar la reserva.';
        this.isLoading = false;
      },
    });
  }

  private loadPaymentMethods(): void {
    this.paymentMethodSvc.getMy(this.currentUser!.user_id).subscribe({
      next: (methods) => {
        this.paymentMethods = methods ?? [];
        if (this.paymentMethods.length > 0) {
          const firstId =
            (this.paymentMethods[0] as any).method_id ??
            (this.paymentMethods[0] as any).id ??
            (this.paymentMethods[0] as any).payment_method_id;
          this.selectedPaymentMethodId = this.toNumber(firstId);
          this.showNewPaymentForm = false;
        } else {
          this.selectedPaymentMethodId = null;
          this.showNewPaymentForm = true;
        }
      },
      error: (err) => console.error('Error loading payment methods:', err),
    });
  }

  private calculatePrices(): void {
    if (this.isBrowser()) {
      const priceData = localStorage.getItem('reservationPricing');
      if (priceData) {
        try {
          const pricing = JSON.parse(priceData);
          this.subtotal = pricing.subtotal || 0;
          this.taxes = pricing.taxes || 0;
          this.updateTotal();
          return;
        } catch (error) {
          console.error('Error parsing price data from localStorage:', error);
        }
      }
    }
  }

  // ✨ Alternar selección de amenity
  toggleAmenity(amenityId: number): void {
    if (this.selectedAmenities.has(amenityId)) {
      this.selectedAmenities.delete(amenityId);
    } else {
      this.selectedAmenities.add(amenityId);
    }
    this.updateTotal();
  }

  // ✨ Actualizar el total con amenities
  private updateTotal(): void {
    // Calcular amenities siempre
    this.amenitiesTotal = this.selectedAmenities.size * this.AMENITY_PRICE;
    const baseTotal = this.subtotal + this.taxes;
    
    // 🎮 Si Konami está activado, solo el total es 0 (cliente ve el valor real pero no paga)
    if (this.konamiActivated) {
      this.total = 0;
      return;
    }

    this.total = baseTotal + this.amenitiesTotal;
  }

  // ✨ Obtener URL de imagen con backend base
  getAmenityImage(amenity: Amenity): string {
    if (!amenity.image) return '';
    return amenity.image.startsWith('http')
      ? amenity.image
      : `${this.backendBase}${amenity.image}`;
  }

  // ✨ Verificar si un amenity está seleccionado
  isAmenitySelected(amenityId: number): boolean {
    return this.selectedAmenities.has(amenityId);
  }

  toggleNewPaymentForm(): void {
    if (!this.showNewPaymentForm) {
      this.selectedPaymentMethodId = null;
    } else {
      if (this.paymentMethods.length) {
        const firstId =
          (this.paymentMethods[0] as any).method_id ??
          (this.paymentMethods[0] as any).id ??
          (this.paymentMethods[0] as any).payment_method_id;
        this.selectedPaymentMethodId = this.toNumber(firstId);
      }
    }
    this.showNewPaymentForm = !this.showNewPaymentForm;
  }

  formatCardNumber(): void {
    this.cardNumber = this.cardNumber
      .replace(/\s/g, '')
      .replace(/(\d{4})/g, '$1 ')
      .trim();
  }

  formatExpiry(): void {
    this.cardExpiry = this.cardExpiry.replace(/\//g, '').replace(/(\d{2})(\d)/, '$1/$2');
  }

  async processPayment(): Promise<void> {
    this.paymentError = '';
    this.isProcessing = true;

    try {
      if (!this.showNewPaymentForm && !this.selectedPaymentMethodId && this.paymentMethods.length) {
        const firstId =
          (this.paymentMethods[0] as any).method_id ??
          (this.paymentMethods[0] as any).id ??
          (this.paymentMethods[0] as any).payment_method_id;
        this.selectedPaymentMethodId = this.toNumber(firstId);
      }

      let paymentMethodId = this.selectedPaymentMethodId;

      if (this.showNewPaymentForm) {
        const last4 = this.cardNumber.replace(/\s/g, '').slice(-4);

        const newMethod = await firstValueFrom(
          this.paymentMethodSvc.create({
            user_id: this.currentUser!.user_id!,
            type: this.newPaymentMethod.type,
            holder_name: this.newPaymentMethod.holderName,
            last4,
            billing_address: this.newPaymentMethod.billingAddress,
          })
        );

        const newId =
          (newMethod as any).method_id ??
          (newMethod as any).id ??
          (newMethod as any).payment_method_id;
        paymentMethodId = this.toNumber(newId);

        if (!Number.isFinite(paymentMethodId)) {
          throw new Error('No se pudo obtener el ID del nuevo método de pago.');
        }
      }

      if (paymentMethodId == null || Number.isNaN(paymentMethodId)) {
        this.paymentError = 'Debe seleccionar un método de pago.';
        this.isProcessing = false;
        return;
      }

      // 🎮 Referencia especial si Konami está activado
      const txRef = this.konamiActivated 
        ? '🎮KONAMI-FREE-' + this.reservationId 
        : 'RESERVATION-' + this.reservationId;

      const payment = await firstValueFrom(
        this.paymentSvc.create({
          reservation_id: this.reservationId!,
          payment_method_id: paymentMethodId,
          amount: this.total, // Ya es 0 si Konami está activado
          status: 'PAID',
          tx_reference: txRef,
        })
      );

      // Actualizar el estado de la reserva a confirmado
      await firstValueFrom(this.reservationSvc.updateStatus(this.reservationId!, 'CONFIRMED'));

      this.paymentSuccess = true;
      this.isProcessing = false;

      if (this.isBrowser()) localStorage.removeItem('reservationPricing');

      setTimeout(() => {
        this.router.navigate(['/reservation-confirmation'], {
          queryParams: {
            reservationId: this.reservationId,
            paymentId: payment.payment_id,
          },
        });
      }, 2000);
    } catch (error: any) {
      console.error('Error processing payment:', error);
      this.paymentError =
        error?.error?.message || error?.message || 'Error al procesar el pago. Intente nuevamente.';
      this.isProcessing = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/reservation-summary'], {
      queryParams: { reservationId: this.reservationId },
    });
  }

  formatCurrency(amount: number): string {
    return (
      new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
        .format(amount)
        .replace('COP', '')
        .trim() + ' COP'
    );
  }

  getPaymentTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      TARJETA: '💳',
      PAYPAL: '🅿️',
      EFECTIVO: '💵',
    };
    return icons[type] || '💳';
  }

  getPaymentTypeName(type: string): string {
    const names: { [key: string]: string } = {
      TARJETA: 'Tarjeta de Crédito/Débito',
      PAYPAL: 'PayPal',
      EFECTIVO: 'Efectivo',
    };
    return names[type] || type;
  }

  toNumber(v: any): number {
    return typeof v === 'number' ? v : Number(v);
  }
  trackMethod = (_: number, m: PaymentMethod) =>
    this.toNumber((m as any).method_id ?? (m as any).id ?? (m as any).payment_method_id);
  
  trackAmenity = (_: number, a: Amenity) => a.amenity_id;

  get canPay(): boolean {
    if (this.isProcessing) return false;
    if (this.showNewPaymentForm) return true;
    return this.selectedPaymentMethodId != null && !Number.isNaN(this.selectedPaymentMethodId);
  }

  getMethodId(m: any): number | null {
    const raw = m?.method_id ?? m?.id ?? m?.payment_method_id;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }
}
