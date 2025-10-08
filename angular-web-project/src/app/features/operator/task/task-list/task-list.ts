import { Component, inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../../services/task';
import { RoomService } from '../../../../services/room';
import { Task, task_status, task_type } from '../../../../model/task';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-task-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css'
})
export class TaskList implements OnInit {
  private taskService = inject(TaskService);
  private roomService = inject(RoomService);

  @Input() staffId?: number;
  @Input() showAllTasks = false;
  @Output() backToParent = new EventEmitter<void>();
  
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  loading = false;
  error: string | null = null;

  // Filtros
  selectedStatus: task_status | '' = '';
  selectedType: task_type | '' = '';

  // Status y tipos disponibles
  statusOptions: task_status[] = ['PENDING', 'IN_PROGRESS', 'DONE', 'CANCELED'];
  typeOptions: task_type[] = ['DELIVERY', 'GUIDING', 'TO-DO'];

  // Modal de confirmación
  showConfirmModal = false;
  confirmMessage = '';
  confirmButtonText = '';
  taskToUpdate: Task | null = null;
  newStatusToSet: task_status | null = null;

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
      this.applyFilters();
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

        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading room details:', error);
        this.applyFilters();
        this.loading = false;
      }
    });
  }

  applyFilters() {
    this.filteredTasks = this.tasks.filter(task => {
      const matchesStatus = !this.selectedStatus || task.status === this.selectedStatus;
      const matchesType = !this.selectedType || task.type === this.selectedType;
      return matchesStatus && matchesType;
    });
  }

  onFilterChange() {
    this.applyFilters();
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

  showConfirmation(task: Task, newStatus: task_status) {
    this.taskToUpdate = task;
    this.newStatusToSet = newStatus;
    
    switch (newStatus) {
      case 'IN_PROGRESS':
        this.confirmMessage = '¿Estás seguro de que quieres iniciar esta tarea?';
        this.confirmButtonText = 'Iniciar';
        break;
      case 'DONE':
        this.confirmMessage = '¿Estás seguro de que quieres marcar esta tarea como completada?';
        this.confirmButtonText = 'Completar';
        break;
      case 'CANCELED':
        this.confirmMessage = '¿Estás seguro de que quieres cancelar esta tarea? Esta acción no se puede deshacer.';
        this.confirmButtonText = 'Cancelar Tarea';
        break;
      default:
        this.confirmMessage = '¿Estás seguro de que quieres realizar esta acción?';
        this.confirmButtonText = 'Confirmar';
    }
    
    this.showConfirmModal = true;
  }

  confirmAction() {
    if (this.taskToUpdate && this.newStatusToSet) {
      this.updateTaskStatus(this.taskToUpdate, this.newStatusToSet);
    }
    this.cancelConfirmation();
  }

  cancelConfirmation() {
    this.showConfirmModal = false;
    this.taskToUpdate = null;
    this.newStatusToSet = null;
    this.confirmMessage = '';
    this.confirmButtonText = '';
  }

  getConfirmButtonClass(): string {
    switch (this.newStatusToSet) {
      case 'IN_PROGRESS':
        return 'btn-primary';
      case 'DONE':
        return 'btn-success';
      case 'CANCELED':
        return 'btn-danger';
      default:
        return 'btn-primary';
    }
  }

  getConfirmIconClass(): string {
    switch (this.newStatusToSet) {
      case 'IN_PROGRESS':
        return 'fa-play me-1';
      case 'DONE':
        return 'fa-check me-1';
      case 'CANCELED':
        return 'fa-times me-1';
      default:
        return 'fa-check me-1';
    }
  }

  updateTaskStatus(task: Task, newStatus: task_status) {
    this.taskService.update(task.task_id, { status: newStatus }).subscribe({
      next: () => {
        task.status = newStatus;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error updating task status:', error);
        alert('Error al actualizar el estado de la tarea');
      }
    });
  }

  goBack() {
    this.backToParent.emit();
  }
}