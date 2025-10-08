import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { RoomService } from '../../../../services/room';
import { RouterModule } from '@angular/router';

type RoomWire = Partial<{
  room_id: number;
  number: string;
  floor: number;
  res_status: string;
  cle_status: string;
  hotel_id: number;
  room_type_id: number;
  theme_name: string;
  images: string[];
}>;

type RoomTypeWire = Partial<{
  room_type_id: number;
  name: string;
  description: string;
  base_price: number;
  capacity: number;
  default_image: string;
}>;

interface MenuItemVM {
  typeId: number;
  typeName: string;
  themeName: string;
  image: string;
  price?: number;
  capacity?: number;
}

@Component({
  standalone: true,
  selector: 'app-hotel-rooms',
  imports: [CommonModule, RouterModule],
  templateUrl: './hotel-rooms.html',
  styleUrls: ['./hotel-rooms.scss'],
})
export class HotelRoomsComponent implements OnInit {
  overlayUrl = 'https://png.pngtree.com/png-clipart/20231020/original/pngtree-hotel-illustration-3d-png-image_13379998.png';
  /** Puedes pasar hotelId directamente… */
  @Input() hotelId?: number;
  /** …o pasar el objeto hotel; se toma h.hotel_id || h.id */
  @Input() hotel?: any;
  /** opcional: lo acepto para no romper tu template anterior */
  @Input() assetBase?: string;

  private roomSvc = inject(RoomService);
  private http = inject(HttpClient);

  items: Array<{
    typeId: number;
    typeName: string;
    themeName: string;
    image: string;
  }> = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    const id = this.hotelId ?? this.hotel?.hotel_id ?? this.hotel?.id;
    if (!id) {
      this.loading = false;
      this.error = 'Falta hotelId.';
      return;
    }

    Promise.all([
      this.roomSvc.listByHotel(id).toPromise(),
      this.http.get<RoomTypeWire[]>(`${environment.apiBaseUrl}/room-types`).toPromise(),
    ])
      .then(([rooms, types]) => {
        this.items = this.buildMenu((rooms ?? []) as RoomWire[], (types ?? []) as RoomTypeWire[]);
      })
      .catch((e) => {
        console.error(e);
        this.error = 'No pudimos cargar las habitaciones.';
      })
      .finally(() => (this.loading = false));
  }

  private get<T>(obj: any, keys: string[], fallback?: T): T | undefined {
    for (const k of keys) {
      if (obj && obj[k] != null) return obj[k] as T;
    }
    return fallback;
  }

  private buildMenu(rooms: RoomWire[], types: RoomTypeWire[]): MenuItemVM[] {
    const typesById = new Map<number, RoomTypeWire>();
    types.forEach((t) => {
      const id = this.get<number>(t, ['room_type_id', 'id']);
      if (id != null) typesById.set(id, t);
    });

    // agrupar por room_type_id
    const grouped = new Map<number, RoomWire[]>();
    rooms.forEach((r) => {
      const typeId = this.get<number>(r, ['room_type_id', 'roomTypeId']);
      if (typeId == null) return;
      const arr = grouped.get(typeId) || [];
      arr.push(r);
      grouped.set(typeId, arr);
    });

    const FALLBACK =
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop';

    const out: MenuItemVM[] = [];
    grouped.forEach((arr, typeId) => {
      // “representante”: menor piso para sacar el tema
      arr.sort((a, b) => (a.floor ?? 0) - (b.floor ?? 0));
      const rep = arr[0];

      const t = typesById.get(typeId);
      const typeName = this.get<string>(t, ['name']) ?? `Tipo #${typeId}`;
      const themeName = rep?.theme_name ?? 'Tema regional';
      const image =
        this.get<string>(t, ['default_image', 'image']) ||
        rep?.images?.[0] ||
        FALLBACK;

      out.push({
        typeId,
        typeName,
        themeName,
        image,
        price: this.get<number>(t, ['base_price', 'basePrice']),
        capacity: this.get<number>(t, ['capacity']),
      });
    });

    return out.sort((a, b) => a.typeName.localeCompare(b.typeName));
  }

  // <- esta es la que faltaba
  trackByType = (_: number, it: MenuItemVM) => it.typeId;

}
