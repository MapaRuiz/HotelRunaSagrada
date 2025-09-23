import { Hotel } from "./hotel";
import { Payment } from "./payment";
import { ReservationService } from "./reservation-service";
import { Room } from "./room";
import { RoomLock } from "./room-lock";
import { User } from "./user";

export type reservation_status = 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'COMPLETED' | string;
export interface Reservation {
  reservation_id: number;
  user_id: number;
  hotel_id: number;
  room_id: number;
  check_in: string;           // date
  check_out: string;          // date
  status: reservation_status;
  // Rel
  user?: User;
  hotel?: Hotel;
  room?: Room;
  services?: ReservationService[]; 
  payment?: Payment | null;        
  room_locks?: RoomLock[];          

}