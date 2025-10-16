// src/app/features/rooms/room-detail/room-detail.component.ts
import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { RoomService } from '../../../../services/room';
import { RoomTypeService } from '../../../../services/room-type';
import { HotelsService } from '../../../../services/hotels';
import { Room } from '../../../../model/room';
import { RoomFormComponent } from '../room-form/room-form';
import { RoomModalComponent } from '../room-modal/room-modal';
import { RoomRvComponent } from '../room-rv/room-rv';
import { RoomGalleryComponent } from '../room-gallery/room-gallery';

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, RoomFormComponent, RoomModalComponent, RoomRvComponent, RoomGalleryComponent],
  templateUrl: './room-detail.html',
  styleUrls: ['./room-detail.scss'],
})
export class RoomDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private roomSvc = inject(RoomService);
  private typeSvc = inject(RoomTypeService);
  private hotelSvc = inject(HotelsService, { optional: true });

  @ViewChild('reserveSection') reserveSection!: ElementRef;

  typeId!: number;
  hotelId!: number;

  // Header / hero
  heroImg = '';
  typeName = '';
  themeName = '';
  description = '';
  basePrice: number | null = null;
  capacity: number | null = null;

  // Slides
  slides: string[] = [];
  currentSlide = 0;
  private timer: any = null;
  titleAnim = true; // para reiniciar animación del título

  // Rooms (listado/contadores)
  rooms: Room[] = [];
  availableCount = 0;
  bookedCount = 0;
  maintenanceCount = 0;

  // Modal state
  showModal = false;
  lastReservationId: number | null = null;
  reservationCode = '';

  // para modal inputs
  modalHotelId!: number | null;
  modalTypeId!: number | null;
  modalRoomId!: number | null;
  modalCheckIn = '';
  modalCheckOut = '';

  // hotel
  hotelName = '';

  // ======= Estados / traducciones para el template =======
  private statusOf(r: Partial<Room> & { status?: string }): string {
    return String((r.res_status ?? r.status) || '').toUpperCase();
  }
  isAvailable = (r: Partial<Room> & { status?: string }) => this.statusOf(r) === 'AVAILABLE';
  isBooked = (r: Partial<Room> & { status?: string }) => this.statusOf(r) === 'BOOKED';
  isMaintenance = (r: Partial<Room> & { status?: string }) => this.statusOf(r) === 'MAINTENANCE';

  statusLabel(r: Partial<Room> & { status?: string }): string {
    const s = this.statusOf(r);
    return s === 'AVAILABLE' ? 'Disponible'
      : s === 'BOOKED' ? 'Reservada'
        : s === 'MAINTENANCE' ? 'Mantenimiento'
          : '—';
  }

  ngOnInit() {
    // Siempre desde el top
    if (isBrowser()) { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); }

    // Params
    this.typeId = Number(this.route.snapshot.paramMap.get('typeId'));
    this.hotelId = Number(this.route.snapshot.queryParamMap.get('hotelId'));
    if (!this.typeId || !this.hotelId) return;

    // Hotel (header)
    if (this.hotelSvc) {
      this.hotelSvc.get(this.hotelId).subscribe((h: any) => {
        this.hotelName = h?.name ?? `Hotel #${this.hotelId}`;
      });
    }

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

      // Rooms del hotel filtradas por typeId
      const byType = (hotelRooms ?? []).filter((r: any) => {
        const rtId = toNumber(r.room_type_id ?? r.roomTypeId);
        const hId = toNumber(r.hotel_id ?? r.hotelId);
        return rtId === this.typeId && hId === this.hotelId;
      });

      this.rooms = byType.sort((a: any, b: any) =>
        String(a.number ?? '').localeCompare(String(b.number ?? ''))
      );

      // Contadores
      const st = (r: any) => String(r.res_status ?? r.status ?? '').toUpperCase();
      this.availableCount = this.rooms.filter(r => st(r) === 'AVAILABLE').length;
      this.bookedCount = this.rooms.filter(r => st(r) === 'BOOKED').length;
      this.maintenanceCount = this.rooms.filter(r => st(r) === 'MAINTENANCE').length;

      // Tema
      const themes = this.rooms.map((r: any) => r.theme_name ?? r.themeName).filter(Boolean) as string[];
      this.themeName = mostCommon(themes) ?? this.themeName;

      // Hero slides
      this.slides = [
        this.heroImg, // principal
        // nuevas imágenes pedidas
        'https://images.pexels.com/photos/2507007/pexels-photo-2507007.jpeg',
        'https://images.pexels.com/photos/1838554/pexels-photo-1838554.jpeg',
        'https://images.pexels.com/photos/5379219/pexels-photo-5379219.jpeg',
        'https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg',
      ].filter(Boolean);

      this.startAuto(); // autoplay más rápido
      this.restartTitleAnim();
    });
  }

  // ======= Hero autoplay =======
  startAuto() {
    if (this.timer) clearInterval(this.timer);
    // cambio más rápido
    this.timer = setInterval(() => this.nextSlide(), 3500);
  }

  nextSlide() {
    if (!this.slides.length) return;
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    this.restartTitleAnim();
  }

  goTo(i: number) {
    this.currentSlide = i;
    this.restartTitleAnim();
    this.startAuto();
  }

  private restartTitleAnim() {
    // Toggle para reiniciar la animación de relleno en TODO el título (tipo + tema)
    this.titleAnim = false;
    if (isBrowser()) requestAnimationFrame(() => (this.titleAnim = true));
  }

  // ======= Acciones UI existentes =======
  beginReservation(room?: any) {
    safeSessionSet('pendingReservation', {
      hotelId: this.hotelId, typeId: this.typeId, roomId: room?.room_id ?? null,
    });
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  onReservationCreated(e: {
    reservationId: number; reservationCode: string; hotelId: number; typeId: number; roomId: number;
    checkIn: string; checkOut: string;
  }) {
    this.lastReservationId = e.reservationId;
    this.reservationCode = e.reservationCode;
    this.modalHotelId = e.hotelId;
    this.modalTypeId = e.typeId;
    this.modalRoomId = e.roomId;
    this.modalCheckIn = e.checkIn;
    this.modalCheckOut = e.checkOut;
    this.showModal = true;
  }

  closeModalGoHome() {
    this.showModal = false;
    this.router.navigateByUrl('/');
  }

  // ===== Utils locales =====
  trackByRoom = (i: number, r: any) => r?.room_id ?? r?.number ?? i;
}

function toNumber(v: any): number | null { if (v == null) return null; const n = Number(v); return Number.isFinite(n) ? n : null; }
function mostCommon(arr: string[]): string | undefined {
  if (!arr.length) return undefined;
  const m = new Map<string, number>();
  for (const s of arr) m.set(s, (m.get(s) ?? 0) + 1);
  let best: string | undefined; let max = -1;
  for (const [k, c] of m) if (c > max) { max = c; best = k; }
  return best;
}
function isBrowser(): boolean { return typeof window !== 'undefined'; }
function safeSessionSet(key: string, val: any): void { if (!isBrowser()) return; try { sessionStorage.setItem(key, JSON.stringify(val)); } catch { } }
