import { Component, OnInit, inject, Inject, PLATFORM_ID, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridOptions, ModuleRegistry, AllCommunityModule, PaginationModule, ITextFilterParams, INumberFilterParams } from 'ag-grid-community';
import { HotelsService } from '../../../services/hotels';
import { AmenitiesService } from '../../../services/amenities';
import { environment } from '../../../../environments/environment';
import { AG_GRID_LOCALE, gridTheme as sharedGridTheme } from '../sharedTable';
import { ActionButtonsComponent } from '../action-buttons-cell/action-buttons-cell';
import { ActionButtonsParams } from '../action-buttons-cell/action-buttons-param';

const TEXT_FILTER_CONFIG: ITextFilterParams = {
  filterOptions: ['contains', 'equals', 'notContains', 'startsWith'],
  maxNumConditions: 1
};

const NUMBER_FILTER_CONFIG: INumberFilterParams = {
  filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'],
  maxNumConditions: 1
};

interface Amenity {
  amenity_id: number;
  name: string;
}

interface Hotel {
  hotel_id: number;
  name: string;
  latitude?: string;
  longitude?: string;
  description?: string;
  check_in_after?: string;   // "HH:mm"
  check_out_before?: string; // "HH:mm"
  image?: string;
  amenities?: Amenity[];
}

@Component({
  standalone: true,
  selector: 'app-admin-hotels',
  imports: [CommonModule, FormsModule, AgGridAngular],
  styleUrls: ['./hotels.css'],
  templateUrl: `./hotels.html`,
  encapsulation: ViewEncapsulation.None
})
export class HotelsComponent implements OnInit {
  private hotelsApi = inject(HotelsService);
  private amenitiesApi = inject(AmenitiesService);

  isBrowser: boolean = false;
  // Fuente de datos
  list: Hotel[] = [];
  allAmenities: Amenity[] = [];
  // Datos mostrados por la tabla
  rowData: Hotel[] = [];
  showCreate = false;
  createForm: Partial<Hotel> = { name: '', image: '', check_in_after: '', check_out_before: '' };
  createAmenityIds = new Set<number>();
  imgBrokenCreate = false;
  private gridApi?: GridApi<Hotel>;
  createLoading = false;
  selected?: Hotel;

  // Editar
  editing?: Hotel;
  draft: Partial<Hotel> = {};
  editAmenityIds = new Set<number>();
  imgBrokenEdit = false;
  loading = false;

  // AG-Grid configuration
  readonly gridTheme: typeof sharedGridTheme = sharedGridTheme;

