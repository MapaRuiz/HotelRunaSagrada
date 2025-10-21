import { Hotel } from "./hotel";
import { Payment } from "./payment";
import { ReservationService } from "./reservation-service";
import { Room } from "./room";
import { User } from "./user";

export interface Reservation {
  reservation_id: number;
  user_id: number;
  hotel_id: number;
  room_id: number;
  check_in: string;   // ISO (yyyy-mm-dd)
  check_out: string;
  status: 'PENDING' | 'CONFIRMED' | 'FINISHED';
  created_at?: string;

  // Relaciones opcionales si el back expande objetos
  user?: User;
  hotel?: Hotel;
  room?: Room;
  payments?: Payment[];
  services?: ReservationService[];
}
