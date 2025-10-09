import { Component, OnInit, inject, Inject, PLATFORM_ID, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridOptions, ModuleRegistry, AllCommunityModule, PaginationModule, ITextFilterParams, INumberFilterParams, ICellRendererParams } from 'ag-grid-community';
import { RoomType } from '../../../../model/room-type';
import { RoomTypeService, RoomTypeRequest } from '../../../../services/room-type';
import { AG_GRID_LOCALE, gridTheme as sharedGridTheme } from '../../sharedTable';
import { ActionButtonsComponent } from '../../action-buttons-cell/action-buttons-cell';
import { ActionButtonsParams } from '../../action-buttons-cell/action-buttons-param';
import { RoomTypeFormComponent, RoomTypeFormPayload } from '../room-type-form/room-type-form';
import { RoomTypeDetailComponent } from '../room-type-detail/room-type-detail';

const TEXT_FILTER_CONFIG: ITextFilterParams = {
  filterOptions: ['contains', 'equals', 'notContains', 'startsWith'],
  maxNumConditions: 1
};

const NUMBER_FILTER_CONFIG: INumberFilterParams = {
  filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'],
  maxNumConditions: 1
};

@Component({
  selector: 'app-room-types-table',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, RoomTypeFormComponent, RoomTypeDetailComponent],
  templateUrl: './room-type-table.html',
  styleUrls: ['./room-type-table.css'],
  encapsulation: ViewEncapsulation.None
})
export class RoomTypesTableComponent implements OnInit {
  private svc = inject(RoomTypeService);

  isBrowser: boolean = false;
  // Fuente de datos
  roomTypes: RoomType[] = [];
  // Datos mostrados por la tabla
  rowData: RoomType[] = [];
  showCreate = false;
  createForm: Partial<RoomType> = { 
    name: '', 
    capacity: 1, 
    base_price: 0, 
    description: '', 
    image: '' 
  };
  imgBrokenCreate = false;
  private gridApi?: GridApi<RoomType>;
  createLoading = false;
  selected?: RoomType;
  search = '';

  // Room type editing
  editing?: RoomType;
  draft: Partial<RoomType> = {};
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

  readonly gridOptions: GridOptions<RoomType> = {
    defaultColDef: { resizable: true, sortable: true, filter: true },
    animateRows: true,
    pagination: true,
    paginationPageSize: 50,
    paginationPageSizeSelector: [50, 100, 200],
    domLayout: 'normal',
    rowHeight: 100,
    headerHeight: 50,
    rowSelection: 'single',
    getRowId: params => params.data.room_type_id?.toString() || '',
    onSelectionChanged: params => {
      const [row] = params.api.getSelectedRows();
      this.selected = row;
    },
    columnDefs: [
      {
        headerName: 'ID',
        field: 'room_type_id',
        width: 80,
        cellRenderer: (params: ICellRendererParams<RoomType>) => {
          const id = params.data?.room_type_id;
          return `<div style="display: flex; align-items: center; height: 100%; justify-content: center;">${id || ''}</div>`;
        }
      },
      { 
        headerName: 'Nombre', 
        field: 'name', 
        width: 180,
        cellRenderer: (params: ICellRendererParams<RoomType>) => {
          const name = params.data?.name || '';
          return `<div style="display: flex; align-items: center; height: 100%; padding: 0 8px;">${name}</div>`;
        }
      },
      { 
        headerName: 'Capacidad', 
        field: 'capacity',
        width: 150,
        cellRenderer: (params: ICellRendererParams<RoomType>) => {
          const capacity = params.data?.capacity || 0;
          return `<div style="display: flex; align-items: center; height: 100%; justify-content: center;">${capacity}</div>`;
        }
      },
      { 
        headerName: 'Precio Base', 
        field: 'base_price',
        width: 180,
        cellRenderer: (params: ICellRendererParams<RoomType>) => {
          const price = params.data?.base_price || 0;
          return `<div style="display: flex; align-items: center; height: 100%; justify-content: center;">$${price.toLocaleString()}</div>`;
        }
      },
      { 
        headerName: 'Descripción', 
        field: 'description',
        width: 450,
        cellRenderer: (params: ICellRendererParams<RoomType>) => {
          const description = params.data?.description || '';
          const truncated = description.length > 40 ? description.substring(0, 40) + '...' : description;
          return `<div style="display: flex; align-items: center; height: 100%; padding: 0 8px;" title="${description}">${truncated}</div>`;
        }
      },
      {
        headerName: 'Imagen',
        field: 'image',
        width: 200,
        cellRenderer: (params: ICellRendererParams<RoomType>) => {
          const image = params.data?.image;
          if (!image) return '<div style="display: flex; align-items: center; height: 100%; justify-content: center;">Sin imagen</div>';
          return `<div style="display: flex; align-items: center; height: 100%; justify-content: center;">
            <img src="${image}" alt="Room Type" style="width: 70px; height: 70px; object-fit: cover; border-radius: 4px;">
          </div>`;
        }
      },
      {
        headerName: 'Acciones',
        width: 350,
        cellRenderer: ActionButtonsComponent,
        cellRendererParams: {
          onEdit: (data: RoomType) => this.beginEdit(data),
          onDelete: (data: RoomType) => this.delete(data)
        }
      }
    ],
    onGridReady: (event) => this.gridApi = event.api,
  };

