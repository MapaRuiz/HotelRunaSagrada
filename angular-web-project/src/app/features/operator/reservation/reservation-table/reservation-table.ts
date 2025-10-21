import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ReservationDetailOp } from '../reservation-detail-op/reservation-detail-op';
import { AgGridAngular } from 'ag-grid-angular';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AG_GRID_LOCALE,
  DATE_FILTER_CONFIG,
  gridTheme as sharedGridTheme,
  TEXT_FILTER_CONFIG,
} from '../../../sharedTableConfig';
import {
  AllCommunityModule,
  ColDef,
  GridApi,
  GridOptions,
  ModuleRegistry,
} from 'ag-grid-community';
import { ReservationService } from '../../../../services/reservation';
import { finalize } from 'rxjs';
import { MultiSelectFilterComponent } from '../../../admin/filters/multi-select-filter/multi-select-filter';
import { Reservation } from '../../../../model/reservation';
import { ActionButtonsComponent } from '../../../admin/action-buttons-cell/action-buttons-cell';
import { ActionButtonsParams } from '../../../admin/action-buttons-cell/action-buttons-param';
import { getStatusBadge, getStatusText } from '../reservation';
import { ReservationFacade } from '../reservation';

@Component({
  selector: 'app-reservation-table',
  imports: [CommonModule, FormsModule, AgGridAngular, ReservationDetailOp],
  templateUrl: './reservation-table.html',
  styleUrl: './reservation-table.css',
})
export class ReservationTableOperatorComponent implements OnInit {
  isBrowser: boolean = false;
  loading: boolean = true;

  // Data source
  reservations: Reservation[] = [];
  rowData: Reservation[] = [];

  // Selection and detail
  selected?: Reservation;
  // Hide table when detail enters edit mode
  detailEditing = false;

  private gridApi?: GridApi<Reservation>;
  readonly gridTheme: typeof sharedGridTheme = sharedGridTheme;
  private currentOpId?: number;

