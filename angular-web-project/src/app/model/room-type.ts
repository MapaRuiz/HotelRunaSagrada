import { Room } from "./room";
// Temporal
export interface RoomType {
  room_type_id: number;
  name: string;       
  capacity: number;
  base_price: number;
  description: string | null;
  image: string | null;
  //Rel
  rooms?: Room[];
}