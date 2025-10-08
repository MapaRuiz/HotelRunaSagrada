import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Department } from '../../../../model/department';
import { Hotel } from '../../../../model/hotel';
import { DepartmentService } from '../../../../services/department';
import { HotelsService } from '../../../../services/hotels';
import { StaffMemberList } from '../../staff-member/staff-member-list/staff-member-list';


@Component({
  selector: 'app-department-table',
  imports: [CommonModule, FormsModule, StaffMemberList],
  templateUrl: './department-table.html',
  styleUrl: './department-table.css'
})
export class DepartmentTable implements OnInit {
  private departmentService = inject(DepartmentService);
  private hotelsService = inject(HotelsService);

  departments: Department[] = [];
  hotels: Hotel[] = [];
  loading = false;
  showForm = false;
  editingId: number | undefined;

  // Filtros
  hotelId: number | undefined;

  // Draft para crear/editar
  draft: Partial<Department> = {};
  draft_hotel_id: number | undefined;

  // Ver el staff
  showStaffView = false;
  selectedDepartment: Department | undefined;

  ngOnInit() {
    this.loadHotels();
    this.loadDepartments();
  }

  loadHotels() {
    this.hotelsService.list().subscribe({
      next: (hotels) => {
        this.hotels = hotels || [];
      },
      error: (error) => {
        console.error('Error loading hotels:', error);
      }
    });
  }

  loadDepartments() {
    this.loading = true;
    this.departmentService.list().subscribe({
      next: (departments) => {
        this.departments = departments || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.loading = false;
      }
    });
  }

  get filteredDepartments() {
    let filtered = [...this.departments];
    
    if (this.hotelId !== undefined) {
      filtered = filtered.filter(d => d.hotel_id === this.hotelId);
    }
    
    return filtered;
  }

  trackById(index: number, item: Department) {
    return item.department_id;
  }

  getHotelName(hotelId: number): string {
    const hotel = this.hotels.find(h => h.hotel_id === hotelId);
    return hotel ? hotel.name : `Hotel #${hotelId}`;
  }

  new() {
    this.editingId = undefined;
    this.draft = {};
    this.draft_hotel_id = undefined;
    this.showForm = true;
  }

  edit(department: Department) {
    this.editingId = department.department_id;
    this.draft = { ...department };
    this.draft_hotel_id = department.hotel_id;
    this.showForm = true;
  }

  save() {
    if (!this.draft_hotel_id || !this.draft.name?.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const payload: Partial<Department> = {
      name: this.draft.name.trim(),
      hotel_id: this.draft_hotel_id
    };

    const operation = this.editingId 
      ? this.departmentService.update(this.editingId, payload)
      : this.departmentService.create(payload);

    operation.subscribe({
      next: () => {
        this.loadDepartments();
        this.cancel();
      },
      error: (error) => {
        console.error('Error saving department:', error);
        alert('Error al guardar el departamento');
      }
    });
  }

  remove(department: Department) {
    if (!confirm(`¿Estás seguro de eliminar el departamento "${department.name}"?`)) {
      return;
    }

    this.departmentService.delete(department.department_id).subscribe({
      next: () => {
        this.loadDepartments();
      },
      error: (error) => {
        console.error('Error removing department:', error);
        alert('Error al eliminar el departamento');
      }
    });
  }

  cancel() {
    this.showForm = false;
    this.editingId = undefined;
    this.draft = {};
    this.draft_hotel_id = undefined;
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
