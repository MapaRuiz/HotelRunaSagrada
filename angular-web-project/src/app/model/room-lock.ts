import { Reservation } from "./reservation";
import { Room } from "./room";

export interface RoomLock {
  room_id: number;
  lock_date: string;         
  reservation_id?: number | null;
  // Rel
  room?: Room;
  reservation?: Reservation | null;
}