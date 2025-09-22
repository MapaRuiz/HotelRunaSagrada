import { Hotel } from "./hotel";
import { Reservation } from "./reservation";
import { User } from "./user";

export interface Review {
  review_id: number;
  user_id: number;
  hotel_id: number;
  rating: number;
  comment?: string | null;
  created_at: string;
  // Rel
  user?: User;
  hotel?: Hotel;
  reservation?: Reservation | null;
}
