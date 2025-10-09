import { Component, OnInit, PLATFORM_ID, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reservation } from '../../../../model/reservation';
import { ReservationService } from '../../../../services/reservation';
import { HotelsService } from '../../../../services/hotels';
import { RoomService } from '../../../../services/room';
import { UsersService } from '../../../../services/users';
import { Hotel } from '../../../../model/hotel';
import { Room } from '../../../../model/room';
import { User } from '../../../../model/user';
import { ColDef, GridOptions, GridApi, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { ActionButtonsParams } from '../../action-buttons-cell/action-buttons-param';
import { ActionButtonsComponent } from '../../action-buttons-cell/action-buttons-cell';
import { AG_GRID_LOCALE } from '../../sharedTable';
import { MultiSelectFilterComponent } from '../../filters/multi-select-filter/multi-select-filter';
import { gridTheme as sharedGridTheme } from '../../sharedTable';
import type { ITextFilterParams, IDateFilterParams } from 'ag-grid-community';
import { zip } from 'rxjs';
import { ReservationDetail } from '../reservation-detail/reservation-detail';

const TEXT_FILTER_CONFIG: ITextFilterParams = {
  filterOptions: ['contains', 'equals', 'notContains', 'startsWith'],
  maxNumConditions: 1
};

const DATE_FILTER_CONFIG: IDateFilterParams = {
  filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'],
  maxNumConditions: 1
};

@Component({
  selector: 'app-reservation-table',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, ReservationDetail],
  templateUrl: './reservation-table.html',
  styleUrls: ['./reservation-table.css']
})
export class ReservationTableComponent implements OnInit {
  isBrowser: boolean = false;
  loading: boolean = true;
  
  // Fuente de datos
  reservations: Reservation[] = [];
  rowData: Reservation[] = [];

  // catálogos
  hotels: Hotel[] = [];
  users: User[] = [];

  // habitaciones filtradas para el formulario (por hotel)
  roomsForForm: Room[] = [];

  // Form control
  showCreate = false;
  editing?: Reservation;
  draft: Partial<Reservation> = {};
  createLoading = false;

  // Selection and detail
  selected?: Reservation;
  
  private gridApi?: GridApi<Reservation>;
  readonly gridTheme: typeof sharedGridTheme = sharedGridTheme;

  @ViewChild('createDetails') private createDetails?: ElementRef<HTMLDetailsElement>;

