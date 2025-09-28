import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationTableComponent } from './reservation-table/reservation-table';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, ReservationTableComponent],
  templateUrl: './reservation.html',
  styleUrls: ['./reservation.css']
})
export class ReservationComponent {}
