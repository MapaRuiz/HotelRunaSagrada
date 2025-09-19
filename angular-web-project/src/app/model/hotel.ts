import { Amenity } from './amenity';

export interface Hotel {
  hotel_id: number;
  name: string;
  latitude?: string;
  longitude?: string;
  description?: string;
  check_in_after?: string;   // "HH:mm"
  check_out_before?: string; // "HH:mm"
  image?: string;

  // Asociación opcional (cuando el back lo envía embebido)
  amenities?: Amenity[];
}
