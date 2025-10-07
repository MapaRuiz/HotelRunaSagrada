import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomType } from '../../../../model/room-type';
import { RoomTypeService, RoomTypeRequest } from '../../../../services/room-type';
import toast from 'bootstrap/js/dist/toast';

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

  constructor(private svc: RoomTypeService) {}

  ngOnInit(): void { this.refresh(); }

  refresh() {
    this.loading = true;
    this.svc.list().subscribe({
      next: (rows) => { this.roomTypes = rows; this.loading = false; },
      error: () => { 
        this.loading = false;
        const toastElement = document.createElement('div');
        toastElement.className = 'toast';
        toastElement.textContent = 'Error loading room types';
        const toastInstance = new toast(toastElement);
        toastInstance.show();
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
        const toastElement = document.createElement('div');
        toastElement.className = 'toast';
        toastElement.textContent = 'Saved';
        const toastInstance = new toast(toastElement);
        toastInstance.show();
      },
      error: (e) => {
        const toastElement = document.createElement('div');
        toastElement.className = 'toast';
        toastElement.textContent = e?.error?.detail || 'Error saving';
        const toastInstance = new toast(toastElement);
        toastInstance.show();
      }
    });
  }

  remove(rt: RoomType) {
    if (!rt.room_type_id) return;
    if (!confirm(`Delete room type "${rt.name}"? Se eliminarán las habitaciones asociadas.`)) return;
    this.svc.delete(rt.room_type_id).subscribe({
      next: () => { 
        this.refresh(); 
        const toastElement = document.createElement('div');
        toastElement.className = 'toast';
        toastElement.textContent = 'Deleted';
        const toastInstance = new toast(toastElement);
        toastInstance.show();
      },
      error: (e) => {
        const toastElement = document.createElement('div');
        toastElement.className = 'toast';
        toastElement.textContent = e?.error?.detail || 'Error deleting';
        const toastInstance = new toast(toastElement);
        toastInstance.show();
      }
    });
  }

  cancel() { 
    this.showForm = false; 
    this.editingId = undefined;
  }
}
