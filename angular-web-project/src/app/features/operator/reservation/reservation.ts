import { Component } from '@angular/core';

@Component({
  selector: 'app-reservation',
  imports: [],
  templateUrl: './reservation.html',
  styleUrl: './reservation.css',
})
export class ReservationComponent {}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'FINISHED';

const BADGE: Record<ReservationStatus, string> = {
  PENDING: 'text-bg-warning',
  CONFIRMED: 'text-bg-success',
  FINISHED: 'text-bg-success',
};

const TEXT: Record<ReservationStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  FINISHED: 'Finalizada',
};

export function getStatusBadge(status: string): string {
  return BADGE[status as ReservationStatus] ?? 'text-bg-secondary';
}

export function getStatusText(status: string): string {
  return TEXT[status as ReservationStatus] ?? (status || 'N/A');
}