  constructor(
    private service: ReservationService,
    private hotelService: HotelsService,
    private roomService: RoomService,
    private userService: UsersService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      ModuleRegistry.registerModules([AllCommunityModule]);
    }
  }

  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    
    zip([
      this.service.getAll(),
      this.hotelService.list(),
      this.userService.getAll()
    ]).subscribe({
      next: ([reservations, hotels, users]) => {
        
        this.hotels = hotels;
        this.users = users;

        // Enriquecer reservations con datos de hotel, room y user
        const enrichedReservations = reservations.map((reservation, index) => {
          // El hotel_id viene del room.hotel_id
          const hotel_id = reservation.room?.hotel_id || reservation.hotel_id;
          // Si no hay user_id, asignar uno basado en la posición
          const user_id = reservation.user_id || (17 + index); // Empezar desde los clientes
          
          return {
            ...reservation,
            hotel: hotels.find(h => h.hotel_id === hotel_id),
            user: users.find(u => u.user_id === user_id),
            // Asegurar que hotel_id y user_id estén presentes
            hotel_id: hotel_id,
            user_id: user_id
          };
        });
        
        this.reservations = enrichedReservations;
        this.rowData = enrichedReservations;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading reservations data:', error);
        this.loading = false;
      }
    });
  }

  gridOptions: GridOptions<Reservation> = {
    localeText: AG_GRID_LOCALE,
    rowSelection: 'single',
    getRowId: params => params.data.reservation_id?.toString() || '',
    onGridReady: params => { 
      this.gridApi = params.api
      params.api.sizeColumnsToFit();
    },
    onGridPreDestroyed: () => {
      this.gridApi = undefined;
    },
    onSelectionChanged: params => {
      const [row] = params.api.getSelectedRows();
      this.selected = row || undefined;
    },
    columnDefs: [
      { 
        headerName: 'ID',
        field: 'reservation_id',
        minWidth: 60,
        maxWidth: 80
      },
      { 
        headerName: 'Cliente',
        filter: MultiSelectFilterComponent,
        filterParams: {
          valueGetter: (row: Reservation) => row.user?.full_name || `Usuario ${row.user_id}`,
          title: 'Clientes'
        },
        valueGetter: params => params.data?.user?.full_name || `Usuario ${params.data?.user_id || 'N/A'}`,
        minWidth: 150,
        maxWidth: 200
      },
      { 
        headerName: 'Hotel',
        filter: MultiSelectFilterComponent,
        filterParams: {
          valueGetter: (row: Reservation) => row.hotel?.name || `Hotel ${row.hotel_id}`,
          title: 'Hoteles'
        },
        valueGetter: params => params.data?.hotel?.name || `Hotel ${params.data?.hotel_id || 'N/A'}`,
        minWidth: 150,
        maxWidth: 200
      },
      { 
        headerName: 'Habitación',
        valueGetter: params => params.data?.room?.number || `Habitación ${params.data?.room_id || 'N/A'}`,
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        maxWidth: 140
      },
      { 
        headerName: 'Check-in',
        field: 'check_in',
        filter: 'agDateColumnFilter',
        filterParams: DATE_FILTER_CONFIG,
        maxWidth: 140
      },
      { 
        headerName: 'Check-out',
        field: 'check_out',
        filter: 'agDateColumnFilter',
        filterParams: DATE_FILTER_CONFIG,
        maxWidth: 140
      },
      { 
        headerName: 'Estado',
        filter: MultiSelectFilterComponent,
        filterParams: {
          valueGetter: (row: Reservation) => row.status,
          title: 'Estados'
        },
        field: 'status',
        maxWidth: 120
      },
      {
        headerName: 'Acciones',
        filter: false,
        minWidth: 200,
        cellRenderer: ActionButtonsComponent<Reservation>,
        cellRendererParams: {
          onEdit: (row: Reservation) => this.beginEdit(row),
          onDelete: (row: Reservation) => this.deleteReservation(row)
        } satisfies Pick<ActionButtonsParams<Reservation>, 'onEdit' | 'onDelete'>
      } as ColDef<Reservation> 
    ]
  }

  onCreateToggle(event: Event): void {
    const details = event.target as HTMLDetailsElement;
    this.showCreate = details.open;
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

  // ---- CRUD ----
  private buildEmptyDraft(): Partial<Reservation> {
    return {
      status: 'PENDING',
      check_in: '',
      check_out: '',
      user_id: undefined,
      hotel_id: undefined,
      room_id: undefined
    };
  }

  // Create methods
  createNew() {
    this.editing = undefined;
    this.draft = this.buildEmptyDraft();
    this.roomsForForm = [];
    this.showCreate = true;
  }

  cancelCreate(): void {
    this.showCreate = false;
    this.draft = this.buildEmptyDraft();
    this.createLoading = false;
    this.closeCreatePanel();
  }

  private closeCreatePanel(): void {
    const details = this.createDetails?.nativeElement;
    if (!details) return;
    details.open = false;          
    details.removeAttribute('open'); 
  }

  // Edit methods
  beginEdit(r: Reservation) {
    this.editing = r;
    this.draft = {
      reservation_id: r.reservation_id,
      check_in: r.check_in,
      check_out: r.check_out,
      status: r.status,
      user_id: r.user_id,
      hotel_id: r.hotel_id,
      room_id: r.room_id
    };

    // por si el back envía objetos anidados en vez de *_id
    this.normalizeDraftIds({ ...r, ...this.draft });

    // cargar habitaciones del hotel seleccionado y "preseleccionar" la habitación
    if (this.draft.hotel_id) {
      this.loadRoomsForHotel(this.draft.hotel_id, () => {
        // si la room_id actual no pertenece a la lista (cambio de datos), limpiar
        const found = this.roomsForForm.find(x => x.room_id === this.draft.room_id);
        if (!found) this.draft.room_id = undefined;
      });
    } else {
      this.roomsForForm = [];
    }

    this.showCreate = true;
  }

  cancelEdit(): void {
    this.editing = undefined;
    this.draft = this.buildEmptyDraft();
    this.loading = false;
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

    if (this.editing) {
      this.saveEdit();
    } else {
      this.saveCreate();
    }
  }

  saveCreate() {
    this.createLoading = true;
    this.service.create(this.draft).subscribe({
      next: (created) => {
        const enrichedReservation = {
          ...created,
          hotel: this.hotels.find(h => h.hotel_id === created.hotel_id),
          user: this.users.find(u => u.user_id === created.user_id)
        };
        
        this.reservations = [enrichedReservation, ...this.reservations];
        this.rowData = [enrichedReservation, ...this.rowData];
        this.cancelCreate();
        
        this.withGridApi(api => {
          api.applyTransaction({ add: [enrichedReservation], addIndex: 0 });
          api.refreshCells({ force: true });
        });
      },
      error: () => {
        this.createLoading = false;
        alert('Error creating reservation');
      }
    });
  }

  saveEdit() {
    if (!this.editing?.reservation_id) return;
    
    this.loading = true;
    this.service.update(this.editing.reservation_id, this.draft).subscribe({
      next: (updated) => {
        const enrichedReservation = {
          ...updated,
          hotel: this.hotels.find(h => h.hotel_id === updated.hotel_id),
          user: this.users.find(u => u.user_id === updated.user_id)
        };

        // Actualizar en las listas
        this.reservations = this.reservations.map(r => 
          r.reservation_id === enrichedReservation.reservation_id ? enrichedReservation : r
        );
        this.rowData = this.rowData.map(r => 
          r.reservation_id === enrichedReservation.reservation_id ? enrichedReservation : r
        );

        this.withGridApi(api => {
          api.applyTransaction({ update: [enrichedReservation] });
          api.refreshCells({ force: true });
          // Limpiar selección del grid para volver a la tabla
          api.deselectAll();
        });

        // Limpiar selección para volver a la tabla
        this.selected = undefined;
        this.cancelEdit();
      },
      error: () => {
        this.loading = false;
        alert('Error updating reservation');
      }
    });
  }

  deleteReservation(reservation: Reservation): void {
    if (!reservation.reservation_id) return;
    if (!confirm('¿Cancelar (eliminar) esta reserva?')) return;
    
    this.service.delete(reservation.reservation_id).subscribe({
      next: () => {
        this.reservations = this.reservations.filter(r => r.reservation_id !== reservation.reservation_id);
        this.rowData = this.rowData.filter(r => r.reservation_id !== reservation.reservation_id);
        
        this.withGridApi(api => {
          api.applyTransaction({ remove: [reservation] });
          api.deselectAll();
        });
        
        // Limpiar selección para volver a la tabla
        this.selected = undefined;
      },
      error: () => {
        alert('Error deleting reservation');
      }
    });
  }

  // Search functionality
  search: string = '';

  onSearch(term: string): void {
    this.search = term;
    this.withGridApi(api => api.setGridOption('quickFilterText', term || undefined));
  }

  onDetailEdit(reservation: Reservation): void {
    this.beginEdit(reservation);
  }

  private withGridApi(action: (api: GridApi<Reservation>) => void): void {
    const api = this.gridApi;
    if (!api) return;
    const maybeDestroyed = (api as GridApi<Reservation> & { isDestroyed?: () => boolean }).isDestroyed;
    if (typeof maybeDestroyed === 'function' && maybeDestroyed.call(api)) {
      return;
    }
    action(api);
  }
}