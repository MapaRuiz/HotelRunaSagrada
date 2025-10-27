import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ReservationService } from '../../../services/reservation';
import { PaymentService } from '../../../services/payment';
import { PaymentMethodService } from '../../../services/payment-method';
import { RoomService } from '../../../services/room';
import { RoomTypeService } from '../../../services/room-type';
import { Reservation } from '../../../model/reservation';
import { Payment } from '../../../model/payment';
import { PaymentMethod } from '../../../model/payment-method';
import { Hotel } from '../../../model/hotel';
import { Room } from '../../../model/room';
import { RoomType } from '../../../model/room-type';

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
  private roomSvc = inject(RoomService);
  private roomTypeSvc = inject(RoomTypeService);


  // Datos
  reservationId: number | null = null;
  paymentId: number | null = null;
  reservation: Reservation | null = null;
  payment: Payment | null = null;
  paymentMethod: PaymentMethod | null = null;
  hotel: Hotel | null = null;
  room: Room | null = null;
  roomType: RoomType | null = null;
  confirmationCode: string = '';

  // Precios
  subtotal: number = 0;
  taxes: number = 0;
  total: number = 0;

  // Estados
  isLoading = true;
  loadError = '';
  isSendingReceipt = false;

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

  //Esto lo tengo que revisar 
  private loadReservation(): void {
    this.reservationSvc.getById(this.reservationId!).subscribe({
      next: (reservation) => {
        this.reservation = reservation;
        this.generateConfirmationCode();

        if (reservation.room?.room_id) {
          this.roomSvc.getById(reservation.room.room_id).subscribe({
            next: (room) => {
              this.room = room;
              if (room.room_type_id !== undefined) {
                this.roomTypeSvc.getById(room.room_type_id).subscribe({
                  next: (roomType) => {
                    this.roomType = roomType;
                    this.isLoading = false;
                    this.sendReceiptAutomatically();
                  },
                  error: (err) => {
                    console.error('Error loading room type:', err);
                    this.isLoading = false;
                    this.sendReceiptAutomatically();
                  }
                });
              } else {
                console.warn('room_type_id está undefined');
                this.isLoading = false;
                this.sendReceiptAutomatically();
              }
            },
            error: (err) => {
              console.error('Error loading room:', err);
            }
          });
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
  private loadPayment(): void {
    this.paymentSvc.getById(this.paymentId!).subscribe({
      next: (payment) => {
        this.payment = payment;
        this.calculatePrices();
        this.loadPaymentMethod();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading payment:', err);
        this.isLoading = false;
      }
    });
  }

  private loadPaymentMethod(): void {
    if (!this.payment || !this.payment.payment_method_id) {
      this.isLoading = false;
      return;
    }

    this.paymentMethodSvc.getById(this.payment.payment_method_id).subscribe({
      next: (method) => {
        this.paymentMethod = method;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading payment method:', err);
        this.isLoading = false;
      }
    });
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

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToReservations(): void {
    this.router.navigate(['/client']);
  }

  printConfirmation(): void {
    window.print();
  }

  onSendReceipt(): void {
    if (!this.reservationId) return;
    this.isSendingReceipt = true;
    this.reservationSvc.sendReceipt(this.reservationId, true, this.confirmationCode).subscribe({
      next: () => {
        this.isSendingReceipt = false;
        // Simple feedback - replace with nicer toast if available
        alert('Recibo enviado correctamente a su correo.');
      },
      error: (err) => {
        console.error('Error sending receipt:', err);
        this.isSendingReceipt = false;
        alert('No se pudo enviar el recibo. Intente más tarde.');
      }
    });
  }

  private sendReceiptAutomatically(): void {
    if (!this.reservationId || this.isSendingReceipt) return;
    this.isSendingReceipt = true;
    this.reservationSvc.sendReceipt(this.reservationId, true, this.confirmationCode).subscribe({
      next: () => {
        console.log('Recibo enviado automáticamente');
        this.isSendingReceipt = false;
      },
      error: (err) => {
        console.error('Error enviando recibo automáticamente:', err);
        this.isSendingReceipt = false;
      }
    });
  }
}