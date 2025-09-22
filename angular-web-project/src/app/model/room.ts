import { Hotel } from "./hotel";
import { Reservation } from "./reservation";
import { RoomLock } from "./room-lock";
import { RoomType } from "./room-type";

export type room_status = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | string;
export type cleaning_status = 'CLEAN' | 'DIRTY' | string;
// Temporal
export interface Room {
  room_id: number;
  hotel_id: number;
  room_type_id: number;
  number: string;      
  floor: number;
  status: room_status; 
  cleaning_status: cleaning_status;
  theme_name: string;
  images: string[];
  // Rel
  hotel?: Hotel;
  room_type?: RoomType;
  locks?: RoomLock[];
  reservations?: Reservation[];
  tasks?: Task[];
}