  ngOnInit(): void {
    this.fetchData();
  }

  private fetchData(): void {
    this.loading = true;
    this.svc.list().subscribe({
      next: (data) => {
        this.roomTypes = data;
        this.rowData = [...data];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading room types:', err);
        this.loading = false;
      }
    });
  }

  onSearch(query: string): void {
    this.search = query;
    if (!query.trim()) {
      this.rowData = [...this.roomTypes];
      return;
    }

    const lowerQuery = query.toLowerCase();
    this.rowData = this.roomTypes.filter(rt => 
      rt.name?.toLowerCase().includes(lowerQuery) ||
      rt.description?.toLowerCase().includes(lowerQuery) ||
      rt.capacity?.toString().includes(lowerQuery) ||
      rt.base_price?.toString().includes(lowerQuery)
    );
  }

  onCreateToggle(event: Event): void {
    const details = event.target as HTMLDetailsElement;
    this.showCreate = details.open;
    if (details.open) {
      this.resetCreateForm();
    }
  }

  cancelCreate(): void {
    this.showCreate = false;
    if (this.createDetails) {
      this.createDetails.nativeElement.open = false;
    }
    this.resetCreateForm();
  }



  create(): void {
    const payload: Omit<RoomType, 'room_type_id'> = {
      name: this.createForm.name!,
      capacity: this.createForm.capacity!,
      base_price: this.createForm.base_price!,
      description: this.createForm.description!,
      image: this.createForm.image!,
    };

    this.createLoading = true;
    this.svc.create(payload).subscribe({
      next: () => {
        this.createLoading = false;
        this.showCreate = false;
        this.resetCreateForm();
        this.fetchData();
        if (this.createDetails) {
          this.createDetails.nativeElement.open = false;
        }
      },
      error: (err) => {
        console.error('Error creating room type:', err);
        this.createLoading = false;
      }
    });
  }

  beginEdit(roomType: RoomType): void {
    this.editing = roomType;
    this.draft = { ...roomType };
  }

  cancelEdit(): void {
    this.editing = undefined;
    this.draft = {};
    this.loading = false;
  }

  saveEdit(payload: RoomTypeFormPayload): void {
    if (!this.editing) return;

    const updatePayload: Omit<RoomType, 'room_type_id'> = {
      name: payload.draft.name!,
      capacity: payload.draft.capacity!,
      base_price: payload.draft.base_price!,
      description: payload.draft.description!,
      image: payload.draft.image!,
    };

    this.loading = true;
    this.svc.update(this.editing.room_type_id!, updatePayload).subscribe({
      next: (updatedRoomType) => {
        // Actualizar el roomType en las listas
        const index = this.roomTypes.findIndex(rt => rt.room_type_id === this.editing!.room_type_id);
        if (index !== -1) {
          this.roomTypes[index] = updatedRoomType;
          this.rowData = [...this.roomTypes];
        }
        
        // Actualizar selected si es el mismo room type
        if (this.selected && this.selected.room_type_id === updatedRoomType.room_type_id) {
          this.selected = updatedRoomType;
        }
        
        this.loading = false;
        this.cancelEdit();
      },
      error: (err) => {
        console.error('Error updating room type:', err);
        this.loading = false;
      }
    });
  }

  onDetailEdit(roomType: RoomType): void {
    this.beginEdit(roomType);
  }

  delete(roomType: RoomType): void {
    if (!roomType.room_type_id) return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar "${roomType.name}"?`)) {
      this.svc.delete(roomType.room_type_id).subscribe({
        next: () => {
          // Limpiar selección si el room type eliminado está seleccionado
          if (this.selected && this.selected.room_type_id === roomType.room_type_id) {
            this.selected = undefined;
          }
          
          this.fetchData();
          
          // Limpiar selección del grid también
          if (this.gridApi) {
            this.gridApi.deselectAll();
          }
        },
        error: (err) => {
          console.error('Error deleting room type:', err);
        }
      });
    }
  }

  private resetCreateForm(): void {
    this.createForm = { 
      name: '', 
      capacity: 1, 
      base_price: 0, 
      description: '', 
      image: '' 
    };
    this.imgBrokenCreate = false;
  }

  onCreateImageError(): void {
    this.imgBrokenCreate = true;
  }
}
