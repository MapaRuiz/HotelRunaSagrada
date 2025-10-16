import { Component, OnInit, PLATFORM_ID, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Room } from '../../../../model/room';
import { RoomService, RoomRequest } from '../../../../services/room';
import { RoomType } from '../../../../model/room-type';
import { RoomTypeService } from '../../../../services/room-type';
import { Hotel } from '../../../../model/hotel';
import { HotelsService } from '../../../../services/hotels';
import { ColDef, GridOptions, GridApi, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { ActionButtonsParams } from '../../action-buttons-cell/action-buttons-param';
import { ActionButtonsComponent } from '../../action-buttons-cell/action-buttons-cell';
import { AG_GRID_LOCALE } from '../../sharedTable';
import { MultiSelectFilterComponent } from '../../filters/multi-select-filter/multi-select-filter';
import { gridTheme as sharedGridTheme } from '../../sharedTable';
import type { ITextFilterParams, INumberFilterParams } from 'ag-grid-community';
import { zip } from 'rxjs';
import { RoomDetail } from '../room-detail/room-detail';

const TEXT_FILTER_CONFIG: ITextFilterParams = {
  filterOptions: ['contains', 'equals', 'notContains', 'startsWith'],
  maxNumConditions: 1
};

const NUMBER_FILTER_CONFIG: INumberFilterParams = {
  filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'],
  maxNumConditions: 1
};

type ToastCtor = new (element: string | Element, config?: any) => { show(): void };

@Component({
  selector: 'app-rooms-table',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, RoomDetail],
  templateUrl: './room-table.html',
  styleUrls: ['./room-table.css']
})
export class RoomsTableComponent implements OnInit {
  isBrowser: boolean = false;
  
  // Fuente de datos
  roomsList: Room[] = [];
  hotels: Hotel[] = [];
  types: RoomType[] = [];
  
  // Datos mostrados por la tabla
  rowData: Room[] = [];
  loading = false;

  // Create form
  showCreate = false;
  draft: Room = {
    number: '',
    floor: 1,
    res_status: 'AVAILABLE',
    cle_status: 'CLEAN',
    images: []
  };
  draft_hotel_id?: number;
  draft_room_type_id?: number;
  createLoading = false;

  // Edit form
  editing?: Room;
  editDraft: Room = {
    number: '',
    floor: 1,
    res_status: 'AVAILABLE',
    cle_status: 'CLEAN',
    images: []
  };

  // Selection and detail
  selected?: Room;
  
  private gridApi?: GridApi<Room>;
  readonly gridTheme: typeof sharedGridTheme = sharedGridTheme;
  private toastCtor?: ToastCtor;

  @ViewChild('createDetails') private createDetails?: ElementRef<HTMLDetailsElement>;

