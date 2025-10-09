import { Component, inject, OnInit, Input, Output, EventEmitter, PLATFORM_ID, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffMemberService } from '../../../../services/staff-member';
import { DepartmentService } from '../../../../services/department';
import { StaffMember } from '../../../../model/staff-member';
import { Department } from '../../../../model/department';
import { RoleEntity } from '../../../../model/user';
import { TaskList } from '../../task/task-list/task-list';
import { ColDef, GridOptions, GridApi, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { ActionButtonsParams, AdditionalButton } from '../../../admin/action-buttons-cell/action-buttons-param';
import { ActionButtonsComponent } from '../../../admin/action-buttons-cell/action-buttons-cell';
import { AG_GRID_LOCALE } from '../../../admin/sharedTable';
import { MultiSelectFilterComponent } from '../../../admin/filters/multi-select-filter/multi-select-filter';
import { gridTheme as sharedGridTheme } from '../../../admin/sharedTable';
import type { ITextFilterParams } from 'ag-grid-community';

const TEXT_FILTER_CONFIG: ITextFilterParams = {
  filterOptions: ['contains', 'equals', 'notContains', 'startsWith'],
  maxNumConditions: 1
};

@Component({
  selector: 'app-staff-member-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskList, AgGridAngular],
  templateUrl: './staff-member-list.html',
  styleUrls: ['./staff-member-list.css']
})
export class StaffMemberList implements OnInit {
  private staffMemberService = inject(StaffMemberService);
  private departmentService = inject(DepartmentService);
  private platformId = inject(PLATFORM_ID);

  @Input() departmentId!: number;
  @Input() departmentName!: string;
  @Output() backToParent = new EventEmitter<void>();
  
  isBrowser: boolean = false;
  loading = false;
  error: string | null = null;
  
  // Fuente de datos
  staffMembers: StaffMember[] = [];
  rowData: StaffMember[] = [];
  
  // ag-grid
  private gridApi?: GridApi<StaffMember>;
  readonly gridTheme: typeof sharedGridTheme = sharedGridTheme;
  
  // Search functionality
  search = '';

  showTasksView = false;
  selectedStaffMember: StaffMember | null = null;

  @ViewChild('createDetails') private createDetails?: ElementRef<HTMLDetailsElement>;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      ModuleRegistry.registerModules([AllCommunityModule]);
    }
  }

  gridOptions: GridOptions<StaffMember> = {
    localeText: AG_GRID_LOCALE,
    rowSelection: 'single',
    getRowId: params => params.data.staff_id?.toString() || '',
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
        field: 'staff_id',
        minWidth: 60,
        maxWidth: 80
      },
      { 
        headerName: 'Nombre Completo',
        valueGetter: params => params.data?.user?.full_name || params.data?.name || 'N/A',
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        minWidth: 150,
        flex: 1
      },
      { 
        headerName: 'Email',
        valueGetter: params => params.data?.user?.email || 'N/A',
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        minWidth: 200
      },
      { 
        headerName: 'Teléfono',
        valueGetter: params => params.data?.user?.phone || 'N/A',
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        minWidth: 120
      },
      { 
        headerName: 'Estado',
        filter: MultiSelectFilterComponent,
        filterParams: {
          valueGetter: (row: StaffMember) => row.user?.enabled ? 'Activo' : 'Inactivo',
          title: 'Estados'
        },
        valueGetter: params => params.data?.user?.enabled ? 'Activo' : 'Inactivo',
        cellRenderer: (params: any) => {
          const isEnabled = params.data?.user?.enabled;
          const badgeClass = isEnabled ? 'bg-success' : 'bg-danger';
          const text = isEnabled ? 'Activo' : 'Inactivo';
          return `<span class="badge ${badgeClass}">${text}</span>`;
        },
        minWidth: 100,
        maxWidth: 120
      },
      {
        headerName: 'Acciones',
        filter: false,
        minWidth: 150,
        cellRenderer: ActionButtonsComponent<StaffMember>,
        cellRendererParams: {
          onEdit: null, // Hide edit button
          onDelete: null, // Hide delete button
          editLabel: '',
          deleteLabel: '',
          additionalButtons: [
            {
              label: 'Ver Tareas',
              action: (staffMember: StaffMember) => this.viewTasks(staffMember),
              class: 'btn-details'
            }
          ]
        },
        sortable: false
      }
    ]
  };

  ngOnInit() {
    if (this.departmentId) {
      this.loadStaffByDepartment(this.departmentId);
    }
  }

  loadStaffByDepartment(departmentId: number) {
    this.loading = true;
    this.error = null;
    
    this.staffMemberService.getStaffWithUsersByDepartment(departmentId).subscribe({
      next: (staffMembers) => {
        this.staffMembers = staffMembers;
        this.rowData = staffMembers;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error cargando miembros del staff';
        this.loading = false;
        console.error('Error loading staff members:', error);
      }
    });
  }

  // Search functionality
  onSearch(query: string) {
    this.search = query;
    this.gridApi?.setGridOption('quickFilterText', query);
  }

  hasRoles(staffMember: StaffMember): boolean {
    return !!(staffMember.user?.roles && staffMember.user.roles.length > 0);
  }

  getRoles(staffMember: StaffMember): (string | RoleEntity)[] {
    return staffMember.user?.roles || [];
  }

  getRoleName(role: string | RoleEntity): string {
    return typeof role === 'string' ? role : role.name;
  }

  viewTasks(staffMember: StaffMember) {
    this.selectedStaffMember = staffMember;
    this.showTasksView = true;
  }

  backToStaffList() {
    this.showTasksView = false;
    this.selectedStaffMember = null;
  }

  goBack() {
    this.backToParent.emit();
  }
}
