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
import { OperatorHotelResolver } from '../../../services/operator-hotel-resolver';

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

type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';

const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  PENDING: 'text-bg-warning',
  PAID: 'text-bg-success',
  REFUNDED: 'text-bg-info',
  FAILED: 'text-bg-danger',
};

const PAYMENT_TEXT: Record<PaymentStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  REFUNDED: 'Reembolsado',
  FAILED: 'Fallido',
};

export function getPaymentStatusBadge(status: string): string {
  return PAYMENT_BADGE[status as PaymentStatus] ?? 'text-bg-secondary';
}

export function getPaymentStatusText(status: string): string {
  return PAYMENT_TEXT[status as PaymentStatus] ?? (status || 'N/A');
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
  private hotelResolver = inject(OperatorHotelResolver);

  // Loads all reservations for the current operator's hotel, enriched with user, room, and hotel
  getHotelReservationsForOperator() {
    return this.hotelResolver.resolveHotelId().pipe(
      switchMap((hotelId) => {
        if (!hotelId) return of({ reservations: [] as Reservation[], hotel: null, rooms: [] });
        
        return forkJoin({
          reservations: this.reservationsApi.getAllByHotel(hotelId),
          hotel: this.hotelsService.get(hotelId),
          rooms: this.roomService.listByHotel(hotelId),
        });
      }),
      switchMap(({ reservations, hotel, rooms }) => {
        if (!reservations.length) return of({ reservations: [] as Reservation[], hotel, rooms, users: [] });
        
        const userIds = Array.from(new Set(reservations.map((r: Reservation) => r.user_id)));
        const userRequests = userIds.length
          ? forkJoin(userIds.map((id: number) => this.usersService.getById(id)))
          : of([]);
        return userRequests.pipe(map((users) => ({ reservations, hotel, rooms, users })));
      }),
      map(({ reservations, hotel, rooms, users }) => {
        const usersById = new Map(users.map((u) => [u.user_id, u] as const));
        const roomsById = new Map(rooms.map((r) => [r.room_id, r] as const));
        return reservations.map((raw: Reservation | any) => {
          const normalized = this.normalizeReservation(raw);
          return {
            ...normalized,
            hotel: normalized.hotel ?? hotel ?? undefined,
            user: normalized.user ?? usersById.get(normalized.user_id),
            room: normalized.room ?? roomsById.get(normalized.room_id),
          };
        });
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

  private normalizeReservation(raw: any): Reservation {
    const copy: any = { ...raw };

    const reservationId = this.toInt(raw?.reservation_id ?? raw?.reservationId ?? raw?.id ?? raw?._id);
    if (reservationId != null) {
      copy.reservation_id = reservationId;
      copy.reservationId = reservationId;
    }

    const userId = this.toInt(
      raw?.user_id ?? raw?.userId ?? raw?.user?.user_id ?? raw?.user?.userId ?? copy.user_id ?? copy.userId
    );
    if (userId != null) {
      copy.user_id = userId;
    }

    const hotelId = this.toInt(
      raw?.hotel_id ??
        raw?.hotelId ??
        raw?.hotel?.hotel_id ??
        raw?.hotel?.hotelId ??
        raw?.room?.hotel_id ??
        raw?.room?.hotelId ??
        copy.hotel_id ??
        copy.hotelId
    );
    if (hotelId != null) {
      copy.hotel_id = hotelId;
    }

    const roomId = this.toInt(
      raw?.room_id ?? raw?.roomId ?? raw?.room?.room_id ?? raw?.room?.roomId ?? copy.room_id ?? copy.roomId
    );
    if (roomId != null) {
      copy.room_id = roomId;
    }

    copy.check_in = this.normalizeDateString(raw?.check_in ?? raw?.checkIn ?? copy.check_in ?? '');
    copy.check_out = this.normalizeDateString(raw?.check_out ?? raw?.checkOut ?? copy.check_out ?? '');
    copy.status = this.normalizeStatus(raw?.status ?? raw?.state ?? copy.status);
    copy.created_at = raw?.created_at ?? raw?.createdAt ?? copy.created_at;

    return copy as Reservation;
  }

  private normalizeStatus(value: unknown): Reservation['status'] {
    const raw = (value ?? '').toString().trim();
    if (!raw) return 'PENDING';
    const upper = raw.toUpperCase();
    const compact = upper.replace(/[\s_-]+/g, '');

    if (compact === 'CHECKIN') return 'CHECKIN';
    if (compact === 'CHECKOUT') return 'FINISHED';

    if (upper === 'CHECK-OUT' || upper === 'CHECK OUT') return 'FINISHED';
    if (upper === 'CHECK-IN' || upper === 'CHECK IN') return 'CHECKIN';

    if (upper === 'CONFIRMADA' || upper === 'CONFIRMADO') return 'CONFIRMED';
    if (upper === 'PENDIENTE') return 'PENDING';
    if (upper === 'FINALIZADA' || upper === 'FINALIZADO') return 'FINISHED';

    if ((['PENDING', 'CONFIRMED', 'CHECKIN', 'FINISHED'] as const).includes(upper as Reservation['status'])) {
      return upper as Reservation['status'];
    }
    return 'PENDING';
  }

  private toInt(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private normalizeDateString(value: unknown): string {
    if (!value) return '';
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return String(value);
  }
}
