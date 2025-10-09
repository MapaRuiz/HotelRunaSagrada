import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';

@Component({
  standalone: true,
  selector: 'app-client-reservations-grid',
  imports: [CommonModule, AgGridModule],
  template: `
    <ag-grid-angular
      style="width: 100%; height: 400px;"
      class="ag-theme-alpine"
      [rowData]="reservations"
      [columnDefs]="colDefs"
      [defaultColDef]="{ resizable: true, sortable: true, filter: true }">
    </ag-grid-angular>
  `
})
export class ClientReservationsGridComponent {
  @Input() reservations: any[] = [];
  @Input() colDefs: ColDef[] = [];
}
