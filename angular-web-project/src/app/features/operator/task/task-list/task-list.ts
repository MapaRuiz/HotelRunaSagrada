import { Component, inject, OnInit, Input, Output, EventEmitter, PLATFORM_ID, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../../services/task';
import { RoomService } from '../../../../services/room';
import { Task, task_status, task_type } from '../../../../model/task';
import { forkJoin, of } from 'rxjs';
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
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './task-list.html',
  styleUrls: ['./task-list.css']
})
export class TaskList implements OnInit {
  private taskService = inject(TaskService);
  private roomService = inject(RoomService);
  private platformId = inject(PLATFORM_ID);

  @Input() staffId?: number;
  @Input() showAllTasks = false;
  @Output() backToParent = new EventEmitter<void>();
  
  isBrowser: boolean = false;
  loading = false;
  error: string | null = null;
  
  // Fuente de datos
  tasks: Task[] = [];
  rowData: Task[] = [];
  
  // ag-grid
  private gridApi?: GridApi<Task>;
  readonly gridTheme: typeof sharedGridTheme = sharedGridTheme;
  
  // Search functionality
  search = '';

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      ModuleRegistry.registerModules([AllCommunityModule]);
      // Configurar acciones globales para los botones
      (window as any).taskActions = {
        startTask: (taskId: number) => this.startTask(taskId),
        completeTask: (taskId: number) => this.completeTask(taskId),
        cancelTask: (taskId: number) => this.cancelTask(taskId)
      };
    }
  }

  gridOptions: GridOptions<Task> = {
    localeText: AG_GRID_LOCALE,
    rowSelection: 'single',
    getRowId: params => params.data.task_id?.toString() || '',
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
        field: 'task_id',
        minWidth: 60,
        maxWidth: 80
      },
      { 
        headerName: 'Tipo',
        filter: MultiSelectFilterComponent,
        filterParams: {
          valueGetter: (row: Task) => this.getTypeLabel(row.type),
          title: 'Tipos'
        },
        valueGetter: params => this.getTypeLabel(params.data?.type || 'TO-DO'),
        cellRenderer: (params: any) => {
          const type = params.data?.type;
          const badgeClass = this.getTypeBadgeClass(type);
          const text = this.getTypeLabel(type);
          return `<span class="badge ${badgeClass}">${text}</span>`;
        },
        minWidth: 120,
        maxWidth: 150
      },
      { 
        headerName: 'Estado',
        filter: MultiSelectFilterComponent,
        filterParams: {
          valueGetter: (row: Task) => this.getStatusLabel(row.status),
          title: 'Estados'
        },
        valueGetter: params => this.getStatusLabel(params.data?.status || 'PENDING'),
        cellRenderer: (params: any) => {
          const status = params.data?.status;
          const badgeClass = this.getStatusBadgeClass(status);
          const text = this.getStatusLabel(status);
          return `<span class="badge ${badgeClass}">${text}</span>`;
        },
        minWidth: 120,
        maxWidth: 150
      },
      { 
        headerName: 'Staff',
        valueGetter: params => {
          const staffName = params.data?.staff?.user?.full_name;
          const staffId = params.data?.staff_id;
          return staffName ? `${staffName} (${staffId})` : `Staff ${staffId || 'N/A'}`;
        },
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        minWidth: 150,
        flex: 1
      },
      { 
        headerName: 'Habitación',
        valueGetter: params => params.data?.room?.number ? `Hab. ${params.data.room.number}` : '-',
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        minWidth: 120,
        maxWidth: 150
      },
      { 
        headerName: 'Servicio',
        valueGetter: params => params.data?.res_service_id ? `Serv. ${params.data.res_service_id}` : '-',
        filter: 'agTextColumnFilter',
        filterParams: TEXT_FILTER_CONFIG,
        minWidth: 120,
        maxWidth: 150
      },
      { 
        headerName: 'Creada',
        valueGetter: params => this.formatDate(params.data?.created_at || ''),
        filter: 'agDateColumnFilter',
        minWidth: 140,
        maxWidth: 180
      },
      {
        headerName: 'Acciones',
        filter: false,
        minWidth: 200,
        cellRenderer: (params: any) => {
          const task = params.data;
          let buttonsHtml = '<div class="d-flex gap-1">';
          
          if (task.status === 'PENDING') {
            buttonsHtml += `<button class="btn btn-sm btn-outline-primary" onclick="window.taskActions.startTask(${task.task_id})" title="Iniciar tarea">Iniciar</button>`;
          }
          
          if (task.status === 'IN_PROGRESS') {
            buttonsHtml += `<button class="btn btn-sm btn-outline-success" onclick="window.taskActions.completeTask(${task.task_id})" title="Completar tarea">Completar</button>`;
          }
          
          if (task.status !== 'CANCELED' && task.status !== 'DONE') {
            buttonsHtml += `<button class="btn btn-sm btn-outline-danger" onclick="window.taskActions.cancelTask(${task.task_id})" title="Cancelar tarea">Cancelar</button>`;
          }
          
          buttonsHtml += '</div>';
          return buttonsHtml;
        },
        sortable: false
      }
    ]
  };

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.loading = true;
    this.error = null;
    
    const request = this.staffId 
      ? this.taskService.getByStaffMember(this.staffId)
      : this.taskService.list();

    request.subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.rowData = tasks;
        this.loadRoomDetails(tasks);
      },
      error: (error) => {
        this.error = 'Error cargando las tareas';
        this.loading = false;
        console.error('Error loading tasks:', error);
      }
    });
  }

  loadRoomDetails(tasks: Task[]) {
    const roomIds = Array.from(new Set(
      tasks
        .filter(task => task.room_id !== null && task.room_id !== undefined)
        .map(task => task.room_id!)
    ));

    if (roomIds.length === 0) {
      this.rowData = [...this.tasks];
      this.loading = false;
      return;
    }

    const roomRequests = roomIds.map(roomId => 
      this.roomService.getById(roomId)
    );

    forkJoin(roomRequests).subscribe({
      next: (rooms) => {
        const roomMap = new Map();
        rooms.forEach(room => {
          if (room.room_id) {
            roomMap.set(room.room_id, room);
          }
        });

        this.tasks.forEach(task => {
          if (task.room_id && roomMap.has(task.room_id)) {
            task.room = roomMap.get(task.room_id);
          }
        });

        this.rowData = [...this.tasks];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading room details:', error);
        this.rowData = [...this.tasks];
        this.loading = false;
      }
    });
  }



  getStatusBadgeClass(status: task_status): string {
    switch (status) {
      case 'PENDING': return 'bg-warning text-dark';
      case 'IN_PROGRESS': return 'bg-info text-dark';
      case 'DONE': return 'bg-success';
      case 'CANCELED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getStatusLabel(status: task_status): string {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'IN_PROGRESS': return 'En Progreso';
      case 'DONE': return 'Completada';
      case 'CANCELED': return 'Cancelada';
      default: return status;
    }
  }

  getTypeLabel(type: task_type): string {
    switch (type) {
      case 'DELIVERY': return 'Entrega';
      case 'GUIDING': return 'Guía';
      case 'TO-DO': return 'Por Hacer';
      default: return type;
    }
  }

  getTypeBadgeClass(type: task_type): string {
    switch (type) {
      case 'DELIVERY': return 'bg-primary';
      case 'GUIDING': return 'bg-info';
      case 'TO-DO': return 'bg-secondary';
      default: return 'bg-light text-dark';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }



  // Métodos para las acciones de las tareas (para los botones del cell renderer)
  startTask(taskId: number): void {
    const task = this.rowData.find(t => t.task_id === taskId);
    if (task && task.status === 'PENDING') {
      this.taskService.update(taskId, { status: 'IN_PROGRESS' }).subscribe({
        next: () => {
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error al iniciar la tarea:', error);
          alert('Error al iniciar la tarea');
        }
      });
    }
  }

  completeTask(taskId: number): void {
    const task = this.rowData.find(t => t.task_id === taskId);
    if (task && task.status === 'IN_PROGRESS') {
      this.taskService.update(taskId, { status: 'DONE' }).subscribe({
        next: () => {
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error al completar la tarea:', error);
          alert('Error al completar la tarea');
        }
      });
    }
  }

  cancelTask(taskId: number): void {
    const task = this.rowData.find(t => t.task_id === taskId);
    if (task && (task.status === 'PENDING' || task.status === 'IN_PROGRESS')) {
      if (confirm('¿Estás seguro de que quieres cancelar esta tarea?')) {
        this.taskService.update(taskId, { status: 'CANCELED' }).subscribe({
          next: () => {
            this.loadTasks();
          },
          error: (error) => {
            console.error('Error al cancelar la tarea:', error);
            alert('Error al cancelar la tarea');
          }
        });
      }
    }
  }

  onQuickFilterChanged(event: any): void {
    this.gridApi?.setGridOption('quickFilterText', event.target.value);
  }

  goBack() {
    this.backToParent.emit();
  }
}