import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HotelsService } from '../../../services/hotels';
import { AmenitiesService } from '../../../services/amenities';
import { environment } from '../../../../environments/environment';

interface Amenity {
  amenity_id: number;
  name: string;
}

interface Hotel {
  hotel_id: number;
  name: string;
  latitude?: string;
  longitude?: string;
  description?: string;
  check_in_after?: string;   // "HH:mm"
  check_out_before?: string; // "HH:mm"
  image?: string;
  amenities?: Amenity[];
}

@Component({
  standalone: true,
  selector: 'app-admin-hotels',
  imports: [CommonModule, FormsModule],
  template: `
  <h4>Hoteles</h4>

  <!-- Crear -->
  <details class="mt-3">
    <summary class="mb-2">Crear hotel</summary>
    <div class="card card-body">
      <div class="row g-2">
        <div class="col-md-4">
          <label class="form-label">Nombre *</label>
          <input class="form-control" [(ngModel)]="createForm.name">
        </div>
        <div class="col-md-4">
          <label class="form-label">Imagen (ruta/URL)</label>
          <input class="form-control" [(ngModel)]="createForm.image" placeholder="/images/hotels/ejemplo.jpg o https://...">
          <div class="mt-2" *ngIf="createForm.image as src">
            <img [src]="img(src)" (error)="imgBrokenCreate=true" (load)="imgBrokenCreate=false"
                 style="width:160px;height:90px;object-fit:cover;border-radius:8px;">
            <div class="text-danger small mt-1" *ngIf="imgBrokenCreate">No se pudo cargar la imagen.</div>
          </div>
        </div>
        <div class="col-md-2">
          <label class="form-label">Check-in</label>
          <input class="form-control" [(ngModel)]="createForm.check_in_after" placeholder="15:00">
        </div>
        <div class="col-md-2">
          <label class="form-label">Check-out</label>
          <input class="form-control" [(ngModel)]="createForm.check_out_before" placeholder="12:00">
        </div>
        <div class="col-md-6">
          <label class="form-label">Latitud</label>
          <input class="form-control" [(ngModel)]="createForm.latitude">
        </div>
        <div class="col-md-6">
          <label class="form-label">Longitud</label>
          <input class="form-control" [(ngModel)]="createForm.longitude">
        </div>
        <div class="col-12">
          <label class="form-label">Descripción</label>
          <textarea class="form-control" rows="2" [(ngModel)]="createForm.description"></textarea>
        </div>
      </div>

      <div class="mt-3">
        <strong>Amenities</strong>
        <div class="d-flex flex-wrap gap-3 mt-2">
          <label class="form-check" *ngFor="let a of allAmenities">
            <input class="form-check-input" type="checkbox" #cbCreate
                   [checked]="createAmenityIds.has(a.amenity_id)"
                   (change)="toggleCreateAmenity(a.amenity_id, cbCreate.checked)">
            <span class="ms-1">{{a.name}}</span>
          </label>
        </div>
      </div>

      <div class="mt-3 d-flex gap-2">
        <button class="btn btn-primary" (click)="create()">Crear</button>
        <button class="btn btn-secondary" (click)="resetCreate()">Limpiar</button>
      </div>
    </div>
  </details>

  <!-- Lista -->
  <table class="table table-striped mt-4" *ngIf="list.length; else empty">
    <thead>
      <tr>
        <th>ID</th><th>Nombre</th><th>Imagen</th><th>Check</th>
        <th>Lat/Lon</th><th>Amenities (n)</th><th class="text-end">Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let h of list">
        <ng-container *ngIf="editId !== h.hotel_id; else editRow">
          <td>{{h.hotel_id}}</td>
          <td>
            <div class="fw-semibold">{{h.name}}</div>
            <div class="text-muted small" *ngIf="h.description">{{h.description}}</div>
          </td>
          <td>
            <img *ngIf="h.image" [src]="img(h.image)" alt="" style="width:82px; height:48px; object-fit:cover; border-radius:6px;">
          </td>
          <td class="small">
            <div>In: {{h.check_in_after || '—'}}</div>
            <div>Out: {{h.check_out_before || '—'}}</div>
          </td>
          <td class="small">
            <div>{{h.latitude || '—'}}</div>
            <div>{{h.longitude || '—'}}</div>
          </td>
          <td>{{h.amenities?.length || 0}}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary me-2" (click)="beginEdit(h)">Editar</button>
            <button class="btn btn-sm btn-outline-danger" (click)="remove(h)">Eliminar</button>
          </td>
        </ng-container>

        <ng-template #editRow>
          <td>{{h.hotel_id}}</td>
          <td>
            <input class="form-control form-control-sm mb-1" [(ngModel)]="draft.name" placeholder="Nombre *">
            <textarea class="form-control form-control-sm" rows="2" [(ngModel)]="draft.description" placeholder="Descripción"></textarea>
          </td>
          <td>
            <input class="form-control form-control-sm" [(ngModel)]="draft.image" placeholder="/images/hotels/ejemplo.jpg o https://...">
            <div class="mt-2" *ngIf="draft.image as src">
              <img [src]="img(src)" (error)="imgBrokenEdit=true" (load)="imgBrokenEdit=false"
                   style="width:120px;height:68px;object-fit:cover;border-radius:6px;">
              <div class="text-danger small mt-1" *ngIf="imgBrokenEdit">No se pudo cargar la imagen.</div>
            </div>
          </td>
          <td class="small">
            <input class="form-control form-control-sm mb-1" [(ngModel)]="draft.check_in_after" placeholder="15:00">
            <input class="form-control form-control-sm" [(ngModel)]="draft.check_out_before" placeholder="12:00">
          </td>
          <td class="small">
            <input class="form-control form-control-sm mb-1" [(ngModel)]="draft.latitude" placeholder="lat">
            <input class="form-control form-control-sm" [(ngModel)]="draft.longitude" placeholder="lon">
          </td>
          <td colspan="2">
            <div class="d-flex flex-wrap gap-3">
              <label class="form-check" *ngFor="let a of allAmenities">
                <input class="form-check-input" type="checkbox" #cbEdit
                       [checked]="editAmenityIds.has(a.amenity_id)"
                       (change)="toggleEditAmenity(a.amenity_id, cbEdit.checked)">
                <span class="ms-1">{{a.name}}</span>
              </label>
            </div>
            <div class="text-end mt-2">
              <button class="btn btn-sm btn-primary me-2" (click)="save(h)">Guardar</button>
              <button class="btn btn-sm btn-secondary" (click)="cancel()">Cancelar</button>
            </div>
          </td>
        </ng-template>
      </tr>
    </tbody>
  </table>

  <ng-template #empty>
    <div class="alert alert-info mt-3">No hay hoteles.</div>
  </ng-template>
  `,
})
export class HotelsComponent implements OnInit {
  private hotelsApi = inject(HotelsService);
  private amenitiesApi = inject(AmenitiesService);

