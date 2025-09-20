import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AmenitiesService } from '../../../services/amenities';
import { Amenity, AmenityType } from '../../../model/amenity';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-admin-amenities',
  imports: [CommonModule, FormsModule],
  template: `
  <h4>Amenities</h4>

  <div class="card p-3 mt-3">
    <h5>Añadir nueva amenity</h5>
    <div class="row g-3">
      <div class="col-md-4">
        <label class="form-label">Nombre</label>
        <input class="form-control" placeholder="Nombre de amenity" [(ngModel)]="newName">
      </div>
      <div class="col-md-4">
        <label class="form-label">Imagen URL</label>
        <input class="form-control" placeholder="URL de imagen" [(ngModel)]="newImage">
        <div class="mt-2" *ngIf="newImage as src">
          <img [src]="img(src)" (error)="imgBrokenCreate=true" (load)="imgBrokenCreate=false"
               style="width:160px;height:90px;object-fit:cover;border-radius:8px;">
          <div class="text-danger small mt-1" *ngIf="imgBrokenCreate">No se pudo cargar la imagen.</div>
        </div>
      </div>
      <div class="col-md-3">
        <label class="form-label">Tipo</label>
        <select class="form-select" [(ngModel)]="newType">
          <option [ngValue]="amenityTypes.HOTEL">Hotel</option>
          <option [ngValue]="amenityTypes.ROOM">Habitación</option>
        </select>
      </div>
      <div class="col-md-1 d-flex align-items-end">
        <button class="btn btn-primary w-100" (click)="add()">Añadir</button>
      </div>
    </div>
  </div>

  <table class="table table-striped mt-3" *ngIf="list.length; else empty">
    <thead>
      <tr>
        <th>ID</th>
        <th>Imagen</th>
        <th>Nombre</th>
        <th>Tipo</th>
        <th class="text-end">Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let a of list">
        <ng-container *ngIf="editId !== a.amenity_id; else editRow">
          <td>{{a.amenity_id}}</td>
          <td><img [src]="img(a.image)" alt="{{a.name}}" style="height: 40px; width: 40px; object-fit: contain;"></td>
          <td>{{a.name}}</td>
          <td>{{a.type === amenityTypes.HOTEL ? 'Hotel' : 'Habitación'}}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary me-2" (click)="beginEdit(a)">Editar</button>
            <button class="btn btn-sm btn-outline-danger" (click)="remove(a)">Eliminar</button>
          </td>
        </ng-container>

        <ng-template #editRow>
          <td>{{a.amenity_id}}</td>
          <td>
            <input class="form-control form-control-sm" placeholder="URL de imagen" [(ngModel)]="draftImage">
            <div class="mt-2" *ngIf="draftImage as src">
              <img [src]="img(src)" (error)="imgBrokenEdit=true" (load)="imgBrokenEdit=false"
                   style="width:120px;height:68px;object-fit:cover;border-radius:6px;">
              <div class="text-danger small mt-1" *ngIf="imgBrokenEdit">No se pudo cargar la imagen.</div>
            </div>
          </td>
          <td>
            <input class="form-control form-control-sm" [(ngModel)]="draftName">
          </td>
          <td>
            <select class="form-select form-select-sm" [(ngModel)]="draftType">
              <option [ngValue]="amenityTypes.HOTEL">Hotel</option>
              <option [ngValue]="amenityTypes.ROOM">Habitación</option>
            </select>
          </td>
          <td class="text-end">
            <button class="btn btn-sm btn-primary me-2" (click)="save(a)">Guardar</button>
            <button class="btn btn-sm btn-secondary" (click)="cancel()">Cancelar</button>
          </td>
        </ng-template>
      </tr>
    </tbody>
  </table>

  <ng-template #empty>
    <div class="alert alert-info mt-3">No hay amenities.</div>
  </ng-template>
  `,
})
export class AmenitiesComponent implements OnInit {
  private api = inject(AmenitiesService);
  amenityTypes = AmenityType; // Para usar en el template

  list: Amenity[] = [];
  newName = '';
  newImage = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80';
  newType = AmenityType.HOTEL;
  imgBrokenCreate = false;

  editId: number | null = null;
  draftName = '';
  draftImage = '';
  draftType = AmenityType.HOTEL;
  imgBrokenEdit = false;
  
  // Base del backend para imágenes (/images/...) – usa backendBaseUrl si existe; si no, deriva de apiBaseUrl
  private backendBase = (environment as any).backendBaseUrl
    || (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  ngOnInit() { this.load(); }

  load() {
    this.api.list().subscribe(d => this.list = d);
  }
  
  // Helper imagen
  img(path?: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.backendBase}${path}`;
  }

  add() {
    const name = this.newName?.trim();
    if (!name) return;
    
    this.api.create({ 
      name, 
      image: this.newImage, 
      type: this.newType 
    }).subscribe({
      next: a => { 
        this.list = [a, ...this.list]; 
        this.newName = ''; 
        this.newImage = '/images/amenities/default.png';
        this.newType = AmenityType.HOTEL;
      },
      error: e => alert(e?.error?.message || e.message || 'Error al crear amenity')
    });
  }

  beginEdit(a: Amenity) { 
    this.editId = a.amenity_id; 
    this.draftName = a.name; 
    this.draftImage = a.image;
    this.draftType = a.type;
    this.imgBrokenEdit = false;
  }
  
  cancel() { 
    this.editId = null; 
    this.draftName = ''; 
    this.draftImage = '';
    this.draftType = AmenityType.HOTEL;
    this.imgBrokenEdit = false;
  }

  save(a: Amenity) {
    const name = this.draftName?.trim();
    if (!name) return;
    
    this.api.update(a.amenity_id, { 
      name, 
      image: this.draftImage,
      type: this.draftType
    }).subscribe({
      next: upd => {
        this.list = this.list.map(x => x.amenity_id === upd.amenity_id ? upd : x);
        this.cancel();
      },
      error: e => alert(e?.error?.message || e.message || 'Error al actualizar')
    });
  }

  remove(a: Amenity) {
    if (!confirm(`¿Eliminar amenity "${a.name}"?`)) return;
    this.api.delete(a.amenity_id).subscribe({
      next: () => this.list = this.list.filter(x => x.amenity_id !== a.amenity_id),
      error: e => alert(e?.error?.message || e.message || 'Error al eliminar')
    });
  }
}
