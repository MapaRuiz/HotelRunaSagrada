import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Room } from '../../../../model/room';
import { RoomService, RoomRequest } from '../../../../services/room';
import { RoomType } from '../../../../model/room-type';
import { RoomTypeService } from '../../../../services/room-type';
import { Hotel } from '../../../../model/hotel';
import { HotelsService } from '../../../../services/hotels'; // tu servicio de hoteles

type ToastCtor = new (element: string | Element, config?: any) => { show(): void };

@Component({
  selector: 'app-rooms-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room-table.html'
})
export class RoomsTableComponent implements OnInit {
  rooms: Room[] = [];
  loading = false;

  // Filtros
  hotels: Hotel[] = [];
  types: RoomType[] = [];
  hotelId?: number;
  roomTypeId?: number;

  // Form
  showForm = false;
  editingId?: number;
  draft: Room = {
    number: '',
    floor: 1,
    res_status: 'AVAILABLE',
    cle_status: 'CLEAN',
    images: []
  };
  // para selects
  draft_hotel_id?: number;
  draft_room_type_id?: number;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private toastCtor?: ToastCtor;

  constructor(
    private roomsSvc: RoomService,
    private typesSvc: RoomTypeService,
    private hotelsSvc: HotelsService
  ) {}

  ngOnInit(): void {
    this.loadRefs();
    this.refresh();
  }

  loadRefs() {
    this.typesSvc.list().subscribe({ next: (t) => this.types = t });
    this.hotelsSvc.list().subscribe({ next: (h) => this.hotels = h });
  }

  refresh() {
    this.loading = true;
    this.roomsSvc.list({ hotelId: this.hotelId, roomTypeId: this.roomTypeId }).subscribe({
      next: (rows) => { this.rooms = rows; this.loading = false; },
      error: () => { 
        this.loading = false;
        void this.showToast('Error loading rooms');
      }
    });
  }

  applyFilters() { this.refresh(); }

  trackById = (_: number, r: Room) => r.room_id ?? -1;
  trackByIndex = (index: number, item: string) => index;

  // ---- CRUD ----
  new() {
    this.editingId = undefined;
    this.draft = { number: '', floor: 1, res_status: 'AVAILABLE', cle_status: 'CLEAN', images: [], theme_name: '' };
    this.draft_hotel_id = this.hotelId;
    this.draft_room_type_id = this.roomTypeId;
    this.showForm = true;
  }

  edit(r: Room) {
    this.editingId = r.room_id;
    this.draft = {
      room_id: r.room_id,
      hotel_id: r.hotel_id,
      room_type_id: r.room_type_id,
      number: r.number,
      floor: r.floor,
      res_status: r.res_status,
      cle_status: r.cle_status,
      theme_name: r.theme_name,
      images: [...(r.images || [])]
    };
    this.draft_hotel_id = r.hotel_id;
    this.draft_room_type_id = r.room_type_id;
    this.showForm = true;
  }

  save() {
    // Validaciones mínimas
    if (!this.draft_hotel_id || !this.draft_room_type_id) {
      void this.showToast('Please select hotel and room type');
      return;
    }
    if (!this.draft.number?.trim()) {
      void this.showToast('Please enter room number');
      return;
    }

    const payload: RoomRequest = {
      hotel_id: this.draft_hotel_id,
      room_type_id: this.draft_room_type_id,
      number: this.draft.number,
      floor: this.draft.floor,
      res_status: this.draft.res_status,
      cle_status: this.draft.cle_status,
      theme_name: this.draft.theme_name,
      images: this.draft.images
    };

    const obs = this.editingId == null
      ? this.roomsSvc.create(payload)
      : this.roomsSvc.update(this.editingId, payload);

    obs.subscribe({
      next: () => { this.showForm = false; this.refresh(); 
        void this.showToast('Saved');
      },
      error: (e) => { 
        void this.showToast(e?.error?.detail || 'Error saving');
      }
    });
  }

  remove(r: Room) {
    if (!r.room_id) return;
    if (!confirm(`Delete room ${r.number}?`)) return;
    this.roomsSvc.delete(r.room_id).subscribe({
      next: () => { this.refresh(); 
        void this.showToast('Deleted');
      },
      error: () => { 
        void this.showToast('Error deleting');
      }
    });
  }

  cancel() { this.showForm = false; }

  // ---- Galería (igual a Services) ----
  newImageUrl = '';
  imageStatus: ('idle'|'loaded'|'error')[] = [];

  isValidUrl(u: string): boolean {
    try { const x = new URL(u); return x.protocol === 'http:' || x.protocol === 'https:'; }
    catch { return false; }
  }

  addImage(): void {
    const raw = this.newImageUrl.trim();
    if (!raw || !this.isValidUrl(raw)) return;
    const url = raw;
    this.draft.images ??= [];
    if (this.draft.images.includes(url)) { this.newImageUrl = ''; return; }
    this.draft.images.push(url);
    this.imageStatus.push('idle');
    this.newImageUrl = '';
  }

  removeImage(i: number): void {
    this.draft.images.splice(i, 1);
    this.imageStatus.splice(i, 1);
  }

  setCover(i: number): void {
    if (i <= 0 || i >= this.draft.images.length) return;
    const [img] = this.draft.images.splice(i, 1);
    this.draft.images.unshift(img);
    const [st] = this.imageStatus.splice(i, 1);
    this.imageStatus.unshift(st);
  }

  moveImage(i: number, dir: -1|1): void {
    const j = i + dir;
    if (j < 0 || j >= this.draft.images.length) return;
    [this.draft.images[i], this.draft.images[j]] = [this.draft.images[j], this.draft.images[i]];
    [this.imageStatus[i], this.imageStatus[j]] = [this.imageStatus[j], this.imageStatus[i]];
  }

  onImgLoad(i: number)  { this.imageStatus[i] = 'loaded'; }
  onImgError(i: number) { this.imageStatus[i] = 'error'; }

  private async showToast(message: string): Promise<void> {
    if (!this.isBrowser) return;

    if (!this.toastCtor) {
      const module = await import('bootstrap/js/dist/toast');
      this.toastCtor = module.default;
    }

    const Toast = this.toastCtor;
    if (!Toast) return;

    const toastElement = document.createElement('div');
    toastElement.className = 'toast align-items-center text-bg-dark border-0 position-fixed top-0 end-0 m-3';
    toastElement.textContent = message;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');

    document.body.appendChild(toastElement);

    toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove(), { once: true });

    const toastInstance = new Toast(toastElement);
    toastInstance.show();
  }
}