  constructor(private service: ReservationService, private facade: ReservationFacade) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      ModuleRegistry.registerModules([AllCommunityModule]);
    }
  }

  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.facade
      .getHotelReservationsForOperator()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (enriched) => {
          this.reservations = enriched;
          this.rowData = enriched;
        },
        error: (err) => console.error('Error loading reservations:', err),
      });
  }

  gridOptions: GridOptions<Reservation> = {
    localeText: AG_GRID_LOCALE,
    rowSelection: 'single',
    getRowId: (params) => params.data.reservation_id?.toString() || '',
    onGridReady: (params) => {
      this.gridApi = params.api;
      params.api.sizeColumnsToFit();
    },
    onGridPreDestroyed: () => {
      this.gridApi = undefined;
    },
    onSelectionChanged: (params) => {
      const [row] = params.api.getSelectedRows();
      this.selected = row || undefined;
    },
    columnDefs: [
      {
        headerName: 'ID',
        field: 'reservation_id',
        minWidth: 60,
        maxWidth: 80,
      },
      {
        headerName: 'Cliente',
        filter: MultiSelectFilterComponent,
        filterParams: {
          valueGetter: (row: Reservation) => row.user?.full_name || `Usuario ${row.user_id}`,
          title: 'Clientes',
        },
        valueGetter: (params) =>
          params.data?.user?.full_name || `Usuario ${params.data?.user_id || 'N/A'}`,
        minWidth: 150,
        maxWidth: 200,
      },
      {
        headerName: 'Identificador',
        valueGetter: (params) => params.data?.user?.national_id || '',
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        maxWidth: 160,
      },
      {
        headerName: 'Hotel',
        filter: MultiSelectFilterComponent,
        filterParams: {
          valueGetter: (row: Reservation) => row.hotel?.name || `Hotel ${row.hotel_id}`,
          title: 'Hoteles',
        },
        valueGetter: (params) =>
          params.data?.hotel?.name || `Hotel ${params.data?.hotel_id || 'N/A'}`,
        minWidth: 150,
        maxWidth: 200,
      },
      {
        headerName: 'Habitación',
        valueGetter: (params) =>
          params.data?.room?.number || `Habitación ${params.data?.room_id || 'N/A'}`,
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        maxWidth: 140,
      },
      {
        headerName: 'Check-in',
        field: 'check_in',
        filter: 'agDateColumnFilter',
        filterParams: DATE_FILTER_CONFIG,
        maxWidth: 140,
      },
      {
        headerName: 'Check-out',
        field: 'check_out',
        filter: 'agDateColumnFilter',
        filterParams: DATE_FILTER_CONFIG,
        maxWidth: 140,
      },
      {
        headerName: 'Estado',
        field: 'status',
        filter: MultiSelectFilterComponent,
        filterParams: {
          valueGetter: (row: Reservation) => getStatusText(row.status),
          title: 'Estados',
        },
        cellRenderer: (p: any) => {
          const s = String(p.value || '');
          const el = document.createElement('span');
          el.classList.add('badge', getStatusBadge(s));
          el.textContent = getStatusText(s);
          return el;
        },
        maxWidth: 140,
      },
      {
        headerName: 'Acciones',
        filter: false,
        minWidth: 200,
        cellRenderer: ActionButtonsComponent<Reservation>,
        cellRendererParams: (p: { data: Reservation }) => {
          const row = p.data as Reservation;
          const status = row?.status;
          const canEditDelete = status === 'PENDING' || status === 'CONFIRMED';

          const extraButton =
            status === 'PENDING'
              ? {
                  label: 'Activar',
                  class: 'btn-details',
                  action: (r: Reservation) => this.activateReservation(r),
                }
              : status === 'CONFIRMED'
              ? {
                  label: 'Desactivar',
                  class: 'btn-details',
                  action: (r: Reservation) => this.payReservation(r),
                }
              : status === 'FINISHED'
              ? {
                  label: 'Detalles',
                  class: 'btn-edit',
                  action: (r: Reservation) => (console.log('Detalles'), this.openEditForRow(r)),
                }
              : undefined;

          return {
            onEdit: canEditDelete ? (r: Reservation) => this.beginEdit(r) : undefined,
            onDelete: canEditDelete ? (r: Reservation) => this.deleteReservation(r) : undefined,
            additionalButtons: extraButton ? [extraButton] : [],
          };
        },
      } as ColDef<Reservation>,
    ],
  };

  openEditForRow(row: Reservation) {
    this.selected = row;
  }

  beginEdit(row: Reservation) {
    // Open the detail view for the selected reservation
    this.selected = row;
  }

  activateReservation(reservation: Reservation): void {
    if (!reservation.reservation_id) return;
    this.service.activate(reservation.reservation_id).subscribe({
      next: () => {
        this.loadData();
      },
      error: () => {
        alert('Error activating reservation');
      },
    });
  }

  payReservation(r: Reservation) {
    throw new Error('Method not implemented.');
  }
  // Delete
  deleteReservation(reservation: Reservation): void {
    if (!reservation.reservation_id) return;
    if (!confirm('¿Cancelar (eliminar) esta reserva?')) return;

    this.service.delete(reservation.reservation_id).subscribe({
      next: () => {
        this.reservations = this.reservations.filter(
          (r) => r.reservation_id !== reservation.reservation_id
        );
        this.rowData = this.rowData.filter((r) => r.reservation_id !== reservation.reservation_id);

        this.withGridApi((api) => {
          api.applyTransaction({ remove: [reservation] });
          api.deselectAll();
        });

        // Limpiar selección para volver a la tabla
        this.selected = undefined;
      },
      error: () => {
        alert('Error deleting reservation');
      },
    });
  }

  // Search
  search: string = '';

  onSearch(term: string): void {
    this.search = term;
    this.withGridApi((api) => api.setGridOption('quickFilterText', term || undefined));
  }

  // Edit Reservation Services

  private withGridApi(action: (api: GridApi<Reservation>) => void): void {
    const api = this.gridApi;
    if (!api) return;
    const maybeDestroyed = (api as GridApi<Reservation> & { isDestroyed?: () => boolean })
      .isDestroyed;
    if (typeof maybeDestroyed === 'function' && maybeDestroyed.call(api)) {
      return;
    }
    action(api);
  }

  // editingChanged is handled in template to set detailEditing
  onCloseDetail() {
    this.selected = undefined;
    this.detailEditing = false;
  }
}
