import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RoomService } from '../../../services/room';
import { AuthService } from '../../../services/auth';
import { StaffMemberService } from '../../../services/staff-member';
import { ReservationService } from '../../../services/reservation';
import { PaymentService } from '../../../services/payment';
import { Reservation } from '../../../model/reservation';
import { SearchResultTable } from './search-result-table/search-result-table';
import { ReservationDetailOp } from '../reservation/reservation-detail-op/reservation-detail-op';

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

  private auth = inject(AuthService);
  constructor(
    private roomService: RoomService,
    private staffService: StaffMemberService,
    private reservationService: ReservationService,
    private paymentService: PaymentService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    const uid = this.auth.userSnapshot()?.user_id;
    if (!uid) {
      this.loading = false;
      return;
    }

    this.staffService.getByUser(uid).subscribe({
      next: (staff) => {
        this.hotelId = staff.hotel_id;
        this.loading = false;
      },
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
    } else {
      this.roomQuery = this.hotelId + '-' + this.roomNumber;
    }

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
