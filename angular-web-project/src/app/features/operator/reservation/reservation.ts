import { Component, Injectable, inject } from '@angular/core';
import { forkJoin, map, of, switchMap, Subject } from 'rxjs';
import { Reservation } from '../../../model/reservation';
import { ReservationServiceApi } from '../../../services/reservation-service';
import { ReservationService as ReservationServiceModel } from '../../../model/reservation-service';
import { ReservationService } from '../../../services/reservation';
import { StaffMemberService } from '../../../services/staff-member';
import { HotelsService } from '../../../services/hotels';
import { UsersService } from '../../../services/users';
import { RoomService } from '../../../services/room';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-reservation',
  imports: [],
  templateUrl: './reservation.html',
  styleUrl: './reservation.css',
})
export class ReservationComponent {}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CHECKIN' | 'FINISHED';

const BADGE: Record<ReservationStatus, string> = {
  PENDING: 'text-bg-warning',
  CONFIRMED: 'text-bg-warning',
  CHECKIN: 'text-bg-info',
  FINISHED: 'text-bg-success',
};

const TEXT: Record<ReservationStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CHECKIN: 'Check-in',
  FINISHED: 'Finalizada',
};

export function getStatusBadge(status: string): string {
  return BADGE[status as ReservationStatus] ?? 'text-bg-secondary';
}

export function getStatusText(status: string): string {
  return TEXT[status as ReservationStatus] ?? (status || 'N/A');
}

// Facade/Orchestrator for reservation-related API logic used by operator features
@Injectable({ providedIn: 'root' })
export class ReservationFacade {
  private auth = inject(AuthService);
  private reservationsApi = inject(ReservationService);
  private staffService = inject(StaffMemberService);
  private hotelsService = inject(HotelsService);
  private usersService = inject(UsersService);
  private roomService = inject(RoomService);
  private resServicesApi = inject(ReservationServiceApi);

  // Loads all reservations for the current operator's hotel, enriched with user, room, and hotel
  getHotelReservationsForOperator() {
    const uid = this.auth.userSnapshot()?.user_id;
    if (!uid) return of<Reservation[]>([]);

    return this.staffService.getByUser(uid).pipe(
      switchMap((staff) =>
        forkJoin({
          reservations: this.reservationsApi.getAllByHotel(staff.hotel_id),
          hotel: this.hotelsService.get(Number(staff.hotel_id)),
          rooms: this.roomService.listByHotel(Number(staff.hotel_id)),
        })
      ),
      switchMap(({ reservations, hotel, rooms }) => {
        const userIds = Array.from(new Set(reservations.map((r) => r.user_id)));
        const userRequests = userIds.length
          ? forkJoin(userIds.map((id) => this.usersService.getById(id)))
          : of([]);
        return userRequests.pipe(map((users) => ({ reservations, hotel, rooms, users })));
      }),
      map(({ reservations, hotel, rooms, users }) => {
        const usersById = new Map(users.map((u) => [u.user_id, u] as const));
        const roomsById = new Map(rooms.map((r) => [r.room_id, r] as const));
        return reservations.map((r) => ({
          ...r,
          hotel,
          user: usersById.get(r.user_id),
          room: roomsById.get(r.room_id),
        }));
      })
    );
  }

  // Load reservation services for a reservation
  getReservationServices(reservationId: number) {
    return this.resServicesApi.listByReservation(reservationId);
  }

  // Load a user by id (for payment methods, etc.)
  getUserById(userId: number) {
    return this.usersService.getById(userId);
  }

  // Cross-component selection channel for a ReservationService row
  private selectedReservationServiceSubject = new Subject<ReservationServiceModel>();
  selectedReservationService$ = this.selectedReservationServiceSubject.asObservable();

  selectReservationService(row: ReservationServiceModel) {
    this.selectedReservationServiceSubject.next(row);
  }
}
