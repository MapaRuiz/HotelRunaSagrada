import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Reservation } from '../../../../model/reservation';
import { formatDisplayDate } from '../../sharedTable';

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-detail.html',
  styleUrls: ['./reservation-detail.css', '../reservation-table/reservation-table.css'],
})
export class ReservationDetail implements OnChanges {
  @Input() reservation?: Reservation;

  @Output() editRequested = new EventEmitter<Reservation>();

  readonly fallbackText = 'Sin información';

  ngOnChanges(changes: SimpleChanges): void {
    // No hay imágenes en reservations, pero mantenemos la estructura
  }

  beginEdit(): void {
    if (!this.reservation) return;
    this.editRequested.emit(this.reservation);
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'CONFIRMED': return 'Confirmada';
      default: return status || 'N/A';
    }
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'PENDING': return 'text-bg-warning';
      case 'CONFIRMED': return 'text-bg-success';
      default: return 'text-bg-secondary';
    }
  }

  formatDate(dateString?: string): string {
    return formatDisplayDate(dateString, this.fallbackText);
  }

  formatDateTime(dateString?: string): string {
    if (!dateString) return this.fallbackText;
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  calculateNights(): number {
    if (!this.reservation?.check_in || !this.reservation?.check_out) return 0;
    
    try {
      const checkIn = new Date(this.reservation.check_in);
      const checkOut = new Date(this.reservation.check_out);
      const diffTime = checkOut.getTime() - checkIn.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch {
      return 0;
    }
  }
}
