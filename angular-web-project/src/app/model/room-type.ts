export interface RoomType {
    room_type_id?: number;
    name: string;
    capacity: number;
    base_price: number;    // snake_case como en el back
    description?: string;
    image?: string;        // 1 url (portada)
  }
  