import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ReservationService } from '../../../services/reservation';
import { PaymentService } from '../../../services/payment';
import { PaymentMethodService } from '../../../services/payment-method';
import { HotelsService } from '../../../services/hotels';
import { RoomService } from '../../../services/room';
import { Reservation } from '../../../model/reservation';
import { Payment } from '../../../model/payment';
import { PaymentMethod } from '../../../model/payment-method';
import { Hotel } from '../../../model/hotel';
import { Room } from '../../../model/room';

@Component({
  selector: 'app-reservation-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reservation-confirmation.html',
  styleUrls: ['./reservation-confirmation.scss']
})
export class ReservationConfirmationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reservationSvc = inject(ReservationService);
  private paymentSvc = inject(PaymentService);
  private paymentMethodSvc = inject(PaymentMethodService);
  private hotelSvc = inject(HotelsService);
  private roomSvc = inject(RoomService);

  // Datos
  reservationId: number | null = null;
  paymentId: number | null = null;
  reservation: Reservation | null = null;
  payment: Payment | null = null;
  paymentMethod: PaymentMethod | null = null;
  hotel: Hotel | null = null;
  room: Room | null = null;
  confirmationCode: string = '';

  // Precios
  subtotal: number = 0;
  taxes: number = 0;
  total: number = 0;

  // Estados
  isLoading = true;
  loadError = '';

  ngOnInit() {
    this.reservationId = Number(this.route.snapshot.queryParamMap.get('reservationId'));
    this.paymentId = Number(this.route.snapshot.queryParamMap.get('paymentId'));

    if (!this.reservationId) {
      this.loadError = 'No se encontró el ID de la reserva.';
      this.isLoading = false;
      return;
    }

    this.loadReservation();
  }

  private loadReservation(): void {
    this.reservationSvc.getById(this.reservationId!).subscribe({
      next: (reservation) => {
        this.reservation = reservation;
        this.generateConfirmationCode();

        // Cargar hotel y habitación
        if (reservation.hotel_id) {
          console.log(reservation.hotel_id);
          this.loadHotel(reservation.hotel_id);
        }

        if (reservation.room_id) {
          this.loadRoom(reservation.room_id);
        }

        if (this.paymentId) {
          this.loadPayment();
        } else if (this.reservation.payments && this.reservation.payments.length > 0) {
          this.payment = this.reservation.payments[0];
          this.loadPaymentMethod();
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error loading reservation:', err);
        this.loadError = 'Error al cargar la reserva.';
        this.isLoading = false;
      }
    });
  }

  private loadHotel(hotelId: number): void {
    this.hotelSvc.get(hotelId).subscribe({
      next: (hotel) => {
        this.hotel = hotel;
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error loading hotel:', err);
        this.checkLoadingComplete();
      }
    });
  }

  private loadRoom(roomId: number): void {
    this.roomSvc.getById(roomId).subscribe({
      next: (room) => {
        this.room = room;
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error loading room:', err);
        this.checkLoadingComplete();
      }
    });
  }

  private loadPayment(): void {
    this.paymentSvc.getById(this.paymentId!).subscribe({
      next: (payment) => {
        this.payment = payment;
        this.calculatePrices();
        this.loadPaymentMethod();
      },
      error: (err) => {
        console.error('Error loading payment:', err);
        this.checkLoadingComplete();
      }
    });
  }

  private loadPaymentMethod(): void {
    if (!this.payment || !this.payment.payment_method_id) {
      this.checkLoadingComplete();
      return;
    }

    this.paymentMethodSvc.getById(this.payment.payment_method_id).subscribe({
      next: (method) => {
        this.paymentMethod = method;
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error loading payment method:', err);
        this.checkLoadingComplete();
      }
    });
  }

  private checkLoadingComplete(): void {
    // Verificar si todos los datos necesarios ya se han cargado
    const paymentLoaded = !this.paymentId || this.payment !== null;
    const hotelLoaded = !this.reservation?.hotel_id || this.hotel !== null;
    const roomLoaded = !this.reservation?.room_id || this.room !== null;

    // Actualizar el estado de carga
    this.isLoading = !(paymentLoaded && hotelLoaded && roomLoaded);
  }

  private calculatePrices(): void {
    if (this.payment) {
      this.total = this.payment.amount;
      this.taxes = this.total * 0.18;
      this.subtotal = this.total - this.taxes;
    }
  }

  private generateConfirmationCode(): void {
    // Generar un código de confirmación alfanumérico
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.confirmationCode = code;
  }

  getPaymentTypeIcon(type: string | undefined): string {
    if (!type) return '💳';

    const icons: { [key: string]: string } = {
      'TARJETA': '💳',
      'PAYPAL': '🅿️',
      'EFECTIVO': '💵'
    };
    return icons[type] || '💳';
  }

  getPaymentTypeName(type: string | undefined): string {
    if (!type) return 'Tarjeta';

    const names: { [key: string]: string } = {
      'TARJETA': 'Tarjeta de Crédito/Débito',
      'PAYPAL': 'PayPal',
      'EFECTIVO': 'Efectivo'
    };
    return names[type] || type;
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToReservations(): void {
    this.router.navigate(['/client/reservations']);
  }

  printConfirmation(): void {
    window.print();
  }
}