import { CommonModule } from '@angular/common';
import { forkJoin, of, switchMap, zip } from 'rxjs';

import { ServiceOffering } from '../../../../model/service-offering';
import { ServiceOfferingService } from '../../../../services/service-offering-service';
import { HotelsService } from '../../../../services/hotels';
import { Hotel } from '../../../../model/hotel';
import { FormsModule } from '@angular/forms';
import { ServicesFormComponent, type ServicesFormPayload } from '../services-form/services-form';
import { ColDef, GridOptions, GridApi, ModuleRegistry, AllCommunityModule, PaginationModule } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { ActionButtonsParams } from '../../action-buttons-cell/action-buttons-param';
import { ActionButtonsComponent } from '../../action-buttons-cell/action-buttons-cell';
import { Component, ElementRef, Inject, inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ServicesDetail } from "../services-detail/services-detail";
import { AG_GRID_LOCALE } from '../../ag-grid-locale';
import { MultiSelectFilterComponent } from '../../filters/multi-select-filter/multi-select-filter';
import type { ServiceSchedule } from '../../../../model/service-schedule';

import type { ITextFilterParams, INumberFilterParams } from 'ag-grid-community';
import type { ServiceOfferingDetailResponse } from '../../../../services/service-offering-service';

const TEXT_FILTER_CONFIG: ITextFilterParams = {
  filterOptions: ['contains', 'equals', 'notContains', 'startsWith'],
  maxNumConditions: 1
};

const NUMBER_FILTER_CONFIG: INumberFilterParams = {
  filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'],
  maxNumConditions: 1
};

