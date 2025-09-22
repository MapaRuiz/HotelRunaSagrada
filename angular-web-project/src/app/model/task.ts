import { ReservationService } from "./reservation-service";
import { Room } from "./room";
import { StaffMember } from "./staff-member";

export type task_type          = 'DELIVERY' | 'GUIDING' | 'TO-DO' | string;
export type task_status        = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELED' | string;
export interface Task {
  task_id: number;
  staff_id: number;
  room_id?: number | null;
  res_service_id?: number | null;
  type: task_type;
  status: task_status;
  created_at: string;
  // Rel
  staff?: StaffMember;
  room?: Room | null;
  reservation_service?: ReservationService | null;
}