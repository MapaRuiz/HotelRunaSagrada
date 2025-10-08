import { Component, inject, OnInit } from '@angular/core';
import { TaskList } from './task-list/task-list';
import { AuthService } from '../../../services/auth';
import { StaffMemberService } from '../../../services/staff-member';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [TaskList, CommonModule],
  templateUrl: './task.html',
  styleUrl: './task.css'
})
export class TaskComponent implements OnInit {
  private authService = inject(AuthService);
  private staffMemberService = inject(StaffMemberService);

  currentUserStaffId: number | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit() {
    this.loadCurrentUserStaffId();
  }

  loadCurrentUserStaffId() {
    const currentUser = this.authService.userSnapshot();
    
    if (!currentUser) {
      this.error = 'Usuario no autenticado';
      this.loading = false;
      return;
    }

    // Buscar el staff member que corresponde al usuario actual
    this.staffMemberService.list().subscribe({
      next: (staffMembers) => {
        const userStaffMember = staffMembers.find(staff => staff.user_id === currentUser.user_id);
        
        if (userStaffMember) {
          this.currentUserStaffId = userStaffMember.staff_id;
        } else {
          this.error = 'No se encontró información de staff para el usuario actual';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error cargando información del staff';
        this.loading = false;
        console.error('Error loading staff members:', error);
      }
    });
  }
}