  @ViewChild('createDetails') private createDetails?: ElementRef<HTMLDetailsElement>;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Should only run when the component is executed in the browser
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      // Tells ag-grid to use all the modules
      ModuleRegistry.registerModules([AllCommunityModule]);
    }
  }



  gridOptions: GridOptions<Hotel> = {
    localeText: AG_GRID_LOCALE,
    rowSelection: 'single',
    rowHeight: 100,
    getRowId: params => params.data.hotel_id?.toString(),
    onGridReady: params => { 
      this.gridApi = params.api
      params.api.sizeColumnsToFit();
    },
    onGridPreDestroyed: () => {
      this.gridApi = undefined;
    },
    onSelectionChanged: params => {
      const [row] = params.api.getSelectedRows();
      this.selected = row;
    },
    columnDefs: [
      {
        headerName: 'ID',
        field: 'hotel_id',
        minWidth: 50,
        maxWidth: 100,
        sortable: true,
        filter: 'agNumberColumnFilter',
        filterParams: NUMBER_FILTER_CONFIG
      },
      {
        headerName: 'Nombre',
        field: 'name',
        flex: 2,
        minWidth: 200,
        sortable: true,
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        cellRenderer: (params: any) => {
          const hotel = params.data as Hotel;
          return `
            <div class="d-flex flex-column justify-content-center h-100">
              <div class="fw-semibold">${hotel.name}</div>
              ${hotel.description ? `<div class="text-muted small">${hotel.description}</div>` : ''}
            </div>
          `;
        }
      },
      {
        headerName: 'Imagen',
        field: 'image',
        flex: 1,
        minWidth: 120,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const hotel = params.data as Hotel;
          if (!hotel.image) return '<div class="d-flex align-items-center justify-content-center h-100 text-muted">Sin imagen</div>';
          const imgSrc = this.img(hotel.image);
          return `
            <div class="d-flex align-items-center justify-content-center h-100">
              <img src="${imgSrc}" alt="" style="width:120px;height:70px;object-fit:cover;border-radius:8px;">
            </div>
          `;
        }
      },
      {
        headerName: 'Check-in/out',
        field: 'check_times',
        flex: 1,
        minWidth: 120,
        sortable: false,
        cellRenderer: (params: any) => {
          const hotel = params.data as Hotel;
          return `
            <div class="d-flex flex-column justify-content-center h-100 small">
              <div>In: ${hotel.check_in_after || '—'}</div>
              <div>Out: ${hotel.check_out_before || '—'}</div>
            </div>
          `;
        }
      },
      {
        headerName: 'Ubicación',
        field: 'location',
        flex: 1,
        minWidth: 120,
        sortable: false,
        cellRenderer: (params: any) => {
          const hotel = params.data as Hotel;
          return `
            <div class="d-flex flex-column justify-content-center h-100 small">
              <div>Lat: ${hotel.latitude || '—'}</div>
              <div>Lon: ${hotel.longitude || '—'}</div>
            </div>
          `;
        }
      },
      {
        headerName: 'Amenities',
        field: 'amenities',
        flex: 0.7,
        minWidth: 100,
        maxWidth: 200,
        sortable: true,
        filter: 'agNumberColumnFilter',
        filterParams: NUMBER_FILTER_CONFIG,
        cellRenderer: (params: any) => {
          const hotel = params.data as Hotel;
          const count = hotel.amenities?.length || 0;
          return `<div class="d-flex align-items-center justify-content-center h-100"><span class="badge text-bg-info">${count}</span></div>`;
        }
      },
      {
        headerName: 'Acciones',
        field: 'actions',
        flex: 1.5,
        minWidth: 220,
        cellRenderer: ActionButtonsComponent,
        cellRendererParams: {
          onEdit: (hotel: Hotel) => this.beginEdit(hotel),
          onDelete: (hotel: Hotel) => this.remove(hotel)
        } satisfies Pick<ActionButtonsParams<Hotel>, 'onEdit' | 'onDelete'>,
        sortable: false,
        filter: false
      }
    ] as ColDef<Hotel>[]
  };

  // Base del backend para imágenes (/images/...) – usa backendBaseUrl si existe; si no, deriva de apiBaseUrl
  private backendBase = (environment as any).backendBaseUrl
    || (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  ngOnInit(): void {
    this.amenitiesApi.list().subscribe(a => this.allAmenities = a);
    this.hotelsApi.list().subscribe(h => {
      this.list = h.sort((x,y)=>(x.hotel_id||0)-(y.hotel_id||0));
      this.rowData = [...this.list];
    });
  }

  // Helper imagen
  img(path?: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.backendBase}${path}`;
  }

  // Search functionality
  search: string = '';

  onSearch(term: string): void {
    this.search = term;
    this.withGridApi(api => api.setGridOption('quickFilterText', term || undefined));
  }

  onCreateToggle(event: Event): void {
    const details = event.target as HTMLDetailsElement;
    this.showCreate = details.open;
  }

  private closeCreatePanel(): void {
    const details = this.createDetails?.nativeElement;
    if (!details) return;

    details.open = false;          
    details.removeAttribute('open'); 
  }

  private withGridApi(action: (api: GridApi<Hotel>) => void): void {
    const api = this.gridApi;
    if (!api) return;
    const maybeDestroyed = (api as GridApi<Hotel> & { isDestroyed?: () => boolean }).isDestroyed;
    if (typeof maybeDestroyed === 'function' && maybeDestroyed.call(api)) {
      return;
    }
    action(api);
  }

  // ----- Crear -----
  toggleCreateAmenity(id: number, checked: boolean) {
    if (checked) this.createAmenityIds.add(id); else this.createAmenityIds.delete(id);
  }

  cancelCreate(): void {
    this.showCreate = false;
    this.createForm = { name: '', image: '', check_in_after: '', check_out_before: '' };
    this.createAmenityIds.clear();
    this.imgBrokenCreate = false;
    this.createLoading = false;
    this.closeCreatePanel();
  }

  create() {
    const name = this.createForm.name?.trim();
    if (!name) { alert('El nombre es obligatorio'); return; }

    this.createLoading = true;
    
    // UI snake_case -> payload snake_case (el back mapea por SNAKE_CASE)
    const body = {
      name: this.createForm.name,
      latitude: this.createForm.latitude,
      longitude: this.createForm.longitude,
      description: this.createForm.description,
      check_in_after: this.createForm.check_in_after,
      check_out_before: this.createForm.check_out_before,
      image: this.createForm.image,
      amenity_ids: Array.from(this.createAmenityIds)
    };
    this.hotelsApi.create(body).subscribe({
      next: h => { 
        this.list = [h, ...this.list]; 
        this.rowData = [h, ...this.rowData];
        this.cancelCreate();
        this.withGridApi(api => {
          api.applyTransaction({ add: [h], addIndex: 0 });
          api.refreshCells({ force: true });
          api.refreshClientSideRowModel('filter');
          api.setGridOption('quickFilterText', this.search || undefined);
        });
      },
      error: e => {
        alert(e?.error?.message || e.message || 'Error al crear hotel');
        this.createLoading = false;
      }
    });
  }

  // ----- Editar -----
  beginEdit(h: Hotel): void {
    this.editing = h;
    this.loading = true;
    this.draft = {
      name: h.name,
      latitude: h.latitude,
      longitude: h.longitude,
      description: h.description,
      check_in_after: h.check_in_after,
      check_out_before: h.check_out_before,
      image: h.image
    };
    this.editAmenityIds = new Set<number>((h.amenities || []).map(a => a.amenity_id));
    this.imgBrokenEdit = false;
    this.loading = false;
  }

  cancelEdit(): void {
    this.editing = undefined;
    this.draft = {};
    this.editAmenityIds.clear();
    this.imgBrokenEdit = false;
    this.loading = false;
  }

  toggleEditAmenity(id: number, checked: boolean) {
    if (checked) this.editAmenityIds.add(id); else this.editAmenityIds.delete(id);
  }

  saveEdit(): void {
    if (!this.editing) return;
    this.loading = true;

    const body = {
      name: this.draft.name,
      latitude: this.draft.latitude,
      longitude: this.draft.longitude,
      description: this.draft.description,
      check_in_after: this.draft.check_in_after,
      check_out_before: this.draft.check_out_before,
      image: this.draft.image,
      amenity_ids: Array.from(this.editAmenityIds)
    };

    this.hotelsApi.update(this.editing.hotel_id, body).subscribe({
      next: upd => {
        Object.assign(this.editing!, upd);
        this.list = this.list.map(x => x.hotel_id === upd.hotel_id ? upd : x);
        this.rowData = this.rowData.map(x => x.hotel_id === upd.hotel_id ? upd : x);
        
        this.withGridApi(api => {
          api.applyTransaction({ update: [upd] });
          api.refreshCells({ force: true });
          api.refreshClientSideRowModel('everything');
          api.setGridOption('quickFilterText', this.search || undefined);
        });

        this.cancelEdit();
      },
      error: e => {
        alert(e?.error?.message || e.message || 'Error al actualizar hotel');
        this.loading = false;
      }
    });
  }

  remove(h: Hotel): void {
    if (!confirm(`¿Eliminar hotel "${h.name}"?`)) return;
    
    const index = this.list.indexOf(h);
    if (index >= 0) {
      this.list.splice(index, 1);
    }
    this.rowData = this.rowData.filter(item => item.hotel_id !== h.hotel_id);
    
    this.hotelsApi.delete(h.hotel_id).subscribe({
      next: () => {
        this.withGridApi(api => api.applyTransaction({ remove: [h] }));
      },
      error: e => {
        // Rollback on error
        this.list = [...this.list, h];
        this.rowData = [...this.rowData, h];
        this.withGridApi(api => api.applyTransaction({ add: [h] }));
        alert(e?.error?.message || e.message || 'Error al eliminar hotel');
      }
    });
  }
}