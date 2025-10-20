import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  ColDef,
  GridApi,
  GridOptions,
  ModuleRegistry,
} from 'ag-grid-community';
import { Reservation } from '../../../../model/reservation';
import { UsersService } from '../../../../services/users';
import { forkJoin, map, of } from 'rxjs';
import { ActionButtonsComponent } from '../../../admin/action-buttons-cell/action-buttons-cell';
import { getStatusBadge, getStatusText } from '../../reservation/reservation';
import {
  AG_GRID_LOCALE,
  DATE_FILTER_CONFIG,
  TEXT_FILTER_CONFIG,
  gridTheme as sharedGridTheme,
} from '../../../sharedTableConfig';

@Component({
  selector: 'app-search-result-table',
  standalone: true,
  imports: [CommonModule, AgGridAngular],
  templateUrl: './search-result-table.html',
  styleUrl: './search-result-table.css',
})
export class SearchResultTable implements OnChanges {
  @Input() reservations: Reservation[] = [];
  @Output() openDetail = new EventEmitter<Reservation>();

  isBrowser = false;
  readonly gridTheme: typeof sharedGridTheme = sharedGridTheme;
  private platformId = inject(PLATFORM_ID);
  private gridApi?: GridApi<Reservation>;

  rowData: Reservation[] = [];

  constructor(private usersService: UsersService) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      ModuleRegistry.registerModules([AllCommunityModule]);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reservations']) {
      this.enrichUsers(this.reservations);
    }
  }

  private enrichUsers(reservations: Reservation[]) {
    if (!reservations?.length) {
      this.rowData = [];
      return;
    }

    const needsUsers = reservations.some((r) => !r.user);
    if (!needsUsers) {
      this.rowData = reservations;
      return;
    }

    const ids = Array.from(new Set(reservations.map((r) => r.user_id).filter(Boolean)));
    const req$ = ids.length ? forkJoin(ids.map((id) => this.usersService.getById(id))) : of([]);

    req$
      .pipe(
        map((users) => {
          const mapById = new Map(users.map((u) => [u.user_id, u] as const));
          return reservations.map((r) => ({ ...r, user: r.user ?? mapById.get(r.user_id) }));
        })
      )
      .subscribe({ next: (enriched) => (this.rowData = enriched) });
  }

  gridOptions: GridOptions<Reservation> = {
    localeText: AG_GRID_LOCALE,
    rowSelection: 'single',
    getRowId: (params) => params.data.reservation_id?.toString() || '',
    onGridReady: (params) => {
      this.gridApi = params.api;
      params.api.sizeColumnsToFit();
    },
    onGridPreDestroyed: () => (this.gridApi = undefined),
    columnDefs: [
      {
        headerName: 'User Name',
        valueGetter: (p) => p.data?.user?.full_name || `Usuario ${p.data?.user_id || 'N/A'}`,
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        minWidth: 160,
      },
      {
        headerName: 'User national_id',
        valueGetter: (p) => p.data?.user?.national_id || '',
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        maxWidth: 180,
      },
      {
        headerName: 'Check-IN',
        field: 'check_in',
        filter: 'agDateColumnFilter',
        filterParams: DATE_FILTER_CONFIG,
        maxWidth: 140,
      },
      {
        headerName: 'Check-OUT',
        field: 'check_out',
        filter: 'agDateColumnFilter',
        filterParams: DATE_FILTER_CONFIG,
        maxWidth: 140,
      },
      {
        headerName: 'reservation status',
        field: 'status',
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        cellRenderer: (p: any) => {
          const s = String(p.value || '');
          const el = document.createElement('span');
          el.classList.add('badge', getStatusBadge(s));
          el.textContent = getStatusText(s);
          return el;
        },
        maxWidth: 160,
      },
      {
        headerName: 'Actions',
        filter: false,
        minWidth: 180,
        cellRenderer: ActionButtonsComponent<Reservation>,
        cellRendererParams: (p: { data: Reservation }) => ({
          additionalButtons: [
            {
              label: 'Ver detalles',
              class: 'btn-details',
              action: (r: Reservation) => this.viewDetails(r),
            },
          ],
        }),
      } as ColDef<Reservation>,
    ],
  };

  private viewDetails(r: Reservation) {
    this.openDetail.emit(r);
  }
}
