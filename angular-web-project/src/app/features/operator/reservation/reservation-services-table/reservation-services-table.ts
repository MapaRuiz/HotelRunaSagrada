import {
  Component,
  HostListener,
  Input,
  OnChanges,
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
export class ReservationServicesTable implements OnChanges {
  @Input() reservationId?: number;
  @Input() reservationStatus?: string;
  @Output() editRequested = new EventEmitter<ReservationServiceModel>();

  services: ReservationServiceModel[] = [];
  loading = false;
  isBrowser = false;
  readonly gridTheme: typeof sharedGridTheme = sharedGridTheme;
  private platformId = inject(PLATFORM_ID);
  private gridApi?: GridApi<ReservationServiceModel>;
  private readonly compactColumns = ['status', 'total'];
  private compactColumnsHidden = false;

  private facade = inject(ReservationFacade);
  private serviceOffering = inject(ServiceOfferingService);
  private resServicesApi = inject(ReservationServiceApi);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      ModuleRegistry.registerModules([AllCommunityModule]);
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
          if (this.gridApi) {
            this.gridApi.setGridOption('rowData', this.services);
            this.gridApi.sizeColumnsToFit();
          }
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
            if (this.gridApi) {
              this.gridApi.setGridOption('rowData', this.services);
              this.gridApi.sizeColumnsToFit();
            }
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
        this.updateResponsiveColumns();
      } catch {}
    }, 0);
  }

  private readonly compactRowHeight = 40;
  private readonly compactHeaderHeight = 44;

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
      // Initialize responsive columns on ready
      this.updateResponsiveColumns();
      this.applyCompactLayout();
      // Avoid sizing here; container might be hidden in a collapsed panel
    },
    onFirstDataRendered: () =>
      setTimeout(() => {
        this.updateResponsiveColumns();
        this.applyCompactLayout();
      }, 0),
    onGridPreDestroyed: () => (this.gridApi = undefined),
    rowHeight: 40,
    headerHeight: 44,
    defaultColDef: {
      sortable: true,
      resizable: true,
      cellClass: 'ag-compact-cell',
      headerClass: 'ag-compact-header',
    },
    // Initial placeholder; real columns are built responsively
    columnDefs: [] as ColDef<ReservationServiceModel>[],
  };

  // Build base columns then apply responsive visibility
  private buildBaseColumnDefs(): ColDef<ReservationServiceModel>[] {
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

  private computeResponsiveDefs(width: number): ColDef<ReservationServiceModel>[] {
    const defs = this.buildBaseColumnDefs().map((d) => ({ ...d }));
    // Breakpoints: <576: xs, <992: md, otherwise: full
    if (width < 576) {
      // keep: name, qty, total, actions
      for (const d of defs) {
        if (!['name', 'qty', 'total', 'actions'].includes(String(d.colId))) {
          (d as any).hide = true;
        }
      }
    } else if (width < 992) {
      // hide availability and unit price to save space
      for (const d of defs) {
        if (['availability', 'unit_price'].includes(String(d.colId))) {
          (d as any).hide = true;
        }
      }
    }
    return defs;
  }

  private updateResponsiveColumns(): void {
    if (!this.isBrowser) return;
    const width = window.innerWidth || 1024;
    const defs = this.computeResponsiveDefs(width);
    // update grid options for any future re-init
    this.gridOptions = { ...this.gridOptions, columnDefs: defs };
    if (this.gridApi) {
      try {
        this.gridApi.setGridOption('columnDefs', defs as any);
        // After updating columns, resize to fit
        setTimeout(() => this.gridApi?.sizeColumnsToFit(), 0);
      } catch {}
      const shouldHideCompactColumns = width < 768;
      if (shouldHideCompactColumns !== this.compactColumnsHidden) {
        setResponsiveColumnsVisibility(this.gridApi, this.compactColumns, shouldHideCompactColumns);
        this.compactColumnsHidden = shouldHideCompactColumns;
      }
    }
    this.applyCompactLayout();
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.updateResponsiveColumns();
  }

  private applyCompactLayout(): void {
    if (!this.gridApi) return;
    try {
      this.gridApi.setGridOption('rowHeight', this.compactRowHeight);
      this.gridApi.setGridOption('headerHeight', this.compactHeaderHeight);
      this.gridApi.refreshHeader();
      setTimeout(() => this.gridApi?.resetRowHeights(), 0);
    } catch {}
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
