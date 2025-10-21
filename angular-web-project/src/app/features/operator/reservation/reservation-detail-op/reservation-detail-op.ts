import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Reservation } from '../../../../model/reservation';
import { ReservationService } from '../../../../services/reservation';
import { ServicesAddForm } from '../services-add-form/services-add-form';
import { ReservationServicesTable } from '../reservation-services-table/reservation-services-table';
import { ReservationFacade, getStatusBadge, getStatusText } from '../reservation';
import { UserDetailComponent } from '../../../admin/users/user-detail/user-detail';

@Component({
  selector: 'app-reservation-detail-op',
  standalone: true,
  imports: [CommonModule, ServicesAddForm, UserDetailComponent, ReservationServicesTable],
  templateUrl: './reservation-detail-op.html',
  styleUrls: [
    './reservation-detail-op.css',
    '../../../admin/reservation/reservation-detail/reservation-detail.css',
    '../../../admin/reservation/reservation-table/reservation-table.css',
  ],
})
export class ReservationDetailOp {
  @Input() reservation?: Reservation;
  @ViewChild(ReservationServicesTable) servicesTable?: ReservationServicesTable;

  @Output() servicesModified = new EventEmitter<ReservationService[]>();
  @Output() addServicesRequested = new EventEmitter<Reservation>();
  @Output() editingChanged = new EventEmitter<boolean>();
  @Output() closeRequested = new EventEmitter<void>();

  editingServices = false;

  badge = getStatusBadge;
  text = getStatusText;

  private facade = inject(ReservationFacade);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reservation'] && this.reservation?.reservation_id) {
      // Load services via facade to keep data fresh
      const rid = this.reservation.reservation_id;
      this.facade.getReservationServices(rid).subscribe({
        next: (svcs) => {
          if (this.reservation) {
            // attach fetched services into the current reservation for template reuse
            (this.reservation as any).services = svcs;
          }
        },
        error: () => {
          // ignore errors here; UI will show empty services
        },
      });
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return this.fallbackText;

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  readonly fallbackText = 'Sin información';

  addServices() {
    if (this.reservation) {
      this.addServicesRequested.emit(this.reservation);
    }
    this.editingServices = true;
    this.editingChanged.emit(true);
  }

  closeServices() {
    this.editingServices = false;
    this.editingChanged.emit(false);
  }

  closeDetail() {
    this.closeRequested.emit();
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

  // Triggered when the collapse containing the services table is shown
  onServicesCollapseShown() {
    this.servicesTable?.onContainerShown();
  }
}
