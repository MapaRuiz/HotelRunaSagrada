import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AmenitiesService } from '../../../services/amenities';
import { Amenity } from '../../../model/amenity';

@Component({
  standalone: true,
  selector: 'app-admin-amenities',
  imports: [CommonModule, FormsModule],
  template: `
  <h4>Amenities</h4>

  <div class="d-flex gap-2 mt-3">
    <input class="form-control w-auto" placeholder="Nueva amenity" [(ngModel)]="newName">
    <button class="btn btn-primary" (click)="add()">Añadir</button>
  </div>

  <table class="table table-striped mt-3" *ngIf="list.length; else empty">
    <thead>
      <tr><th>ID</th><th>Nombre</th><th class="text-end">Acciones</th></tr>
    </thead>
    <tbody>
      <tr *ngFor="let a of list">
        <ng-container *ngIf="editId !== a.amenity_id; else editRow">
          <td>{{a.amenity_id}}</td>
          <td>{{a.name}}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary me-2" (click)="beginEdit(a)">Editar</button>
            <button class="btn btn-sm btn-outline-danger" (click)="remove(a)">Eliminar</button>
          </td>
        </ng-container>

        <ng-template #editRow>
          <td>{{a.amenity_id}}</td>
          <td><input class="form-control form-control-sm" [(ngModel)]="draftName"></td>
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

  list: Amenity[] = [];
  newName = '';

  editId: number | null = null;
  draftName = '';

  ngOnInit() { this.load(); }

  load() {
    this.api.list().subscribe(d => this.list = d);
  }

  add() {
    const name = this.newName?.trim();
    if (!name) return;
    this.api.create({ name }).subscribe({
      next: a => { this.list = [a, ...this.list]; this.newName = ''; },
      error: e => alert(e?.error?.message || e.message || 'Error al crear amenity')
    });
  }

  beginEdit(a: Amenity) { this.editId = a.amenity_id; this.draftName = a.name; }
  cancel() { this.editId = null; this.draftName = ''; }

  save(a: Amenity) {
    const name = this.draftName?.trim();
    if (!name) return;
    this.api.update(a.amenity_id, { name }).subscribe({
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
