// src/app/features/rooms/room-form/room-form.component.ts
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

// Servicios / modelos
import { RoomService } from '../../../../services/room';
import { RoomTypeService } from '../../../../services/room-type';
import { ReservationService } from '../../../../services/reservation';
import { Room } from '../../../../model/room';
import { Reservation } from '../../../../model/reservation';

type ReservationCreatedPayload = {
  reservationId: number;
  reservationCode: string;
  hotelId: number;
  typeId: number;
  roomId: number;
  checkIn: string;
  checkOut: string;
};

@Component({
  selector: 'app-room-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './room-form.html',
  styleUrls: ['./room-form.scss']
})
export class RoomFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private roomSvc = inject(RoomService);
  private typeSvc = inject(RoomTypeService);
  private reservationSvc = inject(ReservationService);

  @Output() reservationCreated = new EventEmitter<ReservationCreatedPayload>();
  @Output() datesChanged = new EventEmitter<{ checkIn: string, checkOut: string }>();

  // Ruta
  private typeId!: number;
  private hotelId!: number;

  // Datos para el form
  reserveForm!: FormGroup;
  availableRoomsList: Room[] = [];
  allRoomsList: Room[] = [];
  allReservations: Reservation[] = [];
  availableCount = 0;

  // Estados UI
  showForm = true;
  isSubmitting = false;
  submitError = '';
  minCheckIn = todayISO();
  minCheckOut = todayISO();

  // Base price 
  basePrice: number | null = null;

  ngOnInit() {
    this.typeId = Number(this.route.snapshot.paramMap.get('typeId'));
    this.hotelId = Number(this.route.snapshot.queryParamMap.get('hotelId'));
    if (!this.typeId || !this.hotelId) return;

    // Form
    this.reserveForm = this.fb.group({
      checkIn: [todayISO(), Validators.required],
      checkOut: [addDaysISO(1), Validators.required],
    });

    // Emit initial dates
    this.datesChanged.emit({
      checkIn: todayISO(),
      checkOut: addDaysISO(1)
    });

    this.reserveForm.get('checkIn')?.valueChanges.subscribe((v: string) => {
      if (v) {
        this.minCheckOut = v;
        this.emitDatesChanged();
      }
    });

    this.reserveForm.get('checkOut')?.valueChanges.subscribe((v: string) => {
      if (v) {
        this.emitDatesChanged();
      }
    });

    // Carga room type (para base_price) y habitaciones disponibles
    this.typeSvc.getById(this.typeId).subscribe((rt: any) => {
      const base = Number(rt?.base_price ?? rt?.basePrice);
      this.basePrice = Number.isFinite(base) ? base : null;
    });

    forkJoin({
      hotelRooms: this.roomSvc.listByHotel(this.hotelId),
      allReservations: this.reservationSvc.getAll()
    }).subscribe({
      next: ({ hotelRooms, allReservations }) => {
        this.allReservations = allReservations || [];

        const byType = (hotelRooms ?? []).filter((r: any) => {
          const rtId = toNumber(r.room_type_id ?? r.roomTypeId);
          const hId = toNumber(r.hotel_id ?? r.hotelId);
          return rtId === this.typeId && hId === this.hotelId;
        });

        this.allRoomsList = byType.sort((a: any, b: any) =>
          String(a.number ?? '').localeCompare(String(b.number ?? ''))
        );

        this.updateAvailableRoomsList();

        const p = safeSessionGet('pendingReservation');
        if (p && p.hotelId === this.hotelId && p.typeId === this.typeId) {
          this.showForm = true;
          // Restaurar las fechas guardadas si existen
          const checkIn = p.checkIn || todayISO();
          const checkOut = p.checkOut || addDaysISO(1);
          this.reserveForm.patchValue({ checkIn, checkOut }, { emitEvent: true });
          safeSessionRemove('pendingReservation');

          // Disparar automáticamente la reserva después de login
          setTimeout(() => {
            this.reserve();
          }, 500);
        }
      },
      error: (error) => {
        console.error('Error loading rooms and reservations:', error);
      }
    });
  }

  private emitDatesChanged(): void {
    const checkIn = this.reserveForm.get('checkIn')?.value;
    const checkOut = this.reserveForm.get('checkOut')?.value;
    if (checkIn && checkOut) {
      this.datesChanged.emit({ checkIn, checkOut });
      this.updateAvailableRoomsList();
    }
  }

  private hasConfirmedReservationForDates(roomId: number, checkIn: string, checkOut: string): boolean {
    const selectedStart = new Date(checkIn);
    const selectedEnd = new Date(checkOut);

    return this.allReservations.some(reservation => {
      if (reservation.room?.room_id !== roomId || reservation.status !== 'CONFIRMED') {
        return false;
      }

      const resStart = new Date(reservation.check_in);
      const resEnd = new Date(reservation.check_out);

      return selectedStart < resEnd && selectedEnd > resStart;
    });
  }

  private updateAvailableRoomsList(): void {
    const checkIn = this.reserveForm.get('checkIn')?.value;
    const checkOut = this.reserveForm.get('checkOut')?.value;

    if (!checkIn || !checkOut) {
      const statusOf = (r: any) => String(r?.res_status ?? r?.status ?? '').toUpperCase();
      this.availableRoomsList = this.allRoomsList.filter(r => statusOf(r) === 'AVAILABLE');
    } else {
      this.availableRoomsList = this.allRoomsList.filter(room => {
        const statusOf = (r: any) => String(r?.res_status ?? r?.status ?? '').toUpperCase();

        if (statusOf(room) === 'MAINTENANCE') return false;

        return !this.hasConfirmedReservationForDates(room.room_id!, checkIn, checkOut);
      });
    }

    this.availableCount = this.availableRoomsList.length;
  }

  private getRandomRoom(): Room | null {
    if (!this.availableRoomsList.length) return null;
    const randomIndex = Math.floor(Math.random() * this.availableRoomsList.length);
    return this.availableRoomsList[randomIndex];
  }

  private ensureLoggedInClient(): number | null {
    const info = getFullUserNormalized();
    const isClient = (info.roles ?? []).some(r => String(r).toUpperCase() === 'CLIENT');
    if (info.id != null && isClient) return Number(info.id);

    // Guarda intención con las fechas seleccionadas y manda al login
    const { checkIn, checkOut } = this.reserveForm.value;
    safeSessionSet('pendingReservation', {
      hotelId: this.hotelId,
      typeId: this.typeId,
      checkIn: checkIn,
      checkOut: checkOut,
    });
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    return null;
  }

  reserve() {
    this.submitError = '';

    const uid = this.ensureLoggedInClient();
    if (!uid) return;

    if (this.reserveForm.invalid) {
      this.reserveForm.markAllAsTouched();
      return;
    }

    // Update available rooms list before selecting
    this.updateAvailableRoomsList();

    console.log('Available rooms for reservation:', this.availableRoomsList.map(r => ({
      id: r.room_id,
      number: r.number,
      status: r.res_status
    })));

    // Automatically select a random available room
    const selectedRoom = this.getRandomRoom();
    if (!selectedRoom) {
      this.submitError = 'No hay habitaciones disponibles para reservar en las fechas seleccionadas.';
      return;
    }

    console.log('Selected room for reservation:', {
      id: selectedRoom.room_id,
      number: selectedRoom.number,
      status: selectedRoom.res_status
    });

    const { checkIn, checkOut } = this.reserveForm.value;
    if (!isDateRangeValid(checkIn, checkOut)) {
      this.submitError = 'El check-out debe ser posterior al check-in.';
      return;
    }

    const body: Partial<Reservation> = {
      user_id: uid,
      hotel_id: this.hotelId,
      room_id: selectedRoom.room_id!,
      check_in: checkIn as string,
      check_out: checkOut as string,
      status: 'PENDING' as Reservation['status'],
    };

    this.isSubmitting = true;
    this.reservationSvc.create(body).subscribe({
      next: (saved: any) => {
        this.isSubmitting = false;
        const reservationId = Number(saved?.reservation_id ?? saved?.reservationId ?? saved?.id ?? null);
        const payload: ReservationCreatedPayload = {
          reservationId,
          reservationCode: buildReservationCode(reservationId),
          hotelId: this.hotelId,
          typeId: this.typeId,
          roomId: selectedRoom.room_id!,
          checkIn: body.check_in!,
          checkOut: body.check_out!,
        };
        this.reservationCreated.emit(payload);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.submitError = readServerMessage(err) ?? 'No fue posible crear la reserva. Prueba con otras fechas o habitación.';
      }
    });
  }
}

