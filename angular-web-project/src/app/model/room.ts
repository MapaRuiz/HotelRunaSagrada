import { RoomType } from './room-type';
export type ReservationStatus = 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE';
export type CleaningStatus    = 'CLEAN' | 'DIRTY';

export interface Room {
  room_id?: number;

  // Ids “planos” (opcionales en el draft del form)
  hotel_id?: number;
  room_type_id?: number;

  number: string;
  floor: number;

  // estados en UPPERCASE, snake_case en la clave
  res_status: ReservationStatus;
  cle_status: CleaningStatus;

  theme_name?: string;

  // galería (mismo patrón que Services)
  images: string[];

  // Asociaciones embebidas cuando el back las envía (opcionales)
  hotel?: import('./hotel').Hotel;
  room_type?: RoomType;
}

