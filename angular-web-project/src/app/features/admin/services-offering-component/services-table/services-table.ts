import { CommonModule } from '@angular/common';
import { forkJoin, of, switchMap, zip } from 'rxjs';

import { ServiceOffering } from '../../../../model/service-offering';
import { ServiceOfferingService } from '../../../../services/service-offering-service';
import { HotelsService } from '../../../../services/hotels';
import { Hotel } from '../../../../model/hotel';
import { FormsModule } from '@angular/forms';
import { ServicesFormComponent, type ServicesFormPayload } from '../services-form/services-form';
import {
  ColDef,
  GridOptions,
  GridApi,
  ModuleRegistry,
  AllCommunityModule,
  PaginationModule,
} from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { ActionButtonsParams } from '../../action-buttons-cell/action-buttons-param';
import { ActionButtonsComponent } from '../../action-buttons-cell/action-buttons-cell';
import {
  Component,
  ElementRef,
  Inject,
  inject,
  PLATFORM_ID,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ServicesDetail } from '../services-detail/services-detail';
import { AG_GRID_LOCALE } from '../../sharedTable';
import { MultiSelectFilterComponent } from '../../filters/multi-select-filter/multi-select-filter';
import type { ServiceSchedule } from '../../../../model/service-schedule';
import { gridTheme as sharedGridTheme } from '../../sharedTable';
import type { ITextFilterParams, INumberFilterParams } from 'ag-grid-community';
import type { ServiceOfferingDetailResponse } from '../../../../services/service-offering-service';

const TEXT_FILTER_CONFIG: ITextFilterParams = {
  filterOptions: ['contains', 'equals', 'notContains', 'startsWith'],
  maxNumConditions: 1,
};

const NUMBER_FILTER_CONFIG: INumberFilterParams = {
  filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'],
  maxNumConditions: 1,
};

