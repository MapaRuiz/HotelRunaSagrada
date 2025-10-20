import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RoomService } from '../../../services/room';
import { ClientInfoComponent } from './client-info/client-info';
import { AuthService } from '../../../services/auth';
import { StaffMemberService } from '../../../services/staff-member';
import { Reservation } from '../../../model/reservation';

@Component({
  selector: 'app-operator-reservation-service',
  imports: [FormsModule, CommonModule, ClientInfoComponent],
  templateUrl: './operator-reservation-service.html',
  styleUrl: './operator-reservation-service.css',
})
export class ReservationServiceComponent {
  roomNumber: string = '';
  roomQuery: string = '';
  errorMessage: string = '';
  regexRoom: RegExp = /[1-5]0[1-4]/;
  reservation: Reservation | null = null;
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
      this.reservation = null;
      return;
    } else {
      this.roomQuery = this.hotelId + '-' + this.roomNumber;
    }

    this.roomService.getReservations(this.roomQuery).subscribe({
      next: (reservations) => {
        this.reservation = reservations.length > 0 ? reservations[0] : null;
        console.log('Reservation:', reservations);
        this.errorMessage = '';
      },
    });
  }
}
