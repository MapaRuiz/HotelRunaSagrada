import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

// Services / modelos (ajusta paths si difieren)
import { RoomService } from '../../../../services/room';
import { RoomTypeService } from '../../../../services/room-type';
import { ReservationService } from '../../../../services/reservation';
import { HotelsService } from '../../../../services/hotels';
import { Room } from '../../../../model/room';
import { RoomType } from '../../../../model/room-type';
import { Reservation } from '../../../../model/reservation';

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './room-detail.html',
  styleUrls: ['./room-detail.scss'],
})
export class RoomDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private roomSvc = inject(RoomService);
  private typeSvc = inject(RoomTypeService);
  private reservationSvc = inject(ReservationService);
  private hotelSvc = inject(HotelsService, { optional: true });

  @ViewChild('reserveSection') reserveSection!: ElementRef;

  // URL params
  typeId!: number;
  hotelId!: number;

  // Header
  heroImg = '';
  typeName = '';
  themeName = '';
  description = '';
  basePrice: number | null = null;
  capacity: number | null = null;

  // Rooms
  rooms: Room[] = [];
  availableRoomsList: Room[] = [];
  availableCount = 0;
  bookedCount = 0;
  maintenanceCount = 0;

  // Form
  showForm = false;
  reserveForm!: FormGroup;
  isSubmitting = false;
  submitError = '';
  minCheckIn = todayISO();
  minCheckOut = todayISO();

  // Modal
  showModal = false;
  lastReservationId: number | null = null;
  reservationCode = ''; // RS-XXXX

  // Hotel + cliente para modal
  hotelName = '';
  selectedRoom: any = null;

  clientName = '';
  clientEmail = '';
  clientUsername = '';
  clientPhone = '';
  clientDocType = '';
  clientDocNumber = '';
  clientCountry = '';
  clientAddress = '';
  clientRolesLabel = '';

  ngOnInit() {
    // Params
    this.typeId = Number(this.route.snapshot.paramMap.get('typeId'));
    this.hotelId = Number(this.route.snapshot.queryParamMap.get('hotelId'));
    if (!this.typeId || !this.hotelId) return;

    // Hotel
    if (this.hotelSvc) {
      this.hotelSvc.get(this.hotelId).subscribe((h: any) => {
        this.hotelName = h?.name ?? `Hotel #${this.hotelId}`;
      });
    }

    // Cliente (si ya está logueado)
    this.hydrateClientFromStorage();

    // Form
    this.reserveForm = this.fb.group({
      roomId: [null, Validators.required],      // guardamos como string (valor HTML)
      checkIn: [todayISO(), Validators.required],
      checkOut: [addDaysISO(1), Validators.required],
    });
    this.minCheckIn = todayISO();
    this.minCheckOut = todayISO();

    this.reserveForm.get('checkIn')?.valueChanges.subscribe((v: string) => {
      if (v) this.minCheckOut = v;
    });

    // Cargas
    forkJoin({
      roomType: this.typeSvc.getById(this.typeId),
      hotelRooms: this.roomSvc.listByHotel(this.hotelId),
    }).subscribe(({ roomType, hotelRooms }) => {
      // RoomType
      if (roomType) {
        this.typeName = (roomType as any).name ?? '';
        this.description = (roomType as any).description ?? '';
        this.capacity = toNumber((roomType as any).capacity);
        this.basePrice = toNumber((roomType as any).base_price ?? (roomType as any).basePrice);
        const defImg =
          (roomType as any).default_image ?? (roomType as any).image ?? (roomType as any).defaultImage;
        if (defImg && !this.heroImg) this.heroImg = String(defImg);
      }

      // Rooms del hotel filtradas por typeId en el front
      const byType = (hotelRooms ?? []).filter((r: any) => {
        const rtId = toNumber(r.room_type_id ?? r.roomTypeId);
        const hId = toNumber(r.hotel_id ?? r.hotelId);
        return rtId === this.typeId && hId === this.hotelId;
      });

      this.rooms = byType.sort((a: any, b: any) =>
        String(a.number ?? '').localeCompare(String(b.number ?? ''))
      );

      // Contadores + disponibles
      this.availableRoomsList = this.rooms.filter(r => this.isAvailable(r));
      const st = (r: any) => String(r.res_status ?? r.status ?? '').toUpperCase();
      this.availableCount   = this.rooms.filter(r => st(r) === 'AVAILABLE').length;
      this.bookedCount      = this.rooms.filter(r => st(r) === 'BOOKED').length;
      this.maintenanceCount = this.rooms.filter(r => st(r) === 'MAINTENANCE').length;

      // Tema por rooms
      const themes = this.rooms.map((r: any) => r.theme_name ?? r.themeName).filter(Boolean) as string[];
      this.themeName = mostCommon(themes) ?? this.themeName;

      // Hero fallback
      if (!this.heroImg) {
        const firstImg = (this.rooms.find((r: any) => Array.isArray(r.images) && r.images.length)?.images ?? [])[0];
        if (firstImg) this.heroImg = String(firstImg);
      }

      // Preseleccionar primera disponible
      const firstAvail = this.availableRoomsList[0];
      if (firstAvail) {
        this.reserveForm.patchValue({ roomId: String((firstAvail as any).room_id) });
        this.selectedRoom = firstAvail;
      }

      // Reabrir form si venimos de login/registro con intención guardada
      const p = safeSessionGet('pendingReservation');
      if (p && p.hotelId === this.hotelId && p.typeId === this.typeId) {
        this.showForm = true;
        if (p.roomId) {
          this.reserveForm.patchValue({ roomId: String(p.roomId) });
          this.selectedRoom = this.rooms.find(r => (r as any).room_id === p.roomId) ?? this.selectedRoom;
        }
        // refrescamos fechas “hoy / +1”
        this.reserveForm.patchValue({ checkIn: todayISO(), checkOut: addDaysISO(1) });
        queueMicrotask(() =>
          this.reserveSection?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        );
        safeSessionRemove('pendingReservation');
      }
    });
  }

  // ======= Estados / traducciones =======
  private statusOf = (r: any) => String(r?.res_status ?? r?.status ?? '').toUpperCase();
  isAvailable = (r: any) => this.statusOf(r) === 'AVAILABLE';
  isBooked    = (r: any) => this.statusOf(r) === 'BOOKED';
  isMaintenance = (r: any) => this.statusOf(r) === 'MAINTENANCE';

  statusLabel(r: any): string {
    const s = this.statusOf(r);
    return s === 'AVAILABLE'    ? 'Disponible'
         : s === 'BOOKED'       ? 'Reservada'
         : s === 'MAINTENANCE'  ? 'Mantenimiento'
         : '—';
  }

  trackByRoom = (i: number, r: any) => r?.room_id ?? r?.number ?? i;

  // ======= Flujo de reservar =======
  beginReservation(room?: any) {
    // Guarda intención y manda SIEMPRE a login (el link de login→register debe preservar returnUrl)
    safeSessionSet('pendingReservation', {
      hotelId: this.hotelId,
      typeId: this.typeId,
      roomId: room?.room_id ?? null,
    });
    if (room?.room_id) this.selectedRoom = room;
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  private ensureLoggedInClient(): number | null {
    const info = getFullUserNormalized();
    const isClient = (info.roles ?? []).some(r => String(r).toUpperCase() === 'CLIENT');
    if (info.id != null && isClient) {
      // re-hidrata datos completos por si venimos de register
      this.applyClientInfo(info);
      return Number(info.id);
    }
    safeSessionSet('pendingReservation', {
      hotelId: this.hotelId,
      typeId: this.typeId,
      roomId: this.reserveForm?.value?.roomId ?? null,
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

    const { roomId, checkIn, checkOut } = this.reserveForm.value;
    if (!isDateRangeValid(checkIn, checkOut)) {
      this.submitError = 'El check-out debe ser posterior al check-in.';
      return;
    }

    const chosenId = Number(roomId);
    this.selectedRoom = this.rooms.find(r => (r as any).room_id === chosenId) ?? this.selectedRoom;

    const body: Partial<Reservation> = {
      user_id: uid,
      hotel_id: this.hotelId,
      room_id: chosenId,
      check_in: checkIn as string,
      check_out: checkOut as string,
      status: 'PENDING' as Reservation['status'],
    };

    this.isSubmitting = true;
    this.reservationSvc.create(body).subscribe({
      next: (saved: any) => {
        this.isSubmitting = false;
        this.lastReservationId = Number(saved?.reservation_id ?? saved?.reservationId ?? saved?.id ?? null);
        this.reservationCode = buildReservationCode(this.lastReservationId);
        this.showModal = true;
      },
      error: (err) => {
        this.isSubmitting = false;
        this.submitError = readServerMessage(err) ?? 'No fue posible crear la reserva. Prueba con otras fechas o habitación.';
      }
    });
  }

  closeModalGoHome() {
    this.showModal = false;
    this.router.navigateByUrl('/');
  }

  // ===== Métodos usados en modal =====
  nights(): number {
    const v = this.reserveForm?.value;
    if (!v?.checkIn || !v?.checkOut) return 0;
    const a = new Date(v.checkIn), b = new Date(v.checkOut);
    return Math.max(0, Math.round((+b - +a) / 86400000));
  }

  estimatedTotal(): number | null {
    if (this.basePrice == null) return null;
    const n = this.nights();
    return n > 0 ? this.basePrice * n : this.basePrice;
  }

  // ===== Cliente helpers =====
  private hydrateClientFromStorage() {
    const info = getFullUserNormalized();
    this.applyClientInfo(info);
  }

  private applyClientInfo(info: NormalizedUser) {
    this.clientName = info.name || '';
    this.clientEmail = info.email || '';
    this.clientUsername = info.username || '';
    this.clientPhone = info.phone || '';
    this.clientDocType = info.docType || '';
    this.clientDocNumber = info.docNumber || '';
    this.clientCountry = info.country || '';
    this.clientAddress = info.address || '';
    this.clientRolesLabel = (info.roles && info.roles.length) ? info.roles.join(', ') : '';
  }
}

/* ======= Helpers ======= */
function toNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v); return Number.isFinite(n) ? n : null;
}
function mostCommon(arr: string[]): string | undefined {
  if (!arr.length) return undefined;
  const m = new Map<string, number>();
  for (const s of arr) m.set(s, (m.get(s) ?? 0) + 1);
  let best: string | undefined; let max = -1;
  for (const [k, c] of m) if (c > max) { max = c; best = k; }
  return best;
}
function todayISO(): string {
  const d = new Date();
  const m = `${d.getMonth()+1}`.padStart(2,'0');
  const day = `${d.getDate()}`.padStart(2,'0');
  return `${d.getFullYear()}-${m}-${day}`;
}
function addDaysISO(n: number): string {
  const d = new Date(); d.setDate(d.getDate() + n);
  const m = `${d.getMonth()+1}`.padStart(2,'0');
  const day = `${d.getDate()}`.padStart(2,'0');
  return `${d.getFullYear()}-${m}-${day}`;
}
function isDateRangeValid(inclStart: string, exclEnd: string): boolean {
  if (!inclStart || !exclEnd) return false;
  return new Date(exclEnd) > new Date(inclStart);
}
function readServerMessage(err: any): string | null {
  const msg = err?.error?.message ?? err?.message ?? null;
  return typeof msg === 'string' ? msg : null;
}

