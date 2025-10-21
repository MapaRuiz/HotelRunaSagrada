import { Component, Input, OnChanges, PLATFORM_ID, SimpleChanges, inject } from '@angular/core';
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
import {
  ServiceOfferingService,
  ServiceOfferingDetailResponse,
} from '../../../../services/service-offering-service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-reservation-services-table',
  standalone: true,
  imports: [CommonModule, AgGridAngular],
  templateUrl: './reservation-services-table.html',
  styleUrl: './reservation-services-table.css',
})
export class ReservationServicesTable implements OnChanges {
  @Input() reservationId?: number;

  services: ReservationServiceModel[] = [];
  loading = false;
  isBrowser = false;
  readonly gridTheme: typeof sharedGridTheme = sharedGridTheme;
  private platformId = inject(PLATFORM_ID);
  private gridApi?: GridApi<ReservationServiceModel>;

  private facade = inject(ReservationFacade);
  private serviceOffering = inject(ServiceOfferingService);

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
        this.gridApi?.sizeColumnsToFit();
      } catch {}
    }, 0);
  }

  gridOptions: GridOptions<ReservationServiceModel> = {
    localeText: AG_GRID_LOCALE,
    rowSelection: 'single',
    suppressDragLeaveHidesColumns: true,
    getRowId: (p) => (p.data?.res_service_id != null ? String(p.data.res_service_id) : ''),
    onGridReady: (params) => {
      this.gridApi = params.api;
      params.api.setGridOption('rowData', this.services);
      // Avoid sizing here; container might be hidden in a collapsed panel
    },
    onFirstDataRendered: () => setTimeout(() => this.gridApi?.sizeColumnsToFit(), 0),
    onGridPreDestroyed: () => (this.gridApi = undefined),
    columnDefs: [
      {
        headerName: 'Service Name',
        valueGetter: (p) => p.data?.service?.name || `Service ${p.data?.service_id ?? ''}`,
        minWidth: 160,
      },
      {
        headerName: 'Schedule days of week',
        valueGetter: (p) => (p.data?.schedule?.days_of_week || []).join(', '),
        minWidth: 220,
      },
      {
        headerName: 'Schedule time (start - end)',
        valueGetter: (p) => {
          const s = p.data?.schedule?.start_time;
          const e = p.data?.schedule?.end_time;
          return s && e ? `${s} - ${e}` : '';
        },
        minWidth: 220,
      },
      {
        headerName: 'Quantity',
        field: 'qty',
        maxWidth: 120,
      },
      {
        headerName: 'unit price',
        valueGetter: (p) => p.data?.unit_price ?? 0,
        valueFormatter: (p) =>
          typeof p.value === 'number'
            ? new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'COP' }).format(p.value)
            : p.value,
        maxWidth: 160,
      },
      {
        headerName: 'status',
        field: 'status',
        maxWidth: 140,
      },
      {
        headerName: 'total',
        valueGetter: (p) => (p.data?.qty ?? 0) * (p.data?.unit_price ?? 0),
        valueFormatter: (p) =>
          typeof p.value === 'number'
            ? new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'COP' }).format(p.value)
            : p.value,
        maxWidth: 160,
      },
    ] as ColDef<ReservationServiceModel>[],
  };
}
