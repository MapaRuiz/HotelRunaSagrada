import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of, switchMap } from 'rxjs';

import { Reservation } from '../../../model/reservation';
import { ReservationService } from '../../../services/reservation';
import { UsersService } from '../../../services/users';
import { ReservationDetail } from '../../admin/reservation/reservation-detail/reservation-detail';
import { AuthService } from '../../../services/auth';

type AlertKind = 'success' | 'danger';

@Component({
  selector: 'app-client-reservation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReservationDetail],
  templateUrl: './client-reservation.html',
  styleUrls: ['./client-reservation.css'],
})
export class ClientReservationComponent implements OnInit {
  @Output() changes = new EventEmitter<void>();

  private users = inject(UsersService);
  private reservationsApi = inject(ReservationService);
  private auth = inject(AuthService);

  loading = false;
  saving = false;
  deletingId?: number;
  showDetail = false;
  private returnToDetailAfterEdit = false;

  reservations: Reservation[] = [];
  selected?: Reservation;
  editing?: Reservation;
  draft: Partial<Reservation> = this.emptyDraft();

  statusOptions: Reservation['status'][] = [
    'PENDING',
    'CONFIRMED',
    'CHECKIN',
    'FINISHED',
  ];

  alert: { kind: AlertKind; message: string } | null = null;
  private meId?: number;

  ngOnInit(): void {
    this.loadReservations();
  }

  select(reservation: Reservation): void {
    this.selected = reservation;
  }

  viewDetails(reservation: Reservation, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.select(reservation);
    this.editing = undefined;
    this.draft = this.emptyDraft();
    this.returnToDetailAfterEdit = false;
    this.showDetail = true;
  }

  backToList(): void {
    this.showDetail = false;
    this.returnToDetailAfterEdit = false;
  }

  beginEdit(reservation: Reservation): void {
    this.returnToDetailAfterEdit = this.showDetail;
    this.showDetail = false;
    this.editing = reservation;
    this.draft = {
      reservation_id: reservation.reservation_id,
      check_in: this.formatDateForInput(reservation.check_in),
      check_out: this.formatDateForInput(reservation.check_out),
      status: reservation.status,
      user_id: reservation.user_id,
      hotel_id: reservation.hotel_id,
      room_id: reservation.room_id,
    };
  }

  cancelEdit(): void {
    this.editing = undefined;
    this.draft = this.emptyDraft();
    if (this.returnToDetailAfterEdit) {
      this.showDetail = true;
      this.returnToDetailAfterEdit = false;
    }
  }

  saveEdit(): void {
    if (!this.editing?.reservation_id) return;
    if (
      !this.draft.check_in ||
      !this.draft.check_out ||
      !this.draft.status ||
      !this.draft.user_id ||
      !this.draft.hotel_id ||
      !this.draft.room_id
    ) {
      this.showAlert('danger', 'Completa la información antes de guardar.');
      return;
    }

    this.saving = true;
    const payload: Partial<Reservation> = {
      user_id: this.draft.user_id,
      hotel_id: this.draft.hotel_id,
      room_id: this.draft.room_id,
      check_in: this.draft.check_in,
      check_out: this.draft.check_out,
      status: this.draft.status,
    };

    this.reservationsApi
      .update(this.editing.reservation_id, payload)
      .subscribe({
        next: (updated) => {
          const mapped = this.mapReservation(updated);
          this.reservations = this.reservations.map((r) =>
            r.reservation_id === mapped.reservation_id ? mapped : r
          );
          this.editing = undefined;
          this.draft = this.emptyDraft();
          this.saving = false;
          this.selected =
            this.selected?.reservation_id === mapped.reservation_id
              ? mapped
              : this.selected;
          this.showAlert('success', 'Reserva actualizada correctamente.');
          this.changes.emit();
          if (this.returnToDetailAfterEdit) {
            this.showDetail = true;
            this.returnToDetailAfterEdit = false;
            this.selected = mapped;
          }
        },
        error: (error) => {
          console.error('Error updating reservation', error);
          this.showAlert('danger', 'No se pudo actualizar la reserva.');
          this.saving = false;
        },
      });
  }

  deleteReservation(reservation: Reservation): void {
    if (!reservation?.reservation_id) return;
    const confirmed = confirm(
      `¿Deseas cancelar la reserva #${reservation.reservation_id}?`
    );
    if (!confirmed) return;

    this.deletingId = reservation.reservation_id;
    this.reservationsApi.delete(reservation.reservation_id).subscribe({
      next: () => {
        this.reservations = this.reservations.filter(
          (r) => r.reservation_id !== reservation.reservation_id
        );
        if (this.selected?.reservation_id === reservation.reservation_id) {
          this.selected = undefined;
        }
        if (this.editing?.reservation_id === reservation.reservation_id) {
          this.cancelEdit();
        }
        if (this.showDetail) {
          this.backToList();
        }
        this.returnToDetailAfterEdit = false;
        this.deletingId = undefined;
        this.showAlert('success', 'Reserva cancelada correctamente.');
        this.changes.emit();
      },
      error: (error) => {
        console.error('Error deleting reservation', error);
        this.showAlert('danger', 'No se pudo eliminar la reserva.');
        this.deletingId = undefined;
      },
    });
  }

