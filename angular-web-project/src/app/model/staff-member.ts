import { Department } from "./department";
import { Hotel } from "./hotel";
import { User } from "./user";
import { Task } from "./task";

export interface StaffMember {
  staff_id: number;
  user_id: number;
  hotel_id: number;
  department_id: number;
  name: string;
  // Rel
  user?: User;
  hotel?: Hotel;
  department?: Department;
  tasks?: Task[];
}