@Component({
  selector: 'app-services-table',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, ServicesFormComponent, ServicesDetail],
  templateUrl: './services-table.html',
  styleUrls: ['./services-table.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ServicesTable {
  isBrowser: boolean = false;
  // Fuente de datos
  serviceOfferingList: ServiceOffering[] = [];
  hotelsList: Hotel[] = [];
  // Datos mostrados por la tabla
  rowData: ServiceOffering[] = [];
  hotelOptions: { id: number; name: string }[] = [];
  showCreate = false;
  createDraft: Partial<ServiceOffering> = this.buildEmptyDraft();
  private gridApi?: GridApi<ServiceOffering>;
  createLoading = false;
  selected?: ServiceOffering;
  detailLoading = false;
  readonly gridTheme: typeof sharedGridTheme = sharedGridTheme;

  @ViewChild('createDetails') private createDetails?: ElementRef<HTMLDetailsElement>;

  constructor(
    private serviceOfferingService: ServiceOfferingService,
    private hotelsService: HotelsService,
    // Injection token describing the current runtime plataform
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Should only run when the component is executed in the browser
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      // Tells ag-grid to use all the modules
      ModuleRegistry.registerModules([AllCommunityModule]);
    }
  }

  ngOnInit(): void {
    // pairs service responses and hotel responses
    // emit when both responses are ready
    zip([this.serviceOfferingService.getAll(), this.hotelsService.list()]).subscribe(
      ([services, hotels]) => {
        this.hotelsList = hotels;
        this.hotelOptions = hotels.map((h) => ({ id: h.hotel_id, name: h.name }));

        const withHotels = services.map((service) => ({
          ...service,
          hotel: hotels.find((h) => h.hotel_id === service.hotel_id),
        }));

        this.serviceOfferingList = withHotels;
        this.rowData = withHotels;
      }
    );
  }

  onCreateToggle(event: Event): void {
    const details = event.target as HTMLDetailsElement;
    this.showCreate = details.open;
  }

  gridOptions: GridOptions<ServiceOffering> = {
    defaultColDef: { resizable: true, sortable: true, filter: true },
    animateRows: true,
    pagination: true,
    paginationPageSize: 9,
    paginationPageSizeSelector: [9, 15, 20, 50],
    domLayout: 'normal',
    rowHeight: 60,
    headerHeight: 50,
    localeText: AG_GRID_LOCALE,
    rowSelection: 'single',
    getRowId: (params) => params.data.id?.toString(),
    onGridReady: (params) => {
      this.gridApi = params.api;
      params.api.sizeColumnsToFit();
    },
    onGridPreDestroyed: () => {
      this.gridApi = undefined;
    },
    onSelectionChanged: (params) => {
      const [row] = params.api.getSelectedRows();

      if (!row?.id) {
        this.selected = undefined;
        this.detailLoading = false;
        return;
      }

      this.selected = row;
      this.loadServiceDetail(row.id);
    },
    columnDefs: [
      {
        headerName: 'ID',
        field: 'id',
        minWidth: 50,
        maxWidth: 100,
      },
      {
        headerName: 'Nombre',
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        field: 'name',
      },
      {
        headerName: 'Categoria',
        filter: MultiSelectFilterComponent,
        filterParams: {
          valueGetter: (row: ServiceOffering) => row.category,
          title: 'Categorias',
        },
        field: 'category',
        maxWidth: 150,
      },
      {
        headerName: 'Precio',
        field: 'base_price',
        filter: 'agNumberColumnFilter',
        filterParams: NUMBER_FILTER_CONFIG,
        valueFormatter: (params) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 2,
          }).format(params.value);
        },
        maxWidth: 150,
        minWidth: 70,
      },
      {
        headerName: 'Cupo',
        field: 'duration_minutes',
        filter: 'agNumberColumnFilter',
        filterParams: NUMBER_FILTER_CONFIG,
        maxWidth: 100,
      },
      {
        headerName: 'Hotel',
        filter: MultiSelectFilterComponent,
        filterParams: {
          valueGetter: (row: ServiceOffering) => row.hotel?.name.slice(12),
          title: 'Hoteles',
        },
        valueGetter: (params) => params.data?.hotel?.name.slice(12),
        maxWidth: 150,
      },
      {
        headerName: 'Actions',
        filter: false,
        minWidth: 270,
        cellRenderer: ActionButtonsComponent<ServiceOffering>,
        cellRendererParams: (params: ActionButtonsParams<ServiceOffering>) =>
          ({
            ...params,
            onEdit: () => {
              const row = params.data as ServiceOffering | undefined;
              if (row) this.beginEdit(row);
            },
            onDelete: () => {
              const row = params.data as ServiceOffering | undefined;
              if (row) this.deleteServiceOffering(row);
            },
            additionalButtons: [
              {
                label: 'Ver detalle',
                class: 'btn btn-edit',
                action: (row: ServiceOffering) => this.showDetails(row),
              },
            ],
          } satisfies ActionButtonsParams<ServiceOffering>),
      } as ColDef<ServiceOffering>,
    ],
  };

  cancelCreate(): void {
    this.showCreate = false;
    this.createDraft = this.buildEmptyDraft();
    this.createLoading = false;
    this.closeCreatePanel();
  }

  private closeCreatePanel(): void {
    const details = this.createDetails?.nativeElement;
    if (!details) return;

    details.open = false;
    details.removeAttribute('open');
  }

  saveCreate(service: ServicesFormPayload): void {
    this.createLoading = true;
    const payload = service.draft;
    const scheduleRequests = service.newSchedules ?? [];
    console.log('[ServicesTable] saveCreate received:', scheduleRequests);
    const request = {
      name: payload.name ?? '',
      category: payload.category ?? '',
      subcategory: payload.subcategory ?? '',
      description: payload.description ?? '',
      base_price: Number(payload.base_price ?? 0),
      duration_minutes: Number(payload.duration_minutes ?? 0),
      image_urls: payload.image_urls ?? [],
      max_participants: Number(payload.max_participants ?? 0),
      latitude: Number(payload.latitude ?? 0),
      longitude: Number(payload.longitude ?? 0),
      hotel_id: Number(payload.hotel_id ?? 0),
    };

    this.serviceOfferingService.create(request).subscribe({
      next: (created) => {
        const afterSchedules = (schedules: ServiceSchedule[]) => {
          const withHotel = this.fillNewService(created);
          withHotel.schedules = schedules; // assign schedules
          this.serviceOfferingList = [withHotel, ...this.serviceOfferingList];
          this.rowData = [withHotel, ...this.rowData];
          this.cancelCreate(); // Close create panel
          this.withGridApi((api) => {
            api.applyTransaction({ add: [withHotel], addIndex: 0 });
            api.refreshCells({ force: true });
            api.refreshClientSideRowModel('filter');
            api.setGridOption('quickFilterText', this.search || undefined);
          });
        };

        if (!scheduleRequests.length) {
          afterSchedules([]);
          return;
        }

        // create bundle of schedules
        forkJoin(
          scheduleRequests.map((schedule) =>
            this.serviceOfferingService.createSchedule(created.id, schedule)
          )
        ).subscribe({
          // assign schedules
          next: (schedules) => afterSchedules(schedules),
          error: () => (this.createLoading = false),
        });
      },
      error: () => (this.createLoading = false),
    });
  }

  private buildEmptyDraft(): Partial<ServiceOffering> {
    return {
      name: '',
      category: undefined,
      subcategory: '',
      description: '',
      base_price: undefined,
      duration_minutes: undefined,
      image_urls: [],
      max_participants: undefined,
      latitude: undefined,
      longitude: undefined,
      hotel_id: undefined,
    };
  }

  private fillNewService(service: ServiceOffering): ServiceOffering {
    return {
      ...service,
      image_urls: service.image_urls ? [...service.image_urls] : [],
      hotel: this.hotelsList.find((h) => h.hotel_id === service.hotel_id),
    };
  }

  deleteServiceOffering(serviceOffering: ServiceOffering): void {
    const index = this.serviceOfferingList.indexOf(serviceOffering);
    if (index >= 0) {
      this.serviceOfferingList.splice(index, 1);
    }
    this.rowData = this.rowData.filter((item) => item.id !== serviceOffering.id);
    this.serviceOfferingService.deleteById(serviceOffering.id).subscribe();
    this.withGridApi((api) => api.applyTransaction({ remove: [serviceOffering] }));
  }

  // Service editing

  editing?: ServiceOffering;
  draft: Partial<ServiceOffering> = {};
  loading = false;

  showDetails(service: ServiceOffering): void {
    if (!service?.id) {
      return;
    }

    this.editing = undefined;
    this.draft = {};
    this.loading = false;
    this.selected = service;
    this.loadServiceDetail(service.id);

    this.withGridApi((api) => {
      const node = api.getRowNode(service.id!.toString());
      node?.setSelected(true);
    });
  }

  beginEdit(service: ServiceOffering): void {
    this.editing = service;
    this.loading = true;

    this.serviceOfferingService.getDetail(service.id).subscribe({
      next: (detail) => {
        this.draft = {
          ...detail.service,
          hotel_id: detail.service.hotel_id,
          image_urls: detail.service.image_urls ? [...detail.service.image_urls] : [],
          schedules: detail.schedules,
        };
        this.loading = false;
      },
      error: () => {
        this.draft = {
          ...service,
          hotel_id: service.hotel_id,
          image_urls: service.image_urls ? [...service.image_urls] : [],
        };
        this.loading = false;
      },
    });
  }

  cancelEdit(): void {
    this.editing = undefined;
    this.draft = {};
    this.loading = false;
  }

  saveEdit(payload: ServicesFormPayload): void {
    if (!this.editing) return;
    this.loading = true;

    const scheduleRequests = payload.newSchedules ?? [];
    const updateRequests = payload.updatedSchedules ?? [];
    const draft = payload.draft;
    const request = {
      name: draft.name ?? '',
      category: draft.category ?? '',
      subcategory: draft.subcategory ?? '',
      description: draft.description ?? '',
      base_price: Number(draft.base_price ?? 0),
      duration_minutes: Number(draft.duration_minutes ?? 0),
      image_urls: draft.image_urls ?? [],
      max_participants: Number(draft.max_participants ?? 0),
      latitude: Number(draft.latitude ?? 0),
      longitude: Number(draft.longitude ?? 0),
      hotel_id: Number(draft.hotel_id ?? this.editing.hotel_id),
    };

    const updateOps = updateRequests.map((update) =>
      this.serviceOfferingService.updateSchedule(update.id, update.request)
    );
    const createOps = scheduleRequests.map((schedule) =>
      this.serviceOfferingService.createSchedule(this.editing!.id, schedule)
    );
    const operations = [...updateOps, ...createOps];

    this.serviceOfferingService
      .update(this.editing.id, request)
      .pipe(
        switchMap((updated) => {
          Object.assign(this.editing!, updated, {
            image_urls: updated.image_urls ? [...updated.image_urls] : [],
            hotel: this.hotelsList.find((h) => h.hotel_id === updated.hotel_id),
          });

          if (!operations.length) {
            return of([] as ServiceSchedule[]);
          }

          return forkJoin(operations);
        })
      )
      .subscribe({
        next: (schedules) => {
          let updatedService: ServiceOffering | undefined;
          if (this.editing) {
            const base = this.editing;
            const updatedSlice = schedules.slice(0, updateOps.length);
            const createdSlice = schedules.slice(updateOps.length);

            const updatedIds = new Set(updatedSlice.map((item) => item.id));
            const existing = base.schedules ?? [];
            const mergedExisting = existing.map((item) => {
              const replacement = updatedSlice.find((schedule) => schedule.id === item.id);
              return replacement ?? item;
            });

            let merged: ServiceSchedule[] = [
              ...updatedSlice,
              ...mergedExisting.filter((item) => !updatedIds.has(item.id)),
            ];

            if (createdSlice.length) {
              merged = [...merged, ...createdSlice];
            }

            updatedService = {
              ...base,
              schedules: merged,
            };
            this.editing = updatedService;
            this.serviceOfferingList = this.serviceOfferingList.map((item) =>
              item.id === updatedService!.id ? updatedService! : item
            );
            this.rowData = this.rowData.map((item) =>
              item.id === updatedService!.id ? updatedService! : item
            );
          }

          const current = updatedService ?? this.editing;
          if (current) {
            this.withGridApi((api) => {
              api.applyTransaction({ update: [current] });
              api.refreshCells({ force: true });
              api.refreshClientSideRowModel('everything');
              api.setGridOption('quickFilterText', this.search || undefined);
            });
          }

          this.deleteSchedules(payload.deleteIds);
          this.loading = false;
          this.editing = undefined;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  private deleteSchedules(ids: number[]): void {
    console.log('Deleting schedules', ids);
    if (!ids.length) return;

    ids.forEach((id) => {
      this.serviceOfferingService.deleteSchedule(id).subscribe({
        next: () => console.log('Schedule deleted', id),
        error: (err) => console.error('Failed to delete schedule', id, err),
      });
    });
  }

  // Search bar
  search: string = '';

  onSearch(term: string): void {
    this.search = term;
    this.withGridApi((api) => api.setGridOption('quickFilterText', term || undefined));
  }

  onDetailEdit(service: ServiceOffering): void {
    this.beginEdit(service);
  }

  private loadServiceDetail(serviceId: number): void {
    this.detailLoading = true;

    this.serviceOfferingService.getDetail(serviceId).subscribe({
      next: (detail) => this.applyDetail(serviceId, detail),
      error: () => {
        this.detailLoading = false;
      },
    });
  }

  private applyDetail(serviceId: number, detail: ServiceOfferingDetailResponse): void {
    if (!this.selected || this.selected.id !== serviceId) {
      this.detailLoading = false;
      return;
    }

    const details: ServiceOffering = {
      ...this.selected,
      ...detail.service,
      image_urls: detail.service.image_urls ?? [],
      hotel: this.hotelsList.find((h) => h.hotel_id === detail.service.hotel_id),
      schedules: detail.schedules ?? [],
    };

    this.selected = details;
    this.withGridApi((api) => api.refreshCells({ force: true }));
    this.detailLoading = false;
  }

  private withGridApi(action: (api: GridApi<ServiceOffering>) => void): void {
    const api = this.gridApi;
    if (!api) return;
    const maybeDestroyed = (api as GridApi<ServiceOffering> & { isDestroyed?: () => boolean })
      .isDestroyed;
    if (typeof maybeDestroyed === 'function' && maybeDestroyed.call(api)) {
      return;
    }
    action(api);
  }
}