  isEditing(reservation: Reservation): boolean {
    return (
      !!this.editing &&
      this.editing.reservation_id === reservation.reservation_id
    );
  }

  formatStatus(status: Reservation['status']): string {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'CONFIRMED':
        return 'Confirmada';
      case 'CHECKIN':
        return 'Check-in';
      case 'FINISHED':
        return 'Finalizada';
      default:
        return status;
    }
  }

  badgeClass(status: Reservation['status']): string {
    switch (status) {
      case 'PENDING':
        return 'bg-warning text-dark';
      case 'CONFIRMED':
        return 'bg-success';
      case 'CHECKIN':
        return 'bg-info text-dark';
      case 'FINISHED':
        return 'bg-secondary';
      default:
        return 'bg-light text-dark';
    }
  }

  formatDate(value?: string): string {
    if (!value) return 'Sin definir';
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
    } catch {
      return value;
    }
  }

  private loadReservations(): void {
    this.loading = true;
    const snapshot = this.auth.userSnapshot();
    if (snapshot?.user_id) {
      this.meId = snapshot.user_id;
      this.fetchReservations(this.meId);
      return;
    }

    this.users
      .getMe()
      .pipe(
        switchMap((user) => {
          this.meId = user?.user_id;
          if (!this.meId) {
            throw new Error('Usuario no autenticado');
          }
          return this.reservationsApi.getByUser(this.meId);
        }),
        catchError((error) => {
          console.error('Error loading client reservations', error);
          this.showAlert(
            'danger',
            'No se pudieron cargar tus reservas. Inicia sesión nuevamente.'
          );
          this.loading = false;
          return of([]);
        })
      )
      .subscribe((list) => {
        this.reservations = (list || []).map((r, idx) =>
          this.mapReservation(r, idx)
        );
        this.loading = false;
      });
  }

  private fetchReservations(userId: number): void {
    this.reservationsApi
      .getByUser(userId)
      .pipe(
        catchError((error) => {
          console.error('Error loading client reservations', error);
          this.showAlert(
            'danger',
            'No se pudieron cargar tus reservas. Intenta más tarde.'
          );
          return of([]);
        })
      )
      .subscribe((list) => {
        this.reservations = (list || []).map((r, idx) =>
          this.mapReservation(r, idx)
        );
        this.loading = false;
      });
  }

  private mapReservation(raw: any, index?: number): Reservation {
    const fallback = index != null ? 1000 + index : undefined;
    const reservationId =
      this.toInt(raw?.reservation_id ?? raw?.reservationId ?? raw?.id) ??
      fallback ??
      0;
    const userId =
      this.toInt(
        raw?.user_id ??
          raw?.userId ??
          raw?.user?.user_id ??
          raw?.user?.userId ??
          this.meId
      ) ?? this.meId;
    const hotelId =
      this.toInt(
        raw?.hotel_id ??
          raw?.hotelId ??
          raw?.hotel?.hotel_id ??
          raw?.hotel?.hotelId ??
          raw?.room?.hotel_id ??
          raw?.room?.hotelId
      ) ?? 0;
    const roomId =
      this.toInt(
        raw?.room_id ?? raw?.roomId ?? raw?.room?.room_id ?? raw?.room?.roomId
      ) ?? 0;

    return {
      reservation_id: reservationId,
      user_id: userId ?? 0,
      hotel_id: hotelId,
      room_id: roomId,
      check_in: raw?.check_in ?? raw?.checkIn ?? '',
      check_out: raw?.check_out ?? raw?.checkOut ?? '',
      status: (raw?.status ?? 'PENDING') as Reservation['status'],
      created_at: raw?.created_at ?? raw?.createdAt,
      hotel: raw?.hotel,
      room: raw?.room,
      user: raw?.user,
      services: raw?.services,
      payments: raw?.payments,
    } satisfies Reservation;
  }

  private toInt(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private formatDateForInput(date?: string): string | undefined {
    if (!date) return undefined;
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private emptyDraft(): Partial<Reservation> {
    return {
      status: undefined,
      check_in: undefined,
      check_out: undefined,
      room_id: undefined,
      hotel_id: undefined,
      user_id: undefined,
    };
  }

  private showAlert(kind: AlertKind, message: string): void {
    this.alert = { kind, message };
    setTimeout(() => {
      if (this.alert?.message === message) {
        this.alert = null;
      }
    }, 4000);
  }
}
