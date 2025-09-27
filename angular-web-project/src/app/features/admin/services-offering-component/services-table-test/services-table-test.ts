import { CommonModule } from '@angular/common';
import { zip } from 'rxjs';

import { ServiceOffering } from '../../../../model/service-offering';
import { ServiceOfferingService } from '../../../../services/service-offering-service';
import { HotelsService } from '../../../../services/hotels';
import { Hotel } from '../../../../model/hotel';
import { FormsModule } from '@angular/forms';
import { ServicesFormComponent } from '../services-form/services-form';
import { ColDef, GridOptions, GridApi, ModuleRegistry, AllCommunityModule, PaginationModule } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { ActionButtonsParams } from '../../action-buttons-cell/action-buttons-param';
import { ActionButtonsComponent } from '../../action-buttons-cell/action-buttons-cell';
import { Component, Inject, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ServicesDetail } from "../services-detail/services-detail";
import { AG_GRID_LOCALE } from '../../ag-grid-locale';
@Component({
  selector: 'app-services-table-test',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, ServicesFormComponent, ServicesDetail],
  templateUrl: './services-table-test.html',
  styleUrls: ['./services-table-test.css']
})
export class ServicesTableTest {
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

  constructor(
    private serviceOfferingService: ServiceOfferingService,
    private hotelsService: HotelsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
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
      this.selected = row ?? undefined;
    },
    columnDefs: [
      { 
        headerName:'ID',
        field:'id',
        maxWidth: 100
      },
      { 
        headerName:'Nombre',
        field:'name'
      },
      { 
        headerName:'Categoria',
        field:'category',
        maxWidth: 150
      },
      {
        headerName:'Precio base',
        field:'base_price',
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
        maxWidth: 100
      },
      {
        headerName:'Hotel',
        field:'hotel.name'
      },
      {
        headerName: 'Actions',
        minWidth: 205,
        cellRenderer: ActionButtonsComponent<ServiceOffering>,
        cellRendererParams: {
          onEdit: (row: ServiceOffering) => this.beginEdit(row),
          onDelete: (row: ServiceOffering) => this.deleteServiceOffering(row)
        } satisfies Pick<ActionButtonsParams<ServiceOffering>, 'onEdit' | 'onDelete'>
      } as ColDef<ServiceOffering> 
    ]
  }

  toggleCreate(): void {
    this.showCreate = !this.showCreate;
    if (this.showCreate) {
      this.createDraft = this.buildEmptyDraft();
    }
  }

  cancelCreate(): void {
    this.showCreate = false;
    this.createDraft = this.buildEmptyDraft();
    this.createLoading = false;
  }

  saveCreate(payload: Partial<ServiceOffering>): void {
    this.createLoading = true;
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
        const withHotel: ServiceOffering = {
          ...created,
          hotel: this.hotelsList.find(h => h.hotel_id === created.hotel_id)
        } as ServiceOffering;
        this.serviceOfferingList = [withHotel, ...this.serviceOfferingList];
        this.cancelCreate();
      },
      error: () => {
        this.createLoading = false;
      }
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
    this.draft = {
      ...service,
      hotel_id: service.hotel_id,
      image_urls: service.image_urls ? [...service.image_urls] : []
    };
  }

  cancelEdit(): void {
    this.editing = undefined;
    this.draft = {};
    this.loading = false;
  }

  saveEdit(payload: Partial<ServiceOffering>): void {
    if (!this.editing) { return; }
    this.loading = true;

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
      hotel_id: Number(payload.hotel_id ?? this.editing.hotel_id)
    };

    this.serviceOfferingService.update(this.editing.id, request).subscribe({
      next: updated => {
        Object.assign(this.editing!, updated, {
          image_urls: updated.image_urls ? [...updated.image_urls] : [],
          hotel: this.hotelsList.find(h => h.hotel_id === updated.hotel_id)
        });

        this.gridApi?.refreshCells({ force: true });
        this.loading = false;
        this.editing = undefined;
      },
      error: () => { this.loading = false; }
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
}