  constructor(
    private roomsSvc: RoomService,
    private typesSvc: RoomTypeService,
    private hotelsSvc: HotelsService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      ModuleRegistry.registerModules([AllCommunityModule]);
    }
  }

  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    zip([
      this.roomsSvc.list({}),
      this.hotelsSvc.list(),
      this.typesSvc.list()
    ]).subscribe(([rooms, hotels, types]) => {
      this.hotels = hotels;
      this.types = types;

      // Enriquecer rooms con datos de hotel y tipo
      const enrichedRooms = rooms.map(room => ({
        ...room,
        hotel: hotels.find(h => h.hotel_id === room.hotel_id),
        room_type: types.find(t => t.room_type_id === room.room_type_id)
      }));

      this.roomsList = enrichedRooms;
      this.rowData = enrichedRooms;
    });
  }

  trackById = (_: number, r: Room) => r.room_id ?? -1;

  gridOptions: GridOptions<Room> = {
    localeText: AG_GRID_LOCALE,
    rowSelection: 'single',
    getRowId: params => params.data.room_id?.toString() || '',
    onGridReady: params => { 
      this.gridApi = params.api
      params.api.sizeColumnsToFit();
    },
    onGridPreDestroyed: () => {
      this.gridApi = undefined;
    },
    onSelectionChanged: params => {
      const [row] = params.api.getSelectedRows();
      this.selected = row || undefined;
    },
    columnDefs: [
      { 
        headerName: 'ID',
        field: 'room_id',
        minWidth: 60,
        maxWidth: 65
      },
      { 
        headerName: 'Hotel',
        filter: MultiSelectFilterComponent,
        filterParams: {
          valueGetter: (row: Room) => row.hotel?.name,
          title: 'Hoteles'
        },
        valueGetter: params => params.data?.hotel?.name,
        minWidth: 150,
        maxWidth: 230
      },
      { 
        headerName: 'Número',
        field: 'number',
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        maxWidth: 120
      },
      { 
        headerName: 'Piso',
        field: 'floor',
        filter: 'agNumberColumnFilter',
        filterParams: NUMBER_FILTER_CONFIG,
        maxWidth: 100
      },
      { 
        headerName: 'Tipo',
        filter: MultiSelectFilterComponent,
        filterParams: {
          valueGetter: (row: Room) => row.room_type?.name,
          title: 'Tipos'
        },
        valueGetter: params => params.data?.room_type?.name,
        minWidth: 100,
        maxWidth: 150
      },
      { 
        headerName: 'Estado Res.',
        filter: MultiSelectFilterComponent,
        filterParams: {
          valueGetter: (row: Room) => row.res_status,
          title: 'Estados de Reserva'
        },
        field: 'res_status',
        maxWidth: 140,
        cellRenderer: (params: any) => {
          const room = params.data as Room;
          const status = room.res_status;
          let badgeClass = '';
          let statusText = '';
          
          switch (status) {
            case 'AVAILABLE':
              badgeClass = 'text-bg-success';
              statusText = 'Disponible';
              break;
            case 'BOOKED':
              badgeClass = 'text-bg-primary';
              statusText = 'Reservada';
              break;
            case 'MAINTENANCE':
              badgeClass = 'text-bg-danger';
              statusText = 'Mantenimiento';
              break;
            default:
              badgeClass = 'text-bg-secondary';
              statusText = status || 'N/A';
          }
          
          return `
            <div class="d-flex align-items-center justify-content-center h-100">
              <span class="badge ${badgeClass}">${statusText}</span>
            </div>
          `;
        }
      },
      { 
        headerName: 'Estado Limp.',
        filter: MultiSelectFilterComponent,
        filterParams: {
          valueGetter: (row: Room) => row.cle_status,
          title: 'Estados de Limpieza'
        },
        field: 'cle_status',
        maxWidth: 150,
        cellRenderer: (params: any) => {
          const room = params.data as Room;
          const status = room.cle_status;
          const badgeClass = status === 'DIRTY' ? 'text-bg-warning' : 'text-bg-success';
          const statusText = status === 'DIRTY' ? 'Sucia' : 'Limpia';
          return `
            <div class="d-flex align-items-center justify-content-center h-100">
              <span class="badge ${badgeClass}">${statusText}</span>
            </div>
          `;
        }
      },
      { 
        headerName: 'Tema',
        field: 'theme_name',
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        minWidth: 100,
        maxWidth: 160
      },
      {
        headerName: 'Acciones',
        filter: false,
        minWidth: 200,
        cellRenderer: ActionButtonsComponent<Room>,
        cellRendererParams: {
          onEdit: (row: Room) => this.beginEdit(row),
          onDelete: (row: Room) => this.deleteRoom(row)
        } satisfies Pick<ActionButtonsParams<Room>, 'onEdit' | 'onDelete'>
      } as ColDef<Room> 
    ]
  }

  onCreateToggle(event: Event): void {
    const details = event.target as HTMLDetailsElement;
    this.showCreate = details.open;
  }

  // ---- CRUD ----
  private buildEmptyDraft(): Room {
    return {
      number: '',
      floor: 1,
      res_status: 'AVAILABLE',
      cle_status: 'CLEAN',
      images: [],
      theme_name: ''
    };
  }

  private resetImageState(): void {
    this.newImageUrl = '';
    this.imageStatus = [];
    this.activeSlide = 0;
    this.displayMode = 'carousel';
  }

  // Create methods
  save() {
    // Validaciones mínimas
    if (!this.draft_hotel_id || !this.draft_room_type_id) {
      void this.showToast('Please select hotel and room type');
      return;
    }
    if (!this.draft.number?.trim()) {
      void this.showToast('Please enter room number');
      return;
    }

    this.createLoading = true;
    const payload: RoomRequest = {
      hotel_id: this.draft_hotel_id,
      room_type_id: this.draft_room_type_id,
      number: this.draft.number,
      floor: this.draft.floor,
      res_status: this.draft.res_status,
      cle_status: this.draft.cle_status,
      theme_name: this.draft.theme_name,
      images: this.draft.images
    };

    this.roomsSvc.create(payload).subscribe({
      next: (created) => {
        const enrichedRoom = {
          ...created,
          hotel: this.hotels.find(h => h.hotel_id === created.hotel_id),
          room_type: this.types.find(t => t.room_type_id === created.room_type_id)
        };
        
        this.roomsList = [enrichedRoom, ...this.roomsList];
        this.rowData = [enrichedRoom, ...this.rowData];
        this.cancelCreate();
        
        this.withGridApi(api => {
          api.applyTransaction({ add: [enrichedRoom], addIndex: 0 });
          api.refreshCells({ force: true });
        });
        
      },
      error: (e) => {
        this.createLoading = false;
      }
    });
  }

  cancelCreate(): void {
    this.showCreate = false;
    this.draft = this.buildEmptyDraft();
    this.draft_hotel_id = undefined;
    this.draft_room_type_id = undefined;
    this.createLoading = false;
    this.resetImageState();
    this.closeCreatePanel();
  }

  private closeCreatePanel(): void {
    const details = this.createDetails?.nativeElement;
    if (!details) return;
    details.open = false;          
    details.removeAttribute('open'); 
  }

  // Edit methods
  beginEdit(room: Room): void {
    this.editing = room;
    this.editDraft = {
      room_id: room.room_id,
      hotel_id: room.hotel_id,
      room_type_id: room.room_type_id,
      number: room.number,
      floor: room.floor,
      res_status: room.res_status,
      cle_status: room.cle_status,
      theme_name: room.theme_name,
      images: [...(room.images || [])]
    };
    this.draft_hotel_id = room.hotel_id;
    this.draft_room_type_id = room.room_type_id;
    this.draft = this.editDraft; // Para reutilizar el formulario
    
    // Inicializar estado de imágenes
    this.resetImageState();
    this.imageStatus = (room.images || []).map(() => 'idle' as const);
  }

  saveEdit(): void {
    if (!this.editing?.room_id) return;
    
    // Validaciones mínimas
    if (!this.draft_hotel_id || !this.draft_room_type_id) {
      void this.showToast('Please select hotel and room type');
      return;
    }
    if (!this.draft.number?.trim()) {
      void this.showToast('Please enter room number');
      return;
    }

    this.loading = true;
    const payload: RoomRequest = {
      hotel_id: this.draft_hotel_id,
      room_type_id: this.draft_room_type_id,
      number: this.draft.number,
      floor: this.draft.floor,
      res_status: this.draft.res_status,
      cle_status: this.draft.cle_status,
      theme_name: this.draft.theme_name,
      images: this.draft.images
    };

    this.roomsSvc.update(this.editing.room_id, payload).subscribe({
      next: (updated) => {
        const enrichedRoom = {
          ...updated,
          hotel: this.hotels.find(h => h.hotel_id === updated.hotel_id),
          room_type: this.types.find(t => t.room_type_id === updated.room_type_id)
        };

        // Actualizar en las listas
        this.roomsList = this.roomsList.map(r => 
          r.room_id === enrichedRoom.room_id ? enrichedRoom : r
        );
        this.rowData = this.rowData.map(r => 
          r.room_id === enrichedRoom.room_id ? enrichedRoom : r
        );

        this.withGridApi(api => {
          api.applyTransaction({ update: [enrichedRoom] });
          api.refreshCells({ force: true });
          // Limpiar selección del grid para volver a la tabla
          api.deselectAll();
        });

        // Limpiar selección para volver a la tabla
        this.selected = undefined;
        this.cancelEdit();
      },
      error: (e) => {
        this.loading = false;
        void this.showToast(e?.error?.detail || 'Error updating room');
      }
    });
  }

  cancelEdit(): void {
    this.editing = undefined;
    this.editDraft = this.buildEmptyDraft();
    this.draft = this.buildEmptyDraft();
    this.draft_hotel_id = undefined;
    this.draft_room_type_id = undefined;
    this.loading = false;
    this.resetImageState();
  }

  // Método de compatibilidad - redirige a cancelCreate o cancelEdit según el contexto
  cancel(): void {
    if (this.editing) {
      this.cancelEdit();
    } else {
      this.cancelCreate();
    }
  }

  deleteRoom(room: Room): void {
    if (!room.room_id) return;
    if (!confirm(`¿Eliminar habitación ${room.number}?`)) return;
    
    this.roomsSvc.delete(room.room_id).subscribe({
      next: () => {
        this.roomsList = this.roomsList.filter(r => r.room_id !== room.room_id);
        this.rowData = this.rowData.filter(r => r.room_id !== room.room_id);
        
        this.withGridApi(api => {
          api.applyTransaction({ remove: [room] });
          api.deselectAll();
        });
        
        // Limpiar selección para volver a la tabla
        this.selected = undefined;
      },
      error: () => {
        // Error silencioso - no mostrar toast
      }
    });
  }

  // Search functionality
  search: string = '';

  onSearch(term: string): void {
    this.search = term;
    this.withGridApi(api => api.setGridOption('quickFilterText', term || undefined));
  }

  onDetailEdit(room: Room): void {
    this.beginEdit(room);
  }

  private withGridApi(action: (api: GridApi<Room>) => void): void {
    const api = this.gridApi;
    if (!api) return;
    const maybeDestroyed = (api as GridApi<Room> & { isDestroyed?: () => boolean }).isDestroyed;
    if (typeof maybeDestroyed === 'function' && maybeDestroyed.call(api)) {
      return;
    }
    action(api);
  }

  // ---- Galería con carrusel (estilo Services) ----
  newImageUrl = '';
  imageStatus: ('idle'|'loaded'|'error')[] = [];
  displayMode: 'carousel' | 'list' = 'carousel';
  activeSlide = 0;

  isValidUrl(u: string): boolean {
    try { const x = new URL(u); return x.protocol === 'http:' || x.protocol === 'https:'; }
    catch { return false; }
  }

  addImage(): void {
    const raw = this.newImageUrl.trim();
    if (!raw || !this.isValidUrl(raw)) return;
    const url = raw;
    if (this.draft.images.includes(url)) { this.newImageUrl = ''; return; }
    this.draft.images.push(url);
    this.imageStatus.push('idle');
    this.newImageUrl = '';
  }

  removeImage(i: number): void {
    this.draft.images.splice(i, 1);
    this.imageStatus.splice(i, 1);
    // Ajustar activeSlide si es necesario
    if (this.activeSlide >= this.draft.images.length && this.draft.images.length > 0) {
      this.activeSlide = this.draft.images.length - 1;
    } else if (this.draft.images.length === 0) {
      this.activeSlide = 0;
    }
  }

  removeActiveImage(): void {
    if (this.draft.images.length === 0) return;
    this.removeImage(this.activeSlide);
  }

  setCover(i: number): void {
    if (i <= 0 || i >= this.draft.images.length) return;
    const [img] = this.draft.images.splice(i, 1);
    this.draft.images.unshift(img);
    const [st] = this.imageStatus.splice(i, 1);
    this.imageStatus.unshift(st);
    this.activeSlide = 0;
  }

  moveImage(i: number, dir: -1|1): void {
    const j = i + dir;
    if (j < 0 || j >= this.draft.images.length) return;
    [this.draft.images[i], this.draft.images[j]] = [this.draft.images[j], this.draft.images[i]];
    [this.imageStatus[i], this.imageStatus[j]] = [this.imageStatus[j], this.imageStatus[i]];
  }

  setDisplayMode(mode: 'carousel' | 'list'): void {
    this.displayMode = mode;
  }

  prev(): void {
    if (this.draft.images.length <= 1) return;
    this.activeSlide = this.activeSlide === 0 ? this.draft.images.length - 1 : this.activeSlide - 1;
  }

  next(): void {
    if (this.draft.images.length <= 1) return;
    this.activeSlide = (this.activeSlide + 1) % this.draft.images.length;
  }

  trackByIndex(index: number): number {
    return index;
  }

  onImageLoaded(i: number): void {
    this.imageStatus[i] = 'loaded';
  }

  onImageError(i: number): void {
    this.imageStatus[i] = 'error';
  }

  onImgLoad(i: number): void { this.imageStatus[i] = 'loaded'; }
  onImgError(i: number): void { this.imageStatus[i] = 'error'; }

  private async showToast(message: string): Promise<void> {
    if (!this.isBrowser) return;

    if (!this.toastCtor) {
      const module = await import('bootstrap/js/dist/toast');
      this.toastCtor = module.default;
    }

    const Toast = this.toastCtor;
    if (!Toast) return;

    const toastElement = document.createElement('div');
    toastElement.className = 'toast align-items-center text-bg-dark border-0 position-fixed top-0 end-0 m-3';
    toastElement.textContent = message;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');

    document.body.appendChild(toastElement);

    toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove(), { once: true });

    const toastInstance = new Toast(toastElement);
    toastInstance.show();
  }
}
