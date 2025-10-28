import { Component, inject, OnInit } from '@angular/core';
import { TaskList } from './task-list/task-list';
import { AuthService } from '../../../services/auth';
import { StaffMemberService } from '../../../services/staff-member';
import { CommonModule } from '@angular/common';
import { OperatorHotelResolver } from '../../../services/operator-hotel-resolver';
import { forkJoin, of, switchMap } from 'rxjs';
import { TaskService } from '../../../services/task';

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
  private hotelResolver = inject(OperatorHotelResolver);
  private taskService = inject(TaskService);

  currentUserStaffId: number | null = null;
  hotelTasks: any[] = [];
  loading = true;
  error: string | null = null;
  useHotelMode = false;

  ngOnInit() {
    this.loadTasksForOperator();
  }

  loadTasksForOperator() {
    const currentUser = this.authService.userSnapshot();
    
    if (!currentUser) {
      this.error = 'Usuario no autenticado';
      this.loading = false;
      return;
    }

    // First try to find staff member for the user
    this.staffMemberService.list().subscribe({
      next: (staffMembers) => {
        const userStaffMember = staffMembers.find(staff => staff.user_id === currentUser.user_id);
        
        if (userStaffMember) {
          // User has a staff record - use it
          this.currentUserStaffId = userStaffMember.staff_id;
          this.useHotelMode = false;
          this.loading = false;
        } else {
          // No staff record (e.g., op1-5 users) - load all tasks for their hotel
          console.log('No staff record found, loading all tasks for hotel');
          this.loadTasksForHotel();
        }
      },
      error: (error) => {
        this.error = 'Error cargando información del staff';
        this.loading = false;
        console.error('Error loading staff members:', error);
      }
    });
  }

  loadTasksForHotel() {
    this.hotelResolver.resolveHotelId().pipe(
      switchMap(hotelId => {
        if (!hotelId) {
          this.error = 'No se pudo determinar el hotel del operador';
          return of({ tasks: [], staffMembers: [] });
        }

        // Get all staff members for this hotel
        return this.staffMemberService.list().pipe(
          switchMap(allStaff => {
            const hotelStaff = allStaff.filter(s => s.hotel_id === hotelId);
            
            if (hotelStaff.length === 0) {
              return of({ tasks: [], staffMembers: hotelStaff });
            }

            // Get tasks for all staff members in this hotel
            const taskRequests = hotelStaff.map(staff => 
              this.taskService.getByStaffMember(staff.staff_id)
            );

            return forkJoin(taskRequests).pipe(
              switchMap(taskArrays => {
                // Flatten all tasks
                const allTasks = taskArrays.flat();
                return of({ tasks: allTasks, staffMembers: hotelStaff });
              })
            );
          })
        );
      })
    ).subscribe({
      next: ({ tasks, staffMembers }) => {
        this.hotelTasks = tasks;
        this.useHotelMode = true;
        this.loading = false;
        console.log(`Loaded ${tasks.length} tasks from ${staffMembers.length} staff members`);
      },
      error: (err) => {
        this.error = 'Error cargando tareas del hotel';
        this.loading = false;
        console.error('Error loading hotel tasks:', err);
      }
    });
  }
}
