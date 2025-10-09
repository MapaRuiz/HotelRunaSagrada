import { Component, inject, OnInit, PLATFORM_ID, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Department } from '../../../../model/department';
import { Hotel } from '../../../../model/hotel';
import { DepartmentService } from '../../../../services/department';
import { HotelsService } from '../../../../services/hotels';
import { StaffMemberList } from '../../staff-member/staff-member-list/staff-member-list';
import { ColDef, GridOptions, GridApi, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { ActionButtonsParams, AdditionalButton } from '../../../admin/action-buttons-cell/action-buttons-param';
import { ActionButtonsComponent } from '../../../admin/action-buttons-cell/action-buttons-cell';
import { AG_GRID_LOCALE } from '../../../admin/sharedTable';
import { MultiSelectFilterComponent } from '../../../admin/filters/multi-select-filter/multi-select-filter';
import { gridTheme as sharedGridTheme } from '../../../admin/sharedTable';
import type { ITextFilterParams } from 'ag-grid-community';
import { zip } from 'rxjs';


const TEXT_FILTER_CONFIG: ITextFilterParams = {
  filterOptions: ['contains', 'equals', 'notContains', 'startsWith'],
  maxNumConditions: 1
};

@Component({
  selector: 'app-department-table',
  standalone: true,
  imports: [CommonModule, FormsModule, StaffMemberList, AgGridAngular],
  templateUrl: './department-table.html',
  styleUrls: ['./department-table.css']
})
export class DepartmentTable implements OnInit {
  private departmentService = inject(DepartmentService);
  private hotelsService = inject(HotelsService);
  private platformId = inject(PLATFORM_ID);
  
  isBrowser: boolean = false;
  loading: boolean = true;
  
  // Fuente de datos
  departments: Department[] = [];
  rowData: Department[] = [];

  // catálogos
  hotels: Hotel[] = [];

  // Form control
  showCreate = false;
  editing?: Department;
  draft: Partial<Department> = {};
  createLoading = false;
  
  private gridApi?: GridApi<Department>;
  readonly gridTheme: typeof sharedGridTheme = sharedGridTheme;

  // Ver el staff
  showStaffView = false;
  selectedDepartment: Department | undefined;
  
  // Search functionality
  search = '';

  @ViewChild('createDetails') private createDetails?: ElementRef<HTMLDetailsElement>;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      ModuleRegistry.registerModules([AllCommunityModule]);
    }
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    
    zip([
      this.departmentService.list(),
      this.hotelsService.list()
    ]).subscribe({
      next: ([departments, hotels]) => {
        this.departments = departments || [];
        this.hotels = hotels || [];

        // Enriquecer departments con datos de hotel
        const enrichedDepartments = this.departments.map(department => ({
          ...department,
          hotel: hotels.find(h => h.hotel_id === department.hotel_id)
        }));
        
        this.rowData = enrichedDepartments;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading departments data:', error);
        this.loading = false;
      }
    });
  }

  gridOptions: GridOptions<Department> = {
    localeText: AG_GRID_LOCALE,
    rowSelection: 'single',
    getRowId: params => params.data.department_id?.toString() || '',
    onGridReady: params => { 
      this.gridApi = params.api;
      setTimeout(() => {
        params.api.sizeColumnsToFit();
      }, 100);
    },
    onGridPreDestroyed: () => {
      this.gridApi = undefined;
    },
    columnDefs: [
      { 
        headerName: 'ID',
        field: 'department_id',
        minWidth: 60,
        maxWidth: 80
      },
      { 
        headerName: 'Hotel',
        filter: MultiSelectFilterComponent,
        filterParams: {
          valueGetter: (row: Department & { hotel?: Hotel }) => row.hotel?.name || `Hotel ${row.hotel_id}`,
          title: 'Hoteles'
        },
        valueGetter: params => params.data?.hotel?.name || `Hotel ${params.data?.hotel_id || 'N/A'}`,
        minWidth: 150,
        maxWidth: 400
      },
      { 
        headerName: 'Nombre',
        field: 'name',
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        minWidth: 150,
        maxWidth: 400
      },
      {
        headerName: 'Acciones',
        filter: false,
        minWidth: 200,
        cellRenderer: ActionButtonsComponent<Department>,
        cellRendererParams: {
          onEdit: (department: Department) => this.beginEdit(department),
          onDelete: (department: Department) => this.deleteDepartment(department),
          editLabel: 'Editar',
          deleteLabel: 'Eliminar',
          additionalButtons: [
            {
              label: 'Ver Staff',
              action: (department: Department) => this.viewStaff(department),
              class: 'btn-details'
            }
          ]
        },
        sortable: false
      }
    ]
  };

  // Search functionality
  onSearch(query: string) {
    this.search = query;
    this.gridApi?.setGridOption('quickFilterText', query);
  }

  // Create/Edit form methods
  onCreateToggle(event: Event) {
    const details = event.target as HTMLDetailsElement;
    this.showCreate = details.open;
    if (!this.showCreate) {
      this.cancelCreate();
    }
  }

  beginCreate() {
    this.draft = {};
    this.editing = undefined;
    this.showCreate = true;
    this.createDetails?.nativeElement.setAttribute('open', '');
  }

  beginEdit(department: Department) {
    this.editing = department;
    this.draft = { 
      ...department,
      hotel_id: department.hotel_id
    };
    this.showCreate = true;
    this.createDetails?.nativeElement.setAttribute('open', '');
  }

  saveCreate() {
    if (!this.draft.hotel_id || !this.draft.name?.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    this.createLoading = true;
    
    const payload: Partial<Department> = {
      name: this.draft.name.trim(),
      hotel_id: this.draft.hotel_id
    };

    const operation = this.editing 
      ? this.departmentService.update(this.editing.department_id, payload)
      : this.departmentService.create(payload);

    operation.subscribe({
      next: () => {
        this.loadData();
        this.cancelCreate();
        this.createLoading = false;
      },
      error: (error) => {
        console.error('Error saving department:', error);
        alert('Error al guardar el departamento');
        this.createLoading = false;
      }
    });
  }

  cancelCreate() {
    this.showCreate = false;
    this.editing = undefined;
    this.draft = {};
    this.createLoading = false;
    this.createDetails?.nativeElement.removeAttribute('open');
  }

  deleteDepartment(department: Department) {
    if (!confirm(`¿Estás seguro de eliminar el departamento "${department.name}"?`)) {
      return;
    }

    this.departmentService.delete(department.department_id).subscribe({
      next: () => {
        this.loadData();
      },
      error: (error) => {
        console.error('Error removing department:', error);
        alert('Error al eliminar el departamento');
      }
    });
  }

  viewStaff(department: Department) {
    this.selectedDepartment = department;
    this.showStaffView = true;
  }

  backToDepartments() {
    this.showStaffView = false;
    this.selectedDepartment = undefined;
  }
}
