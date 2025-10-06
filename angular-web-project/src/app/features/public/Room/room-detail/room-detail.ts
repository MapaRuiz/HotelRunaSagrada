import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { RoomService } from '../../../../services/room';
import { RoomTypeService } from '../../../../services/room-type';
import { Room } from '../../../../model/room';
import { RoomType } from '../../../../model/room-type';

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIf, NgFor, DecimalPipe],
  templateUrl: './room-detail.html',
  styleUrl: './room-detail.scss'
})
export class RoomDetailComponent {
  private route = inject(ActivatedRoute);
  private roomSvc = inject(RoomService);
  private typeSvc = inject(RoomTypeService);

  // Lo que consume tu HTML
  heroImg = '';
  typeName = '';
  themeName = '';
  description = '';
  basePrice: number | null = null;
  capacity: number | null = null;

  availableCount = 0;
  bookedCount = 0;
  maintenanceCount = 0;

  rooms: Room[] = [];

  ngOnInit() {
    const typeId = Number(this.route.snapshot.paramMap.get('typeId'));
    const hotelId = Number(this.route.snapshot.queryParamMap.get('hotelId'));
    if (!hotelId || !typeId) return;

    // Traemos en paralelo: info del tipo + rooms del hotel
    forkJoin({
      roomType: this.typeSvc.getById(typeId),
      hotelRooms: this.roomSvc.listByHotel(hotelId),
    }).subscribe(({ roomType, hotelRooms }) => {
      // (1) Pintar datos del RoomType
      if (roomType) {
        this.typeName = roomType.name ?? '';
        this.description = roomType.description ?? '';
        this.capacity = toNumber((roomType as any).capacity);
        this.basePrice = toNumber((roomType as any).base_price ?? (roomType as any).basePrice);
        const defImg =
          (roomType as any).default_image ?? (roomType as any).image ?? (roomType as any).defaultImage;
        if (defImg && !this.heroImg) this.heroImg = String(defImg);
      }

      // (2) Filtrar por typeId en el front
      const byType = (hotelRooms ?? []).filter((r: any) => {
        const rtId = toNumber(r.room_type_id ?? r.roomTypeId);
        const hId = toNumber(r.hotel_id ?? r.hotelId);
        return rtId === typeId && hId === hotelId;
      });

      // (3) Orden y asignación
      this.rooms = byType.sort((a: any, b: any) =>
        String(a.number ?? '').localeCompare(String(b.number ?? ''))
      );

      // (4) Contadores por estado
      const st = (r: any) => String(r.res_status ?? r.status ?? '').toUpperCase();
      this.availableCount   = this.rooms.filter(r => st(r) === 'AVAILABLE').length;
      this.bookedCount      = this.rooms.filter(r => st(r) === 'BOOKED').length;
      this.maintenanceCount = this.rooms.filter(r => st(r) === 'MAINTENANCE').length;

      // (5) Tema y hero de respaldo desde las rooms
      const themes = this.rooms
        .map((r: any) => r.theme_name ?? r.themeName)
        .filter(Boolean) as string[];
      this.themeName = mostCommon(themes) ?? this.themeName;

      if (!this.heroImg) {
        const firstImg = (this.rooms.find((r: any) => Array.isArray(r.images) && r.images.length)?.images ?? [])[0];
        if (firstImg) this.heroImg = String(firstImg);
      }
    });
  }

  // Helpers para el template (si los quieres usar)
  availableRooms(): Room[] {
    return this.rooms.filter((r: any) => String(r.res_status ?? r.status ?? '').toUpperCase() === 'AVAILABLE');
  }
  statusLabel(r: any): string {
    const s = String(r.res_status ?? r.status ?? '').toUpperCase();
    return s === 'AVAILABLE' ? 'Disponible'
         : s === 'BOOKED' ? 'Reservada'
         : s === 'MAINTENANCE' ? 'Mantenimiento'
         : s || '—';
  }
  trackByRoom = (_: number, r: any) => r.room_id ?? r.id ?? r.number ?? _;

  // Formateo COP (si prefieres esto en vez de CurrencyPipe)
  formatCOP(n: number | null): string {
    if (n == null) return '';
    try { return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n); }
    catch { return `${n}`; }
  }
}

// === Utils ===
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
