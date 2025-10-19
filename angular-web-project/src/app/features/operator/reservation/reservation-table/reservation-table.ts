import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ReservationDetail } from '../../../admin/reservation/reservation-detail/reservation-detail';
import { AgGridAngular } from 'ag-grid-angular';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AG_GRID_LOCALE, DATE_FILTER_CONFIG, gridTheme as sharedGridTheme, TEXT_FILTER_CONFIG } from '../../../sharedTableConfig';
import { AllCommunityModule, ColDef, GridApi, GridOptions, ModuleRegistry } from 'ag-grid-community';
import { ReservationService } from '../../../../services/reservation';
import { AuthService } from '../../../../services/auth';
import { StaffMemberService } from '../../../../services/staff-member';
import { StaffMember } from '../../../../model/staff-member';
import { finalize, switchMap } from 'rxjs';
import { MultiSelectFilterComponent } from '../../../admin/filters/multi-select-filter/multi-select-filter';
import { Reservation } from '../../../../model/reservation';
import { ActionButtonsComponent } from '../../../admin/action-buttons-cell/action-buttons-cell';
import { ActionButtonsParams } from '../../../admin/action-buttons-cell/action-buttons-param';
import { HotelsService } from '../../../../services/hotels';
import { UsersService } from '../../../../services/users';
import { RoomService } from '../../../../services/room';
import { forkJoin, map } from 'rxjs';

@Component({
  selector: 'app-reservation-table',
  imports: [CommonModule, FormsModule, AgGridAngular, ReservationDetail],
  templateUrl: './reservation-table.html',
  styleUrl: './reservation-table.css'
})
export class ReservationTableOperatorComponent implements OnInit {
  isBrowser: boolean = false;
  loading: boolean = true;

  // Fuente de datos
  reservations: Reservation[] = [];
  rowData: Reservation[] = [];

  // Selection and detail
  selected?: Reservation;

  private gridApi?: GridApi<Reservation>;
  readonly gridTheme: typeof sharedGridTheme = sharedGridTheme;
  private currentOpId?: number;
  private staffInfo?: StaffMember;
  private auth = inject(AuthService);

  constructor(
    private service: ReservationService,
    private staffService: StaffMemberService,
    private hotelsService: HotelsService,
    private usersService: UsersService,
    private roomService: RoomService
  ) {
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
    const uid = this.auth.userSnapshot()?.user_id;
    if (!uid) { this.loading = false; return; }

    this.staffService.getByUser(uid).pipe(
      switchMap(staff => {
        this.staffInfo = staff;
        return forkJoin({
          reservations: this.service.getAllByHotel(staff.hotel_id),
          hotel: this.hotelsService.get(Number(staff.hotel_id)),
          rooms: this.roomService.listByHotel(Number(staff.hotel_id)),
          users: this.usersService.getAll()
        });
      }),
      map(({ reservations, hotel, rooms, users }) => {
        const usersById = new Map(users.map(u => [u.user_id, u] as const));
        const roomsById = new Map(rooms.map(r => [r.room_id, r] as const));
        const enriched = reservations.map(r => ({
          ...r,
          hotel,
          user: usersById.get(r.user_id),
          room: roomsById.get(r.room_id)
        }));
        return enriched;
      }),
      finalize(() => this.loading = false)
    ).subscribe({
      next: enriched => {
        this.reservations = enriched;
        this.rowData = enriched;
      },
      error: err => console.error('Error loading reservations:', err)
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
        headerName: 'Identificador',
        valueGetter: params => params.data?.user?.national_id || '',
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        maxWidth: 160
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
          // Edit services for a reservation
          onEdit: (row: Reservation) => this.todo() /*this.beginEdit(row)*/,
          onDelete: (row: Reservation) => this.deleteReservation(row) /*this.deleteReservation(row)*/
        } satisfies Pick<ActionButtonsParams<Reservation>, 'onEdit' | 'onDelete'>
      } as ColDef<Reservation> 
    ]
  }

  todo() {
    
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
