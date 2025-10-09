import { Component, OnInit, inject, Inject, PLATFORM_ID, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridOptions, ModuleRegistry, AllCommunityModule, PaginationModule, ITextFilterParams, INumberFilterParams } from 'ag-grid-community';
import { AmenitiesService } from '../../../services/amenities';
import { Amenity, AmenityType } from '../../../model/amenity';
import { environment } from '../../../../environments/environment';
import { AG_GRID_LOCALE, gridTheme as sharedGridTheme } from '../sharedTable';
import { ActionButtonsComponent } from '../action-buttons-cell/action-buttons-cell';
import { ActionButtonsParams } from '../action-buttons-cell/action-buttons-param';
import { AmenityDetail } from './amenity-detail/amenity-detail';

const TEXT_FILTER_CONFIG: ITextFilterParams = {
  filterOptions: ['contains', 'equals', 'notContains', 'startsWith'],
  maxNumConditions: 1
};

const NUMBER_FILTER_CONFIG: INumberFilterParams = {
  filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'],
  maxNumConditions: 1
};

@Component({
  standalone: true,
  selector: 'app-admin-amenities',
  imports: [CommonModule, FormsModule, AgGridAngular, AmenityDetail],
  styleUrls: ['./amenities.css'],
  templateUrl: `./amenities.html`,
  encapsulation: ViewEncapsulation.None
})
export class AmenitiesComponent implements OnInit {
  private api = inject(AmenitiesService);
  amenityTypes = AmenityType; // Para usar en el template

  isBrowser: boolean = false;
  // Fuente de datos
  list: Amenity[] = [];
  // Datos mostrados por la tabla
  rowData: Amenity[] = [];
  showCreate = false;
  createForm: Partial<Amenity> = { 
    name: '', 
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80', 
    type: AmenityType.HOTEL 
  };
  imgBrokenCreate = false;
  private gridApi?: GridApi<Amenity>;
  createLoading = false;
  selected?: Amenity;

  // Editar
  editing?: Amenity;
  draft: Partial<Amenity> = {};
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