/* ===== Helpers locales ===== */
function toNumber(v: any): number | null { if (v == null) return null; const n = Number(v); return Number.isFinite(n) ? n : null; }
function todayISO(): string { const d = new Date(); const m = `${d.getMonth() + 1}`.padStart(2, '0'); const day = `${d.getDate()}`.padStart(2, '0'); return `${d.getFullYear()}-${m}-${day}`; }
function addDaysISO(n: number): string { const d = new Date(); d.setDate(d.getDate() + n); const m = `${d.getMonth() + 1}`.padStart(2, '0'); const day = `${d.getDate()}`.padStart(2, '0'); return `${d.getFullYear()}-${m}-${day}`; }
function isDateRangeValid(inclStart: string, exclEnd: string): boolean { return new Date(exclEnd) > new Date(inclStart); }
function readServerMessage(err: any): string | null { const msg = err?.error?.message ?? err?.message ?? null; return typeof msg === 'string' ? msg : null; }
function isBrowser(): boolean { return typeof window !== 'undefined'; }
function safeSessionGet(key: string): any | null { if (!isBrowser()) return null; try { const raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
function safeSessionSet(key: string, val: any): void { if (!isBrowser()) return; try { sessionStorage.setItem(key, JSON.stringify(val)); } catch { } }
function safeSessionRemove(key: string): void { if (!isBrowser()) return; try { sessionStorage.removeItem(key); } catch { } }
type NormalizedUser = { id?: number | string; roles?: string[];[k: string]: any };
function getFullUserNormalized(): NormalizedUser {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('currentUser') || localStorage.getItem('auth');
    if (!raw) return {};
    const obj = JSON.parse(raw); const u = obj?.user ?? obj;
    const roles: string[] = ((u?.roles ?? obj?.roles) || []).map((r: any) => (r?.name ?? r)).filter(Boolean).map((x: any) => String(x));
    return { id: u?.id ?? obj?.id ?? u?.user_id ?? obj?.user_id, roles };
  } catch { return {}; }
}
function buildReservationCode(id: number | null): string {
  if (id && Number.isFinite(id)) return `RS-${String(id).padStart(6, '0')}`;
  const rnd = Math.floor(100000 + Math.random() * 900000);
  return `RS-${rnd}`;
}