@Component({
  selector: 'app-services-table',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, ServicesFormComponent, ServicesDetail],
  templateUrl: './services-table.html',
  styleUrls: ['./services-table.css']
})
export class ServicesTable {
  isBrowser: boolean = false;
  serviceOfferingList: ServiceOffering[] = [];
  hotelsList: Hotel[] = [];
  rowData: ServiceOffering[] = [];
  hotelOptions: { id: number; name: string }[] = [];
  showCreate = false;
  createDraft: Partial<ServiceOffering> = this.buildEmptyDraft();
  private gridApi?: GridApi<ServiceOffering>;
  createLoading = false;
  selected?: ServiceOffering;
  detailLoading = false;

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
    zip([
      this.serviceOfferingService.getAll(),
      this.hotelsService.list()
    ]).subscribe(([services, hotels]) => {
      this.hotelsList = hotels;
      this.hotelOptions = hotels.map(h => ({ id: h.hotel_id, name: h.name }));

      const withHotels = services.map(service => ({
        ...service,
        hotel: hotels.find(h => h.hotel_id === service.hotel_id)
      }));

      this.serviceOfferingList = withHotels;
      this.rowData = withHotels;
    });
  }

  onCreateToggle(event: Event): void {
    const details = event.target as HTMLDetailsElement;
    this.showCreate = details.open;
  }


  gridOptions: GridOptions<ServiceOffering> = {
    localeText: AG_GRID_LOCALE,
    rowSelection: 'single',
    getRowId: params => params.data.id?.toString(),
    onGridReady: params => { 
      this.gridApi = params.api
      params.api.sizeColumnsToFit();
    },
    onSelectionChanged: params => {
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
        headerName:'ID',
        field:'id',
        maxWidth: 100
      },
      { 
        headerName:'Nombre',
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        field:'name'
      },
      { 
        headerName:'Categoria',
        filter: MultiSelectFilterComponent,
        filterParams: {
          valueGetter: (row: ServiceOffering) => row.category,
          title: 'Categorias'
        },
        field:'category',
        maxWidth: 150
      },
      {
        headerName:'Precio base',
        field:'base_price',
        filter: 'agNumberColumnFilter',
        filterParams: NUMBER_FILTER_CONFIG,
        valueFormatter: params => {
          return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 2
      }).format(params.value);
      },
        maxWidth: 150
      },
      {
        headerName:'Cupo',
        field:'duration_minutes',
        filter: 'agNumberColumnFilter',
        filterParams: NUMBER_FILTER_CONFIG,
        maxWidth: 100
      },
      {
        headerName:'Hotel',
        filter: MultiSelectFilterComponent,
        filterParams: {
          valueGetter: (row: ServiceOffering) => row.hotel?.name.slice(12),
          title: 'Hoteles'
        },
        valueGetter: params => params.data?.hotel?.name.slice(12),
        maxWidth: 150
      },
      {
        headerName: 'Actions',
        filter: false,
        minWidth: 205,
        cellRenderer: ActionButtonsComponent<ServiceOffering>,
        cellRendererParams: {
          onEdit: (row: ServiceOffering) => this.beginEdit(row),
          onDelete: (row: ServiceOffering) => this.deleteServiceOffering(row)
        } satisfies Pick<ActionButtonsParams<ServiceOffering>, 'onEdit' | 'onDelete'>
      } as ColDef<ServiceOffering> 
    ]
  }

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
      hotel_id: Number(payload.hotel_id ?? 0)
    };

    this.serviceOfferingService.create(request).subscribe({
      next: created => {
        const afterSchedules = (schedules: ServiceSchedule[]) => {
          const withHotel = this.fillNewService(created);
          withHotel.schedules = schedules; // assign schedules
          this.serviceOfferingList = [withHotel, ...this.serviceOfferingList];
          this.cancelCreate(); // Close create panel
          this.gridApi?.applyTransaction({ add: [withHotel], addIndex: 0 });
        };

        if (!scheduleRequests.length) {
          afterSchedules([]);
          return;
        }
        
        // create bundle of schedules
        forkJoin(
          scheduleRequests.map(schedule =>
            this.serviceOfferingService.createSchedule(created.id, schedule)
          )
        ).subscribe({
          // assign schedules
          next: schedules => afterSchedules(schedules),
          error: () => (this.createLoading = false)
        });
      },
      error: () => (this.createLoading = false)
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
      hotel_id: undefined
    };
  }

  private fillNewService(service: ServiceOffering): ServiceOffering {
    return {
      ...service,
      image_urls: service.image_urls ? [...service.image_urls]: [],
      hotel: this.hotelsList.find(h => h.hotel_id === service.hotel_id)
    }
  }

  deleteServiceOffering(serviceOffering: ServiceOffering): void {
    const index = this.serviceOfferingList.indexOf(serviceOffering);
    if (index >= 0) {
      this.serviceOfferingList.splice(index, 1);
    }
    this.serviceOfferingService.deleteById(serviceOffering.id).subscribe();
    if (this.gridApi) {
      this.gridApi.applyTransaction({ remove: [serviceOffering] });
    }
  }

  // Service editing

  editing?: ServiceOffering;
  draft: Partial<ServiceOffering> = {};
  loading = false;

  beginEdit(service: ServiceOffering): void {
    this.editing = service;
    this.loading = true;

    this.serviceOfferingService.getDetail(service.id).subscribe({
      next: detail => {
        this.draft = {
          ...detail.service,
          hotel_id: detail.service.hotel_id,
          image_urls: detail.service.image_urls ? [...detail.service.image_urls] : [],
          schedules: detail.schedules
        };
        this.loading = false;
      },
      error: () => {
        this.draft = {
          ...service,
          hotel_id: service.hotel_id,
          image_urls: service.image_urls ? [...service.image_urls] : []
        };
        this.loading = false;
      }
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
      hotel_id: Number(draft.hotel_id ?? this.editing.hotel_id)
    };


    this.serviceOfferingService.update(this.editing.id, request).pipe(
      // assign to the service offering {updated img, updated hotel}      
      switchMap(updated => {
        Object.assign(this.editing!, updated, {
          image_urls: updated.image_urls ? [...updated.image_urls] : [],
          hotel: this.hotelsList.find(h => h.hotel_id === updated.hotel_id)
        });

        if (!scheduleRequests.length) {
          return of([] as ServiceSchedule[]);
        }

        // Create bundle of schedules calling the service
        return forkJoin(
          scheduleRequests.map(schedule =>
            this.serviceOfferingService.createSchedule(this.editing!.id, schedule)
          )
        );
      })
    ).subscribe({
      // assign to the service the bundle of schedules
      next: schedules => {
        if (schedules.length) {
          this.editing!.schedules = [...(this.editing!.schedules ?? []), ...schedules];
        }

        this.gridApi?.refreshCells({ force: true });
        this.deleteSchedules(payload.deleteIds);

        this.loading = false;
        this.editing = undefined;
      },
      error: () => { this.loading = false; }
    });
  }


  private deleteSchedules(ids: number[]): void {
    console.log('Deleting schedules', ids);
    if (!ids.length) return;

    ids.forEach(id => {
      this.serviceOfferingService.deleteSchedule(id).subscribe({
        next: () => console.log('Schedule deleted', id),
        error: err => console.error('Failed to delete schedule', id, err)
      });
    });
  }

  // Search bar
  search: string = '';

  onSearch(term: string): void {
    this.search = term;
    this.gridApi?.setGridOption('quickFilterText', term || undefined);
  }

  onDetailEdit(service: ServiceOffering): void {
  this.beginEdit(service);
  }

  private loadServiceDetail(serviceId: number): void {
    this.detailLoading = true;

    this.serviceOfferingService.getDetail(serviceId).subscribe({
      next: detail => this.applyDetail(serviceId, detail),
      error: () => {
        this.detailLoading = false;
      }
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
      hotel: this.hotelsList.find(h => h.hotel_id === detail.service.hotel_id),
      schedules: detail.schedules ?? []
    };

    this.selected = details;
    this.detailLoading = false;
  }
}
