import { Hotel } from "./hotel";
import { StaffMember } from "./staff-member";

export interface Department {
  department_id: number;
  hotel_id: number;
  name: string;
  // Rel
  hotel?: Hotel;
  staff?: StaffMember[];
}