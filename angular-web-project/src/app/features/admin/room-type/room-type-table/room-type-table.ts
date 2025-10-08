import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomType } from '../../../../model/room-type';
import { RoomTypeService, RoomTypeRequest } from '../../../../services/room-type';

type ToastCtor = new (element: string | Element, config?: any) => { show(): void };

@Component({
  selector: 'app-room-types-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room-type-table.html'
})
export class RoomTypesTableComponent implements OnInit {
  roomTypes: RoomType[] = [];
  loading = false;

  // Form
  showForm = false;
  editingId?: number;
  draft: RoomType = {
    name: '', capacity: 1, base_price: 0, description: '', image: ''
  };
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private toastCtor?: ToastCtor;

  constructor(private svc: RoomTypeService) {}

  ngOnInit(): void { this.refresh(); }

  refresh() {
    this.loading = true;
    this.svc.list().subscribe({
      next: (rows) => { this.roomTypes = rows; this.loading = false; },
      error: () => { 
        this.loading = false;
        void this.showToast('Error loading room types');
      }
    });
  }

  trackById = (_: number, rt: RoomType) => rt.room_type_id ?? -1;

  new() {
    this.editingId = undefined;
    this.draft = { name: '', capacity: 1, base_price: 0, description: '', image: '' };
    this.showForm = true;
  }

  edit(rt: RoomType) {
    this.editingId = rt.room_type_id;
    this.draft = { ...rt };
    this.showForm = true;
  }

  save() {
    const payload: RoomTypeRequest = {
      name: this.draft.name,
      capacity: this.draft.capacity,
      base_price: this.draft.base_price,
      description: this.draft.description,
      image: this.draft.image
    };

    const obs = this.editingId == null
      ? this.svc.create(payload)
      : this.svc.update(this.editingId, payload);

    obs.subscribe({
      next: () => { 
        this.showForm = false; 
        this.editingId = undefined;
        this.refresh(); 
        void this.showToast('Saved');
      },
      error: (e) => {
        void this.showToast(e?.error?.detail || 'Error saving');
      }
    });
  }

  remove(rt: RoomType) {
    if (!rt.room_type_id) return;
    if (!confirm(`Delete room type "${rt.name}"? Se eliminarán las habitaciones asociadas.`)) return;
    this.svc.delete(rt.room_type_id).subscribe({
      next: () => { 
        this.refresh(); 
        void this.showToast('Deleted');
      },
      error: (e) => {
        void this.showToast(e?.error?.detail || 'Error deleting');
      }
    });
  }

  cancel() { 
    this.showForm = false; 
    this.editingId = undefined;
  }

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
