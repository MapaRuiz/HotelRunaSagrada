import { ReservationService } from "./reservation-service";
import { User } from "./user";

export interface ServiceRating {
  rating_id: number;
  res_service_id: number;
  user_id: number;
  score: number;
  comment?: string | null;
  created_at: string;
  // Rel
  reservation_service?: ReservationService;
  user?: User;
}