import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RoomService, ReservationLookupPayload } from '../../../services/room';
import { ClientInfoComponent } from './client-info/client-info';

@Component({
  selector: 'app-operator-reservation-service',
  imports: [FormsModule, CommonModule, ClientInfoComponent],
  templateUrl: './operator-reservation-service.html',
  styleUrl: './operator-reservation-service.css'
})
export class ReservationServiceComponent {
  roomNumber: string = '';
  errorMessage: string = '';
  reservation: ReservationLookupPayload | null = null;

  constructor(private roomService: RoomService) {}

  search() {
    this.roomService.getTodayReservation(this.roomNumber).subscribe({
      next: (res) => {
        this.errorMessage = '';
        this.reservation = res;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'No se encontró una reserva activa para la habitación indicada.';
        this.reservation = null;
      }
    });
  }
}
