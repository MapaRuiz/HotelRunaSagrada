import {
  Component,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReservationService as ReservationServiceModel } from '../../../../model/reservation-service';
import { ReservationFacade } from '../reservation';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  ColDef,
  GridApi,
  GridOptions,
  GridSizeChangedEvent,
  ModuleRegistry,
} from 'ag-grid-community';
import { AG_GRID_LOCALE, gridTheme as sharedGridTheme } from '../../../sharedTableConfig';
import { updateResponsiveColumns as setResponsiveColumnsVisibility } from '../../../admin/sharedTable';
import {
  ServiceOfferingService,
  ServiceOfferingDetailResponse,
} from '../../../../services/service-offering-service';
import { forkJoin } from 'rxjs';
import { Output, EventEmitter } from '@angular/core';
import { ActionButtonsComponent } from '../../../admin/action-buttons-cell/action-buttons-cell';
import { ReservationServiceApi } from '../../../../services/reservation-service';
import { formatDaysLabel } from '../../../admin/services-offering-component/service-schedule-form/service-schedule-form';

@Component({
  selector: 'app-reservation-services-table',
  standalone: true,
  imports: [CommonModule, AgGridAngular],
  templateUrl: './reservation-services-table.html',
  styleUrl: './reservation-services-table.css',
})
export class ReservationServicesTable implements OnInit, OnDestroy, OnChanges {
  @Input() reservationId?: number;
  @Input() reservationStatus?: string;
  @Output() editRequested = new EventEmitter<ReservationServiceModel>();

  services: ReservationServiceModel[] = [];
  loading = false;
  isBrowser = false;
  readonly gridTheme: typeof sharedGridTheme = sharedGridTheme;
  private platformId = inject(PLATFORM_ID);
  private gridApi?: GridApi<ReservationServiceModel>;
  private readonly responsiveHiddenColumns = ['status', 'total'];
  private columnsHiddenForCompact = false;
  private readonly columnDefs: ColDef<ReservationServiceModel>[] = this.buildColumnDefs();
  private readonly handleResize = (event?: GridSizeChangedEvent | Event) => {
    const width =
      event && 'clientWidth' in event ? (event.clientWidth as number | undefined) : undefined;
    const height =
      event && 'clientHeight' in event ? (event.clientHeight as number | undefined) : undefined;

    this.updateResponsiveColumns(width, height);
    this.autoSizeColumns();
  };

  gridOptions: GridOptions<ReservationServiceModel> = {
    localeText: AG_GRID_LOCALE,
    rowSelection: 'single',
    suppressDragLeaveHidesColumns: true,
    getRowId: (p) => {
      const id = (p.data as any)?.res_service_id;
      if (id != null) return String(id);
      const r = (p.data as any)?.reservation_id ?? 'r';
      const s = (p.data as any)?.service_id ?? 's';
      const sch = (p.data as any)?.schedule_id ?? 'null';
      return `${r}-${s}-${sch}-${Math.random().toString(36).slice(2, 7)}`;
    },
    onGridReady: (params) => {
      this.gridApi = params.api;
      params.api.setGridOption('rowData', this.services);
      this.handleResize();
      this.applyCompactLayout();
    },
    onFirstDataRendered: () =>
      setTimeout(() => {
        this.handleResize();
        this.applyCompactLayout();
      }, 0),
    onGridSizeChanged: (event) => {
      this.gridApi = event.api;
      this.handleResize(event);
    },
    onGridPreDestroyed: () => (this.gridApi = undefined),
    rowHeight: 40,
    headerHeight: 44,
    defaultColDef: {
      sortable: true,
      resizable: true,
      cellClass: 'ag-compact-cell',
      headerClass: 'ag-compact-header',
      flex: 1,
      minWidth: 110,
    },
    columnDefs: this.columnDefs,
  };

