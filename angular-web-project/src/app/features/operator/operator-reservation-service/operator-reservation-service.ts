import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RoomService } from '../../../services/room';
import { AuthService } from '../../../services/auth';
import { OperatorHotelResolver } from '../../../services/operator-hotel-resolver';
import { ReservationService } from '../../../services/reservation';
import { PaymentService } from '../../../services/payment';
import { Reservation } from '../../../model/reservation';
import { SearchResultTable } from './search-result-table/search-result-table';
import { ReservationDetailOp } from '../reservation/reservation-detail-op/reservation-detail-op';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-operator-reservation-service',
  imports: [FormsModule, CommonModule, SearchResultTable, ReservationDetailOp],
  templateUrl: './operator-reservation-service.html',
  styleUrls: ['./operator-reservation-service.css', '../../../../styles.css'],
})
export class ReservationServiceComponent {
  roomNumber: string = '';
  roomQuery: string = '';
  errorMessage: string = '';
  regexRoom: RegExp = /[1-5]0[1-4]/;
  // Search state
  searchPerformed = false;
  reservations: Reservation[] = [];
  // Detail state
  selected?: Reservation;
  loading: boolean = true;
  hotelId: number = 0;
  hasHotelAccess: boolean = false;

  private auth = inject(AuthService);
  private hotelResolver = inject(OperatorHotelResolver);
  private roomService = inject(RoomService);
  private reservationService = inject(ReservationService);
  private paymentService = inject(PaymentService);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    
    // Use hotel resolver instead of manually checking staff
    this.hotelResolver.resolveHotelId().pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (hotelId) => {
        if (hotelId) {
          this.hotelId = hotelId;
          this.hasHotelAccess = true;
        } else {
          console.error('No se pudo resolver el hotel del operador');
          this.hasHotelAccess = false;
        }
      },
      error: (err) => {
        console.error('Error cargando datos del hotel', err);
        this.hasHotelAccess = false;
      }
    });
  }

  search() {
    if (this.roomNumber.length === 0) {
      return;
    }

    if (this.regexRoom.test(this.roomNumber) === false) {
      this.errorMessage = 'El número de habitación debe estar entre 101 y 504';
      this.reservations = [];
      return;
    }
    
    // Validate hotel ID is loaded
    if (!this.hotelId) {
      this.errorMessage = 'No se pudo determinar el hotel del operador';
      this.reservations = [];
      return;
    }

    // Construct query with hotel ID to ensure scoping
    this.roomQuery = this.hotelId + '-' + this.roomNumber;
    this.fetchReservations(this.roomQuery);
  }

  onOpenDetail(res: Reservation) {
    this.selected = res;
  }

  onCloseDetail() {
    this.selected = undefined;
  }

  activateReservation(reservation: Reservation): void {
    const id = reservation?.reservation_id;
    if (!id) return;
    this.reservationService.activate(id).subscribe({
      next: () => this.reloadReservations(),
      error: () => alert('Error activando la reserva'),
    });
  }

  deactivateReservation(reservation: Reservation): void {
    const id = reservation?.reservation_id;
    if (!id) return;
    this.paymentService.allPaid(id).subscribe({
      next: (sum) => {
        if (!sum?.allPaid) {
          alert('No se puede finalizar: hay pagos pendientes.');
          return;
        }
        this.reservationService.deactivate(id).subscribe({
          next: () => this.reloadReservations(),
          error: () => alert('Error desactivando la reserva'),
        });
      },
      error: () => alert('No se pudo verificar el estado de los pagos de la reserva'),
    });
  }

  private fetchReservations(query: string) {
    this.roomService.getReservations(query).subscribe({
      next: (reservations) => {
        this.reservations = reservations || [];
        console.log('Reservations:', reservations);
        this.errorMessage = this.reservations.length ? '' : 'No se encontraron reservas';
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar las reservas.';
      },
    });
  }

  private reloadReservations() {
    if (this.roomQuery) {
      this.fetchReservations(this.roomQuery);
    }
  }
}