  list: Hotel[] = [];
  allAmenities: Amenity[] = [];

  // Crear
  createForm: Partial<Hotel> = { name: '', image: '', check_in_after: '', check_out_before: '' };
  createAmenityIds = new Set<number>();
  imgBrokenCreate = false;

  // Editar
  editId: number | null = null;
  draft: Partial<Hotel> = {};
  editAmenityIds = new Set<number>();
  imgBrokenEdit = false;

  // Base del backend para imágenes (/images/...) – usa backendBaseUrl si existe; si no, deriva de apiBaseUrl
  private backendBase = (environment as any).backendBaseUrl
    || (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.amenitiesApi.list().subscribe(a => this.allAmenities = a);
    this.hotelsApi.list().subscribe(h => this.list = h.sort((x,y)=>(x.hotel_id||0)-(y.hotel_id||0)));
  }

  // Helper imagen
  img(path?: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.backendBase}${path}`;
  }

  // ----- Crear -----
  toggleCreateAmenity(id: number, checked: boolean) {
    if (checked) this.createAmenityIds.add(id); else this.createAmenityIds.delete(id);
  }
  resetCreate() {
    this.createForm = { name: '', image: '', check_in_after: '', check_out_before: '' };
    this.createAmenityIds.clear();
    this.imgBrokenCreate = false;
  }
  create() {
    const name = this.createForm.name?.trim();
    if (!name) { alert('El nombre es obligatorio'); return; }

    // UI snake_case -> payload snake_case (el back mapea por SNAKE_CASE)
    const body = {
      name: this.createForm.name,
      latitude: this.createForm.latitude,
      longitude: this.createForm.longitude,
      description: this.createForm.description,
      check_in_after: this.createForm.check_in_after,
      check_out_before: this.createForm.check_out_before,
      image: this.createForm.image,
      amenity_ids: Array.from(this.createAmenityIds)
    };
    this.hotelsApi.create(body).subscribe({
      next: h => { this.list = [h, ...this.list]; this.resetCreate(); },
      error: e => alert(e?.error?.message || e.message || 'Error al crear hotel')
    });
  }

  // ----- Editar -----
  beginEdit(h: Hotel) {
    this.editId = h.hotel_id;
    this.draft = {
      name: h.name,
      latitude: h.latitude,
      longitude: h.longitude,
      description: h.description,
      check_in_after: h.check_in_after,
      check_out_before: h.check_out_before,
      image: h.image
    };
    this.editAmenityIds = new Set<number>((h.amenities || []).map(a => a.amenity_id));
    this.imgBrokenEdit = false;
  }
  cancel() { this.editId = null; this.draft = {}; this.editAmenityIds.clear(); this.imgBrokenEdit = false; }

  toggleEditAmenity(id: number, checked: boolean) {
    if (checked) this.editAmenityIds.add(id); else this.editAmenityIds.delete(id);
  }

  save(h: Hotel) {
    const body = {
      name: this.draft.name,
      latitude: this.draft.latitude,
      longitude: this.draft.longitude,
      description: this.draft.description,
      check_in_after: this.draft.check_in_after,
      check_out_before: this.draft.check_out_before,
      image: this.draft.image,
      amenity_ids: Array.from(this.editAmenityIds)   // 👈 ahora también en snake_case
    };
    this.hotelsApi.update(h.hotel_id, body).subscribe({
      next: upd => {
        this.list = this.list.map(x => x.hotel_id === upd.hotel_id ? upd : x);
        this.cancel();
      },
      error: e => alert(e?.error?.message || e.message || 'Error al actualizar hotel')
    });
  }

  remove(h: Hotel) {
    if (!confirm(`¿Eliminar hotel "${h.name}"?`)) return;
    this.hotelsApi.delete(h.hotel_id).subscribe({
      next: () => this.list = this.list.filter(x => x.hotel_id !== h.hotel_id),
      error: e => alert(e?.error?.message || e.message || 'Error al eliminar hotel')
    });
  }
}