/** Storage seguro para SSR */
function isBrowser(): boolean { return typeof window !== 'undefined'; }
function safeSessionGet(key: string): any | null {
  if (!isBrowser()) return null;
  try { const raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function safeSessionSet(key: string, val: any): void {
  if (!isBrowser()) return;
  try { sessionStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function safeSessionRemove(key: string): void {
  if (!isBrowser()) return;
  try { sessionStorage.removeItem(key); } catch {}
}

/* ===== Normalización de usuario (lee 'user' | 'currentUser' | 'auth') ===== */
type NormalizedUser = {
  id?: number|string;
  name?: string;
  email?: string;
  username?: string;
  phone?: string;
  docType?: string;
  docNumber?: string;
  country?: string;
  address?: string;
  roles?: string[];
};
function getFullUserNormalized(): NormalizedUser {
  if (!isBrowser()) return {};
  try {
    const raw =
      localStorage.getItem('user') ||
      localStorage.getItem('currentUser') ||
      localStorage.getItem('auth');
    if (!raw) return {};
    const obj = JSON.parse(raw);
    const u = obj?.user ?? obj;

    // roles pueden venir como objetos {name: 'CLIENT'} o strings
    const rolesArr: string[] = ((u?.roles ?? obj?.roles) || [])
      .map((r: any) => (r?.name ?? r))
      .filter(Boolean)
      .map((x: any) => String(x));

    return {
      id: u?.id ?? obj?.id ?? u?.user_id ?? obj?.user_id,
      name: u?.name ?? [u?.firstName ?? u?.firstname, u?.lastName ?? u?.lastname].filter(Boolean).join(' '),
      email: u?.email ?? obj?.email,
      username: u?.username ?? u?.userName,
      phone: u?.phone ?? u?.phoneNumber ?? u?.tel,
      docType: u?.docType ?? u?.documentType ?? u?.tipoDocumento,
      docNumber: u?.docNumber ?? u?.document ?? u?.cc ?? u?.nid,
      country: u?.country ?? u?.pais,
      address: u?.address ?? u?.direccion,
      roles: rolesArr,
    };
  } catch {
    return {};
  }
}
function buildReservationCode(id: number | null): string {
  if (id && Number.isFinite(id)) return `RS-${String(id).padStart(6,'0')}`;
  const rnd = Math.floor(100000 + Math.random() * 900000);
  return `RS-${rnd}`;
}
