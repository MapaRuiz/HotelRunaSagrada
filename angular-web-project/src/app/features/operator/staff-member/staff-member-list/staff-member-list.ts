import { Component, inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffMemberService } from '../../../../services/staff-member';
import { DepartmentService } from '../../../../services/department';
import { StaffMember } from '../../../../model/staff-member';
import { Department } from '../../../../model/department';
import { RoleEntity } from '../../../../model/user';
import { TaskList } from '../../task/task-list/task-list';

@Component({
  selector: 'app-staff-member-list',
  imports: [CommonModule, FormsModule, TaskList],
  templateUrl: './staff-member-list.html',
  styleUrl: './staff-member-list.css'
})
export class StaffMemberList implements OnInit {
  private staffMemberService = inject(StaffMemberService);
  private departmentService = inject(DepartmentService);

  @Input() departmentId!: number;
  @Input() departmentName!: string;
  @Output() backToParent = new EventEmitter<void>();
  
  staffMembers: StaffMember[] = [];
  loading = false;
  error: string | null = null;

  showTasksView = false;
  selectedStaffMember: StaffMember | null = null;

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
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error cargando miembros del staff';
        this.loading = false;
        console.error('Error loading staff members:', error);
      }
    });
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
