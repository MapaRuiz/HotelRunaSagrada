import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RoomService } from '../../../services/room';
import { AuthService } from '../../../services/auth';
import { StaffMemberService } from '../../../services/staff-member';
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
  constructor(private roomService: RoomService, private staffService: StaffMemberService) {}

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
    if (this.regexRoom.test(this.roomNumber) === false) {
      this.errorMessage = 'El número de habitación debe estar entre 101 y 504';
      this.reservations = [];
      this.searchPerformed = false;
      return;
    } else {
      this.roomQuery = this.hotelId + '-' + this.roomNumber;
    }

    this.roomService.getReservations(this.roomQuery).subscribe({
      next: (reservations) => {
        this.reservations = reservations || [];
        this.searchPerformed = true;
        console.log('Reservations:', reservations);
        this.errorMessage = '';
      },
    });
  }

  onOpenDetail(res: Reservation) {
    this.selected = res;
  }

  onCloseDetail() {
    this.selected = undefined;
  }
}
