import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reservation } from '../../../../model/reservation';
import { ReservationService } from '../../../../services/reservation';
import { HotelsService } from '../../../../services/hotels';
import { RoomService } from '../../../../services/room';
import { UsersService } from '../../../../services/users';
import { Hotel } from '../../../../model/hotel';
import { Room } from '../../../../model/room';
import { User } from '../../../../model/user';

@Component({
  selector: 'app-reservation-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservation-table.html',
  styleUrls: ['./reservation-table.css']
})
export class ReservationTableComponent implements OnInit {
  reservations: Reservation[] = [];

  // catálogos
  hotels: Hotel[] = [];
  users: User[] = [];

  // habitaciones filtradas para el formulario (por hotel)
  roomsForForm: Room[] = [];

  loading = false;

  // Form control
  showForm = false;
  editingId?: number;
  draft: Partial<Reservation> = {}; // usa *_id + fechas + status

  constructor(
    private service: ReservationService,
    private hotelService: HotelsService,
    private roomService: RoomService,
    private userService: UsersService
  ) {}

  ngOnInit() {
    this.load();
    this.loadOptions();
  }

  private toInt(v: any): number | undefined {
    if (v === null || v === undefined || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }

  private normalizeDraftIds(src: any) {
    // Toma ID directo o, si viene objeto anidado, toma su id.
    const userId  = src.user_id ?? src.user?.user_id ?? src.userId ?? src.user?.id;
    const hotelId = src.hotel_id ?? src.hotel?.hotel_id ?? src.hotelId ?? src.hotel?.id;
    const roomId  = src.room_id ?? src.room?.room_id ?? src.roomId ?? src.room?.id;

    this.draft.user_id  = this.toInt(userId);
    this.draft.hotel_id = this.toInt(hotelId);
    this.draft.room_id  = this.toInt(roomId);
  }

  load() {
    this.loading = true;
    this.service.getAll().subscribe({
      next: data => {
        this.reservations = data;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  loadOptions() {
    this.hotelService.list().subscribe(h => (this.hotels = h));
    this.userService.getAll().subscribe(u => (this.users = u));
    // roomsForForm se carga on-demand según hotel elegido
  }

  new() {
    this.editingId = undefined;
    this.draft = { status: 'PENDING' };
    this.roomsForForm = [];
    this.showForm = true;
  }

  edit(r: Reservation) {
    this.editingId = r.reservation_id;
    this.draft = {
      // fechas + status + (posibles ids planos si ya vienen)
      check_in: r.check_in,
      check_out: r.check_out,
      status: r.status,
      user_id: (r as any).user_id,
      hotel_id: (r as any).hotel_id,
      room_id: (r as any).room_id
    };

    // por si el back envía objetos anidados en vez de *_id
    this.normalizeDraftIds({ ...r, ...this.draft });

    // cargar habitaciones del hotel seleccionado y “preseleccionar” la habitación
    if (this.draft.hotel_id) {
      this.loadRoomsForHotel(this.draft.hotel_id, () => {
        // si la room_id actual no pertenece a la lista (cambio de datos), limpiar
        const found = this.roomsForForm.find(x => x.room_id === this.draft.room_id);
        if (!found) this.draft.room_id = undefined;
      });
    } else {
      this.roomsForForm = [];
    }

    this.showForm = true;
  }

  private loadRoomsForHotel(hotelId?: number, after?: () => void) {
    if (!hotelId) {
      this.roomsForForm = [];
      after?.();
      return;
    }
    this.roomService.list({ hotelId }).subscribe(list => {
      // Garantizamos números para match exacto con ngValue numérico
      this.roomsForForm = list.map(r => ({
        ...r,
        room_id: this.toInt((r as any).room_id)!,
        hotel_id: this.toInt((r as any).hotel_id)!
      }));
      after?.();
    });
  }

  onHotelChange(hotelId: number | undefined) {
    // normalizo
    this.draft.hotel_id = this.toInt(hotelId);
    // al cambiar de hotel, limpiar la habitación y recargar opciones
    this.draft.room_id = undefined;
    this.loadRoomsForHotel(this.draft.hotel_id);
  }

  save() {
    // Validación mínima
    if (!this.draft.user_id || !this.draft.hotel_id || !this.draft.room_id
      || !this.draft.check_in || !this.draft.check_out || !this.draft.status) {
      alert('Faltan datos: cliente, hotel, habitación, estado y fechas son obligatorios.');
      return;
    }

    if (this.editingId) {
      this.service.update(this.editingId, this.draft).subscribe(() => {
        this.showForm = false;
        this.load();
      });
    } else {
      this.service.create(this.draft).subscribe(() => {
        this.showForm = false;
        this.load();
      });
    }
  }

  cancelForm() {
    this.showForm = false;
  }

  // “Cancelar” = eliminar (libera locks y borra la reserva)
  remove(r: Reservation) {
    if (confirm('¿Cancelar (eliminar) esta reserva?')) {
      this.service.delete(r.reservation_id).subscribe(() => this.load());
    }
  }
}