  private facade = inject(ReservationFacade);
  private serviceOffering = inject(ServiceOfferingService);
  private resServicesApi = inject(ReservationServiceApi);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      ModuleRegistry.registerModules([AllCommunityModule]);
      window.addEventListener('resize', this.handleResize);
    }
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.handleResize();
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      window.removeEventListener('resize', this.handleResize);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reservationId'] && this.reservationId) {
      this.fetchServices(this.reservationId);
    }
    // Recompute columns when status changes (affects actions availability)
    if (changes['reservationStatus'] && this.isBrowser) {
      this.updateResponsiveColumns();
    }
  }

  private fetchServices(reservationId: number) {
    this.loading = true;
    this.facade.getReservationServices(reservationId).subscribe({
      next: (list) => {
        const base = list || [];
        const serviceIds = Array.from(
          new Set(base.map((r) => r.service_id).filter((v): v is number => v != null))
        );
        if (serviceIds.length === 0) {
          this.services = base;
          this.loading = false;
          this.withGridApi((api) => api.setGridOption('rowData', this.services));
          this.handleResize();
          return;
        }

        forkJoin(serviceIds.map((id) => this.serviceOffering.getDetail(id))).subscribe({
          next: (details: ServiceOfferingDetailResponse[]) => {
            const byServiceId = new Map(details.map((d) => [d.service.id, d] as const));
            const enriched = base.map((row) => {
              const det = row.service_id != null ? byServiceId.get(row.service_id) : undefined;
              const schedule =
                row.schedule_id != null
                  ? det?.schedules?.find((s) => s.id === row.schedule_id)
                  : null;
              return {
                ...row,
                service: det?.service ?? row.service,
                schedule: schedule ?? row.schedule ?? null,
              } as ReservationServiceModel;
            });
            this.services = enriched;
            this.loading = false;
            this.withGridApi((api) => api.setGridOption('rowData', this.services));
            this.handleResize();
          },
          error: () => {
            this.services = base;
            this.loading = false;
          },
        });
      },
      error: () => {
        this.services = [];
        this.loading = false;
      },
    });
  }

  // Public method to be called when the table becomes visible (e.g., collapse opened)
  onContainerShown(): void {
    if (this.reservationId) {
      this.fetchServices(this.reservationId);
    }
    setTimeout(() => {
      try {
        this.handleResize();
      } catch {}
    }, 0);
  }

  private readonly compactRowHeight = 40;
  private readonly compactHeaderHeight = 44;
  // Build base columns
  private buildColumnDefs(): ColDef<ReservationServiceModel>[] {
    const priceFormatter = (p: any) =>
      typeof p.value === 'number'
        ? new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'COP' }).format(p.value)
        : p.value;

    const defs: ColDef<ReservationServiceModel>[] = [
      {
        colId: 'name',
        headerName: 'Nombre',
        valueGetter: (p) => p.data?.service?.name || `Service ${p.data?.service_id ?? ''}`,
        minWidth: 160,
      },
      {
        colId: 'availability',
        headerName: 'Disponibilidad',
        valueGetter: (p) => formatDaysLabel(p.data?.schedule?.days_of_week),
        minWidth: 220,
      },
      {
        colId: 'schedule',
        headerName: 'Horario',
        valueGetter: (p) => {
          const s = p.data?.schedule?.start_time;
          const e = p.data?.schedule?.end_time;
          return s && e ? `${s} - ${e}` : '';
        },
        minWidth: 160,
      },
      {
        colId: 'qty',
        headerName: 'Cantidad',
        field: 'qty',
        maxWidth: 120,
      },
      {
        colId: 'unit_price',
        headerName: 'Precio unitario',
        valueGetter: (p) => p.data?.unit_price ?? 0,
        valueFormatter: priceFormatter,
        maxWidth: 160,
      },
      {
        colId: 'status',
        headerName: 'Estatus',
        field: 'status',
        maxWidth: 140,
      },
      {
        colId: 'total',
        headerName: 'Total',
        valueGetter: (p) => (p.data?.qty ?? 0) * (p.data?.unit_price ?? 0),
        valueFormatter: priceFormatter,
        maxWidth: 160,
      },
      this.getActionsColDef(),
    ];
    return defs;
  }

  private getActionsColDef(): ColDef<ReservationServiceModel> {
    return {
      colId: 'actions',
      headerName: 'Acciones',
      filter: false,
      minWidth: 200,
      cellRenderer: ActionButtonsComponent<ReservationServiceModel>,
      cellRendererParams: () => {
        const allowChanges =
          (this.reservationStatus ?? '').toString().trim().toUpperCase() === 'CHECKIN';
        return {
          editLabel: 'Editar',
          deleteLabel: 'Eliminar',
          onEdit: allowChanges ? (row: ReservationServiceModel) => this.onEditRow(row) : undefined,
          onDelete: allowChanges
            ? (row: ReservationServiceModel) => this.onDeleteRow(row)
            : undefined,
        };
      },
    } as ColDef<ReservationServiceModel>;
  }

  private updateResponsiveColumns(width?: number, height?: number): void {
    if (!this.isBrowser) return;

    const effectiveWidth = width ?? window.innerWidth;
    const effectiveHeight = height ?? window.innerHeight;

    if (!effectiveWidth && !effectiveHeight) return;

    const shouldHide = effectiveWidth <= 1024;
    if (shouldHide === this.columnsHiddenForCompact) {
      return;
    }

    this.columnsHiddenForCompact = shouldHide;
    this.withGridApi((api) => {
      setResponsiveColumnsVisibility(api, this.responsiveHiddenColumns, shouldHide);
    });
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.handleResize();
  }

  private withGridApi(action: (api: GridApi<ReservationServiceModel>) => void): void {
    const api = this.gridApi;
    if (!api) return;

    const maybeDestroyed = (api as GridApi<ReservationServiceModel> & { isDestroyed?: () => boolean })
      .isDestroyed;
    if (typeof maybeDestroyed === 'function' && maybeDestroyed.call(api)) {
      return;
    }

    action(api);
  }

  private autoSizeColumns(): void {
    this.withGridApi((api) => {
      try {
        api.sizeColumnsToFit();
      } catch {}
    });
  }

  private applyCompactLayout(): void {
    this.withGridApi((api) => {
      try {
        api.setGridOption('rowHeight', this.compactRowHeight);
        api.setGridOption('headerHeight', this.compactHeaderHeight);
        api.refreshHeader();
        setTimeout(() => this.gridApi?.resetRowHeights(), 0);
      } catch {}
    });
  }

  private onEditRow(row: ReservationServiceModel) {
    // publish selection via facade as a reliable channel
    try {
      this.facade.selectReservationService(row);
    } catch (e) {}
    // Also emit via EventEmitter for backwards compatibility
    this.editRequested.emit(row);
  }

  private onDeleteRow(row: ReservationServiceModel) {
    if (!row.res_service_id) {
      alert('No se puede eliminar: falta el ID del servicio de reserva.');
      return;
    }
    if (!confirm('¿Eliminar este servicio contratado?')) return;
    this.loading = true;
    this.resServicesApi.delete(row.res_service_id).subscribe({
      next: () => {
        // reload list
        if (this.reservationId) this.fetchServices(this.reservationId);
        else this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('No se pudo eliminar el servicio.');
      },
    });
  }
}