  gridOptions: GridOptions<Amenity> = {
    localeText: AG_GRID_LOCALE,
    rowSelection: 'single',
    rowHeight: 100,
    getRowId: params => params.data.amenity_id?.toString(),
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
        field: 'amenity_id',
        minWidth: 50,
        maxWidth: 100,
        sortable: true,
        filter: 'agNumberColumnFilter',
        filterParams: NUMBER_FILTER_CONFIG,
        cellRenderer: (params: any) => {
          return `
            <div class="d-flex align-items-center justify-content-center h-100">
              <span>${params.value}</span>
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
          const amenity = params.data as Amenity;
          const imgSrc = this.img(amenity.image);
          return `
            <div class="d-flex align-items-center justify-content-center h-100">
              <img src="${imgSrc}" alt="${amenity.name}" style="width:70px;height:70px;object-fit:contain;border-radius:8px;">
            </div>
          `;
        }
      },
      {
        headerName: 'Nombre',
        field: 'name',
        flex: 2,
        minWidth: 150,
        sortable: true,
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        cellRenderer: (params: any) => {
          const amenity = params.data as Amenity;
          return `
            <div class="d-flex align-items-center h-100">
              <span class="fw-semibold">${amenity.name}</span>
            </div>
          `;
        }
      },
      {
        headerName: 'Tipo',
        field: 'type',
        flex: 1,
        minWidth: 120,
        maxWidth: 150,
        sortable: true,
        filter: 'agSetColumnFilter',
        cellRenderer: (params: any) => {
          const amenity = params.data as Amenity;
          const typeText = amenity.type === AmenityType.HOTEL ? 'Hotel' : 'Habitación';
          const badgeClass = amenity.type === AmenityType.HOTEL ? 'text-bg-primary' : 'text-bg-secondary';
          return `
            <div class="d-flex align-items-center justify-content-center h-100">
              <span class="badge ${badgeClass}">${typeText}</span>
            </div>
          `;
        }
      },
      {
        headerName: 'Acciones',
        field: 'actions',
        flex: 1.5,
        minWidth: 220,
        cellRenderer: ActionButtonsComponent,
        cellRendererParams: {
          onEdit: (amenity: Amenity) => this.beginEdit(amenity),
          onDelete: (amenity: Amenity) => this.remove(amenity)
        } satisfies Pick<ActionButtonsParams<Amenity>, 'onEdit' | 'onDelete'>,
        sortable: false,
        filter: false
      }
    ] as ColDef<Amenity>[]
  };
  
  // Base del backend para imágenes (/images/...) – usa backendBaseUrl si existe; si no, deriva de apiBaseUrl
  private backendBase = (environment as any).backendBaseUrl
    || (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  ngOnInit(): void {
    this.api.list().subscribe(d => {
      this.list = d;
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

  private withGridApi(action: (api: GridApi<Amenity>) => void): void {
    const api = this.gridApi;
    if (!api) return;
    const maybeDestroyed = (api as GridApi<Amenity> & { isDestroyed?: () => boolean }).isDestroyed;
    if (typeof maybeDestroyed === 'function' && maybeDestroyed.call(api)) {
      return;
    }
    action(api);
  }

  // ----- Crear -----
  cancelCreate(): void {
    this.showCreate = false;
    this.createForm = { 
      name: '', 
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80', 
      type: AmenityType.HOTEL 
    };
    this.imgBrokenCreate = false;
    this.createLoading = false;
    this.closeCreatePanel();
  }

  create() {
    const name = this.createForm.name?.trim();
    if (!name) return;

    this.createLoading = true;
    
    this.api.create({ 
      name, 
      image: this.createForm.image!, 
      type: this.createForm.type! 
    }).subscribe({
      next: a => { 
        this.list = [a, ...this.list]; 
        this.rowData = [a, ...this.rowData];
        this.cancelCreate();
        this.withGridApi(api => {
          api.applyTransaction({ add: [a], addIndex: 0 });
          api.refreshCells({ force: true });
          api.refreshClientSideRowModel('filter');
          api.setGridOption('quickFilterText', this.search || undefined);
        });
      },
      error: e => {
        alert(e?.error?.message || e.message || 'Error al crear amenity');
        this.createLoading = false;
      }
    });
  }

  // ----- Editar -----
  beginEdit(a: Amenity): void {
    this.editing = a;
    this.loading = true;
    this.draft = {
      name: a.name,
      image: a.image,
      type: a.type
    };
    this.imgBrokenEdit = false;
    this.loading = false;
  }

  cancelEdit(): void {
    this.editing = undefined;
    this.draft = {};
    this.imgBrokenEdit = false;
    this.loading = false;
  }

  saveEdit(): void {
    if (!this.editing) return;
    const name = this.draft.name?.trim();
    if (!name) return;

    this.loading = true;
    
    this.api.update(this.editing.amenity_id, { 
      name, 
      image: this.draft.image!,
      type: this.draft.type!
    }).subscribe({
      next: upd => {
        Object.assign(this.editing!, upd);
        this.list = this.list.map(x => x.amenity_id === upd.amenity_id ? upd : x);
        this.rowData = this.rowData.map(x => x.amenity_id === upd.amenity_id ? upd : x);
        
        this.withGridApi(api => {
          api.applyTransaction({ update: [upd] });
          api.refreshCells({ force: true });
          api.refreshClientSideRowModel('everything');
          api.setGridOption('quickFilterText', this.search || undefined);
          // Limpiar selección del grid para volver a la tabla
          api.deselectAll();
        });

        // Limpiar selección para volver a la tabla
        this.selected = undefined;
        this.cancelEdit();
      },
      error: e => {
        alert(e?.error?.message || e.message || 'Error al actualizar');
        this.loading = false;
      }
    });
  }

  remove(a: Amenity): void {
    if (!confirm(`¿Eliminar amenity "${a.name}"?`)) return;
    
    const index = this.list.indexOf(a);
    if (index >= 0) {
      this.list.splice(index, 1);
    }
    this.rowData = this.rowData.filter(item => item.amenity_id !== a.amenity_id);
    
    this.api.delete(a.amenity_id).subscribe({
      next: () => {
        this.withGridApi(api => {
          api.applyTransaction({ remove: [a] });
          api.deselectAll();
        });
        
        // Limpiar selección para volver a la tabla
        this.selected = undefined;
      },
      error: e => {
        // Rollback on error
        this.list = [...this.list, a];
        this.rowData = [...this.rowData, a];
        this.withGridApi(api => api.applyTransaction({ add: [a] }));
        alert(e?.error?.message || e.message || 'Error al eliminar');
      }
    });
  }

  onDetailEdit(amenity: Amenity): void {
    this.beginEdit(amenity);
  }
}
